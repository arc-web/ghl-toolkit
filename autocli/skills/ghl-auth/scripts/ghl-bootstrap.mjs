#!/usr/bin/env node
/**
 * Bootstrap GHL auth from clawd Chrome browser via CDP.
 * One-time setup — extracts refresh token from a live GHL session.
 * 
 * Prerequisites:
 *   - clawd Chrome running with CDP on port 18800
 *   - User logged into app.gohighlevel.com in that browser
 * 
 * Usage:
 *   node ghl-bootstrap.mjs              # Extract tokens from existing GHL tab
 *   node ghl-bootstrap.mjs --navigate   # Open GHL if no tab found, then extract
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let WebSocket;
try { WebSocket = (await import('ws')).default; } catch {
  try { WebSocket = require('/Users/jakeshore/.clawdbot/workspace/node_modules/ws'); } catch {
    console.error('ws module not found — install: npm i ws');
    process.exit(1);
  }
}

import { loadEnv, saveEnv } from './ghl-auth-lib.mjs';

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:18800';
const doNavigate = process.argv.includes('--navigate');

function cdpConnect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let cmdId = 0;
    const pending = new Map();

    function send(method, params = {}) {
      const id = ++cmdId;
      return new Promise((res, rej) => {
        const timer = setTimeout(() => { pending.delete(id); rej(new Error(`CDP timeout: ${method}`)); }, 15000);
        pending.set(id, { resolve: res, reject: rej, timer });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.on('open', () => resolve({ ws, send }));
    ws.on('error', reject);
    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        clearTimeout(p.timer);
        pending.delete(msg.id);
        // CDP nests result inside result
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    });
  });
}

async function main() {
  console.log(`Connecting to Chrome at ${CDP_URL}...`);
  const tabs = await (await fetch(`${CDP_URL}/json`)).json();

  // Find GHL tab
  let ghlTab = tabs.find(t => t.type === 'page' && t.url.includes('gohighlevel.com') && !t.url.includes('login'));

  if (!ghlTab && doNavigate) {
    // Navigate an existing tab or create new one
    const target = tabs.find(t => t.type === 'page') || await (await fetch(`${CDP_URL}/json/new?about:blank`, { method: 'PUT' })).json();
    const { ws, send } = await cdpConnect(target.webSocketDebuggerUrl);
    console.log('Navigating to GHL...');
    await send('Page.navigate', { url: 'https://app.gohighlevel.com/' });
    await new Promise(r => setTimeout(r, 10000));
    ws.close();
    // Re-fetch tabs
    const newTabs = await (await fetch(`${CDP_URL}/json`)).json();
    ghlTab = newTabs.find(t => t.type === 'page' && t.url.includes('gohighlevel.com') && !t.url.includes('login'));
  }

  if (!ghlTab) {
    console.error('No GHL tab found. Log into app.gohighlevel.com in clawd Chrome first.');
    console.error('Or run with --navigate to auto-open GHL.');
    process.exit(1);
  }

  console.log(`Found GHL tab: ${ghlTab.url.substring(0, 80)}`);
  const { ws, send } = await cdpConnect(ghlTab.webSocketDebuggerUrl);

  // Extract localStorage key 'a' (base64 auth blob)
  console.log('Extracting auth from localStorage...');
  const evalResult = await send('Runtime.evaluate', {
    expression: 'localStorage.getItem("a")',
    returnByValue: true,
  });

  const rawValue = evalResult.result?.value;
  if (!rawValue) {
    console.error('localStorage "a" is empty — page may need a fresh navigation.');
    console.error('Try: node ghl-bootstrap.mjs --navigate');
    ws.close();
    process.exit(1);
  }

  // Decode the auth blob
  const cleaned = rawValue.replace(/^"|"$/g, '');
  let authBlob;
  try {
    authBlob = JSON.parse(Buffer.from(cleaned, 'base64').toString('utf8'));
  } catch {
    // Maybe it's not base64-wrapped
    authBlob = JSON.parse(rawValue);
  }

  const refreshToken = authBlob.refreshToken;
  if (!refreshToken) {
    console.error('No refreshToken in auth blob. Keys found:', Object.keys(authBlob));
    ws.close();
    process.exit(1);
  }

  // Decode refresh token to check expiry
  const rPayload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
  const daysLeft = ((rPayload.exp * 1000 - Date.now()) / 86400000).toFixed(1);
  console.log(`Extracted refresh token — ${daysLeft} days remaining`);

  // Exchange for fresh JWT + rotated refresh token
  console.log('Refreshing tokens...');
  const refreshRes = await fetch('https://services.leadconnectorhq.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (refreshRes.status !== 200 && refreshRes.status !== 201) {
    const text = await refreshRes.text();
    console.error(`Refresh failed (${refreshRes.status}):`, text);
    ws.close();
    process.exit(1);
  }

  const { jwt, refreshJwt } = await refreshRes.json();

  // Save to .env
  const env = loadEnv();
  env.GHL_AUTH_TOKEN = jwt;
  env.GHL_REFRESH_TOKEN = refreshJwt;
  saveEnv(env);

  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
  const jwtMins = ((jwtPayload.exp * 1000 - Date.now()) / 60000).toFixed(1);
  const newRPayload = JSON.parse(Buffer.from(refreshJwt.split('.')[1], 'base64').toString());
  const newRDays = ((newRPayload.exp * 1000 - Date.now()) / 86400000).toFixed(1);

  console.log(`\nBootstrap complete!`);
  console.log(`  JWT: valid ${jwtMins} min`);
  console.log(`  Refresh token: valid ${newRDays} days`);
  console.log(`  Saved to .env`);

  // Verify with a quick API call
  const verifyRes = await fetch(
    `https://backend.leadconnectorhq.com/workflow/${env.GHL_LOCATION_ID || 'DZEpRd43MxUJKdtrev9t'}?limit=1`,
    { headers: { 'Authorization': `Bearer ${jwt}`, 'Version': '2021-07-28', 'channel': 'APP', 'source': 'WEB_USER' } }
  );
  console.log(`  API verify: ${verifyRes.status === 200 ? 'OK' : 'FAILED (' + verifyRes.status + ')'}`);

  ws.close();
}

main().catch(e => {
  console.error('Bootstrap failed:', e.message);
  process.exit(1);
});

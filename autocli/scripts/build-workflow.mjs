#!/usr/bin/env node
/**
 * GHL Workflow Builder Script
 * 
 * Usage:
 *   node build-workflow.mjs --name "My Workflow" --trigger form_submitted \
 *     --actions '[{"type":"sms","name":"Send SMS","attributes":{"body":"Hello!"}}]'
 * 
 *   node build-workflow.mjs --name "Tag Workflow" --trigger contact_tag \
 *     --trigger-data '{"tagName":"new-lead","tagEvent":"added"}' \
 *     --actions '[{"type":"add_contact_tag","name":"Add Tag","attributes":{"tags":["processed"]}}]'
 * 
 * Options:
 *   --name         Workflow name (required)
 *   --trigger      Trigger type: form_submitted, contact_tag, contact_created (optional)
 *   --trigger-data JSON trigger config (optional)
 *   --actions      JSON array of actions (required)
 *   --publish      Publish after creating (default: draft)
 *   --location     Location ID override
 *   --user         User ID override
 *   --cdp          CDP URL override (default: http://127.0.0.1:18800)
 *   --dry-run      Print what would be done without executing
 *   --json         Output final workflow as JSON
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let WebSocket;
try { WebSocket = (await import('ws')).default; } catch {
  try { WebSocket = require('/Users/jakeshore/.clawdbot/workspace/node_modules/ws'); } catch { WebSocket = null; }
}
import { randomUUID } from 'crypto';
import { parseArgs } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { values: args } = parseArgs({
  options: {
    name: { type: 'string' },
    trigger: { type: 'string' },
    'trigger-data': { type: 'string' },
    actions: { type: 'string' },
    publish: { type: 'boolean', default: false },
    location: { type: 'string', default: 'DZEpRd43MxUJKdtrev9t' },
    user: { type: 'string', default: '8Uy3ls0B517vLO2tSNva' },
    cdp: { type: 'string', default: 'http://127.0.0.1:18800' },
    'dry-run': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    delete: { type: 'string' },
    list: { type: 'boolean', default: false },
    get: { type: 'string' },
  },
  strict: false,
});

const LOCATION_ID = args.location;
const USER_ID = args.user;
const CDP_URL = args.cdp;
const BASE = 'https://backend.leadconnectorhq.com/workflow';
const ENV_PATH = resolve(__dirname, '..', '.env');

function loadEnv() {
  try {
    const env = {};
    for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const [k, ...v] = line.split('=');
      if (k && v.length) env[k.trim()] = v.join('=').trim();
    }
    return env;
  } catch { return {}; }
}

function saveEnv(env) {
  // Re-read and update in place to preserve comments
  let lines;
  try {
    lines = readFileSync(ENV_PATH, 'utf8').split('\n');
  } catch { lines = []; }
  const written = new Set();
  const output = lines.map(line => {
    const [k] = line.split('=');
    if (k && !k.startsWith('#') && env[k.trim()] !== undefined) {
      written.add(k.trim());
      return `${k.trim()}=${env[k.trim()]}`;
    }
    return line;
  });
  // Append any new keys
  for (const [k, v] of Object.entries(env)) {
    if (!written.has(k)) output.push(`${k}=${v}`);
  }
  writeFileSync(ENV_PATH, output.join('\n'));
}

async function getAuthFirebase() {
  const env = loadEnv();
  if (!env.GHL_FIREBASE_REFRESH_TOKEN || !env.GHL_FIREBASE_API_KEY || !env.GHL_API_KEY) {
    throw new Error('Missing Firebase env vars in .env — run initial setup with --cdp-setup');
  }

  // Refresh Firebase token
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${env.GHL_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(env.GHL_FIREBASE_REFRESH_TOKEN)}`,
    }
  );
  const data = await res.json();
  if (res.status !== 200) throw new Error(`Firebase refresh failed: ${JSON.stringify(data)}`);

  // Save rotated refresh token
  env.GHL_FIREBASE_REFRESH_TOKEN = data.refresh_token;
  saveEnv(env);

  return {
    headers: {
      'Authorization': `Bearer ${env.GHL_API_KEY}`,
      'token-id': data.id_token,
      'channel': 'APP',
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    }
  };
}

async function getAuthCDP() {
  if (!WebSocket) throw new Error('ws not available — install ws or use Firebase auth');
  const targets = await (await fetch(`${CDP_URL}/json`)).json();
  const ghlTab = targets.find(t => t.url.includes('app.gohighlevel.com'));
  if (!ghlTab) throw new Error('GHL tab not found — open GHL in clawd Chrome first');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ghlTab.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    ws.on('open', async () => {
      const send = (m, p = {}) => new Promise((res, rej) => {
        const mid = ++id;
        pending.set(mid, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id: mid, method: m, params: p }));
      });
      const cookies = await send('Network.getCookies', {
        urls: ['https://backend.leadconnectorhq.com', 'https://app.gohighlevel.com']
      });
      ws.close();
      const m_a = cookies.cookies.find(c => c.name === 'm_a')?.value;
      const a = cookies.cookies.find(c => c.name === 'a')?.value;
      resolve({
        headers: {
          'Authorization': `Bearer ${m_a}`,
          'Cookie': `m_a=${m_a}; a=${a}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        }
      });
    });
    ws.on('error', reject);
    ws.on('message', d => {
      const m = JSON.parse(d);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)[m.error ? 'reject' : 'resolve'](m.error ? new Error(JSON.stringify(m.error)) : m.result);
        pending.delete(m.id);
      }
    });
  });
}

async function getAuthJWT() {
  const env = loadEnv();
  if (!env.GHL_REFRESH_TOKEN) throw new Error('No GHL_REFRESH_TOKEN in .env');

  // Check if current JWT is still valid (>2 min left)
  if (env.GHL_AUTH_TOKEN) {
    try {
      const parts = env.GHL_AUTH_TOKEN.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.exp * 1000 - Date.now() > 120_000) {
        return {
          headers: {
            'Authorization': `Bearer ${env.GHL_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
            'channel': 'APP',
            'source': 'WEB_USER',
          }
        };
      }
    } catch {}
  }

  // Refresh the JWT using the 30-day refresh token
  const res = await fetch('https://services.leadconnectorhq.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: env.GHL_REFRESH_TOKEN }),
  });
  if (res.status !== 200 && res.status !== 201) {
    const text = await res.text();
    throw new Error(`JWT refresh failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  env.GHL_AUTH_TOKEN = data.jwt;
  env.GHL_REFRESH_TOKEN = data.refreshJwt;
  saveEnv(env);
  console.error('Refreshed GHL JWT (new token saved).');

  return {
    headers: {
      'Authorization': `Bearer ${data.jwt}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      'channel': 'APP',
      'source': 'WEB_USER',
    }
  };
}

async function getAuth() {
  // Try JWT refresh first (no browser needed), then Firebase, then CDP
  try {
    return await getAuthJWT();
  } catch (e) {
    console.error(`JWT auth failed (${e.message}), trying Firebase...`);
  }
  try {
    return await getAuthFirebase();
  } catch (e) {
    console.error(`Firebase auth failed (${e.message}), trying CDP...`);
    return await getAuthCDP();
  }
}

async function api(method, url, body, headers) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

function buildActionChain(rawActions) {
  return rawActions.map((a, i, arr) => ({
    id: a.id || randomUUID(),
    order: i,
    name: a.name,
    type: a.type,
    attributes: a.attributes || {},
    ...(i < arr.length - 1 ? {} : {}),
  })).map((a, i, arr) => ({
    ...a,
    ...(i < arr.length - 1 ? { next: arr[i + 1].id } : {}),
    ...(i > 0 ? { parentKey: arr[i - 1].id } : {}),
  }));
}

async function main() {
  const auth = await getAuth();
  const headers = auth.headers;

  // LIST mode
  if (args.list) {
    const r = await api('GET', `${BASE}/${LOCATION_ID}/list?type=workflow&limit=100&offset=0&sortBy=name&sortOrder=asc`, null, headers);
    const rows = r.data.rows || [];
    if (args.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    console.log(`${rows.length} workflows:`);
    rows.forEach(w => console.log(`  [${w.status?.padEnd(9)}] ${w.name} (${w._id})`));
    return;
  }

  // GET mode
  if (args.get) {
    const r = await api('GET', `${BASE}/${LOCATION_ID}/${args.get}`, null, headers);
    console.log(JSON.stringify(r.data, null, 2));
    return;
  }

  // DELETE mode
  if (args.delete) {
    const r = await api('DELETE', `${BASE}/${LOCATION_ID}/${args.delete}`, null, headers);
    console.log(r.status === 200 ? `Deleted ${args.delete}` : `Failed: ${r.status} ${JSON.stringify(r.data)}`);
    return;
  }

  // BUILD mode — requires --name and --actions
  if (!args.name) { console.error('--name required'); process.exit(1); }
  if (!args.actions) { console.error('--actions required (JSON array)'); process.exit(1); }

  const rawActions = JSON.parse(args.actions);
  const actions = buildActionChain(rawActions);
  const triggerType = args.trigger;
  const triggerData = args['trigger-data'] ? JSON.parse(args['trigger-data']) : {};

  if (args['dry-run']) {
    console.log('DRY RUN:');
    console.log(`  Name: ${args.name}`);
    console.log(`  Trigger: ${triggerType || 'none'}`);
    console.log(`  Actions: ${actions.length}`);
    actions.forEach((a, i) => console.log(`    ${i}: [${a.type}] ${a.name}`));
    return;
  }

  // Step 1: Create
  console.log(`Creating workflow "${args.name}"...`);
  const createR = await api('POST', `${BASE}/${LOCATION_ID}`, { name: args.name }, headers);
  if (createR.status !== 200) {
    console.error(`Create failed: ${createR.status}`, createR.data);
    process.exit(1);
  }
  const wfId = createR.data.id;
  console.log(`Created: ${wfId}`);

  // Step 2: Get fresh version
  const fresh = (await api('GET', `${BASE}/${LOCATION_ID}/${wfId}`, null, headers)).data;

  // Step 3: Add actions
  console.log(`Adding ${actions.length} action(s)...`);
  const updateBody = {
    name: args.name,
    isRestoreRequest: true,
    status: 'draft',
    version: fresh.version,
    dataVersion: fresh.dataVersion,
    timezone: fresh.timezone || 'account',
    stopOnResponse: false,
    allowMultiple: false,
    allowMultipleOpportunity: false,
    autoMarkAsRead: false,
    removeContactFromLastStep: true,
    workflowData: { templates: actions },
    updatedBy: USER_ID,
    oldTriggers: [],
    newTriggers: [],
    triggersChanged: false,
    modifiedSteps: [],
    deletedSteps: [],
    createdSteps: actions.map(a => a.id),
    meta: {},
  };

  const actionR = await api('PUT', `${BASE}/${LOCATION_ID}/${wfId}`, updateBody, headers);
  if (actionR.status !== 200) {
    console.error(`Action update failed: ${actionR.status}`, actionR.data);
    process.exit(1);
  }
  console.log('Actions added.');

  // Step 4: Add trigger (if specified)
  if (triggerType) {
    console.log(`Adding trigger: ${triggerType}...`);
    const afterActions = (await api('GET', `${BASE}/${LOCATION_ID}/${wfId}`, null, headers)).data;

    const trigger = {
      id: randomUUID(),
      type: triggerType,
      name: triggerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      workflowId: wfId,
      data: {
        type: triggerType,
        targetActionId: actions[0].id,
        ...triggerData,
      },
    };

    const trigBody = {
      ...updateBody,
      version: afterActions.version,
      workflowData: afterActions.workflowData,
      oldTriggers: [],
      newTriggers: [trigger],
      triggersChanged: true,
      createdSteps: [],
    };

    const trigR = await api('PUT', `${BASE}/${LOCATION_ID}/${wfId}`, trigBody, headers);
    if (trigR.status !== 200) {
      console.error(`Trigger failed: ${trigR.status}`, trigR.data);
    } else {
      console.log('Trigger added.');
    }
  }

  // Step 5: Publish (if requested)
  if (args.publish) {
    console.log('Publishing...');
    const latest = (await api('GET', `${BASE}/${LOCATION_ID}/${wfId}`, null, headers)).data;
    const pubBody = { ...updateBody, version: latest.version, workflowData: latest.workflowData, status: 'published', triggersChanged: false, createdSteps: [] };
    const pubR = await api('PUT', `${BASE}/${LOCATION_ID}/${wfId}`, pubBody, headers);
    console.log(pubR.status === 200 ? 'Published!' : `Publish failed: ${pubR.status}`);
  }

  // Final output
  const final = (await api('GET', `${BASE}/${LOCATION_ID}/${wfId}`, null, headers)).data;

  if (args.json) {
    console.log(JSON.stringify(final, null, 2));
  } else {
    console.log(`\n=== Workflow Created ===`);
    console.log(`Name:     ${final.name}`);
    console.log(`ID:       ${final._id}`);
    console.log(`Status:   ${final.status || 'draft'}`);
    console.log(`Version:  ${final.version}`);
    console.log(`Actions:  ${final.workflowData?.templates?.length || 0}`);
    (final.workflowData?.templates || []).forEach((t, i) =>
      console.log(`  ${i}: [${t.type}] ${t.name}`)
    );
    console.log(`Trigger:  ${final.triggersFilePath ? 'yes' : 'none'}`);
    console.log(`URL:      https://app.gohighlevel.com/v2/location/${LOCATION_ID}/automation/workflow/${wfId}`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });

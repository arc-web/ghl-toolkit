#!/usr/bin/env node
/**
 * GHL Auth Library — importable getAuth() for all GHL skills.
 * 
 * Usage:
 *   import { getAuth, loadEnv, saveEnv } from '../../ghl-auth/scripts/ghl-auth-lib.mjs';
 *   const { headers } = await getAuth();
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '..', 'ghl-workflow-builder', '.env');

export function loadEnv(envPath = ENV_PATH) {
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=][^=]*)=(.*)/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

export function saveEnv(env, envPath = ENV_PATH) {
  let lines;
  try { lines = readFileSync(envPath, 'utf8').split('\n'); } catch { lines = []; }
  const written = new Set();
  const output = lines.map(line => {
    const match = line.match(/^([^#=][^=]*)=/);
    if (match && env[match[1].trim()] !== undefined) {
      written.add(match[1].trim());
      return `${match[1].trim()}=${env[match[1].trim()]}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(env)) {
    if (!written.has(k)) output.push(`${k}=${v}`);
  }
  writeFileSync(envPath, output.join('\n'));
}

/**
 * Get authenticated headers for GHL internal APIs.
 * Reuses current JWT if >2 min remaining, otherwise refreshes.
 * Saves rotated tokens to .env automatically.
 * 
 * @returns {{ headers: Record<string, string> }}
 */
export async function getAuth() {
  const env = loadEnv();

  // Check if current JWT is still valid (>2 min left)
  if (env.GHL_AUTH_TOKEN) {
    try {
      const payload = JSON.parse(
        Buffer.from(env.GHL_AUTH_TOKEN.split('.')[1], 'base64').toString()
      );
      if (payload.exp * 1000 - Date.now() > 120_000) {
        return { headers: buildHeaders(env.GHL_AUTH_TOKEN), env };
      }
    } catch {}
  }

  // Refresh
  if (!env.GHL_REFRESH_TOKEN) {
    throw new Error(
      'No GHL_REFRESH_TOKEN in .env — run: node skills/ghl-auth/scripts/ghl-bootstrap.mjs'
    );
  }

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

  return { headers: buildHeaders(data.jwt), env };
}

function buildHeaders(jwt) {
  return {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
    'channel': 'APP',
    'source': 'WEB_USER',
  };
}

// CLI: run directly to test auth
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { headers, env } = await getAuth();
  const payload = JSON.parse(Buffer.from(headers.Authorization.split(' ')[1].split('.')[1], 'base64').toString());
  const minsLeft = ((payload.exp * 1000 - Date.now()) / 60000).toFixed(1);
  console.log(`Auth OK — JWT expires in ${minsLeft} min`);
  console.log(`Location: ${env.GHL_LOCATION_ID}`);
  console.log(`User: ${env.GHL_USER_ID}`);
  console.log(`Company: ${env.GHL_COMPANY_ID}`);
}

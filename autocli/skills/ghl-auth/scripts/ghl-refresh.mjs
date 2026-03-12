#!/usr/bin/env node
/**
 * Refresh GHL JWT tokens. No browser needed.
 * 
 * Usage:
 *   node ghl-refresh.mjs           # Refresh and update .env
 *   node ghl-refresh.mjs --check   # Check current token expiry without refreshing
 *   node ghl-refresh.mjs --force   # Force refresh even if current JWT is valid
 */

import { getAuth, loadEnv } from './ghl-auth-lib.mjs';

const args = process.argv.slice(2);

if (args.includes('--check')) {
  const env = loadEnv();
  if (!env.GHL_AUTH_TOKEN) {
    console.log('No JWT found in .env');
    process.exit(1);
  }
  try {
    const payload = JSON.parse(Buffer.from(env.GHL_AUTH_TOKEN.split('.')[1], 'base64').toString());
    const minsLeft = ((payload.exp * 1000 - Date.now()) / 60000).toFixed(1);
    console.log(`JWT: ${minsLeft} min remaining`);
    if (env.GHL_REFRESH_TOKEN) {
      const rPayload = JSON.parse(Buffer.from(env.GHL_REFRESH_TOKEN.split('.')[1], 'base64').toString());
      const rDaysLeft = ((rPayload.exp * 1000 - Date.now()) / 86400000).toFixed(1);
      console.log(`Refresh token: ${rDaysLeft} days remaining`);
    }
  } catch (e) {
    console.error('Token decode error:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (args.includes('--force')) {
  // Set JWT to empty to force a refresh
  const { loadEnv: l, saveEnv: s } = await import('./ghl-auth-lib.mjs');
  const env = l();
  env.GHL_AUTH_TOKEN = '';
  s(env);
}

try {
  const { headers, env } = await getAuth();
  const payload = JSON.parse(Buffer.from(headers.Authorization.split(' ')[1].split('.')[1], 'base64').toString());
  const minsLeft = ((payload.exp * 1000 - Date.now()) / 60000).toFixed(1);
  console.log(`OK — JWT valid for ${minsLeft} min`);

  if (env.GHL_REFRESH_TOKEN) {
    const rPayload = JSON.parse(Buffer.from(env.GHL_REFRESH_TOKEN.split('.')[1], 'base64').toString());
    const rDaysLeft = ((rPayload.exp * 1000 - Date.now()) / 86400000).toFixed(1);
    console.log(`Refresh token valid for ${rDaysLeft} days`);
  }
} catch (e) {
  console.error('Refresh failed:', e.message);
  console.error('Run bootstrap: node skills/ghl-auth/scripts/ghl-bootstrap.mjs');
  process.exit(1);
}

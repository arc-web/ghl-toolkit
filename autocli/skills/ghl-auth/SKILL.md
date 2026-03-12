---
name: ghl-auth
description: Authenticate to GoHighLevel's hidden internal API using the v2 JWT refresh flow. Use when any GHL skill needs auth tokens, when GHL tokens expire, when setting up GHL access for the first time (bootstrap from Chrome), or when refreshing/rotating GHL credentials. Covers initial token extraction from Chrome via CDP, headless JWT refresh (no browser), auto-rotation of 30-day refresh tokens, and a reusable getAuth() pattern for all GHL skills.
---

# GHL Auth — v2 JWT Refresh Flow

Headless authentication to GHL's internal APIs (`backend.leadconnectorhq.com`, `services.leadconnectorhq.com`). Once bootstrapped, **no browser is ever needed again** — tokens auto-rotate on each refresh.

## Token Anatomy

| Token | Header | Lifetime | Source |
|-------|--------|----------|--------|
| `jwt` (access) | `Authorization: Bearer <jwt>` | **1 hour** | `/auth/refresh` response |
| `refreshJwt` | Body of refresh request | **30 days** | `/auth/refresh` response (rotates!) |
| `m_a` cookie | Legacy — same as jwt | 1 hour | Browser cookie (bootstrap only) |

## Env File

All GHL skills share: `skills/ghl-workflow-builder/.env`

```
GHL_AUTH_TOKEN=<jwt>
GHL_REFRESH_TOKEN=<refreshJwt>
GHL_LOCATION_ID=DZEpRd43MxUJKdtrev9t
GHL_LOCATION_ID_2=I20DR2OAjuPy9ffJlTIP
GHL_USER_ID=8Uy3ls0B517vLO2tSNva
GHL_COMPANY_ID=D7tkK8E9XMoQeEQVHvu1
GHL_FIREBASE_API_KEY=AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE
```

## Headless Refresh (Primary — No Browser)

```bash
node skills/ghl-auth/scripts/ghl-refresh.mjs
```

Or in code:

```javascript
const res = await fetch('https://services.leadconnectorhq.com/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken: GHL_REFRESH_TOKEN }),
});
// Status 201 on success
const { jwt, refreshJwt } = await res.json();
// CRITICAL: Save refreshJwt — it rotates on every call
// Old refreshJwt is invalidated after use
```

### Request Headers for GHL Internal APIs

```javascript
const headers = {
  'Authorization': `Bearer ${jwt}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
  'channel': 'APP',
  'source': 'WEB_USER',
};
```

Some endpoints also need `'location': GHL_LOCATION_ID` header.

## Bootstrap (One-Time — Requires Chrome)

Only needed when `GHL_REFRESH_TOKEN` is missing/expired. Extracts tokens from a live GHL session in the clawd Chrome browser (CDP on port 18800).

```bash
node skills/ghl-auth/scripts/ghl-bootstrap.mjs
```

### Bootstrap Flow

1. Connect to clawd Chrome via CDP (`http://127.0.0.1:18800/json`)
2. Find a tab with `app.gohighlevel.com` loaded (navigate to it if needed)
3. Extract localStorage key `a` (base64-encoded auth blob)
4. Decode → parse JSON → extract `refreshToken` (30-day GHL v2 refresh JWT)
5. Call `/auth/refresh` with the extracted token to get fresh `jwt` + `refreshJwt`
6. Save both to `.env`

If no GHL tab exists, the script navigates to `https://app.gohighlevel.com/` using existing cookies. The user must have logged in at least once in the clawd Chrome profile.

### CDP Notes

- CDP `Runtime.evaluate` returns values at `msg.result.result.value` (double-nested `result`)
- Always use `returnByValue: true` in evaluate params
- GHL stores auth in localStorage key `a` as a base64-encoded JSON blob
- The blob contains: `authToken` (jwt), `refreshToken` (30-day), `firebaseToken`, user metadata

## Script Reference

| Script | Purpose | Browser? |
|--------|---------|----------|
| `scripts/ghl-refresh.mjs` | Refresh JWT, rotate refresh token, update .env | No |
| `scripts/ghl-bootstrap.mjs` | Extract initial tokens from Chrome, save to .env | Yes (one-time) |
| `scripts/ghl-auth-lib.mjs` | Importable `getAuth()` for other scripts | No |

## Integration Pattern

Any GHL skill script should import auth like this:

```javascript
import { getAuth } from '../../ghl-auth/scripts/ghl-auth-lib.mjs';
const { headers } = await getAuth();
// headers includes Authorization, Content-Type, Version, channel, source
```

`getAuth()` checks JWT expiry (>2 min remaining = reuse, else refresh). Automatically saves rotated tokens to `.env`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `JWT refresh failed (401)` | Refresh token expired (30 days). Re-bootstrap from Chrome |
| `JWT refresh failed (400)` | Refresh token already used/rotated. Check .env has latest |
| Bootstrap: `No GHL tab` | Open `app.gohighlevel.com` in clawd Chrome, or let script navigate |
| Bootstrap: `localStorage empty` | Page JS context dead — navigate to a fresh GHL URL first |
| `INVALID_REFRESH_TOKEN` on Firebase | Firebase auth is deprecated — use v2 JWT refresh instead |

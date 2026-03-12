# GHL Hidden Workflow API — CRACKED March 10, 2026

## FULL CRUD Working — Auth Pattern Discovered

### Auth: `m_a` cookie as Bearer token + Cookie header

The `m_a` cookie is an RS256 JWT set by GHL's login flow. It's the session token for the internal API.

```
Authorization: Bearer {m_a_cookie_value}
Cookie: m_a={m_a_cookie_value}; a={a_cookie_value}
Content-Type: application/json
Version: 2021-07-28
```

### How to extract `m_a` from live browser (CDP):
```javascript
// Via Chrome DevTools Protocol on GHL tab
const cookies = await cdp.send('Network.getCookies', {
  urls: ['https://backend.leadconnectorhq.com', 'https://app.gohighlevel.com']
});
const m_a = cookies.cookies.find(c => c.name === 'm_a').value;
```

---

## Working Endpoints

**Base URL:** `https://backend.leadconnectorhq.com/workflow`

### LIST Workflows
```
GET /workflow/{locationId}/list?parentId=root&limit=10&offset=0&sortBy=name&sortOrder=asc&includeCustomObjects=true&includeObjectiveBuilder=true
```
Returns: `{ rows: [{ _id, name, type, status, locationId, ... }], count: N }`

### CREATE Workflow
```
POST /workflow/{locationId}
Body: { "name": "My Workflow" }
```
Returns: `{ "id": "uuid" }`

### GET Single Workflow (full data with actions/triggers)
```
GET /workflow/{locationId}/{workflowId}
```
Returns full workflow object with version, workflowData, templates, triggers, etc.

### UPDATE Workflow
```
PUT /workflow/{locationId}/{workflowId}
Body: { full workflow object with changes }
```
Note: 422 if body shape is wrong — needs version, name, status, workflowData, etc.

### DELETE Workflow
```
DELETE /workflow/{locationId}/{workflowId}
```
Returns 200 on success.

### Other Discovered Endpoints
```
PUT  /workflow/rename-workflow/{workflowId}        — rename (needs different auth?)
POST /workflow/{workflowId}/copy-workflow           — copy to sub-account
POST /workflow/{workflowId}/start-workflow          — start/trigger
GET  /workflow/{workflowId}/versions                — version history
GET  /workflow/{locationId}/workflow-rendering/{id}  — rendered workflow view
POST /workflow/{locationId}/run-single-action       — test single action
POST /workflow/{locationId}/blacklist/workflow/{id}  — blacklist
GET  /workflow/{locationId}/workflow-ai/settings     — AI workflow settings
GET  /workflow/{locationId}/error-notification/count — error counts
POST /workflow/{locationId}/rate-limiting/bypass     — rate limit bypass
```

### Also Working: Public API with Session JWT
```
GET https://services.leadconnectorhq.com/workflows/?locationId={locationId}
Headers:
  Authorization: Bearer {session_JWT}  (from Vuex store, NOT m_a)
  Version: 2021-07-28
  channel: APP
  source: WEB_USER
```
This returns the public API format (id, name, status, version, dates). Read-only.

---

## Auth Tokens Summary

| Token | Source | Domain | Capabilities |
|-------|--------|--------|-------------|
| `m_a` cookie (RS256 JWT) | GHL login cookie | `backend.leadconnectorhq.com/workflow` | Full CRUD |
| Session JWT (HS256) | Vuex `auth.user.jwt` | `services.leadconnectorhq.com` + `backend.leadconnectorhq.com` | List only |
| Firebase token | Vuex `auth.user.firebaseToken` | Firebase auth | Not needed for workflow API |
| API key | Vuex `auth.user.apiKey` / `a` cookie | OAuth2 token endpoints | OAuth2 flows only |

### Cookie `a` (base64-decoded):
```json
{"apiKey":"8328c329-1f56-42d3-b173-16f077c024d5","userId":"8Uy3ls0B517vLO2tSNva","companyId":"D7tkK8E9XMoQeEQVHvu1"}
```

### JWT expiry: ~60 min from login/refresh
The `m_a` token refreshes when you reload the GHL page.

---

## Architecture

GHL's workflow module is a separate **microfrontend** loaded in an iframe:
- **Iframe URL:** `https://client-app-automation-workflows.leadconnectorhq.com/v2/location/{locationId}/automation/workflows`
- **Framework:** Vue 3 + Pinia stores + axios
- **Axios baseURL:** `https://backend.leadconnectorhq.com/workflow`
- **Auth:** Browser cookie jar sends `m_a` automatically with requests
- **Bundle:** `assets/index-GY7F9vPl.js` (8.3MB) + separate chunks for create, configs, etc.
- **Pinia stores:** workflowData, workflowModals, workflow-selection, workflow-list-tabs, workflowListSearch, engagementScore

### GHL Internal API Domains

| Domain | Purpose |
|---|---|
| `backend.leadconnectorhq.com/workflow` | **Workflow CRUD** — uses m_a cookie |
| `backend.leadconnectorhq.com` | General backend (non-workflow) — uses session JWT |
| `services.leadconnectorhq.com` | Public API — uses OAuth OR session JWT with channel/source headers |
| `client-app-automation-workflows.leadconnectorhq.com` | Iframe microfrontend (serves the Vue app, NOT the API) |

### What This Means for Our MCP Server

Our MCP server at `/Users/jakeshore/projects/The-Complete-GHL-MCP` currently uses OAuth API. To add workflow CRUD:

1. **Extract `m_a` token from live GHL session** (via CDP on clawd browser)
2. **Add internal API client** using `m_a` Bearer auth to `backend.leadconnectorhq.com/workflow`
3. **New MCP tools:** `create_workflow`, `update_workflow`, `delete_workflow`, `get_workflow_details`
4. **Token refresh:** Monitor expiry, prompt user to refresh GHL page when needed

### Location & Company Info

- Location ID: `DZEpRd43MxUJKdtrev9t` (Real Connect)
- Company ID: `D7tkK8E9XMoQeEQVHvu1`
- User ID: `8Uy3ls0B517vLO2tSNva`

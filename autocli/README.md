# GoHighLevel AutoCLI

> Programmatically create, read, update, and delete GoHighLevel workflows — including triggers and actions — via GHL's hidden internal API. **No browser required.**

Built by reverse-engineering the GHL workflow iframe microfrontend. The public GHL API can only _list_ workflows. This CLI can **build them from scratch**.

---

## Features

- ✅ Full CRUD — create, read, update, delete workflows
- ✅ Add triggers (form_submission, contact_tag, contact_created, and 30+ more)
- ✅ Add actions (SMS, email, wait, if/else, webhooks, tags, and 59 action types total)
- ✅ **v2 JWT auth** — headless, no browser, 30-day auto-rotating refresh tokens
- ✅ Legacy Firebase auth fallback (for older setups)
- ✅ CDP bootstrap from Chrome (one-time token extraction)
- ✅ List, inspect, and delete workflows from the CLI

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Bootstrap credentials (one-time)

The easiest way to get started — extracts tokens from a live GHL session in Chrome:

```bash
# Make sure you're logged into app.gohighlevel.com in Chrome (CDP on port 18800)
node skills/ghl-auth/scripts/ghl-bootstrap.mjs --navigate
```

This will:
1. Connect to Chrome via CDP
2. Extract the auth blob from GHL's localStorage
3. Exchange it for a fresh JWT + 30-day refresh token
4. Save everything to `.env`

After bootstrap, **no browser is ever needed again**. Tokens auto-rotate on each use.

#### Manual setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Key fields:
```env
GHL_REFRESH_TOKEN=your-30-day-refresh-jwt    # Primary auth (v2 JWT)
GHL_AUTH_TOKEN=your-1-hour-jwt               # Auto-refreshed
GHL_LOCATION_ID=your-location-id
GHL_USER_ID=your-user-id
GHL_COMPANY_ID=your-company-id
```

### 3. Verify auth

```bash
node skills/ghl-auth/scripts/ghl-refresh.mjs --check
# → JWT: 45.2 min remaining
# → Refresh token: 29.8 days remaining
```

---

## Auth System

### v2 JWT Refresh (Preferred)

The CLI uses GHL's internal v2 JWT auth at `services.leadconnectorhq.com/auth/refresh`:

```
POST /auth/refresh
Body: { "refreshToken": "<30-day-jwt>" }
→ { "jwt": "<1-hour-token>", "refreshJwt": "<new-30-day-token>" }
```

- **JWT** (1 hour) — used as `Authorization: Bearer` for all API calls
- **Refresh JWT** (30 days) — rotates on every use, auto-saved to `.env`
- Headers: `Authorization`, `Version: 2021-07-28`, `channel: APP`, `source: WEB_USER`

### Auth Scripts

| Script | Purpose | Browser? |
|--------|---------|----------|
| `skills/ghl-auth/scripts/ghl-bootstrap.mjs` | Extract initial tokens from Chrome | Yes (one-time) |
| `skills/ghl-auth/scripts/ghl-refresh.mjs` | Refresh/check tokens | No |
| `skills/ghl-auth/scripts/ghl-auth-lib.mjs` | Importable `getAuth()` for scripts | No |

### Legacy Firebase Auth

Still supported as fallback. Uses `securetoken.googleapis.com` with a Firebase refresh token. Set `GHL_FIREBASE_API_KEY` and `GHL_FIREBASE_REFRESH_TOKEN` in `.env`.

---

## Usage

### List workflows
```bash
node scripts/build-workflow.mjs --list
```

### Create a workflow
```bash
node scripts/build-workflow.mjs \
  --name "New Lead Follow-up" \
  --trigger form_submission \
  --actions '[
    {"type":"wait","name":"Wait 5 min","attributes":{"type":"time","startAfter":{"type":"minutes","value":5,"when":"after"}}},
    {"type":"sms","name":"Send SMS","attributes":{"body":"Hey {{contact.first_name}}, thanks for reaching out!","attachments":[]}},
    {"type":"add_contact_tag","name":"Tag Lead","attributes":{"tags":["new-lead"]}}
  ]'
```

### With a tag trigger
```bash
node scripts/build-workflow.mjs \
  --name "Tag Workflow" \
  --trigger contact_tag \
  --trigger-data '{"tagName":"hot-lead","tagEvent":"added"}' \
  --actions '[{"type":"sms","name":"SMS","attributes":{"body":"You got a hot lead: {{contact.name}}","attachments":[]}}]'
```

### Publish immediately
```bash
node scripts/build-workflow.mjs --name "..." --trigger ... --actions '...' --publish
```

### Get workflow details (JSON)
```bash
node scripts/build-workflow.mjs --get <workflow-id> --json
```

### Delete a workflow
```bash
node scripts/build-workflow.mjs --delete <workflow-id>
```

---

## CLI Options

| Flag | Description |
|------|-------------|
| `--name` | Workflow name (required for build) |
| `--trigger` | Trigger type (e.g. `form_submission`, `contact_tag`) |
| `--trigger-data` | JSON trigger config (e.g. `{"tagName":"x","tagEvent":"added"}`) |
| `--actions` | JSON array of action objects (required for build) |
| `--publish` | Publish workflow after creating (default: draft) |
| `--list` | List all workflows |
| `--get <id>` | Get workflow details |
| `--delete <id>` | Delete a workflow |
| `--json` | Output as JSON |
| `--dry-run` | Preview without executing |
| `--location <id>` | Override location ID |

---

## Action Types (59 total)

| Category | Types |
|----------|-------|
| **Messaging** | `sms`, `email`, `internal_notification`, `call`, `voicemail`, `messenger`, `instagram_dm`, `whatsapp`, `gmb`, `slack_message`, `review_request`, `respond_on_comment`, `manual_action`, `conversation_ai`, `send_live_chat_message` |
| **Contact** | `add_contact_tag`, `remove_contact_tag`, `update_contact_field`, `create_update_contact`, `assign_user`, `remove_assigned_user`, `dnd_contact`, `add_notes`, `copy_contact_to_subaccount` |
| **Workflow** | `wait`, `if_else`, `goto`, `add_to_workflow`, `remove_from_workflow`, `remove_from_all_workflows`, `drip`, `workflow_goal`, `workflow_split` |
| **Integrations** | `webhook`, `custom_webhook`, `google_sheets`, `google_analytics`, `google_adword`, `facebook_add_to_custom_audience`, `facebook_conversion_api` |
| **CRM** | `create_opportunity`, `remove_opportunity`, `update_appointment_status`, `event_start_date`, `edit_conversation` |
| **AI** | `ai_agent`, `chatgpt`, `add_appointment_booking_ai_bot`, `send_to_eliza`, `custom_code` |
| **Formatters** | `datetime_formatter`, `number_formatter`, `text_formatter`, `math_operation`, `array_functions` |
| **Memberships** | `membership_grant_offer`, `membership_revoke_offer` |
| **IVR/Phone** | `ivr_say`, `ivr_connect_call`, `ivr_hangup`, `ivr_collect_voicemail` |
| **Payments** | `stripe_one_time_charge` |

Full schemas with examples in [`references/triggers-and-actions.md`](references/triggers-and-actions.md).

## Trigger Types (30+)

`form_submission`, `contact_tag`, `contact_created`, `customer_reply`, `contact_changed`, `appointment`, `two_step_form_submission`, `survey_submission`, `inbound_webhook`, `payment_received`, `order_submission`, `offer_access_granted`, `trigger_link`, `tik_tok_form_submitted`, `user_log_in`, `lesson_started`, `lesson_completed`, `product_access_granted`, `subscription`, `birthday_reminder`, `opportunity_created`, `opportunity_changed`, `invoice_paid`, `stale_lead`, `note_added`, `task_added`, `user_assigned_to_contact`, `facebook_lead_form_submitted`, `manual`

---

## Branching Workflows

GHL uses a specific internal structure for branching — **`next` is always an array**, and each if/else uses 3 nodes.

### if/else (binary, 2 paths)
```
if_else (condition-node) → next: [branch-yes-id, branch-no-id]
  branch-yes connector   → next: [first-yes-action-id]
  branch-no connector    → next: [first-no-action-id]
```

### A/B split (workflow_split)
```
workflow_split → next: [transition-a-id, transition-b-id]
  transition A → next: [first-path-a-action-id]
  transition B → next: [first-path-b-action-id]
```

See `SKILL.md` for full code examples and schemas.

---

## API Reference

**Base URL:** `https://backend.leadconnectorhq.com/workflow`

| Op | Method | Path |
|----|--------|------|
| Create | `POST` | `/{locationId}` |
| Read | `GET` | `/{locationId}/{workflowId}` |
| List | `GET` | `/{locationId}/list?type=workflow&limit=50` |
| Update | `PUT` | `/{locationId}/{workflowId}` |
| Delete | `DELETE` | `/{locationId}/{workflowId}` |

Full API docs in [`SKILL.md`](SKILL.md).

---

## License

MIT

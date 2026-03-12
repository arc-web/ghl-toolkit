---
name: ghl-workflow-builder
description: Programmatically create, read, update, and delete GoHighLevel workflows with triggers and actions via the hidden internal API. Use when building GHL workflows from code, automating workflow creation, adding triggers/actions to workflows, or any GHL workflow CRUD that the public API doesn't support. Requires GHL auth tokens (see ghl-auth skill).
---

# GHL Workflow Builder — Hidden Internal API

Create full GHL workflows (triggers + actions) programmatically. The public GHL API only lists workflows. This skill uses the **hidden internal API** at `backend.leadconnectorhq.com/workflow` discovered via reverse engineering the GHL iframe microfrontend.

## Prerequisites

- Auth: **See `ghl-auth` skill** — provides `getAuth()` with auto-refreshing v2 JWT tokens
- Env: `skills/ghl-workflow-builder/.env` (shared with ghl-auth)
- No browser required (headless JWT refresh)

## Auth

Uses the shared `ghl-auth` library. See `skills/ghl-auth/SKILL.md` for full details.

```javascript
import { getAuth } from '../../ghl-auth/scripts/ghl-auth-lib.mjs';
const { headers } = await getAuth();
// headers = { Authorization, Content-Type, Version, channel, source }

// Step 2: Use for workflow API
const headers = {
  'Authorization': `Bearer ${GHL_API_KEY}`,
  'token-id': id_token,
  'channel': 'APP',
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
};
```

**Token lifecycle:**
- `id_token` expires in 1 hour — refresh as needed
- `refresh_token` rotates on each use — always save the new one
- `GHL_API_KEY` never expires (static UUID)
- Refresh token stays valid indefinitely as long as it's used before expiry

### Fallback: Browser-based Auth (CDP)

If Firebase refresh fails (token revoked), re-extract from live GHL session:
```javascript
// Via CDP on GHL tab → Network.getCookies → m_a cookie
const headers = {
  'Authorization': `Bearer ${m_a}`,
  'Cookie': `m_a=${m_a}; a=${a}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
};
```

## Quick Start — Use the Script

```bash
# Create a workflow with trigger + actions
node skills/ghl-workflow-builder/scripts/build-workflow.mjs \
  --name "My Workflow" \
  --trigger form_submitted \
  --actions '[{"type":"sms","name":"Send SMS","attributes":{"body":"Hello {{contact.first_name}}!"}}]'
```

## API Reference

**Base URL:** `https://backend.leadconnectorhq.com/workflow`

### CREATE
```
POST /{locationId}
Body: { "name": "Workflow Name" }
Returns: { "id": "uuid" }
```

### READ (full workflow with actions)
```
GET /{locationId}/{workflowId}
```

### LIST
```
GET /{locationId}/list?type=workflow&limit=50&offset=0&sortBy=name&sortOrder=asc&includeCustomObjects=true&includeObjectiveBuilder=true
```

### UPDATE (add/modify actions and triggers)
```
PUT /{locationId}/{workflowId}
Body: {
  name, status: "draft"|"published",
  version: <current_version>,   // REQUIRED — GET first, use that version
  isRestoreRequest: true,
  timezone: "account",
  stopOnResponse: false,
  allowMultiple: false,
  allowMultipleOpportunity: false,
  autoMarkAsRead: false,
  removeContactFromLastStep: true,
  workflowData: { templates: [<actions>] },
  updatedBy: "<userId>",
  oldTriggers: [],
  newTriggers: [<triggers>],     // only when adding/changing triggers
  triggersChanged: true|false,
  modifiedSteps: [],
  deletedSteps: [],
  createdSteps: [<action_ids>],  // IDs of newly added actions
  meta: {}
}
```

### DELETE
```
DELETE /{locationId}/{workflowId}
```

## Action Schema

Actions chain via `next`/`parentKey` fields:

```javascript
{
  id: randomUUID(),        // unique ID
  order: 0,                // 0-based position in chain
  name: "Send SMS",        // display name
  type: "sms",             // action type (see list below)
  attributes: {            // type-specific config
    body: "hi {{contact.first_name}}!",
    attachments: []
  },
  next: "<next_action_id>",      // optional — next action's ID
  parentKey: "<prev_action_id>"  // optional — previous action's ID
}
```

### Action Types — Quick Reference

**59 total** (from bundle). See `references/triggers-and-actions.md` for full schemas.

**Messaging:** `sms` ★, `email`, `internal_notification`, `call`, `voicemail`, `messenger`, `instagram_dm`, `whatsapp`, `gmb`, `slack_message`, `review_request`, `respond_on_comment`, `manual_action`, `conversation_ai`, `facebook_interactive_messenger`, `instagram_interactive_messenger`, `send_live_chat_message`

**Contact:** `create_update_contact`, `update_contact_field`, `add_contact_tag`, `remove_contact_tag`, `assign_user`, `remove_assigned_user`, `dnd_contact`, `add_notes`, `add_task`, `edit_conversation`, `copy_contact_to_subaccount`, `delete_contact`, `modify_engagement_score`, `add_remove_followers`

**Workflow Control:** `wait`, `if_else` (up to 10 branches), `goto`, `add_to_workflow`, `remove_from_workflow`, `remove_from_all_workflows`, `drip`, `workflow_goal`, `workflow_split` (up to 5 paths), `update_custom_value`, `array_functions`

**Integrations:** `webhook`, `custom_webhook`, `google_sheets`, `google_analytics`, `google_adword`, `facebook_add_to_custom_audience`, `facebook_remove_from_custom_audience`, `facebook_conversion_api`

**CRM:** `create_opportunity`, `remove_opportunity`, `update_appointment_status`, `generate_booking_link`, `event_start_date`

**AI/Advanced:** `chatgpt` (GPT-5/4 models), `ai_agent`, `conversation_ai`, `add_appointment_booking_ai_bot`, `send_to_eliza`, `workflow_ai_decision_maker`, `custom_code` (JS + AI assist)

**Formatters:** `datetime_formatter` (premium), `number_formatter` (premium), `text_formatter` (free, 14 types), `math_operation`

**Memberships:** `membership_grant_offer`, `membership_revoke_offer`

**Payments:** `stripe_one_time_charge`, `send_invoice`, `send_documents_contracts`

**IVR/Phone:** `ivr_say`, `ivr_gather_input`, `ivr_connect_call`, `ivr_hangup`, `ivr_collect_voicemail`

**Communities:** `grant_group_access`, `revoke_group_access`

**Company (B2B):** `create_update_company`, `update_company`, `clear_company_fields`, `create_associated_company`, `update_associated_company`, `clear_associated_company_fields`

**Affiliate:** `add_to_affiliate_manager`, `update_affiliate`, `add_to_affiliate_campaign`, `remove_from_affiliate_campaign`

## Trigger Schema

```javascript
{
  id: randomUUID(),
  type: "form_submission",         // trigger type
  name: "Form Submitted",
  workflowId: "<workflow_id>",
  data: {
    type: "form_submission",
    targetActionId: "<first_action_id>"  // links trigger to first action
  }
}
```

### Trigger Types — Quick Reference

**70+ triggers** across 14 categories. See `references/triggers-and-actions.md` for full details.

**Contact:** `contact_tag` ★, `contact_created`, `contact_changed`, `contact_dnd`, `birthday_reminder`, `custom_date_reminder`, `note_added`, `note_changed`, `task_added`, `task_reminder`, `task_completed`, `contact_engagement_score`, `contact_merged`

**Events:** `inbound_webhook`, `scheduler` (contactless), `call_details`, `email_events`, `customer_reply`, `conversation_ai_trigger`, `custom_trigger`, `form_submission`, `survey_submission`, `trigger_link`, `facebook_lead_form_submitted`, `tik_tok_form_submitted`, `linkedin_lead_form_submitted`, `google_lead_form_submitted`, `video_tracking`, `number_validation`, `messaging_error_sms`, `funnel_page_view`, `quiz_submitted`, `new_review_received`, `prospect_generated`, `click_to_whatsapp_ads`, `external_tracking_event`

**Appointments:** `appointment`, `customer_booked_appointment`, `service_booking`, `rental_booking`

**Opportunities:** `opportunity_status_changed`, `opportunity_created`, `opportunity_changed`, `pipeline_stage_changed`, `stale_opportunities`

**Payments:** `invoice`, `payment_received`, `order_form_submission`, `order_submission`, `documents_contracts`, `estimates`, `subscription`, `refund`, `coupon_code_applied`, `coupon_code_redeemed`, `coupon_code_expired`, `coupon_redemption_limit_reached`

**Courses:** `lesson_started`, `lesson_completed`, `category_started`, `category_completed`, `product_started`, `product_completed`, `membership_new_signup`, `offer_access_granted`, `offer_access_removed`, `product_access_granted`, `product_access_removed`, `user_log_in`

**Affiliate:** `affiliate_created`, `new_affiliate_sales`, `affiliate_enrolled_in_campaign`, `lead_created`

**Ecommerce:** `shopify_order_placed`, `order_fulfilled`, `abandoned_checkout`, `product_review_submitted`

**Social:** `facebook_comment_on_post`, `instagram_comment_on_post`, `tiktok_comment_on_video`

**Communities:** `group_access_granted`, `group_access_revoked`, `private_channel_access_granted`, `private_channel_access_revoked`

**Company (B2B):** `company_created`, `company_changed`

**Other:** `manual`, `certificates_issued`, `transcript_generated`, `start_ivr`

## Branching Workflows — CRITICAL

> Reverse-engineered from live GHL workflows March 10, 2026. These are the EXACT schemas GHL uses internally.

### Key Rule: `next` is ALWAYS an Array

```javascript
// ✅ CORRECT
{ next: ["next-action-id"] }           // single next
{ next: ["branch-yes-id", "branch-no-id"] }  // branching

// ❌ WRONG (won't render in UI)
{ next: "next-action-id" }
```

---

### Pattern 1: if/else (Binary — Yes / No)

GHL's if_else uses **3 nodes per condition**: the main check + a yes-connector + a no-connector.

```javascript
const ifId       = randomUUID();
const yesBranchId = randomUUID();
const noBranchId  = randomUUID();

// 1. Main if_else node
{
  id: ifId,
  type: 'if_else',
  cat: 'conditions',
  nodeType: 'condition-node',
  name: 'Has tag hot-lead?',
  next: [yesBranchId, noBranchId],    // ← ARRAY with both branch IDs
  parentKey: prevNodeId,
  attributes: {
    if: true,
    conditionName: 'Hot Lead Check',
    operator: 'and',
    version: 2,
    branches: [{
      id: yesBranchId,                // ← branch id MATCHES yes-connector id
      name: 'Is hot-lead',
      segments: [{ operator: 'and', conditions: [{
        isWait: false,
        conditionType: 'tag',
        conditionSubType: 'tag',
        conditionOperator: '==',
        conditionValue: 'hot-lead',
      }] }],
      operator: 'and',
      showErrors: false,
    }],
  },
}

// 2. YES branch connector (branch-yes)
{
  id: yesBranchId,                    // ← matches branch id above
  type: 'if_else',
  cat: 'conditions',
  nodeType: 'branch-yes',
  name: 'Yes: hot-lead',
  parentKey: ifId,
  parent: ifId,                       // ← both parentKey AND parent required
  sibling: [noBranchId],
  next: firstYesActionId,             // ← leads to this branch's first action
  attributes: { if: false, conditionName: 'Condition', operator: 'and', branches: [] },
}

// 3. NO branch connector (branch-no)
{
  id: noBranchId,
  type: 'if_else',
  cat: 'conditions',
  nodeType: 'branch-no',
  name: 'None',
  parentKey: ifId,
  parent: ifId,
  sibling: [yesBranchId],
  next: firstNoActionId,              // ← leads to else path (or next if_else)
  attributes: { else: true },
}
```

**To route 10 tags to 10 different sequences: use NESTED if_else.**
Chain them so each `branch-no` leads to the next `if_else`:
```
if_else (hot-lead?)
  YES → hot-lead SMS sequence (10 SMS + waits)
  NO  → if_else (cold-lead?)
          YES → cold-lead SMS sequence
          NO  → if_else (no-show?)
                  ...and so on
```

---

### Pattern 2: workflow_split (Multi-path / A-B Split)

Use `workflow_split` with `transition` connector nodes when you want parallel paths.

```javascript
const splitId = randomUUID();
const transAId = randomUUID();
const transBId = randomUUID();

// 1. workflow_split node
{
  id: splitId,
  type: 'workflow_split',
  cat: 'multi-path',
  name: 'A/B Split',
  parentKey: prevNodeId,
  next: [transAId, transBId],        // ← ARRAY of transition IDs
  attributes: {
    name: 'Split',
    cat: 'multi-path',
    condition: 'random-split',
    paths: [
      { name: 'Path A', id: transAId },
      { name: 'Path B', id: transBId },
    ],
    transitions: [
      { id: transAId, name: 'Path A', conditionType: 'default', isPrimaryBranch: false, description: '', attributes: {} },
      { id: transBId, name: 'Path B', conditionType: 'default', isPrimaryBranch: false, description: '', attributes: {} },
    ],
    extras: { weightDistribution: { [transAId]: 50, [transBId]: 50 } },
    type: 'workflow_split',
  },
}

// 2. transition node (one per path)
{
  id: transAId,
  type: 'transition',
  cat: 'transition',
  name: 'Path A',
  parentKey: splitId,
  parent: splitId,                   // ← both parentKey AND parent required
  next: firstPathAActionId,          // ← leads to path A's first action
  attributes: {},
}
// repeat for transBId → Path B
```

---

### Branch Quick-Reference

| Use Case | Node Type | `next` format |
|----------|-----------|---------------|
| Linear chain | any action | `[nextId]` |
| if/else condition | `if_else` (condition-node) | `[yesBranchId, noBranchId]` |
| if/else YES path | `if_else` (branch-yes) | `[firstYesActionId]` |
| if/else NO path | `if_else` (branch-no) | `[firstNoActionId]` or `[nextIfElseId]` |
| A/B split | `workflow_split` | `[transId1, transId2, ...]` |
| A/B path connector | `transition` | `[firstPathActionId]` |

---

## Workflow — Step by Step

1. **Create** empty workflow: `POST /{locationId}` with `{name}`
2. **GET** the fresh workflow to read its `version`
3. **Build actions** array with UUIDs, chain them via `next`/`parentKey`
4. **PUT** update with `workflowData.templates` = actions array, `createdSteps` = action IDs
5. **GET** again to read new `version`
6. **Build trigger** with `targetActionId` pointing to first action
7. **PUT** update with `newTriggers` = [trigger], `triggersChanged: true`
8. Optionally **publish**: PUT with `status: "published"` (may need trigger Firestore doc to exist first)

## Important Notes

- **version field is REQUIRED** on every PUT — always GET first
- **Action type names are strict** — use exact types from the table (e.g., `sms` not `send_sms`)
- **Triggers are Firestore-backed** — the PUT creates the Firestore doc. Publishing may fail if trigger doc doesn't exist yet (500 NOT_FOUND)
- **Token expires ~60 min** — reload GHL page to refresh
- **Location ID:** `DZEpRd43MxUJKdtrev9t` (Real Connect)
- **User ID:** `8Uy3ls0B517vLO2tSNva`

## Key Gotchas & Quirks (from official docs)

- **Appointment/Invoice triggers IGNORE re-entry settings** — they always allow re-entry per appointment/invoice
- **Time Window only affects communication actions** (SMS, email, call) — NOT internal actions (tags, fields, opportunities)
- **If/Else supports up to 10 branches** — contact goes down the FIRST true branch (top to bottom)
- **Split contacts are locked to paths** — re-entry puts them on the same path, not re-randomized
- **Wait action has 7 types**: time delay, event/appointment time, overdue (invoice), condition, contact reply, trigger link clicked, email events
- **Wait conditions use Segments (OR between segments, AND/OR within)** — first true segment ends the wait
- **Dropdown fields in Update Contact Field do NOT need option IDs** (unlike in If/Else conditions)
- **Custom Code testing is mandatory** — untested code produces no output for subsequent actions
- **Inbound Webhook arrays not supported** in custom values (can send but can't reference in actions)
- **Stop on Response**: Only the contact's response matters, not the business user's answer to a call
- **Scheduler trigger is contactless** — contact-dependent actions are automatically skipped
- **GPT models now include GPT-5 family** (GPT-5, GPT-5.1, GPT-5 Mini default, GPT-5 Nano)
- **Text Formatter is FREE** while Number Formatter and DateTime Formatter are premium ($0.01/execution)
- **Custom Webhook failures cause retry with exponential backoff** — ensure receiving server handles volume

## Known Endpoints (Additional)

```
POST /{workflowId}/copy-workflow          — copy to sub-account
POST /{workflowId}/start-workflow         — manually trigger
GET  /{workflowId}/versions               — version history
PUT  /{locationId}/{id}/auto-save         — auto-save
PUT  /{locationId}/only-triggers/{id}     — update triggers only
GET  /{locationId}/workflow-ai/settings   — AI workflow settings
GET  /{locationId}/error-notification/count
POST /{locationId}/run-single-action      — test single action
POST /{locationId}/blacklist/workflow/{id}
POST /{locationId}/rate-limiting/bypass
```

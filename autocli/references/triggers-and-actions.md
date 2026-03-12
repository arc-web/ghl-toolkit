# GHL Workflow Triggers & Actions — Complete Reference

*Cataloged from 122 live workflows + GHL iframe bundle (index-GY7F9vPl.js)*
*March 10, 2026*

---

## Trigger Types

18 confirmed from live workflows. Additional types from bundle analysis.

| Type | Display Name | Notes |
|------|-------------|-------|
| `contact_tag` | Contact Tag | Most common (27x). `data.tagName`, `data.tagEvent: "added"\|"removed"` |
| `contact_created` | Contact Created | 8x in live workflows |
| `customer_reply` | Customer Replied | 8x — fires when contact replies to any message |
| `contact_changed` | Contact Changed | 5x — fires when contact field is updated |
| `appointment` | Appointment | 5x — appointment booked/updated |
| `two_step_form_submission` | Order Form Submission | 4x — two-step order forms, subscriptions |
| `form_submission` | Form Submitted | 4x — standard GHL forms |
| `survey_submission` | Survey Submitted | 3x |
| `offer_access_granted` | Offer Access Granted | 3x — membership offer granted |
| `inbound_webhook` | Inbound Webhook | 3x — webhook fires into workflow |
| `tik_tok_form_submitted` | TikTok Form Submitted | 2x |
| `payment_received` | Payment Received | 2x |
| `subscription` | Subscription | 2x — subscription events |
| `order_submission` | Order Submitted | 2x |
| `lesson_started` | Lesson Started | 1x — membership course lesson |
| `user_log_in` | User Login | 1x — contact logs into member area |
| `product_access_granted` | Product Access Granted | 1x |
| `trigger_link` | Trigger Link Clicked | 1x |

### Additional Trigger Types (from bundle, not yet in live workflows)

| Type | Display Name |
|------|-------------|
| `birthday_reminder` | Birthday Reminder |
| `call_status` | Call Status |
| `contact_merged` | Contact Merged |
| `facebook_lead_form_submitted` | Facebook Lead Form Submitted |
| `invoice_paid` | Invoice Paid |
| `lesson_completed` | Lesson Completed |
| `manual` | Manual Trigger |
| `note_added` | Note Added |
| `opportunity_changed` | Opportunity Changed |
| `opportunity_created` | Opportunity Created |
| `order_fulfilled` | Order Fulfilled |
| `product_access_removed` | Product Access Removed |
| `stale_lead` | Stale Lead |
| `task_added` | Task Added |
| `user_assigned_to_contact` | User Assigned to Contact |

### Trigger Schema

```javascript
{
  id: randomUUID(),
  type: "form_submission",         // trigger type string
  name: "Form Submitted",          // display name
  workflowId: "<workflow_id>",
  data: {
    type: "form_submission",
    targetActionId: "<first_action_id>",  // links to first action in chain
    // type-specific fields below...
  }
}
```

**Type-specific data fields:**
- `contact_tag`: `{ tagName: "my-tag", tagEvent: "added" | "removed" }`
- `form_submission`: `{ formId: "optional-form-id" }` (omit for any form)
- `appointment`: `{ appointmentStatus: "confirmed" | "cancelled" | "showed" | "noshow" }`
- `inbound_webhook`: no extra fields needed

---

## Action Types

**59 total from bundle registry.** 29 confirmed in live workflows with full attribute examples.

### Messaging

| Type | Display Name | Used |
|------|-------------|------|
| `sms` | Send SMS | 231x ★ |
| `email` | Send Email | 34x ★ |
| `internal_notification` | Internal Notification | 7x ★ |
| `call` | Call | — |
| `voicemail` | Voicemail | — |
| `messenger` | Facebook Messenger | — |
| `gmb` | Google My Business Messaging | — |
| `slack_message` | Send to Slack | — |
| `review_request` | Send Review Request | — |
| `respond_on_comment` | Reply in Comments | — |

#### `sms` attributes
```json
{
  "body": "Hey {{contact.first_name}}, your message here!",
  "attachments": []
}
```

#### `email` attributes
```json
{
  "from_name": "",
  "from_email": "",
  "subject": "Subject line here",
  "html": "<p>Email body HTML</p>",
  "attachments": []
}
```

#### `internal_notification` attributes
```json
{
  "type": "sms",
  "sms": {
    "body": "New lead: {{contact.name}}",
    "userType": "all",
    "attachments": []
  }
}
// OR for push notification:
{
  "type": "notification",
  "notification": {
    "type": "send_notification",
    "title": "New Lead!",
    "body": "{{contact.name}} just opted in",
    "userType": "all",
    "redirectPage": "contact"
  }
}
```

---

### Contact Management

| Type | Display Name | Used |
|------|-------------|------|
| `add_contact_tag` | Add Tag | 45x ★ |
| `remove_contact_tag` | Remove Tag | 19x ★ |
| `update_contact_field` | Update Contact Field | 38x ★ |
| `create_update_contact` | Create/Update Contact | 3x ★ |
| `assign_user` | Assign to User | 7x ★ |
| `remove_assigned_user` | Remove Assigned User | — |
| `dnd_contact` | Enable/Disable DND | 1x ★ |
| `add_notes` | Add Note | — |
| `copy_contact_to_subaccount` | Copy Contact to Sub-account | — |

#### `add_contact_tag` / `remove_contact_tag` attributes
```json
{ "tags": ["tag-name-1", "tag-name-2"] }
```

#### `update_contact_field` attributes
```json
{
  "type": "update_contact_field",
  "actionType": "update_field_data",
  "fields": [
    {
      "field": "source",           // built-in: source, firstName, lastName, email, phone
      "value": "{{contact.attributionSource.campaign}}",
      "title": "Contact Source",
      "type": "string",
      "date": ""
    },
    {
      "field": "CUSTOM_FIELD_ID",  // custom field by ID
      "value": "new value",
      "title": "My Custom Field",
      "type": "string",
      "date": ""
    }
  ]
}
```

#### `assign_user` attributes
```json
{
  "only_unassigned_contact": false,
  "total_index": 1,
  "traffic_split": "equally",
  "traffic_weightage": { "USER_ID": 1 },
  "traffic_index": [],
  "user_list": [],
  "type": "assign_user"
}
```

#### `dnd_contact` attributes
```json
{ "type": "dnd_contact", "dnd_contact": "enable" }
// or "disable"
```

---

### Workflow Control

| Type | Display Name | Used |
|------|-------------|------|
| `wait` | Wait / Delay | 246x ★ |
| `if_else` | If/Else Condition | 46x ★ |
| `goto` | Go To | 13x ★ |
| `add_to_workflow` | Add to Workflow | 3x ★ |
| `remove_from_workflow` | Remove from Workflow | 11x ★ |
| `remove_from_all_workflows` | Remove from All Workflows | 1x ★ |
| `drip` | Drip Mode | 6x ★ |
| `workflow_goal` | Workflow Goal | — |
| `workflow_split` | A/B Split | 1x ★ |
| `transition` | Branch Transition | 6x (internal) |

#### `wait` attributes
```json
{
  "type": "time",
  "startAfter": {
    "type": "minutes",   // "minutes", "hours", "days", "weeks"
    "value": 30,
    "when": "after"
  }
}
```

#### `if_else` attributes
```json
{
  "if": true,                    // true = this is the IF branch
  "conditionName": "Has Tag",
  "operator": "and",
  "version": 2,
  "branches": [
    {
      "id": "branch-uuid",
      "name": "Branch Name",
      "segments": [
        {
          "operator": "and",
          "conditions": [
            {
              "isWait": false,
              "conditionType": "tag",
              "conditionSubType": "tag",
              "conditionOperator": "==",
              "conditionValue": "my-tag"
            }
          ]
        }
      ],
      "operator": "and",
      "showErrors": false
    }
  ]
}
// else branch:
{ "else": true }
```

#### `goto` attributes
```json
{ "targetNodeId": "<action_id_to_jump_to>", "type": "goto" }
```

#### `add_to_workflow` / `remove_from_workflow` attributes
```json
// add_to_workflow:
{ "type": "add_to_workflow", "workflow_id": "target-workflow-uuid", "input_trigger_params": false }

// remove_from_workflow:
{ "type": "remove_from_workflow", "workflow_id": ["workflow-uuid-1", "workflow-uuid-2"] }

// remove_from_all_workflows:
{ "type": "remove_from_all_workflows", "includeCurrent": false }
```

#### `drip` attributes
```json
{
  "type": "drip",
  "batchSize": 10,
  "interval": { "timeUnit": "minutes", "value": 1 }
}
```

#### `workflow_split` attributes (A/B test)
```json
{
  "type": "workflow_split",
  "name": "Split",
  "cat": "multi-path",
  "condition": "random-split",
  "paths": [
    { "name": "Path A", "id": "path-a-uuid" },
    { "name": "Path B", "id": "path-b-uuid" }
  ],
  "transitions": [
    { "id": "path-a-uuid", "name": "Path A", "conditionType": "default", "attributes": {} },
    { "id": "path-b-uuid", "name": "Path B", "conditionType": "default", "attributes": {} }
  ],
  "extras": {
    "weightDistribution": { "path-a-uuid": 50, "path-b-uuid": 50 }
  }
}
```

---

### Integrations & Webhooks

| Type | Display Name | Used |
|------|-------------|------|
| `webhook` | Webhook | 19x ★ |
| `custom_webhook` | Custom Webhook | 7x ★ |
| `google_sheets` | Google Sheets | — |
| `google_analytics` | Google Analytics | — |
| `google_adword` | Google Ads | — |
| `facebook_add_to_custom_audience` | FB Add to Custom Audience | 1x ★ |
| `facebook_remove_from_custom_audience` | FB Remove from Custom Audience | — |
| `facebook_conversion_api` | FB Conversion API | 1x ★ |
| `slack_message` | Slack Message | — |

#### `webhook` attributes
```json
{
  "method": "POST",
  "url": "https://hooks.zapier.com/...",
  "customData": [
    { "key": "contact_id", "value": "{{contact.id}}" }
  ],
  "headers": []
}
```

#### `custom_webhook` attributes
```json
{
  "event": "CUSTOM",
  "method": "POST",
  "url": "https://your-server.com/endpoint",
  "body": {
    "contentType": "application/json",
    "rawData": "{\"id\": \"{{contact.id}}\", \"name\": \"{{contact.name}}\"}",
    "keyValueData": []
  },
  "headers": [],
  "parameters": [],
  "authorization": { "type": "NONE", "data": null },
  "saveResponse": true
}
```

---

### CRM / Opportunities

| Type | Display Name | Used |
|------|-------------|------|
| `create_opportunity` | Create/Update Opportunity | 1x ★ |
| `remove_opportunity` | Remove Opportunity | — |
| `update_appointment_status` | Update Appointment Status | — |
| `update_custom_value` | Update Custom Value | — |
| `event_start_date` | Set Event Start Date | 2x ★ |
| `edit_conversation` | Edit Conversation | 2x ★ |

#### `create_opportunity` attributes
```json
{
  "type": "create_opportunity",
  "pipeline_id": "PIPELINE_ID",
  "pipeline_stage_id": "STAGE_ID",
  "opportunity_name": "{{contact.name}}",
  "opportunity_source": "{{contact.source}}",
  "monetary_value": "297",
  "opportunity_status": "open",
  "fields": []
}
```

#### `edit_conversation` attributes
```json
{ "type": "edit_conversation", "read": true, "archive": true }
```

#### `event_start_date` attributes
```json
{
  "type": "event_start_date",
  "event_start_type": "custom_field",
  "value": "{{contact.webinar_datetime}}"
}
// OR for recurring:
{
  "type": "event_start_date",
  "event_start_type": "recurring",
  "value": 1,
  "recurring_type": "day_week",
  "recurring_time": "11:00"
}
```

---

### AI & Advanced

| Type | Display Name | Used |
|------|-------------|------|
| `ai_agent` | AI Agent | — |
| `chatgpt` | GPT by OpenAI | 3x ★ |
| `add_appointment_booking_ai_bot` | AI Appointment Booking Bot | — |
| `send_to_eliza` | Send to Eliza Agent Platform | — |
| `workflow_ai_decision_maker` | AI Decision Maker | 1x ★ |
| `custom_code` | Custom Code | 3x ★ |
| `datetime_formatter` | Date/Time Formatter | — |
| `number_formatter` | Number Formatter | — |
| `text_formatter` | Text Formatter | — |
| `math_operation` | Math Operation | — |
| `array_functions` | Array Functions | — |

#### `custom_code` attributes
```json
{
  "code": "// JavaScript code here\noutput = { result: 'value' };",
  "language": "javascript",
  "inputData": { "key1": "value1" },
  "output": { "result": "preview_value" }
}
```

---

### Memberships / Courses

| Type | Display Name | Used |
|------|-------------|------|
| `membership_grant_offer` | Grant Course/Offer | 3x ★ |
| `membership_revoke_offer` | Revoke Course/Offer | — |

#### `membership_grant_offer` attributes
```json
{ "type": "membership_grant_offer", "offer_id": "OFFER_UUID" }
```

---

### Affiliate Manager

| Type | Display Name |
|------|-------------|
| `add_to_affiliate_manager` | Add to Affiliate Manager |
| `update_affiliate` | Update Affiliate |
| `add_to_affiliate_campaign` | Add to Affiliate Campaign |
| `remove_from_affiliate_campaign` | Remove from Affiliate Campaign |

---

### IVR / Phone

| Type | Display Name |
|------|-------------|
| `ivr_say` | Say or Play Message |
| `ivr_connect_call` | Connect to Call |
| `ivr_hangup` | End Call |
| `ivr_collect_voicemail` | Record Voicemail |

---

### Payments

| Type | Display Name |
|------|-------------|
| `stripe_one_time_charge` | Stripe One-Time Charge |

---

## Action Chain Schema

Actions link together via `next` and `parentKey`:

```javascript
const action1 = { id: uuid1, order: 0, name: "...", type: "...", attributes: {...}, next: uuid2 };
const action2 = { id: uuid2, order: 1, name: "...", type: "...", attributes: {...}, parentKey: uuid1, next: uuid3 };
const action3 = { id: uuid3, order: 2, name: "...", type: "...", attributes: {...}, parentKey: uuid2 };
// Last action: no `next` field
```

## Template Merge Variables

Common variables available in `body`, `html`, `subject` fields:
- `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.name}}`
- `{{contact.email}}`, `{{contact.phone}}`
- `{{contact.id}}`, `{{contact.source}}`
- `{{contact.CUSTOM_FIELD_KEY}}` — custom fields by key
- `{{custom_values.VALUE_KEY}}` — location custom values
- `{{appointment.start_time}}`, `{{appointment.timezone}}`
- `{{user.name}}`, `{{location.full_address}}`
- `{{trigger_link.LINK_ID}}` — trigger link URLs
- `{{inboundWebhookRequest.FIELD}}` — data from inbound webhook

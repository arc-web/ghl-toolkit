# GHL Workflow Triggers & Actions — Complete Reference

*Compiled from official GHL documentation, 122 live workflows, bundle analysis, and community resources*
*Last updated: March 10, 2026*

---

## Table of Contents

1. [Workflow-Level Settings](#1-workflow-level-settings)
2. [Triggers](#2-triggers)
3. [Actions](#3-actions)
4. [Merge Variables / Custom Values](#4-merge-variables--custom-values)
5. [Common Patterns](#5-common-patterns)

---

## 1. Workflow-Level Settings

Settings apply to the entire workflow. Access via the **Settings** tab in the workflow builder.

### Contact Settings

#### Allow Re-entry
- **Enabled**: Contact can re-enter after completing or being removed. Cannot re-enter while still active.
- **Disabled**: Contact can only enter once, ever.
- **Exception**: Appointment-based and invoice-based triggers ALWAYS allow re-entry per appointment/invoice regardless of this setting.

```json
{ "allowMultiple": true }   // allow re-entry
{ "allowMultiple": false }  // one-time only
```

#### Allow Multiple Opportunities
- **Enabled** (default for new workflows): Contact enters as separate instance per opportunity.
- **Disabled**: Only first qualifying opportunity triggers.

```json
{ "allowMultipleOpportunity": true }
```

#### Stop on Response
- **Enabled**: Workflow ends for contact if they reply on any channel managed by this workflow.
- **Disabled**: Contact continues through entire workflow regardless of replies.
- **Call behavior**: Voicemail detection prevents voicemail from triggering stop-on-response (slight call delay). Can be disabled per-call action.
- Only the **contact's** response matters, not the business user's.

```json
{ "stopOnResponse": true }
```

### Communication Settings

#### Timezone
- **Account Timezone**: All time steps use location/account timezone.
- **Contact Timezone**: Uses each contact's individual timezone; falls back to account timezone if contact has none.
- Changes to account timezone only affect new enrollments, not active contacts.
- Cannot set different timezones for different steps.

```json
{ "timezone": "account" }  // or "contact"
```

#### Time Window
Restricts when communication actions (SMS, email, call) execute. Internal actions (tags, fields, opportunities) are NOT affected.

```json
{
  "timeWindow": {
    "enabled": true,
    "startTime": "09:00",
    "endTime": "17:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```

#### Sender Details
Default sender info for all communications:
- **From Name**: Default email sender name
- **From Email**: Default sender email address
- **From Number**: Default SMS phone number
- Individual actions can override these defaults.

#### Conversations — Mark as Read
- **Enabled**: Workflow-sent messages auto-mark conversations as "read"
- **Disabled** (default): Messages mark conversations as "unread" (draws attention)

```json
{ "autoMarkAsRead": true }
```

### API Update Schema

```json
PUT /{locationId}/{workflowId}
{
  "name": "Workflow Name",
  "status": "draft" | "published",
  "version": 42,                    // REQUIRED — always GET first
  "timezone": "account" | "contact",
  "stopOnResponse": false,
  "allowMultiple": false,            // allow re-entry
  "allowMultipleOpportunity": false,
  "autoMarkAsRead": false,
  "removeContactFromLastStep": true,
  "workflowData": { "templates": [] },
  "updatedBy": "<userId>",
  "triggersChanged": true | false,
  "newTriggers": [],
  "oldTriggers": [],
  "createdSteps": [],
  "modifiedSteps": [],
  "deletedSteps": [],
  "meta": {}
}
```

---

## 2. Triggers

Triggers initiate workflows based on specific events. Multiple triggers can be added to one workflow.

### Trigger Schema

```javascript
{
  id: randomUUID(),
  type: "form_submission",         // trigger type string
  name: "Form Submitted",          // display name
  workflowId: "<workflow_id>",
  data: {
    type: "form_submission",
    targetActionId: "<first_action_id>",  // links to first action
    // type-specific fields below...
  }
}
```

### Complete Trigger List by Category

---

### Contact Triggers

#### `birthday_reminder` — Birthday Reminder
- **Fires**: On or around the contact's birthday
- **Configuration**: Offset (days before/after birthday)
- **Requires**: Contact must have a date_of_birth field populated
- **Use case**: Automated birthday emails/SMS with special offers

#### `contact_changed` — Contact Changed
- **Fires**: When specified contact fields change to values you define
- **Configuration**: Filter to specific fields and values
- **Live usage**: 5x in production workflows
- **Use case**: React to field updates (e.g., lifecycle stage change)

#### `contact_created` — Contact Created
- **Fires**: When a new contact record is added to the CRM
- **Configuration**: No required filters; can add filters for source, tags, etc.
- **Live usage**: 8x in production workflows
- **Use case**: Welcome sequences, lead assignment, initial tagging

#### `contact_dnd` — Contact DND
- **Fires**: When a contact's Do Not Disturb preference is toggled on or off
- **Configuration**: Filter for DND enabled or disabled
- **Use case**: Update CRM records, notify sales team

#### `contact_tag` — Contact Tag ★ MOST COMMON
- **Fires**: When a selected tag is added to or removed from a contact
- **Live usage**: 27x in production workflows (most common trigger)
- **Configuration**:
  - `data.tagName`: specific tag name
  - `data.tagEvent`: `"added"` or `"removed"`
- **Filter options**: Tag name, tag event (added/removed)
- **Activation sources**: Manual via UI, workflow action, CSV import, third-party (Zapier — add only)

```javascript
{
  type: "contact_tag",
  data: {
    type: "contact_tag",
    tagName: "hot-lead",
    tagEvent: "added",              // "added" | "removed"
    targetActionId: "<first_action_id>"
  }
}
```

#### `custom_date_reminder` — Custom Date Reminder
- **Fires**: Before, on, or after a chosen custom date field on the contact
- **Configuration**: Select custom date field, offset direction and amount
- **Use case**: Policy renewals, contract expiration alerts, membership anniversary

#### `note_added` — Note Added
- **Fires**: When a new note is added to a contact
- **Use case**: Internal notifications, workflow chaining

#### `note_changed` — Note Changed
- **Fires**: When an existing contact note is edited
- **Use case**: Audit trails, team notifications

#### `task_added` — Task Added
- **Fires**: When a task is created for the contact
- **Use case**: Team notifications, automated follow-ups

#### `task_reminder` — Task Reminder
- **Fires**: When the task's reminder time is reached
- **Use case**: Automated reminders, escalation flows

#### `task_completed` — Task Completed
- **Fires**: When a task for the contact is marked completed
- **Use case**: Progression workflows, closing sequences

#### `contact_engagement_score` — Contact Engagement Score
- **Fires**: When the engagement score meets your defined rule
- **Use case**: Lead scoring automation, prioritization

#### `contact_merged` — Contact Merged
- **Fires**: When two contact records are merged
- **Use case**: Data cleanup notifications

---

### Events Triggers

#### `inbound_webhook` — Inbound Webhook ★ PREMIUM
- **Fires**: When data is received at the workflow's unique webhook URL
- **Live usage**: 3x in production workflows
- **Configuration**: Auto-generates webhook URL; supports POST, GET, PUT
- **Requirements**: JSON payload required; keys must be single strings (CamelCase or snake_case)
- **Contactless**: Can run without a contact. Use Create/Update Contact or Find Contact action to associate.
- **Mapping**: After receiving test data, select mapping reference. Use `{{inboundWebhookRequest.FIELD}}` in subsequent actions.

```javascript
{
  type: "inbound_webhook",
  data: {
    type: "inbound_webhook",
    targetActionId: "<first_action_id>"
  }
}
```

**Gotchas**:
- Arrays are NOT supported in custom values (can send but can't use in actions)
- If data structure changes, re-select the Mapping Reference
- Delete and recreate trigger if webhook URL is compromised

#### `scheduler` — Scheduler ★ NEW (Contactless)
- **Fires**: On a time-based schedule, no contact enrollment required
- **Configuration options**:
  - Custom (Nth weekday, e.g., 2nd Friday; multiple times)
  - Daily (one or more times per day)
  - Weekly (select days + time)
  - Monthly (day 1–31 or "Last" + time)
  - Every N days
  - One-off date/time
  - Advanced (cron syntax: `*minute *hour *day *month *weekday`)
- **Advanced settings**: Skip Weekends, Stop On (end date)
- **Contactless**: Contact-dependent actions are automatically skipped
- **Compatible actions**: Webhook, Custom Webhook, Google Sheets, Airtable, Slack, Custom Values, Create Task
- **Limitation**: Cron expressions running more than once per hour are not allowed; does NOT backfill missed executions

#### `call_status` / `call_details` — Call Details
- **Fires**: When a call log matches selected details or outcomes
- **Configuration**: Filter by inbound/outbound, specific number, call status
- **Use case**: Post-call follow-ups, missed call sequences

#### `email_events` — Email Events
- **Fires**: On email delivered, opened, clicked, bounced, spam complaint, or unsubscribe
- **Configuration**: Select specific email event type
- **Use case**: Re-engagement, bounce handling, unsubscribe management

#### `customer_reply` — Customer Replied
- **Fires**: When the contact replies on any connected channel
- **Live usage**: 8x in production workflows
- **Configuration**: Can filter by channel type
- **Use case**: Response-triggered workflows, conversation routing

#### `conversation_ai_trigger` — Conversation AI Trigger
- **Fires**: When a configured Conversation AI event occurs
- **Use case**: AI handoff workflows

#### `custom_trigger` — Custom Trigger
- **Fires**: From a custom event defined for non-standard use cases
- **Use case**: API-triggered automations

#### `form_submission` — Form Submitted
- **Fires**: When a selected HighLevel form is submitted
- **Live usage**: 4x in production workflows
- **Configuration**: Filter to specific form ID or trigger for any form

```javascript
{
  type: "form_submission",
  data: {
    type: "form_submission",
    formId: "optional-form-id",     // omit for any form
    targetActionId: "<first_action_id>"
  }
}
```

#### `survey_submission` — Survey Submitted
- **Fires**: When a selected survey is submitted
- **Live usage**: 3x in production workflows
- **Configuration**: Filter to specific survey

#### `trigger_link` — Trigger Link Clicked
- **Fires**: When the contact clicks a defined trigger link
- **Live usage**: 1x in production workflows
- **Use case**: Interest tracking, segmentation, upsell flows

#### `facebook_lead_form_submitted` — Facebook Lead Form Submitted
- **Fires**: When a Facebook Lead Ad form submission is received
- **Configuration**: Select specific Facebook form
- **Use case**: Instant lead capture from FB ads

#### `tik_tok_form_submitted` — TikTok Form Submitted
- **Fires**: When a TikTok lead form is submitted
- **Live usage**: 2x in production workflows

#### `linkedin_lead_form_submitted` — LinkedIn Lead Form Submitted ★ NEW
- **Fires**: When a LinkedIn Lead Gen form submission is received

#### `google_lead_form_submitted` — Google Lead Form Submitted ★ NEW
- **Fires**: When a Google Ads lead form submission is received

#### `video_tracking` — Video Tracking
- **Fires**: When a viewer reaches a chosen percentage of a video

#### `number_validation` — Number Validation
- **Fires**: Based on phone number validation result (requires Number Validation enabled)

#### `messaging_error_sms` — Messaging Error – SMS
- **Fires**: When an outbound SMS returns a specific error

#### `funnel_page_view` — Funnel/Website PageView
- **Fires**: When the contact views a specified page/URL or UTM

#### `quiz_submitted` — Quiz Submitted
- **Fires**: When a selected quiz is submitted

#### `new_review_received` — New Review Received
- **Fires**: When a new review arrives in Reviews/Reputation

#### `prospect_generated` — Prospect Generated
- **Fires**: When a new prospect record is created

#### `click_to_whatsapp_ads` — Click To WhatsApp Ads
- **Fires**: When an inbound WhatsApp thread starts from a Click-to-WhatsApp ad

#### `external_tracking_event` — External Tracking Event
- **Fires**: When a named client-side/server-side tracking event is captured

---

### Appointment Triggers

#### `appointment` — Appointment Status
- **Fires**: On status changes: booked, rescheduled, canceled, no-show, showed, completed
- **Live usage**: 5x in production workflows
- **Configuration**: Filter by appointment status, calendar, etc.
- **Special behavior**: Always allows re-entry per appointment regardless of "Allow Re-entry" setting

```javascript
{
  type: "appointment",
  data: {
    type: "appointment",
    appointmentStatus: "confirmed",   // "confirmed" | "cancelled" | "showed" | "noshow"
    targetActionId: "<first_action_id>"
  }
}
```

#### `customer_booked_appointment` — Customer Booked Appointment
- **Fires**: When a customer books an appointment themselves (not staff-created)

#### `service_booking` — Service Booking ★ NEW
- **Fires**: When a booking is made using Services (v2)

#### `rental_booking` — Rental Booking ★ NEW
- **Fires**: When a rental reservation is booked

---

### Opportunity Triggers

#### `opportunity_status_changed` — Opportunity Status Changed
- **Fires**: When an opportunity's status changes (e.g., Open → Won/Lost)
- **Use case**: Win/loss notifications, pipeline management

#### `opportunity_created` — Opportunity Created
- **Fires**: When a new opportunity is created

#### `opportunity_changed` — Opportunity Changed
- **Fires**: When selected opportunity fields change

#### `pipeline_stage_changed` — Pipeline Stage Changed
- **Fires**: When an opportunity moves to a different pipeline stage
- **Use case**: Stage-based automation sequences

#### `stale_lead` / `stale_opportunities` — Stale Opportunities
- **Fires**: When opportunities meet your inactivity/stale rule
- **Use case**: Re-engagement, follow-up reminders

---

### Affiliate Triggers

#### `affiliate_created` — Affiliate Created
- **Fires**: When a new affiliate account is created

#### `new_affiliate_sales` — New Affiliate Sales
- **Fires**: When a sale is attributed to an affiliate

#### `affiliate_enrolled_in_campaign` — Affiliate Enrolled In Campaign
- **Fires**: When an affiliate is added to a campaign

#### `lead_created` — Lead Created (Affiliate)
- **Fires**: When a new affiliate-attributed lead is created

---

### Courses / Membership Triggers

#### `category_started` — Category Started
- **Fires**: When a learner starts a selected course category

#### `category_completed` — Category Completed
- **Fires**: When a learner completes a selected course category

#### `lesson_started` — Lesson Started
- **Fires**: When a learner starts a lesson
- **Live usage**: 1x in production workflows

#### `lesson_completed` — Lesson Completed
- **Fires**: When a learner completes a lesson

#### `membership_new_signup` — New Signup
- **Fires**: When a user signs up for a course/offer

#### `offer_access_granted` — Offer Access Granted
- **Fires**: When access to an offer is granted
- **Live usage**: 3x in production workflows

#### `offer_access_removed` — Offer Access Removed
- **Fires**: When access to an offer is removed

#### `product_access_granted` — Product Access Granted
- **Fires**: When access to a product is granted
- **Live usage**: 1x in production workflows

#### `product_access_removed` — Product Access Removed
- **Fires**: When access to a product is removed

#### `product_started` — Product Started
- **Fires**: When a learner starts a product/course

#### `product_completed` — Product Completed
- **Fires**: When a learner completes a product/course

#### `user_log_in` — User Login
- **Fires**: When a learner logs in to the learning portal
- **Live usage**: 1x in production workflows

---

### Payment Triggers

#### `invoice` — Invoice
- **Fires**: On invoice lifecycle events: created, sent, due, paid
- **Special behavior**: Always allows re-entry per invoice regardless of settings

#### `invoice_paid` — Invoice Paid
- **Fires**: When a specific invoice is paid (subset of `invoice`)

#### `payment_received` — Payment Received
- **Fires**: When a payment is successfully captured
- **Live usage**: 2x in production workflows

#### `two_step_form_submission` / `order_form_submission` — Order Form Submission
- **Fires**: When a checkout/order form is submitted
- **Live usage**: 4x in production workflows

#### `order_submission` — Order Submitted
- **Fires**: When an order is successfully submitted at checkout
- **Live usage**: 2x in production workflows

#### `documents_contracts` — Documents & Contracts
- **Fires**: On document status events: sent, signed, viewed, declined, completed

#### `estimates` — Estimates
- **Fires**: On estimate events: sent, accepted, declined

#### `subscription` — Subscription
- **Fires**: On subscription create, update, pause, resume, or cancel
- **Live usage**: 2x in production workflows

#### `refund` — Refund ★ NEW
- **Fires**: When a refund is issued

#### `coupon_code_applied` — Coupon Code Applied ★ NEW
- **Fires**: When a coupon code is applied to a purchase

#### `coupon_redemption_limit_reached` — Coupon Redemption Limit Reached ★ NEW
- **Fires**: When a coupon hits its redemption limit

#### `coupon_code_expired` — Coupon Code Expired ★ NEW
- **Fires**: When a coupon code expires

#### `coupon_code_redeemed` — Coupon Code Redeemed ★ NEW
- **Fires**: When a coupon code is redeemed

---

### Ecommerce / Shopify Triggers

#### `shopify_abandoned_cart` — Shopify Abandoned Cart (Deprecating)
#### `shopify_order_placed` — Shopify Order Placed
#### `shopify_order_fulfilled` — Shopify Order Fulfilled (Deprecating)
#### `order_fulfilled` — Order Fulfilled
- **Fires**: When a store order is fulfilled

#### `product_review_submitted` — Product Review Submitted ★ NEW
- **Fires**: When a product review is submitted

#### `abandoned_checkout` — Abandoned Checkout
- **Fires**: When a checkout session is abandoned

---

### IVR Triggers

#### `start_ivr` — Start IVR Trigger
- **Fires**: When a caller reaches a configured IVR entry or option
- **Use case**: Inbound call routing with IVR menus

---

### Facebook/Instagram Event Triggers

#### `facebook_comment_on_post` — Facebook – Comment(s) On A Post
- **Fires**: When comments are added to the selected Facebook post

#### `instagram_comment_on_post` — Instagram – Comment(s) On A Post
- **Fires**: When comments are added to the selected Instagram post

---

### Communities Triggers

#### `group_access_granted` — Group Access Granted
#### `group_access_revoked` — Group Access Revoked
#### `private_channel_access_granted` — Private Channel Access Granted
#### `private_channel_access_revoked` — Private Channel Access Revoked
#### `community_leaderboard_level_changed` — Community Group Member Leaderboard Level Changed

---

### Certificate Triggers

#### `certificates_issued` — Certificates Issued ★ NEW
- **Fires**: When a course certificate is generated

---

### Communication Triggers

#### `tiktok_comment_on_video` — TikTok – Comment(s) On A Video ★ NEW
- **Fires**: When comments are added to a selected TikTok video

#### `transcript_generated` — Transcript Generated ★ NEW
- **Fires**: When a call or conversation transcript is created

---

### Company-Based Triggers ★ NEW (B2B)

#### `company_created` — Company Created
- **Fires**: When a new Company record is added
- **Filters**: Owner, tags, fields, other attributes

#### `company_changed` — Company Changed
- **Fires**: When one or more Company fields are updated
- **Filters**: Field/value conditions for specific changes

---

### Other/Utility Triggers

#### `manual` — Manual Trigger
- **Fires**: When manually triggered from the workflow or via API
- **Use case**: Testing, one-off enrollment, API-driven workflows

---

## 3. Actions

Actions execute sequentially after a trigger fires. They chain via `next`/`parentKey` fields.

### Action Schema

```javascript
{
  id: randomUUID(),
  order: 0,                  // 0-based position
  name: "Send SMS",          // display name
  type: "sms",               // action type string
  attributes: { ... },       // type-specific config
  next: ["<next_action_id>"],      // ALWAYS an array
  parentKey: "<prev_action_id>"    // previous action's ID
}
```

**Critical rule**: `next` is **ALWAYS an array**, even for single next actions.

---

### Contact Actions

#### `create_update_contact` — Create Contact / Find Contact
- **What**: Adds new contact or finds existing. Required after Inbound Webhook trigger.
- **Fields**: First Name, Last Name, Email, Phone, Company, Tags, Custom Fields
- **Notes**: Email or Phone required to create/match; contactless webhooks can skip this

#### `update_contact_field` — Update Contact Field
- **What**: Modifies standard or custom contact fields
- **Live usage**: 38x in production workflows
- **Action types**: `update_field_data` (write value) or `clear_field_data` (clear custom fields only)
- **Dynamic Values**: Supported for Numeric, Select/Dropdown, Monetary fields
- **Note**: Dropdown fields do NOT require option IDs here (unlike If/Else conditions)

```json
{
  "type": "update_contact_field",
  "actionType": "update_field_data",
  "fields": [
    {
      "field": "source",              // built-in: source, firstName, lastName, email, phone
      "value": "{{contact.attributionSource.campaign}}",
      "title": "Contact Source",
      "type": "string",
      "date": ""
    },
    {
      "field": "CUSTOM_FIELD_ID",     // custom field by ID
      "value": "new value",
      "title": "My Custom Field",
      "type": "string",
      "date": ""
    }
  ]
}
```

**Gotchas**:
- Cannot clear standard fields (email, phone, etc.) — only custom fields
- Values must match field type (date, dropdown options must exist, etc.)
- Fields must already exist; this action does not create new fields

#### `add_contact_tag` — Add Tag
- **What**: Adds one or more tags to a contact
- **Live usage**: 45x in production workflows

```json
{ "tags": ["tag-name-1", "tag-name-2"] }
```

#### `remove_contact_tag` — Remove Tag
- **What**: Removes one or more tags from a contact
- **Live usage**: 19x in production workflows

```json
{ "tags": ["tag-name-1", "tag-name-2"] }
```

#### `assign_user` — Assign to User
- **What**: Assigns a contact to one or more users
- **Live usage**: 7x in production workflows
- **Configuration**: Round-robin, weighted distribution, specific user

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

#### `remove_assigned_user` — Remove Assigned User
- **What**: Removes the assigned user from a contact

#### `dnd_contact` — Enable/Disable DND
- **What**: Toggles Do Not Disturb for a contact
- **Live usage**: 1x in production workflows

```json
{ "type": "dnd_contact", "dnd_contact": "enable" }  // or "disable"
```

#### `add_notes` — Add Note
- **What**: Adds a custom note to a contact's record

#### `add_task` — Add Task
- **What**: Creates a task for/about a contact
- **Note**: Works contactless — creates contact-less task if no contact exists (pair with Inbound Webhook)

#### `edit_conversation` — Edit Conversation
- **What**: Marks conversation as read/unread and archives/unarchives
- **Live usage**: 2x in production workflows
- **Options**: Mark as Read | Mark as Unread | None; Archive | Unarchive | None

```json
{ "type": "edit_conversation", "read": true, "archive": true }
```

#### `copy_contact_to_subaccount` — Copy Contact to Sub-account
- **What**: Duplicates a contact into another sub-account

#### `delete_contact` — Delete Contact
- **What**: Removes a contact from the system

#### `modify_engagement_score` — Modify Contact Engagement Score
- **What**: Adjusts a contact's engagement score

#### `add_remove_followers` — Add/Remove Contact Followers
- **What**: Adds or removes followers to/from a contact

---

### Communication Actions

#### `sms` — Send SMS ★ MOST USED
- **What**: Sends an SMS to the contact
- **Live usage**: 231x in production workflows
- **Merge fields**: Supported in body

```json
{
  "body": "Hey {{contact.first_name}}, your message here!",
  "attachments": []
}
```

#### `email` — Send Email
- **What**: Sends an email to the contact
- **Live usage**: 34x in production workflows
- **Configuration**: Subject, HTML body, attachments, from name/email (overrides workflow defaults)

```json
{
  "from_name": "",
  "from_email": "",
  "subject": "Subject line here",
  "html": "<p>Email body HTML</p>",
  "attachments": []
}
```

#### `internal_notification` — Send Internal Notification
- **What**: Sends notification to assigned users or specific users
- **Live usage**: 7x in production workflows
- **Types**: SMS, Email, Push Notification

```json
// SMS notification:
{
  "type": "sms",
  "sms": {
    "body": "New lead: {{contact.name}}",
    "userType": "all",
    "attachments": []
  }
}

// Push notification:
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

#### `call` — Call
- **What**: Makes a phone call to the contact; if they pick up, attempts to ring a user
- **Note**: Business user is called first. If business doesn't answer, workflow continues. Only contact's answer matters for Stop On Response.
- **Advanced**: "Disable Voicemail Detect" removes call delay but means voicemail = response

#### `voicemail` — Voicemail
- **What**: Drops a pre-recorded voicemail

#### `messenger` — Facebook Messenger
- **What**: Sends a Facebook Messenger message to the contact

#### `instagram_dm` — Instagram DM ★ NEW
- **What**: Sends an Instagram Direct Message

#### `whatsapp` — WhatsApp ★ NEW
- **What**: Sends WhatsApp messages (adheres to WhatsApp guidelines)

#### `gmb` — Google My Business Messaging
- **What**: Responds to Google My Business messages

#### `slack_message` — Send to Slack ★ PREMIUM
- **What**: Sends automated messages to Slack channels or users
- **Events**: Send to User (Assigned/Custom Email/Internal/Slack User), Public Channel, Private Channel
- **Message formatting**: Supports Slack formatting syntax

#### `review_request` — Send Review Request
- **What**: Sends a review request to the contact

#### `manual_action` — Manual Action
- **What**: Prompts a manual action to be performed by a user

#### `conversation_ai` — Conversation AI ★ NEW
- **What**: Manages inbound conversations with AI across multiple channels

#### `facebook_interactive_messenger` — Facebook Interactive Messenger ★ NEW
- **What**: Responds to Facebook comments on posts

#### `instagram_interactive_messenger` — Instagram Interactive Messenger ★ NEW
- **What**: Responds to Instagram comments on posts

#### `respond_on_comment` — Reply in Comments
- **What**: Replies to comments on Facebook or Instagram posts

#### `send_live_chat_message` — Send Live Chat Message ★ NEW
- **What**: Responds to live chat messages

---

### Workflow Control Actions

#### `wait` — Wait / Delay
- **What**: Pauses the workflow for a specified time, until a condition, or during a time window
- **Live usage**: 246x in production workflows (2nd most used)
- **Wait types**:

| Wait For | Description | Standard | Advanced |
|----------|-------------|----------|----------|
| Time Delay | Wait fixed duration | `[number] [min/hrs/days]` | Resume on [day], Resume between [hours], Resume at [exact time] |
| Event/Appointment Time | Wait until before/after event start | `Until [time]`, `After [M+D+H+min]`, `Before [M+D+H+min]` | If already past: next step / specific step / skip all |
| Overdue | Wait relative to invoice due date | Same as event time | Same past-handling |
| Condition | Wait for CRM condition | Segments (and/or) > Conditions (and/or) | Timeout [number] [min/hrs/days] |
| Contact Reply | Wait for reply on channel | Reply channel matching previous send | Timeout |
| Trigger Link Clicked | Wait for link click | Select trigger link | Timeout |
| Email Events | Wait for email event | Select previous email + event type | Timeout |

```json
// Time delay:
{
  "type": "time",
  "startAfter": {
    "type": "minutes",    // "minutes" | "hours" | "days" | "weeks"
    "value": 30,
    "when": "after"
  }
}

// Condition-based:
{
  "type": "condition",
  "segments": [{
    "operator": "and",
    "conditions": [{
      "conditionType": "tag",
      "conditionSubType": "tag",
      "conditionOperator": "==",
      "conditionValue": "interested"
    }]
  }],
  "timeout": {
    "enabled": true,
    "type": "days",
    "value": 7
  }
}
```

**Gotchas**:
- Conditions use Segments (OR between segments, AND/OR within segments)
- First true segment ends the wait
- Event time "already in past" has 3 options: next step, specific step, skip all
- Contacts assigned to a path (after condition wait) stay on that path on re-entry

#### `if_else` — If/Else Condition
- **What**: Creates conditional branches (up to 10 outcomes)
- **Live usage**: 46x in production workflows
- **Branching**: Contact goes down the FIRST true branch (evaluated top to bottom)
- **Condition types**: Tag, Contact Field, Custom Field, Time/Date, Opportunity, Previous Step Output, etc.

```json
// Main condition node:
{
  "if": true,
  "conditionName": "Has Tag",
  "operator": "and",
  "version": 2,
  "branches": [{
    "id": "branch-uuid",
    "name": "Is hot-lead",
    "segments": [{
      "operator": "and",
      "conditions": [{
        "isWait": false,
        "conditionType": "tag",
        "conditionSubType": "tag",
        "conditionOperator": "==",     // == | != | contains | does not contain | is any of | is none of | is empty | is not empty
        "conditionValue": "hot-lead"
      }]
    }],
    "operator": "and",
    "showErrors": false
  }]
}

// Else branch:
{ "else": true }
```

**If/Else condition operators**:
- `==` (is), `!=` (is not)
- `contains`, `does not contain`
- `is any of`, `is none of` (for lists)
- `is empty`, `is not empty`
- Time operators: `is`, `is not`, `is after`, `is on or after`, `is before`, `is on or before`

**Important**: For Includes/Does Not Include (tags, checkboxes):
- **AND**: Both conditions must be true → all tags must/must not be present
- **OR**: Either condition can be true → any matching tag qualifies

**Internal branching structure** (3 nodes per if/else):

```javascript
// 1. Main condition node
{
  id: ifId,
  type: 'if_else',
  cat: 'conditions',
  nodeType: 'condition-node',
  next: [yesBranchId, noBranchId],
  attributes: { if: true, branches: [...] }
}

// 2. YES branch connector
{
  id: yesBranchId,
  type: 'if_else',
  nodeType: 'branch-yes',
  parentKey: ifId,
  parent: ifId,
  sibling: [noBranchId],
  next: [firstYesActionId],
  attributes: { if: false }
}

// 3. NO branch connector
{
  id: noBranchId,
  type: 'if_else',
  nodeType: 'branch-no',
  parentKey: ifId,
  parent: ifId,
  sibling: [yesBranchId],
  next: [firstNoActionId],
  attributes: { else: true }
}
```

#### `goto` — Go To
- **What**: Directs contact to another action in the workflow or another workflow
- **Live usage**: 13x in production workflows

```json
{ "targetNodeId": "<action_id_to_jump_to>", "type": "goto" }
```

#### `add_to_workflow` — Add to Workflow
- **What**: Enrolls the contact into another workflow
- **Live usage**: 3x in production workflows

```json
{ "type": "add_to_workflow", "workflow_id": "target-workflow-uuid", "input_trigger_params": false }
```

#### `remove_from_workflow` — Remove from Workflow
- **What**: Removes the contact from specific workflow(s)
- **Live usage**: 11x in production workflows

```json
{ "type": "remove_from_workflow", "workflow_id": ["workflow-uuid-1", "workflow-uuid-2"] }
```

#### `remove_from_all_workflows` — Remove from All Workflows
- **What**: Removes the contact from all active workflows
- **Live usage**: 1x in production workflows

```json
{ "type": "remove_from_all_workflows", "includeCurrent": false }
```

#### `drip` — Drip Mode
- **What**: Controls rate at which contacts proceed (batch sizes over intervals)
- **Live usage**: 6x in production workflows
- **Use case**: Prevent overloading communication channels, maintain sender reputation

```json
{
  "type": "drip",
  "batchSize": 10,
  "interval": { "timeUnit": "minutes", "value": 1 }
}
```

#### `workflow_goal` — Goal Event
- **What**: Directs contacts to skip to a specific goal point in the workflow
- **Use case**: Contact achieves goal early; skip remaining nurture steps

#### `workflow_split` — Split (A/B Test)
- **What**: Random split of contacts into different paths
- **Live usage**: 1x in production workflows
- **Configuration**: Up to 5 paths; percentages must total 100%
- **Important**: Once a contact is assigned to a path, they stay on that path even on re-entry

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

#### `update_custom_value` — Update Custom Value
- **What**: Dynamically updates location-level custom values

#### `array_functions` — Arrays
- **What**: Handles multiple values as a single unit (sort, search, iterate)

---

### Integration & Webhook Actions

#### `webhook` — Webhook (Outbound)
- **What**: Sends contact data to external URLs
- **Live usage**: 19x in production workflows

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

#### `custom_webhook` — Custom Webhook ★ PREMIUM
- **What**: Full-featured HTTP request with auth, headers, body customization, response saving
- **Live usage**: 7x in production workflows
- **Methods**: POST, GET, DELETE, PUT
- **Auth types**: None, Basic, Bearer Token, API Key
- **Response**: Can save response data as custom variables for use in subsequent actions

```json
{
  "event": "CUSTOM",
  "method": "POST",
  "url": "https://your-server.com/endpoint",
  "body": {
    "contentType": "application/json",
    "rawData": "{\"id\": \"{{contact.id}}\"}",
    "keyValueData": []
  },
  "headers": [],
  "parameters": [],
  "authorization": {
    "type": "NONE",          // "NONE" | "BASIC" | "BEARER" | "API_KEY"
    "data": null
  },
  "saveResponse": true
}
```

**Gotchas**: Execution depends on API response success. Failures cause retry with exponential backoff. Ensure receiving server can handle expected volume.

#### `google_sheets` — Google Sheets ★ PREMIUM
- **What**: CRUD operations on Google Sheets rows
- **Functions**:
  - Create Spreadsheet Row / Create Multiple Rows
  - Lookup Spreadsheet Row / Lookup Multiple Rows
  - Update Specific Row / Update Multiple Rows / Update Row Using Lookup
  - Delete Specific Row / Delete Row Using Lookup
- **Configuration**: Google Account → Drive → Spreadsheet → Worksheet → Columns
- **Cost**: $0.01 per execution (premium action)

---

### CRM / Opportunity Actions

#### `create_opportunity` — Create/Update Opportunity
- **What**: Creates or updates an opportunity in a pipeline
- **Live usage**: 1x in production workflows

```json
{
  "type": "create_opportunity",
  "pipeline_id": "PIPELINE_ID",
  "pipeline_stage_id": "STAGE_ID",
  "opportunity_name": "{{contact.name}}",
  "opportunity_source": "{{contact.source}}",
  "monetary_value": "297",
  "opportunity_status": "open",       // "open" | "won" | "lost" | "abandoned"
  "fields": []
}
```

#### `remove_opportunity` — Remove Opportunity
- **What**: Removes opportunity from specific or multiple pipelines

#### `update_appointment_status` — Update Appointment Status
- **What**: Updates appointment status (rescheduled, no-show, completed)

#### `generate_booking_link` — Generate One Time Booking Link ★ NEW
- **What**: Generates a one-time booking link to send via SMS/email

#### `event_start_date` — Set Event Start Date
- **What**: Sets the event start date for time-based workflows
- **Live usage**: 2x in production workflows

```json
// Custom field source:
{
  "type": "event_start_date",
  "event_start_type": "custom_field",
  "value": "{{contact.webinar_datetime}}"
}

// Recurring:
{
  "type": "event_start_date",
  "event_start_type": "recurring",
  "value": 1,
  "recurring_type": "day_week",
  "recurring_time": "11:00"
}
```

---

### AI & Advanced Actions

#### `chatgpt` — GPT Powered by OpenAI
- **What**: Generates AI-driven responses using OpenAI models
- **Live usage**: 3x in production workflows
- **Models**: GPT-5, GPT-5.1, GPT-5 Mini (default), GPT-5 Nano, GPT-4o, GPT-4 Turbo, GPT-4o Mini
- **Configuration**:
  - **Model**: Select from dropdown
  - **Prompt**: Supports custom values / merge fields
  - **Temperature**: 0.1–1.0 (higher = more creative)
- **Output**: `{{chatgpt.1.response}}` — use in subsequent actions

```json
{
  "model": "gpt-5-mini",
  "prompt": "Write a follow-up email for {{contact.first_name}} about {{message.body}}",
  "temperature": 0.7
}
```

#### `ai_agent` / `conversation_ai` — Conversation AI
- **What**: AI-powered conversation handling across channels

#### `add_appointment_booking_ai_bot` — AI Appointment Booking Bot
- **What**: Uses Eliza platform to automate appointment bookings with AI

#### `send_to_eliza` — Send to Eliza Agent Platform
- **What**: Sends contact to Eliza Agent Platform service

#### `workflow_ai_decision_maker` — AI Decision Maker
- **What**: AI-powered decision branching
- **Live usage**: 1x in production workflows

#### `custom_code` — Custom Code ★ PREMIUM
- **What**: Executes custom JavaScript code within workflow
- **Live usage**: 3x in production workflows
- **Language**: JavaScript only
- **Features**:
  - Input properties from previous steps via `inputData` dictionary
  - External HTTP requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - Console.log support for debugging
  - AI-assisted code generation ("Build with AI")
  - Return response directly from code
- **Output**: Must be a JavaScript Object or Array of Objects
- **Testing**: Mandatory — untested code won't produce output for subsequent actions

```json
{
  "code": "const name = inputData.contactName;\nconst result = name.toUpperCase();\nreturn { formatted_name: result };",
  "language": "javascript",
  "inputData": {
    "contactName": "{{contact.first_name}}"
  },
  "output": { "formatted_name": "preview_value" }
}
```

**Gotchas**:
- Custom values NOT passed during testing (only contact info)
- Use `inputData.keyName` or `inputData['keyName']` to access mapped values
- Output of `{{custom_code.1.FIELD}}` available in next steps

---

### Formatter Actions

#### `datetime_formatter` — Date/Time Formatter ★ PREMIUM
- **What**: Reformats and compares dates/date-times
- **Action types**:
  - **Format Date**: Convert date format (e.g., MM/DD/YYYY → YYYY-MM-DD)
  - **Format Date-Time**: Convert date-time format
  - **Compare Dates**: Calculate difference in days between two dates
- **Field sources**: Specific Date, Current Date, Contact fields, Custom fields, Appointment start/end, Custom values, Inbound Webhook
- **Output variables**:
  - `{{datetime_formatter.1.date}}` — formatted date
  - `{{datetime_formatter.1.datetime}}` — formatted datetime
  - `{{datetime_formatter.1.days}}` — date comparison result

**Gotcha**: Contact Custom fields do NOT support Date-Time structure (date only).

#### `number_formatter` — Number Formatter ★ PREMIUM
- **What**: Format and generate numeric values
- **Action types**:

| Type | Description | Required Fields |
|------|-------------|----------------|
| Text to Number | Convert "$12,345.67" → 12345.67 | Select Field, Input Decimal Mark |
| Format Number | Format with decimals/separators | Select Field, Input Decimal Mark, To Format |
| Format Phone Number | Standardize phone format (E.164) | Select Field, To Format, Country Code |
| Format Currency | Format as currency | Select Field, Currency, Currency Locale |
| Random Number | Generate random in range | Lower Range, Upper Range, Decimal Points (optional) |

#### `text_formatter` — Text Formatter (Free action)
- **What**: Transform and manipulate text data
- **Action types**:

| Type | Description | Fields |
|------|-------------|--------|
| Upper Case | "text" → "TEXT" | Select Field |
| Lower Case | "TEXT" → "text" | Select Field |
| Title Case | "text formatter" → "Text Formatter" | Select Field |
| Capitalize | "text formatter" → "Text formatter" | Select Field |
| Default Value | "" → "Default Value" | Select Field, Default Value |
| Trim | Truncate to N characters | Select Field, Max Length, Remove from Beginning, Ellipsis |
| Trim Whitespace | Remove leading/trailing spaces | Select Field |
| Replace Text | Find and replace | Select Field, Find, Replace |
| Find | Find position of text (-1 if not found) | Select Field, Find |
| Word Count | Count words | Select Field |
| Length | Count characters | Select Field |
| Split Text | Split by delimiter → get segment | Select Field, Separator, Segment (First/Second/Second to Last/Last) |
| Remove HTML Tags | Strip HTML → plain text | Select Field |
| Extract Email | First email address in text | Select Field |
| Extract URL | First URL in text | Select Field |

#### `math_operation` — Math Operation
- **What**: Perform calculations on numeric and date fields
- **Operations on numbers**: Add, Subtract, Multiply, Divide
- **Operations on dates**: Add/Subtract days, months, years
- **Sources**: Standard fields, Custom fields, Custom values, Trigger fields
- **Output**: Updates a selected field (Standard, Custom, or Custom Value)

**Constraints**:
- Monetary fields: specific precision rules
- Negative values supported
- Result of math operation usable in If/Else conditions

---

### Membership/Course Actions

#### `membership_grant_offer` — Grant Course/Offer
- **What**: Grants access to a course offer
- **Live usage**: 3x in production workflows

```json
{ "type": "membership_grant_offer", "offer_id": "OFFER_UUID" }
```

#### `membership_revoke_offer` — Revoke Course/Offer
- **What**: Revokes access to a course offer

---

### Marketing Actions

#### `google_analytics` — Add to Google Analytics
#### `google_adword` — Add to Google AdWords
#### `facebook_add_to_custom_audience` — Add to Custom Audience (Facebook)
- **Live usage**: 1x in production workflows
#### `facebook_remove_from_custom_audience` — Remove from Custom Audience (Facebook)
#### `facebook_conversion_api` — Facebook Conversion API
- **Live usage**: 1x in production workflows

---

### Affiliate Actions

#### `add_to_affiliate_manager` — Add to Affiliate Manager
#### `update_affiliate` — Update Affiliate
#### `add_to_affiliate_campaign` — Add to Affiliate Campaign
#### `remove_from_affiliate_campaign` — Remove from Affiliate Campaign

---

### Payment Actions

#### `stripe_one_time_charge` — Stripe One-Time Charge
- **What**: Charges via Stripe using Customer ID (cus_id)

#### `send_invoice` — Send Invoice ★ NEW
- **What**: Sends an invoice created in HighLevel

#### `send_documents_contracts` — Send Documents and Contracts ★ NEW
- **What**: Sends document/contract from template

---

### IVR / Phone Actions

#### `ivr_say` — Say/Play Message
- **What**: Plays a message or uses TTS within IVR

#### `ivr_gather_input` — Gather Input on Call ★ NEW
- **What**: Gathers DTMF input from callers for IVR routing

#### `ivr_connect_call` — Connect to Call
- **What**: Forwards call to a specific user or number

#### `ivr_hangup` — End Call
- **What**: Terminates the call

#### `ivr_collect_voicemail` — Record Voicemail
- **What**: Records voicemail from caller

---

### Communities Actions ★ NEW

#### `grant_group_access` — Grant Group Access
#### `revoke_group_access` — Revoke Group Access

---

### Company Actions ★ NEW (B2B)

#### `create_update_company` — Create Company or Associated Contact
- **Available in**: Company-based & Contact-based workflows

#### `update_company` — Update Company or Associated Contact
- **Available in**: Company-based & Contact-based workflows

#### `clear_company_fields` — Clear Fields of Company or Associated Contact
- **Available in**: Company-based & Contact-based workflows

#### `create_associated_company` — Create Associated Company
- **Available in**: Contact-based workflows only

#### `update_associated_company` — Update Associated Company
- **Available in**: Contact-based workflows only

#### `clear_associated_company_fields` — Clear Fields of Associated Company
- **Available in**: Contact-based workflows only

---

## 4. Merge Variables / Custom Values

Merge variables dynamically insert data. Use `{{variable.path}}` syntax in body, subject, HTML, and custom data fields.

### Contact Fields

| Variable | Example |
|----------|---------|
| `{{contact.name}}` | Jane Smith |
| `{{contact.first_name}}` | Jane |
| `{{contact.last_name}}` | Smith |
| `{{contact.email}}` | jane@smith.com |
| `{{contact.phone}}` | (515) 555-2345 |
| `{{contact.phone_raw}}` | +15155552345 |
| `{{contact.company_name}}` | Smith Plumbing |
| `{{contact.full_address}}` | 1234 W. Main St, Chicago, IL 60657 |
| `{{contact.address1}}` | 1234 W. Main St |
| `{{contact.city}}` | Chicago |
| `{{contact.state}}` | Illinois |
| `{{contact.postal_code}}` | 60657 |
| `{{contact.timezone}}` | GMT-06:00 America/Chicago |
| `{{contact.date_of_birth}}` | Jan 3, 1980 |
| `{{contact.source}}` | Referral |
| `{{contact.website}}` | www.example.com |
| `{{contact.id}}` | FZDn5mYlkZuCCQe5Bep8 |
| `{{contact.CUSTOM_FIELD_KEY}}` | *(custom field by key)* |

### User Fields (Assigned User)

| Variable | Example |
|----------|---------|
| `{{user.name}}` | John Doe |
| `{{user.first_name}}` | John |
| `{{user.last_name}}` | Doe |
| `{{user.email}}` | john@doe.com |
| `{{user.phone}}` | (333) 555-9876 |
| `{{user.phone_raw}}` | +13335559876 |
| `{{user.email_signature}}` | John Doe, john@doe.com |
| `{{user.calendar_link}}` | https://booking.example.com/schedule/john-doe |
| `{{user.call_provider_phone_number}}` | (234) 555-9876 |
| `{{user.call_provider_phone_number_raw}}` | +12345559876 |

### Appointment Fields

| Variable | Example |
|----------|---------|
| `{{appointment.title}}` | Appointment with Bob |
| `{{appointment.start_time}}` | Wed, Nov 5, 2025 3:30 PM |
| `{{appointment.only_start_date}}` | Nov 5, 2025 |
| `{{appointment.only_start_time}}` | 3:30 PM |
| `{{appointment.end_time}}` | Wed, Nov 5, 2025 4:00 PM |
| `{{appointment.only_end_date}}` | Nov 5, 2025 |
| `{{appointment.only_end_time}}` | 4:00 PM |
| `{{appointment.day_of_week}}` | Monday |
| `{{appointment.month}}` | 11 |
| `{{appointment.timezone}}` | CST |
| `{{appointment.cancellation_link}}` | https://... |
| `{{appointment.reschedule_link}}` | https://... |
| `{{appointment.meeting_location}}` | 123 W Main St |
| `{{appointment.notes}}` | Second meeting |
| `{{appointment.add_to_calendar}}` | https://... |
| `{{appointment.add_to_google_calendar}}` | https://... |
| `{{appointment.add_to_ical}}` | https://... |
| `{{appointment.recurring.repeats}}` | 0 |
| `{{appointment.recurring.times_to_repeat}}` | 1 |
| `{{appointment.user.name}}` | John Doe |
| `{{appointment.user.email}}` | john@doe.com |
| `{{appointment.user.phone}}` | (333) 555-9876 |
| `{{appointment.user.phone_raw}}` | +13335559876 |
| `{{appointment.user.email_signature}}` | John Doe |

### Calendar Fields

| Variable | Example |
|----------|---------|
| `{{calendar.name}}` | Lawn Services Calendar |

### Account / Location Fields

| Variable | Example |
|----------|---------|
| `{{location.name}}` | WidgetWorks |
| `{{location.full_address}}` | 555 Oak St, Tampa, FL 33602 |
| `{{location.address}}` | 555 Oak St |
| `{{location.city}}` | Tampa |
| `{{location.state}}` | Florida |
| `{{location.country}}` | US |
| `{{location.postal_code}}` | 33602 |
| `{{location.email}}` | name@domain.com |
| `{{location.phone}}` | (333) 555-3344 |
| `{{location.phone_raw}}` | +13335553344 |
| `{{location.website}}` | mywebsiteurl.com |
| `{{location.logo_url}}` | https://files.example.com/logo.png |
| `{{location.id}}` | DP4mTqaz7L9XpweFvRjC |
| `{{location_owner.first_name}}` | Lisa |
| `{{location_owner.last_name}}` | White |
| `{{location_owner.email}}` | lisa@white.com |

### Message Fields

| Variable | Example |
|----------|---------|
| `{{message.body}}` | Hi, just a quick reminder... |
| `{{message.subject}}` | Meeting Reminder |

### Campaign Fields

| Variable | Example |
|----------|---------|
| `{{campaign.event_date_time}}` | Nov 5, 2025 3:30 PM |
| `{{campaign.event_date}}` | Nov 5, 2025 |
| `{{campaign.event_time}}` | 3:30 PM |

### Right Now (Current Time) Fields

| Variable | Example |
|----------|---------|
| `{{right_now.second}}` | 9 |
| `{{right_now.minute}}` | 10 |
| `{{right_now.hour}}` | 14 (24h) |
| `{{right_now.hour_ampm}}` | 2 |
| `{{right_now.ampm}}` | PM |
| `{{right_now.day_of_week}}` | Tuesday |
| `{{right_now.month_name}}` | November |
| `{{right_now.day}}` | 4 |
| `{{right_now.month}}` | 11 |
| `{{right_now.year}}` | 2025 |
| `{{right_now.middle_endian_date}}` | 11/4/2025 |
| `{{right_now.little_endian_date}}` | 4/11/2025 |

### Attribution Fields

#### First Attribution
| Variable | Description |
|----------|-------------|
| `{{contact.attributionSource.sessionSource}}` | Session source |
| `{{contact.attributionSource.url}}` | Landing URL |
| `{{contact.attributionSource.campaign}}` | Campaign |
| `{{contact.attributionSource.utmSource}}` | UTM source |
| `{{contact.attributionSource.utmMedium}}` | UTM medium |
| `{{contact.attributionSource.utmContent}}` | UTM content |
| `{{contact.attributionSource.referrer}}` | Referrer |
| `{{contact.attributionSource.campaignId}}` | Campaign ID |
| `{{contact.attributionSource.clickId}}` | Ad click ID |
| `{{contact.attributionSource.utmKeyword}}` | UTM keyword |
| `{{contact.attributionSource.utmMatchType}}` | UTM match type |
| `{{contact.attributionSource.adGroupId}}` | Ad group ID |
| `{{contact.attributionSource.adId}}` | Ad ID |

#### Latest Attribution
Same fields under `{{contact.lastAttributionSource.*}}` plus `{{contact.lastAttributionSource.utmCampaign}}`.

### Invoice Fields

| Variable | Example |
|----------|---------|
| `{{invoice.name}}` | Consulting Contract |
| `{{invoice.number}}` | 43255 |
| `{{invoice.issue_date}}` | 2025-04-05 |
| `{{invoice.due_date}}` | 2025-10-05 |
| `{{invoice.sub_total}}` | $500.00 |
| `{{invoice.discount_amount}}` | $50.00 |
| `{{invoice.tax_amount}}` | $25.00 |
| `{{invoice.total_amount}}` | $475.00 |
| `{{invoice.title}}` | Consulting Invoice |
| `{{invoice.url}}` | https://pay.example.com/... |
| `{{invoice.company.*}}` | Company details (name, phone, address, etc.) |
| `{{invoice.customer.*}}` | Customer details (name, email, phone, etc.) |
| `{{invoice.sender.*}}` | Sender details (name, email) |
| `{{invoice.card.brand}}` | Visa |
| `{{invoice.card.last4}}` | 7654 |

### Course Fields

| Variable | Example |
|----------|---------|
| `{{courses.categoryTitle}}` | Getting Started with Knitting |
| `{{courses.productTitle}}` | Basics of Knitting |
| `{{courses.postTitle}}` | The Best Types of Yarn |

### Service Booking Fields

| Variable | Example |
|----------|---------|
| `{{servicebooking.title}}` | Men's Haircut |
| `{{servicebooking.start_time}}` | 3:30 PM |
| `{{servicebooking.end_time}}` | 4:30 PM |
| `{{servicebooking.start_date}}` | March 6, 2026 |
| `{{servicebooking.total_price}}` | $55 |
| `{{servicebooking.timezone}}` | CST |
| `{{servicebooking.meeting_location}}` | 123 Main St |
| `{{servicebooking.reschedule_link}}` | https://... |
| `{{servicebooking.cancellation_link}}` | https://... |

### Phone Call Fields

| Variable | Description |
|----------|-------------|
| `{{phone_call.direction}}` | Call direction |
| `{{phone_call.duration}}` | Call duration |
| `{{phone_call.from}}` | Caller number |
| `{{phone_call.to}}` | Called number |
| `{{phone_call.from_city}}` | Caller city |
| `{{phone_call.status}}` | Call status |
| `{{phone_call.answered_by_user_name}}` | Who answered |
| `{{phone_call.start_time}}` | Start time |
| `{{phone_call.end_time}}` | End time |

### Custom Fields & Custom Values

| Variable | Description |
|----------|-------------|
| `{{contact.CUSTOM_FIELD_KEY}}` | Contact custom field by key |
| `{{custom_values.VALUE_KEY}}` | Location custom value by key |

### Trigger-Specific Variables

| Variable | Source |
|----------|--------|
| `{{inboundWebhookRequest.FIELD}}` | Inbound webhook payload data |
| `{{trigger_link.LINK_ID}}` | Trigger link URLs |
| `{{chatgpt.1.response}}` | GPT action output |
| `{{custom_code.1.FIELD}}` | Custom code output |
| `{{datetime_formatter.1.date}}` | Date formatter output |
| `{{datetime_formatter.1.datetime}}` | DateTime formatter output |
| `{{datetime_formatter.1.days}}` | Date comparison result |
| `{{number_formatter.1.result}}` | Number formatter output |
| `{{text_formatter.1.result}}` | Text formatter output |
| `{{google_sheets.1.COLUMN}}` | Google Sheets lookup result |

### Default/Fallback Values
When a merge field has no value, it's replaced with nothing. Use `Default Value` text formatter action or If/Else conditions to provide fallbacks.

---

## 5. Common Patterns

### Pattern 1: Lead Nurture with Tag-Based Branching

```
Trigger: contact_tag (added: "new-lead")
  → if_else (has tag "hot-lead")
      YES → SMS "Hi {{contact.first_name}}, let's schedule a call!"
           → wait 1 hour
           → SMS follow-up
      NO  → if_else (has tag "cold-lead")
              YES → Email drip sequence
              NO  → Add tag "unqualified"
```

### Pattern 2: Appointment Reminder Sequence

```
Trigger: appointment (status: confirmed)
  → wait (until 24 hours before appointment)
      → SMS "Reminder: {{appointment.title}} tomorrow at {{appointment.only_start_time}}"
  → wait (until 1 hour before appointment)
      → SMS "See you in 1 hour! Location: {{appointment.meeting_location}}"
```

### Pattern 3: Inbound Webhook → Google Sheets + Slack

```
Trigger: inbound_webhook
  → create_update_contact (map email, phone from webhook)
  → google_sheets (create row with order data)
  → slack_message (notify #sales channel)
  → add_contact_tag ("purchased")
```

### Pattern 4: Chained Workflows per Pipeline Stage

```
Workflow A (New Lead):
  Trigger: contact_created
  → add_contact_tag ("stage-1")
  → create_opportunity (Pipeline: Sales, Stage: New)
  → SMS welcome message
  → add_to_workflow (Workflow B)

Workflow B (Follow-up):
  Trigger: contact_tag ("stage-2")
  → remove_from_workflow (Workflow A)
  → Email sequence...
```

### Pattern 5: A/B Testing Email Subject Lines

```
Trigger: form_submission
  → workflow_split (50/50)
      Path A → email (subject: "Your Free Guide is Ready!")
      Path B → email (subject: "{{contact.first_name}}, download your guide")
  → wait 3 days
  → check email open rates via if_else
```

### Pattern 6: Scheduled Operations (Contactless)

```
Trigger: scheduler (Daily at 9 AM, Skip Weekends)
  → custom_webhook (GET daily metrics from API)
  → google_sheets (update dashboard sheet)
  → slack_message (#daily-report channel)
```

### Pattern 7: Payment Received → Course Grant + Notifications

```
Trigger: payment_received
  → membership_grant_offer (offer_id: "COURSE_UUID")
  → email (login credentials + course access)
  → internal_notification (notify sales team)
  → add_contact_tag ("customer")
  → update_contact_field (lifecycle: "customer")
```

---

## Appendix: Action Chain Schema

Actions link together via `next` (array) and `parentKey`:

```javascript
const action1 = {
  id: uuid1, order: 0, name: "Send SMS", type: "sms",
  attributes: { body: "Hello!" },
  next: [uuid2]     // ALWAYS array
};
const action2 = {
  id: uuid2, order: 1, name: "Wait 1 Day", type: "wait",
  attributes: { type: "time", startAfter: { type: "days", value: 1 } },
  parentKey: uuid1,
  next: [uuid3]
};
// Last action has no `next` field
```

### Branch Quick-Reference

| Use Case | Node Type | `next` format |
|----------|-----------|---------------|
| Linear chain | any action | `[nextId]` |
| if/else condition | `if_else` (condition-node) | `[yesBranchId, noBranchId]` |
| if/else YES path | `if_else` (branch-yes) | `[firstYesActionId]` |
| if/else NO path | `if_else` (branch-no) | `[firstNoActionId]` |
| A/B split | `workflow_split` | `[transId1, transId2, ...]` |
| A/B path connector | `transition` | `[firstPathActionId]` |

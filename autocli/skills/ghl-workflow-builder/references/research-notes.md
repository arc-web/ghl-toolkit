# GHL Workflow Research Notes

*Compiled March 10, 2026*

## Sources Consulted

### Official GHL Documentation (Successful)
1. ✅ [A List of Workflow Triggers](https://help.gohighlevel.com/support/solutions/articles/155000002292-a-list-of-workflow-triggers) — **GOLD MINE**. Complete trigger list by category with descriptions.
2. ✅ [A List of Workflow Actions](https://help.gohighlevel.com/support/solutions/articles/155000002294-workflow-triggers) — Full action list with categories and descriptions.
3. ✅ [Getting Started with Workflows](https://help.gohighlevel.com/support/solutions/articles/155000002288) — Overview, trigger/action concepts, advanced workflow types.
4. ✅ [Workflow Settings Overview](https://help.gohighlevel.com/support/solutions/articles/48001239875) — **CRITICAL**. Complete settings: re-entry, stop on response, timezone, time window, sender details, mark as read.
5. ✅ [Contact Tag Trigger](https://help.gohighlevel.com/support/solutions/articles/48001213546) — Tag trigger mechanics, what fires it.
6. ✅ [If/Else Action](https://help.gohighlevel.com/support/solutions/articles/48001180266) — AND/OR logic, up to 10 branches, time comparison operators.
7. ✅ [Wait Action](https://help.gohighlevel.com/support/solutions/articles/155000002470) — **DETAILED**. All 7 wait types with full config: time delay, event time, overdue, condition, contact reply, trigger link, email events.
8. ✅ [Split Action](https://help.gohighlevel.com/support/solutions/articles/155000003304) — Up to 5 paths, random only, contacts locked to assigned path.
9. ✅ [Update Contact Field](https://help.gohighlevel.com/support/solutions/articles/48001214441) — Dynamic values, clear field data, field type validation.
10. ✅ [Edit Conversation](https://help.gohighlevel.com/support/solutions/articles/48001214153) — Read/Unread, Archive/Unarchive.
11. ✅ [Custom Code](https://help.gohighlevel.com/support/solutions/articles/155000002253) — JS only, inputData mapping, HTTP requests, AI-assisted code.
12. ✅ [GPT Action](https://help.gohighlevel.com/support/solutions/articles/155000000209) — Models (GPT-4/5), prompt, temperature, output variable.
13. ✅ [Math Operation](https://help.gohighlevel.com/support/solutions/articles/48001216182) — Numeric and date operations, field constraints.
14. ✅ [Date/Time Formatter](https://help.gohighlevel.com/support/solutions/articles/48001238249) — Format date, format datetime, compare dates.
15. ✅ [Number Formatter](https://help.gohighlevel.com/support/solutions/articles/155000003355) — 5 action types: text to number, format number, phone, currency, random.
16. ✅ [Text Formatter](https://help.gohighlevel.com/support/solutions/articles/155000003361) — 14 action types with full field reference table.
17. ✅ [Google Sheets](https://help.gohighlevel.com/support/solutions/articles/48001238162) — 9 functions: CRUD with lookup capabilities.
18. ✅ [Custom Webhook](https://help.gohighlevel.com/support/solutions/articles/48001238167) — Full HTTP methods, auth types, response saving.
19. ✅ [Inbound Webhook](https://help.gohighlevel.com/support/solutions/articles/48001237383) — URL generation, mapping, contactless execution.
20. ✅ [Slack Action](https://help.gohighlevel.com/support/solutions/articles/48001238247) — 3 events: user DM, public channel, private channel.
21. ✅ [Scheduler Trigger](https://help.gohighlevel.com/support/solutions/articles/155000006653) — **NEW**. Contactless, cron support, skip weekends.
22. ✅ [Company-Based Workflows](https://help.gohighlevel.com/support/solutions/articles/155000006688) — **NEW**. B2B triggers and actions.
23. ✅ [Merge Fields List](https://help.gohighlevel.com/support/solutions/articles/48001078171) — **COMPREHENSIVE**. Full merge field reference including contact, user, appointment, calendar, message, account, right_now, attribution, invoice, course, service booking.

### Official GHL Documentation (404 or Irrelevant)
- ❌ 155000001364 (if-else action) — 404
- ❌ 155000001365 (wait action) — 404
- ❌ 155000001366 (go-to action) — 404
- ❌ 155000002295 (trigger filters) — 404
- ❌ 48001227034 — 404
- ⚠️ 48000666012 — Funnel troubleshooting (irrelevant)
- ⚠️ 48000449581 — Sites section (irrelevant)
- ⚠️ community.gohighlevel.com — Returned empty (JS-rendered)
- ❌ highlevel.stoplight.io — 404

### Third-Party Sources
- ✅ Growthable.io trigger list — Confirmed trigger categories, added filter context
- ✅ ConsultEvo.com — Referenced for wait action and custom code context

---

## New Discoveries (Not in Previous Reference)

### New Triggers Discovered
1. **`scheduler`** — Completely new contactless trigger. Supports cron, daily, weekly, monthly, one-off. Very powerful for ops automation.
2. **`custom_date_reminder`** — Custom date field reminder (before/on/after)
3. **`contact_dnd`** — DND toggle trigger
4. **`task_reminder`** — Task reminder time reached
5. **`task_completed`** — Task marked complete
6. **`note_changed`** — Note edited (not just added)
7. **`contact_engagement_score`** — Engagement score rule trigger
8. **`customer_booked_appointment`** — Specifically customer-booked (vs staff)
9. **`service_booking`** — Services v2 booking
10. **`rental_booking`** — Rental reservations
11. **`opportunity_status_changed`** — Distinct from opportunity_changed
12. **`pipeline_stage_changed`** — Distinct from opportunity_changed
13. **`affiliate_created`**, **`new_affiliate_sales`**, **`affiliate_enrolled_in_campaign`**, **`lead_created`** — 4 affiliate triggers
14. **`category_started`**, **`category_completed`** — Course category triggers
15. **`product_started`**, **`product_completed`** — Course product triggers
16. **`membership_new_signup`** — New course signup
17. **`documents_contracts`** — Document lifecycle events
18. **`estimates`** — Estimate events
19. **`refund`** — Refund issued
20. **`coupon_code_applied`**, **`coupon_redemption_limit_reached`**, **`coupon_code_expired`**, **`coupon_code_redeemed`** — 4 coupon triggers
21. **`abandoned_checkout`** — Non-Shopify checkout abandonment
22. **`product_review_submitted`** — Ecommerce review
23. **`order_fulfilled`** — Non-Shopify order fulfillment
24. **`video_tracking`** — Video percentage reached
25. **`number_validation`** — Phone validation result
26. **`messaging_error_sms`** — SMS error trigger
27. **`linkedin_lead_form_submitted`** — LinkedIn Lead Gen
28. **`google_lead_form_submitted`** — Google Ads lead form
29. **`funnel_page_view`** — Page/UTM view
30. **`quiz_submitted`** — Quiz submission
31. **`new_review_received`** — Review/reputation
32. **`prospect_generated`** — Prospect record creation
33. **`click_to_whatsapp_ads`** — WhatsApp ads inbound
34. **`external_tracking_event`** — Custom tracking events
35. **`conversation_ai_trigger`** — Conversation AI events
36. **`custom_trigger`** — Custom-defined events
37. **`email_events`** — Email delivery/open/click/bounce/spam/unsubscribe
38. **`facebook_comment_on_post`**, **`instagram_comment_on_post`** — Social comment triggers
39. **Community triggers**: `group_access_granted`, `group_access_revoked`, `private_channel_access_granted`, `private_channel_access_revoked`, `community_leaderboard_level_changed`
40. **`certificates_issued`** — Course certificate
41. **`tiktok_comment_on_video`** — TikTok comments
42. **`transcript_generated`** — Call transcript
43. **`company_created`**, **`company_changed`** — Company-level B2B triggers

### New Actions Discovered
1. **`add_task`** — Creates tasks (works contactless)
2. **`delete_contact`** — Delete contact
3. **`modify_engagement_score`** — Adjust engagement score
4. **`add_remove_followers`** — Follower management
5. **`instagram_dm`** — Instagram DM action
6. **`whatsapp`** — WhatsApp messaging
7. **`manual_action`** — Prompt manual action
8. **`conversation_ai`** — AI conversation handling
9. **`facebook_interactive_messenger`** — FB comment response
10. **`instagram_interactive_messenger`** — IG comment response
11. **`send_live_chat_message`** — Live chat response
12. **`generate_booking_link`** — One-time booking link
13. **`send_invoice`** — Send invoice
14. **`send_documents_contracts`** — Send documents/contracts
15. **`ivr_gather_input`** — IVR DTMF input
16. **`grant_group_access`**, **`revoke_group_access`** — Community groups
17. **Company actions** — 6 new B2B company management actions
18. **`update_custom_value`** — Dynamic custom value updates

### New Merge Variables Discovered
- **Right Now fields**: `{{right_now.second}}`, `{{right_now.minute}}`, `{{right_now.hour}}`, `{{right_now.day_of_week}}`, `{{right_now.month_name}}`, etc.
- **Calendar**: `{{calendar.name}}`
- **Invoice fields**: Complete set including company, customer, sender, card details
- **Course fields**: `{{courses.categoryTitle}}`, `{{courses.productTitle}}`, `{{courses.postTitle}}`
- **Service Booking fields**: Full set with pricing, location, user details
- **Phone Call fields**: direction, duration, from/to cities/states, answered by
- **Attribution fields**: Complete first + latest attribution with all UTM params
- **Client Portal**: `{{client_portal.login_url}}` (magic link)

### Key Workflow Settings Clarified
1. **Appointment/Invoice triggers ignore re-entry settings** — always allow per-appointment/invoice
2. **Time Window only affects communication actions** — tags, fields, opportunities unaffected
3. **Contact timezone fallback**: Uses account timezone if contact has none
4. **Mark as Read applies to all automated message types** from the workflow
5. **Stop on Response**: Only contact's response matters, not business user's
6. **Allow Multiple Opportunities**: Enabled by default for new workflows

---

## Corrections to Previous Reference

1. **Trigger count**: Previously listed 18 confirmed + ~15 from bundle ≈ 33 total. Official docs now list **70+ triggers** across 14 categories.
2. **Action count**: Previously listed 59. Official docs now show **70+ actions** across 14 categories.
3. **`call_status` renamed to `call_details`** in official docs (Call Details trigger).
4. **`two_step_form_submission` officially named `order_form_submission`** — "Order Form Submission" in UI.
5. **Wait action**: Previously documented only time delay. Now 7 distinct wait types (time delay, event time, overdue, condition, contact reply, trigger link, email events).
6. **If/Else**: Previously documented basic usage. Now confirmed up to 10 branches, detailed AND/OR logic, time comparison operators.
7. **Split action**: Previously only documented as "workflow_split". Official name is "Split" with up to 5 paths, locked path assignment.
8. **GPT models updated**: Now includes GPT-5, GPT-5.1, GPT-5 Mini, GPT-5 Nano (previously only GPT-3.5/4).
9. **Custom Code**: AI-assisted code generation ("Build with AI") is new.
10. **Google Sheets**: 9 distinct functions (not just CRUD), multiple row operations.

---

## Remaining Gaps

1. **API type names for new triggers**: Many new triggers' exact API type strings are inferred from bundle/convention. Need to verify exact strings for triggers like `scheduler`, `service_booking`, `rental_booking`, etc.
2. **Detailed filter schemas**: Official docs describe filters conceptually but don't provide JSON schemas for trigger filters.
3. **Conversation AI action**: Configuration details sparse — unclear exactly how to configure in API.
4. **IVR gather input**: Detailed DTMF configuration options not fully documented.
5. **WhatsApp action**: Template message requirements and configuration not fully detailed.
6. **Company workflow action schemas**: Internal API schemas for company-based actions not yet reverse-engineered.
7. **Airtable action**: Referenced in Scheduler docs but no standalone documentation found.
8. **Find Contact action**: Mentioned in docs but exact API type and schema not documented separately from create_update_contact.
9. **Premium pricing specifics**: $0.01 per execution mentioned for some premium actions but not consistently documented across all premium actions.

---

## Key Insights for Building Better Workflows

1. **Scheduler trigger is a game-changer** for ops automation — no more workaround contact enrollments for scheduled tasks.
2. **Contactless execution** is expanding — Inbound Webhook and Scheduler can both run without contacts, enabling pure data-pipeline workflows.
3. **Company-based workflows** enable true B2B automation — a separate workflow type with its own triggers/actions.
4. **Wait action is far more powerful than most realize** — 7 types with conditions, timeouts, and advanced windowing.
5. **If/Else supports 10 branches** — previously we were nesting unnecessarily for multi-way branching.
6. **Split contacts are locked to paths** — re-entry sends them down the same path, not re-randomized.
7. **Merge variables are extensive** — Right Now, Phone Call, Attribution, Invoice, Service Booking, Course fields all available.
8. **Dynamic Values in Update Contact Field** for Numeric/Select/Monetary fields is a newer capability that replaces static value typing.
9. **Text Formatter is free** while Number Formatter and DateTime Formatter are premium — prefer Text Formatter where possible.
10. **Custom Code supports async patterns and direct response returns** — more powerful than basic scripting.

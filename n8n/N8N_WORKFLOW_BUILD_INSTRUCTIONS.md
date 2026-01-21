# n8n Workflow Build Instructions

**Purpose:** Build an Asana → Base44 integration workflow in n8n Cloud
**Date:** 2026-01-20

---

## Overview

We need to create a workflow that:
1. Receives webhook events from Asana when a task is moved to a specific section
2. Handles Asana's handshake protocol
3. Fetches full task details from Asana API
4. Extracts custom field values
5. Creates a MortgageCase in Base44
6. Posts a confirmation comment back to Asana

---

## Workflow Architecture

```
[Webhook] → [If: Handshake?] → YES → [Respond with X-Hook-Secret]
                            → NO  → [If: Action=added?] → YES → [Code: Parse Event]
                                                        → NO  → [Respond 200]

[Parse Event] → [If: Stage 6?] → YES → [Asana: Get Task] → [Code: Extract Fields]
                               → NO  → [Respond 200]

[Extract Fields] → [HTTP: Create Case in Base44] → [Asana: Post Comment] → [Respond 200]
```

---

## Node-by-Node Configuration

### NODE 1: Webhook (Trigger)

**Node Type:** Webhook
**Name:** `Asana Webhook Receiver`

**Settings:**
- HTTP Method: `POST`
- Path: `asana-mortgage-webhook`
- Response Mode: `When the workflow finishes` or `Immediately` (depending on n8n version)

**Important:** After saving, copy the Production Webhook URL. It will look like:
```
https://YOUR-INSTANCE.app.n8n.cloud/webhook/asana-mortgage-webhook
```

---

### NODE 2: If (Check for Handshake)

**Node Type:** If
**Name:** `Is Handshake?`

**Condition:**
- Check if header `x-hook-secret` exists
- Expression to check: `{{ $json.headers['x-hook-secret'] }}`
- Condition: `exists` or `is not empty`

**Connections:**
- TRUE → Goes to "Respond to Handshake" node
- FALSE → Goes to "Is Task Added?" node

---

### NODE 3: Respond to Webhook (Handshake Response)

**Node Type:** Respond to Webhook
**Name:** `Respond to Handshake`

**Settings:**
- Response Code: `200`
- Response Headers: Add custom header
  - Name: `X-Hook-Secret`
  - Value (Expression): `{{ $('Asana Webhook Receiver').item.json.headers['x-hook-secret'] }}`
- Response Body: Empty or `{}`

---

### NODE 4: If (Check Action Type)

**Node Type:** If
**Name:** `Is Task Added to Section?`

**Condition:**
- Left Value (Expression): `{{ $json.body.events[0].action }}`
- Operation: `equals`
- Right Value: `added`

**Connections:**
- TRUE → Goes to "Parse Asana Event" node
- FALSE → Goes to "Ignore Response" node

---

### NODE 5: Code (Parse Event)

**Node Type:** Code
**Name:** `Parse Asana Event`

**JavaScript Code:**
```javascript
// Extract event data from Asana webhook payload
const webhookData = $input.item.json;
const event = webhookData.body?.events?.[0];

if (!event) {
  return { json: { skip: true, reason: 'No event data' } };
}

const taskGid = event.resource?.gid;
const sectionGid = event.parent?.gid;

// Stage 6 Section GID (AI Triage Dashboard) - TEST BOARD
const STAGE_6_SECTION = '1212791395605236';

// Check if task was added to Stage 6
if (sectionGid !== STAGE_6_SECTION) {
  return {
    json: {
      skip: true,
      reason: `Task added to section ${sectionGid}, not Stage 6 (${STAGE_6_SECTION})`
    }
  };
}

return {
  json: {
    skip: false,
    task_gid: taskGid,
    section_gid: sectionGid,
    action: event.action,
    event_type: event.type
  }
};
```

---

### NODE 6: If (Should Process?)

**Node Type:** If
**Name:** `Should Process?`

**Condition:**
- Left Value (Expression): `{{ $json.skip }}`
- Operation: `equals` or `is`
- Right Value: `false` (boolean)

**Connections:**
- TRUE (skip=false, meaning we should process) → Goes to "Get Task Details"
- FALSE (skip=true) → Goes to "Skip Response"

---

### NODE 7: Asana - Get Task Details

**Node Type:** Asana
**Name:** `Get Task Details`

**Credential:** Select `Asana PAT - Operations` (or create with token below)

**Asana PAT Token:**
```
2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c
```

**Settings:**
- Resource: `Task`
- Operation: `Get` or `Get a task`
- Task ID (Expression): `{{ $json.task_gid }}`

**Additional Fields / Options (if available):**
- opt_fields: `name,gid,custom_fields,memberships.section.gid,memberships.section.name`

---

### NODE 8: Code (Extract Custom Fields)

**Node Type:** Code
**Name:** `Extract Custom Fields`

**JavaScript Code:**
```javascript
// Extract custom fields from Asana task
const task = $input.item.json;

// Custom Field GIDs (from Asana setup)
const FIELD_GIDS = {
  clientName: '1202694315710867',
  clientEmail: '1202694285232176',
  insightlyId: '1202693938754570',
  brokerAppointed: '1211493772039109',
  internalIntroducer: '1212556552447200'
};

// Extract values from custom fields array
let clientName = task.name || 'Unknown Client';
let clientEmail = null;
let insightlyId = null;
let brokerAppointed = null;
let internalIntroducer = null;

if (task.custom_fields && Array.isArray(task.custom_fields)) {
  task.custom_fields.forEach(field => {
    if (field.gid === FIELD_GIDS.clientName && field.text_value) {
      clientName = field.text_value;
    }
    if (field.gid === FIELD_GIDS.clientEmail && field.text_value) {
      clientEmail = field.text_value;
    }
    if (field.gid === FIELD_GIDS.insightlyId && field.text_value) {
      insightlyId = field.text_value;
    }
    if (field.gid === FIELD_GIDS.brokerAppointed && field.text_value) {
      brokerAppointed = field.text_value;
    }
    if (field.gid === FIELD_GIDS.internalIntroducer && field.text_value) {
      internalIntroducer = field.text_value;
    }
  });
}

// Generate case reference
const year = new Date().getFullYear();
const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
const caseReference = `AWM-${year}-W${randomSuffix}`;

return {
  json: {
    asana_task_gid: task.gid,
    asana_project_gid: '1212782871770137',
    asana_section: task.memberships?.[0]?.section?.gid || null,
    case_reference: caseReference,
    client_name: clientName,
    client_email: clientEmail,
    insightly_id: insightlyId,
    internal_introducer: internalIntroducer,
    mortgage_broker_appointed: brokerAppointed,
    case_type: 'case',
    case_status: 'incomplete',
    created_from_asana: true,
    stage: 'intake_received',
    asana_last_synced: new Date().toISOString(),
    original_task_name: task.name
  }
};
```

---

### NODE 9: HTTP Request (Create Case in Base44)

**Node Type:** HTTP Request
**Name:** `Create Case in Base44`

**Settings:**
- Method: `POST`
- URL: `https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n`

**Headers:**
| Name | Value |
|------|-------|
| Content-Type | application/json |
| api_key | 3ceb0486ed434a999e612290fe6d9482 |

**Body:** JSON

```json
{
  "asana_task_gid": "{{ $json.asana_task_gid }}",
  "asana_project_gid": "{{ $json.asana_project_gid }}",
  "asana_section": "{{ $json.asana_section }}",
  "case_reference": "{{ $json.case_reference }}",
  "client_name": "{{ $json.client_name }}",
  "client_email": "{{ $json.client_email }}",
  "insightly_id": "{{ $json.insightly_id }}",
  "internal_introducer": "{{ $json.internal_introducer }}",
  "mortgage_broker_appointed": "{{ $json.mortgage_broker_appointed }}",
  "case_type": "{{ $json.case_type }}",
  "case_status": "{{ $json.case_status }}",
  "created_from_asana": {{ $json.created_from_asana }},
  "stage": "{{ $json.stage }}"
}
```

---

### NODE 10: Asana - Post Comment

**Node Type:** Asana
**Name:** `Post Confirmation to Asana`

**Credential:** Same `Asana PAT - Operations`

**Settings:**
- Resource: `Task Comment` (or `Story`)
- Operation: `Create` or `Add a task comment`
- Task ID (Expression): `{{ $('Extract Custom Fields').item.json.asana_task_gid }}`

**Comment Text (Expression):**
```
🔗 **CASE LINKED TO BASE44**

**Reference:** {{ $('Extract Custom Fields').item.json.case_reference }}
**Status:** Awaiting intake completion
**Created:** {{ new Date().toISOString().split('T')[0] }}

_This case is now visible in the Base44 dashboard under "Incomplete Cases"._
```

---

### NODE 11: Respond to Webhook (Success)

**Node Type:** Respond to Webhook
**Name:** `Success Response`

**Settings:**
- Response Code: `200`
- Response Body: `{ "success": true, "message": "Event processed" }`

---

### NODE 12: Respond to Webhook (Skip - Not Stage 6)

**Node Type:** Respond to Webhook
**Name:** `Skip Response`

**Settings:**
- Response Code: `200`
- Response Body: `{ "success": true, "message": "Skipped - not Stage 6" }`

---

### NODE 13: Respond to Webhook (Ignore - Not Add Event)

**Node Type:** Respond to Webhook
**Name:** `Ignore Response`

**Settings:**
- Response Code: `200`
- Response Body: `{ "success": true, "message": "Not an add event" }`

---

## Node Connections Summary

```
Asana Webhook Receiver
  └── Is Handshake?
        ├── TRUE → Respond to Handshake (END)
        └── FALSE → Is Task Added to Section?
                      ├── TRUE → Parse Asana Event
                      │            └── Should Process?
                      │                  ├── TRUE → Get Task Details
                      │                  │            └── Extract Custom Fields
                      │                  │                  └── Create Case in Base44
                      │                  │                        └── Post Confirmation to Asana
                      │                  │                              └── Success Response (END)
                      │                  └── FALSE → Skip Response (END)
                      └── FALSE → Ignore Response (END)
```

---

## Key Reference Values

### Asana Credentials
- **Operations PAT:** `2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c`

### Asana GIDs
- **TEST Project GID:** `1212782871770137`
- **Stage 6 Section GID:** `1212791395605236`

### Custom Field GIDs
| Field | GID |
|-------|-----|
| Client Name | 1202694315710867 |
| Client Email | 1202694285232176 |
| Insightly ID | 1202693938754570 |
| Broker Appointed | 1211493772039109 |
| Internal Introducer | 1212556552447200 |

### Base44 Endpoint
- **URL:** `https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n`
- **API Key:** `3ceb0486ed434a999e612290fe6d9482`

---

## After Building the Workflow

1. **Save the workflow**
2. **Activate the workflow** (toggle ON)
3. **Copy the Production Webhook URL** from Node 1
4. **Register the webhook with Asana** using this PowerShell command (replace YOUR_WEBHOOK_URL):

```powershell
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
$body = @{ data = @{ resource = "1212782871770137"; target = "YOUR_WEBHOOK_URL" } } | ConvertTo-Json
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

---

## Testing

1. Go to Asana TEST board: "Mortgage Dynamic - TEST (WIP)"
2. Create or move a task to Stage 6 ("AI Triage Dashboard")
3. Check n8n execution history for success
4. Check Base44 "Incomplete Cases" tab for new case
5. Check Asana task for confirmation comment

---

**End of Instructions**

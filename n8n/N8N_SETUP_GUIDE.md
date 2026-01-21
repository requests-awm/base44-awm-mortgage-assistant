# n8n Setup Guide: Asana → Base44 Integration

**Created:** 2026-01-20
**Purpose:** Connect Asana tasks to Base44 MortgageCase creation via n8n Cloud

---

## Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ASANA     │───▶│    n8n      │───▶│   BASE44    │───▶│   ASANA     │
│ Task moved  │    │ Extracts &  │    │ Creates     │    │ Comment     │
│ to Stage 6  │    │ transforms  │    │ case        │    │ posted      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     (READ)           (PROCESS)          (WRITE)           (WRITE)
```

**Safety:**
- Asana is READ-only except for posting confirmation comments
- No task modifications, deletions, or status changes
- n8n handles all webhook complexity

---

## Part 1: Base44 Setup (Do This First)

### Step 1.1: Create the n8n Endpoint Function

1. **Login to Base44**
   - Go to your Base44 dashboard
   - Navigate to **Functions** (in left sidebar)

2. **Create New Function**
   - Click "Create Function" or "+"
   - Name it exactly: `createCaseFromN8n`
   - This is CRITICAL - the n8n workflow calls this name

3. **Paste the Code**
   - Open file: `n8n/createCaseFromN8n_BASE44_FUNCTION.js`
   - Copy ALL contents
   - Paste into Base44 function editor

4. **Set as Public Endpoint**
   - Find the "Public" or "Endpoint" toggle
   - Enable it (function must be callable from external sources)

5. **Save and Publish**
   - Click Save
   - Click Publish (if separate button exists)

6. **Verify the Endpoint**
   - Your endpoint URL should be:
   ```
   https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n
   ```
   - API Key: `3ceb0486ed434a999e612290fe6d9482`

### Step 1.2: Verify Environment Variables

In Base44 Settings → Environment Variables, ensure these exist:

| Variable | Value |
|----------|-------|
| BASE44_APP_ID | `695d6a9a166167143c3f74bb` |

---

## Part 2: n8n Cloud Setup

### Step 2.1: Import the Workflow

1. **Login to n8n Cloud**
   - Go to [app.n8n.cloud](https://app.n8n.cloud)
   - Login to your account

2. **Import Workflow**
   - Click "Workflows" in sidebar
   - Click "Import from File" (or "..." menu → Import)
   - Select file: `n8n/asana_to_base44_workflow.json`

3. **Workflow Should Appear**
   - Named: "Asana to Base44 - Mortgage Case Creator"
   - 6 nodes should be visible

### Step 2.2: Configure Asana Credentials

1. **Click on "Asana Trigger" node**

2. **Add Credentials**
   - Click "Credential" dropdown
   - Click "Create New"
   - Select "Asana API"

3. **Enter Your PAT**
   - **Access Token:** Your Asana Personal Access Token
   - For testing, use: `2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f`
   - ⚠️ For production: Use Operations Support PAT

4. **Save Credentials**
   - Name it: "Asana PAT - Test" (or similar)
   - Click Save

5. **Configure Trigger Settings**
   - Resource: `Project`
   - Project: Select "Mortgage Dynamic - TEST (WIP)"
   - Or enter Project GID: `1212782871770137`

### Step 2.3: Configure Second Asana Node

1. **Click on "Post Confirmation to Asana" node**
2. **Select the same Asana credential** you just created
3. **Save**

### Step 2.4: Verify HTTP Request Node

1. **Click on "Create Case in Base44" node**
2. **Verify URL is:**
   ```
   https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n
   ```
3. **Verify headers include:**
   - `Content-Type: application/json`
   - `api_key: 3ceb0486ed434a999e612290fe6d9482`

---

## Part 3: Testing

### Step 3.1: Test Base44 Endpoint First

Before activating the workflow, test the endpoint directly:

**PowerShell Test:**
```powershell
$testPayload = @{
    asana_task_gid = "TEST-" + (Get-Random -Maximum 999999)
    asana_project_gid = "1212782871770137"
    asana_section = "1212791395605236"
    case_reference = "AWM-2026-TEST001"
    client_name = "Test Client"
    client_email = "test@example.com"
    case_type = "case"
    case_status = "incomplete"
    created_from_asana = $true
    stage = "intake_received"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://app.base44.com/api/695d6a9a166167143c3f74bb/createCaseFromN8n" `
    -Method Post `
    -Body $testPayload `
    -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Case created successfully",
  "case_id": "abc123...",
  "case_reference": "AWM-2026-TEST001"
}
```

### Step 3.2: Test n8n Workflow (Manual)

1. **Open the workflow in n8n**
2. **Click "Execute Workflow"** (manual test)
3. **If no data:** Click on Asana Trigger → "Fetch Test Event"
4. **Check each node** - green = success, red = error

### Step 3.3: Activate Workflow

Once manual test passes:

1. **Toggle "Active"** in top-right corner
2. **Workflow is now live**

### Step 3.4: End-to-End Test

1. **Go to Asana TEST board**
   - Project: "Mortgage Dynamic - TEST (WIP)"

2. **Create a test task** (or use existing)
   - Fill in custom fields: Client Name, Client Email

3. **Move task to Stage 6** ("AI Triage Dashboard")

4. **Wait 10-30 seconds**

5. **Check Results:**
   - [ ] n8n execution history shows success
   - [ ] Base44 "Incomplete Cases" tab shows new case
   - [ ] Asana task has comment: "🔗 CASE LINKED TO BASE44"

---

## Part 4: Troubleshooting

### Issue: n8n workflow not triggering

**Check:**
1. Is the workflow "Active"? (toggle in top-right)
2. Are Asana credentials valid?
3. Is the correct project selected in trigger?

**Fix:**
- Deactivate → Reactivate workflow
- Re-authenticate Asana credentials

### Issue: Base44 returns 404

**Check:**
1. Is function named exactly `createCaseFromN8n`?
2. Is function published/public?
3. Is the URL correct in n8n HTTP Request node?

**Fix:**
- Verify function name in Base44
- Re-publish function
- Check Base44 console logs

### Issue: Duplicate cases being created

**This shouldn't happen** - the function checks for duplicates.

**Check:**
1. Is `asana_task_gid` being passed correctly?
2. Check n8n execution logs for the GID value

### Issue: Asana comment not posting

**Check:**
1. Does PAT have write permissions?
2. Is task GID being passed correctly from earlier node?

**Fix:**
- Check n8n "Post Confirmation to Asana" node
- Verify expression: `{{ $('Extract Custom Fields').item.json.asana_task_gid }}`

---

## Part 5: Going to Production

### When ready for production:

1. **Create new n8n workflow** (duplicate the test one)

2. **Change Asana Trigger:**
   - Project GID: `1204991703151113` (Production board)
   - Section GID: [Get from production board]

3. **Update filter node:**
   - Change Stage 6 section GID to production value

4. **Use production PAT:**
   - Get from Operations Support team
   - Create new credential in n8n

5. **Test with ONE task first**
   - Move single task to Stage 6
   - Verify case created correctly
   - Check comment posted

6. **Monitor for 24 hours**
   - Watch n8n execution history
   - Check Base44 for any issues

---

## Files Reference

| File | Purpose |
|------|---------|
| `n8n/asana_to_base44_workflow.json` | n8n workflow - import this |
| `n8n/createCaseFromN8n_BASE44_FUNCTION.js` | Base44 function - paste into Base44 |
| `n8n/N8N_SETUP_GUIDE.md` | This guide |

---

## Security Notes

### What the integration CAN do:
- ✅ READ Asana tasks and custom fields
- ✅ CREATE MortgageCase in Base44
- ✅ POST comments to Asana tasks

### What the integration CANNOT do:
- ❌ Delete Asana tasks
- ❌ Modify Asana task data (title, assignee, due date)
- ❌ Move tasks between sections
- ❌ Access other Asana projects (scoped to specific project)
- ❌ Delete or modify Base44 cases (only creates)

### PAT Permissions Required:
- `read:tasks` - Read task data
- `write:comments` - Post confirmation comments

---

## Support

If you encounter issues:

1. Check n8n execution history for errors
2. Check Base44 function logs
3. Verify all GIDs match your Asana board
4. Test Base44 endpoint independently (PowerShell command above)

---

**Last Updated:** 2026-01-20
**Author:** Claude Code Assistant

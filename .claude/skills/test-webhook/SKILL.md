---
name: test-webhook
description: End-to-end test of Asana → n8n → Base44 webhook flow
allowed-tools: Bash, Read, Write
---

# Test Webhook Skill

Perform a complete end-to-end test of the webhook integration flow.

## Prerequisites
- n8n Cloud workflow must be built and active
- n8n webhook URL must be known
- Base44 `createCaseFromN8n` function must be deployed

## What This Skill Does

1. **Checks prerequisites** (n8n URL configured)
2. **Creates/identifies test task** in Asana TEST board
3. **Moves task to Stage 6** (triggers webhook)
4. **Waits and polls** for n8n execution
5. **Verifies Base44 case** was created
6. **Checks Asana comment** was posted
7. **Reports pass/fail** with timing

## Test Flow

```
[1. Create Test Task] → [2. Move to Stage 6] → [3. Wait 10s]
                                                    ↓
[6. Report Results] ← [5. Check Asana Comment] ← [4. Check Base44 Case]
```

## Instructions

### Step 1: Check Prerequisites
Ask user for n8n webhook URL if not known. Check PROGRESS.md for status.

### Step 2: Create or Use Existing Test Task
```powershell
# Option A: Use existing task (ask user for GID)
# Option B: Create new task via Asana API

$headers = @{
    "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c"
    "Content-Type" = "application/json"
}
$body = @{
    data = @{
        name = "WEBHOOK TEST - " + (Get-Date -Format "yyyy-MM-dd HH:mm")
        projects = @("1212782871770137")
    }
} | ConvertTo-Json -Depth 3

$task = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/tasks" -Method Post -Headers $headers -Body $body
$taskGid = $task.data.gid
Write-Output "Created test task: $taskGid"
```

### Step 3: Move Task to Stage 6
```powershell
$sectionGid = "1212791395605236"
$body = @{ data = @{ task = $taskGid } } | ConvertTo-Json
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/sections/$sectionGid/addTask" -Method Post -Headers $headers -Body $body
Write-Output "Moved task to Stage 6 - webhook should fire"
```

### Step 4: Wait and Check
```powershell
Write-Output "Waiting 10 seconds for webhook processing..."
Start-Sleep -Seconds 10
```

### Step 5: Verify Base44 Case
Check Base44 for case with matching `asana_task_gid`.
(This requires Base44 API or manual check)

### Step 6: Verify Asana Comment
```powershell
$stories = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/tasks/$taskGid/stories" -Headers $headers
$linkComment = $stories.data | Where-Object { $_.text -like "*CASE LINKED*" }
if ($linkComment) {
    Write-Output "Asana comment: FOUND"
} else {
    Write-Output "Asana comment: NOT FOUND"
}
```

## Report Format

```
## Webhook End-to-End Test Results

**Test Time:** [timestamp]
**Test Task GID:** [gid]

| Step | Result | Time |
|------|--------|------|
| Create/Select Task | [PASS/FAIL] | Xms |
| Move to Stage 6 | [PASS/FAIL] | Xms |
| n8n Execution | [PASS/FAIL/UNKNOWN] | Xs |
| Base44 Case Created | [PASS/FAIL] | - |
| Asana Comment Posted | [PASS/FAIL] | - |

**Overall:** [PASS/FAIL]
**Total Time:** X seconds

### Next Steps (if failed)
- [Troubleshooting suggestions based on which step failed]
```

## Notes
- This skill requires n8n to be set up first
- If n8n not ready, skill will report "Prerequisites not met"
- Test results saved to `temp/webhook_test_results.txt`

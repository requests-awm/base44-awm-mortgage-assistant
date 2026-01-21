---
name: test-api
description: Test Base44 or Asana API endpoints with sample data
allowed-tools: Bash, Read, Write
---

# Test API Skill

Test Base44 or Asana API endpoints to verify connectivity and responses.

## What This Skill Does

1. **Asks which API to test** (Base44 or Asana)
2. **Runs a test request** using PowerShell
3. **Saves response** to `temp/api_test_response.json`
4. **Reports success/failure** with details

## API Endpoints

### Base44 - Create Case Endpoint
```powershell
$body = @{
    asana_task_gid = "TEST-" + (Get-Random -Maximum 999999)
    asana_project_gid = "1212782871770137"
    case_reference = "AWM-TEST-" + (Get-Date -Format "yyyyMMdd-HHmmss")
    client_name = "API Test Client"
    client_email = "test@example.com"
    case_type = "case"
    case_status = "incomplete"
    created_from_asana = $true
    stage = "intake_received"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{ api_key = "3ceb0486ed434a999e612290fe6d9482" }

$response | ConvertTo-Json | Out-File "temp/api_test_response.json"
```

### Asana - List Webhooks
```powershell
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
$response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks?workspace=1205556174146758" -Headers $headers
$response | ConvertTo-Json -Depth 5 | Out-File "temp/api_test_response.json"
```

### Asana - Get Task Details
```powershell
$taskGid = "TASK_GID_HERE"
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
$response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/tasks/$taskGid" -Headers $headers
$response | ConvertTo-Json -Depth 5 | Out-File "temp/api_test_response.json"
```

## Instructions

1. Ask user which API to test (Base44 create case, Asana webhooks, Asana task)
2. Run the appropriate PowerShell command
3. Save response to `temp/api_test_response.json`
4. Report: success/failure, response status, key data returned
5. If error, provide troubleshooting suggestions

---
name: validate-config
description: Validate all API keys, GIDs, and configuration values are correct
allowed-tools: Bash, Read
---

# Validate Config Skill

Check that all API credentials and configuration values are valid and working.

## What This Skill Does

1. **Reads CLAUDE.md** for configuration values
2. **Tests each credential/endpoint:**
   - Asana PAT (can list projects)
   - Base44 API key (endpoint responds)
   - Project/Section GIDs (exist in Asana)
3. **Reports validation results**

## Validation Checks

### 1. Asana PAT Validation
```powershell
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
try {
    $response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/users/me" -Headers $headers
    Write-Output "Asana PAT: VALID - User: $($response.data.name)"
} catch {
    Write-Output "Asana PAT: INVALID - $($_.Exception.Message)"
}
```

### 2. Asana Project GID Validation
```powershell
$projectGid = "1212782871770137"
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
try {
    $response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/projects/$projectGid" -Headers $headers
    Write-Output "Project GID: VALID - Name: $($response.data.name)"
} catch {
    Write-Output "Project GID: INVALID - $($_.Exception.Message)"
}
```

### 3. Asana Section GID Validation
```powershell
$sectionGid = "1212791395605236"
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
try {
    $response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/sections/$sectionGid" -Headers $headers
    Write-Output "Section GID (Stage 6): VALID - Name: $($response.data.name)"
} catch {
    Write-Output "Section GID: INVALID - $($_.Exception.Message)"
}
```

### 4. Base44 Endpoint Check
```powershell
# Just check if endpoint is reachable (don't create actual case)
try {
    $response = Invoke-WebRequest -Uri "https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n" -Method Options -UseBasicParsing
    Write-Output "Base44 Endpoint: REACHABLE"
} catch {
    Write-Output "Base44 Endpoint: Status $($_.Exception.Response.StatusCode)"
}
```

## Instructions

1. Run each validation check in sequence
2. Collect results into a summary table:

```
## Configuration Validation Results

| Item | Status | Details |
|------|--------|---------|
| Asana PAT | [VALID/INVALID] | [user name or error] |
| TEST Project GID | [VALID/INVALID] | [project name or error] |
| Stage 6 Section GID | [VALID/INVALID] | [section name or error] |
| Base44 Endpoint | [REACHABLE/ERROR] | [status] |
| Base44 API Key | [UNTESTED] | Requires POST to test |

**Overall:** X/5 checks passed
```

3. If any checks fail, provide troubleshooting guidance
4. Save full results to `temp/config_validation.txt`

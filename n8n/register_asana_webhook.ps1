# =============================================================================
# ASANA WEBHOOK REGISTRATION SCRIPT
# =============================================================================
#
# This script registers your n8n webhook URL with Asana so that Asana
# sends events whenever tasks are added/moved in your project.
#
# BEFORE RUNNING:
# 1. Import the workflow into n8n
# 2. Activate the workflow
# 3. Copy the webhook URL from n8n (shown in the Webhook node)
# 4. Paste it below where it says "YOUR_N8N_WEBHOOK_URL"
#
# =============================================================================

# CONFIGURATION - UPDATE THESE VALUES
# -----------------------------------------------------------------------------

# Your n8n webhook URL (get this from n8n after importing and activating the workflow)
# It will look like: https://YOUR-N8N-INSTANCE.app.n8n.cloud/webhook/asana-mortgage-webhook
$N8N_WEBHOOK_URL = "YOUR_N8N_WEBHOOK_URL_HERE"

# Asana Operations API Token
$ASANA_TOKEN = "2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c"

# Asana Project GID (TEST board)
$PROJECT_GID = "1212782871770137"

# =============================================================================
# DO NOT MODIFY BELOW THIS LINE
# =============================================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ASANA WEBHOOK REGISTRATION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Validate webhook URL
if ($N8N_WEBHOOK_URL -eq "YOUR_N8N_WEBHOOK_URL_HERE" -or $N8N_WEBHOOK_URL -eq "") {
    Write-Host "ERROR: You must set your n8n webhook URL first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Import the workflow into n8n"
    Write-Host "2. Click on the 'Asana Webhook Receiver' node"
    Write-Host "3. Copy the 'Webhook URL' shown (Production URL)"
    Write-Host "4. Edit this script and paste the URL"
    Write-Host "5. Run this script again"
    Write-Host ""
    exit 1
}

Write-Host "Webhook URL: $N8N_WEBHOOK_URL" -ForegroundColor Green
Write-Host "Project GID: $PROJECT_GID" -ForegroundColor Green
Write-Host ""

# Check for existing webhooks first
Write-Host "Checking for existing webhooks..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ASANA_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $existingWebhooks = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks?workspace=1196527606498389" -Method Get -Headers $headers

    if ($existingWebhooks.data.Count -gt 0) {
        Write-Host ""
        Write-Host "Found existing webhooks:" -ForegroundColor Yellow
        foreach ($webhook in $existingWebhooks.data) {
            Write-Host "  - GID: $($webhook.gid)" -ForegroundColor Gray
            Write-Host "    Target: $($webhook.target)" -ForegroundColor Gray
            Write-Host "    Resource: $($webhook.resource.gid)" -ForegroundColor Gray
            Write-Host ""
        }

        Write-Host "Do you want to continue and create a new webhook? (y/n)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "y") {
            Write-Host "Cancelled." -ForegroundColor Red
            exit 0
        }
    } else {
        Write-Host "No existing webhooks found." -ForegroundColor Green
    }
} catch {
    Write-Host "Could not check existing webhooks: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create the webhook
Write-Host ""
Write-Host "Creating webhook..." -ForegroundColor Yellow

$webhookBody = @{
    data = @{
        resource = $PROJECT_GID
        target = $N8N_WEBHOOK_URL
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $webhookBody -ContentType "application/json"

    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "  WEBHOOK CREATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Webhook GID: $($response.data.gid)" -ForegroundColor Cyan
    Write-Host "Target URL:  $($response.data.target)" -ForegroundColor Cyan
    Write-Host "Resource:    $($response.data.resource.gid)" -ForegroundColor Cyan
    Write-Host "Active:      $($response.data.active)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Save this webhook GID in case you need to delete it later:" -ForegroundColor Yellow
    Write-Host $response.data.gid -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Go to your Asana TEST board"
    Write-Host "2. Move a task to Stage 6 (AI Triage Dashboard)"
    Write-Host "3. Check n8n execution history"
    Write-Host "4. Check Base44 'Incomplete Cases' tab"
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "  WEBHOOK CREATION FAILED" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. n8n workflow not active - make sure it's turned ON"
    Write-Host "2. Webhook URL incorrect - check it in n8n"
    Write-Host "3. n8n not responding - test the URL manually first"
    Write-Host ""
}

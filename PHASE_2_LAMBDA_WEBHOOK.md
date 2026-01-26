# Phase 2: Lambda Webhook Implementation (REVISED)

**Replaces:** Original "n8n Webhook Security" phase
**Decision:** Use AWS Lambda for Asana→Base44 webhook (not n8n, not Zapier)
**Rationale:** AI-agent friendly, terminal-based, version-controlled, instant execution

---

## Objective

Deploy Python Lambda function to receive Asana webhooks and create Base44 cases.

**Architecture:**
```
Asana (webhook trigger)
  ↓ POST to Lambda URL
AWS Lambda (Python function)
  ↓ Extract custom fields
  ↓ POST to Base44
Base44 (createCaseFromLambda.ts)
  ↓ Create MortgageCase entity
```

---

## Files to Create

### Lambda Side (AWS)
```
lambda/
├── lambda_function.py          # Main webhook handler
├── requirements.txt            # Dependencies (requests, boto3)
├── config.py                   # Environment config
└── deploy.sh                   # Deploy script
```

### Base44 Side
```
functions/
└── createCaseFromLambda.ts     # NEW - Lambda-specific endpoint
```

---

## Implementation Steps

### Step 1: Lambda Function Setup (30 min)

**lambda_function.py:**
```python
import json
import os
import hmac
import hashlib
import requests
from datetime import datetime

# Config from environment
ASANA_WEBHOOK_SECRET = os.environ['ASANA_WEBHOOK_SECRET']
BASE44_ENDPOINT = os.environ['BASE44_ENDPOINT']
BASE44_API_KEY = os.environ['BASE44_API_KEY']

def lambda_handler(event, context):
    # 1. Verify Asana webhook signature
    headers = event.get('headers', {})
    signature = headers.get('x-hook-signature')

    if not verify_asana_signature(event['body'], signature):
        return {'statusCode': 401, 'body': 'Invalid signature'}

    # 2. Parse Asana webhook
    payload = json.loads(event['body'])
    events = payload.get('events', [])

    # 3. Process each event
    for evt in events:
        if evt.get('action') == 'added' and evt.get('parent', {}).get('resource_type') == 'project':
            task_gid = evt['resource']['gid']
            process_task(task_gid)

    return {'statusCode': 200, 'body': 'OK'}

def verify_asana_signature(body, signature):
    expected = hmac.new(
        ASANA_WEBHOOK_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

def process_task(task_gid):
    # Fetch task details from Asana
    # Extract custom fields
    # POST to Base44
    pass  # Implementation in deployment
```

**requirements.txt:**
```
requests==2.31.0
```

**deploy.sh:**
```bash
#!/bin/bash
zip -r function.zip lambda_function.py config.py
aws lambda update-function-code \
  --function-name asana-webhook \
  --zip-file fileb://function.zip
```

### Step 2: Base44 Function (15 min)

**functions/createCaseFromLambda.ts:**
```typescript
import { Application } from "https://deno.land/x/base44/mod.ts";

const app = new Application();

app.functions.http("/createCaseFromLambda", async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, api_key",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { asana_task_gid, client_name, client_email, insightly_id, broker_appointed, internal_introducer } = body;

    // Verify API key
    const apiKey = req.headers.get("api_key");
    if (apiKey !== Deno.env.get("BASE44_API_KEY")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Create case
    const newCase = await app.asServiceRole.entities.MortgageCase.create({
      asana_task_gid,
      client_name,
      client_email,
      insightly_id,
      broker_appointed,
      internal_introducer,
      case_status: "incomplete",
      created_from_asana: true,
    });

    return new Response(JSON.stringify({ success: true, case_id: newCase.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

export default app;
```

### Step 3: AWS Setup (15 min)

**Terminal commands:**
```bash
# Configure AWS CLI
aws configure

# Create Lambda function
aws lambda create-function \
  --function-name asana-webhook \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip

# Add API Gateway trigger (get webhook URL)
aws apigatewayv2 create-api \
  --name asana-webhook-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:region:account:function:asana-webhook

# Set environment variables
aws lambda update-function-configuration \
  --function-name asana-webhook \
  --environment Variables="{
    ASANA_WEBHOOK_SECRET=your-secret,
    BASE44_ENDPOINT=https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromLambda,
    BASE44_API_KEY=3ceb0486ed434a999e612290fe6d9482
  }"
```

### Step 4: Testing (15 min)

**Test locally:**
```bash
cd lambda
python lambda_function.py
```

**Test deployed:**
```bash
# Trigger test Asana webhook
curl -X POST https://your-lambda-url.amazonaws.com \
  -H "x-hook-signature: test-signature" \
  -d '{"events": [{"action": "added", "resource": {"gid": "12345"}}]}'

# Check CloudWatch logs
aws logs tail /aws/lambda/asana-webhook --follow
```

---

## Success Criteria

- [ ] Lambda function deployed to AWS
- [ ] Base44 createCaseFromLambda.ts deployed
- [ ] Asana webhook pointing to Lambda URL
- [ ] Test task creation successful (Asana → Lambda → Base44)
- [ ] CloudWatch logs show successful execution
- [ ] Error handling tested (invalid signature, missing fields)

---

## Debugging with AI Agent

**When something breaks:**
```bash
# I can run these with you:
aws logs tail /aws/lambda/asana-webhook --follow
aws lambda get-function --function-name asana-webhook
aws lambda invoke --function-name asana-webhook out.json
```

**I can:**
- Read CloudWatch logs via terminal
- Edit lambda_function.py directly
- Redeploy with `bash deploy.sh`
- Test with curl commands

**I cannot:**
- Click through AWS Console UI
- Debug Zapier visual flows
- Read n8n workflow screenshots

---

## Estimated Time

- Lambda function code: 20 min
- Base44 function: 15 min
- AWS setup: 15 min
- Testing: 15 min
- **Total: ~1 hour**

---

## Cost

- AWS Lambda free tier: 1M requests/month
- At 50 tasks/month: **$0/month**
- After free tier: ~$0.20/month

---

## Phase 2 Fits Into Orchestration

**Original Phase 2:** "n8n Webhook Security" - Add HMAC signature to n8n→Base44
**Revised Phase 2:** "Lambda Webhook Implementation" - Deploy Lambda with security built-in

**What changed:**
- Platform: n8n → AWS Lambda
- Security: HMAC built into Lambda from day 1
- Deployment: Visual builder → Terminal/CLI
- Debugging: Screenshots → CloudWatch logs + AI agent

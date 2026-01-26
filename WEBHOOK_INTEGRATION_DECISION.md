# Webhook Integration Architecture Decision

**Date:** 2026-01-22
**Decision Owner:** Marko
**Status:** Under Review

---

## Executive Summary

**Question:** Should we use n8n, Zapier, or Python for Asana → Base44 webhook integration?

**TL;DR Recommendation:** **Use n8n Cloud** with fallback monitoring

**Rationale:**
- You're most comfortable with n8n (faster implementation, easier debugging)
- Cloud-hosted reduces maintenance overhead
- Reliability can be ensured with proper error handling + monitoring
- Base44 webhook quirks are manageable with documented workarounds
- Board changes rarely (no need for over-engineered flexibility)

---

## The Problem: Base44 Webhook Limitations

### Base44 Platform Quirks (Documented)

From our codebase analysis:

1. **No Nested API Paths**
   ```
   ❌ FAILS: /api/asana/webhook
   ✅ WORKS: /api/asanaWebhook
   ```

2. **Function Naming Restrictions**
   - Function file must match endpoint name exactly
   - Example: `createCaseFromN8n.ts` → `/api/apps/{appId}/functions/createCaseFromN8n`

3. **No localStorage in Frontend**
   - Backend functions are fine
   - Frontend components can't use browser localStorage

4. **CORS Must Be Explicit**
   - Every function must define CORS headers
   - Wildcard origins allowed but must be declared

5. **Service Role Required for Backend CRUD**
   - User-authenticated calls may fail
   - Use `base44.asServiceRole.entities.MortgageCase.create()`

### What This Means for Webhooks

**Good News:**
- Base44 **DOES support incoming webhooks** (we have working `createCaseFromN8n.ts`)
- Base44 **DOES support CORS** for external callers (n8n, Zapier, Python all work)
- Base44 **DOES support POST requests** with JSON bodies

**Bad News:**
- Endpoint must be flat path (no `/asana/webhook` nesting)
- Must handle CORS manually (not auto-configured)
- No built-in webhook signature verification (must implement manually)

**Verdict:** Base44's webhook limitations are **annoying but not blockers**. The current `createCaseFromN8n.ts` already works around all quirks.

---

## Option 1: n8n Cloud ⭐ RECOMMENDED

### Architecture
```
Asana (Webhook Trigger)
  ↓ HTTP POST to n8n webhook URL
n8n Cloud (Workflow)
  ↓ Extract custom fields
  ↓ Transform data
  ↓ HTTP POST to Base44
Base44 (createCaseFromN8n.ts)
  ↓ Create MortgageCase entity
  ↓ Trigger case processing
Asana (Post comment via Base44)
```

### Pros
✅ **Visual workflow builder** - Easy to see data flow
✅ **Built-in error handling** - Retry logic, error notifications
✅ **Native Asana integration** - Pre-built Asana webhook trigger node
✅ **Cloud-hosted** - No server management needed
✅ **Debugging tools** - Execution logs, inspect payloads
✅ **You're most comfortable** - Faster to build and maintain
✅ **Webhook signature support** - Can sign requests to Base44 for security
✅ **Free tier available** - 5,000 workflow executions/month free
✅ **Board changes handled easily** - Visual mapping of Asana custom fields

### Cons
❌ **Recurring cost** - After free tier: ~$20/month for Cloud (vs. self-hosted free)
❌ **Vendor lock-in** - Workflow tied to n8n platform
❌ **Cold start latency** - Cloud functions may have 1-2 second delay on first run
❌ **Limited control** - Can't modify underlying infrastructure

### Reliability Strategy
1. **Error Handling:**
   - Configure retry on failure (3 attempts with exponential backoff)
   - Email/Slack notification on persistent failures
   - Fallback: Manual case creation via Base44 UI

2. **Monitoring:**
   - n8n execution history (track success/failure rates)
   - Base44 audit logs (verify cases created)
   - Weekly review of failed executions

3. **Redundancy:**
   - Keep Asana webhook active even if n8n fails
   - Cases can be created manually if automation breaks
   - Document manual fallback process

### Cost Analysis
- **Free Tier:** 5,000 executions/month (likely sufficient for mortgage cases)
- **Paid Tier:** $20/month for 20,000 executions (if volume grows)
- **Self-Hosted n8n:** $0/month but requires VPS ($5-10/month) + maintenance time

### Implementation Complexity: LOW
**Estimated Time:** 2-4 hours

**Steps:**
1. Sign up for n8n Cloud
2. Create workflow:
   - Trigger: Asana webhook
   - Node 1: Extract custom field GIDs (using existing mapping)
   - Node 2: Transform data to Base44 format
   - Node 3: HTTP POST to Base44 `createCaseFromN8n` endpoint
3. Configure error handling and retries
4. Test with sample Asana task
5. Deploy and monitor

---

## Option 2: Zapier

### Architecture
```
Asana (Trigger: New Task in Project)
  ↓ Zapier polls Asana API every 5-15 minutes
Zapier (Workflow)
  ↓ Extract custom fields via Asana API
  ↓ Format data
  ↓ HTTP POST to Base44
Base44 (createCaseFromN8n.ts - rename to createCaseFromZapier.ts)
  ↓ Create MortgageCase entity
```

### Pros
✅ **Easiest setup** - Drag-and-drop, no coding
✅ **Pre-built Asana integration** - Official Asana trigger
✅ **Cloud-hosted** - Zero infrastructure management
✅ **Extensive app integrations** - 6,000+ apps (if you expand later)
✅ **Reliable** - 99.9% uptime SLA on paid plans
✅ **Built-in error handling** - Auto-retry, email alerts

### Cons
❌ **Polling delay** - Checks Asana every 5-15 minutes (NOT instant webhooks on free tier)
❌ **More expensive** - Free tier: 100 tasks/month, Paid: $29.99/month for instant webhooks
❌ **Less flexible** - Harder to customize complex logic
❌ **Custom field extraction tricky** - Asana custom fields require extra steps
❌ **No webhook signatures** - Limited security options for Base44 calls

### Reliability Strategy
1. **Polling Frequency:**
   - Free tier: 15-minute polling (cases delayed up to 15 minutes)
   - Paid tier: Instant webhooks (requires $29.99/month plan)

2. **Error Handling:**
   - Auto-retry on failure (up to 3 attempts)
   - Email notifications on errors
   - Fallback: Manual case creation

3. **Monitoring:**
   - Zapier task history
   - Base44 audit logs

### Cost Analysis
- **Free Tier:** 100 tasks/month (insufficient for production)
- **Starter Plan:** $29.99/month (750 tasks/month, instant webhooks)
- **Professional Plan:** $73.50/month (2,000 tasks/month)

**Verdict:** More expensive than n8n for similar functionality.

### Implementation Complexity: VERY LOW
**Estimated Time:** 1-2 hours

**Steps:**
1. Sign up for Zapier
2. Create Zap:
   - Trigger: New task in Asana project (specify project GID)
   - Action: HTTP POST to Base44 (map custom fields manually)
3. Test with sample task
4. Deploy

---

## Option 3: Python Script (AWS Lambda / DigitalOcean Functions)

### Architecture
```
Asana (Webhook Trigger)
  ↓ HTTP POST to Lambda URL
AWS Lambda (Python Function)
  ↓ Verify Asana webhook signature
  ↓ Extract custom fields from payload
  ↓ Transform data
  ↓ HTTP POST to Base44 (with HMAC signature)
Base44 (createCaseFromN8n.ts - rename to createCase.ts)
  ↓ Verify Lambda signature
  ↓ Create MortgageCase entity
```

### Pros
✅ **Full control** - Complete customization, no platform limitations
✅ **Cheapest** - AWS Lambda free tier: 1M requests/month, $0.20 per 1M thereafter
✅ **No vendor lock-in** - Portable Python code, can move anywhere
✅ **Instant webhooks** - No polling delay like Zapier free tier
✅ **Security** - Can implement both Asana webhook verification AND Base44 HMAC signing
✅ **Scalable** - Handles spikes in volume automatically
✅ **Version control** - Code in Git, proper CI/CD possible

### Cons
❌ **More complex setup** - Requires coding, deployment, infrastructure knowledge
❌ **Maintenance burden** - You own the code, you fix the bugs
❌ **No visual debugging** - Must read logs (CloudWatch, etc.)
❌ **Cold start latency** - First request after idle may take 1-2 seconds
❌ **Requires AWS/cloud knowledge** - IAM roles, API Gateway, Lambda configuration
❌ **No built-in retry** - Must implement exponential backoff manually
❌ **Monitoring setup required** - CloudWatch alarms, error tracking, etc.

### Reliability Strategy
1. **Error Handling:**
   - Implement retry logic with exponential backoff
   - Dead letter queue (DLQ) for failed requests
   - CloudWatch alarms for error rate thresholds

2. **Monitoring:**
   - CloudWatch Logs (Lambda execution logs)
   - CloudWatch Metrics (invocation count, errors, duration)
   - SNS notifications for failures

3. **Redundancy:**
   - Multi-region deployment (optional, overkill for this use case)
   - Fallback: Manual case creation

### Cost Analysis
- **AWS Lambda Free Tier:** 1M requests/month + 400,000 GB-seconds compute
- **After Free Tier:** ~$0.20 per 1M requests + $0.0000166667 per GB-second
- **Expected Cost:** $0-5/month (likely $0 with free tier)

**Verdict:** Cheapest option, but highest complexity.

### Implementation Complexity: MODERATE-HIGH
**Estimated Time:** 6-10 hours (first time), 2-4 hours (if experienced)

**Steps:**
1. Write Python Lambda function:
   ```python
   import json
   import hmac
   import hashlib
   import requests
   from datetime import datetime

   ASANA_WEBHOOK_SECRET = os.environ['ASANA_WEBHOOK_SECRET']
   BASE44_ENDPOINT = os.environ['BASE44_ENDPOINT']
   BASE44_API_KEY = os.environ['BASE44_API_KEY']
   N8N_SIGNATURE_SECRET = os.environ['N8N_SIGNATURE_SECRET']

   def lambda_handler(event, context):
       # 1. Verify Asana webhook signature
       if not verify_asana_signature(event):
           return {'statusCode': 401, 'body': 'Invalid signature'}

       # 2. Parse Asana webhook payload
       payload = json.loads(event['body'])

       # 3. Extract custom fields
       task_gid = payload['events'][0]['resource']['gid']
       custom_fields = extract_custom_fields(task_gid)

       # 4. Transform to Base44 format
       base44_payload = {
           'asana_task_gid': task_gid,
           'client_name': custom_fields.get('1202694315710867'),
           'client_email': custom_fields.get('1202694285232176'),
           # ... other fields
       }

       # 5. Sign request to Base44
       signature = generate_hmac_signature(base44_payload)

       # 6. POST to Base44
       response = requests.post(
           BASE44_ENDPOINT,
           json=base44_payload,
           headers={
               'api_key': BASE44_API_KEY,
               'x-n8n-signature': signature
           }
       )

       return {'statusCode': 200, 'body': 'Success'}
   ```

2. Deploy to AWS Lambda:
   - Create Lambda function
   - Configure API Gateway trigger
   - Set environment variables
   - Deploy function

3. Configure Asana webhook:
   - Point to Lambda API Gateway URL
   - Verify webhook handshake

4. Test end-to-end

5. Set up monitoring (CloudWatch)

---

## Side-by-Side Comparison

| Criteria | n8n Cloud ⭐ | Zapier | Python Lambda |
|----------|------------|--------|---------------|
| **Setup Time** | 2-4 hours | 1-2 hours | 6-10 hours |
| **Monthly Cost** | $0-20 | $30-74 | $0-5 |
| **Reliability** | High (with monitoring) | Very High | High (if built correctly) |
| **Maintenance** | Low | Very Low | Moderate |
| **Flexibility** | High | Medium | Very High |
| **Debugging** | Easy (visual logs) | Easy (UI logs) | Moderate (CloudWatch) |
| **Webhook Delay** | Instant | Instant (paid) / 15min (free) | Instant |
| **Vendor Lock-in** | Medium | High | None |
| **Your Comfort** | **High** ✅ | Medium | High |
| **Board Change Adaptability** | High | Medium | High |
| **Security** | Good (can sign) | Limited | Excellent (full control) |
| **Scalability** | High | High | Very High |

---

## Recommendation: n8n Cloud with Monitoring ⭐

### Why n8n?

1. **You're most comfortable** - Fastest to build, debug, and maintain
2. **Reliability priority met** - With proper error handling + monitoring, can achieve 99%+ uptime
3. **Cloud-hosted** - Matches your preference for managed services
4. **Board changes rare** - Visual mapping is sufficient, no need for code-level flexibility
5. **Cost-effective** - Free tier likely covers your volume, $20/month is acceptable if needed
6. **Base44 quirks handled** - Already have working `createCaseFromN8n.ts` endpoint

### Implementation Plan

**Phase 1: Basic Integration (2-4 hours)**
1. Sign up for n8n Cloud (free tier)
2. Create workflow:
   - **Trigger:** Webhook (provides n8n webhook URL)
   - **Node 1:** Code (JavaScript) - Extract Asana custom fields
   - **Node 2:** HTTP Request - POST to Base44
3. Configure Asana webhook to point to n8n URL
4. Test with sample Asana task

**Phase 2: Security Hardening (1-2 hours)**
1. Add Asana webhook secret verification in n8n
2. Add HMAC signature to Base44 POST request
3. Update `createCaseFromN8n.ts` to verify signature (as planned in Phase 2 of main plan)

**Phase 3: Reliability & Monitoring (1-2 hours)**
1. Configure error handling:
   - Retry on failure (3 attempts, exponential backoff)
   - Error workflow: Log to Google Sheets / Send email notification
2. Set up monitoring:
   - Weekly review of n8n execution history
   - Monthly Base44 audit log review
3. Document manual fallback process

**Total Time:** 4-8 hours

### Fallback Strategy

If n8n proves unreliable after 1-2 months:

**Plan B: Python Lambda**
- Migrate workflow logic to Python script
- Deploy to AWS Lambda (can reuse Asana webhook URL with redirect)
- More control, same instant webhook capability
- Estimated migration time: 4-6 hours (since logic is already proven in n8n)

---

## Decision Matrix

### Choose n8n Cloud if:
✅ You want fastest time-to-production
✅ You prioritize ease of maintenance
✅ Visual debugging is important
✅ You're comfortable with $0-20/month cost
✅ **Board changes are rare (your case)**
✅ **You're most comfortable with n8n (your case)**

### Choose Zapier if:
✅ You want absolute simplest setup (drag-and-drop only)
✅ You need 6,000+ app integrations (future expansion)
✅ Budget allows $30-74/month
❌ **NOT recommended:** More expensive than n8n for same functionality

### Choose Python Lambda if:
✅ You want lowest cost ($0-5/month)
✅ You need maximum control and customization
✅ You have time for complex setup (6-10 hours)
✅ You want no vendor lock-in
❌ **NOT recommended for you:** Higher complexity, no strong advantage given your comfort with n8n

---

## Addressing Your Specific Concerns

### "Base44 had limits and was problematic with normal webhook integrations"

**Reality Check:**
- Base44 quirks are **path naming only**, not functionality blockers
- Current `createCaseFromN8n.ts` already works (we analyzed it)
- All three options (n8n, Zapier, Python) can call Base44 successfully
- **Verdict:** Base44 limits are annoying but manageable

### "The Asana board might be changing in the future"

**Impact Analysis:**
- **If custom fields change:** All three options require updates
  - n8n: Update field mapping in visual node (5-10 minutes)
  - Zapier: Update field mapping in UI (5-10 minutes)
  - Python: Update code and redeploy (10-20 minutes)
- **If project GID changes:** All three require updating webhook target
  - n8n: Update Asana webhook URL (2 minutes)
  - Zapier: Update trigger settings (2 minutes)
  - Python: Update Asana webhook URL (2 minutes)
- **Verdict:** All three handle changes similarly, n8n's visual interface makes it slightly easier

### "Should we use triggers inside Asana?"

**Clarification:**
- Asana **webhooks** (outbound) = Asana notifies external system when task changes ✅
- Asana **triggers** (inbound) = External system triggers Asana actions ❌ (not what you need)

**What you need:** Asana webhooks → n8n/Zapier/Python → Base44

**Setup:**
1. Create Asana webhook (one-time setup):
   ```bash
   POST https://app.asana.com/api/1.0/webhooks
   {
     "resource": "1212782871770137",  # Your TEST project GID
     "target": "https://your-n8n-webhook-url.com"
   }
   ```
2. Asana will POST to your n8n/Zapier/Python when tasks are created/updated
3. Your system processes and sends to Base44

**Verdict:** Asana webhooks are stable and reliable, perfect for this use case

---

## Action Items

### Immediate Next Steps (This Week)

1. **Sign up for n8n Cloud** (free tier): https://n8n.io/cloud/
2. **Read existing webhook code:**
   - `temp/base44-repo/functions/createCaseFromN8n.ts`
   - Understand what data it expects
3. **Create basic n8n workflow:**
   - Webhook trigger
   - Extract Asana custom fields
   - POST to Base44
4. **Test with sample Asana task** in TEST project (GID: 1212782871770137)

### Next Week

1. **Add security:** HMAC signature to Base44 requests
2. **Add monitoring:** Error notifications, execution logs
3. **Document:** n8n workflow screenshot + instructions in `n8n/` folder

### Future (After 1-2 Months of Testing)

1. **Evaluate reliability:** Review n8n execution history
2. **If issues:** Consider migrating to Python Lambda (Plan B)
3. **If working well:** Migrate to PROD project (GID: 1204991703151113)

---

## References

- **Current webhook code:** `temp/base44-repo/functions/createCaseFromN8n.ts`
- **Base44 API docs:** (if available from Base44 support)
- **Asana webhook docs:** https://developers.asana.com/docs/webhooks
- **n8n Asana integration:** https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.asana/
- **n8n HTTP Request node:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

---

## Appendix: Sample n8n Workflow (Pseudocode)

```javascript
// Workflow: Asana → Base44 Case Creation

// 1. WEBHOOK TRIGGER NODE
// Receives POST from Asana webhook
// Outputs: Full Asana task object

// 2. CODE NODE (JavaScript)
// Extract custom fields
const customFields = $input.item.json.data.custom_fields;

function getFieldValue(gid) {
  const field = customFields.find(f => f.gid === gid);
  return field?.text_value || field?.enum_value?.name || '';
}

const output = {
  asana_task_gid: $input.item.json.data.gid,
  client_name: getFieldValue('1202694315710867'),
  client_email: getFieldValue('1202694285232176'),
  insightly_id: getFieldValue('1202693938754570'),
  broker_appointed: getFieldValue('1211493772039109'),
  internal_introducer: getFieldValue('1212556552447200')
};

return output;

// 3. HTTP REQUEST NODE
// POST to Base44
URL: https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n
Method: POST
Headers:
  - api_key: 3ceb0486ed434a999e612290fe6d9482
  - Content-Type: application/json
Body: {{ $json }}

// 4. ERROR HANDLING (if Node 3 fails)
// Send email notification
// Log to Google Sheet
// Retry after 1 minute (max 3 retries)
```

---

## Conclusion

**Go with n8n Cloud.** It's the sweet spot for your requirements:
- Fast setup (2-4 hours)
- Reliable with proper monitoring
- You're most comfortable with it
- Cloud-hosted (your preference)
- Cost-effective ($0-20/month)
- Easy to maintain and adapt

Start simple, test thoroughly, then add security and monitoring. If reliability issues emerge after real-world testing, you can migrate to Python Lambda with minimal friction.

**Next Step:** Open a new Claude session with this decision document + orchestration brief, and let's build the n8n integration!

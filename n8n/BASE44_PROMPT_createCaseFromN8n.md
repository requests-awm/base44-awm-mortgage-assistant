# Base44 Prompt: Create n8n Webhook Endpoint

**Copy and paste this entire prompt into Base44's AI assistant:**

---

Create a new PUBLIC function called `createCaseFromN8n` that receives POST requests from n8n and creates MortgageCase records.

## Requirements:

1. **Function name must be exactly:** `createCaseFromN8n`
2. **Must be a PUBLIC endpoint** (callable from external services)
3. **Method:** POST only

## Expected JSON payload from n8n:

```json
{
  "asana_task_gid": "1234567890",
  "asana_project_gid": "1212782871770137",
  "asana_section": "1212791395605236",
  "case_reference": "AWM-2026-W001",
  "client_name": "John Smith",
  "client_email": "john@example.com",
  "insightly_id": "INS-123",
  "internal_introducer": "Jane Doe",
  "mortgage_broker_appointed": "Yes",
  "case_type": "case",
  "case_status": "incomplete",
  "created_from_asana": true,
  "stage": "intake_received"
}
```

## Function logic:

1. **Accept POST requests only** - Return 405 for other methods
2. **Parse the JSON body** from the request
3. **Check for duplicates** - Query MortgageCase where `asana_task_gid` equals the incoming `asana_task_gid`. If a case already exists, return success with message "Duplicate - case already exists" and include the existing case reference.
4. **Create new MortgageCase** with these fields mapped from the payload:
   - `reference` = payload.case_reference
   - `asana_task_gid` = payload.asana_task_gid
   - `asana_project_gid` = payload.asana_project_gid
   - `asana_section` = payload.asana_section
   - `client_name` = payload.client_name (default: "Unknown Client")
   - `client_email` = payload.client_email
   - `insightly_id` = payload.insightly_id
   - `internal_introducer` = payload.internal_introducer
   - `mortgage_broker_appointed` = payload.mortgage_broker_appointed
   - `case_type` = payload.case_type (default: "case")
   - `case_status` = payload.case_status (default: "incomplete")
   - `created_from_asana` = true
   - `stage` = payload.stage (default: "intake_received")
   - `asana_last_synced` = current timestamp

5. **Return JSON response:**
   - On success: `{ "success": true, "case_id": "<id>", "case_reference": "<ref>" }`
   - On duplicate: `{ "success": true, "message": "Duplicate", "existing_reference": "<ref>" }`
   - On error: `{ "success": false, "error": "<message>" }`

6. **Add CORS headers** for external access:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: POST, OPTIONS`

7. **Handle OPTIONS preflight** requests with 204 response

8. **Log all requests** with timestamp for debugging

## Important:
- This function will be called by n8n (external service)
- Must be PUBLIC/exposed as an endpoint
- The endpoint URL should be: `https://app.base44.com/api/695d6a9a166167143c3f74bb/createCaseFromN8n`

---

**End of prompt - paste everything above into Base44**

# SAFE WEBHOOK TESTING PLAN - Asana Integration

**Date:** 2026-01-19  
**Status:** SAFE - No active webhooks found  
**Next:** Create webhook on TEST board only

---

## ✅ CURRENT STATE VERIFIED

### Workspace Audit (Read-Only)
```
Workspace: ascotwm.com
Workspace GID: 666438144056
Active Webhooks: 0 (NONE)
```

**Result:** ✅ **Completely safe - nothing is triggering from Asana**

### TEST Board Verified
```
Project: "Mortgage Dynamic - TEST (WIP)"
Project GID: 1212782871770137
Stage 6 Section: "AI Triage Dashboard" (GID: 1212791395605236) ✅
Stage 7 Section: "AI Awaiting Client Response" (GID: 1212791395605238) ✅
```

**Result:** ✅ **TEST board is properly configured for webhook testing**

### Production Board Status
```
Project GID from docs: 1204991703151113
API Response: "Not a recognized ID"
```

**Result:** ⚠️ **Production board GID may be incorrect in documentation (GOOD - prevents accidental production testing)**

---

## 🎯 SAFE TESTING STRATEGY

### Phase 1: Webhook Creation (TEST ONLY)

**PowerShell Command (SAFE - TEST BOARD ONLY):**
```powershell
$headers = @{ "Authorization" = "Bearer 2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f" }
$webhookBody = @{
    data = @{
        resource = "1212782871770137"  # TEST board only
        target = "https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook"
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $webhookBody -ContentType "application/json"
```

**Safety Verification:**
- ✅ Uses TEST board GID (1212782871770137)
- ✅ NOT using production board
- ✅ Can be deleted easily if needed
- ✅ Isolated from real work

### Phase 2: Test with Single Task

**Create Test Task:**
1. Open TEST board: "Mortgage Dynamic - TEST (WIP)"
2. Create task: "TEST - John Smith - 123456 - Residential Purchase"
3. Fill custom fields:
   - Client Name: "John Smith"
   - Client Email: "test@example.com"
   - Insightly ID: "123456"
4. Move to section: "AI Triage Dashboard" (Stage 6)

**Expected Result:**
- Webhook fires within 10 seconds
- Base44 creates MortgageCase with `case_status: "incomplete"`
- Comment posted to Asana task
- Check Base44 logs for "Case created successfully"

### Phase 3: Verification (Read-Only)

**Check webhook status:**
```powershell
$webhookGid = "WEBHOOK_GID_FROM_STEP_1"
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks/$webhookGid" -Headers $headers
```

**Check Base44:**
- Query MortgageCase where `asana_task_gid = "TASK_GID"`
- Verify fields populated correctly
- Check `created_from_asana = true`

### Phase 4: Cleanup (If Needed)

**Delete webhook:**
```powershell
$webhookGid = "WEBHOOK_GID_FROM_STEP_1"
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks/$webhookGid" -Method Delete -Headers $headers
```

**Delete test task:**
- In Asana TEST board, delete the test task
- In Base44, delete the test MortgageCase

---

## 🚨 SAFETY RULES

### DO:
- ✅ Only create webhook on TEST board (1212782871770137)
- ✅ Prefix all test tasks with "TEST - "
- ✅ Use fake data (test@example.com, etc.)
- ✅ Delete test tasks after validation
- ✅ Check webhook status before creating new ones

### DON'T:
- ❌ Don't touch production board until TEST succeeds
- ❌ Don't use real client data in tests
- ❌ Don't create multiple webhooks (causes duplicates)
- ❌ Don't move real tasks through TEST board

---

## PRODUCTION ROLLOUT (LATER)

**Prerequisites:**
- [ ] 10+ successful tests on TEST board
- [ ] Zero errors in Base44 logs
- [ ] Assistant trained on workflow
- [ ] User guide created
- [ ] Correct production board GID identified

**Production Steps (NOT NOW):**
1. Find correct production board GID
2. Switch PAT to Operations Support account
3. Update Base44 environment variable
4. Create production webhook
5. Test with ONE real task (prefix "TEST")
6. Monitor for 1 week
7. Full rollout

---

## ROLLBACK PLAN

**If webhook causes issues:**
1. Delete webhook: `DELETE /webhooks/{webhook_gid}`
2. Revert to manual case creation
3. Fix issues on TEST board
4. Re-test before re-enabling

**Webhook deletion is instant - no cases are deleted.**

---

**Status:** Ready to execute Phase 1 (webhook creation on TEST board)  
**Risk Level:** LOW (isolated to TEST board, no production impact)  
**Next Action:** Wait for user approval to proceed

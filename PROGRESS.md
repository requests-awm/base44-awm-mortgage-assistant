# ASCOT MORTGAGE ASSISTANT - PROJECT PROGRESS

**Project:** Automated Mortgage Triage System
**Client:** Ascot Wealth Management
**Platform:** Base44 + n8n + Asana
**Last Updated:** 2026-01-21
**Overall Status:** ~70% Complete

---

## Status Legend

- [x] Complete
- [~] In Progress / Partial
- [ ] Not Started
- [!] Blocked / Has Issues

---

## EXECUTIVE SUMMARY

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1A: Webhook Integration | [~] | 60% |
| Phase 1B: Base44 UI (Intake Form) | [~] | 85% |
| Phase 1C: End-to-End Testing | [ ] | 0% |
| Phase 1D: Production Rollout | [ ] | 0% |
| Phase 2: Lender Matching & Triage | [ ] | 20% |
| Phase 3: n8n Rate Scraper | [ ] | Design only |
| Phase 4: Email Generation (Gemini) | [ ] | 0% |
| Phase 5: Fee Tracking | [ ] | 0% |

---

## PHASE 1A: ASANA → BASE44 WEBHOOK INTEGRATION

### Option A: Direct Base44 Webhook (Original Plan)
| Task | Status | Notes |
|------|--------|-------|
| Design webhook architecture | [x] | Documented in handover |
| Create `asanaWebhook` function in Base44 | [x] | Code written |
| Publish function as public endpoint | [x] | Endpoint available |
| Test endpoint directly (PowerShell) | [!] | 404 errors - see troubleshooting docs |
| Register webhook with Asana | [ ] | Blocked by 404 issue |
| Verify handshake succeeds | [ ] | Blocked |
| Test task → case creation | [ ] | Blocked |

### Option B: n8n Cloud Workflow (New Approach)
| Task | Status | Notes |
|------|--------|-------|
| Design n8n workflow architecture | [x] | 13 nodes planned |
| Create `createCaseFromN8n` Base44 function | [x] | Prompt ready |
| Deploy function to Base44 | [ ] | Needs manual action |
| Sign up for n8n Cloud | [ ] | |
| Build Node 1: Webhook Receiver | [ ] | |
| Build Node 2: Handshake Check (If) | [ ] | |
| Build Node 3: Handshake Response | [ ] | |
| Build Node 4: Action Check (If) | [ ] | |
| Build Node 5: Parse Event (Code) | [ ] | |
| Build Node 6: Should Process? (If) | [ ] | |
| Build Node 7: Get Task Details (Asana) | [ ] | |
| Build Node 8: Extract Custom Fields (Code) | [ ] | |
| Build Node 9: Create Case (HTTP to Base44) | [ ] | |
| Build Node 10: Post Comment (Asana) | [ ] | |
| Build Nodes 11-13: Response nodes | [ ] | |
| Connect all nodes | [ ] | |
| Activate workflow | [ ] | |
| Copy Production Webhook URL | [ ] | |
| Register webhook with Asana | [ ] | |
| Test end-to-end | [ ] | |

---

## PHASE 1B: BASE44 UI - INTAKE FORM

### Dashboard & Navigation
| Task | Status | Notes |
|------|--------|-------|
| Pipeline view with stage grouping | [x] | Working |
| Triage color badges on cards | [x] | Blue/Green/Yellow/Red |
| "Incomplete Cases" tab in navigation | [x] | Shows only incomplete + from_asana |
| "Complete Intake" button on incomplete cards | [x] | Links to form with case_id |

### Intake Form - Phase 1: Detection & Pre-fill
| Task | Status | Notes |
|------|--------|-------|
| Detect edit vs create mode (URL param) | [x] | `?case_id=xxx` detection |
| Fetch existing case data | [x] | Loads from MortgageCase entity |
| Pre-fill form fields with existing data | [x] | All fields populate |
| Dynamic form title (Edit vs Create) | [x] | Shows case reference |
| Dynamic submit button text | [x] | "Activate Case" vs "Create Case" |

### Intake Form - Phase 2: Validation & Highlighting
| Task | Status | Notes |
|------|--------|-------|
| Define 6 required fields | [x] | Name, Email, Value, Loan, Purpose, Category |
| Amber border on empty required fields | [x] | Visual feedback |
| Green border on filled fields | [x] | Visual feedback |
| Progress indicator (X/6 complete) | [x] | Shows completion status |
| Email validation (format) | [x] | name@domain.com |
| Phone validation (UK format) | [x] | 07xxx, +44xxx, 020xxx |
| Loan ≤ Property Value check | [x] | Prevents invalid LTV |
| Disable submit until valid | [x] | Button state management |

### Intake Form - Phase 3: Submit Logic
| Task | Status | Notes |
|------|--------|-------|
| Edit mode: Update MortgageCase | [~] | Code written, not persisting |
| Edit mode: Set status to 'active' | [!] | **BUG: Status not updating** |
| Edit mode: Set activated_at timestamp | [~] | Part of update call |
| Create mode: Create new MortgageCase | [x] | Working |
| Calculate LTV on submit | [x] | Derived field |
| Calculate loan-to-income on submit | [x] | Derived field |
| Success toast notification | [x] | Shows on submit |
| Redirect to dashboard | [x] | With highlight param |
| Error handling (network failures) | [x] | Toast + preserve data |
| Loading state during submit | [x] | Button disabled |

### Known Bug: Case Activation Not Persisting
| Investigation Step | Status | Finding |
|--------------------|--------|---------|
| Verify MortgageCase.update() is called | [ ] | Need console logging |
| Check field name matches entity schema | [ ] | Possible mismatch |
| Check for Base44 cache issues | [ ] | May need refresh |
| Test with real Asana-created case | [ ] | Blocked on webhook |

---

## PHASE 1C: END-TO-END TESTING

| Test Case | Status | Expected Result |
|-----------|--------|-----------------|
| Move task to Stage 6 in Asana | [ ] | Webhook fires |
| n8n receives webhook | [ ] | Execution logged |
| Base44 case created (incomplete) | [ ] | Shows in Incomplete tab |
| Asana comment posted | [ ] | "CASE LINKED" message |
| Open case in intake form | [ ] | Pre-fills data |
| Complete all 6 required fields | [ ] | Progress shows 6/6 |
| Click "Activate Case" | [ ] | Status changes to active |
| Case appears in pipeline | [ ] | Not in Incomplete tab |
| Triage calculated | [ ] | Color badge assigned |
| 3 consecutive successful tests | [ ] | Validates reliability |
| Webhook latency < 10 seconds | [ ] | Performance check |

---

## PHASE 1D: PRODUCTION ROLLOUT

| Task | Status | Notes |
|------|--------|-------|
| Update n8n workflow for production | [ ] | Change project GID |
| Get production Stage 6 section GID | [ ] | From live Asana board |
| Create production Asana credentials | [ ] | Operations PAT |
| Test with 1 production task | [ ] | Careful testing |
| Monitor for 24 hours | [ ] | Watch for errors |
| Document production webhook URL | [ ] | For team reference |
| Train assistants on new workflow | [ ] | User education |
| Go live announcement | [ ] | Notify team |

---

## PHASE 2: TRIAGE & LENDER MATCHING

### Triage Scoring
| Task | Status | Notes |
|------|--------|-------|
| Basic calculateTriage function | [x] | Exists but too lenient |
| LTV factor (weight: high) | [~] | Needs refinement |
| Income stability factor | [~] | Needs refinement |
| Credit history factor | [~] | Needs refinement |
| Loan-to-income ratio factor | [~] | Needs refinement |
| Urgency factor | [ ] | Not implemented |
| Triage UI display (colored borders) | [x] | Working |
| Triage factors explanation | [ ] | Show why rating given |

### Lender Matching
| Task | Status | Notes |
|------|--------|-------|
| Lender database (8 lenders) | [x] | Populated |
| matchLenders function logic | [ ] | Designed, not coded |
| Filter by max_ltv | [ ] | |
| Filter by accepted_income_types | [ ] | |
| Filter by accepted_property_types | [ ] | |
| Filter by credit_issues acceptance | [ ] | |
| Display matched lenders on case | [ ] | UI component needed |
| Sort by best rate | [ ] | Requires rate data |

---

## PHASE 3: N8N RATE SCRAPER

| Task | Status | Notes |
|------|--------|-------|
| Design scraper workflow | [x] | In scraper_technical_spec.md |
| Apify Cheerio scraper setup | [ ] | Moneyfacts source |
| n8n transform node | [ ] | Parse raw HTML |
| Google Sheets connection | [ ] | Spreadsheet ready |
| Filter LTV to 60/75/85/95 only | [ ] | Base44 constraint |
| Validation rules | [ ] | Reject invalid data |
| Failed Scrapes logging | [ ] | Separate sheet tab |
| Weekly schedule (Sunday 7:30 AM) | [ ] | Cron trigger |
| Test scraper run | [ ] | |
| Connect rates to lender matching | [ ] | |

---

## PHASE 4: EMAIL GENERATION (GEMINI)

| Task | Status | Notes |
|------|--------|-------|
| Set up Gemini API key | [ ] | Gemini 2.0 Flash |
| Create email generation function | [ ] | |
| Remortgage template | [ ] | |
| Purchase template | [ ] | |
| BTL template | [ ] | |
| Include live rates in email | [ ] | From scraper |
| Anonymise lender names | [ ] | "Lender A" pre-acceptance |
| Human approval workflow | [ ] | FCA requirement |
| 24-hour delay default | [ ] | FCA requirement |
| Email preview UI | [ ] | |
| Send via Zapier | [ ] | Existing integration |

---

## PHASE 5: FEE TRACKING

| Task | Status | Notes |
|------|--------|-------|
| Fee fields on MortgageCase | [ ] | Schema update |
| Withdrawal reason capture | [ ] | Dropdown options |
| Fee status tracking | [ ] | pending/invoiced/paid/waived |
| Fee dashboard view | [ ] | Filter by fee status |
| Invoice generation | [ ] | |
| Fee recovery reports | [ ] | Monthly totals |

---

## FUTURE FEATURES (Mark's Requests)

| Feature | Priority | Status |
|---------|----------|--------|
| Client acceptance/fee disclosure | P2 | [ ] Designed |
| Lender name reveal after acceptance | P2 | [ ] Designed |
| Lender BDM communication agent | P3 | [ ] Concept only |
| Proactive database outreach agent | P3 | [ ] Concept only |
| Insightly CRM pre-fill | P3 | [ ] API available |
| Bidirectional Asana sync | P3 | [ ] Not designed |

---

## TECHNICAL DEBT & IMPROVEMENTS

| Item | Priority | Status |
|------|----------|--------|
| Fix case activation bug | P0 | [ ] Investigating |
| Resolve Base44 webhook 404 | P1 | [x] Switched to n8n approach |
| Add console logging for debugging | P1 | [ ] |
| Refine triage scoring weights | P2 | [ ] |
| Add error boundary components | P3 | [ ] |
| Mobile responsiveness testing | P3 | [ ] |

---

## KEY REFERENCE VALUES

### Asana
| Item | Value |
|------|-------|
| TEST Project GID | `1212782871770137` |
| PRODUCTION Project GID | `1204991703151113` |
| Stage 6 Section GID (TEST) | `1212791395605236` |
| Operations PAT | `2/1205556174146758/1210879318362399:...` |

### Base44
| Item | Value |
|------|-------|
| App ID | `695d6a9a166167143c3f74bb` |
| n8n Endpoint | `https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/.../functions/createCaseFromN8n` |
| API Key | `3ceb0486ed434a999e612290fe6d9482` |

### Custom Field GIDs
| Field | GID |
|-------|-----|
| Client Name | `1202694315710867` |
| Client Email | `1202694285232176` |
| Insightly ID | `1202693938754570` |
| Broker Appointed | `1211493772039109` |
| Internal Introducer | `1212556552447200` |

### External Services
| Service | Status | Monthly Cost |
|---------|--------|--------------|
| Zapier | Active | ~$50 |
| Apify | Ready | ~$0.40 |
| n8n Cloud | Not set up | Free tier |
| Gemini API | Not configured | ~$20 budget |

---

## SESSION LOG

| Date | Session Focus | Outcome |
|------|--------------|---------|
| 2026-01-19 | Initial setup, webhook design | Webhook endpoint created |
| 2026-01-20 | Intake form phases 1-3 | Pre-fill & validation complete |
| 2026-01-20 | Base44 webhook 404 debugging | Switched to n8n approach |
| 2026-01-20 | n8n workflow design | Full spec documented |
| 2026-01-21 | Progress tracking setup | This file created |

---

## NEXT ACTIONS (PRIORITIZED)

### Immediate (Unblock the pipeline)
1. [ ] Deploy `createCaseFromN8n` function to Base44
2. [ ] Sign up for n8n Cloud
3. [ ] Build n8n workflow (13 nodes)
4. [ ] Activate workflow and get webhook URL
5. [ ] Register webhook with Asana TEST board

### After Webhook Works
6. [ ] Test end-to-end flow (Asana → Base44)
7. [ ] Debug case activation bug with real data
8. [ ] Complete 3 successful test cases

### This Week
9. [ ] Implement lender matching function
10. [ ] Refine triage scoring
11. [ ] Production rollout (with careful testing)

---

## DOCUMENTS REFERENCE

| Document | Purpose |
|----------|---------|
| [PROJECT_BRIEF_AND_PRD.md](PROJECT_BRIEF_AND_PRD.md) | Full requirements & specs |
| [AGENTS.md](AGENTS.md) | AI agent operating instructions |
| [n8n/N8N_WORKFLOW_BUILD_INSTRUCTIONS.md](n8n/N8N_WORKFLOW_BUILD_INSTRUCTIONS.md) | Node-by-node build guide |
| [n8n/N8N_SETUP_GUIDE.md](n8n/N8N_SETUP_GUIDE.md) | Setup & testing guide |
| [prompts/PHASE_4_SUBMIT_ACTIONS.md](prompts/PHASE_4_SUBMIT_ACTIONS.md) | Form submit logic |
| [docs/scraper_technical_spec.md](docs/scraper_technical_spec.md) | Rate scraper design |

---

**Document Owner:** Sam (Technical Lead)
**Last Updated:** 2026-01-21

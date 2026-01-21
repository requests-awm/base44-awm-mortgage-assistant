# BASE44 MORTGAGE SYSTEM - PROJECT HANDOVER DOCUMENT

**Project Name:** Ascot Wealth Management - Automated Mortgage Triage System  
**Platform:** Base44 (Low-Code)  
**Handover Date:** 2026-01-19  
**Status:** Phase 1 (60-70% Complete) | n8n Scraper (95% Complete, Pending Import)  
**Next AI Task:** Complete n8n scraper import, test, and connect to Base44 knowledge base

---

## EXECUTIVE SUMMARY

### What We're Building
An AI-powered mortgage case management system to handle 500+ monthly client inquiries without proportional hiring. The system reduces manual work from **30 minutes to 5-7 minutes per case** through automated triage, lender matching, and proposal generation.

### Business Impact
- **Time Savings:** 56-77% reduction in case processing time
- **Revenue Protection:** £3-10k/month fee recovery through automated tracking
- **Scalability:** 10x capacity increase without hiring
- **Compliance:** FCA-compliant with mandatory human approval gates

### Current Priority
**Complete the n8n mortgage rate scraper** and integrate scraped data with Base44's Lender knowledge base to enable dynamic lender matching in the proposal generator.

---

## PROJECT ARCHITECTURE

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Base44 (Low-Code Platform) | Dashboard, forms, case management UI |
| **AI Generation** | Gemini 2.0 Flash API | Email generation, proposal drafting |
| **Automation** | Zapier (179 workflows) | Email delivery, reply capture, invoicing |
| **Data Orchestration** | n8n | Rate scraping, transformation, sheet updates |
| **Data Scraping** | Apify Cheerio Scraper | Moneyfacts mortgage product scraping |
| **Data Storage** | Google Sheets API v4 | Mortgage rate repository (1,200+ products) |
| **Task Management** | Asana API v1.0 | Bidirectional sync with Base44 cases |
| **CRM** | Insightly | Client data pre-fill (future integration) |

### Data Model (Base44 Entities)

```
MortgageCase
├─ case_type: "lead" | "case"
├─ case_status: "incomplete" | "active" | "closed"
├─ asana_task_gid: string (Asana task ID)
├─ asana_project_gid: string
├─ triage_rating: "Blue" | "Green" | "Yellow" | "Red"
├─ triage_factors: array (e.g., ["High LTV", "Self-employed"])
├─ triage_last_calculated: datetime
├─ matched_lenders: array (e.g., ["Barclays", "Santander"])
├─ client_replied: boolean
├─ last_client_reply_at: datetime
├─ fee_applicable: boolean
├─ fee_status: "pending" | "invoiced" | "paid" | "waived"
└─ withdrawal_reason: string

ProposalDraft
├─ lender_a/b/c: object { name, rate, fees, ERC }
├─ recommended_option: "A" | "B" | "C"
├─ reasoning: string
├─ email_body: string (Gemini-generated)
├─ generated_at: datetime
└─ version: integer

CommunicationLog
├─ direction: "sent" | "received" | "note"
├─ email_provider_id: string (Gmail message ID)
├─ requires_action: boolean
└─ action_taken_at: datetime

Fee
├─ amount: number (default £750)
├─ status: "pending" | "invoiced" | "paid" | "waived"
├─ invoice_number: string
└─ payment_due_date: date

AsanaSyncLog
├─ event_type: string (e.g., "task_created", "comment_added")
├─ sync_direction: "asana_to_base44" | "base44_to_asana"
├─ payload: object
├─ response: object
└─ status: "success" | "failed"
```

---

## CURRENT STATE - DETAILED BREAKDOWN

### Phase 1: Core Features (60-70% Complete)

#### ✅ Working Features

1. **Dashboard Pipeline View**
   - Stage grouping (New Leads → Closed/Won)
   - Colored left borders for triage (Blue/Green/Yellow/Red)
   - Case filtering and search

2. **Lender Database**
   - 8 lenders configured
   - Criteria fields (max LTV, income types, property types)

3. **Intake Form (4-Step)**
   - Step 1: Client Details (name, email, phone)
   - Step 2: Mortgage Details (property value, loan amount, purpose)
   - Step 3: Financials (income, employment type, credit history)
   - Step 4: Timing (purchase date, urgency)

4. **Triage Backend**
   - `calculateTriage` function created
   - Scoring based on LTV, income stability, complexity
   - Factor identification (array of reasons)

5. **Triage UI**
   - Visual indicators on case cards
   - Left border color coding

6. **Report Draft Editor**
   - Manual 3-lender proposal input
   - Regenerate/save functionality
   - Version tracking

7. **Asana Webhook Endpoint**
   - Published: `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`
   - Handshake verification logic built
   - Duplicate prevention (checks `asana_task_gid`)

#### ⚠️ Needs Fixing

1. **Triage Scoring Too Lenient**
   - Issue: Doesn't penalize high LTV + low income combinations properly
   - Currently assigns "Green" to cases that should be "Yellow"
   - Complexity vs urgency conflated

2. **Triage Labels Confusing**
   - "Urgent" should mean time-sensitive, not complex
   - "Complex" should be separate dimension

3. **Time Sensitivity Conflation**
   - Purchase date urgency mixed with case complexity scoring

#### ❌ Not Yet Built

1. **Live Triage in Intake Form**
   - Real-time feedback as user fills form
   - Dynamic lender count preview ("6+ lenders available")

2. **Lender Matching Function**
   - `matchLenders` function not created
   - Logic defined but not implemented
   - Needs: LTV tolerance check, income type compatibility, property type filtering

3. **Email Status Icons**
   - Dashboard doesn't show sent/received/pending status
   - Requires CommunicationLog integration

4. **Email Reporting Dashboard**
   - Analytics page not built
   - Metrics: Open rate, reply time, conversion

5. **Client Reviews Page**
   - Post-completion feedback collection

6. **Insightly Pre-Fill**
   - CRM data auto-population in intake form

7. **Asana Bidirectional Sync**
   - Webhook endpoint ready, but webhook not created yet
   - Command ready to execute (see "Immediate Actions" below)

---

### n8n Mortgage Rate Scraper (95% Complete - CURRENT PRIORITY)

#### ✅ Completed

1. **Apify Scraper Configuration**
   - Actor ID: `YJCnS9qogi9XxDgLB`
   - Target: Moneyfacts website
   - LTV Filter: 60%, 75%, 85%, 95% ONLY (critical: Base44 breaks with 70/80%)
   - Deduplication: Lender + Product + LTV (unique constraint)
   - Performance: 19 products in ~25 seconds
   - Success Rate: 100% (3/3 test runs)
   - Dataset API: `https://api.apify.com/v2/datasets/8P1Dzm5nBmcBd4ELt/items`

2. **n8n Workflow Design** (6 Nodes)
   - Node 1: Schedule Trigger (Cron: `30 7 * * 0` - Sunday 7:30 AM UK)
   - Node 2: HTTP Request (Fetch Apify dataset)
   - Node 3: Code Transform (JSON → 2D array for Sheets)
   - Node 4: Google Sheets Update (Range A1:K1000)
   - Node 5: IF Validation (rowCount >= 15)
   - Node 6: Error Logger (Failed Scrapes log)

3. **Data Schema**
   - Input: Apify JSON (11 fields)
   - Output: Google Sheets (11 columns)
   - Headers: `Scrape Date | Lender | Product Type | LTV | Rate (%) | APRC (%) | Product Fee (£) | Monthly Payment (£) | Initial Period (months) | Product Name | Source URL`

4. **Google Sheets Structure**
   - Spreadsheet ID: `1XuK8iFxKUrWjHN1-TCTXEQzS0lfsK20ElAwSraRB2OQ`
   - Sheet 1: "Latest Rates" (data range A2:K1000)
   - Sheet 2: "Failed Scrapes" (error log, append-only)
   - Sheet 3: "History" (future: 90-day archive)

5. **Validation Logic**
   - Minimum 15 data rows required (expected 18-20)
   - Falls back to error logging if <15 rows

#### ⏳ Pending (BLOCKING NEXT STEPS)

1. **n8n Workflow Import**
   - Workflow JSON not yet created
   - Needs to be generated and imported into n8n instance

2. **Credential Setup**
   - HTTP Header Auth: `Authorization: Bearer apify_api_PgWMhaYTmDbjJIo8pwqUJ7IIMszJy61kTQ2A`
   - Google Sheets OAuth2: Connect Google account

3. **Test Execution**
   - Verify 19 rows populate sheet
   - Check data quality (LTV values, no duplicates)

4. **Schedule Activation**
   - Enable cron trigger for production

#### ❌ Not Started (KNOWLEDGE BASE INTEGRATION - CRITICAL)

**This is the key blocker for proposal generation.**

1. **Base44 Knowledge Base Connection**
   - Current gap: Scraped rates in Google Sheets, but Base44 can't access them
   - Needed: API integration to read Sheets data into Base44
   - Options:
     - **Option A:** Base44 makes HTTP requests to Google Sheets API v4
     - **Option B:** n8n pushes to Base44 webhook after each scrape
     - **Option C:** Hybrid (Sheets + Base44 Lender entity update)

2. **Rate Filtering by Client LTV**
   - Function to query: "Show me all 75% LTV products"
   - Needs access to "Latest Rates" sheet

3. **Proposal Email Generation**
   - Gemini API integration (NOT Claude - cost reasons)
   - Template: 3-lender comparison table
   - Requires: Lender matching + rate data access

---

## ASANA INTEGRATION (READY TO DEPLOY)

### ✅ Setup Complete

1. **Test Board Created**
   - Project: "Mortgage Dynamic - TEST (WIP)"
   - GID: `1212782871770137`
   - Sections:
     - Stage 6: AI Triage Dashboard (GID: `1212782871770139`)
     - Stage 7: Awaiting Client Reply (GID: `1212782871770141`)

2. **Custom Fields Mapped**
   - Client Name (GID: `1212365108931088`)
   - Email Address (GID: `1212365108931090`)
   - Insightly ID (GID: `1212777746644346`)
   - Case Type (GID: `1212777746644348`)
   - Triage Rating (GID: `1212784239749476`)

3. **Environment Variables Set**
   - `ASANA_PAT`: `2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f`
   - `ASANA_TEST_PROJECT_GID`: `1212782871770137`

4. **Webhook Endpoint Published**
   - URL: `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`
   - Logic: Handshake verification, duplicate prevention, case creation

### 📋 Immediate Action Required

**Create Asana Webhook** (Command ready to execute):

```powershell
$headers = @{ "Authorization" = "Bearer 2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f" }
$webhookBody = @{
    data = @{
        resource = "1212782871770137"
        target = "https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook"
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $webhookBody -ContentType "application/json"
```

**Expected Response:**
```json
{
  "data": {
    "gid": "1234567890123456",
    "resource": "1212782871770137",
    "target": "https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook",
    "active": true
  }
}
```

### Workflow After Webhook Creation

```
Asana Stage 6 (New Task Created)
  ↓
Webhook fires → Base44 receives payload
  ↓
Base44 checks: asana_task_gid exists?
  ├─ YES → Skip (duplicate)
  └─ NO → Create MortgageCase (status: "incomplete")
       ↓
       Assistant completes intake form
       ↓
       Auto-calculate triage
       ↓
       Send initial email (Gemini-generated)
       ↓
       Move task to Stage 7 (Awaiting Client)
```

---

## DESIGN & COMPLIANCE RULES

### UI/UX Guidelines

- **Aesthetic:** Minimal Apple-inspired design
- **Colors:** Deep Navy (#0E1B2A), Gold (#D1B36A)
- **Triage Indicators:**
  - Blue (Quick Win): 4px left border, #2563EB
  - Green (Standard): 4px left border, #10B981
  - Yellow (Attention): 4px left border, #F59E0B
  - Red (Complex): 4px left border, #EF4444
- **NO Progress Bars:** Use text-only displays (e.g., "LTV: 75%")
- **Email Tone:** Professional but warm, Ascot brand voice

### FCA Compliance (NON-NEGOTIABLE)

1. **Human Approval Mandatory**
   - NO instant AI responses to clients
   - 24-hour default delay for emails
   - Broker must review ALL proposals before sending

2. **Disclaimers Required**
   - "This is indicative and not regulated financial advice"
   - Clear labeling of AI-generated content

3. **Audit Trails**
   - CommunicationLog must capture all interactions
   - AsanaSyncLog must log all integrations
   - Timestamps on all triage calculations

4. **Not Regulated Advice**
   - System provides information, not recommendations
   - Final decisions made by FCA-regulated broker

### Cost Constraints

| Service | Monthly Budget | Current Usage |
|---------|---------------|---------------|
| Gemini API | ~$20 | $0 (not configured yet) |
| Zapier | $50 max | ~$50 |
| Apify | Within free tier | ~$0.40 |
| n8n | Self-hosted (free) | $0 |
| **Total** | **$70 target** | **~$50** |

**CRITICAL:** DO NOT use Claude API in production (20x more expensive than Gemini).

---

## KNOWN ISSUES & WORKAROUNDS

### Base44 Platform Limitations

| Issue | Workaround |
|-------|------------|
| Nested API paths not supported (`/api/asana/webhook`) | Use function name directly in path (`asanaWebhook`) |
| Cannot use `localStorage` in artifacts | Use React state or in-memory storage |
| "Discussion mode" causes "cannot implement" errors | Rephrase as direct instructions: "Create..." not "Can you..." |
| Field name mismatches (code vs schema) | Always verify Base44 entity schema before coding |

### Integration Gotchas

1. **Asana API**
   - Must handle handshake verification (`X-Hook-Secret` header)
   - Task movement requires `project_gid` + `section_gid` (section alone fails)
   - Comment posting failures should not crash workflow

2. **Zapier**
   - Gmail reply capture: Subject must include case reference
   - Rate limiting: Max 200 Insightly requests/hour
   - Email delivery: 5-minute delay acceptable

3. **Google Sheets**
   - LTV values MUST be 60/75/85/95 (Base44 breaks with 70/80)
   - Deduplication critical (Lender + Product + LTV unique)

---

## IMMEDIATE NEXT STEPS (PRIORITY ORDER)

### 1. Complete n8n Scraper (HIGHEST PRIORITY)

**Action Required:**
1. Generate n8n workflow JSON (see Technical Spec in `docs/scraper_technical_spec.md`)
2. Import JSON into n8n instance
3. Configure credentials:
   - HTTP Header Auth for Apify
   - Google Sheets OAuth2
4. Link credentials to nodes:
   - Node 2 → Apify Auth
   - Nodes 4, 6 → Sheets OAuth2
5. Execute test run (expect 19 rows)
6. Validate output:
   - Headers in row 1
   - Data starts row 2
   - LTV values are 60/75/85/95
   - No duplicates
7. Enable schedule (Sunday 7:30 AM UK)

**Success Criteria:**
- Google Sheets "Latest Rates" tab populated with 18-20 products
- No errors in execution log
- Failed Scrapes log remains empty

### 2. Connect Scraper to Base44 Knowledge Base (CRITICAL BLOCKER)

**Decision Required:** Choose integration approach

**Option A: Base44 → Google Sheets API (Read)**
- Pro: Sheets remains source of truth
- Con: Requires API key management in Base44
- Implementation: Create Base44 function `fetchLatestRates(ltv)` using HTTP Request

**Option B: n8n → Base44 Webhook (Push)**
- Pro: Real-time updates to Base44 Lender entity
- Con: Dual storage (Sheets + Base44)
- Implementation: Add Node 7 in n8n (HTTP POST to Base44)

**Option C: Hybrid (Recommended)**
- Sheets: Historical data, audit trail
- Base44: Latest rates in Lender entity (updated weekly)
- Implementation:
  1. n8n pushes to Base44 webhook after Sheets update
  2. Base44 function `updateLenderRates` parses payload
  3. Base44 stores in `Lender.latest_rates` field (JSON array)

**Recommendation:** Start with **Option B** for speed, migrate to **Option C** when scaling.

### 3. Create Asana Webhook

**Action Required:**
1. Copy PowerShell command from "Asana Integration" section above
2. Execute in terminal
3. Verify webhook creation (check for `gid` in response)
4. Test webhook:
   - Create task in Asana Stage 6
   - Check Base44 for new "incomplete" MortgageCase
   - Verify `asana_task_gid` is populated

**Success Criteria:**
- Webhook `gid` returned
- Test task creates Base44 case
- No duplicate cases on re-triggering

### 4. Implement Lender Matching Function

**Location:** Base44 → Functions → `matchLenders`

**Logic:**
```javascript
// Input: MortgageCase object
// Output: Array of lender names

function matchLenders(mortgageCase) {
  const lenders = getAllLenders(); // Query Lender entity
  const matches = [];
  
  lenders.forEach(lender => {
    // Check LTV compatibility
    if (mortgageCase.ltv > lender.max_ltv) return;
    
    // Check income type
    if (!lender.accepted_income_types.includes(mortgageCase.income_type)) return;
    
    // Check property type
    if (!lender.accepted_property_types.includes(mortgageCase.property_type)) return;
    
    // Check credit history
    if (mortgageCase.credit_issues && !lender.accepts_credit_issues) return;
    
    matches.push(lender.name);
  });
  
  return matches;
}
```

**Success Criteria:**
- Test case (75% LTV, employed, standard property) returns 6+ lenders
- Test case (95% LTV, self-employed, adverse credit) returns 1-2 lenders

### 5. Fix Triage Scoring

**Issue:** Too lenient, doesn't properly penalize high-risk combinations

**Proposed Fix:**
```javascript
// New scoring logic
function calculateTriage(mortgageCase) {
  let score = 0;
  let factors = [];
  
  // LTV penalty (0-30 points)
  if (ltv <= 75) score += 0;
  else if (ltv <= 85) { score += 10; factors.push("Higher LTV"); }
  else if (ltv <= 95) { score += 20; factors.push("High LTV"); }
  else { score += 30; factors.push("Very High LTV"); }
  
  // Income stability (0-25 points)
  if (incomeType === "employed") score += 0;
  else if (incomeType === "self-employed") { score += 15; factors.push("Self-employed"); }
  else if (incomeType === "contractor") { score += 25; factors.push("Contractor income"); }
  
  // Income adequacy (0-20 points)
  const incomeMultiple = loanAmount / annualIncome;
  if (incomeMultiple <= 4) score += 0;
  else if (incomeMultiple <= 4.5) { score += 10; factors.push("High income multiple"); }
  else { score += 20; factors.push("Very high income multiple"); }
  
  // Credit history (0-15 points)
  if (creditIssues) { score += 15; factors.push("Credit issues"); }
  
  // Time sensitivity (0-10 points)
  const daysToCompletion = calculateDays(purchaseDate);
  if (daysToCompletion < 30) { score += 10; factors.push("Urgent timeline"); }
  
  // Determine rating
  if (score <= 15) return { rating: "Blue", factors };
  else if (score <= 30) return { rating: "Green", factors };
  else if (score <= 50) return { rating: "Yellow", factors };
  else return { rating: "Red", factors };
}
```

**Success Criteria:**
- £300k property, £150k loan, £85k employed income → Blue
- £250k property, £175k loan, £45k employed income → Green
- £400k property, £320k loan, £32k self-employed income → Yellow
- £500k property, £450k loan, £20k contractor income → Red

---

## PHASE 2 ROADMAP (3-4 Weeks)

### Priority 1: Proposal Email Generator (Flagship Feature)

**Requirements:**
1. Query matched lenders from Base44
2. Fetch latest rates from Google Sheets (filtered by client LTV)
3. Select 3 best options (algorithm: lowest rate, lowest fees, best value)
4. Generate comparison table (Gemini API)
5. Draft email body (professional + friendly tone)
6. Store in ProposalDraft entity
7. Present to broker for approval
8. Send via Zapier (24-hour delay)

**Blocker:** Requires knowledge base integration (Step 2 above)

### Priority 2: Email Tracking & Communication Log

**Requirements:**
1. Capture Gmail message IDs (Zapier → Base44 webhook)
2. Store in CommunicationLog entity
3. Track sent/received/pending status
4. Display icons on dashboard
5. Link to case timeline

### Priority 3: Two-Way Asana Sync

**Requirements:**
1. Asana → Base44: Task creation (already built)
2. Base44 → Asana: Status updates (not built)
3. Base44 → Asana: Comment posting on email sent
4. Asana → Base44: Task completion triggers case closure

### Priority 4: Fee Collection Dashboard

**Requirements:**
1. Display all withdrawal cases (fee_applicable = true)
2. Invoice generation (PDF via Zapier)
3. Payment tracking (Stripe webhook → Base44)
4. Fee waiver workflow (manual approval)

### Priority 5: Zapier Workflow Automation

**Requirements:**
1. Email delivery (business hours enforcement)
2. Reply capture (Gmail → Base44)
3. Fee invoice generation (Base44 → Stripe)
4. Insightly contact lookup (pre-fill intake form)

---

## TESTING REQUIREMENTS

### Phase 1 Test Cases

| Scenario | Property Value | Loan Amount | Income | Employment | Expected Triage | Expected Lenders |
|----------|---------------|-------------|--------|------------|-----------------|------------------|
| Quick Win | £300k | £150k | £85k | Employed | Blue | 6+ |
| Standard | £250k | £175k | £45k | Employed | Green | 4-5 |
| Attention | £400k | £320k | £32k | Self-employed | Yellow | 2-3 |
| Complex | £500k | £450k | £20k | Contractor | Red | 0-1 |

### Validation Gates (No Exceptions)

- [ ] Asana webhook: Test on duplicate board FIRST
- [ ] Rate scraper: 3 successful runs before production
- [ ] Email sending: Manual approval in test environment
- [ ] Fee collection: Verify invoice PDF generation
- [ ] Triage scoring: All 4 test cases pass
- [ ] Lender matching: Minimum 2 test cases validate

---

## STAKEHOLDER CONTEXT

### Nwabisa (Mortgage Broker)
- **Current Pain:** 20-30 min per case on TRIGold (compliance tool)
- **Success Metric:** <5 min proposal creation, 50% time saved
- **Needs:** Accurate triage, clear lender matches, transparent reasoning

### Assistants
- **Current Pain:** 15-20 min manual case creation in Base44/Asana
- **Success Metric:** 5-7 min total per case
- **Needs:** Simple intake forms, clear incomplete case visibility

### Mark (Business Owner)
- **ROI Target:** £3-10k/month fee recovery from withdrawals
- **Capacity Goal:** 10x scale (50 → 500 cases/month) without hiring
- **Risk Tolerance:** Low (FCA compliance cannot be compromised)

### Sam ("Vibe Coder")
- **Approach:** AI agent management, systematic phased rollout
- **Preference:** Thorough testing, comprehensive documentation
- **Continuity Strategy:** Handover docs enable seamless AI transitions

---

## KEY FILES & RESOURCES

### Documentation
- `HANDOVER.md` (this file) - Project overview and next steps
- `docs/project_context.md` - Detailed system specification
- `docs/scraper_technical_spec.md` - n8n workflow architecture

### Base44 Application
- App ID: `695d6a9a166167143c3f74bb`
- Webhook URL: `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`

### External Resources
- Apify Dataset: `https://api.apify.com/v2/datasets/8P1Dzm5nBmcBd4ELt/items`
- Google Sheets: `1XuK8iFxKUrWjHN1-TCTXEQzS0lfsK20ElAwSraRB2OQ`
- Asana Test Project: `1212782871770137`

### API Keys (SENSITIVE - Do Not Share Publicly)
- Apify: `apify_api_PgWMhaYTmDbjJIo8pwqUJ7IIMszJy61kTQ2A`
- Asana PAT: `2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f`

---

## HANDOVER CHECKLIST FOR NEW AI

When taking over this project, complete these steps:

### 1. Context Loading
- [ ] Read this HANDOVER.md file completely
- [ ] Review `docs/project_context.md` for detailed system spec
- [ ] Review `docs/scraper_technical_spec.md` for n8n workflow
- [ ] Understand FCA compliance requirements (non-negotiable)
- [ ] Note cost constraints (Gemini, not Claude API)

### 2. Current State Verification
- [ ] Confirm n8n scraper status (should be at "⏳ Pending - Import")
- [ ] Check Asana webhook status (endpoint ready, webhook not created)
- [ ] Verify Base44 app accessibility
- [ ] Confirm access to Google Sheets

### 3. Immediate Actions (In Order)
- [ ] Generate n8n workflow JSON from Technical Spec
- [ ] Guide user through n8n import process
- [ ] Configure credentials (Apify, Google Sheets)
- [ ] Execute test run (expect 19 rows in Sheets)
- [ ] Validate data quality (LTV values, no duplicates)
- [ ] Design knowledge base integration (choose Option A/B/C)
- [ ] Implement Base44 connection to scraped rates
- [ ] Create Asana webhook (execute PowerShell command)
- [ ] Test webhook (create Asana task → verify Base44 case)

### 4. Communication Protocol
- [ ] Confirm understanding of project scope with user
- [ ] Ask clarifying questions about blockers
- [ ] Provide step-by-step guidance (user may not be technical)
- [ ] Document all changes made (update HANDOVER.md)

### 5. Quality Gates
- [ ] All code changes follow Base44 SDK syntax
- [ ] FCA compliance maintained (human approval gates)
- [ ] Cost targets respected ($0-70/month)
- [ ] Test cases validate before marking complete

---

## EMERGENCY CONTACTS & ESCALATION

**If You Encounter Blockers:**

1. **Base44 Platform Issues**
   - Check "Known Issues & Workarounds" section above
   - Rephrase prompts as direct instructions (not questions)
   - Verify field names match entity schema

2. **API Authentication Failures**
   - Asana: Verify PAT hasn't expired
   - Apify: Check dataset ID is current
   - Google Sheets: Confirm OAuth2 scope includes `spreadsheets`

3. **Data Quality Issues**
   - Scraper returns <15 rows: Check Apify Actor logs
   - LTV values incorrect: Verify Apify filter configuration
   - Duplicates in Sheets: Review deduplication logic

4. **User Confusion**
   - Provide screenshots/visual guides
   - Break complex steps into smaller chunks
   - Offer to create executable scripts (PowerShell/Bash)

---

## SUCCESS METRICS

**You will know the handover is successful when:**

1. ✅ n8n scraper runs end-to-end successfully
2. ✅ Google Sheets "Latest Rates" tab populates with 18-20 products
3. ✅ Base44 can query scraped rates (filtered by LTV)
4. ✅ Asana webhook creates "incomplete" cases in Base44
5. ✅ Test case passes: Asana task → Base44 case → Triage calculated

**Long-term success (Phase 2):**
- Proposal email generator creates 3-lender comparisons
- 50%+ time savings validated by Nwabisa
- £3k+ monthly fee recovery tracked in dashboard

---

**Last Updated:** 2026-01-19  
**Next Review:** After n8n scraper completion  
**Maintained By:** Sam (Vibe Coder) + AI Collaborators

---

## APPENDIX: QUICK REFERENCE

### Common Commands

**Create Asana Webhook:**
```powershell
$headers = @{ "Authorization" = "Bearer 2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f" }
$webhookBody = @{ data = @{ resource = "1212782871770137"; target = "https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook" } } | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $webhookBody -ContentType "application/json"
```

**Test Apify Scraper:**
```bash
curl "https://api.apify.com/v2/datasets/8P1Dzm5nBmcBd4ELt/items?format=json&clean=true" \
  -H "Authorization: Bearer apify_api_PgWMhaYTmDbjJIo8pwqUJ7IIMszJy61kTQ2A"
```

**Query Google Sheets (via API):**
```bash
# Requires OAuth2 token
curl "https://sheets.googleapis.com/v4/spreadsheets/1XuK8iFxKUrWjHN1-TCTXEQzS0lfsK20ElAwSraRB2OQ/values/Latest%20Rates!A1:K100" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN"
```

### Entity Schema Quick Reference

**MortgageCase Fields:**
`case_type`, `case_status`, `asana_task_gid`, `triage_rating`, `triage_factors`, `matched_lenders`, `fee_status`

**ProposalDraft Fields:**
`lender_a`, `lender_b`, `lender_c`, `recommended_option`, `email_body`, `generated_at`

**CommunicationLog Fields:**
`direction`, `email_provider_id`, `requires_action`

---

**END OF HANDOVER DOCUMENT**

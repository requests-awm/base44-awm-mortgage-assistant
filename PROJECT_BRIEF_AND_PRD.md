# ASCOT MORTGAGE ASSISTANT - PROJECT BRIEF & PRD

**Project:** Automated Mortgage Triage System
**Client:** Ascot Wealth Management (UK)
**Platform:** Base44 (Low-Code)
**Last Updated:** 2026-01-20
**Status:** Phase 1 MVP ~85% Complete

---

## EXECUTIVE SUMMARY

### The Problem
Ascot Wealth Management handles 500+ mortgage enquiries monthly. Each case currently requires:
- **20-30 minutes** of manual data entry and triage
- Duplicate entry between Asana (task management) and internal systems
- Manual rate research across multiple lenders
- Repetitive email drafting for initial client contact
- No automated fee tracking for withdrawn cases (losing £3-10k/month)

### The Solution
An AI-powered mortgage case management system that:
- **Reduces case processing time** from 30 min to 5-7 min (77% reduction)
- **Auto-creates cases** from Asana tasks via webhook
- **Calculates triage scores** based on LTV, income, complexity
- **Matches suitable lenders** automatically
- **Generates personalised outreach emails** using AI
- **Tracks fees** for withdrawn cases

### Business Impact
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Time per case | 30 min | 5-7 min | **77% reduction** |
| Cases per day (per person) | 16 | 60+ | **4x capacity** |
| Fee recovery | ~£0 | £3-10k/month | **New revenue** |
| Manual data entry | 100% | 10% | **90% automated** |

---

## PART 1: PROJECT BRIEF

### 1.1 Business Context

**Company:** Ascot Wealth Management
**Industry:** UK Mortgage Brokerage (FCA Regulated)
**Team Structure:**
- Mark Insley (Chairman/Business Owner)
- Nwabisa (Lead Mortgage Broker)
- Assistants (Case intake and admin)
- Sam (Technical Lead / "Vibe Coder")

**Current Workflow Pain Points:**
1. Assistants spend 15-20 min manually creating cases in Base44
2. Nwabisa spends 20-30 min per case on TRIGold (compliance tool)
3. No visibility into incomplete cases from Asana
4. Clients bypass brokers after receiving lender names (fee leakage)
5. Email drafting is repetitive and time-consuming

### 1.2 Project Goals

**Primary Goals:**
1. **Automate case creation** from Asana webhook triggers
2. **Provide intelligent triage** scoring for case prioritisation
3. **Match cases to suitable lenders** based on criteria
4. **Generate initial outreach emails** using AI (Gemini)
5. **Track and recover fees** from withdrawn cases

**Secondary Goals:**
1. Build lender rate scraping pipeline
2. Create bidirectional Asana sync
3. Implement communication tracking
4. Enable proactive database outreach

### 1.3 Success Criteria

**MVP Success (Phase 1):**
- [ ] Asana webhook creates incomplete cases automatically
- [ ] Intake form pre-fills data and highlights missing fields
- [ ] Triage scoring assigns Blue/Green/Yellow/Red ratings
- [ ] Cases activate and move from incomplete to active pipeline
- [ ] End-to-end flow works: Asana → Base44 → Email ready

**Full Success (Phase 2+):**
- [ ] AI-generated emails sent with human approval
- [ ] Lender matching returns 3-option comparisons
- [ ] Fee tracking captures £750 withdrawal fees
- [ ] 50%+ time savings validated by Nwabisa

### 1.4 Constraints & Requirements

**FCA Compliance (Non-Negotiable):**
- Human approval required before ALL client communications
- System provides information, NOT regulated financial advice
- 24-hour default delay for automated emails
- Complete audit trails for all decisions
- Clear disclaimers on all AI-generated content

**Cost Constraints:**
| Service | Budget | Current |
|---------|--------|---------|
| Zapier | $50/month | ~$50 |
| Gemini API | $20/month | $0 (not configured) |
| Apify | $5/month | ~$0.40 |
| n8n | $0 (self-hosted) | $0 |
| **Total** | **$75/month** | **~$50** |

**Technical Constraints:**
- Must use Base44 platform (existing investment)
- Use Gemini API (NOT Claude - 20x cheaper)
- Maintain existing Zapier workflows (179 active)
- Support UK phone number formats
- LTV breakpoints: 60/75/85/95% only (Base44 limitation)

---

## PART 2: PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ASANA WORKFLOW                           │
│  Stages 1-5: Manual info gathering (Assistants)                  │
│  Stage 6: "AI Triage Dashboard" ← WEBHOOK TRIGGER                │
│  Stage 7: "Awaiting Client Response"                             │
│  Stage 8: "Mortgage Analysis Needed"                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Webhook)
┌─────────────────────────────────────────────────────────────────┐
│                    BASE44 APPLICATION                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ MortgageCase│  │ Lender DB   │  │ ProposalDraft           │  │
│  │ Entity      │  │ (8 lenders) │  │ CommunicationLog        │  │
│  │             │  │             │  │ Fee, AsanaSyncLog       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    UI COMPONENTS                             │ │
│  │  • Dashboard (Pipeline + Incomplete Cases tab)               │ │
│  │  • Intake Form (4-step with pre-fill + validation)           │ │
│  │  • Triage Display (colored badges)                           │ │
│  │  • Report Draft Editor                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
│  • Zapier (email delivery, reply capture)                        │
│  • Gemini 2.0 Flash (email generation)                           │
│  • Google Sheets (rate data storage)                             │
│  • n8n + Apify (rate scraping pipeline)                          │
│  • Insightly CRM (client data pre-fill)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model

**MortgageCase Entity (Primary):**
```javascript
{
  // Identifiers
  case_reference: "AWM-2026-001",      // Auto-generated
  case_type: "lead" | "case",
  case_status: "incomplete" | "active" | "closed",

  // Client Information
  client_name: string,
  client_email: string,
  client_phone: string,                 // UK format

  // Mortgage Details
  property_value: number,
  loan_amount: number,
  mortgage_purpose: "purchase" | "remortgage" | "equity_release",
  category: "residential" | "btl" | "later_life" | "ltd_company",

  // Financial Details
  annual_income: number,
  employment_type: "employed" | "self_employed" | "contractor",
  credit_history_status: "good" | "fair" | "poor",

  // Derived Fields
  ltv: number,                          // Auto-calculated
  loan_to_income: number,               // Auto-calculated

  // Triage
  triage_rating: "blue" | "green" | "yellow" | "red",
  triage_factors: string[],             // ["High LTV", "Self-employed"]
  triage_last_calculated: datetime,
  matched_lenders: string[],            // ["Barclays", "Santander"]

  // Asana Integration
  asana_task_gid: string,
  asana_project_gid: string,
  asana_section: string,
  asana_last_synced: datetime,
  created_from_asana: boolean,

  // CRM Integration
  insightly_id: string,
  internal_introducer: string,
  mortgage_broker_appointed: boolean,

  // Communication
  client_replied: boolean,
  last_client_reply_at: datetime,

  // Fees
  fee_applicable: boolean,
  fee_status: "pending" | "invoiced" | "paid" | "waived",
  withdrawal_reason: string,

  // Timestamps
  created_at: datetime,
  activated_at: datetime,
  closed_at: datetime
}
```

### 2.3 Feature Specifications

#### Feature 1: Asana Webhook Integration

**Purpose:** Auto-create cases when tasks move to "AI Triage Dashboard"

**Trigger:** Task moved to Stage 6 section in Asana

**Webhook Endpoint:** `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`

**Process Flow:**
1. Asana sends webhook event
2. Base44 validates handshake (X-Hook-Secret)
3. Fetch full task details via Asana API
4. Extract custom fields (name, email, Insightly ID)
5. Check for duplicate (asana_task_gid)
6. Create MortgageCase with `case_status: "incomplete"`
7. Post comment back to Asana task

**Status:** ✅ Backend complete, ⏳ Webhook not yet created

---

#### Feature 2: Dashboard with Incomplete Cases Tab

**Purpose:** Separate view for cases awaiting completion

**Navigation:** `My Work | Pipeline | All Cases | Incomplete Cases`

**Incomplete Cases Tab:**
- Shows only cases where `case_status === "incomplete"` AND `created_from_asana === true`
- Displays: Client name, email, created timestamp, missing fields count
- "Complete Intake" button links to pre-filled form
- Progress indicator: "3/6 fields complete"

**Status:** ✅ Complete

---

#### Feature 3: Intake Form with Pre-fill & Validation

**Purpose:** Complete case details with minimal data entry

**Two Modes:**
1. **Edit Mode** (URL has `?case_id=xxx`)
   - Pre-fills existing data from database
   - Form title: "Complete Intake for Case {reference}"
   - Submit button: "Activate Case" (amber)

2. **Create Mode** (no case_id)
   - Blank form for manual case creation
   - Form title: "Create New Mortgage Case"
   - Submit button: "Create Case" (blue)

**Required Fields (6):**
1. Client Name
2. Client Email
3. Property Value
4. Loan Amount
5. Mortgage Purpose
6. Category

**Validation Rules:**
- Email: Valid format (name@domain.com)
- Phone: UK format (07xxx, +44xxx, 020xxxx)
- Loan Amount: Cannot exceed Property Value
- All numeric fields: Must be > 0

**Visual Feedback:**
- Amber borders on empty required fields
- Green borders on filled fields
- Progress bar: "X/6 fields complete"

**Status:** ✅ Phases 1-3 complete, ⚠️ Phase 4 (activation) has bug

---

#### Feature 4: Triage Scoring

**Purpose:** Automatically classify cases by complexity

**Triage Ratings:**
| Rating | Color | Meaning | Typical Profile |
|--------|-------|---------|-----------------|
| Blue | #2563EB | Quick Win | Low LTV, employed, good credit |
| Green | #10B981 | Standard | Normal case, no flags |
| Yellow | #F59E0B | Attention | Higher LTV or self-employed |
| Red | #EF4444 | Complex | High LTV + low income + issues |

**Scoring Factors:**
- LTV (Loan-to-Value ratio)
- Income stability (employed vs contractor)
- Income adequacy (loan-to-income ratio)
- Credit history
- Time urgency

**Status:** ✅ Basic function exists, ⚠️ Scoring too lenient (needs refinement)

---

#### Feature 5: Lender Matching

**Purpose:** Identify suitable lenders based on case criteria

**Matching Logic:**
```javascript
function matchLenders(case) {
  return lenders.filter(lender =>
    case.ltv <= lender.max_ltv &&
    lender.accepted_income_types.includes(case.employment_type) &&
    lender.accepted_property_types.includes(case.category) &&
    (!case.credit_issues || lender.accepts_credit_issues)
  );
}
```

**Expected Output:** Array of 3-8 lender names

**Status:** ❌ Not implemented (logic defined)

---

#### Feature 6: Email Generation (Phase 2)

**Purpose:** AI-generated initial outreach emails

**API:** Gemini 2.0 Flash (NOT Claude)

**Email Types:**
1. Remortgage outreach
2. Purchase outreach
3. BTL (Buy-to-Let) outreach

**Requirements:**
- Include live lender rates (from scraper)
- Professional but warm tone
- Anonymise lender names pre-acceptance ("Lender A" not "Cambridge BS")
- Human approval required before sending

**Status:** ❌ Not started

---

#### Feature 7: Rate Scraping Pipeline (Phase 2)

**Purpose:** Weekly mortgage rate data for proposals

**Pipeline:**
```
Moneyfacts Website
    ↓ (Apify Cheerio Scraper)
Raw HTML
    ↓ (n8n Transform)
Structured JSON
    ↓ (Google Sheets API)
"Latest Rates" spreadsheet
    ↓ (Base44 fetch)
Lender matching & proposals
```

**Schedule:** Weekly (Sunday 7:30 AM UK)

**Output Fields:**
- Lender, Product Type, LTV
- Rate (%), APRC (%), Product Fee (£)
- Monthly Payment (£), Initial Period
- Product Name, Source URL, Scrape Date

**Status:** ✅ Design complete, ❌ Not built

---

### 2.4 API & Integration Details

**Asana API:**
- Base URL: `https://app.asana.com/api/1.0`
- Auth: Personal Access Token (PAT)
- Test Project GID: `1212782871770137`
- Production Project GID: `1204991703151113`

**Custom Field GIDs:**
```
Client Name:          1202694315710867
Client Email:         1202694285232176
Insightly ID:         1202693938754570
Broker Appointed:     1211493772039109
Internal Introducer:  1212556552447200
```

**Base44 Webhook:**
- URL: `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`
- Method: POST
- Auth: None (public endpoint)

**Google Sheets:**
- Spreadsheet ID: `1XuK8iFxKUrWjHN1-TCTXEQzS0lfsK20ElAwSraRB2OQ`
- Tabs: Latest Rates, Failed Scrapes, History

---

## PART 3: IMPLEMENTATION PROGRESS

### 3.1 What's Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard pipeline view | ✅ 100% | Stage grouping, triage badges |
| Incomplete Cases tab | ✅ 100% | Separate navigation tab |
| Lender database | ✅ 100% | 8 lenders configured |
| Intake form (basic) | ✅ 100% | 4-step wizard |
| Intake form detection (Phase 1) | ✅ 100% | Edit vs create mode |
| Intake form pre-fill (Phase 1) | ✅ 100% | Loads existing data |
| Missing field highlighting (Phase 2) | ✅ 100% | Amber/green borders |
| Progress bar (Phase 2) | ✅ 100% | X/6 fields complete |
| Validation rules (Phase 3) | ✅ 100% | Email, phone, loan amount |
| Submit button logic (Phase 3) | ✅ 100% | Enable/disable based on validity |
| Triage calculation backend | ✅ 100% | calculateTriage function |
| Triage UI display | ✅ 100% | Colored left borders |
| Report draft editor | ✅ 100% | Regenerate/save functionality |
| Asana webhook endpoint | ✅ 95% | Built, published, not connected |
| Test environment setup | ✅ 100% | TEST board with sections |

### 3.2 What's In Progress / Broken

| Feature | Status | Issue |
|---------|--------|-------|
| Case activation (Phase 4) | ⚠️ 85% | Database update not persisting |
| Asana webhook connection | ⏳ Ready | PowerShell command prepared, not executed |

**Known Bug - Case Activation:**
- User fills all 6 required fields
- Clicks "Activate Case"
- Form submits without error
- BUT: `case_status` remains "incomplete" in database
- Case doesn't move to active pipeline

**Suspected Causes:**
1. `MortgageCase.update()` not executing
2. Field name mismatch
3. Cache invalidation issue
4. Deferred until Asana webhook connected (real data may behave differently)

### 3.3 What's Not Started

| Feature | Priority | Estimated Effort |
|---------|----------|------------------|
| Asana webhook creation | P0 | 5 minutes |
| End-to-end testing | P0 | 1-2 hours |
| Lender matching function | P1 | 2 hours |
| Triage scoring refinement | P1 | 2 hours |
| n8n rate scraper build | P2 | 4-6 hours |
| Gemini API integration | P2 | 3-4 hours |
| Email template system | P2 | 4-6 hours |
| Fee collection dashboard | P3 | 4-6 hours |
| Insightly pre-fill | P3 | 2-3 hours |

---

## PART 4: FUTURE VISION (Mark's Feature Requests)

### 4.1 Lender BDM Communication Agent

**Concept:** AI that emails lenders periodically, follows up, handles replies, and builds "Lender Style Bios"

**Capabilities:**
- Quarterly outreach to BDMs
- Auto-follow-up if no response
- Parse replies for criteria updates
- Build institutional knowledge over time

**Feasibility:** Medium complexity - requires email parsing + vector storage

### 4.2 Proactive Database Outreach Agent

**Concept:** AI assesses lender database, maintains ongoing communications, gathers criteria updates

**Feasibility:** High complexity - requires autonomous agent framework

### 4.3 Client Acceptance Feature

**Concept:** Fee disclosure and formal acknowledgment before applications

**Implementation:**
- Add acceptance field to MortgageCase
- Capture timestamp, IP address
- Audit trail for FCA compliance
- Anonymise lender names until accepted

**Feasibility:** Low complexity - achievable immediately

### 4.4 Fee Protection Strategy

**Concept:** Protect against clients taking research and going direct

**Implementation:**
- Show "Lender A" instead of "Cambridge BS" pre-acceptance
- Reveal actual lender only after fee acknowledgment
- Embed disclosure in email footers

**Feasibility:** Low complexity - template logic only

---

## PART 5: TECHNICAL REFERENCE

### 5.1 Environment Variables (Base44)

```
ASANA_API_TOKEN: 2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f
ASANA_PROJECT_GID: 1212782871770137 (TEST)
```

### 5.2 Key Commands

**Create Asana Webhook:**
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

**Test Apify Scraper:**
```bash
curl "https://api.apify.com/v2/datasets/8P1Dzm5nBmcBd4ELt/items?format=json&clean=true" \
  -H "Authorization: Bearer apify_api_PgWMhaYTmDbjJIo8pwqUJ7IIMszJy61kTQ2A"
```

### 5.3 Base44 Gotchas

| Issue | Solution |
|-------|----------|
| Nested API paths fail | Use function name directly: `/asanaWebhook` not `/asana/webhook` |
| "Discussion mode" errors | Use commands: "Create..." not "Can you..." |
| localStorage unavailable | Use React state |
| Field name mismatches | Verify entity schema before coding |

### 5.4 Brand Guidelines

**Colors:**
- Deep Navy: #0E1B2A
- Gold: #D1B36A
- Triage Blue: #2563EB
- Triage Green: #10B981
- Triage Yellow: #F59E0B
- Triage Red: #EF4444

**Design:**
- Minimal Apple-inspired aesthetic
- No progress bars (text only)
- Professional + warm email tone

---

## PART 6: NEXT STEPS (PRIORITISED)

### Immediate (Today/Tomorrow)

1. **Connect Asana Webhook** - Execute PowerShell command
2. **Test with Real Data** - Create Asana task, verify case creation
3. **Debug Activation Bug** - If persists with real data, add console logging

### This Week

4. **Implement Lender Matching** - `matchLenders` function
5. **Refine Triage Scoring** - Add weighted penalties
6. **Build n8n Scraper** - Import workflow, configure credentials

### Next Week

7. **Integrate Gemini API** - Email generation
8. **Create Email Templates** - Remortgage, Purchase, BTL
9. **Production Rollout** - Switch to production Asana board

### Future

10. **Fee Collection Dashboard**
11. **Communication Tracking**
12. **Lender BDM Agent** (if Mark confirms priority)

---

## DOCUMENT HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-20 | 1.0 | Initial consolidated PRD created |

---

**Document Owner:** Sam (Technical Lead)
**Stakeholders:** Mark (Business), Nwabisa (Broker), Assistants
**Platform:** Base44
**Status:** Phase 1 MVP ~85% Complete
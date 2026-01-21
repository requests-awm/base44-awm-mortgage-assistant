# BASE44 MORTGAGE SYSTEM - PROJECT KNOWLEDGE BASE

## 1. Project Overview

**Goal:** Build an automated mortgage triage and case management system for Ascot Wealth Management to handle 500+ client influx without proportional hiring, reducing manual work from 30+ minutes to 5-7 minutes per case.

**Core Features:**
- AI-powered case triage (scoring based on LTV, income, complexity)
- Automated intake form with live feedback
- Initial client email generation (Gemini API)
- Mortgage proposal generator (3-option comparison)
- Asana bidirectional sync for team visibility
- Email tracking and communication log
- Fee collection dashboard (£750 withdrawal fees)
- Automated mortgage rate scraper (Moneyfacts → Base44)
- Lender matching engine

## 2. Technical Stack & Architecture

**Platform:** Base44 (low-code, similar to Bubble/Retool)

**AI/APIs:**
- Gemini 2.0 Flash API (email generation - NOT Claude due to cost)
- Asana API v1.0 (task management integration)
- Google Sheets API v4 (rate data storage)
- Insightly CRM (client data pre-fill)

**Automation:**
- Zapier (179 workflows - email delivery, reply capture, fee invoices)
- n8n (workflow orchestration, data processing)
- Apify Cheerio Scraper (mortgage rate scraping)

**Data Sources:**
- Moneyfacts (1,200+ mortgage products weekly)
- Notion (lender criteria library)
- TRIGold (compliance tool - external, manual)

**Infrastructure:**
- Base44 hosting (managed)
- Railway (planned for Antigravity agents)
- Webhooks for real-time sync

**Data Model (Base44 Entities):**
```
MortgageCase
├─ case_type (lead/case)
├─ case_status (incomplete/active/closed)
├─ asana_task_gid, asana_project_gid
├─ triage_rating, triage_factors, triage_last_calculated
├─ matched_lenders (array)
├─ client_replied, last_client_reply_at
└─ fee_applicable, fee_status, withdrawal_reason

ProposalDraft
├─ lender_a/b/c fields (name, rate, fees, ERC)
├─ recommended_option, reasoning
└─ email_body, generated_at, version

CommunicationLog
├─ direction (sent/received/note)
├─ email_provider_id (Gmail message ID)
└─ requires_action, action_taken_at

Fee
├─ amount (default £750)
├─ status (pending/invoiced/paid/waived)
└─ invoice_number, payment_due_date

AsanaSyncLog
├─ event_type, sync_direction
└─ payload, response, status
```

## 3. Design & Style Guidelines

**UI/UX Requirements:**
- Minimal Apple-inspired design
- Colored left borders for triage (Blue/Green/Yellow/Red)
- NO progress bars (text-only LTV display)
- Professional + friendly email tone
- Ascot brand colors: Deep Navy (#0E1B2A), Gold (#D1B36A)
- No excessive formatting (bullets/headers unless requested)

**FCA Compliance:**
- Human approval required before ALL client communication
- NOT regulated advice (indicative only)
- 24-hour default delay for emails
- Audit trails mandatory
- Clear disclaimers: "This is indicative and not regulated advice"

**Code Style:**
- "Vibe coding" approach (AI agent management via prompts)
- Base44 SDK syntax (not raw code)
- Copy/paste prompts for Base44 AI
- Gemini API (NOT Claude for cost reasons)
- Field names match entity schema exactly

## 4. Current State & Progress

### Phase 1: Core Features (60-70% Complete)

**✅ Working:**
- Dashboard with pipeline view, stage grouping
- Lender database (8 lenders configured)
- Intake form (4-step: Client → Mortgage → Financials → Timing)
- Triage backend (`calculateTriage` function created)
- Triage UI (colored left borders on cards)
- Report draft editor with regenerate/save
- Asana webhook endpoint built and published
- Webhook URL identified: `https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook`

**⚠️ Needs Fixing:**
- Triage scoring too lenient (doesn't account for all variables properly)
- Triage labels confusing ("Urgent" vs "Complex")
- Time sensitivity conflated with complexity

**❌ Not Built:**
- Live triage in intake form (real-time feedback)
- Lender matching (`matchLenders` function)
- Email status icons on dashboard
- Email reporting dashboard
- Client Reviews page
- Insightly pre-fill
- Asana bidirectional sync (endpoint ready, webhook not created yet)

### Mortgage Rate Scraper (Separate Track - 95% Ready)

**✅ Completed:**
- Apify scraper configuration (Cheerio targeting Moneyfacts)
- Data specification (LTV 60/75/85/95% only)
- n8n workflow design (fetch → dedupe → transform → Sheets)
- Google Sheets structure (Latest Rates, Failed Scrapes, History)
- Base44 integration approach defined

**📋 Next Step:**
- Create Asana webhook (command ready to run)

### Asana Integration (Ready for Webhook Creation)

**✅ Setup Complete:**
- Test board created: "Mortgage Dynamic - TEST (WIP)" (GID: `1212782871770137`)
- Sections created: Stage 6 (AI Triage Dashboard), Stage 7 (Awaiting Client)
- Custom field GIDs mapped (Client Name, Email, Insightly ID, etc.)
- Environment variables set in Base44
- Personal PAT available for testing

**📋 Immediate Next:**
```powershell
# Ready to execute
$headers = @{ "Authorization" = "Bearer 2/1212360449578309/1212795555106101:89c2348649b8a941d35334d03158f99f" }
$webhookBody = @{
    data = @{
        resource = "1212782871770137"
        target = "https://app.base44.com/api/695d6a9a166167143c3f74bb/asanaWebhook"
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks" -Method Post -Headers $headers -Body $webhookBody -ContentType "application/json"
```

### Phase 2: Advanced Features (Planned, 3-4 weeks)

**Priority 1:** Proposal Email Generator (flagship feature)
**Priority 2:** Email Tracking & Communication Log
**Priority 3:** Two-Way Asana Sync
**Priority 4:** Fee Collection Dashboard
**Priority 5:** Zapier Workflow Automation

## 5. Key Decisions & "Gotchas"

### Critical Architectural Decisions

**✅ Base44 vs Custom Build:**
- Decision: Keep Base44 (don't rebuild in Next.js)
- Reason: Low-code efficiency, faster iteration

**✅ Gemini vs Claude:**
- Decision: Gemini 2.0 Flash for ALL AI generation
- Reason: 20x cheaper ($20/month vs $400/month estimated)
- **NEVER use Claude API in production**

**✅ Asana Webhook Approach:**
- Decision: Direct webhook (Base44 → Asana), NOT via Zapier
- Reason: Faster, more secure, free
- Constraint: Base44 doesn't support nested paths (`/asana/webhook` fails)
- Solution: Function name `asanaWebhook` directly in path

**✅ Incomplete Case Lifecycle:**
- Decision: Webhook creates "incomplete" cases, assistants complete intake
- Reason: 56-77% time savings (only do TRIGold for interested clients)
- Flow: Asana Stage 6 → Auto-create case → Assistant fills gaps → Email sent → Stage 7

**✅ Mortgage Rate Scraping:**
- Decision: Moneyfacts (not individual lender sites)
- LTV Filter: ONLY 60/75/85/95% (Base44 will break with 70/80%)
- Schedule: Weekly (Sunday 7am UK) not daily
- Storage: Google Sheets (not Base44 database initially)

### User/Business Constraints

**FCA Compliance (Non-Negotiable):**
- No instant AI responses allowed
- Human approval mandatory before client contact
- Audit trails required for all decisions
- Must NOT claim to be regulated financial advice

**Cost Sensitivity:**
- Target: $0-70/month total operational cost
- Zapier: $50/month max
- Gemini API: ~$20/month
- Apify: ~$0.40/month (within free tier)

**Data Quality Requirements:**
- Rate scraper: 95%+ accuracy acceptable (has fallbacks)
- Triage: Transparent factors shown to broker
- Email templates: Professional but warm tone
- Deduplication: Critical (lender+product+LTV must be unique)

### Technical Gotchas

**Base44 Limitations:**
```
❌ Nested API paths not supported (/api/asana/webhook fails)
✅ Use function names directly (asanaWebhook works)

❌ Cannot use localStorage in artifacts
✅ Use React state or in-memory storage only

❌ Discussion mode causes "cannot implement" errors
✅ Rephrase as direct instructions ("Create..." not "Can you...")
```

**Field Name Mismatches:**
- Always verify Base44 entity schema before coding
- Code uses "later_life" but database may have "Later Life"
- Ask Base44 to verify field names match schema

**Asana Integration:**
- Must handle handshake verification (X-Hook-Secret)
- Duplicate prevention essential (check asana_task_gid)
- Comment posting failures should NOT crash workflow
- Task movement requires project+section GIDs (not section alone)

**Zapier Workflow:**
- Gmail reply capture: Search string must include case reference in subject
- Rate limiting: Max 200 Insightly requests/hour
- Email delivery: 5-minute delay acceptable for business hours enforcement
- Always include error fallback paths

### Stakeholder Expectations

**Nwabisa (Mortgage Broker):**
- Needs: Accurate triage, clear lender matches, time savings
- Pain: Currently spends 20-30 min per case on TRIGold
- Success: <5 min proposal creation, 50% time saved

**Assistants:**
- Needs: Clear incomplete case visibility, simple intake forms
- Pain: Manual case creation in Base44, Asana GID linking
- Success: 5-7 min total per case (vs 15-20 min)

**Mark (Business Owner):**
- Needs: Scale to 500 cases without hiring
- ROI: Fee recovery (£3-10k/month), capacity increase (10x)
- Risk tolerance: Low (must not break FCA compliance)

**Sam ("Vibe Coder"):**
- Approach: AI agent management, not manual coding
- Preference: Systematic phased rollout with thorough testing
- Documentation: Comprehensive (enables continuity across chats)

### Testing Requirements

**Phase 1 Test Cases:**
```
Blue (Quick Win):    £300k property, £150k loan, £85k income → 6+ lenders
Green (Good Case):   £250k property, £175k loan, £45k income → Standard
Yellow (Attention):  £400k property, £320k loan, £32k self-employed
Red (Complex):       £500k property, £450k loan, £20k contractor
```

**Validation Gates (No Exceptions):**
- Asana webhook: Test on duplicate board FIRST
- Rate scraper: 3 successful runs before production
- Email sending: Manual approval in test environment
- Fee collection: Verify invoice PDF generation

### Known Issues Log

**Issue #1:** Base44 AI "discussion mode" errors
- Workaround: Direct instructions, no questions

**Issue #2:** Import errors (ReferenceError)
- Workaround: Ask Base44 to verify .jsx extensions

**Issue #3:** Gemini API not configured
- Status: Future task (currently using Claude placeholder)

**Issue #4:** Asana webhook handshake
- Solution: Respond with X-Hook-Secret header on first request

---

**Last Updated:** 2025-01-19  
**Phase Status:** Phase 1 completing, Phase 2 planned, Asana integration at 95%  
**Next Milestone:** Asana webhook creation + incomplete case workflow testing

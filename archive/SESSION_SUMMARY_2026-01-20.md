# Session Summary: Mark's Feature Requests & Email Drafting

**Date:** 2026-01-20
**Duration:** Extended planning/strategy session
**Context:** Preparing communication with Mark (Chairman) about new feature requests for the Ascot Wealth Management Mortgage Assistant build

---

## Completed Tasks

### 1. Analysed Mark's Feature Requests
Unpacked three main initiatives Mark proposed:
- **Lender BDM Communication Agent** - Quarterly emails to lenders, follow-ups, building "Lender Style Bios"
- **Proactive Database Outreach Agent** - AI that assesses lender database and maintains communications
- **Client Acceptance Feature** - Fee disclosure and formal acknowledgment before applications

### 2. Assessed Technical Feasibility
Evaluated each feature against Base44 platform capabilities:

| Feature | Feasibility | Notes |
|---------|-------------|-------|
| Client acceptance capture | ✅ Achievable | Add field to MortgageCase + CommunicationLog |
| Basic lender outreach | ✅ Achievable | Zapier handles sending, Base44 logs |
| Lender bio storage | ✅ Achievable | Create new LenderBio entity |
| Intelligent email parsing | ⚠️ Difficult | Needs external AI processing |
| Autonomous "learning" | ❌ Not native | Requires vector DB / Notion / Pinecone middleware |

### 3. Reviewed Current Build Status
Analysed HANDOVER.md and current progress:
- Phase 1: ~95% complete (per Sam's update)
- 8 features built in 2 weeks
- 4 items remaining for Phase 1 completion
- Existing data model supports audit trails (CommunicationLog, AsanaSyncLog, Fee entities)

### 4. Addressed Fee Protection Strategy
Designed solution for £750 fee leakage problem:
- Anonymise lender names in pre-acceptance emails ("Lender A" instead of "Cambridge BS")
- Reveal actual lender only after client formally acknowledges fee terms
- Embed fee disclosure in email footers/T&Cs

### 5. Drafted Final Email to Mark
Created comprehensive email covering:
- Confirmation of understanding (3 features)
- Progress update (8 built, 4 remaining)
- Fee protection suggestion
- Two clarifying questions

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| No specific timeline estimates in email | Avoids creating deadlines that could backfire |
| Show progress as feature list, not percentages | Demonstrates momentum without inviting micromanagement |
| Include fee protection suggestion | Shows commercial thinking, addresses real revenue leak |
| Ask about assist vs automate goal | Critical architectural decision that affects entire build |
| Ask about lender bio UX approach | Prevents building wrong interface for institutional knowledge capture |

---

## Next Steps

### Immediate (After Mark Responds)

**If he confirms "assist with automation where possible":**
- Continue Phase 1 completion
- Plan human-in-the-loop approval layer
- Identify safe-to-automate workflows

**If he wants full replacement/automation:**
- Discuss middleware architecture (Notion as central hub)
- Plan for more complex build timeline
- Consider Base44 limitations for long-term

**Based on lender bio UX answer:**
- Design structured fields vs freeform notes vs hybrid
- Plan Notion integration for knowledge base sync

### Phase 1 Completion (This Week)
- [ ] Connect rate scraper to knowledge base
- [ ] Activate Asana webhook connection
- [ ] Implement lender matching function
- [ ] Refine triage scoring accuracy

### Future Phases (After Mark Alignment)
- [ ] Client acceptance capture tool
- [ ] Fee protection (anonymised lenders)
- [ ] Basic lender outreach system
- [ ] Lender Style Bios (UX based on Mark's preference)

---

## Technical Context

### Current Tech Stack
| Component | Technology |
|-----------|------------|
| Main Build | Base44 (low-code platform) |
| Task Management | Asana (core system) |
| Automation | Zapier (190 active zaps) |
| Knowledge Base | Notion (planned) |
| Future consideration | Pinecone/vector DB for autonomous features |

### Base44 Limitations Identified
- No native Zapier/Asana integrations (webhook/API only)
- Cannot handle intelligent email parsing natively
- "Learning" features require external middleware
- Integration constraints may force rebuild to Next.js eventually

---

## Files Referenced

| File | Purpose |
|------|---------|
| HANDOVER.md | Project documentation - reviewed for build context |

---

## Final Email to Mark

```
Hi Mark,

Thanks for sharing your thoughts on the additional functionality. I want to make sure we're aligned on the vision before we plan how these fit into the build.

**My understanding of what you're proposing:**

1. **Lender BDM Communication Agent** - An AI that emails lenders periodically, follows up if no response, handles replies to questions/forms, and builds "Lender Style Bios" capturing responses and intelligence. These bios would be editable by analysts/assistants and help the system learn lender-specific information over time.

2. **Proactive Database Outreach Agent** - An AI that assesses our lender database and maintains ongoing communications, potentially gathering criteria updates and building our knowledge base through those conversations.

3. **Client Acceptance Feature** - Independent acceptance capture before proceeding with applications, with fee disclosure referenced at pre-quote stage and formal acknowledgment required before applications begin.

**Could you confirm:**
- Is the above what you had in mind, or is there anything you'd like to add or clarify?
- Where does this sit in priority against completing the current Phase 1?

**Where we're at:**

Production started 8th January. In two weeks we've built:
- Dashboard pipeline with triage colour-coding
- 4-step intake form
- Triage scoring backend and UI
- Lender database (8 lenders configured)
- Asana webhook endpoint (ready to connect)
- Report draft editor with version tracking
- n8n rate scraper (pending final import and test)

Remaining for Phase 1 completion:
- Connect rate scraper to knowledge base
- Activate Asana webhook connection
- Implement lender matching function
- Refine triage scoring accuracy

Once the foundation is solid, we can layer on the features you've described. Some are relatively contained (client acceptance, fee protection, basic lender outreach), while others are more involved (intelligent parsing of BDM responses, autonomous follow-ups, systems that "learn" over time).

On the fee protection point - I'm thinking we anonymise lender names in pre-acceptance communications (e.g., "Lender A offers 5.34%..." rather than naming them), with actual details revealed only after the client formally acknowledges the fee terms. This protects against clients taking our research and going direct. Worth discussing.

**Two questions that would help me plan:**

1. Is the goal to build an **assistant tool** that supports the adviser/broker workflow, or is the longer-term vision to **fully automate** certain parts of that role? Both are valid directions, but they lead to different architectures.

2. On the **Lender Style Bios** - how do you see these working in practice?
   - **Structured profiles** - specific fields (processing time, criteria quirks, BDM responsiveness) that get manually updated. Easy to search and filter.
   - **Freeform notes** - brokers/assistants add notes after cases or interactions, AI periodically summarises into a profile.
   - **Hybrid** - structured fields for key criteria, plus notes that AI analyses for patterns.

   This will help me design the right UX for how lender intelligence gets captured, displayed, and used during case triage.

Happy to walk through any of this in more detail.

Sam
```

---

## Key Insights from Session

1. **Base44 can handle Phase 1 and basic automation** but will hit walls with intelligent/learning features

2. **Notion as middleware** is a sound strategy for knowledge base flexibility

3. **The "assist vs automate" question** is critical - different answers lead to fundamentally different builds

4. **Fee protection through anonymisation** is a quick win that addresses real revenue leakage (~£thousands/year)

5. **Lender bios are institutional memory** - UX design here is crucial and needs Mark's input before building

6. **No timeline commitments** - show progress through completed features, not dates

---

## Realistic Timeline Context (Internal Reference Only)

From separate Claude assessment:
- MVP completion: 1-2 days
- Phase 4 email system: 3-5 days
- Total realistic: ~1 week with 40+ hour commitment
- Buffer needed for Base44 iterations and testing

**Note:** These estimates were NOT shared with Mark to avoid creating rigid expectations.

---

**Session Status:** ✅ Complete
**Next Action:** Send email to Mark, await response
**File Created:** SESSION_SUMMARY_2026-01-20.md

---

*Last Updated: 2026-01-20*

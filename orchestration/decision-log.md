# Decision Log - Base44 Quality & Integration Orchestration

All significant decisions made during orchestration are tracked here.

---

## Decision 001: Framework Selection
**Date:** 2026-01-22
**Phase:** Pre-orchestration
**Decision:** Use Custom Orchestrator framework
**Rationale:**
- Multi-phase project (5 distinct phases)
- FCA compliance requires audit trail
- High human oversight needed (legal review)
- Complex integration (Asana + n8n + Base44)
- Supports parallel execution (Phase 3 & 4 independent)
- Moderate token cost (sustainable)

**Alternatives Considered:**
- GSD: Too greenfield-focused, minimal compliance support
- Ralph: Mechanical tasks only, no compliance support

**Match Score:** 8.7/10

---

## Decision 002: Phase Sequencing
**Date:** 2026-01-22
**Phase:** Pre-orchestration
**Decision:** Critical path = Phase 1 → Phase 2 → Phase 5; Phases 3 & 4 can run in parallel
**Rationale:**
- Phase 1 (FCA Compliance) is highest legal risk - must complete first
- Phase 2 (Webhook Security) builds on Phase 1 approval concepts
- Phase 5 (Bug Investigation) blocked by external dependency (n8n Cloud)
- Phases 3 & 4 have no dependencies on other phases

**Impact:** Enables parallel work to reduce calendar time

**Note:** This decision was later superseded by Decision 005 (scope reduction to Phase 1 only)

---

## Decision 003: Minimal Q&A Approach
**Date:** 2026-01-22
**Phase:** 01 - Research & Discovery
**Decision:** Conduct targeted Q&A focused on gaps in existing documentation
**Rationale:**
- Extensive analysis already completed (ORCHESTRATION_BRIEF.md, BASE44_IMPLEMENTATION_PLAN.md)
- Codebase explored (7,800 LOC frontend + 7,800 LOC backend)
- Architecture documented
- FCA compliance gaps identified
- Need to validate assumptions and fill specific gaps only

**Questions Focus:**
- FCA compliance requirements confirmation
- n8n Cloud setup timeline
- Priority validation
- Security concerns for Phase 2
- Legal team availability

---

## Decision 004: Zapier Email Integration Architecture
**Date:** 2026-01-22T03:30:00Z
**Phase:** 02 - Planning (Revised)
**Decision:** Use Zapier for email sending instead of Base44 Core.SendEmail directly

### Background

**User Requirements Discovered:**
- 5 adviser teams with ~4 support members each need collaboration
- Email should appear from individual adviser (display name masking)
- Actual sender: operations@ascotwm.com
- Display name: Adviser name (e.g., "Mark Thomson")
- Team CC'd on client replies for collaboration
- Asana activity logging required

**Technical Investigation:**
- Base44 currently uses Core.SendEmail (platform service)
- Core.SendEmail only allows from_name, not from_email control
- Cannot achieve display name masking with Base44 alone
- No team collaboration features in Base44 email system

### Chosen Architecture

```
Base44 Approval Workflow
  ↓ (webhook trigger)
Zapier Webhook Receiver
  ↓ (Gmail integration)
Email Sent (operations@ascotwm.com as "Mark Thomson")
  ↓ (Asana integration)
Asana Comment Posted
  ↓ (confirmation webhook)
Base44 Status Update (status = 'sent')
```

### Alternatives Considered

1. **Base44 Core.SendEmail only**
   - ❌ No team collaboration features
   - ❌ Cannot mask display name per adviser
   - ❌ No Asana integration

2. **SendGrid/AWS SES Direct Integration**
   - ❌ More complex implementation
   - ❌ Doesn't provide team collaboration
   - ❌ Requires managing email infrastructure
   - ❌ User already prefers Zapier

3. **Manual Email Forwarding**
   - ❌ Not scalable
   - ❌ No audit trail
   - ❌ Human error prone

### Implementation Impact

**Added Tasks:**
- Task 03-03: Zapier webhook trigger function (1-2 hours)
- Task 03-04: Zapier confirmation webhook receiver (1 hour)

**Revised Tasks:**
- Task 03-01: Added database fields (assignedAdviserName, assignedAdviserEmail, asanaTaskGid)
- Task 03-05: Frontend UI includes adviser name/email selection

**Time Estimate:**
- Original: 6.5-10 hours (Base44-only approach)
- Revised: 10-13 hours (Zapier integration approach)
- Increase: +3 hours for webhook integration

**External Dependencies:**
- User must configure Zapier workflow (catch hook + Gmail send + Asana comment + confirmation POST)
- User must obtain Zapier webhook URL
- User must generate shared secret for webhook validation

### Benefits

✅ **FCA Compliance:** Approval workflow in Base44 provides required audit trail
✅ **Team Collaboration:** Zapier handles CC, reply threading, forwarding
✅ **Display Name Masking:** Emails appear from individual advisers (operations@ascotwm.com as "Mark Thomson")
✅ **Asana Integration:** Activity logging via Asana comments
✅ **Flexibility:** Zapier allows easy workflow modifications without code changes
✅ **User Preference:** User already familiar with Zapier, prefers this approach

### Trade-offs

⚠️ **External Dependency:** Zapier failure = emails won't send
   - **Mitigation:** Retry logic (3 attempts with exponential backoff)
   - **Fallback Option:** Can revert to Base44 Core.SendEmail if needed

⚠️ **Bi-Directional Webhooks:** Requires stable webhook endpoints
   - **Mitigation:** HMAC signature validation, rate limiting

⚠️ **Configuration Overhead:** User must configure Zapier workflow
   - **Mitigation:** Detailed implementation guide provided

⚠️ **Cost:** Zapier subscription required (vs free Base44 email)
   - **Justification:** Team collaboration value outweighs cost

### Documentation Created

- **[orchestration/IMPLEMENTATION_GUIDE_ZAPIER_EMAIL.md](IMPLEMENTATION_GUIDE_ZAPIER_EMAIL.md)** - Complete implementation reference for sub-agents
- **[.claude/plans/dapper-spinning-brook.md](../.claude/plans/dapper-spinning-brook.md)** - Architecture plan with task breakdown

### Success Criteria

- [ ] Email cannot be sent without approval (FCA compliance)
- [ ] Zapier receives webhook with all required fields
- [ ] Email sent with correct display name (adviser name, not operations@)
- [ ] Asana comment posted with activity log
- [ ] Confirmation webhook updates Base44 status to 'sent'
- [ ] Audit trail captures all approval actions

---

## Decision 005: Scope Reduction to Phase 1 Only
**Date:** 2026-01-22T03:00:00Z
**Phase:** 02 - Planning (Revised)
**Decision:** Reduce orchestration scope from 5 phases to Phase 1 only (FCA Compliance with Zapier integration)

### Rationale

**User Feedback:**
- "Pause implementation and reintroduce a planning phase"
- "Dashboard backend needs to be finalized before we can continue"
- Webhook strategy (n8n vs Zapier) needs separate planning session

**Blockers Identified:**
- n8n Cloud not yet set up (blocks Phase 5 bug investigation)
- Webhook platform decision needed (n8n vs Zapier for Asana integration)
- Dashboard refinements ongoing

**Phase Independence:**
- Phase 1 (FCA Compliance) is independent and can proceed immediately
- Phases 2-5 depend on webhook strategy decision or dashboard completion
- Legal team available this week for Phase 1 review

### Impact

**Deferred Phases:**
- Phase 2: Webhook Security (depends on n8n vs Zapier decision)
- Phase 3: Code Quality Refactoring (independent, can do anytime)
- Phase 4: Scalability/Pagination (independent, can do anytime)
- Phase 5: Bug Investigation (blocked by n8n Cloud setup)

**Current Focus:**
- Phase 1 only: FCA Compliance approval workflow with Zapier email integration

**Benefits:**
- Focused implementation (10-13 hours vs 38-58 hours)
- Legal team can review immediately (compliance is time-sensitive)
- Allows user to complete webhook strategy planning in parallel
- Dashboard can be refined without blocking progress

### Resumption Plan

User will:
1. Complete webhook strategy planning (n8n vs Zapier) in separate session
2. Finalize dashboard backend
3. Resume orchestration for Phases 2-5 with updated plan

---

*Future decisions will be appended below*

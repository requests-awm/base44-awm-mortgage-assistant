# Q&A Synthesized Requirements - Phase 1: Research & Discovery

**Date:** 2026-01-22
**Phase:** 01 - Research & Discovery
**Synthesized from:** qa-log-raw.md

---

## Executive Summary

**Scope Change:** Original 5-phase orchestration reduced to **Phase 1 only** (FCA Compliance).

**Rationale:**
- Webhook platform decision (n8n vs Zapier) requires separate planning session
- Phase 1 can proceed independently of webhook strategy
- Other phases (2-5) depend on webhook platform choice
- User wants focused, clean implementation rather than rushing ahead

**Phase 1 Scope:** Core email approval state machine (simplified from original plan)

---

## Phase 1: FCA Compliance Requirements

### Objective
Implement mandatory approval workflow for client-facing emails to satisfy FCA supervisory review requirements.

### Core Requirements

#### 1. Approval State Machine
**Required:** YES

**States:**
- `draft` - Email created but not submitted
- `pending_approval` - Submitted for review
- `approved` - Approved and ready to send
- `sent` - Email has been sent

**Transitions:**
```
draft → pending_approval → approved → sent
         ↓                    ↓
         draft (rejected)     draft (edited)
```

#### 2. 24-Hour Delay Enforcement
**Required:** NO (explicitly excluded by user)

**Rationale:** User selected only "Approval state machine" option, not delay enforcement.

#### 3. Emergency Override Capability
**Required:** NO (explicitly excluded by user)

**Rationale:** Not selected by user; can be added in future iteration if needed.

#### 4. Audit Trail Logging
**Required:** MINIMAL (implied by compliance need)

**Must Track:**
- Who submitted for approval (submittedBy)
- When submitted (submittedAt)
- Who approved (approvedBy)
- When approved (approvedAt)
- State transitions

**Not Required (for MVP):**
- Rejection reasons
- Edit history
- Override justifications
- Full action log

---

## Legal Review Availability

**Status:** Legal team available this week

**Impact:**
- Can implement Phase 1 immediately
- Should design workflow for legal review before production use
- Legal team will validate compliance approach within days

**Action Items:**
1. Implement core approval workflow
2. Document approval process clearly
3. Schedule legal team review after implementation
4. Adjust based on legal feedback before production

---

## Webhook Strategy (Deferred)

### Current Status
**Decision:** Deferred to separate planning session

### Context
- User has n8n Cloud account (accessible)
- Discovered Zapier as potentially superior alternative
- Zapier has better Asana integration
- Zapier webhooks may be easier to configure
- Original webhook approach was workaround for Base44 constraints

### Planning Needs
**Key Questions to Explore:**
1. Do Base44 constraints still apply?
2. n8n vs Zapier: scalability comparison
3. n8n vs Zapier: manageability comparison
4. n8n vs Zapier: reliability comparison
5. Is there a cleaner manual approach?
6. What are best practices for Base44 integrations?

### Timeline
- No firm deadline
- Can be addressed in separate chat today or later
- Should not block Phase 1 implementation

### Impact on Orchestration
- Phase 2 (Webhook Security) - **DEFERRED** (depends on platform choice)
- Phase 3 (Code Quality) - **DEFERRED** (may change based on integration approach)
- Phase 4 (Scalability) - **DEFERRED** (independent but deferred per user request)
- Phase 5 (Bug Investigation) - **DEFERRED** (depends on webhook setup)

---

## Security Requirements (For Future Phase 2)

**When webhook strategy is finalized:**

### Required
- HMAC signature verification (user-confirmed)

### Not Required (for MVP)
- Rate limiting (not selected by user)
- IP whitelisting (not selected by user)

**Note:** User selected ONLY HMAC signature verification, suggesting focus on cryptographic verification rather than additional layers.

---

## Priority Confirmation

**Top Priority:** FCA Compliance (Phase 1)

**Reasoning:**
- Highest legal risk
- Mandatory for production operation
- Can be completed independently
- Legal team available for review

**Deferred Priorities:**
- All other phases await webhook strategy decision
- User prefers focused, sequential approach

---

## Outstanding Questions (For Implementation)

### 1. Approval Permissions
**Question:** Who should have approval permissions?
**Options:**
- All advisers
- Senior advisers only
- Specific compliance role

**Assumption:** Make configurable via Base44 user roles; document in legal review.

---

### 2. Email Draft Editing
**Question:** What happens to pending approvals if email draft is edited?
**Options:**
- Approval remains valid
- Approval resets to draft (requires re-approval)
- Approval becomes invalid with warning

**Assumption:** Reset to draft (safest for compliance); document in legal review.

---

### 3. Rejection Workflow
**Question:** Should there be explicit rejection capability?
**Options:**
- Add "rejected" state with mandatory reason
- Just allow returning to draft without reason
- No rejection - only approve or abandon

**Assumption:** Allow returning to draft without mandatory reason (simplifies MVP); can enhance later.

---

### 4. State Storage
**Question:** Where should approval state be stored?
**Options:**
- Add fields to existing MortgageCase entity
- Create separate EmailApproval entity
- Store in email draft metadata

**Assumption:** Add fields to MortgageCase entity for simplicity; document schema changes.

---

## Implementation Boundaries

### In Scope (Phase 1)
✅ Core approval state machine (4 states)
✅ Minimal audit trail (who, when for submit/approve)
✅ UI workflow in EmailDraftModal.jsx
✅ Backend validation in sendReportEmail.ts
✅ State transitions with safeguards
✅ Documentation for legal review

### Out of Scope (Deferred)
❌ 24-hour delay enforcement
❌ Emergency override capability
❌ Comprehensive audit logging (detailed action history)
❌ Rejection workflow with reasons
❌ Edit history tracking
❌ Email template versioning
❌ Webhook security (Phase 2)
❌ Code refactoring (Phase 3)
❌ Pagination (Phase 4)
❌ Bug investigation (Phase 5)

---

## Success Criteria (Phase 1 Only)

### Functional
- [ ] Email cannot be sent without approval
- [ ] Approval state transitions work correctly
- [ ] Approver identity captured in entity
- [ ] Approval timestamp recorded
- [ ] UI clearly shows current state
- [ ] Backend validates approval before sending

### Compliance
- [ ] Legal team reviews and approves workflow
- [ ] Audit trail demonstrates supervisory review
- [ ] FCA principles satisfied (supervisory oversight, record-keeping)

### Technical
- [ ] No breaking changes to existing functionality
- [ ] Email drafts continue to work for existing workflows
- [ ] Code follows Base44 constraints (no localStorage, etc.)
- [ ] Changes are reversible if legal team requests modifications

---

## Next Steps

1. **Complete Phase 1 Planning**
   - Break down implementation into tasks
   - Identify files to modify/create
   - Define validation approach

2. **Implement Phase 1**
   - Backend: Add approval fields to entity
   - Backend: Create approval validation function
   - Frontend: Update EmailDraftModal with approval UI
   - Frontend: Add state transition logic

3. **Validate Phase 1**
   - Test all state transitions
   - Verify approval enforcement
   - Check audit trail completeness

4. **Legal Review**
   - Document approval workflow
   - Present to legal team
   - Adjust based on feedback

5. **Separate Webhook Planning**
   - Create new chat for n8n vs Zapier evaluation
   - Evaluate scalability, manageability, reliability
   - Test Base44 constraints
   - Choose platform and document rationale

6. **Future Phases**
   - Resume orchestration for Phases 2-5 after webhook strategy finalized
   - Adjust implementation plan based on webhook platform choice

---

## Risk Mitigation

### Risk: Legal team rejects simplified approach
**Likelihood:** Low (research shows audit trail + approval is sufficient)
**Mitigation:** Designed for easy enhancement (can add 24hr delay, override, detailed logging)

### Risk: Webhook strategy changes affect Phase 1
**Likelihood:** Very Low (email approval is independent of webhook platform)
**Mitigation:** Phase 1 implementation agnostic to webhook choice

### Risk: User changes scope mid-implementation
**Likelihood:** Low (clear requirements gathered)
**Mitigation:** Checkpointing via git tags allows easy rollback

---

## Conclusion

**Clear path forward:** Implement simplified but compliant email approval workflow (Phase 1 only).

**Key Simplifications:**
- No 24-hour delay
- No override capability
- Minimal audit trail (who/when only)
- Single phase focus

**Benefits:**
- Faster implementation (12-16 hours estimated → likely 6-8 hours with reduced scope)
- Lower risk (fewer moving parts)
- Legal team available for validation this week
- Independent of webhook strategy decision

**User can resume orchestration** for remaining phases after webhook platform is chosen and evaluated in separate planning session.

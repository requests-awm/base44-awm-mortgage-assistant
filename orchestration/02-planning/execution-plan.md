# Execution Plan - Phase 1: FCA Compliance Implementation

**Date:** 2026-01-22
**Phase:** 02 - Planning
**Target:** Phase 1 (FCA Compliance) Implementation Only

---

## Executive Summary

**Objective:** Implement core email approval workflow to satisfy FCA supervisory review requirements

**Scope:** Simplified from original 5-phase plan based on user direction
- ✅ Phase 1: FCA Compliance (THIS PLAN)
- ❌ Phases 2-5: Deferred pending webhook strategy decision

**Estimated Time:** 6-8 hours (reduced from 12-16 hours due to simplified scope)

---

## Implementation Strategy

### Core Components

1. **Database Schema** - Add approval fields to MortgageCase entity
2. **Backend Logic** - Create approval functions and validation
3. **Frontend UI** - Update EmailDraftModal with approval workflow
4. **State Management** - Handle approval state transitions
5. **Validation** - Test all workflows and edge cases

### Approval Workflow

```
┌──────┐
│Draft │ ← User creates email draft
└──┬───┘
   │ Submit for Approval
   ▼
┌────────────────┐
│Pending Approval│ ← Awaiting approval
└──┬────┬────────┘
   │    │
   │    └─→ Reject (return to draft)
   │
   │ Approve
   ▼
┌────────┐
│Approved│ ← Ready to send
└──┬─────┘
   │
   │ Send Email
   ▼
┌──────┐
│ Sent │ ← Email delivered
└──────┘
```

---

## Task Breakdown

### Task 03-01: Database Schema Changes
**Type:** Backend - Data Model
**Complexity:** Simple
**Estimated Time:** 0.5-1 hour
**Dependencies:** None

**Objective:** Add approval workflow fields to MortgageCase entity

**Changes:**
- Add `emailApprovalStatus` enum field
- Add `emailSubmittedBy` string field
- Add `emailSubmittedAt` timestamp field
- Add `emailApprovedBy` string field
- Add `emailApprovedAt` timestamp field

**Files to Create:** None (configure via Base44 admin panel)

**Files to Document:**
- Create `docs/schema-changes.md` documenting new fields

**Validation:**
- Verify fields appear in Base44 entity configuration
- Test field types accept expected values
- Confirm fields can be queried

---

### Task 03-02: Backend Approval Functions
**Type:** Backend - Business Logic
**Complexity:** Moderate
**Estimated Time:** 2-3 hours
**Dependencies:** Task 03-01 (schema must exist)

**Objective:** Create backend functions for approval workflow state transitions

**Files to Create:**
1. `functions/submitEmailForApproval.ts`
   - Validates draft exists
   - Sets status to 'pending_approval'
   - Captures submittedBy and submittedAt
   - Returns updated case

2. `functions/approveEmail.ts`
   - Validates pending status
   - Sets status to 'approved'
   - Captures approvedBy and approvedAt
   - Returns updated case

3. `functions/rejectEmail.ts` (or return to draft)
   - Validates pending status
   - Sets status back to 'draft'
   - Clears approval metadata
   - Returns updated case

**Files to Modify:**
1. `functions/sendReportEmail.ts`
   - Add validation: emailApprovalStatus === 'approved'
   - Throw error if not approved
   - Update status to 'sent' after successful send

**Validation:**
- Unit test each function with mock data
- Test state transitions: draft → pending → approved → sent
- Test rejection: pending → draft
- Test error: attempt send without approval

---

### Task 03-03: Frontend UI Updates
**Type:** Frontend - UI/UX
**Complexity:** Moderate
**Estimated Time:** 2-3 hours
**Dependencies:** Task 03-02 (backend functions must exist)

**Objective:** Update EmailDraftModal with approval workflow UI

**Files to Modify:**
1. `src/components/email/EmailDraftModal.jsx`
   - Add approval status badge display
   - Add "Submit for Approval" button (draft state)
   - Add "Approve" button (pending_approval state)
   - Add "Reject" / "Return to Draft" button (pending_approval state)
   - Conditional "Send Email" button (only enabled when approved)
   - Display approval metadata: "Approved by [name] on [date]"
   - Update button visibility based on current status

**UI Requirements:**
- Clear visual distinction between states (badges, colors)
- Disabled state for "Send Email" when not approved
- Confirmation dialog for approval/rejection
- Loading states for async actions

**Validation:**
- Visual test: All states render correctly
- Interaction test: Buttons trigger correct actions
- Edge case test: What if approval fails?

---

### Task 03-04: State Management Integration
**Type:** Frontend - State Management
**Complexity:** Simple
**Estimated Time:** 1-2 hours
**Dependencies:** Task 03-02, Task 03-03

**Objective:** Integrate approval workflow with React Query cache management

**Files to Modify:**
1. `src/api/base44Client.js` (or relevant API client)
   - Add methods for approval actions
   - Invalidate case queries after status changes

**Changes:**
- Wrap new approval functions in React Query mutations
- Invalidate relevant queries on success
- Handle optimistic updates (optional)
- Error handling and retry logic

**Validation:**
- Test cache invalidation after approval
- Test UI updates reflect backend state
- Test concurrent user scenarios (if applicable)

---

### Task 03-05: Integration Testing
**Type:** Testing - End-to-End
**Complexity:** Simple
**Estimated Time:** 1 hour
**Dependencies:** All previous tasks

**Objective:** Validate complete approval workflow end-to-end

**Test Scenarios:**
1. **Happy Path:** Draft → Submit → Approve → Send
2. **Rejection Path:** Draft → Submit → Reject → Edit → Resubmit
3. **Security Path:** Attempt send without approval (should fail)
4. **Edit Path:** Approve → Edit (status should reset to draft)
5. **Audit Trail:** Verify all who/when fields captured correctly

**Files to Create:**
- `tests/email-approval-workflow.test.ts` (or similar)

**Validation:**
- All scenarios pass
- No console errors
- Approval metadata captured correctly
- Legal team can review workflow documentation

---

## Task Dependency Graph

```
03-01 (Schema)
  │
  ↓
03-02 (Backend Functions)
  │
  ├──→ 03-03 (Frontend UI)
  │      │
  │      ↓
  └──→ 03-04 (State Management)
         │
         ↓
      03-05 (Integration Testing)
```

**Parallel Opportunities:** None (sequential dependencies)

**Critical Path:** 03-01 → 03-02 → 03-03 → 03-04 → 03-05

---

## Files Summary

### Files to Create (5)
1. `functions/submitEmailForApproval.ts`
2. `functions/approveEmail.ts`
3. `functions/rejectEmail.ts`
4. `docs/schema-changes.md`
5. `tests/email-approval-workflow.test.ts`

### Files to Modify (3)
1. `functions/sendReportEmail.ts`
2. `src/components/email/EmailDraftModal.jsx`
3. `src/api/base44Client.js`

### Files to Configure (1)
1. Base44 Entity: MortgageCase (add 5 approval fields)

---

## Risk Assessment

### Low Risk
✅ Simple approval workflow (4 states, clear transitions)
✅ Non-breaking changes (existing email flow continues to work)
✅ Well-defined requirements from research phase
✅ Legal team available for validation

### Medium Risk
⚠️ **UI changes to EmailDraftModal**
- Risk: Could break existing draft functionality
- Mitigation: Thorough testing, git revert capability

⚠️ **Schema changes to MortgageCase entity**
- Risk: Could affect other parts of application
- Mitigation: Add fields as optional, don't modify existing fields

### No High Risk Identified

---

## Validation Strategy

### Unit Testing
- Test each backend function independently
- Mock Base44 SDK responses
- Test state transition logic

### Integration Testing
- Test complete workflows end-to-end
- Use test environment (not production)
- Validate approval metadata captured

### UI Testing
- Visual regression testing (screenshots)
- Manual testing of all button states
- Cross-browser compatibility (if needed)

### Compliance Testing
- Document workflow for legal review
- Verify audit trail completeness
- Confirm FCA principles satisfied

---

## Rollback Plan

If legal team requires changes:
1. **Minor Changes:** Adjust fields/UI based on feedback
2. **Major Changes:** Revert commits, redesign based on requirements
3. **Complete Rollback:** Use git tags to revert to pre-implementation state

**Git Safety:**
- Each task commits independently
- Tags mark completion of each task
- Easy to revert specific tasks without affecting others

---

## Post-Implementation Checklist

- [ ] All 5 tasks completed
- [ ] Integration tests passing
- [ ] No console errors or warnings
- [ ] Visual UI review completed
- [ ] Documentation created for legal review
- [ ] Schema changes documented
- [ ] Code committed with descriptive messages
- [ ] PROGRESS.md updated

**Then:**
- [ ] Schedule legal team review
- [ ] Present approval workflow documentation
- [ ] Adjust based on feedback
- [ ] Deploy to production (after approval)

---

## Next Phase Triggers

**Phase 3 (Implementation) starts when:**
- This planning phase complete
- Task specifications finalized
- User approves execution plan

**Phases 2-5 resume when:**
- User completes webhook strategy planning (separate session)
- n8n vs Zapier decision finalized
- Updated implementation plan created for remaining phases

---

## Estimated Timeline

| Task | Hours | Cumulative |
|------|-------|------------|
| 03-01: Schema | 0.5-1 | 1h |
| 03-02: Backend | 2-3 | 4h |
| 03-03: Frontend | 2-3 | 7h |
| 03-04: State Mgmt | 1-2 | 9h |
| 03-05: Testing | 1 | 10h |
| **Total** | **6.5-10h** | |

**Realistic Estimate:** 8 hours (1 developer day)

**Originally Estimated:** 12-16 hours (Phase 1 full scope)
**Reduction Reason:** Simplified scope (no 24hr delay, no override, minimal audit)

---

## Success Criteria

### Functional
✅ Email cannot be sent without approval
✅ Approval state transitions work correctly
✅ Approver identity captured
✅ Approval timestamp recorded
✅ UI clearly shows current state
✅ Backend validates approval before sending

### Compliance
✅ Legal team reviews and approves workflow
✅ Audit trail demonstrates supervisory review
✅ FCA principles satisfied (supervisory oversight, record-keeping)

### Technical
✅ No breaking changes to existing functionality
✅ Email drafts continue to work
✅ Code follows Base44 constraints
✅ Changes are reversible if needed

---

## Conclusion

**Ready to proceed** with Phase 3 (Implementation) execution.

**Plan is:**
- Well-defined with clear tasks
- Properly scoped based on user requirements
- Technically feasible with low risk
- Compliant with regulatory principles

**User approval recommended** before proceeding to implementation phase.

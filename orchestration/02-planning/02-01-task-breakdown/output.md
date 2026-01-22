# Task Breakdown Output - Phase 1 Implementation Tasks

**Date:** 2026-01-22
**Phase:** 02 - Planning
**Task:** 02-01 - Task Breakdown

---

## Task Specifications for Phase 3: Implementation

The following tasks will be executed in Phase 3. Each task has a detailed specification that can be used for autonomous execution by sub-agents or main orchestrator.

---

## Task 03-01: Database Schema Changes

### Metadata
- **Task ID:** 03-01
- **Type:** Backend - Data Model
- **Complexity:** Simple
- **Estimated Time:** 0.5-1 hour
- **Dependencies:** None
- **Can Run in Parallel:** No (foundational task)

### Objective
Add email approval workflow fields to the MortgageCase entity in Base44.

### Requirements
Add 5 new fields to MortgageCase entity:

| Field Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `emailApprovalStatus` | enum | No | 'draft' | Current approval state |
| `emailSubmittedBy` | string | No | null | User who submitted for approval |
| `emailSubmittedAt` | timestamp | No | null | When submitted for approval |
| `emailApprovedBy` | string | No | null | User who approved email |
| `emailApprovedAt` | timestamp | No | null | When email was approved |

**Enum Values for `emailApprovalStatus`:**
- `draft` - Initial state, email not yet submitted
- `pending_approval` - Submitted and awaiting approval
- `approved` - Approved and ready to send
- `sent` - Email has been sent

### Implementation Steps
1. Access Base44 admin panel → Entities → MortgageCase
2. Add each field with specified type and constraints
3. Set `emailApprovalStatus` default value to 'draft'
4. Make all fields optional (not required)
5. Save entity configuration

### Files to Create
- `docs/schema-changes.md` - Documentation of new fields

### Files to Modify
None (configuration via Base44 admin)

### Validation
- [ ] All 5 fields appear in Base44 entity editor
- [ ] `emailApprovalStatus` enum has 4 values
- [ ] Default value for `emailApprovalStatus` is 'draft'
- [ ] All fields are optional (nullable)
- [ ] Fields can be queried via Base44 SDK
- [ ] Test case creation with new fields succeeds

### Base44 Constraints
- Field names use camelCase (not snake_case)
- No special characters in field names
- Enum values are strings (not integers)

### Success Criteria
Schema changes deployed and validated via Base44 SDK test query.

---

## Task 03-02: Backend Approval Functions

### Metadata
- **Task ID:** 03-02
- **Type:** Backend - Business Logic
- **Complexity:** Moderate
- **Estimated Time:** 2-3 hours
- **Dependencies:** Task 03-01 (schema must exist)
- **Can Run in Parallel:** No (depends on 03-01)

### Objective
Create backend serverless functions for email approval workflow state transitions and validation.

### Requirements

#### Function 1: submitEmailForApproval.ts
**Purpose:** Submit email draft for approval

**Input:**
```typescript
{
  caseId: string,          // MortgageCase ID
  submittedBy: string      // User ID or email
}
```

**Logic:**
1. Fetch case by ID using `base44.asServiceRole`
2. Validate current status is 'draft'
3. Update case:
   - `emailApprovalStatus = 'pending_approval'`
   - `emailSubmittedBy = submittedBy`
   - `emailSubmittedAt = new Date()`
4. Return updated case

**Error Handling:**
- Case not found → 404
- Status not 'draft' → 400 "Email must be in draft state to submit"
- Update fails → 500

---

#### Function 2: approveEmail.ts
**Purpose:** Approve email for sending

**Input:**
```typescript
{
  caseId: string,         // MortgageCase ID
  approvedBy: string      // User ID or email
}
```

**Logic:**
1. Fetch case by ID using `base44.asServiceRole`
2. Validate current status is 'pending_approval'
3. Update case:
   - `emailApprovalStatus = 'approved'`
   - `emailApprovedBy = approvedBy`
   - `emailApprovedAt = new Date()`
4. Return updated case

**Error Handling:**
- Case not found → 404
- Status not 'pending_approval' → 400 "Email must be pending approval"
- Update fails → 500

---

#### Function 3: rejectEmail.ts (Return to Draft)
**Purpose:** Reject approval and return email to draft state

**Input:**
```typescript
{
  caseId: string         // MortgageCase ID
}
```

**Logic:**
1. Fetch case by ID using `base44.asServiceRole`
2. Validate current status is 'pending_approval'
3. Update case:
   - `emailApprovalStatus = 'draft'`
   - `emailSubmittedBy = null` (clear)
   - `emailSubmittedAt = null` (clear)
   - `emailApprovedBy = null` (clear)
   - `emailApprovedAt = null` (clear)
4. Return updated case

**Error Handling:**
- Case not found → 404
- Status not 'pending_approval' → 400 "Can only reject pending approvals"
- Update fails → 500

---

#### Modification: sendReportEmail.ts
**Purpose:** Add approval validation before sending

**Changes:**
1. At start of function, fetch case approval status
2. Validate `emailApprovalStatus === 'approved'`
3. If not approved, throw error "Email must be approved before sending"
4. After successful send, update `emailApprovalStatus = 'sent'`

### Files to Create
1. `functions/submitEmailForApproval.ts`
2. `functions/approveEmail.ts`
3. `functions/rejectEmail.ts`

### Files to Modify
1. `functions/sendReportEmail.ts`

### Validation
- [ ] Each function successfully updates case entity
- [ ] State transitions enforce business rules
- [ ] Error handling returns appropriate status codes
- [ ] sendReportEmail blocks unapproved sends
- [ ] sendReportEmail updates status to 'sent' on success

### Base44 Constraints
- Use `base44.asServiceRole` for entity operations (no auth required)
- API function paths cannot be nested (e.g., `/submitEmailForApproval` not `/email/submit`)
- Return JSON responses with proper CORS headers
- Use TypeScript for type safety

### Success Criteria
All backend functions tested and returning expected responses.

---

## Task 03-03: Frontend UI Updates

### Metadata
- **Task ID:** 03-03
- **Type:** Frontend - UI/UX
- **Complexity:** Moderate
- **Estimated Time:** 2-3 hours
- **Dependencies:** Task 03-02 (backend functions must exist)
- **Can Run in Parallel:** No (depends on 03-02)

### Objective
Update EmailDraftModal component to display approval workflow and provide action buttons.

### Requirements

#### UI States

**1. Draft State (`emailApprovalStatus === 'draft'`)**
- Show badge: "Draft" (gray)
- Show button: "Submit for Approval" (primary)
- Hide: "Approve", "Reject", "Send Email" buttons

**2. Pending Approval State (`emailApprovalStatus === 'pending_approval'`)**
- Show badge: "Pending Approval" (yellow)
- Show text: "Submitted by [submittedBy] on [submittedAt]"
- Show buttons: "Approve" (success), "Return to Draft" (secondary)
- Hide: "Submit for Approval", "Send Email" buttons

**3. Approved State (`emailApprovalStatus === 'approved'`)**
- Show badge: "Approved" (green)
- Show text: "Approved by [approvedBy] on [approvedAt]"
- Show buttons: "Send Email" (primary), "Edit" (returns to draft)
- Hide: "Submit for Approval", "Approve", "Reject" buttons

**4. Sent State (`emailApprovalStatus === 'sent'`)**
- Show badge: "Sent" (blue)
- Show text: "Sent on [sentAt]"
- All action buttons hidden (read-only)

#### Button Actions

**"Submit for Approval"**
- Calls `submitEmailForApproval` function
- Passes caseId and current user ID
- On success: Invalidate case query, show success message
- On error: Show error message

**"Approve"**
- Calls `approveEmail` function
- Passes caseId and current user ID
- Show confirmation dialog: "Approve this email for sending?"
- On success: Invalidate case query, show success message
- On error: Show error message

**"Return to Draft"**
- Calls `rejectEmail` function
- Passes caseId
- Show confirmation dialog: "Return to draft? Approval will be cleared."
- On success: Invalidate case query, show success message
- On error: Show error message

**"Send Email"** (existing)
- Keep existing sendReportEmail logic
- Backend will validate approval status
- If blocked, display error message from backend

**"Edit"**
- Returns to draft mode (UI only)
- Note: Any edits to content should reset status to 'draft' (implement in state management task)

### Files to Modify
1. `src/components/email/EmailDraftModal.jsx`
   - Add approval status badge
   - Add conditional button rendering
   - Add approval metadata display
   - Wire up button actions to API calls
   - Add confirmation dialogs
   - Add loading states during API calls

### Files to Read (Context)
1. `src/components/email/EmailDraftModal.jsx` - Current implementation
2. `src/components/ui/` - Existing UI components (buttons, badges, dialogs)

### Validation
- [ ] Draft state renders correctly with "Submit" button
- [ ] Pending state renders with "Approve" and "Reject" buttons
- [ ] Approved state renders with "Send Email" button enabled
- [ ] Sent state is read-only with no action buttons
- [ ] Approval metadata (who/when) displays correctly
- [ ] Confirmation dialogs appear before approval/rejection
- [ ] Loading states show during API calls
- [ ] Error messages display on failure
- [ ] Visual design matches existing UI patterns

### Base44 Constraints
- Cannot use localStorage for state (use React state)
- Use Base44 SDK methods for API calls
- Follow existing component patterns in codebase

### Success Criteria
EmailDraftModal UI updated and all approval actions functional.

---

## Task 03-04: State Management Integration

### Metadata
- **Task ID:** 03-04
- **Type:** Frontend - State Management
- **Complexity:** Simple
- **Estimated Time:** 1-2 hours
- **Dependencies:** Task 03-02, Task 03-03
- **Can Run in Parallel:** No (depends on 03-02 and 03-03)

### Objective
Integrate approval workflow with React Query for cache management and state synchronization.

### Requirements

#### React Query Mutations

**1. submitForApproval Mutation**
```typescript
const submitMutation = useMutation(
  (caseId) => base44.submitEmailForApproval(caseId, currentUser.id),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', caseId]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);
```

**2. approveEmail Mutation**
```typescript
const approveMutation = useMutation(
  (caseId) => base44.approveEmail(caseId, currentUser.id),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', caseId]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);
```

**3. rejectEmail Mutation**
```typescript
const rejectMutation = useMutation(
  (caseId) => base44.rejectEmail(caseId),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', caseId]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);
```

#### API Client Updates

Add methods to Base44 client wrapper:
```typescript
// In src/api/base44Client.js

export const base44Client = {
  // ... existing methods ...

  async submitEmailForApproval(caseId, userId) {
    return await fetch(`${BASE_URL}/submitEmailForApproval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
      body: JSON.stringify({ caseId, submittedBy: userId })
    }).then(res => res.json());
  },

  async approveEmail(caseId, userId) {
    return await fetch(`${BASE_URL}/approveEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
      body: JSON.stringify({ caseId, approvedBy: userId })
    }).then(res => res.json());
  },

  async rejectEmail(caseId) {
    return await fetch(`${BASE_URL}/rejectEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
      body: JSON.stringify({ caseId })
    }).then(res => res.json());
  }
};
```

#### Edge Case: Content Editing

If user edits email content while status is 'approved':
- Reset `emailApprovalStatus` to 'draft' automatically
- Clear approval metadata (approvedBy, approvedAt)
- Rationale: Edited content was not approved

### Files to Modify
1. `src/api/base44Client.js` - Add approval API methods
2. `src/components/email/EmailDraftModal.jsx` - Wire mutations (if not done in 03-03)

### Files to Read (Context)
1. Existing React Query patterns in codebase
2. Current base44Client implementation

### Validation
- [ ] Mutations trigger API calls correctly
- [ ] Query invalidation refreshes UI after state changes
- [ ] Error handling propagates to UI
- [ ] Edit-after-approval resets status to draft
- [ ] Concurrent updates handled gracefully

### Base44 Constraints
- Use Base44 API key for authentication
- Follow existing API client patterns
- Use correct API endpoint format (no nested paths)

### Success Criteria
State management integrated, UI reflects backend state changes in real-time.

---

## Task 03-05: Integration Testing

### Metadata
- **Task ID:** 03-05
- **Type:** Testing - End-to-End
- **Complexity:** Simple
- **Estimated Time:** 1 hour
- **Dependencies:** All previous tasks (03-01, 03-02, 03-03, 03-04)
- **Can Run in Parallel:** No (final validation task)

### Objective
Validate complete email approval workflow end-to-end with all integration points.

### Requirements

#### Test Scenarios

**1. Happy Path: Draft → Submit → Approve → Send**
- Create case with email draft
- Submit for approval
- Approve email
- Send email
- Verify: Status progresses through all states
- Verify: Approval metadata captured (who, when)
- Verify: Email sent successfully

**2. Rejection Path: Draft → Submit → Reject → Edit → Resubmit**
- Create case with email draft
- Submit for approval
- Reject (return to draft)
- Edit email content
- Resubmit for approval
- Verify: Status resets to draft after rejection
- Verify: Approval metadata cleared
- Verify: Can resubmit after editing

**3. Security Path: Attempt Send Without Approval**
- Create case with email draft
- Attempt to send without approval
- Verify: Backend blocks send
- Verify: Error message displayed
- Verify: Status remains 'draft'

**4. Edit After Approval Path**
- Approve email
- Edit email content
- Verify: Status resets to 'draft'
- Verify: Approval metadata cleared
- Verify: Must re-approve before sending

**5. Audit Trail Validation**
- Submit email for approval
- Check database fields: emailSubmittedBy, emailSubmittedAt
- Approve email
- Check database fields: emailApprovedBy, emailApprovedAt
- Verify: All who/when fields populated correctly
- Verify: Timestamps are accurate

### Files to Create
1. `tests/email-approval-workflow.test.ts` - Automated tests (if test framework exists)
2. `docs/test-results.md` - Manual test results documentation

### Files to Modify
None

### Validation
- [ ] All 5 test scenarios pass
- [ ] No console errors during workflow
- [ ] Approval metadata captured correctly
- [ ] Backend validation enforced
- [ ] UI state synchronized with backend
- [ ] Legal compliance requirements met

### Base44 Constraints
- Test in Base44 test environment (if available)
- Use TEST Asana project GID: `1212782871770137`
- Do not test in production

### Success Criteria
All test scenarios pass; workflow ready for legal team review.

---

## Task Dependency Visualization

```
┌────────┐
│ 03-01  │ Database Schema
└───┬────┘
    │
    ↓
┌────────┐
│ 03-02  │ Backend Functions
└───┬────┘
    │
    ├─────────────┐
    │             │
    ↓             ↓
┌────────┐    ┌────────┐
│ 03-03  │    │ 03-04  │
│Frontend│    │ State  │
│  UI    │    │  Mgmt  │
└───┬────┘    └───┬────┘
    │             │
    └─────┬───────┘
          │
          ↓
      ┌────────┐
      │ 03-05  │ Integration Testing
      └────────┘
```

**Note:** Tasks 03-03 and 03-04 could potentially run in parallel if different developers work on them, but 03-04 depends on API client setup that may overlap with 03-03 implementation.

---

## Summary

### Total Tasks: 5

| Task ID | Name | Type | Complexity | Time | Dependencies |
|---------|------|------|------------|------|--------------|
| 03-01 | Database Schema | Backend | Simple | 0.5-1h | None |
| 03-02 | Backend Functions | Backend | Moderate | 2-3h | 03-01 |
| 03-03 | Frontend UI | Frontend | Moderate | 2-3h | 03-02 |
| 03-04 | State Management | Frontend | Simple | 1-2h | 03-02, 03-03 |
| 03-05 | Integration Testing | Testing | Simple | 1h | All |

### Total Estimated Time: 6.5-10 hours

### Files Impact
- **Create:** 5 new files (3 backend functions, 2 docs)
- **Modify:** 3 existing files (sendReportEmail.ts, EmailDraftModal.jsx, base44Client.js)
- **Configure:** 1 entity (MortgageCase schema)

### Parallel Opportunities
None significant (sequential dependencies dominate)

### Critical Path
03-01 → 03-02 → 03-03 → 03-04 → 03-05 (all sequential)

---

## Ready for Phase 3

These task specifications are detailed enough for:
- ✅ Autonomous execution by sub-agents
- ✅ Main orchestrator execution
- ✅ Manual implementation by developer
- ✅ Clear success criteria for each task
- ✅ Proper dependency mapping
- ✅ Comprehensive validation approach

**Next:** User approval of execution plan, then proceed to Phase 3: Implementation.

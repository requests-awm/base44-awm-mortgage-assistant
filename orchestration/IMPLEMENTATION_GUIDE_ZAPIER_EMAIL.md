# Implementation Guide: Zapier-Based Email Approval Workflow

**Project:** Base44 AWM Mortgage Assistant
**Date:** 2026-01-22
**Status:** Ready for Implementation
**Estimated Time:** 10-13 hours (~1.5 developer days)

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Implementation Tasks](#implementation-tasks)
5. [Zapier Configuration](#zapier-configuration)
6. [Testing Guide](#testing-guide)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Problem Statement
Base44 currently sends emails using `Core.SendEmail` (platform service) which:
- Sends from generic system email
- Cannot personalize sender display name by adviser
- Lacks team collaboration features (CC, reply threading)
- Doesn't integrate with Asana for activity logging

### Solution
**Hybrid Architecture:** FCA-compliant approval workflow in Base44 + Zapier for email delivery

**Benefits:**
- ✅ FCA compliance satisfied (approval audit trail in Base44)
- ✅ Adviser-specific email display names (via Zapier Gmail integration)
- ✅ Team collaboration on replies (Zapier handles CC/forwarding)
- ✅ Asana activity logging (Zapier comments on tasks)
- ✅ Flexible email routing (operations@ascotwm.com with display name masking)

---

## Architecture

### Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Base44 Application (Approval Workflow)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Adviser drafts email in EmailDraftModal                    │
│  2. Submit for approval → status = 'pending_approval'          │
│  3. Approver reviews and approves → status = 'approved'        │
│  4. Backend triggers Zapier webhook with email payload         │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Webhook: Email payload
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Zapier Automation (Email Sending)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Receive webhook from Base44                                │
│  2. Send email via Gmail/Outlook integration                   │
│     - FROM: operations@ascotwm.com (actual)                    │
│     - DISPLAY NAME: "Mark Thomson" (adviser name)              │
│     - TO: client_email                                         │
│     - CC: broker + adviser + team (on replies)                 │
│  3. Post comment to Asana task (activity log)                  │
│  4. Send confirmation webhook back to Base44                   │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Confirmation: Email sent
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Base44 (Status Update)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Receive send confirmation from Zapier                      │
│  2. Update status = 'sent'                                     │
│  3. Update delivered_at timestamp                              │
│  4. Create audit log entry                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Before Starting Implementation

**1. Zapier Account**
- [ ] Zapier account created (Free or Professional tier)
- [ ] Gmail/Outlook integration authorized
- [ ] Asana integration authorized (if using Asana comments)

**2. Base44 Environment**
- [ ] Access to Base44 admin panel (for entity configuration)
- [ ] Base44 API key available
- [ ] Test environment available (not production)

**3. Repository Access**
- [ ] Base44 AWM Mortgage Assistant repository cloned
- [ ] Node/Deno runtime installed (for Deno serverless functions)
- [ ] Git configured for commits

**4. Existing Knowledge**
- [ ] Familiarity with Base44 SDK and entity operations
- [ ] Understanding of React Query (TanStack Query)
- [ ] Basic webhook/REST API concepts

---

## Implementation Tasks

### Task 03-01: Database Schema Updates

**Time:** 1 hour
**Complexity:** Simple
**Location:** Base44 Admin Panel → Entities → MortgageCase

#### Fields to Add

| Field Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `emailApprovalStatus` | enum | No | 'draft' | Current approval state |
| `emailSubmittedBy` | string | No | null | User who submitted |
| `emailSubmittedAt` | timestamp | No | null | When submitted |
| `emailApprovedBy` | string | No | null | User who approved |
| `emailApprovedAt` | timestamp | No | null | When approved |
| `assignedAdviserName` | string | No | null | Display name for Zapier |
| `assignedAdviserEmail` | string | No | null | Optional CC email |
| `asanaTaskGid` | string | No | null | Asana task ID |
| `asanaProjectGid` | string | No | null | Asana project ID |

**Enum Values for `emailApprovalStatus`:**
- `draft` - Email not yet submitted
- `pending_approval` - Awaiting approval
- `approved` - Approved, ready to send
- `sent` - Email delivered

#### Steps
1. Log into Base44 admin panel
2. Navigate to Entities → MortgageCase
3. Add each field with specified type and default
4. Save entity configuration
5. Verify fields appear in entity schema

#### Validation Checklist
- [ ] All 9 fields added successfully
- [ ] `emailApprovalStatus` enum has 4 values
- [ ] Default value for `emailApprovalStatus` is 'draft'
- [ ] All fields are optional (nullable)
- [ ] Test case creation with new fields succeeds

---

### Task 03-02: Backend Approval Functions

**Time:** 2-3 hours
**Complexity:** Moderate
**Location:** `functions/` directory

#### Files to Create

**1. functions/submitEmailForApproval.ts**

```typescript
/**
 * Submit email draft for approval
 * Updates status from 'draft' to 'pending_approval'
 */
import { base44 } from './utils/base44Client.ts';

export default async function submitEmailForApproval(req: Request): Promise<Response> {
  try {
    const { caseId, submittedBy } = await req.json();

    // Fetch case
    const mortgageCase = await base44.asServiceRole.entities.MortgageCase.filter({
      id: caseId
    }).then(results => results[0]);

    if (!mortgageCase) {
      return new Response(JSON.stringify({ error: 'Case not found' }), { status: 404 });
    }

    // Validate current status is 'draft'
    if (mortgageCase.emailApprovalStatus !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Email must be in draft state to submit' }),
        { status: 400 }
      );
    }

    // Update case
    const updated = await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      emailApprovalStatus: 'pending_approval',
      emailSubmittedBy: submittedBy,
      emailSubmittedAt: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, case: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error submitting email for approval:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
```

---

**2. functions/approveEmail.ts**

```typescript
/**
 * Approve email for sending
 * Updates status to 'approved' and triggers Zapier webhook
 */
import { base44 } from './utils/base44Client.ts';

export default async function approveEmail(req: Request): Promise<Response> {
  try {
    const { caseId, approvedBy } = await req.json();

    // Fetch case
    const mortgageCase = await base44.asServiceRole.entities.MortgageCase.filter({
      id: caseId
    }).then(results => results[0]);

    if (!mortgageCase) {
      return new Response(JSON.stringify({ error: 'Case not found' }), { status: 404 });
    }

    // Validate current status is 'pending_approval'
    if (mortgageCase.emailApprovalStatus !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'Email must be pending approval' }),
        { status: 400 }
      );
    }

    // Update case
    const updated = await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      emailApprovalStatus: 'approved',
      emailApprovedBy: approvedBy,
      emailApprovedAt: new Date().toISOString()
    });

    // Trigger Zapier webhook
    await triggerZapierWebhook({
      caseId: updated.id,
      emailSubject: updated.email_subject,
      emailBody: updated.email_draft,
      recipientEmail: updated.client_email,
      adviserName: updated.assignedAdviserName || 'AWM Mortgage Team',
      adviserEmail: updated.assignedAdviserEmail,
      asanaTaskGid: updated.asanaTaskGid,
      approvedBy: approvedBy,
      approvedAt: updated.emailApprovedAt
    });

    return new Response(JSON.stringify({ success: true, case: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error approving email:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// Helper function (implement in Task 03-03)
async function triggerZapierWebhook(payload: any) {
  // See triggerZapierEmailWebhook.ts
}
```

---

**3. functions/rejectEmail.ts**

```typescript
/**
 * Reject email approval and return to draft
 * Clears approval metadata
 */
import { base44 } from './utils/base44Client.ts';

export default async function rejectEmail(req: Request): Promise<Response> {
  try {
    const { caseId } = await req.json();

    // Fetch case
    const mortgageCase = await base44.asServiceRole.entities.MortgageCase.filter({
      id: caseId
    }).then(results => results[0]);

    if (!mortgageCase) {
      return new Response(JSON.stringify({ error: 'Case not found' }), { status: 404 });
    }

    // Validate current status is 'pending_approval'
    if (mortgageCase.emailApprovalStatus !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'Can only reject pending approvals' }),
        { status: 400 }
      );
    }

    // Reset to draft state
    const updated = await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      emailApprovalStatus: 'draft',
      emailSubmittedBy: null,
      emailSubmittedAt: null,
      emailApprovedBy: null,
      emailApprovedAt: null
    });

    return new Response(JSON.stringify({ success: true, case: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
      });
  } catch (error) {
    console.error('Error rejecting email:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
```

---

**4. functions/confirmEmailSent.ts**

```typescript
/**
 * Zapier callback - confirm email was sent
 * Updates status to 'sent'
 */
import { base44 } from './utils/base44Client.ts';
import { createHmac } from 'node:crypto';

export default async function confirmEmailSent(req: Request): Promise<Response> {
  try {
    const body = await req.text();
    const { caseId, status, sentAt, webhookSecret } = JSON.parse(body);

    // Validate webhook secret
    const expectedSecret = Deno.env.get('ZAPIER_WEBHOOK_SECRET');
    if (webhookSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), { status: 401 });
    }

    // Fetch case
    const mortgageCase = await base44.asServiceRole.entities.MortgageCase.filter({
      id: caseId
    }).then(results => results[0]);

    if (!mortgageCase) {
      return new Response(JSON.stringify({ error: 'Case not found' }), { status: 404 });
    }

    // Update case
    const updated = await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      emailApprovalStatus: 'sent',
      delivered_at: sentAt,
      delivered_by: mortgageCase.emailApprovedBy
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      case_id: caseId,
      action: 'email_sent',
      details: `Email sent via Zapier to ${mortgageCase.client_email}`,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error confirming email sent:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
```

#### Validation Checklist
- [ ] All 4 functions created
- [ ] State transitions enforce business rules
- [ ] Error handling returns appropriate status codes
- [ ] Functions use `base44.asServiceRole` for entity operations

---

### Task 03-03: Zapier Webhook Trigger Function

**Time:** 1-2 hours
**Complexity:** Simple
**Location:** `functions/triggerZapierEmailWebhook.ts`

#### File to Create

```typescript
/**
 * Trigger Zapier webhook with email payload
 * Called from approveEmail.ts
 */

export async function triggerZapierWebhook(payload: {
  caseId: string;
  emailSubject: string;
  emailBody: string;
  recipientEmail: string;
  adviserName: string;
  adviserEmail?: string;
  asanaTaskGid?: string;
  approvedBy: string;
  approvedAt: string;
}): Promise<void> {
  const webhookUrl = Deno.env.get('ZAPIER_EMAIL_WEBHOOK_URL');
  const webhookSecret = Deno.env.get('ZAPIER_WEBHOOK_SECRET');

  if (!webhookUrl) {
    throw new Error('ZAPIER_EMAIL_WEBHOOK_URL not configured');
  }

  const fullPayload = {
    event: 'email_approved',
    ...payload,
    webhookSecret
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });

      if (response.ok) {
        console.log(`Zapier webhook sent successfully for case ${payload.caseId}`);
        return;
      } else {
        throw new Error(`Zapier webhook failed with status ${response.status}`);
      }
    } catch (error) {
      attempt++;
      console.error(`Zapier webhook attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      } else {
        // Final failure - log but don't block approval
        console.error(`Zapier webhook failed after ${maxAttempts} attempts for case ${payload.caseId}`);
        // TODO: Add to retry queue or alert system
      }
    }
  }
}
```

#### Environment Variables to Add

**File:** Base44 Environment Configuration
```
ZAPIER_EMAIL_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID
ZAPIER_WEBHOOK_SECRET=<generate-with-openssl-rand-hex-32>
```

#### Validation Checklist
- [ ] Webhook sends successfully to Zapier
- [ ] Retry logic works (test by simulating Zapier downtime)
- [ ] All required fields included in payload
- [ ] Secret included for Zapier validation

---

### Task 03-04: Zapier Confirmation Webhook

**Already covered in Task 03-02** - See `confirmEmailSent.ts` above

---

### Task 03-05: Frontend UI Updates

**Time:** 2-3 hours
**Complexity:** Moderate
**Location:** `src/components/email/EmailDraftModal.jsx`

#### Changes Required

**1. Import approval API methods**
```javascript
import {
  submitEmailForApproval,
  approveEmail,
  rejectEmail
} from '../api/base44Client';
```

**2. Add state for adviser selection**
```javascript
const [assignedAdviserName, setAssignedAdviserName] = useState(
  mortgageCase.assignedAdviserName || ''
);
const [assignedAdviserEmail, setAssignedAdviserEmail] = useState(
  mortgageCase.assignedAdviserEmail || ''
);
```

**3. Add approval status badge**
```jsx
{/* Approval Status Badge */}
{mortgageCase.emailApprovalStatus === 'draft' && (
  <Badge variant="secondary">Draft</Badge>
)}
{mortgageCase.emailApprovalStatus === 'pending_approval' && (
  <Badge variant="warning">Pending Approval</Badge>
)}
{mortgageCase.emailApprovalStatus === 'approved' && (
  <Badge variant="success">Approved</Badge>
)}
{mortgageCase.emailApprovalStatus === 'sent' && (
  <Badge variant="info">Sent</Badge>
)}
```

**4. Add adviser selection fields (Draft state)**
```jsx
{mortgageCase.emailApprovalStatus === 'draft' && (
  <>
    <FormField label="Assigned Adviser Name">
      <Input
        value={assignedAdviserName}
        onChange={(e) => setAssignedAdviserName(e.target.value)}
        placeholder="e.g., Mark Thomson"
      />
    </FormField>

    <FormField label="Adviser Email (Optional)">
      <Input
        type="email"
        value={assignedAdviserEmail}
        onChange={(e) => setAssignedAdviserEmail(e.target.value)}
        placeholder="e.g., mark.thomson@ascotwm.com"
      />
    </FormField>
  </>
)}
```

**5. Add action buttons**
```jsx
{/* Draft State: Submit for Approval */}
{mortgageCase.emailApprovalStatus === 'draft' && (
  <Button
    onClick={handleSubmitForApproval}
    disabled={isSubmitting}
  >
    Submit for Approval
  </Button>
)}

{/* Pending State: Approve / Reject */}
{mortgageCase.emailApprovalStatus === 'pending_approval' && (
  <>
    <Button
      variant="success"
      onClick={handleApprove}
      disabled={isApproving}
    >
      Approve
    </Button>
    <Button
      variant="secondary"
      onClick={handleReject}
      disabled={isRejecting}
    >
      Return to Draft
    </Button>
  </>
)}

{/* Approved State: Sending via Zapier */}
{mortgageCase.emailApprovalStatus === 'approved' && (
  <div>
    <Spinner /> Sending via Zapier...
    <p className="text-sm text-muted">
      Approved by {mortgageCase.emailApprovedBy} on{' '}
      {new Date(mortgageCase.emailApprovedAt).toLocaleString()}
    </p>
  </div>
)}

{/* Sent State: Read-only */}
{mortgageCase.emailApprovalStatus === 'sent' && (
  <p className="text-sm text-success">
    ✅ Email sent on {new Date(mortgageCase.delivered_at).toLocaleString()}
  </p>
)}
```

**6. Add event handlers**
```javascript
const handleSubmitForApproval = async () => {
  setIsSubmitting(true);
  try {
    // Save adviser fields first
    await base44.entities.MortgageCase.update(mortgageCase.id, {
      assignedAdviserName,
      assignedAdviserEmail
    });

    // Submit for approval
    await submitEmailForApproval({
      caseId: mortgageCase.id,
      submittedBy: currentUser.email
    });

    // Invalidate queries
    queryClient.invalidateQueries(['case', mortgageCase.id]);

    toast.success('Submitted for approval');
  } catch (error) {
    toast.error(`Failed to submit: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

const handleApprove = async () => {
  const confirmed = window.confirm('Approve this email for sending via Zapier?');
  if (!confirmed) return;

  setIsApproving(true);
  try {
    await approveEmail({
      caseId: mortgageCase.id,
      approvedBy: currentUser.email
    });

    queryClient.invalidateQueries(['case', mortgageCase.id]);
    toast.success('Email approved and sent to Zapier');
  } catch (error) {
    toast.error(`Failed to approve: ${error.message}`);
  } finally {
    setIsApproving(false);
  }
};

const handleReject = async () => {
  const confirmed = window.confirm('Return email to draft? Approval will be cleared.');
  if (!confirmed) return;

  setIsRejecting(true);
  try {
    await rejectEmail({ caseId: mortgageCase.id });

    queryClient.invalidateQueries(['case', mortgageCase.id]);
    toast.success('Returned to draft');
  } catch (error) {
    toast.error(`Failed to reject: ${error.message}`);
  } finally {
    setIsRejecting(false);
  }
};
```

#### Validation Checklist
- [ ] Draft state shows adviser selection + "Submit" button
- [ ] Pending state shows "Approve" and "Reject" buttons
- [ ] Approved state shows "Sending via Zapier..." spinner
- [ ] Sent state is read-only with confirmation message
- [ ] Approval metadata displayed correctly
- [ ] Confirmation dialogs appear before actions

---

### Task 03-06: State Management Integration

**Time:** 1 hour
**Complexity:** Simple
**Location:** `src/api/base44Client.js`

#### API Methods to Add

```javascript
// In base44Client.js

const BASE_URL = 'https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions';
const API_KEY = '3ceb0486ed434a999e612290fe6d9482';

export const base44Client = {
  // ... existing methods ...

  async submitEmailForApproval({ caseId, submittedBy }) {
    const response = await fetch(`${BASE_URL}/submitEmailForApproval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ caseId, submittedBy })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit for approval');
    }

    return response.json();
  },

  async approveEmail({ caseId, approvedBy }) {
    const response = await fetch(`${BASE_URL}/approveEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ caseId, approvedBy })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve email');
    }

    return response.json();
  },

  async rejectEmail({ caseId }) {
    const response = await fetch(`${BASE_URL}/rejectEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ caseId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject email');
    }

    return response.json();
  }
};
```

#### React Query Mutations (in EmailDraftModal.jsx)

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const submitMutation = useMutation(
  (data) => base44Client.submitEmailForApproval(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', mortgageCase.id]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);

const approveMutation = useMutation(
  (data) => base44Client.approveEmail(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', mortgageCase.id]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);

const rejectMutation = useMutation(
  (data) => base44Client.rejectEmail(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['case', mortgageCase.id]);
      queryClient.invalidateQueries(['cases']);
    }
  }
);
```

#### Validation Checklist
- [ ] API methods successfully call backend functions
- [ ] Query invalidation refreshes UI after state changes
- [ ] Error handling displays messages to user
- [ ] Loading states show during async operations

---

### Task 03-07: Integration Testing

**Time:** 2 hours
**Complexity:** Moderate

#### Test Scenarios

**1. Happy Path: Draft → Submit → Approve → Send**
```
Steps:
1. Create case with email draft
2. Fill in assignedAdviserName: "Mark Thomson"
3. Fill in assignedAdviserEmail: "mark.thomson@ascotwm.com"
4. Click "Submit for Approval"
5. Verify status → 'pending_approval'
6. Click "Approve"
7. Verify Zapier receives webhook
8. Verify Zapier sends email with correct display name
9. Verify Zapier sends confirmation webhook back to Base44
10. Verify status → 'sent'

Expected:
✅ All state transitions complete
✅ Zapier receives email payload
✅ Email sent with "Mark Thomson" as display name
✅ Base44 status updated to 'sent'
```

**2. Rejection Path: Draft → Submit → Reject → Edit → Resubmit**
```
Steps:
1. Create case with email draft
2. Submit for approval
3. Click "Return to Draft"
4. Verify status → 'draft'
5. Verify approval metadata cleared
6. Edit email content
7. Resubmit for approval

Expected:
✅ Status reset to 'draft'
✅ emailSubmittedBy/At cleared
✅ Can resubmit after editing
```

**3. Zapier Failure: Approve → Webhook Fails → Retry → Success**
```
Steps:
1. Temporarily disable Zapier webhook (or use invalid URL)
2. Approve email
3. Verify retry attempts (check logs)
4. Re-enable Zapier webhook
5. Verify eventual success or logged failure

Expected:
✅ Retry logic attempts 3 times
✅ Exponential backoff applied
✅ Failure logged if all retries exhausted
```

**4. Security: Invalid Webhook Secret → Confirmation Rejected**
```
Steps:
1. Send mock confirmation webhook with incorrect secret
2. Verify Base44 rejects with 401

Expected:
✅ Invalid secret rejected
✅ Status not updated
```

**5. Audit Trail Validation**
```
Steps:
1. Complete full email approval workflow
2. Query AuditLog entity
3. Verify entries for:
   - Email submitted
   - Email approved
   - Email sent

Expected:
✅ All actions logged
✅ Timestamps accurate
✅ User identities captured
```

#### Test Environment Setup
- [ ] Zapier "Catch Hook" configured
- [ ] Test Gmail/Outlook account authorized in Zapier
- [ ] Base44 test environment (not production)
- [ ] Test Asana project/task (if using Asana integration)

#### Validation Checklist
- [ ] All 5 test scenarios pass
- [ ] No console errors during workflow
- [ ] Zapier webhook payload correct
- [ ] Email appears with correct display name
- [ ] Asana comment posted (if configured)
- [ ] Audit logs complete and accurate

---

## Zapier Configuration

### Workflow 1: Receive Approved Email → Send via Gmail

**Step 1: Create Zapier Zap**
1. Log into Zapier
2. Click "Create Zap"
3. Name: "Base44 Email Approval → Gmail Send"

**Step 2: Trigger - Catch Hook**
1. Choose app: "Webhooks by Zapier"
2. Choose event: "Catch Hook"
3. Click "Continue"
4. Copy webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/12345/abcdef`)
5. **Save this URL** - add to Base44 environment as `ZAPIER_EMAIL_WEBHOOK_URL`
6. Test trigger by sending sample payload from Base44

**Step 3: Action 1 - Send Email**
1. Choose app: "Gmail" (or "Outlook")
2. Choose event: "Send Email"
3. Connect Gmail account (authorize with operations@ascotwm.com or similar)
4. Configure email:
   - **To:** `{{recipientEmail}}` (from webhook)
   - **Subject:** `{{emailSubject}}` (from webhook)
   - **Body:** `{{emailBody}}` (from webhook)
   - **From Name:** `{{adviserName}}` (e.g., "Mark Thomson")
   - **CC:** `{{adviserEmail}}` (optional, if provided in webhook)
5. Test action

**Step 4: Action 2 - Post to Asana (Optional)**
1. Choose app: "Asana"
2. Choose event: "Create Comment"
3. Connect Asana account
4. Configure comment:
   - **Task ID:** `{{asanaTaskGid}}` (from webhook)
   - **Comment Text:** `Email sent to {{recipientEmail}} on {{timestamp}}`
5. Test action

**Step 5: Action 3 - Confirm Send**
1. Choose app: "Webhooks by Zapier"
2. Choose event: "POST"
3. Configure webhook:
   - **URL:** `https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/confirmEmailSent`
   - **Payload Type:** JSON
   - **Data:**
     ```json
     {
       "caseId": "{{caseId}}",
       "status": "sent",
       "sentAt": "{{timestamp}}",
       "webhookSecret": "YOUR_SHARED_SECRET"
     }
     ```
   - **Headers:**
     ```json
     {
       "api_key": "3ceb0486ed434a999e612290fe6d9482",
       "Content-Type": "application/json"
     }
     ```
4. Test action

**Step 6: Publish Zap**
1. Name the Zap descriptively
2. Turn on the Zap
3. Test end-to-end with real Base44 case

---

## Testing Guide

### Manual Testing Checklist

**Pre-Testing:**
- [ ] All backend functions deployed to Base44
- [ ] All frontend changes committed and built
- [ ] Zapier workflow configured and published
- [ ] Environment variables set (ZAPIER_EMAIL_WEBHOOK_URL, ZAPIER_WEBHOOK_SECRET)

**Test 1: Draft to Sent (Happy Path)**
- [ ] Create new case in Base44
- [ ] Draft email in EmailDraftModal
- [ ] Set assignedAdviserName: "Test Adviser"
- [ ] Click "Submit for Approval"
- [ ] Verify badge shows "Pending Approval"
- [ ] Click "Approve"
- [ ] Verify badge shows "Approved" then "Sending via Zapier..."
- [ ] Check Zapier dashboard - webhook received?
- [ ] Check recipient email - email received with correct display name?
- [ ] Wait for confirmation webhook
- [ ] Verify badge shows "Sent"
- [ ] Verify delivered_at timestamp populated

**Test 2: Rejection Flow**
- [ ] Submit email for approval
- [ ] Click "Return to Draft"
- [ ] Verify status back to "Draft"
- [ ] Verify emailSubmittedBy/At cleared
- [ ] Resubmit and verify works correctly

**Test 3: Zapier Failure Handling**
- [ ] Temporarily break Zapier webhook URL (or turn off Zap)
- [ ] Approve email
- [ ] Check console logs - retry attempts logged?
- [ ] Fix Zapier webhook
- [ ] Verify email eventually sends or logged as failed

**Test 4: Audit Trail**
- [ ] Complete full workflow
- [ ] Query AuditLog entity in Base44
- [ ] Verify all actions logged with timestamps and user IDs

**Test 5: Asana Integration (if configured)**
- [ ] Add asanaTaskGid to case
- [ ] Complete email approval workflow
- [ ] Check Asana task - comment posted?
- [ ] Verify comment text accurate

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass in test environment
- [ ] Legal team reviewed and approved workflow
- [ ] FCA compliance documentation complete
- [ ] Zapier workflow tested end-to-end
- [ ] Environment variables configured in production
- [ ] Rollback plan documented

### Deployment Steps
1. [ ] Deploy database schema changes (Base44 admin)
2. [ ] Deploy backend functions (Base44 CLI or manual upload)
3. [ ] Deploy frontend changes (build and deploy)
4. [ ] Configure production environment variables
5. [ ] Update Zapier webhook URL (if different from test)
6. [ ] Test email approval workflow in production (with test case)
7. [ ] Monitor for errors/issues

### Post-Deployment
- [ ] Verify approval workflow functional in production
- [ ] Test Zapier email sending with real client email (test case)
- [ ] Monitor Zapier task history for failures
- [ ] Check audit logs for compliance
- [ ] Train team on new approval workflow
- [ ] Update documentation with production URLs
- [ ] Add monitoring/alerting for webhook failures (optional)

### Rollback Plan
If issues occur:
1. Git revert frontend changes
2. Disable Zapier workflow (turn off Zap)
3. Re-enable old sendReportEmail.ts function
4. Communicate to team: "Email approval temporarily disabled, using old flow"

---

## Troubleshooting

### Common Issues

**Issue:** Zapier webhook not receiving payload
- **Check:** Environment variable `ZAPIER_EMAIL_WEBHOOK_URL` set correctly?
- **Check:** Base44 function deployed and accessible?
- **Check:** Zapier Zap turned on?
- **Solution:** Test webhook manually with cURL or Postman

**Issue:** Gmail rejects display name masking
- **Check:** Gmail account verified in Zapier?
- **Check:** Using Google Workspace account (not free Gmail)?
- **Solution:** May need "Send mail as" delegation configured in Gmail settings

**Issue:** Confirmation webhook failing
- **Check:** Webhook secret matches between Zapier and Base44?
- **Check:** Base44 function deployed at correct path?
- **Solution:** Check Zapier task history for error details

**Issue:** Status stuck on "Approved" (not updating to "Sent")
- **Check:** Zapier confirmation webhook sent?
- **Check:** Base44 function `confirmEmailSent.ts` working?
- **Solution:** Manually update status via Base44 admin panel, investigate logs

---

## Support & Resources

### Documentation
- [Base44 SDK Documentation](https://docs.base44.app)
- [Zapier Webhooks Guide](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)

### Internal References
- [orchestration/01-research-discovery/research-synthesized.md](orchestration/01-research-discovery/research-synthesized.md) - FCA compliance insights
- [orchestration/02-planning/execution-plan.md](orchestration/02-planning/execution-plan.md) - High-level strategy

### Contact
- **Project Owner:** Marko (the.wildfire.reviews@gmail.com)
- **GitHub Repository:** https://github.com/WildfireReviews/base44-awm-mortgage-assistant

---

**Implementation Guide Complete - Ready for Sub-Agent Execution**

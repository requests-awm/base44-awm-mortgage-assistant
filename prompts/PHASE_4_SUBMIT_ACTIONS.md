# PHASE 4: SUBMIT ACTIONS

## OBJECTIVE
Handle form submission for both edit and create modes.

**Prerequisites:** Phases 1-3 must be complete (detection, highlighting, validation all working)

---

## WHAT YOU'RE BUILDING

The backend logic that runs when user clicks "Activate Case" or "Create Case":
1. Update/create the MortgageCase record
2. Change status to 'active'
3. Add timestamps
4. Redirect to dashboard

---

## EDIT MODE SUBMIT (Activate Case)

**When "Activate Case" button is clicked:**

**Step 1: Update the MortgageCase record**
```javascript
await base44.entities.MortgageCase.update(caseId, {
  // Client details
  client_name: formData.clientName,
  client_email: formData.clientEmail,
  client_phone: formData.clientPhone,

  // Mortgage details
  property_value: formData.propertyValue,
  loan_amount: formData.loanAmount,
  mortgage_purpose: formData.purpose,
  category: formData.category,

  // Financials
  annual_income: formData.annualIncome,
  employment_type: formData.employmentType,
  credit_history_status: formData.creditHistory,

  // Timing
  purchase_completion_date: formData.completionDate,
  urgency_level: formData.urgency || 'Standard',

  // Derived fields
  ltv: (formData.loanAmount / formData.propertyValue) * 100,
  loan_to_income: formData.loanAmount / formData.annualIncome,

  // Status change - THIS IS THE KEY PART
  case_status: 'active',

  // Timestamps
  activated_at: new Date().toISOString(),
  asana_last_synced: new Date().toISOString()
});
```

**Step 2: Show success message**
```javascript
// Show success toast
showToast('success', `✅ Case ${caseReference} activated successfully`);
```

**Step 3: Redirect to dashboard**
```javascript
// Redirect with highlight parameter
window.location.href = `/dashboard?highlight=${caseId}`;
```

The case will now:
- Appear in the main pipeline (not in incomplete section)
- Be ready for triage calculation (separate function, not part of this form)

---

## CREATE MODE SUBMIT (Create Case)

**When "Create Case" button is clicked:**

**Step 1: Create new MortgageCase record**
```javascript
const newCase = await base44.entities.MortgageCase.create({
  // All form fields (same as edit mode)
  client_name: formData.clientName,
  client_email: formData.clientEmail,
  client_phone: formData.clientPhone,
  property_value: formData.propertyValue,
  loan_amount: formData.loanAmount,
  mortgage_purpose: formData.purpose,
  category: formData.category,
  annual_income: formData.annualIncome,
  employment_type: formData.employmentType,
  credit_history_status: formData.creditHistory,
  purchase_completion_date: formData.completionDate,
  urgency_level: formData.urgency || 'Standard',

  // Derived fields
  ltv: (formData.loanAmount / formData.propertyValue) * 100,
  loan_to_income: formData.loanAmount / formData.annualIncome,

  // Status and metadata
  case_status: 'active',
  created_from_asana: false,
  case_type: 'lead',

  // Timestamps
  created_at: new Date().toISOString(),
  activated_at: new Date().toISOString()
});
```

**Step 2: Show success and redirect**
```javascript
showToast('success', `✅ Case created successfully`);
window.location.href = `/dashboard?highlight=${newCase.id}`;
```

---

## ERROR HANDLING

**If submit fails (network error, database error):**

```javascript
try {
  // ... update/create code ...
} catch (error) {
  console.error('Failed to save case:', error);

  // Show error toast
  showToast('error', 'Failed to save case. Please try again.');

  // DO NOT redirect
  // DO NOT reset form
  // Keep all user data so they can retry
}
```

**Loading state during submit:**
- Disable submit button
- Change button text to "Saving..." or show spinner
- Prevent multiple submissions

---

## UNSAVED CHANGES WARNING

**If user tries to leave page with unsaved changes:**

```javascript
window.addEventListener('beforeunload', (e) => {
  if (formHasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    return e.returnValue;
  }
});
```

Track `formHasUnsavedChanges`:
- Set to `true` when any field is edited
- Set to `false` after successful submit
- Set to `false` in create mode if form is pristine

---

## TESTING THIS PHASE

Before deploying, verify:
- [ ] Edit mode updates existing case correctly
- [ ] Create mode creates new case correctly
- [ ] All form fields save to database
- [ ] Derived fields (LTV, loan-to-income) save correctly
- [ ] Case status changes to 'active'
- [ ] Timestamps are set correctly
- [ ] Success toast appears after submit
- [ ] Redirect to dashboard works
- [ ] Case appears in main pipeline (not incomplete)
- [ ] Network error shows error toast
- [ ] Error doesn't reset form data
- [ ] Loading state shows during submit
- [ ] Beforeunload warning works

---

## SUCCESS CRITERIA

✅ **This phase is complete when:**
1. Edit mode successfully updates and activates cases
2. Create mode successfully creates new active cases
3. All data saves correctly to database
4. User sees clear success/error feedback
5. Redirect works and highlights the case on dashboard
6. Error handling prevents data loss

---

## WHAT'S NOT INCLUDED (Future Phases)

These are separate functions that will be called AFTER activation:
- **Triage calculation** - Separate function/workflow
- **Lender matching** - Separate function/workflow
- **Asana comment posting** - Separate function/workflow

For now, just get the case activated and in the pipeline. Those other automations can trigger separately.

---

**DEPLOYMENT CHECKLIST:**
- [ ] All 4 phases tested individually
- [ ] End-to-end test: Asana webhook → incomplete case → form edit → activation
- [ ] End-to-end test: Manual case creation → activated case appears
- [ ] Dashboard correctly shows/hides incomplete cases based on status
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility tested with keyboard navigation

---

**END OF PHASED IMPLEMENTATION GUIDE**
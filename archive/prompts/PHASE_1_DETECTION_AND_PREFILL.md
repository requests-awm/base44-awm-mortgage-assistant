# PHASE 1: DETECTION & PRE-FILL LOGIC

## OBJECTIVE
Add edit mode detection and data pre-filling to the existing intake form.

---

## WHAT YOU'RE BUILDING

A form that can:
1. Detect if it's editing an existing case or creating a new one
2. Load and display existing data when editing
3. Show which fields came from Asana

---

## DETECTION LOGIC

**Check the URL for a case_id:**
```javascript
const caseId = new URLSearchParams(window.location.search).get('case_id');
const isEditMode = !!caseId;
```

**Two modes:**
- `case_id` exists = EDIT MODE (incomplete case from Asana)
- No `case_id` = CREATE MODE (manual case creation)

---

## PRE-FILL BEHAVIOR (Edit Mode Only)

**On form load, if in edit mode:**

1. Fetch the MortgageCase record using the `case_id`
2. Pre-fill these fields if they have values:

**Step 1 - Client Details:**
- `client_name`
- `client_email`
- `client_phone`

**Step 2 - Mortgage Details:**
- `property_value`
- `loan_amount`
- `mortgage_purpose`
- `category`

**Step 3 - Financials:**
- `annual_income`
- `employment_type`
- `credit_history_status`

**Step 4 - Timing:**
- `purchase_completion_date`
- `urgency_level`

**Step 5 - Additional (Read-Only):**
- `insightly_id`
- `internal_introducer`
- `mortgage_broker_appointed`

---

## VISUAL STYLING FOR PRE-FILLED FIELDS

**Fields with data from Asana should look different:**

```css
.field-prefilled {
  border: 1px solid #10B981;
  background: #ECFDF5;
  cursor: not-allowed;
  opacity: 0.8;
}
```

Add a small badge: `"✓ From Asana"` in green (#10B981)

**Make Step 5 fields completely read-only** - user cannot edit them.

---

## FORM TITLE CHANGES

**Title should change based on mode:**
- Edit Mode: `"Complete Intake for Case {reference}"`
  - Example: `"Complete Intake for Case AWM-2025-W042"`
- Create Mode: `"Create New Mortgage Case"`

Use the `case_reference` field from the MortgageCase record.

---

## EDGE CASES TO HANDLE

**1. Invalid case_id:**
- If case doesn't exist, show error toast
- Message: `"Case not found. Redirecting to dashboard..."`
- Redirect to `/dashboard` after 2 seconds

**2. Case already active:**
- Check if `case_status` is already `'active'`
- Show warning: `"This case is already active. Redirecting to case details..."`
- Redirect to `/cases/{caseId}` after 2 seconds

**3. Partial data:**
- Some fields may be empty even in edit mode
- That's okay - just leave them empty for now
- Next phase will handle highlighting missing fields

---

## TESTING THIS PHASE

Before moving to Phase 2, verify:
- [ ] URL with `?case_id=123` triggers edit mode
- [ ] URL without `case_id` triggers create mode
- [ ] Form title changes correctly
- [ ] Existing data loads into form fields
- [ ] Pre-filled fields have green border
- [ ] Read-only fields cannot be edited
- [ ] Invalid case_id shows error and redirects
- [ ] Already active case redirects properly

---

## SUCCESS CRITERIA

✅ **This phase is complete when:**
1. Form detects edit vs create mode from URL
2. Existing case data loads and displays correctly
3. Pre-filled fields have distinct visual styling
4. Form title reflects the mode
5. Edge cases redirect appropriately

---

**NEXT PHASE:** Missing field highlighting and validation

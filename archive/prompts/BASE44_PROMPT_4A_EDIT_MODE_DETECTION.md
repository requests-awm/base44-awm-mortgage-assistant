# BASE44 PROMPT 4A: INTAKE FORM - EDIT MODE DETECTION

**Phase:** 4A of 4 (Foundation Phase)
**Time:** 5-10 minutes
**Complexity:** Low
**Dependencies:** None

---

## OBJECTIVE

Add edit mode detection to the existing intake form. The form must detect if it's editing an incomplete case (from Asana) or creating a new case from scratch.

---

## WHAT TO BUILD

### 1. URL Parameter Detection

**Add logic to check for `case_id` parameter in URL:**

```javascript
// On form initialization
const urlParams = new URLSearchParams(window.location.search);
const caseId = urlParams.get('case_id');
const isEditMode = !!caseId;

// Store in form state
formState.isEditMode = isEditMode;
formState.caseId = caseId;
```

### 2. Fetch Existing Case (Edit Mode Only)

**If `case_id` exists, fetch the MortgageCase record:**

```javascript
if (isEditMode) {
  const existingCase = await base44.entities.MortgageCase.findById(caseId);

  if (!existingCase) {
    // Handle invalid case ID
    alert('Case not found. Redirecting to dashboard...');
    window.location.href = '/dashboard';
    return;
  }

  if (existingCase.case_status === 'active') {
    // Handle already activated case
    alert('This case is already active. Redirecting to case details...');
    window.location.href = `/cases/${caseId}`;
    return;
  }

  // Store case data for later use
  formState.existingCase = existingCase;
}
```

### 3. Dynamic Form Title

**Change form title based on mode:**

```javascript
if (isEditMode) {
  formTitle = `Complete Intake for Case ${existingCase.reference}`;
} else {
  formTitle = 'Create New Mortgage Case';
}
```

### 4. Dynamic Submit Button

**Change button label based on mode:**

```javascript
if (isEditMode) {
  submitButtonLabel = 'Activate Case';
  submitButtonColor = '#F59E0B'; // Amber/gold
} else {
  submitButtonLabel = 'Create Case';
  submitButtonColor = '#2563EB'; // Blue
}
```

---

## STYLING

**Submit Button CSS:**

```css
/* Edit Mode Button */
.btn-submit-edit {
  background: #F59E0B;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

/* Create Mode Button */
.btn-submit-create {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```

---

## TEST STEPS

### Test 1: Create Mode (No case_id)
1. ✅ Navigate to intake form: `/intake-form`
2. ✅ Verify form title: "Create New Mortgage Case"
3. ✅ Verify submit button: "Create Case" (blue background)
4. ✅ Verify all fields are empty

**Expected:** Form works in create mode as before.

### Test 2: Edit Mode (Valid case_id)
1. ✅ Create an incomplete case in Base44 (status: 'incomplete')
2. ✅ Note the case ID (example: `12345`)
3. ✅ Navigate to: `/intake-form?case_id=12345`
4. ✅ Verify form title shows: "Complete Intake for Case AWM-2025-WXXX"
5. ✅ Verify submit button: "Activate Case" (gold/amber background)

**Expected:** Form detects edit mode and shows correct title/button.

### Test 3: Invalid case_id
1. ✅ Navigate to: `/intake-form?case_id=99999999`
2. ✅ Verify alert: "Case not found. Redirecting to dashboard..."
3. ✅ Verify redirect to `/dashboard`

**Expected:** Form handles invalid case ID gracefully.

### Test 4: Already Active Case
1. ✅ Create a case with status: 'active'
2. ✅ Navigate to: `/intake-form?case_id={active_case_id}`
3. ✅ Verify alert: "This case is already active. Redirecting to case details..."
4. ✅ Verify redirect to `/cases/{case_id}`

**Expected:** Form prevents editing already activated cases.

---

## SUCCESS CRITERIA

**Phase 4A is complete when:**
1. ✅ Form detects `case_id` parameter in URL
2. ✅ Form fetches existing case data in edit mode
3. ✅ Form title changes based on mode
4. ✅ Submit button label and color change based on mode
5. ✅ Invalid case IDs are handled gracefully
6. ✅ Already active cases are blocked from editing

---

## NOTES

- **Do NOT implement pre-fill logic yet** - that's Phase 4B
- **Do NOT implement field highlighting yet** - that's Phase 4C
- **Do NOT implement activation logic yet** - that's Phase 4D
- Focus ONLY on detection and basic UI changes

---

## NEXT PHASE

**After Phase 4A passes all tests, proceed to:**
→ [Phase 4B: Pre-Fill Logic](BASE44_PROMPT_4B_PREFILL_LOGIC.md)

---

**END OF PHASE 4A**

Copy this prompt into Base44 and test before moving to Phase 4B.

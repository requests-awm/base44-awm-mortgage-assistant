# BASE44 PROMPT 4: INTAKE FORM MODIFICATIONS

## OBJECTIVE
Modify the existing 4-step intake form to handle incomplete cases created from Asana webhooks. The form must detect edit mode, pre-fill existing data, highlight missing required fields, and activate the case on submit.

---

## DETECTION LOGIC

**Edit Mode Detection:**
- Check URL for `case_id` parameter
- If `case_id` exists → **EDIT MODE** (incomplete case from Asana)
- If no `case_id` → **CREATE MODE** (manual case creation)

**Query Example:**
```javascript
const caseId = new URLSearchParams(window.location.search).get('case_id');
const isEditMode = !!caseId;
```

---

## PRE-FILL LOGIC (Edit Mode Only)

**On Form Load:**
1. Fetch existing MortgageCase record using `case_id`
2. Pre-fill ALL existing fields from the record
3. Apply "already filled" styling to completed fields
4. Apply "missing field" styling to empty required fields

**Fields to Pre-Fill (if available):**

**Step 1: Client Details**
- `client_name` (from Asana custom field)
- `client_email` (from Asana custom field)
- `client_phone` (if exists, otherwise highlight as required)

**Step 2: Mortgage Details**
- `property_value` (highlight if missing)
- `loan_amount` (highlight if missing)
- `mortgage_purpose` (highlight if missing)
- `category` (highlight if missing)

**Step 3: Financials**
- `annual_income` (highlight if missing)
- `employment_type` (highlight if missing)
- `credit_history_status` (highlight if missing)

**Step 4: Timing**
- `purchase_completion_date` (highlight if missing)
- `urgency_level` (optional, default to "Standard")

**Step 5: Additional Context**
- `insightly_id` (pre-filled from Asana, read-only)
- `internal_introducer` (pre-filled from Asana, read-only)
- `mortgage_broker_appointed` (pre-filled from Asana, read-only)

---

## MISSING FIELD HIGHLIGHTING

**Visual Indicators for Empty Required Fields:**

**Input Border Color:**
- Missing required field: `border: 2px solid #F59E0B` (amber/yellow)
- Filled required field: `border: 1px solid #D1D5DB` (gray - default)
- Pre-filled from Asana: `border: 1px solid #10B981` (green) + read-only styling

**Field Label:**
- Missing: Add `⚠️` icon before label text
- Example: `⚠️ Property Value` (if empty)
- Example: `Property Value ✓` (if filled)

**Helper Text:**
- Add below missing fields: `"Required to activate case"` in amber text (#F59E0B)

**Visual Summary at Top of Form (Edit Mode Only):**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Complete Required Fields to Activate Case │
│                                              │
│ Progress: 3/9 fields complete                │
│ [████████░░░░░░░░░░░░] 33%                  │
│                                              │
│ Missing:                                     │
│ • Property Value                             │
│ • Loan Amount                                │
│ • Annual Income                              │
│ • Employment Type                            │
│ • Mortgage Purpose                           │
│ • Category                                   │
└─────────────────────────────────────────────┘
```

**Styling:**
- Background: `#FEF3C7` (light amber)
- Border: `1px solid #F59E0B` (amber)
- Padding: 16px
- Border radius: 8px
- Font size: 14px

---

## FORM TITLE & SUBMIT BUTTON

**Form Title:**
- **Edit Mode:** `"Complete Intake for Case {reference}"`
  - Example: `"Complete Intake for Case AWM-2025-W042"`
- **Create Mode:** `"Create New Mortgage Case"`

**Submit Button Label:**
- **Edit Mode:** `"Activate Case"` (gold/amber background #F59E0B)
- **Create Mode:** `"Create Case"` (blue background #2563EB)

**Button State Logic:**
- **Disabled State:** If ANY required field is empty
  - Background: `#D1D5DB` (gray)
  - Cursor: `not-allowed`
  - Tooltip: `"Fill all required fields to continue"`
- **Enabled State:** All required fields filled
  - Background: `#F59E0B` (amber) for edit mode
  - Background: `#2563EB` (blue) for create mode
  - Cursor: `pointer`
  - Add hover effect: slight opacity change

---

## VALIDATION RULES

**Required Fields (Cannot activate without):**
1. `client_name` (text, min 2 characters)
2. `client_email` (email format validation)
3. `client_phone` (phone format validation, UK format preferred)
4. `property_value` (number, > 0)
5. `loan_amount` (number, > 0, must be ≤ property_value)
6. `mortgage_purpose` (select: Purchase, Remortgage, Transfer of Equity, etc.)
7. `category` (select: Residential, BTL, Commercial, etc.)
8. `annual_income` (number, > 0)
9. `employment_type` (select: Employed, Self-employed, Contractor)

**Derived Fields (Auto-calculated):**
- `ltv` (Loan-to-Value): `(loan_amount / property_value) * 100`
- `loan_to_income`: `loan_amount / annual_income`

**Validation Messages:**
- Invalid email: `"Please enter a valid email address"`
- Invalid phone: `"Please enter a valid UK phone number"`
- Loan > Property Value: `"Loan amount cannot exceed property value"`
- Empty required field: `"This field is required to activate the case"`

---

## SUBMIT BEHAVIOR (Edit Mode)

**When "Activate Case" is clicked:**

**Step 1: Update MortgageCase Record**
```javascript
await base44.entities.MortgageCase.update(caseId, {
  // Update all form fields
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

  // Derived fields
  ltv: (formData.loanAmount / formData.propertyValue) * 100,
  loan_to_income: formData.loanAmount / formData.annualIncome,

  // Status change
  case_status: 'active',

  // Timestamps
  activated_at: new Date().toISOString(),
  asana_last_synced: new Date().toISOString()
});
```

**Step 2: Trigger Triage Calculation**
- Call function: `calculateTriage(caseId)`
- This will:
  - Calculate triage score based on LTV, income type, credit history
  - Assign rating: Blue/Green/Yellow/Red
  - Store `triage_factors` array (reasons for complexity)
  - Update `triage_last_calculated` timestamp

**Step 3: Match Lenders**
- Call function: `matchLenders(caseId)` (if implemented)
- Stores array of suitable lender names in `matched_lenders`

**Step 4: Post Asana Comment**
- Call function: `postAsanaComment(caseId, 'intake_completed')`
- Posts comment to linked Asana task:
  ```
  ✅ INTAKE COMPLETED
  Case Reference: AWM-2025-W042
  Triage Rating: 🟢 GREEN (Standard case)
  LTV: 72%
  Matched Lenders: 8 available
  Next Step: Email draft ready for review
  ```

**Step 5: Redirect to Dashboard**
- Redirect to: `/dashboard?highlight={caseId}`
- Show success toast: `"✅ Case {reference} activated successfully"`
- Case now appears in main pipeline (no longer in incomplete section)

---

## CREATE MODE BEHAVIOR (No Changes Needed)

**When "Create Case" is clicked (manual creation, no Asana link):**
- Same validation rules apply
- Create new MortgageCase record with:
  - `case_status: 'active'`
  - `created_from_asana: false`
  - `case_type: 'lead'` (can be upgraded to 'case' later)
- Trigger triage calculation
- NO Asana comment (no linked task)
- Redirect to dashboard

---

## STYLING SPECIFICATIONS

**Apple-Inspired Minimalist Design:**

**Form Container:**
```css
.intake-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

**Pre-Filled Field (from Asana):**
```css
.field-prefilled {
  border: 1px solid #10B981;
  background: #ECFDF5;
  cursor: not-allowed;
  opacity: 0.8;
}

.field-prefilled::after {
  content: '✓ From Asana';
  font-size: 12px;
  color: #10B981;
  margin-left: 8px;
}
```

**Missing Required Field:**
```css
.field-missing {
  border: 2px solid #F59E0B;
  background: #FFFBEB;
}

.field-missing-label::before {
  content: '⚠️ ';
  color: #F59E0B;
}
```

**Filled Required Field:**
```css
.field-filled {
  border: 1px solid #10B981;
}

.field-filled-label::after {
  content: ' ✓';
  color: #10B981;
  font-weight: 600;
}
```

**Submit Button (Edit Mode):**
```css
.btn-activate {
  background: #F59E0B;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-activate:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-activate:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
}
```

**Progress Bar (Edit Mode Summary):**
```css
.progress-container {
  width: 100%;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #059669);
  transition: width 0.3s ease;
}
```

---

## ACCESSIBILITY

**Keyboard Navigation:**
- Tab order: Step 1 → Step 2 → Step 3 → Step 4 → Submit
- Focus visible indicator: `outline: 2px solid #2563EB`
- Enter key submits form only if all required fields filled

**Screen Reader Support:**
- Add `aria-required="true"` to required fields
- Add `aria-invalid="true"` to fields with validation errors
- Add `aria-describedby` linking to helper text for missing fields

**Error Announcements:**
- Use `role="alert"` for validation error messages
- Announce: `"3 required fields remaining: Property Value, Loan Amount, Annual Income"`

---

## EDGE CASES

**1. Case Already Activated:**
- If user navigates to edit URL but `case_status` is already `'active'`
- Show warning: `"This case is already active. Redirecting to case details..."`
- Redirect to: `/cases/{caseId}`

**2. Invalid Case ID:**
- If `case_id` in URL doesn't exist
- Show error: `"Case not found. Redirecting to dashboard..."`
- Redirect to: `/dashboard`

**3. Network Error During Submit:**
- Show error toast: `"Failed to activate case. Please try again."`
- Do NOT redirect
- Keep form data filled (don't reset)

**4. Partial Asana Data:**
- Some custom fields may be empty in Asana
- Example: Name provided but no email
- Still show as "pre-filled from Asana" but highlight as missing
- Border: Yellow (missing) + small green badge "From Asana"

**5. User Navigates Away Mid-Edit:**
- Show confirmation dialog: `"You have unsaved changes. Are you sure you want to leave?"`
- Use browser `beforeunload` event

---

## TESTING CHECKLIST

**Test Edit Mode:**
- [ ] Form detects `case_id` parameter correctly
- [ ] Pre-fills all existing fields from MortgageCase record
- [ ] Highlights missing required fields with yellow border
- [ ] Shows progress bar with correct completion percentage
- [ ] Disables "Activate Case" button until all required fields filled
- [ ] Calculates LTV and loan-to-income correctly
- [ ] Updates case status to 'active' on submit
- [ ] Triggers triage calculation function
- [ ] Posts comment back to Asana task
- [ ] Redirects to dashboard with success message
- [ ] Case no longer appears in "Incomplete Cases" section
- [ ] Case appears in main pipeline with correct triage color

**Test Create Mode:**
- [ ] Form works without `case_id` parameter
- [ ] All fields start empty
- [ ] Validation rules apply correctly
- [ ] "Create Case" button has blue background
- [ ] Creates new case with `created_from_asana: false`
- [ ] Triage calculated on creation
- [ ] No Asana comment posted (no linked task)

**Test Validation:**
- [ ] Email validation rejects invalid formats
- [ ] Phone validation enforces UK format
- [ ] Loan amount cannot exceed property value
- [ ] All numeric fields reject negative numbers
- [ ] Required field error messages display correctly

**Test Edge Cases:**
- [ ] Already activated case redirects correctly
- [ ] Invalid case ID shows error and redirects
- [ ] Network error shows retry option
- [ ] Partial Asana data handled gracefully
- [ ] Browser back button warns about unsaved changes

---

## SUCCESS CRITERIA

**Form is complete when:**
1. ✅ Edit mode detects incomplete cases via URL
2. ✅ Pre-fills all existing Asana data correctly
3. ✅ Highlights missing required fields visually
4. ✅ Shows progress bar with accurate completion percentage
5. ✅ Disables submit until all required fields filled
6. ✅ Changes case status to 'active' on submit
7. ✅ Triggers triage calculation automatically
8. ✅ Posts completion comment to Asana task
9. ✅ Redirects to dashboard showing activated case in pipeline
10. ✅ Case no longer appears in incomplete section

**User Experience Goals:**
- Assistant can quickly identify missing fields
- Clear visual feedback for completed vs. missing data
- No confusion between create and edit modes
- Smooth activation workflow with minimal friction

---

## IMPLEMENTATION NOTES

**Base44 Low-Code Platform:**
- This prompt is designed for Base44's AI-assisted form builder
- Copy-paste this entire prompt into Base44 chat
- Base44 will generate the form configuration automatically
- Review generated form before publishing

**Function Dependencies:**
- `calculateTriage(caseId)` - Must exist (see separate prompt if not built)
- `matchLenders(caseId)` - Optional, can be added later
- `postAsanaComment(caseId, eventType)` - See Prompt 5 for implementation

**Database Schema Requirements:**
- Ensure MortgageCase entity has all fields mentioned in pre-fill logic
- `activated_at` field should exist for timestamp tracking
- `case_status` field must support values: 'incomplete', 'active', 'closed'

---

## FUTURE ENHANCEMENTS (Post-Phase 1B)

**Auto-Save Draft:**
- Save form data every 30 seconds to prevent data loss
- Show "Last saved at..." indicator

**Field-Level Validation:**
- Real-time validation as user types
- Green checkmark appears when field passes validation

**Smart Defaults:**
- Suggest employment type based on Insightly ID lookup
- Pre-populate credit history based on broker notes

**Multi-Currency Support:**
- Allow property value in GBP, EUR, USD
- Convert to GBP for LTV calculation

**Lender Recommendations:**
- Show matched lenders in real-time as fields are filled
- Example: "8 lenders available" updates as LTV changes

---

## FILE REFERENCES

**Related Documentation:**
- Webhook Implementation: `asanaWebhook_FINAL_fix.js` (lines 1-161)
- Triage Algorithm: See Prompt 5 (calculateTriage function)
- Dashboard UI: `BASE44_PROMPT_3_INCOMPLETE_CASES.md`
- Project Status: `PROJECT_STATUS_CONSOLIDATED.md`

**Backend Functions:**
- `/api/asanaWebhook` - Creates incomplete cases
- `/api/calculateTriage` - Assigns Blue/Green/Yellow/Red rating
- `/api/postAsanaComment` - Posts updates back to Asana (Prompt 5)
- `/api/matchLenders` - Matches suitable lenders (future)

---

**END OF PROMPT 4**

**Ready to use:** Copy this entire prompt and paste into Base44 to modify the intake form.

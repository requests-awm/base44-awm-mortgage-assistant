# BASE44 PROMPT 4B: INTAKE FORM - PRE-FILL LOGIC

**Phase:** 4B of 4 (Data Population Phase)
**Time:** 10-15 minutes
**Complexity:** Medium
**Dependencies:** Phase 4A complete

---

## OBJECTIVE

Pre-fill form fields with existing data from incomplete Asana cases. Fields that already have data should be populated and styled differently from empty fields.

---

## PREREQUISITES

**Ensure Phase 4A is complete:**
- ✅ Edit mode detection working
- ✅ Form fetches existing case data
- ✅ Form title and button change based on mode

---

## WHAT TO BUILD

### 1. Field Pre-Fill Logic

**On form load in edit mode, populate fields from `existingCase`:**

```javascript
if (isEditMode && existingCase) {
  // Step 1: Client Details
  if (existingCase.client_name) {
    formFields.clientName.value = existingCase.client_name;
    formFields.clientName.classList.add('field-prefilled');
  }

  if (existingCase.client_email) {
    formFields.clientEmail.value = existingCase.client_email;
    formFields.clientEmail.classList.add('field-prefilled');
  }

  if (existingCase.client_phone) {
    formFields.clientPhone.value = existingCase.client_phone;
    formFields.clientPhone.classList.add('field-prefilled');
  }

  // Step 2: Mortgage Details
  if (existingCase.property_value) {
    formFields.propertyValue.value = existingCase.property_value;
  }

  if (existingCase.loan_amount) {
    formFields.loanAmount.value = existingCase.loan_amount;
  }

  if (existingCase.mortgage_purpose) {
    formFields.mortgagePurpose.value = existingCase.mortgage_purpose;
  }

  if (existingCase.category) {
    formFields.category.value = existingCase.category;
  }

  // Step 3: Financials
  if (existingCase.annual_income) {
    formFields.annualIncome.value = existingCase.annual_income;
  }

  if (existingCase.employment_type) {
    formFields.employmentType.value = existingCase.employment_type;
  }

  if (existingCase.credit_history_status) {
    formFields.creditHistory.value = existingCase.credit_history_status;
  }

  // Step 4: Timing
  if (existingCase.purchase_completion_date) {
    formFields.completionDate.value = existingCase.purchase_completion_date;
  }

  // Step 5: Read-Only Fields (from Asana)
  if (existingCase.insightly_id) {
    formFields.insightlyId.value = existingCase.insightly_id;
    formFields.insightlyId.disabled = true;
    formFields.insightlyId.classList.add('field-readonly');
  }

  if (existingCase.internal_introducer) {
    formFields.internalIntroducer.value = existingCase.internal_introducer;
    formFields.internalIntroducer.disabled = true;
    formFields.internalIntroducer.classList.add('field-readonly');
  }

  if (existingCase.mortgage_broker_appointed) {
    formFields.brokerAppointed.value = existingCase.mortgage_broker_appointed;
    formFields.brokerAppointed.disabled = true;
    formFields.brokerAppointed.classList.add('field-readonly');
  }
}
```

### 2. Pre-Filled Field Styling

**Fields populated from Asana get green styling:**

```css
.field-prefilled {
  border: 1px solid #10B981 !important;
  background: #ECFDF5;
  position: relative;
}

/* Add "From Asana" badge */
.field-prefilled-container::after {
  content: '✓ From Asana';
  font-size: 11px;
  color: #10B981;
  font-weight: 500;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
```

### 3. Read-Only Field Styling

**Fields from Asana that shouldn't be edited:**

```css
.field-readonly {
  border: 1px solid #D1D5DB;
  background: #F9FAFB;
  cursor: not-allowed;
  opacity: 0.7;
}

.field-readonly-label::before {
  content: '🔒 ';
  color: #6B7280;
  font-size: 12px;
}
```

### 4. Empty Field Default Styling

**Fields that are still empty remain with default styling:**

```css
.field-empty {
  border: 1px solid #D1D5DB;
  background: white;
}
```

---

## FIELD MAPPING

**Map MortgageCase fields to form inputs:**

| **Form Field**           | **MortgageCase Field**         | **Styling**       | **Editable** |
|--------------------------|--------------------------------|-------------------|--------------|
| Client Name              | `client_name`                  | Green (prefilled) | ✓ Yes        |
| Client Email             | `client_email`                 | Green (prefilled) | ✓ Yes        |
| Client Phone             | `client_phone`                 | Green (prefilled) | ✓ Yes        |
| Property Value           | `property_value`               | Default           | ✓ Yes        |
| Loan Amount              | `loan_amount`                  | Default           | ✓ Yes        |
| Mortgage Purpose         | `mortgage_purpose`             | Default           | ✓ Yes        |
| Category                 | `category`                     | Default           | ✓ Yes        |
| Annual Income            | `annual_income`                | Default           | ✓ Yes        |
| Employment Type          | `employment_type`              | Default           | ✓ Yes        |
| Credit History           | `credit_history_status`        | Default           | ✓ Yes        |
| Completion Date          | `purchase_completion_date`     | Default           | ✓ Yes        |
| Insightly ID             | `insightly_id`                 | Gray (readonly)   | ✗ No         |
| Internal Introducer      | `internal_introducer`          | Gray (readonly)   | ✗ No         |
| Broker Appointed         | `mortgage_broker_appointed`    | Gray (readonly)   | ✗ No         |

---

## TEST STEPS

### Test 1: Pre-Fill Client Details (From Asana)
1. ✅ Create incomplete case with:
   - `client_name: "John Smith"`
   - `client_email: "john@example.com"`
   - `insightly_id: "12345"`
2. ✅ Navigate to: `/intake-form?case_id={case_id}`
3. ✅ Verify fields pre-filled:
   - Client Name: "John Smith" (green border, "✓ From Asana" badge)
   - Client Email: "john@example.com" (green border, "✓ From Asana" badge)
   - Insightly ID: "12345" (gray, disabled, with 🔒 icon)
4. ✅ Verify empty fields remain with default styling

**Expected:** Asana fields pre-filled with green styling, read-only fields disabled.

### Test 2: Pre-Fill Mortgage Details
1. ✅ Create incomplete case with:
   - `property_value: 500000`
   - `loan_amount: 400000`
2. ✅ Navigate to intake form
3. ✅ Verify fields pre-filled with correct values
4. ✅ Verify fields are editable (not disabled)

**Expected:** Mortgage details pre-filled but remain editable.

### Test 3: Partial Data (Some Fields Empty)
1. ✅ Create incomplete case with ONLY:
   - `client_name: "Jane Doe"`
   - `client_email: "jane@example.com"`
   - All other fields empty
2. ✅ Navigate to intake form
3. ✅ Verify only name and email pre-filled (green styling)
4. ✅ Verify all other fields empty with default styling

**Expected:** Only existing fields pre-filled, empty fields remain empty.

### Test 4: Read-Only Fields Cannot Be Edited
1. ✅ Create incomplete case with `insightly_id: "12345"`
2. ✅ Navigate to intake form
3. ✅ Try to click/edit Insightly ID field
4. ✅ Verify field is disabled (cursor: not-allowed)
5. ✅ Verify 🔒 icon appears in label

**Expected:** Read-only fields cannot be modified.

### Test 5: Create Mode Has No Pre-Fill
1. ✅ Navigate to: `/intake-form` (no case_id)
2. ✅ Verify ALL fields are empty
3. ✅ Verify NO green styling applied
4. ✅ Verify NO "From Asana" badges

**Expected:** Create mode works as before with empty fields.

---

## SUCCESS CRITERIA

**Phase 4B is complete when:**
1. ✅ Form pre-fills all existing fields from case data
2. ✅ Pre-filled fields from Asana have green border + badge
3. ✅ Read-only fields (Insightly ID, etc.) are disabled
4. ✅ Empty fields remain with default styling
5. ✅ Create mode (no case_id) has no pre-fill logic
6. ✅ All pre-filled fields display correct values

---

## EDGE CASES

**Null/Undefined Values:**
- If field value is `null` or `undefined`, treat as empty
- Do NOT apply green styling to null fields

**Number Fields:**
- Pre-fill numeric values without formatting
- Example: `500000` (not "£500,000")

**Date Fields:**
- Convert ISO date strings to form input format
- Example: `2025-06-15T00:00:00Z` → `2025-06-15`

**Select Fields:**
- Ensure pre-filled value matches select option value
- If value doesn't match any option, leave empty

---

## NOTES

- **Do NOT implement field highlighting yet** - that's Phase 4C
- **Do NOT implement validation yet** - that's Phase 4C/4D
- Focus ONLY on pre-filling existing data with correct styling

---

## NEXT PHASE

**After Phase 4B passes all tests, proceed to:**
→ [Phase 4C: Missing Field Highlighting](BASE44_PROMPT_4C_FIELD_HIGHLIGHTING.md)

---

**END OF PHASE 4B**

Copy this prompt into Base44 and test before moving to Phase 4C.

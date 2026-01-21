# PHASE 3: VALIDATION & SUBMIT BUTTON

## OBJECTIVE
Add field validation and smart submit button behavior.

**Prerequisites:** Phase 1 & 2 must be complete (detection, pre-fill, and highlighting working)

---

## WHAT YOU'RE BUILDING

1. Field-level validation rules
2. Dynamic submit button that enables/disables based on form state
3. Different button behavior for edit vs create mode

---

## VALIDATION RULES

**Email validation:**
- Format: `name@domain.com`
- Error message: `"Please enter a valid email address"`
- Use regex or browser's built-in email validation

**Phone validation:**
- Format: UK phone numbers
- Accept: `07123456789`, `+447123456789`, `020 1234 5678`
- Error message: `"Please enter a valid UK phone number"`

**Numeric fields (property_value, loan_amount, annual_income):**
- Must be > 0
- No negative numbers
- Error message: `"Must be a positive number"`

**Loan amount special rule:**
- Must be ≤ property_value
- Error message: `"Loan amount cannot exceed property value"`
- Check this whenever either field changes

**Text fields (client_name):**
- Minimum 2 characters
- Error message: `"Name must be at least 2 characters"`

**Dropdown fields (mortgage_purpose, category, employment_type):**
- Must select an option (not empty)
- Error message: `"Please select an option"`

---

## DERIVED FIELDS (Auto-Calculate)

**LTV (Loan-to-Value):**
```javascript
const ltv = (loanAmount / propertyValue) * 100;
```
Display as percentage: `"72%"`

**Loan-to-Income:**
```javascript
const loanToIncome = loanAmount / annualIncome;
```
Display as ratio: `"4.2x"`

Calculate these automatically when the user enters values.
Show them in a read-only field or summary section.

---

## SUBMIT BUTTON BEHAVIOR

**Button label changes by mode:**
- Edit Mode: `"Activate Case"`
- Create Mode: `"Create Case"`

**Button styling:**

Edit mode (amber):
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
```

Create mode (blue):
```css
.btn-create {
  background: #2563EB;
  /* ... same other styles */
}
```

Disabled state (both modes):
```css
.btn-activate:disabled,
.btn-create:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  opacity: 0.6;
}
```

**Enable/disable logic:**
- Button is DISABLED if ANY required field is empty or invalid
- Button is ENABLED when all 9 required fields are filled AND valid
- Add tooltip on disabled state: `"Fill all required fields to continue"`

---

## VALIDATION TIMING

**When to validate:**
1. **On blur** (when user leaves a field) - show error if invalid
2. **On submit** (when button clicked) - validate all fields
3. **Real-time for loan amount** - check against property value as they type

**Don't validate:**
- While user is actively typing (wait for blur)
- Empty fields until user has interacted with them

---

## ERROR MESSAGE DISPLAY

**Show errors below the field:**
```html
<div class="field-wrapper">
  <label>Email</label>
  <input type="email" />
  <span class="error-message">Please enter a valid email address</span>
</div>
```

```css
.error-message {
  display: block;
  color: #EF4444;
  font-size: 12px;
  margin-top: 4px;
}
```

---

## TESTING THIS PHASE

Before moving to Phase 4, verify:
- [ ] Email validation rejects invalid formats
- [ ] Phone validation accepts UK formats
- [ ] Loan amount cannot exceed property value
- [ ] Negative numbers are rejected
- [ ] LTV calculates correctly
- [ ] Loan-to-income calculates correctly
- [ ] Submit button disabled when fields incomplete
- [ ] Submit button enabled when all fields valid
- [ ] Error messages display at the right time
- [ ] Button label changes based on mode
- [ ] Button color is amber (edit) or blue (create)

---

## SUCCESS CRITERIA

✅ **This phase is complete when:**
1. All validation rules work correctly
2. Derived fields (LTV, loan-to-income) calculate automatically
3. Submit button enables/disables based on form validity
4. Error messages are clear and helpful
5. User cannot submit invalid data

---

**NEXT PHASE:** Submit actions (database updates, triage, redirects)
# PHASE 2: MISSING FIELD HIGHLIGHTING

## OBJECTIVE
Add visual indicators for required fields that are still empty.

**Prerequisites:** Phase 1 must be complete (detection and pre-fill working)

---

## WHAT YOU'RE BUILDING

Visual feedback system that shows:
- Which required fields are missing
- Which required fields are complete
- Overall progress toward activation

---

## REQUIRED FIELDS LIST

These 9 fields must be filled before activation:

1. `client_name`
2. `client_email`
3. `client_phone`
4. `property_value`
5. `loan_amount`
6. `mortgage_purpose`
7. `category`
8. `annual_income`
9. `employment_type`

---

## VISUAL INDICATORS

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

Add helper text below field: `"Required to activate case"` in amber (#F59E0B)

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

---

## PROGRESS SUMMARY (Edit Mode Only)

Show this at the TOP of the form when in edit mode:

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
```css
.progress-summary {
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}
```

**Progress bar:**
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

Calculate percentage: `(filledCount / 9) * 100`

---

## DYNAMIC UPDATES

**As user fills fields:**
1. Remove field from "Missing" list
2. Update progress bar
3. Change field border from amber to green
4. Add green checkmark to label
5. Remove "Required to activate case" helper text

**If user clears a required field:**
1. Add field back to "Missing" list
2. Update progress bar (decrease)
3. Change border back to amber
4. Add warning icon to label

---

## ACCESSIBILITY

**For screen readers:**
```html
<input
  aria-required="true"
  aria-invalid="true"
  aria-describedby="field-help-text"
/>
<span id="field-help-text" role="alert">
  Required to activate case
</span>
```

---

## TESTING THIS PHASE

Before moving to Phase 3, verify:
- [ ] Empty required fields have amber border
- [ ] Filled required fields have green border with checkmark
- [ ] Progress summary shows at top in edit mode
- [ ] Progress bar updates as fields are filled
- [ ] Missing fields list updates dynamically
- [ ] Helper text appears/disappears correctly
- [ ] Progress shows 100% when all 9 fields filled

---

## SUCCESS CRITERIA

✅ **This phase is complete when:**
1. All required fields visually indicate missing/complete status
2. Progress bar shows accurate completion percentage
3. Missing fields list updates in real-time
4. Visual feedback is clear and not overwhelming
5. Works in both edit and create modes

---

**NEXT PHASE:** Validation rules and submit button logic
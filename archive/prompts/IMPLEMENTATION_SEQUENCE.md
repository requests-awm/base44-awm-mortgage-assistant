# INTAKE FORM: IMPLEMENTATION SEQUENCE

## Overview
This is the phased approach for implementing the intake form modifications. Each phase builds on the previous one and can be tested independently.

---

## PHASE EXECUTION ORDER

### Phase 1: Detection & Pre-Fill (30% of work)
**File:** `PHASE_1_DETECTION_AND_PREFILL.md`

**What it does:**
- Detects edit vs create mode from URL
- Loads existing case data
- Pre-fills form fields
- Handles edge cases (invalid ID, already active)

**Test before moving on:**
- Form loads correctly in both modes
- Data pre-fills from database
- Edge cases redirect properly

**Prompt to Base44:**
> "I need to modify our intake form to support edit mode. Here's Phase 1 of 4: [paste PHASE_1 contents]. Focus only on detection and pre-filling. Don't implement validation or submit logic yet."

---

### Phase 2: Missing Field Highlighting (25% of work)
**File:** `PHASE_2_MISSING_FIELD_HIGHLIGHTING.md`

**What it does:**
- Adds visual indicators for missing required fields
- Shows progress bar
- Lists missing fields
- Updates dynamically as user fills form

**Test before moving on:**
- Missing fields have amber borders
- Filled fields have green checkmarks
- Progress bar calculates correctly
- Visual updates happen in real-time

**Prompt to Base44:**
> "Phase 1 is complete. Now let's add visual feedback for missing fields. Here's Phase 2: [paste PHASE_2 contents]. Build on the existing form, don't recreate it."

---

### Phase 3: Validation & Submit Button (20% of work)
**File:** `PHASE_3_VALIDATION_AND_SUBMIT.md`

**What it does:**
- Validates email, phone, numeric fields
- Checks loan amount vs property value
- Calculates LTV and loan-to-income
- Enables/disables submit button based on validity

**Test before moving on:**
- Validation rules work correctly
- Derived fields calculate automatically
- Submit button enables only when form valid
- Error messages display properly

**Prompt to Base44:**
> "Phase 2 is complete. Now let's add validation rules and smart submit button behavior. Here's Phase 3: [paste PHASE_3 contents]. Add to the existing form."

---

### Phase 4: Submit Actions (25% of work)
**File:** `PHASE_4_SUBMIT_ACTIONS.md`

**What it does:**
- Updates database on submit
- Changes case status to 'active'
- Handles errors gracefully
- Redirects to dashboard
- Shows success/error messages

**Test before moving on:**
- Edit mode updates cases correctly
- Create mode creates new cases
- All data saves to database
- Redirect works
- Error handling prevents data loss

**Prompt to Base44:**
> "Phase 3 is complete. Now let's implement the submit actions. Here's Phase 4 (final phase): [paste PHASE_4 contents]. Complete the form by adding the submit behavior."

---

## TESTING STRATEGY

### After Each Phase:
1. Deploy to test environment
2. Test the specific functionality added in that phase
3. Verify previous phases still work
4. Fix any issues before moving to next phase

### After Phase 4 (Complete):
1. **Smoke test:** Create a case manually (create mode)
2. **Integration test:** Asana webhook → incomplete case → edit form → activate
3. **Edge case test:** Invalid IDs, already active, network errors
4. **Browser test:** Chrome, Firefox, Safari, Mobile
5. **Accessibility test:** Keyboard navigation, screen reader

---

## WHY THIS APPROACH WORKS

**Prevents hallucination:**
- Each phase has clear, limited scope
- Base44 doesn't need to hold entire spec in context
- Can verify correctness at each step

**Easier debugging:**
- If something breaks, you know which phase caused it
- Don't have to debug entire form at once

**Faster iteration:**
- Can deploy Phase 1 immediately for basic functionality
- Don't have to wait for all 4 phases to get value

**Clearer communication:**
- Each prompt is focused and actionable
- No overwhelming Base44 with 500 lines of requirements

---

## ROLLBACK PLAN

**If a phase fails:**
1. Revert to previous phase
2. System still works (just missing that phase's features)
3. Debug and fix
4. Retry the phase

**Safe states:**
- After Phase 1: Form works in edit/create mode (no highlighting)
- After Phase 2: Form has visual feedback (no validation)
- After Phase 3: Form validates (no submit)
- After Phase 4: Complete system

---

## TIME ESTIMATES (Per Phase)

**Phase 1:** 2-3 hours (including testing)
**Phase 2:** 2 hours (mostly CSS and UI logic)
**Phase 3:** 1-2 hours (validation is straightforward)
**Phase 4:** 2-3 hours (database operations + testing)

**Total:** 7-10 hours for complete implementation

---

## DEPENDENCIES

**Before starting Phase 1:**
- [ ] MortgageCase entity exists with all required fields
- [ ] Existing intake form is functional
- [ ] Dashboard can display cases

**Before starting Phase 4:**
- [ ] Database permissions allow updates
- [ ] Toast notification system exists
- [ ] Dashboard has highlight functionality

**Not required (future work):**
- Triage calculation function
- Lender matching function
- Asana comment posting function

These can be built separately and integrated later.

---

## SUCCESS METRICS

**Phase 1 Success:** Edit mode loads existing case data
**Phase 2 Success:** Users can see which fields are missing at a glance
**Phase 3 Success:** Invalid data cannot be submitted
**Phase 4 Success:** Cases activate and appear in main pipeline

**Overall Success:**
- Incomplete cases from Asana can be completed via form
- Manual cases can be created
- No cases get "stuck" in incomplete state
- User experience is smooth and intuitive

---

## NEXT STEPS AFTER PHASE 4

1. **Monitor usage:** Track how many cases are activated via form
2. **Gather feedback:** Ask team if workflow is intuitive
3. **Add enhancements:** Auto-save, field-level real-time validation
4. **Build integrations:** Triage calculation, lender matching
5. **Optimize:** Add loading states, better error messages

---

**RECOMMENDED APPROACH:**
1. Copy each phase file to Base44 in sequence
2. Test thoroughly after each phase
3. Don't rush - better to have 1 working phase than 4 broken ones
4. Document any deviations from the plan
5. Celebrate after Phase 4! 🎉

---

**END OF IMPLEMENTATION SEQUENCE**
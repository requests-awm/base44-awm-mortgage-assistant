# TESTING SETUP GUIDE: How to Test Without Live Asana Webhook

## Problem
You need to test the intake form modifications, but you don't have:
- Live Asana webhook running yet
- Real incomplete cases in the database
- Actual Asana task data

## Solution: Create Test Data Manually

---

## OPTION 1: Manual Database Seeding (Recommended)

**Create incomplete test cases directly in Base44:**

### Step 1: Create a "Seed Data" Function

In Base44, create a function called `createTestIncompleteCase`:

```javascript
// Function: createTestIncompleteCase
// Purpose: Create fake incomplete cases for testing

async function createTestIncompleteCase() {
  const testCase = await base44.entities.MortgageCase.create({
    // Fields that WOULD come from Asana
    asana_task_id: 'TEST-' + Date.now(),
    asana_task_url: 'https://app.asana.com/0/test/test',
    client_name: 'John Test',
    client_email: 'john.test@example.com',
    insightly_id: 'INSIGHTLY-TEST-123',
    internal_introducer: 'Test Broker',
    mortgage_broker_appointed: true,

    // Fields that would be EMPTY (not in Asana custom fields)
    client_phone: null,
    property_value: null,
    loan_amount: null,
    mortgage_purpose: null,
    category: null,
    annual_income: null,
    employment_type: null,
    credit_history_status: null,
    purchase_completion_date: null,

    // Status and metadata
    case_status: 'incomplete',
    created_from_asana: true,
    case_type: 'lead',

    // Timestamps
    created_at: new Date().toISOString(),
    asana_last_synced: new Date().toISOString()
  });

  console.log('Test case created:', testCase.id);
  console.log('Test URL:', `/intake-form?case_id=${testCase.id}`);

  return testCase;
}
```

### Step 2: Run the Function

In Base44's function runner or console:
```javascript
await createTestIncompleteCase();
// Output: Test URL: /intake-form?case_id=abc123xyz
```

### Step 3: Test the Form

1. Copy the URL from the output
2. Navigate to that URL in your browser
3. Form should load in **edit mode**
4. Should pre-fill: name, email, Insightly ID, etc.
5. Should highlight missing: phone, property value, loan amount, etc.

---

## OPTION 2: Quick Test Script

**Create multiple test cases at once:**

```javascript
// Function: seedTestData
async function seedTestData() {
  const scenarios = [
    {
      name: 'Mostly Complete Case',
      data: {
        client_name: 'Jane Smith',
        client_email: 'jane@example.com',
        client_phone: '07123456789',
        property_value: 350000,
        loan_amount: 280000,
        mortgage_purpose: 'Purchase',
        // Missing: category, income, employment
        case_status: 'incomplete'
      }
    },
    {
      name: 'Minimal Data Case',
      data: {
        client_name: 'Bob Johnson',
        client_email: 'bob@example.com',
        // Missing almost everything
        case_status: 'incomplete'
      }
    },
    {
      name: 'No Client Info Case',
      data: {
        property_value: 500000,
        loan_amount: 400000,
        // Missing client details
        case_status: 'incomplete'
      }
    }
  ];

  const createdCases = [];

  for (const scenario of scenarios) {
    const testCase = await base44.entities.MortgageCase.create({
      ...scenario.data,
      asana_task_id: `TEST-${Date.now()}-${Math.random()}`,
      created_from_asana: true,
      case_type: 'lead',
      created_at: new Date().toISOString()
    });

    console.log(`✅ ${scenario.name}:`, `/intake-form?case_id=${testCase.id}`);
    createdCases.push(testCase);
  }

  return createdCases;
}
```

**Run it:**
```javascript
await seedTestData();
```

**Output:**
```
✅ Mostly Complete Case: /intake-form?case_id=abc123
✅ Minimal Data Case: /intake-form?case_id=def456
✅ No Client Info Case: /intake-form?case_id=ghi789
```

Now you have 3 different scenarios to test!

---

## OPTION 3: Testing Create Mode (No Database Needed)

**Just navigate to the form without a case_id:**

1. Go to: `/intake-form`
2. Form loads in **create mode**
3. All fields are empty
4. Fill them out manually
5. Click "Create Case"
6. Should create a new case and redirect to dashboard

**This tests:**
- Create mode detection (no URL param)
- Validation rules
- Database creation
- Redirect logic

---

## TESTING SEQUENCE (Phase by Phase)

### After Phase 1 (Detection & Pre-fill):

**Test Edit Mode:**
```javascript
// 1. Create test case
const testCase = await createTestIncompleteCase();

// 2. Navigate to: /intake-form?case_id={testCase.id}

// 3. Verify:
// - Form title says "Complete Intake for Case {reference}"
// - Name and email are pre-filled
// - Fields from Asana have green borders
// - Empty fields are just empty (no highlighting yet)
```

**Test Create Mode:**
```javascript
// 1. Navigate to: /intake-form

// 2. Verify:
// - Form title says "Create New Mortgage Case"
// - All fields are empty
// - No green borders (nothing pre-filled)
```

**Test Edge Cases:**
```javascript
// 1. Navigate to: /intake-form?case_id=INVALID_ID
// Verify: Error toast + redirect to dashboard

// 2. Create an active case, then try to edit it
const activeCase = await base44.entities.MortgageCase.create({
  case_status: 'active',
  // ... other fields
});
// Navigate to: /intake-form?case_id={activeCase.id}
// Verify: Warning toast + redirect to case details
```

---

### After Phase 2 (Highlighting):

**Use the same test cases from Phase 1:**

```javascript
// Navigate to the incomplete case URL again
// Now verify:
// - Missing required fields have amber borders
// - Missing fields have ⚠️ icon in label
// - Progress bar shows correct percentage
// - Missing fields list is accurate
```

**Test dynamic updates:**
```javascript
// 1. Load incomplete case
// 2. Fill in "Property Value" field
// 3. Verify:
//    - Border changes from amber to green
//    - Label gets ✓ checkmark
//    - Progress bar increases
//    - "Property Value" removed from missing list
```

---

### After Phase 3 (Validation):

**Test validation rules:**

```javascript
// 1. Load incomplete case
// 2. Try invalid email: "notanemail"
//    - Verify: Error message appears on blur
// 3. Try loan amount > property value
//    - Verify: Error message appears
// 4. Fill all required fields with valid data
//    - Verify: Submit button becomes enabled
// 5. Leave one field empty
//    - Verify: Submit button stays disabled
```

**Test derived calculations:**
```javascript
// 1. Enter property_value: 400000
// 2. Enter loan_amount: 300000
// 3. Verify LTV shows: "75%"
// 4. Enter annual_income: 75000
// 5. Verify loan-to-income shows: "4.0x"
```

---

### After Phase 4 (Submit):

**Test Edit Mode Submit:**

```javascript
// 1. Load incomplete case
// 2. Fill all required fields
// 3. Click "Activate Case"
// 4. Verify:
//    - Success toast appears
//    - Redirects to dashboard
//    - Case status is now 'active'
//    - Case appears in main pipeline
//    - Case NOT in incomplete section
```

**Check database:**
```javascript
// After submit, fetch the case again:
const updatedCase = await base44.entities.MortgageCase.findById(caseId);

console.log('Status:', updatedCase.case_status); // Should be 'active'
console.log('Activated at:', updatedCase.activated_at); // Should have timestamp
console.log('LTV:', updatedCase.ltv); // Should be calculated
console.log('Loan to income:', updatedCase.loan_to_income); // Should be calculated
```

**Test Create Mode Submit:**
```javascript
// 1. Navigate to /intake-form (no case_id)
// 2. Fill all required fields
// 3. Click "Create Case"
// 4. Verify:
//    - Success toast
//    - Redirects to dashboard
//    - New case appears in pipeline
//    - created_from_asana is false
//    - case_status is 'active'
```

---

## COMPLETE TESTING CHECKLIST

### Pre-Testing Setup:
- [ ] Create `createTestIncompleteCase` function in Base44
- [ ] Run function to create 2-3 test cases with different data scenarios
- [ ] Copy test URLs for easy access

### Phase 1 Testing:
- [ ] Edit mode loads test case data
- [ ] Create mode starts with empty form
- [ ] Form title changes correctly
- [ ] Invalid case_id redirects
- [ ] Already active case redirects

### Phase 2 Testing:
- [ ] Missing fields have amber borders
- [ ] Filled fields have green borders
- [ ] Progress bar calculates correctly
- [ ] Missing list updates dynamically
- [ ] Visual feedback is clear

### Phase 3 Testing:
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Loan > property value shows error
- [ ] LTV calculates correctly
- [ ] Loan-to-income calculates correctly
- [ ] Submit button enables/disables correctly

### Phase 4 Testing:
- [ ] Edit mode updates database
- [ ] Create mode creates new record
- [ ] Status changes to 'active'
- [ ] Timestamps are set
- [ ] Derived fields save correctly
- [ ] Redirect works
- [ ] Case appears in correct dashboard section
- [ ] Error handling works (disconnect network to test)

### Clean Up After Testing:
```javascript
// Delete test cases
await base44.entities.MortgageCase.deleteMany({
  asana_task_id: { $startsWith: 'TEST-' }
});
```

---

## WHEN TO TEST WITH REAL ASANA WEBHOOK

**Only after all 4 phases are complete and tested with manual data.**

Then:
1. Set up Asana webhook (Prompt 1)
2. Trigger webhook from Asana (create a task)
3. Verify incomplete case is created
4. Navigate to edit URL from dashboard
5. Complete the intake form
6. Verify case activates correctly

**But you don't need to wait for this!** You can build and test all 4 phases with manual test data first.

---

## BENEFITS OF THIS APPROACH

✅ **Test each phase immediately** - No waiting for webhook setup
✅ **Control test scenarios** - Create cases with specific missing data
✅ **Faster iteration** - No dependency on Asana
✅ **Repeatable tests** - Run same scenarios multiple times
✅ **Safe** - Test data is clearly marked (TEST- prefix)

---

## NEXT STEPS SUMMARY

1. **Right now:** Create the `createTestIncompleteCase` function in Base44
2. **After Phase 1:** Run function, get test URL, verify detection works
3. **After Phase 2:** Reload test URL, verify highlighting works
4. **After Phase 3:** Test validation rules
5. **After Phase 4:** Test submit and database updates
6. **Finally:** Integrate with real Asana webhook

---

**You can start testing immediately after implementing Phase 1!**

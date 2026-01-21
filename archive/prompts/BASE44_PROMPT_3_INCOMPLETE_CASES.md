# BASE44 PROMPT 3 (REVISED): INCOMPLETE CASES FROM ASANA

**What This Does:** Shows ONLY cases that were auto-created from Asana webhook (not manually created cases).

**Key Filter:** `created_from_asana = true` AND `case_status = "incomplete"`

---

## 📋 COPY-PASTE THIS INTO BASE44:

Add a new section to the main dashboard for incomplete cases from Asana.

LOCATION: Top of dashboard, BEFORE the pipeline section

SECTION TITLE: "⚠️ Incomplete Cases from Asana"

DISPLAY LOGIC:
- Show count in title: "⚠️ Incomplete Cases from Asana (3)"
- Only show if incomplete Asana cases exist (hide if 0)
- Query: MortgageCase where case_status = "incomplete" AND created_from_asana = true
- Sort by: created_at DESC (newest first)

IMPORTANT FILTER:
- MUST include: created_from_asana = true
- This ensures ONLY webhook-created cases appear (not manual entries)

CARD DESIGN:
Each incomplete case displays:
- Case Reference (e.g., AWM-2025-001)
- Asana Task: Linked ✓ (always present for these cases)
- Client Name (✓ if filled, ❌ if missing)
- Client Email (✓ if filled, ❌ if missing)
- Client Phone (✓ if filled, ❌ if missing)
- Created timestamp (relative: "2 hours ago")
- Required Fields list with checkmarks:
  * Property Value
  * Loan Amount
  * Annual Income
  * Employment Type
  * Category
  * Purpose
- Progress bar (e.g., "3/9 fields complete")
- "Complete Intake" button (gold background, prominent)

STYLING:
- Yellow/amber border on left (4px, warning color)
- White/light background
- Green checkmarks (✓) for completed fields
- Red X (❌) for missing fields
- Progress bar: visual bar showing percentage
- Card should be clickable (opens intake form)
- Hover effect: slight shadow/elevation

CLICK BEHAVIOR:
- Clicking anywhere on card opens intake form for that case
- Pre-fills all existing data from Asana
- Shows which fields need completion
- Submit button text: "Activate Case"

VALIDATION:
Required fields to activate case:
- Property Value (number)
- Loan Amount (number)
- Annual Income (number)
- Employment Type (select)
- Category (select: Residential, BTL, etc.)
- Purpose (select: Purchase, Remortgage, etc.)
- Client Phone (text, if not from Asana)

EMPTY STATE:
If no incomplete Asana cases:
- Hide the entire section (don't show "0 cases")
- This keeps dashboard clean when no work is pending

---

## ✅ Success Criteria:

After pasting this, you should see:
- Section appears ONLY when cases exist from Asana webhook
- Section is hidden if no incomplete Asana cases
- Manual cases (created_from_asana = false) do NOT appear here
- Cards show beautiful styling with colored borders

---

## 🎨 Why the Styling is Better:

The current implementation likely has:
- ✅ Visual progress indicators
- ✅ Color-coded borders (yellow/amber for warning)
- ✅ Checkmarks and X marks for quick scanning
- ✅ Hover effects for interactivity
- ✅ Clean, Apple-inspired minimal design

This matches your Ascot brand aesthetic! 🎯

---

**Ready to paste?** This updated version ensures ONLY Asana-pushed cases appear, not manual entries.

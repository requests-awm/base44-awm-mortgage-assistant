# Tara's Handover: Lender Knowledge Capture Setup

**Project:** Base44 Mortgage Assistant - Lender Knowledge Base
**Your Role:** Admin & Setup (Google Forms creation, broker coordination)
**Timeline:** 2 weeks
**Estimated Time:** 3-4 hours total setup time

---

## What This Project Is About

We're building a knowledge base of broker insights for the Base44 mortgage assistant. Nwabisa and Dextter have years of tribal knowledge about UK lenders that isn't on any website - this is what makes them great brokers.

**Your job:** Ensure the interviews happen and we get transcripts - whether that's via Zoom clips (brokers record themselves) OR you conducting live interviews with them.

**Not your job:** You don't need to transcribe, filter responses, or enter data into Notion. Just get us the interview recordings/transcripts with links.

---

## The 3-Phase Process (Overview)

```
PHASE 0: Lender Familiarity Checklist
↓ (Tara reviews, creates priority list)
PHASE 1: Basic Contact Details Form
↓ (Brokers complete async)
PHASE 2: Knowledge Capture Interviews
↓ (Tara conducts interviews OR brokers record Zoom clips)
PHASE 3: Transcript Filtering & Notion Entry
(Handled separately - project lead filters transcripts and enters into Notion)
```

**Your involvement:** Phases 0-2 (setup + ensure interviews happen + provide transcript links)
**Your deliverable:** Interview recordings/transcripts with links (either Zoom clips or live interview recordings)

---

## Your Tasks Checklist

- [ ] **Task 1:** Create Phase 0 Google Form (Lender Familiarity Checklist) - 30 mins
- [ ] **Task 2:** Send Phase 0 form to Nwabisa & Dextter - 5 mins
- [ ] **Task 3:** Review form responses & create priority spreadsheet - 20 mins
- [ ] **Task 4:** Create Phase 1 Google Form (Contact Details) - 20 mins
- [ ] **Task 5:** Send Phase 1 forms to brokers (only for lenders they checked) - 10 mins
- [ ] **Task 6:** Decide interview approach with brokers (self-recorded vs live interviews) - 15 mins
- [ ] **Task 7:** Set up recording folder structure + send instructions - 10 mins
- [ ] **Task 8:** Conduct live interviews OR QA first 3 self-recordings - 30 mins to 3 hours (depends on approach)
- [ ] **Task 9:** Ensure all interviews happen & provide transcript links - ongoing, 5 mins/day
- [ ] **Task 10:** Share final recordings/transcript links with project lead - 10 mins

**Total time:** ~3-4 hours (self-recorded approach) OR ~15-20 hours (live interview approach)

---

## TASK 1: Create Phase 0 Google Form (Lender Familiarity Checklist)

**Purpose:** Find out which lenders each broker has actually worked with (3+ cases in last 2 years)

**Time:** 30 minutes

### Step-by-Step Instructions

#### Step 1: Create New Google Form
1. Go to [forms.google.com](https://forms.google.com)
2. Click **+ Blank form**
3. Title: `Lender Familiarity Checklist - [Broker Name]`
   - Create TWO separate forms: one for Nwabisa, one for Dextter
   - This lets you track responses separately

#### Step 2: Form Settings
1. Click **Settings** (gear icon)
2. **General tab:**
   - ✅ Collect email addresses
   - ✅ Limit to 1 response
   - ✅ Allow response editing
3. **Presentation tab:**
   - ✅ Show progress bar
   - Confirmation message (see below)

**Confirmation message:**
```
✅ Checklist submitted successfully!

NEXT STEPS:
1. You'll receive a Google Form for each lender you checked (basic contact details - 5 mins each)
2. After completing those forms, you'll record Zoom clips for each lender (8-10 mins each)

Timeline:
- Week 1: Complete contact detail forms
- Week 2: Record Zoom clips

Questions? Contact Tara.
```

#### Step 3: Section 1 - Instructions
1. Click **+ Add section**
2. Title: `Which Lenders Do You Actually Know?`
3. Description:
```
We're building a knowledge base for the Base44 mortgage assistant.

ONLY check the box if you meet ALL of these criteria:
✅ Placed at least 3 cases with them in the last 2 years
✅ Have direct experience with their underwriting process
✅ Can speak to their criteria quirks (not just website info)

If you've only placed 1-2 cases or just heard about them, leave it unchecked.

This will take 5-10 minutes. Be honest - better to skip lenders you don't know well.
```

#### Step 4: Add Checkbox Question
1. Click **+ Add question**
2. Question type: **Checkboxes** (allows multiple selection)
3. Question text: `Check ONLY the lenders you have substantial experience with (3+ cases in last 2 years)`
4. **Required:** Yes

#### Step 5: Add Lender Options (COPY-PASTE THIS LIST)

**IMPORTANT:** Copy this entire list and paste into the checkbox options.

```
Accord Mortgages (Yorkshire BS)
Aldermore
Atom Bank
Barclays
Beverley Building Society
Bluestone Mortgages
Buckinghamshire Building Society
Cambridge Building Society
Chorley Building Society
Coventry Building Society
Cumberland Building Society
Darlington Building Society
Dudley Building Society
Foundation Home Loans
Furness Building Society
Hanley Economic Building Society
Hampshire Trust Bank
Hinckley & Rugby Building Society
HSBC
Ipswich Building Society
Kensington Mortgages
Kent Reliance (OSB Group)
Leeds Building Society
Leek United Building Society
Lloyds Bank
Loughborough Building Society
Manchester Building Society
Marsden Building Society
Masthaven Bank
Melton Mowbray Building Society
Metro Bank
Monmouthshire Building Society
Mortgage Works (Nationwide BTL)
NatWest
Nationwide Building Society
Newbury Building Society
Newcastle Building Society
Nottingham Building Society
Paragon Bank
Penrith Building Society
Pepper Money
Precise Mortgages
Principality Building Society
Progressive Building Society
Saffron Building Society
Santander
Scarborough Building Society
Shawbrook Bank
Skipton Building Society
Stafford Railway Building Society
Swansea Building Society
Teachers' Building Society
Tipton & Coseley Building Society
Together Money
TSB
United Trust Bank
Vernon Building Society
Virgin Money
West Bromwich Building Society
Yorkshire Building Society
```

**Note:** This list has ~55 mainstream lenders. If you want to add more specialist lenders (bridging, equity release, etc.), see the full list in `LENDER_FAMILIARITY_CHECKLIST.md`.

#### Step 6: Add "Other Lenders" Question
1. Click **+ Add question**
2. Question type: **Paragraph**
3. Question text: `Are there any other lenders you've worked with that aren't on this list?`
4. Helper text: `List any lenders we missed, especially smaller building societies.`
5. **Required:** No

#### Step 7: Add Experience Summary Questions
1. Click **+ Add question**
2. Question type: **Short answer**
3. Question text: `How many total lenders did you check above?`
4. Validation: **Number** between 0 and 100
5. **Required:** Yes

---

1. Click **+ Add question**
2. Question type: **Paragraph**
3. Question text: `Which 10 lenders do you place the MOST cases with? (List in order of volume)`
4. Helper text:
```
List your top 10 lenders by volume:
1. [Lender name]
2. [Lender name]
...

This helps us prioritize which lenders to capture first.
```
5. **Required:** Yes

#### Step 8: Get Shareable Link
1. Click **Send** (top right)
2. Click **Link** icon (chain link)
3. ✅ Shorten URL
4. Click **Copy**
5. Save link somewhere (you'll need it for Task 2)

#### Step 9: Repeat for Second Broker
- **Duplicate the form** (File > Make a copy)
- Change title to other broker's name
- Get new shareable link

---

## TASK 2: Send Phase 0 Form to Brokers

**Time:** 5 minutes

### Email Template (Send to Nwabisa)

**Subject:** ACTION REQUIRED: Lender Familiarity Checklist (5-10 mins)

**Body:**
```
Hi Nwabisa,

We're building a lender knowledge base for the Base44 mortgage assistant. Before we start recording sessions, we need to know which lenders you have substantial experience with.

📋 TASK: Complete this checklist (5-10 mins)
[Insert Google Form link]

WHAT TO CHECK:
✅ Only lenders where you've placed 3+ cases in the last 2 years
✅ Only lenders you know well (can speak to their quirks, not just website criteria)

WHY THIS MATTERS:
You'll only record sessions for lenders you CHECK. If you check 60 lenders, you'll do 60 recordings. If you check 40, you'll do 40. Be selective.

DEADLINE: Complete within 24 hours (it's quick!)

WHAT'S NEXT:
After you submit, you'll receive follow-up forms to capture basic contact details for each lender, then you'll record Zoom clips walking through the tribal knowledge questions.

Questions? Let me know.

Thanks,
Tara
```

**Send identical email to Dextter** (with his form link)

---

## TASK 3: Review Responses & Create Priority List

**Time:** 20 minutes

**When:** After both brokers submit (give them 24 hours)

### Step 1: Download Responses
1. Open Google Form
2. Click **Responses** tab
3. Click **More** (3 dots) > **Download responses (.csv)**
4. Do this for BOTH forms (Nwabisa + Dextter)

### Step 2: Create Overlap Spreadsheet

Open Google Sheets and create this structure:

| Lender | Nwabisa | Dextter | Priority | Notes |
|--------|---------|---------|----------|-------|
| Barclays | ✅ | ✅ | High | Both know |
| HSBC | ✅ | ❌ | Medium | Only Nwabisa |
| Santander | ❌ | ✅ | Medium | Only Dextter |
| [etc.] | | | | |

**How to fill it in:**
1. List all lenders from the checkbox list
2. Mark ✅ if broker checked that lender
3. Priority:
   - **High** = Both brokers checked it OR it's in someone's top 10
   - **Medium** = Only one broker checked it
   - **Low** = Neither checked it (skip these entirely)

### Step 3: Sort by Priority

**CRITICAL:** If the broker indicated they have a **strong relationship** with a lender (e.g., mentioned in "top 10" or noted as a frequent partner), mark these as **PRIORITY 1 - In-Person Interview**.

1. Sort spreadsheet by **Priority** column:
   - **Priority 1 (In-Person):** Strong relationship lenders (top 10 + frequent partners)
   - **Priority 2 (High):** Both brokers know OR high volume
   - **Priority 3 (Medium):** Only one broker knows
   - **Priority 4 (Low):** Neither knows (delete these rows)

2. Add a column: **Interview Type**
   - Priority 1 lenders = "In-Person Interview" (Tara conducts live)
   - Priority 2-3 lenders = "Self-Recorded OR Live" (decide with broker)

3. Share this spreadsheet with the project lead

### Step 4: Count Total Recordings Needed
- Count rows where Nwabisa = ✅ (she'll do this many)
- Count rows where Dextter = ✅ (he'll do this many)
- **Count Priority 1 lenders** (must be live interviews - schedule first)
- Send totals to project lead

**Example:**
```
Nwabisa checked 55 lenders = 55 recordings
  - Priority 1 (strong relationships): 10 lenders → LIVE INTERVIEWS FIRST
  - Priority 2-3: 45 lenders → Self-recorded OR live

Dextter checked 70 lenders = 70 recordings
  - Priority 1 (strong relationships): 12 lenders → LIVE INTERVIEWS FIRST
  - Priority 2-3: 58 lenders → Self-recorded OR live

Overlap: 40 lenders (both will record separately)
Total unique lenders: 85 lenders
Priority 1 live interviews to schedule: 22 total (10 + 12)
```

---

## TASK 4: Create Phase 1 Google Form (Contact Details)

**Purpose:** Capture BDM contact details and numeric ratings for each lender

**Time:** 20 minutes (you'll reuse this template for all lenders)

### Step-by-Step Instructions

#### Step 1: Create New Google Form
1. Go to [forms.google.com](https://forms.google.com)
2. Click **+ Blank form**
3. Title: `Lender Contact Details - [LENDER NAME]`
   - You'll create ONE template, then duplicate it for each lender

#### Step 2: Form Settings
1. Click **Settings** (gear icon)
2. **General tab:**
   - ✅ Collect email addresses
   - ✅ Limit to 1 response per person
3. **Presentation tab:**
   - Confirmation message: `✅ Submitted! You can edit this form anytime if details change.`

#### Step 3: Add Questions (COPY THIS EXACT STRUCTURE)

**Section 1: Your Info**

**Q1:** Which broker are you?
- Type: **Multiple choice**
- Options: Nwabisa | Dextter
- Required: Yes

---

**Section 2: Lender Experience**

**Q2:** How long have you been working with [LENDER NAME]?
- Type: **Multiple choice**
- Options:
  - Less than 6 months
  - 6-12 months
  - 1-2 years
  - 2-5 years
  - 5+ years
- Required: Yes

**Q3:** How many cases have you placed with them in the last 12 months?
- Type: **Multiple choice**
- Options:
  - 0-5 cases
  - 6-10 cases
  - 11-20 cases
  - 21-50 cases
  - 50+ cases
- Required: Yes

---

**Section 3: BDM & Contact Details**

**Q4:** Main BDM Contact Name
- Type: **Short answer**
- Required: Yes

**Q5:** BDM Phone Number
- Type: **Short answer**
- Validation: None (phone formats vary)
- Required: No

**Q6:** BDM Email Address
- Type: **Short answer**
- Validation: Email
- Required: No

**Q7:** How responsive is the BDM/underwriting team? (1-10 scale)
- Type: **Linear scale**
- Scale: 1 (Very slow) to 10 (Very responsive)
- Required: Yes

---

**Section 4: Processing Times**

**Q8:** Current REAL turnaround time from submission to mortgage offer
- Type: **Multiple choice**
- Options:
  - 1-3 days
  - 4-7 days
  - 8-14 days
  - 15-21 days
  - 21+ days
  - Varies significantly
- Required: Yes

**Q9:** Typical valuation turnaround time
- Type: **Multiple choice**
- Options:
  - 1-3 days
  - 4-7 days
  - 8-14 days
  - 14+ days
  - Varies significantly
- Required: Yes

**Q10:** Are their Mortgage in Principle (MIP) decisions instant or manual?
- Type: **Multiple choice**
- Options:
  - Instant (automated)
  - Manual review (under 24 hours)
  - Manual review (1-3 days)
  - Don't bother with MIPs for this lender
- Required: Yes

**Q11:** How would you rate their broker portal? (1-10 scale)
- Type: **Linear scale**
- Scale: 1 (Terrible) to 10 (Excellent)
- Required: Yes

---

**Section 5: Competitive Positioning**

**Q12:** What type of case is this lender PERFECT for?
- Type: **Paragraph**
- Helper text: e.g., "Best for self-employed with 1 year accounts", "Go-to for flats above shops"
- Required: Yes

**Q13:** When would you AVOID using them, even if they fit criteria?
- Type: **Paragraph**
- Helper text: e.g., "If client needs speed", "If case has ANY complexity"
- Required: Yes

**Q14:** Who is their closest competitor, and how do they differ?
- Type: **Paragraph**
- Helper text: e.g., "Similar to Lender X but faster"
- Required: No

---

**Section 6: Quick Rating**

**Q15:** On a scale of 1-10, how likely are you to use them again?
- Type: **Linear scale**
- Scale: 1 (Never again) to 10 (Always my first choice)
- Required: Yes

---

#### Step 4: Save as Template
1. Click **More** (3 dots) > **Make a copy**
2. Save this as your TEMPLATE
3. You'll duplicate this for each lender

---

## TASK 5: Send Phase 1 Forms to Brokers

**Time:** 10 minutes (after you create all forms)

### How to Efficiently Create Multiple Forms

You need to create one form per lender (e.g., 55 forms for Nwabisa, 70 for Dextter).

**Efficient method:**

1. Open your TEMPLATE form
2. For each lender from your priority spreadsheet:
   - File > Make a copy
   - Rename: `Lender Contact Details - [LENDER NAME]`
   - Update form title (replace [LENDER NAME] placeholder in questions)
   - Get shareable link
   - Paste link into a spreadsheet (track which forms you've created)

**Shortcut:** Use Find & Replace
- After duplicating, press Ctrl+H (Find & Replace)
- Find: `[LENDER NAME]`
- Replace: `Barclays` (or whatever the actual lender is)
- This updates all instances at once

### Email Template for Brokers

**Subject:** Week 1 Task: Contact Detail Forms (5 mins each)

**Body:**
```
Hi [Nwabisa/Dextter],

Thanks for completing the familiarity checklist! You checked [X] lenders, so you'll complete [X] contact detail forms this week.

📋 TASK: Complete these forms (5 mins each, do them at your own pace)

HIGH PRIORITY (Your top 10 - do these first):
1. [Lender Name] - [Form link]
2. [Lender Name] - [Form link]
...

MEDIUM PRIORITY (Complete these next):
11. [Lender Name] - [Form link]
12. [Lender Name] - [Form link]
...

DEADLINE: Complete all forms by end of Week 1 (Friday)

TIP:
- Keep your contact list handy (you'll need BDM names/emails)
- You can edit responses later if details change
- Do 5-10 per day to avoid burnout

NEXT WEEK: You'll record Zoom clips (8-10 mins each) walking through tribal knowledge questions.

Questions? Let me know.

Thanks,
Tara
```

---

## TASK 6: Decide Interview Approach

**Time:** 15 minutes

**When:** After Phase 1 forms are complete

### MANDATORY: Priority 1 Lenders MUST Be Live Interviews

**From your priority spreadsheet (Task 3):**
- All **Priority 1** lenders (strong relationships, top 10) → **MUST be live interviews**
- Why? These are the most important lenders - you want best quality insights

**For remaining lenders (Priority 2-3), you have options:**

#### OPTION A: Self-Recorded Zoom Clips (Brokers work independently)
- **Pro:** Brokers work at their own pace, no scheduling needed
- **Con:** You need to QA first few recordings to ensure quality
- **Your time:** ~3-4 hours total (setup + QA)
- **Best for:** If brokers are comfortable recording themselves

#### OPTION B: Live Interviews (You conduct them on Zoom)
- **Pro:** You control quality, can probe for details, get better answers
- **Con:** Requires scheduling 50-70 sessions with brokers
- **Your time:** ~15-20 hours total (conducting interviews)
- **Best for:** If you want consistent quality and deeper insights

#### OPTION C: Hybrid (RECOMMENDED)
- **Priority 1 lenders (strong relationships):** You conduct live interviews
- **Priority 2-3 lenders (remaining):** Brokers self-record
- **Your time:** ~8-10 hours total

### How to Decide

**Step 1: Schedule Priority 1 live interviews FIRST** (mandatory)

**Step 2: Ask the brokers about remaining lenders:**
```
"For your Priority 1 lenders (top 10), I'll schedule live interviews with you.

For the remaining lenders, would you prefer to record Zoom clips yourself (talking through the questions at your own pace), or should I schedule live interviews for those as well?"
```

**If they prefer self-recording (Priority 2-3 only):** Follow Tasks 7-8 below (self-recorded approach)
**If they prefer all live interviews:** Skip to "Live Interview Approach" section below

---

## TASK 7: Set Up Recording Folder Structure

**Time:** 10 minutes

**Applies to:** Both self-recorded AND live interview approaches

### Step 1: Create Shared Drive Folder
1. Create a new folder in your shared drive: `Lender Knowledge Capture - Zoom Recordings`
2. Inside, create subfolders:
   ```
   📁 Lender Knowledge Capture - Zoom Recordings
      📁 Nwabisa
         📁 Completed
         📁 Needs Review
      📁 Dextter
         📁 Completed
         📁 Needs Review
   ```

### Step 2: Set Permissions
- Share folder with Nwabisa & Dextter (Editor access)
- Share folder with project lead (Viewer access)

### Step 3: Create Naming Convention Document
Create a simple Google Doc: `Zoom Recording Naming Convention`

**Content:**
```
NAMING CONVENTION FOR ZOOM CLIPS

Format: [Broker]_[LenderName]_[Date].mp4

Examples:
- Nwabisa_Barclays_2026-01-25.mp4
- Dextter_HSBC_2026-01-26.mp4

RULES:
✅ No spaces in lender name (use underscores or CamelCase)
✅ Always include date
✅ Always include your name

UPLOAD TO:
- Your folder (Nwabisa or Dextter)
- Move to "Completed" subfolder after upload

FILE SIZE:
- If file is >100MB, compress before uploading
- Use Zoom's built-in compression (should be ~20-50MB per 10-min clip)
```

Share this doc with brokers.

---

## TASK 8A: Self-Recorded Approach - Send Instructions

**Time:** 10 minutes

**Use this if:** Brokers are recording themselves

### Email Template

**Subject:** Week 2 Task: Zoom Clip Recordings (8-10 mins each)

**Body:**
```
Hi [Nwabisa/Dextter],

Week 2 task: Record Zoom clips for each lender where you walk through 33 tribal knowledge questions.

📹 WHAT TO RECORD:
- You talking through the questions in LENDER_INTERVIEW_SCRIPT_STREAMLINED.md
- NO ONE else needs to be on the call - just you recording yourself
- 8-10 minutes per lender
- Reference your contact detail form responses as needed

📋 SCRIPT TO FOLLOW:
[Attach LENDER_INTERVIEW_SCRIPT_STREAMLINED.md]

🎬 HOW TO RECORD:

1. Open Zoom
2. Click "New Meeting"
3. Click "Record" (record to local computer, NOT cloud)
4. Open the script document (so you can read Q1-Q33)
5. Say the lender name, then walk through questions:
   - "Q1: Preferred contact method? Phone."
   - "Q2: What annoys them? They hate incomplete docs..."
   - [Continue through Q33]
6. Click "End Meeting" when done
7. Zoom will auto-save the recording to your computer
8. Upload to shared drive folder: [Link]

📛 FILE NAMING:
[Broker]_[LenderName]_[Date].mp4
Example: Nwabisa_Barclays_2026-01-25.mp4

⚠️ IMPORTANT - FIRST 3 RECORDINGS:
Record 3 lenders first, then STOP.
I'll review them to make sure you're giving enough detail.
Once approved, continue with the rest.

Priority order (do these 3 first):
1. [Top lender from their list]
2. [Second top lender]
3. [Third top lender]

TIPS:
- Don't overthink it - just talk naturally
- If you mess up, pause and re-record that section (no need to start over)
- Reference your contact form if you forget details
- War stories section (Q26-29) is most important - give examples

DEADLINE:
- First 3 recordings: By Wednesday (I'll review Thu/Fri)
- Remaining recordings: By end of Week 2

Questions? Let me know.

Thanks,
Tara
```

---

## TASK 8B: Self-Recorded Approach - QA First 3

**Time:** 30 minutes per broker (1 hour total)

**Use this if:** Brokers are recording themselves

**When:** After each broker submits their first 3 recordings

### QA Checklist (Watch Each Recording)

For each recording, check:

✅ **Audio quality:** Can you hear them clearly?
✅ **Completeness:** Did they answer all 33 questions?
✅ **Detail level:** Are they giving specific examples/numbers, or just saying "they're fine"?
✅ **War stories:** Did they tell actual stories in Q26-29, or skip them?
✅ **Length:** Is it 8-10 mins, or are they rushing through in 3 mins?

### Feedback Categories

**PASS (Approve to continue):**
- All questions answered
- Sufficient detail (gives numbers, thresholds, examples)
- War stories included
- 8-10 min length

**NEEDS IMPROVEMENT (Give feedback):**
- Too vague (e.g., "they're OK" without specifics)
- Skipping war stories
- Rushing through (5 mins or less)
- Missing questions

### Feedback Email Template (if improvements needed)

**Subject:** Zoom Recording Feedback - Please Re-record First 3

**Body:**
```
Hi [Broker],

I've reviewed your first 3 recordings. Great start, but I need you to re-record them with a bit more detail before continuing.

WHAT TO IMPROVE:

❌ Issue: Answers too vague
✅ Fix: Give specific numbers/thresholds
Example: Instead of "they're OK with adverse credit", say "Max 2 CCJs, under £500 each, older than 3 years"

❌ Issue: War stories section too brief
✅ Fix: Tell actual case stories (1-2 mins for Q26-29)
Example: "Best case story - we had a self-employed client with only 1 year trading, but strong accountant letter. They approved because..."

❌ Issue: Recording too short (5 mins)
✅ Fix: Aim for 8-10 mins. Don't rush - give context.

NEXT STEPS:
- Re-record the first 3 lenders with more detail
- Send me the updated recordings
- Once approved, continue with remaining lenders

Questions? Let me know. This is just about getting the right level of detail - you're on the right track!

Thanks,
Tara
```

### Approval Email Template

**Subject:** ✅ Recordings Approved - Continue with Remaining Lenders

**Body:**
```
Hi [Broker],

Perfect! Your first 3 recordings are exactly what we need.

✅ You're approved to continue with the remaining [X] lenders.

Keep doing what you're doing:
- Same level of detail
- War stories with examples
- 8-10 mins per lender

Upload to the same shared folder as you go. No need to wait for me to review each one.

Target: Complete all recordings by end of Week 2 (Friday).

Thanks,
Tara
```

---

---

## TASK 8C: Live Interview Approach - Conduct Interviews

**Time:** 10-15 minutes per lender interview

**Use this if:** You're conducting live interviews with brokers

### Scheduling Strategy

**PRIORITY ORDER (CRITICAL):**
1. **Priority 1 lenders FIRST** (strong relationships, top 10)
   - These MUST be live interviews
   - Schedule these before anything else
   - Best quality insights come from these

2. **Priority 2-3 lenders** (if doing live interviews for these too)
   - Schedule after Priority 1 is complete

**Don't schedule all 50-70 interviews upfront.** Use a rolling schedule:

1. **Week 1:** Schedule Priority 1 interviews first
   - Focus on their top 10 lenders (strong relationships)
   - Book 1-hour blocks (allows 3-4 interviews back-to-back with breaks)
   - Example: If Nwabisa has 10 Priority 1 lenders, schedule these first

2. **After Priority 1 complete:** Review quality, adjust approach if needed

3. **Week 2:** Schedule Priority 2-3 interviews (if doing live for these)
   - Aim for 5-10 lenders per day
   - Back-to-back sessions work well once you hit your rhythm

### Live Interview Process

1. **Before interview:**
   - Review broker's contact form for this lender
   - Open lender's website criteria page
   - Have Notion template ready for note-taking (or just take rough notes)

2. **During interview:**
   - Start Zoom recording (cloud or local)
   - Say lender name at start
   - Walk through Q1-Q33 from LENDER_INTERVIEW_SCRIPT_STREAMLINED.md
   - Let them elaborate on war stories (Q26-29) - this is the gold

3. **After interview:**
   - Stop recording
   - Zoom auto-generates transcript (cloud recording) OR you save recording locally
   - Move to next lender

### Zoom Transcript Setup (IMPORTANT)

**If using Zoom cloud recording:**
1. Enable auto-transcription in Zoom settings:
   - Go to zoom.us > Settings > Recording
   - ✅ Enable "Audio transcript"
   - This gives you both video + text transcript

**If using local recording:**
- Zoom saves recording to your computer
- No auto-transcript, but you can upload to Otter.ai or Rev.com later (optional)

### Interview Scheduling Email Template

**Subject:** PRIORITY 1 Lender Interviews - Week 1 Schedule

**Body:**
```
Hi [Nwabisa/Dextter],

I'm scheduling live interviews for your PRIORITY 1 lenders (your top 10 with strong relationships). These are the most important, so we're doing these first as live sessions.

WHY PRIORITY 1 FIRST?
These are the lenders you work with most and know best - we want the highest quality insights from these.

WEEK 1 SCHEDULE (Priority 1 Lenders Only):
[Date/Time] - [Lender 1] ⭐
[Date/Time] - [Lender 2] ⭐
[Date/Time] - [Lender 3] ⭐
...

Each session is ~10-15 mins. I've booked [X]-hour blocks so we can do 3-4 back-to-back with short breaks.

PREP NEEDED:
- Have your contact detail forms handy (in case you forget details)
- Think about your best/worst case stories for these lenders
- No other prep needed - I'll ask the questions, you answer

Zoom link: [Insert recurring meeting link]

WHAT'S NEXT:
After we complete Priority 1, we'll decide approach for remaining lenders (self-recorded clips OR more live interviews).

Let me know if you need to reschedule any slots.

Thanks,
Tara
```

### Tips for Live Interviews

**Efficiency tips:**
- Use a recurring Zoom link (same link for all sessions)
- Keep sessions tight (8-10 mins) - don't let them ramble
- If they say "I don't know," move on quickly
- War stories (Q26-29) - give them 2-3 mins to elaborate
- Take minimal notes during interview (transcripts will capture everything)

**Quality tips:**
- If answer is vague, ask: "Give me a specific number/example"
- If they skip a question, note it and come back at end
- Ensure audio quality is good (test in first session)

---

## TASK 9: Track Progress

**Time:** 5 minutes per day

**Applies to:** Both self-recorded AND live interview approaches

### Create Simple Tracking Spreadsheet

| Lender | Broker | Contact Form | Interview/Recording | Transcript Link | Status | Notes |
|--------|--------|--------------|---------------------|-----------------|--------|-------|
| Barclays | Nwabisa | ✅ | ✅ | [Link] | Complete | |
| HSBC | Nwabisa | ✅ | 🔄 | - | In Progress | Interview scheduled 26th |
| Santander | Dextter | ❌ | ❌ | - | Not Started | |
| [etc.] | | | | | | |

**Update daily:**
- Check Google Form responses (mark ✅ when submitted)
- Check shared drive folder OR Zoom recordings (mark ✅ when complete)
- **Add transcript link** (Zoom cloud recording link OR local file path)
- Status options: Not Started | In Progress | Complete | Needs Review

**Share this spreadsheet with project lead** (they can see progress at a glance and access transcript links)

### Send Weekly Progress Email

**Subject:** Lender Knowledge Capture - Week [1/2] Progress

**Body:**
```
Hi [Project Lead],

Progress update:

WEEK 1 (Contact Forms):
- Nwabisa: [X/55] forms completed ([%]%)
- Dextter: [X/70] forms completed ([%]%)

WEEK 2 (Zoom Recordings):
- Nwabisa: [X/55] recordings uploaded ([%]%)
- Dextter: [X/70] recordings uploaded ([%]%)

ON TRACK / BEHIND:
[Note if anyone is falling behind]

BLOCKERS:
[Note any issues]

NEXT STEPS:
[What's happening this week]

Full tracking spreadsheet: [Link]

Thanks,
Tara
```

---

## Common Issues & How to Handle Them

### Issue 1: Broker Doesn't Submit Forms on Time

**Solution:**
- Send reminder email on deadline day
- If still no response, escalate to project lead

**Reminder Email Template:**
```
Hi [Broker],

Just a reminder - [X] contact forms are due today (Friday).

I can see you've completed [X/Y] so far. Can you finish the remaining [Z] today?

If you're stuck or need help, let me know.

Thanks,
Tara
```

---

### Issue 2: Broker Submits Recording with Poor Audio

**Solution:**
- Ask them to re-record with better microphone or quieter environment

**Email Template:**
```
Hi [Broker],

I reviewed your recording for [Lender], but the audio quality is too low to transcribe clearly.

Can you re-record in a quieter space or with your microphone closer?

Thanks,
Tara
```

---

### Issue 3: Broker Says "I Don't Know" to Many Questions

**Solution:**
- This means they shouldn't have checked that lender in Phase 0
- Move lender to "Low Priority" in spreadsheet
- Focus their time on lenders they DO know

**Email Template:**
```
Hi [Broker],

I noticed you said "I don't know" to many questions for [Lender]. That's totally fine - it just means we should skip this one.

You don't need to complete the recording for this lender. Focus on the ones you know well.

I've updated the tracking spreadsheet.

Thanks,
Tara
```

---

### Issue 4: Form Link Broken or Not Working

**Solution:**
- Check form sharing settings (should be "Anyone with the link")
- Resend link
- If still broken, create new form and migrate responses

---

---

## TASK 10: Final Deliverable - Share Transcript Links

**Time:** 10 minutes

**When:** After all interviews/recordings are complete

### What to Deliver

Provide the project lead with:

1. **Tracking spreadsheet** with transcript links column filled in
2. **Access to shared folder** (if using local recordings)
3. **Zoom cloud recording links** (if using cloud recording)

### Email Template to Project Lead

**Subject:** Lender Knowledge Capture Complete - Transcript Links

**Body:**
```
Hi [Project Lead],

All lender interviews are complete. Here's what I'm handing over:

SUMMARY:
- Total lenders covered: [X]
- Nwabisa: [X] lenders
- Dextter: [X] lenders
- Interview format: [Self-recorded clips / Live interviews / Hybrid]

DELIVERABLES:
1. Tracking spreadsheet with transcript links: [Link to spreadsheet]
2. Recordings folder: [Link to shared drive folder]
3. Zoom cloud recordings: [Link to Zoom cloud folder, if applicable]

TRANSCRIPT FORMATS:
- [X] recordings have auto-generated Zoom transcripts (cloud recordings)
- [X] recordings are video-only (local recordings, no transcript)

NEXT STEPS:
You'll filter the transcripts and enter key insights into Notion.

Let me know if you need anything else!

Thanks,
Tara
```

---

## Handover Complete - What Happens Next?

Once all interviews/recordings are submitted:

1. **You're done!** You've delivered the transcript links.
2. Project lead will:
   - Review all recordings/transcripts
   - Filter key insights
   - Enter data into Notion database
   - Extract Base44 decision rules

3. You may be asked to:
   - Send reminder emails to brokers (if follow-ups needed)
   - Update tracking spreadsheet (as more lenders are added)
   - Conduct follow-up interviews (if gaps identified)

---

## Files You'll Need

All files are in the project folder:

- `LENDER_FAMILIARITY_CHECKLIST.md` - Full lender list + instructions
- `LENDER_PRE_INTERVIEW_FORM.md` - Contact details form structure
- `LENDER_INTERVIEW_SCRIPT_STREAMLINED.md` - Q1-Q33 script for recordings
- This handover document (you're reading it!)

---

## Timeline Summary

### If Self-Recorded Approach:

| Week | Task | Time |
|------|------|------|
| **Day 1** | Create Phase 0 forms + send to brokers | 1 hour |
| **Day 2** | Brokers complete Phase 0 (you wait) | - |
| **Day 3** | Review responses + create priority spreadsheet | 30 mins |
| **Day 3-4** | Create Phase 1 forms (contact details) | 2 hours |
| **Day 5** | Send Phase 1 forms to brokers | 15 mins |
| **Week 1** | Brokers complete contact forms (you wait) | - |
| **Day 8** | Decide approach + set up folder + send instructions | 30 mins |
| **Day 10** | QA first 3 recordings from each broker | 1 hour |
| **Day 11-14** | Brokers record remaining lenders (you track progress) | 5 mins/day |
| **Day 15** | Share transcript links with project lead | 10 mins |

**Your total time:** ~3-4 hours over 2 weeks

---

### If Live Interview Approach:

| Week | Task | Time |
|------|------|------|
| **Day 1** | Create Phase 0 forms + send to brokers | 1 hour |
| **Day 2** | Brokers complete Phase 0 (you wait) | - |
| **Day 3** | Review responses + create priority spreadsheet | 30 mins |
| **Day 3-4** | Create Phase 1 forms (contact details) | 2 hours |
| **Day 5** | Send Phase 1 forms to brokers | 15 mins |
| **Week 1** | Brokers complete contact forms (you wait) | - |
| **Day 8** | Decide approach + set up folder + schedule interviews | 1 hour |
| **Day 8-14** | Conduct live interviews (5-10 per day) | 10-15 hours total |
| **Day 15** | Share transcript links with project lead | 10 mins |

**Your total time:** ~15-20 hours over 2 weeks (mostly conducting interviews)

---

## Questions?

If you get stuck or have questions:
1. Check this handover doc first
2. Check the reference files (LENDER_FAMILIARITY_CHECKLIST.md, etc.)
3. Contact project lead

Good luck! This is a straightforward admin project - you've got this.

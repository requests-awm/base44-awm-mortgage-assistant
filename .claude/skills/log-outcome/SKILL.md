---
name: log-outcome
description: Log framework usage outcome for learning and improvement
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# Log Outcome Skill

Log the outcome of a framework usage session to improve future recommendations.

## Usage

```
/log-outcome                    # Interactive logging with auto-fill
/log-outcome --quick            # Quick success log with defaults
/log-outcome --failed           # Quick failure log
```

---

## When to Trigger

This skill should be invoked:
1. **At session end** - When wrapping up work on a task
2. **After framework completion** - When `/orchestrate`, GSD, or Ralph completes
3. **Manually** - User can call anytime to log an outcome

### Auto-Trigger Scenarios

Claude should proactively suggest `/log-outcome` when detecting:
- Phrases like "that's done", "finished", "completed", "wrapping up"
- Git tags indicating completion (`*-complete`)
- End of a multi-step task that used a framework approach
- Session ending after significant work

**Prompt:**
```
It looks like you've completed some work. Would you like to log this outcome
for future framework recommendations?

Run `/log-outcome` to log, or just continue.
```

---

## Workflow

### Step 1: Auto-Fill Context

Read current context to pre-fill:

```javascript
{
  "date": "[today's date]",
  "project": "[from CLAUDE.md or current directory]",
  "task": "[infer from recent conversation or ask]",
  "frameworkUsed": "[detect from conversation - orchestrator/gsd/ralph/manual]",
  "frameworkRecommended": "[check if /framework-select was run earlier]"
}
```

### Step 2: Quick Confirmation

Present auto-filled data and ask for result:

```markdown
## Log Framework Outcome

**Date:** 2026-01-21
**Project:** base44-mortgage
**Task:** [detected or ask user]
**Framework Used:** orchestrator

### Quick Result

How did it go?
[ ] Success - Task completed as expected
[ ] Partial - Completed with issues or workarounds
[ ] Failed - Did not complete, switched approach
[ ] Skip - Don't log this session
```

### Step 3: Optional Details (if not skipped)

If user selects Success/Partial/Failed:

```markdown
### Optional Details

**Notes:** (brief description of what happened)
> [user input or skip]

**Token Cost:** (approximate if known)
> [user input or "unknown"]

**Lessons Learned:** (what to do differently next time)
> [user input or skip]
```

### Step 4: Save to outcomes.json

Append entry to `C:\Users\Marko\.claude\frameworks\outcomes.json`:

```json
{
  "id": "outcome-[timestamp]",
  "date": "2026-01-21",
  "project": "base44-mortgage",
  "task": "Phase 1A webhook integration",
  "frameworkUsed": "orchestrator",
  "frameworkRecommended": "orchestrator",
  "followedRecommendation": true,
  "result": "success",
  "notes": "Completed webhook setup, n8n workflow designed",
  "tokenCost": "unknown",
  "lessonsLearned": "Break into smaller phases for clearer progress"
}
```

### Step 5: Confirmation

```markdown
Outcome logged successfully.

Summary:
- Project: base44-mortgage
- Task: Phase 1A webhook integration
- Result: success
- Framework: orchestrator

This data helps improve future framework recommendations.
```

---

## Quick Modes

### `/log-outcome --quick`

Skip prompts, log success with defaults:
- Result: success
- Auto-fill all fields
- Notes: "Completed successfully"
- Just confirm and save

### `/log-outcome --failed`

Quick failure log:
- Result: failed
- Prompt only for: What went wrong? What would you try next time?
- Save and suggest alternative framework for next attempt

---

## Framework Detection

Detect which framework was used by looking for:

| Framework | Detection Signals |
|-----------|-------------------|
| **Orchestrator** | `orchestration/` folder, `/orchestrate` in history, phase-based work |
| **GSD** | `.planning/` folder, `/gsd:` commands, PROJECT.md |
| **Ralph** | PROMPT.md loop, `prd.json`, iteration-based work |
| **Manual** | None of the above, ad-hoc development |

---

## Data Location

**Outcomes file:** `C:\Users\Marko\.claude\frameworks\outcomes.json`

Schema:
```json
{
  "version": "1.0",
  "outcomes": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "project": "string",
      "task": "string",
      "frameworkUsed": "orchestrator|gsd|ralph|manual",
      "frameworkRecommended": "string|null",
      "followedRecommendation": "boolean|null",
      "result": "success|partial|failed",
      "notes": "string",
      "tokenCost": "string|null",
      "lessonsLearned": "string|null"
    }
  ]
}
```

---

## Integration with /framework-select

When `/framework-select` runs, it can:
1. Check `outcomes.json` for past results
2. Weight recommendations based on what worked before
3. Warn if a framework previously failed for similar task types

Example insight:
```
Note: You used Ralph for a similar task last month and it worked well.
Consider using it again.
```

---

## Session-End Hook Behavior

When Claude detects session is ending (user says goodbye, long pause, explicit end):

1. Check if significant work was done this session
2. Check if a framework was used (orchestrator, GSD, Ralph, or manual approach)
3. If yes to both, suggest logging:

```
Before you go - would you like to log this session's outcome?
This helps improve future framework recommendations.

[/log-outcome] [Skip]
```

If user skips, don't persist. Move on gracefully.

---

## Privacy Note

Outcome data stays local in the frameworks folder. It's not sent anywhere.
Used only to improve future recommendations within this Claude Code environment.

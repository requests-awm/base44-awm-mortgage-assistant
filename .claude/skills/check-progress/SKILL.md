---
name: check-progress
description: Summarize current project progress from PROGRESS.md
allowed-tools: Read, Glob
---

# Check Progress Skill

Quickly summarize the current state of the mortgage integration project.

## What This Skill Does

1. **Reads PROGRESS.md** from project root
2. **Extracts key status info:**
   - Overall completion percentage
   - Current phase and status
   - Blockers and issues
   - Next actions
3. **Provides concise summary** to user

## Instructions

1. Read `PROGRESS.md` from project root
2. Extract and summarize:

### Status Summary Format

```
## Project Status Summary

**Overall:** X% Complete
**Current Phase:** [Phase name] - [Status]

### Phase Status
| Phase | Status | Progress |
|-------|--------|----------|
| 1A: Webhook | [status] | X% |
| 1B: UI | [status] | X% |
| ... | ... | ... |

### Current Blockers
- [List any items marked with [!] or "Blocked"]

### Next 3 Actions
1. [First priority action]
2. [Second priority action]
3. [Third priority action]

### Recent Session
- Date: [last session date]
- Focus: [what was worked on]
```

3. Highlight any urgent blockers or bugs
4. Suggest what to work on next based on dependencies

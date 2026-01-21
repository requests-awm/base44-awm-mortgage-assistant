---
name: orchestrate
description: Multi-phase project orchestration with sub-agents, validation, and progress tracking
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Task, TodoWrite, AskUserQuestion
---

# Orchestrate Skill

Execute structured, multi-phase project implementation with:
- Interactive requirements gathering (Q&A)
- Deep web research with synthesis
- Adaptive task planning
- Sub-agent task execution
- Validation checkpoints
- Triple progress tracking (JSON + Markdown + Git)

## Syntax

```
/orchestrate [project-name]           # Start new orchestration
/orchestrate status                   # Show current progress
/orchestrate pause                    # Checkpoint and pause
/orchestrate resume                   # Resume from checkpoint
/orchestrate abort                    # Abort with cleanup
```

## Quick Start

When user runs `/orchestrate [project-name]`:

1. Create project structure from templates
2. Start Phase 1: Research & Discovery
3. Proceed through phases automatically (if validations pass)
4. Track progress via JSON + Markdown + Git

---

## Orchestration Flow

### Phase 1: Research & Discovery

**Goal:** Understand requirements and gather external knowledge

1. **Interactive Q&A** (6-10 questions per round)
   - Use `AskUserQuestion` tool for multi-choice questions
   - Continue rounds until requirements are clear
   - Capture BOTH verbatim answers AND synthesized requirements

2. **Deep Research** (web search primary)
   - Use `WebSearch` and `WebFetch` for external information
   - Save raw findings to `research-raw.md`
   - Save synthesized insights to `research-synthesized.md`
   - Document all sources with URLs

3. **Output Files:**
   ```
   orchestration/01-research-discovery/
   ├── phase-spec.md
   ├── qa-log-raw.md
   ├── qa-synthesized.md
   ├── research-raw.md
   └── research-synthesized.md
   ```

4. **Git:**
   ```bash
   git checkout -b orchestrate/01-research-discovery
   git tag phase-01-start
   # ... after completion ...
   git tag phase-01-complete
   ```

### Phase 2: Planning

**Goal:** Create execution plan with task breakdown

1. **Analyze** Q&A synthesis and research insights
2. **Identify** dependencies between tasks
3. **Break down** into phases and sub-tasks (max 2 levels)
4. **Determine** which tasks can run in parallel
5. **Estimate** complexity for each task

6. **Output Files:**
   ```
   orchestration/02-planning/
   ├── phase-spec.md
   ├── execution-plan.md
   └── 02-01-task-breakdown/
       ├── task-spec.md
       └── output.md
   ```

7. **Create Task Specs** for Phase 3:
   - One `task-spec.md` per implementation task
   - Include: objective, inputs, outputs, validation method
   - Mark dependencies clearly

### Phase 3: Implementation

**Goal:** Execute the planned tasks

1. **For each task:**
   - Check dependencies (all required tasks must be complete)
   - Deploy sub-agent if parallelizable (see Sub-Agent section)
   - Execute task
   - Run validation
   - Handle errors with self-annealing (3 retries)
   - Commit and tag on success

2. **Parallel Execution:**
   - Launch independent tasks in parallel using `Task` tool
   - Wait for all parallel tasks before starting dependent tasks

3. **Output Structure:**
   ```
   orchestration/03-implementation/
   ├── phase-spec.md
   ├── 03-01-[feature-name]/
   │   ├── task-spec.md
   │   ├── output.md
   │   └── validation-result.md
   └── 03-02-[feature-name]/
       └── ...
   ```

### Phase 4: Validation

**Goal:** Verify everything works end-to-end

1. **Run integration tests** using available skills:
   - `/test-api` - For API-related work
   - `/validate-config` - For configuration
   - `/test-webhook` - For webhook flows

2. **Create final report:**
   - What was built
   - Known issues or limitations
   - Recommendations for next steps

3. **Output:**
   ```
   orchestration/04-validation/
   ├── phase-spec.md
   ├── 04-01-integration-test/
   │   ├── task-spec.md
   │   └── output.md
   └── final-report.md
   ```

---

## Sub-Agent Deployment

### When to Use Sub-Agents
- Task has no dependencies on concurrent work
- Task can be validated independently
- Task doesn't require interactive user input

### How to Deploy

Use the `Task` tool with this pattern:

```
Task: Execute orchestration task [TASK_ID]

Read the task specification at:
orchestration/[phase]/[task-folder]/task-spec.md

Execute the task exactly as specified:
1. Read all input files listed in the spec
2. Perform the required work
3. Write output to the specified location
4. Run validation if specified
5. Report completion status

IMPORTANT:
- Do NOT access files outside those listed in the task spec
- If you encounter ANY ambiguity, STOP immediately
- Create an ambiguity report at: orchestration/ambiguity-reports/[timestamp]-[task-id].md
- You have 3 attempts maximum for retry on failure
```

### Sub-Agent Context
Sub-agents receive ONLY:
- Their specific `task-spec.md`
- Files explicitly listed in the task spec
- Project `CLAUDE.md` for constraints

Sub-agents do NOT receive:
- Full project context
- Other task specifications
- Conversation history

---

## Progress Tracking

### Triple Tracking System

1. **JSON Status** (`orchestration/status.json`):
   ```json
   {
     "orchestration": {
       "status": "in_progress",
       "currentPhase": "03-implementation",
       "currentTask": "03-02"
     },
     "phases": [...],
     "checkpoint": {...}
   }
   ```

2. **Markdown Checkboxes** (in `source-of-truth.md`):
   ```markdown
   ### Phases
   | Phase | Status | Progress |
   |-------|--------|----------|
   | 01 | completed | 2/2 |
   | 02 | completed | 1/1 |
   | 03 | in_progress | 1/3 |
   ```

3. **Git Tags**:
   - `phase-01-start`
   - `task-01-01-complete`
   - `phase-01-complete`
   - `checkpoint-20260121-1430`

### Updating Progress

After EACH task completion:
1. Update `status.json` task entry
2. Update markdown checkboxes
3. Git commit with message: `[TASK_ID] complete: [description]`
4. Git tag: `task-[TASK_ID]-complete`

---

## Error Handling

### Self-Annealing Retry (3 Attempts)

When a task fails:

1. **Attempt 1:** Execute task normally
2. **On failure:** Log error, analyze cause
3. **Attempt 2:** Fix identified issue, retry
4. **On failure:** Log error, try different approach
5. **Attempt 3:** Apply alternative strategy
6. **On failure:** Create ambiguity report, mark task as `blocked`

### Ambiguity Handling

When sub-agent or main agent encounters ambiguity:

1. **STOP** immediately - do not guess
2. **Create report** at `orchestration/ambiguity-reports/[timestamp]-[task-id].md`
3. **Include:**
   - What was ambiguous
   - Options considered
   - Information needed to resolve
4. **Update** task status to `blocked` in status.json
5. **Report** to user with suggested questions

---

## Git Workflow

### Branch Naming
```
orchestrate/[phase-id]-[phase-name-slug]
```
Examples:
- `orchestrate/01-research-discovery`
- `orchestrate/02-planning`
- `orchestrate/03-implementation`

### Commit Message Format
```
[TASK_ID] [verb]: [description]

- [Detail 1]
- [Detail 2]

Validation: PASSED|FAILED|SKIPPED
Attempt: N/3

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Tag Format
| Event | Tag | Example |
|-------|-----|---------|
| Phase start | `phase-[XX]-start` | `phase-01-start` |
| Task complete | `task-[XX-YY]-complete` | `task-01-01-complete` |
| Phase complete | `phase-[XX]-complete` | `phase-01-complete` |
| Checkpoint | `checkpoint-[timestamp]` | `checkpoint-20260121-1430` |
| Final | `orchestrate-complete` | `orchestrate-complete` |

### Phase Transitions
```bash
# Complete current phase
git tag phase-01-complete
git checkout main
git merge orchestrate/01-research-discovery

# Start next phase
git checkout -b orchestrate/02-planning
git tag phase-02-start
```

---

## Auto-Advance Rules

Automatically advance to next phase when:
- [ ] All tasks in current phase are `completed`
- [ ] All validations passed
- [ ] No `blocked` tasks (no unresolved ambiguity reports)

If ANY condition fails: **STOP** and report status to user.

---

## Checkpoint & Resume

### Creating Checkpoints

After every task completion, save checkpoint:

```json
{
  "checkpoint": {
    "lastSaved": "2026-01-21T14:30:00Z",
    "gitCommit": "abc123",
    "gitBranch": "orchestrate/03-implementation",
    "gitTag": "task-03-01-complete",
    "resumeAction": "Start task 03-02: [description]"
  }
}
```

### Resume Protocol

When `/orchestrate resume` is called:

1. Read `orchestration/status.json`
2. Verify git state matches checkpoint:
   ```bash
   git log --oneline -1
   git describe --tags
   ```
3. If state matches: Continue from `resumeAction`
4. If state diverges: Warn user, ask how to proceed

---

## Verbosity Settings

**Default: Minimal**

Report only:
- Phase/task start
- Phase/task completion
- Errors and retries
- Final summary

Do NOT report:
- Intermediate steps within a task
- File read/write operations
- Internal decision-making

---

## Templates Location

Global templates at: `C:\Users\Marko\.claude\orchestration-templates\`

Copy and populate templates when creating orchestration structure.

---

## Command Reference

### `/orchestrate [project-name]`

Start new orchestration:
1. Create `orchestration/` folder structure
2. Initialize `status.json` from template
3. Create `source-of-truth.md`
4. Create git branch `orchestrate/01-research-discovery`
5. Begin Phase 1 Q&A

### `/orchestrate status`

Display current progress:
- Current phase and task
- Completed vs total tasks
- Any blocked items
- Last checkpoint info

### `/orchestrate pause`

Pause orchestration:
1. Complete current task (if possible)
2. Save checkpoint to status.json
3. Create git tag `checkpoint-[timestamp]`
4. Display resume instructions

### `/orchestrate resume`

Resume from checkpoint:
1. Read checkpoint from status.json
2. Verify git state
3. Display resume action
4. Continue execution

### `/orchestrate abort`

Abort orchestration:
1. Save current state
2. Create abort tag
3. Document what was completed
4. Return to main branch

---

## Integration with Existing Skills

The orchestration system uses these project skills for validation:

| Skill | When Used |
|-------|-----------|
| `/test-api` | After API implementation tasks |
| `/validate-config` | After configuration changes |
| `/test-webhook` | After webhook-related tasks |
| `/check-progress` | To summarize overall project status |

---

## Metrics Tracking

Track in `status.json`:

```json
{
  "metrics": {
    "totalEstimatedHours": 10,
    "totalActualHours": 4.5,
    "totalTasks": 12,
    "completedTasks": 7,
    "failedTasks": 0,
    "retryCount": 1,
    "ambiguityReports": 0
  }
}
```

Update after each task with actual time spent.
Calculate variance for future estimation improvement.

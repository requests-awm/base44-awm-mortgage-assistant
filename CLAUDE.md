# Base44 + n8n + Asana Mortgage Integration

## Project Overview
Automated mortgage triage system for Ascot Wealth Management.
- **Goal:** Reduce case processing from 30 min to 7 min (77% reduction)
- **Architecture:** Asana → n8n → Base44 → Asana (comment)

## Current Phase
- **Phase 1A:** n8n webhook integration (IN PROGRESS)
- **Phase 1B:** Intake form bug fix (case activation not persisting)
- **Blocker:** n8n Cloud not yet set up

## Key Reference Values

### Asana
- TEST Project GID: `1212782871770137`
- PRODUCTION Project GID: `1204991703151113`
- Stage 6 Section GID (TEST): `1212791395605236`
- Operations PAT: `2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c`

### Base44
- App ID: `695d6a9a166167143c3f74bb`
- API Key: `3ceb0486ed434a999e612290fe6d9482`
- Endpoint: `https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n`

### Custom Field GIDs
- Client Name: `1202694315710867`
- Client Email: `1202694285232176`
- Insightly ID: `1202693938754570`
- Broker Appointed: `1211493772039109`
- Internal Introducer: `1212556552447200`

## Important Files
- **Progress Tracker:** PROGRESS.md
- **n8n Build Guide:** n8n/N8N_WORKFLOW_BUILD_INSTRUCTIONS.md
- **n8n Setup:** n8n/N8N_SETUP_GUIDE.md
- **Project Brief:** archive/PROJECT_BRIEF_AND_PRD.md
- **Agent Instructions:** archive/AGENTS.md

## Constraints (Base44 Quirks)
- No nested API paths (`/asana/webhook` fails, use `/asanaWebhook`)
- No `localStorage` - use React state
- LTV values: Only 60/75/85/95% (others break)
- Direct commands only ("Create..." not "Can you create...")

## Constraints (FCA Compliance)
- Human approval required before ALL client emails
- System provides information, NOT regulated financial advice
- 24-hour default delay for email sending
- Clear disclaimers on all outputs

## Common Commands

### Test Base44 Endpoint
```powershell
$body = @{ asana_task_gid = "TEST-123"; client_name = "Test" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://awm-mortgage-assistant-3c3f74bb.base44.app/api/apps/695d6a9a166167143c3f74bb/functions/createCaseFromN8n" -Method Post -Body $body -ContentType "application/json" -Headers @{ api_key = "3ceb0486ed434a999e612290fe6d9482" }
```

### List Asana Webhooks
```powershell
$headers = @{ "Authorization" = "Bearer 2/1205556174146758/1210879318362399:c3d8bd30240089d9cbf0c4227393169c" }
Invoke-RestMethod -Uri "https://app.asana.com/api/1.0/webhooks?workspace=1205556174146758" -Headers $headers
```

## MCP Servers

### Context7 - Up-to-Date Library Documentation

Context7 MCP dynamically injects up-to-date, version-specific documentation into Claude's context.

**Installation:**
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

**Usage:**
```
"use context7 for asana api"
"use context7 for base44"
"use context7 for n8n"
```

**Benefits:**
- No more outdated documentation
- Version-specific code examples
- Critical for Base44's undocumented quirks and API limitations

## Plugins

### Code-Simplifier - Anthropic's Internal Code Cleaner

Refactors code for clarity while preserving exact functionality. Uses Opus model.

**Installation:**
```bash
claude plugin install code-simplifier
```

**Usage:**
```
/plugin install code-simplifier
# Then in session:
"Simplify the n8n webhook handler code"
```

**Features:**
- 20-30% reduction in token usage
- Follows CLAUDE.md standards automatically
- Never changes functionality, only clarity

## Git Worktree - Parallel Agent Development

Git worktrees allow multiple agents to work on different branches simultaneously without conflicts.

### Commands

```bash
# Create worktree for new feature
git worktree add ../base44-n8n-integration feature/n8n-webhook

# Create worktree for parallel bug fix
git worktree add ../base44-intake-fix feature/intake-bug

# List all worktrees
git worktree list

# Remove when done
git worktree remove ../base44-n8n-integration
```

### Workflow

1. **Main worktree:** `c:\Claude Code CHats\` (main branch)
2. **Agent 2 worktree:** `c:\base44-n8n-integration\` (feature/n8n-webhook)
3. **Agent 3 worktree:** `c:\base44-intake-fix\` (feature/intake-bug)

All worktrees share the same `.git` directory - lightweight and synchronized.

### Use Cases

- One agent builds n8n webhook integration
- Another agent fixes intake form bug
- Third agent updates documentation
- All work in parallel without waiting or conflicts

## Custom Skills Available

| Skill | Purpose | Usage |
|-------|---------|-------|
| `/git` | Beginner-friendly git operations with safety | Git push, pull, branch, undo |
| `/research` | Background research agent, saves to Obsidian | `/research [topic] --deep` |
| `/test-api` | Test Base44 or Asana API endpoints | Debugging API issues |
| `/check-progress` | Summarize project status from PROGRESS.md | Quick status check |
| `/validate-config` | Validate all GIDs, API keys, endpoints | Setup verification |
| `/test-webhook` | End-to-end webhook flow test | After n8n is built |
| `/orchestrate` | Multi-phase project orchestration | Complex projects |
| `/framework-select` | Recommend best AI development framework | Before starting new work |
| `/log-outcome` | Log framework usage results for learning | After completing work |

## Temp/Scratch Folder

Use `temp/` folder for:
- Test files and experimental code
- API response logs (`temp/api_test_response.json`)
- Debug output (`temp/debug_log.txt`)
- Scratch scripts (`temp/scratch.ps1`)

**Note:** All files in temp/ are git-ignored.

## Session Naming Convention
Use `/rename` with format: `base44-[feature]-[date]`
Example: `/rename base44-n8n-webhook-jan21`

---

## Orchestration System

### Overview
This project supports automated orchestration via the `/orchestrate` command.
Orchestration provides structured project execution with:
- Interactive requirements gathering (Q&A rounds)
- Deep web research with raw + synthesized outputs
- Adaptive task planning and breakdown
- Parallel sub-agent execution where safe
- Triple progress tracking (JSON + Markdown + Git)
- Self-annealing error recovery (3 retries)
- Full resumability from checkpoints

### Triggering Orchestration
```
/orchestrate [project-name]    # Start new orchestration
/orchestrate status            # Show current progress
/orchestrate pause             # Checkpoint and pause
/orchestrate resume            # Resume from checkpoint
/orchestrate abort             # Abort with cleanup
```

### Orchestration Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 01 | Research & Discovery | Q&A + web research |
| 02 | Planning | Task breakdown and execution plan |
| 03 | Implementation | Execute tasks (parallel where safe) |
| 04 | Validation | Integration testing and final report |

### Orchestration Files

| File | Purpose |
|------|---------|
| `orchestration/source-of-truth.md` | Master document linking all artifacts |
| `orchestration/status.json` | Machine-readable progress tracking |
| `orchestration/decision-log.md` | All decisions with rationale |
| `orchestration/ambiguity-reports/` | Stop-and-document reports |

### Sub-Agent Behavior
- Sub-agents receive ONLY their task-spec.md (isolated context)
- Sub-agents STOP on ambiguity (create report, don't guess)
- Sub-agents have 3 retry attempts with self-annealing
- Sub-agents commit atomically after validation passes

### Git Strategy During Orchestration
- **Branches:** `orchestrate/[phase-id]-[phase-name]`
- **Tags:** `phase-XX-start`, `task-XX-YY-complete`, `phase-XX-complete`
- **Commits:** `[TASK_ID] [verb]: [description]`

### Validation Integration
Orchestration automatically uses existing skills:
- `/test-api` - After API-related tasks
- `/validate-config` - After configuration tasks
- `/test-webhook` - After webhook tasks

### Templates Location
Global templates: `C:\Users\Marko\.claude\orchestration-templates\`

### Resumability
Every task completion creates a checkpoint:
- Git commit and tag
- JSON status update
- Markdown checkbox update
- Resume instructions

Run `/orchestrate resume` to continue from last checkpoint.

---

## Framework Selector

### Overview
Use `/framework-select` to get recommendations on which AI development framework to use for a task.

### Available Frameworks

| Framework | Best For | Token Cost |
|-----------|----------|------------|
| **Orchestrator** | Complex multi-phase, compliance, research-intensive | Moderate |
| **GSD** | Greenfield projects, solo devs, MVPs | High |
| **Ralph** | Batch refactors, migrations, clear pass/fail | High |

### Commands

```
/framework-select              # Interactive analysis with questions
/framework-select --quick      # Quick recommendation from context
/framework-select --list       # List all frameworks
/framework-select --compare orchestrator ralph   # Compare two
```

### Decision Criteria

The selector evaluates tasks on 7 dimensions:
1. Task complexity (1-5)
2. Research needed (1-5)
3. Compliance required (1-5)
4. Human checkpoints (1-5)
5. Parallelizability (1-5)
6. Clear done criteria (1-5)
7. Greenfield vs brownfield (1-5)

### Adding New Frameworks

1. Research the framework
2. Create `{name}.md` in `C:\Users\Marko\.claude\frameworks\`
3. Add entry to `frameworks/index.json`
4. Framework is automatically included in recommendations

### Outcome Tracking

The selector tracks which frameworks are used and their results to improve future recommendations. Data stored in `frameworks/outcomes.json`.

### Logging Outcomes

After completing work, log the result to improve future recommendations:

```
/log-outcome              # Interactive logging with auto-fill
/log-outcome --quick      # Quick success log
/log-outcome --failed     # Quick failure log
```

**Auto-prompt at session end:** Claude will suggest `/log-outcome` when detecting session completion (phrases like "done", "finished", completion tags, etc.)

The outcome logger:
1. Auto-fills date, project, task from context
2. Asks for result (success/partial/failed)
3. Optionally captures notes and lessons learned
4. Saves to `frameworks/outcomes.json`

Historical outcomes improve future recommendations by weighting frameworks that worked well for similar tasks.

---

## Git Configuration

### Repository Strategy
This project uses **per-project repositories**:
- Each project folder is its own git repo
- Global Claude config (`~/.claude/`) is NOT tracked
- Clean separation allows easy sharing of individual projects

### Git Identity
```
Name: Marko
Email: the.wildfire.reviews@gmail.com
GitHub: WildfireReviews
```

### Auto-Initialization
Frameworks automatically initialize git when starting new work:
- `/orchestrate` - Checks for git repo, initializes if needed
- Creates `.gitignore` with best practices
- Makes initial commit before starting work

### Branch Strategy
| Context | Branch Pattern |
|---------|---------------|
| Main development | `main` |
| Features | `feature/[name]` |
| Orchestration phases | `orchestrate/[phase-id]-[name]` |

### Commit Co-authorship
All Claude-assisted commits include:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Session End Behaviors

When Claude detects session end signals (e.g., "done", "thanks", "that's all", "finished", closing phrases):

### Auto-Actions
1. **Sync to Obsidian** - Run Claude Vault to sync this session to `ObsidianVault/conversations/`
2. **Suggest /log-outcome** - If framework was used, prompt to log results

### Sync Command
```powershell
cd "C:\Users\Marko\Documents\ObsidianVault"
C:\Users\Marko\claude-vault\venv\Scripts\python.exe -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); from claude_vault.cli import app; app()" sync "C:\Users\Marko\.claude"
```

### Session End Detection
Trigger on phrases like:
- "done", "finished", "that's all", "thanks", "all good"
- "wrap up", "end session", "closing out"
- User explicitly closing or saying goodbye

### What Gets Synced
- Current session → `conversations/[date]-[title].md`
- Frontmatter includes: date, tags, message count, related sessions
- Research links are preserved via Obsidian backlinks

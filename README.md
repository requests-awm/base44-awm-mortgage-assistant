# Base44 + n8n + Asana Mortgage Integration

Automated mortgage triage system for Ascot Wealth Management.

## Goal

Reduce case processing time from 30 minutes to 7 minutes (77% reduction) through intelligent automation.

## Architecture

```
Asana (Task Created) → n8n (Webhook) → Base44 (AI Processing) → Asana (Comment)
```

## Quick Start

See [CLAUDE.md](CLAUDE.md) for:
- Project configuration and API keys
- Available skills and commands
- Current phase and progress

See [PROGRESS.md](PROGRESS.md) for:
- Detailed progress tracking
- Phase completion status

## Folder Structure

```
├── .claude/              # Claude Code skills and hooks
│   ├── hooks/            # Git auto-initialization
│   └── skills/           # Custom commands (/git, /orchestrate, etc.)
│
├── n8n/                  # n8n workflow configuration
│   ├── fixes/            # Webhook fix iterations
│   └── *.json            # Workflow definitions
│
├── prompts/              # Active phase prompts
├── archive/              # Historical docs and completed phases
├── orchestration/        # Orchestration system artifacts
└── temp/                 # Scratch space (gitignored)
```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `/git` | Beginner-friendly git operations |
| `/orchestrate` | Multi-phase project orchestration |
| `/framework-select` | Recommend AI development framework |
| `/test-api` | Test Base44 or Asana API endpoints |
| `/validate-config` | Validate configuration values |
| `/check-progress` | Summarize project status |

## Current Status

- **Phase 1A:** n8n webhook integration (IN PROGRESS)
- **Phase 1B:** Intake form bug fix
- **Blocker:** n8n Cloud not yet set up

## License

Private - Ascot Wealth Management

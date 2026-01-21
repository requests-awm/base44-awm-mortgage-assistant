# Git Auto-Initialization Hook

## Purpose
Automatically initialize git repositories when frameworks start new projects.

## Trigger Points
- `/orchestrate [project-name]` - Before phase 01 starts
- `/gsd:new-project` - At project initialization
- Manual: `/git-init` command

## Initialization Checklist

When triggered, perform these steps:

### 1. Check if Already a Git Repo
```bash
git rev-parse --git-dir 2>/dev/null
```
If exit code 0, repo exists - skip initialization.

### 2. Initialize Repository
```bash
git init
```

### 3. Create Standard .gitignore
Copy from template or create with:
- Node modules, virtual envs, build artifacts
- IDE settings (.vscode/, .idea/)
- Environment files (.env, .env.local)
- OS files (.DS_Store, Thumbs.db)
- Project-specific: temp/, *.log, orchestration/status.json (optional)

### 4. Create Initial Commit Structure
```bash
git add .gitignore CLAUDE.md README.md
git commit -m "Initial commit: project setup

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 5. Set Up Branch Strategy
- Main branch: `main` (default)
- Feature branches: `feature/[name]`
- Orchestration branches: `orchestrate/[phase-id]-[name]`

## Framework Integration

### /orchestrate Integration
Before Phase 01 begins:
1. Run git-init hook
2. Create branch `orchestrate/01-research-discovery`
3. Tag `orchestrate-start`

### GSD Integration
During `/gsd:new-project`:
1. Run git-init hook
2. First commit includes PROJECT.md
3. No special branching (simple linear history)

### Ralph Integration
Before loop starts:
1. Run git-init hook
2. Simple linear history with task commits

## Verification
After initialization, verify:
- [ ] `.git/` directory exists
- [ ] `.gitignore` exists and is valid
- [ ] At least one commit exists
- [ ] Correct branch name (`main`)

---
name: git
description: Beginner-friendly git operations with safety guardrails and clear explanations
allowed-tools: Bash, Read, AskUserQuestion
---

# Git Skill

A beginner-friendly git helper that guides users through common git operations with clear explanations and safety guardrails.

## Philosophy

This skill is designed for users who are new to git. Every operation:
1. **Explains what will happen** before executing
2. **Shows the actual commands** being run
3. **Prevents dangerous operations** by default
4. **Uses plain English** to describe git concepts

## Usage

```
/git push          # Stage, commit, and push changes
/git status        # Show what's changed (with explanation)
/git pull          # Pull remote changes safely
/git branch        # List/create/switch branches
/git remote        # Set up GitHub remote
/git undo          # Undo recent changes (with safety)
/git delete        # Remove files from git (explains local vs tracked)
/git history       # Show recent commits
/git help          # Show this help
```

---

## Pre-Flight Check

**ALWAYS run this check before any git operation:**

```bash
git rev-parse --git-dir 2>/dev/null
```

**If not a git repo, offer to initialize:**
```
This folder is not a git repository yet.

Would you like to initialize it?
[Yes, initialize git] [No, cancel]

If yes, run:
  git init
  git branch -M main
```

---

## Command Reference

### `/git push` - Stage, Commit, and Push

**What it does:** Saves your changes locally and uploads them to GitHub.

**Workflow:**

1. **Check current status:**
   ```bash
   git status --short
   ```

2. **If no changes:** Report "No changes to push."

3. **If changes exist, explain them:**
   ```
   ## Changes Detected

   **New files (untracked):**
   - file1.txt

   **Modified files:**
   - README.md

   **Deleted files:**
   - old-file.txt
   ```

4. **Ask for commit message using AskUserQuestion**

5. **Show what will happen:**
   ```
   ## About to run:

   1. git add .
      (Stage all changed files)

   2. git commit -m "[your message]"
      (Save to local history)

   3. git push origin [branch]
      (Upload to GitHub)
   ```

6. **Execute:**
   ```bash
   git add .
   git commit -m "[message]

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   git push origin HEAD
   ```

7. **Report result**

**Safety:**
- Never use `--force`
- Warn if pushing to main/master
- Check for sensitive files (.env, credentials)

---

### `/git status` - Show What's Changed

**What it does:** Shows all changes with beginner-friendly explanations.

**Workflow:**

1. Run:
   ```bash
   git status
   git diff --stat
   ```

2. Present in friendly format:
   ```
   ## Git Status

   **Current branch:** main
   **Tracking:** origin/main

   | Status | File | What This Means |
   |--------|------|-----------------|
   | Modified | README.md | You edited this file |
   | New | docs/guide.md | New file, not tracked yet |
   | Deleted | old.txt | File was deleted |

   ### Quick Stats
   - X files changed
   - +Y lines added
   - -Z lines removed

   ### What You Can Do
   - `/git push` - Save and upload these changes
   - `/git undo` - Discard changes to a file
   ```

---

### `/git pull` - Pull Remote Changes

**What it does:** Downloads changes from GitHub.

**Workflow:**

1. **Check for local changes:**
   ```bash
   git status --short
   ```

2. **If local changes exist, warn:**
   ```
   Warning: You have uncommitted local changes.

   Options:
   1. [Stash & Pull] - Temporarily save changes, pull, restore
   2. [Commit First] - Save changes with /git push, then pull
   3. [Cancel]
   ```

3. **If clean, show incoming changes:**
   ```bash
   git fetch origin
   git log HEAD..origin/main --oneline
   ```

4. **Execute:**
   ```bash
   git pull origin main
   ```

5. **Handle merge conflicts** if any:
   ```
   Conflict detected in: src/config.ts

   Git couldn't automatically merge because both you and someone
   else changed the same lines.

   What to do:
   1. Open the file
   2. Look for <<<<<<< and >>>>>>> markers
   3. Decide which version to keep
   4. Remove the markers
   5. Run /git push to save
   ```

---

### `/git branch` - Manage Branches

**Subcommands:**

```
/git branch                 # List all branches
/git branch [name]          # Create and switch to new branch
/git branch switch [name]   # Switch to existing branch
/git branch delete [name]   # Delete a branch (with safety)
```

**For list:**
```
## Your Branches

| Branch | Last Commit | Status |
|--------|-------------|--------|
| * main | 2 hours ago | Up to date |
| feature/dark-mode | 1 day ago | 3 commits ahead |

### What Branches Are

Branches are parallel versions of your code:
- Work on features without affecting main
- Merge back when ready
- Delete if it doesn't work out
```

**For create:**
```bash
git checkout -b [branch-name]
```

**For delete (with safety):**
- Check for unmerged commits
- Warn if not pushed to GitHub
- Require confirmation

---

### `/git remote` - Set Up GitHub

**Workflow:**

1. **Check current remotes:**
   ```bash
   git remote -v
   ```

2. **If remote exists:** Show connection info

3. **If no remote:**
   ```
   ## No Remote Found

   Your project isn't connected to GitHub yet.

   Steps:
   1. Go to github.com and create a new repository
   2. Copy the URL (https://github.com/username/repo.git)
   3. Enter the URL when prompted
   ```

4. **Add remote:**
   ```bash
   git remote add origin [URL]
   ```

5. **Test connection:**
   ```bash
   git ls-remote origin HEAD
   ```

6. **Push:**
   ```bash
   git push -u origin main
   ```

---

### `/git undo` - Undo Changes Safely

**Subcommands:**

```
/git undo                   # Interactive - show options
/git undo file [path]       # Discard changes to specific file
/git undo commit            # Undo last commit (keep changes)
/git undo all               # Discard ALL local changes (dangerous)
```

**For interactive:**
```
## Undo Options

1. **Undo changes to a specific file**
   Restores file to last commit. Your edits will be lost.

2. **Undo the last commit**
   Removes commit but keeps file changes.

3. **Discard ALL local changes**
   WARNING: Deletes all uncommitted work!

[1] [2] [3] [Cancel]
```

**For file:**
```bash
git checkout -- [path]
```

**For commit:**
```bash
git reset --soft HEAD~1
```

**For all (requires confirmation):**
```
Type "DISCARD ALL" to confirm:
```
Then:
```bash
git checkout -- .
git clean -fd
```

---

### `/git delete` - Remove Files from Git

**Educational intro:**
```
## Understanding Git Delete

Two different things you might want:

1. **Stop tracking** (keep file, remove from git)
   - File stays on your computer
   - Git stops watching it
   - Good for accidentally committed files

2. **Delete completely** (remove from computer AND git)
   - File is deleted
   - Deletion saved to history
```

**Options:**
```
1. [Stop Tracking] → git rm --cached [file]
2. [Delete Completely] → git rm [file]
```

**For sensitive files, offer to add to .gitignore**

---

### `/git history` - Show Recent Commits

**Workflow:**

```bash
git log --oneline -10 --decorate
```

**Output:**
```
## Commit History (Last 10)

| # | Commit | Author | When | Message |
|---|--------|--------|------|---------|
| 1 | abc1234 | Marko | 2h ago | Add dark mode |
| 2 | def5678 | Marko | Yesterday | Fix mobile layout |

### What This Shows

Each row is a "commit" - a snapshot of your project.
- **Commit**: Unique ID for this change
- **Author**: Who made it
- **When**: How long ago
- **Message**: What it was about
```

---

### `/git help` - Show Help

```
## Git Skill Help

| Command | What It Does |
|---------|--------------|
| `/git push` | Save and upload changes |
| `/git status` | See what files changed |
| `/git pull` | Download changes from GitHub |
| `/git branch` | Create or switch branches |
| `/git remote` | Connect to GitHub |
| `/git undo` | Safely undo changes |
| `/git delete` | Remove files from git |
| `/git history` | See past commits |

### Git Concepts

**Repository (Repo):** A project folder tracked by git
**Commit:** A saved snapshot of your changes
**Branch:** A parallel version of your code
**Remote:** A copy of your repo on GitHub
**Push:** Upload commits to GitHub
**Pull:** Download commits from GitHub
```

---

## Safety Guardrails

### Blocked Operations (Never Execute Without Override)

- `git push --force` / `git push -f`
- `git reset --hard HEAD~N` (more than 1 commit)
- `git clean -fd` (without explicit confirmation)
- `git branch -D` (force delete without merge check)

**When blocked:**
```
Safety Block: This command is dangerous.

You requested: git push --force

Why this is blocked:
- Force push overwrites history on GitHub
- Other people's work could be lost

What to do instead:
- If you need to fix a commit: /git undo commit
- If you need to sync: git pull first

To proceed anyway (NOT recommended):
Type "I understand the risks" to continue.
```

### Warning Operations (Require Confirmation)

- Pushing to main/master branch
- Deleting branches with unmerged commits
- Discarding all local changes
- Committing files that look like secrets

### Sensitive File Detection

Before any push, check for:
```bash
git diff --cached --name-only | grep -E "\.env|secret|password|credential|\.pem|\.key"
```

If found:
```
Warning: Potentially Sensitive Files

These files might contain secrets:
- .env

These should usually NOT be committed:
- Anyone who sees your repo can see your passwords
- Secrets in git history are hard to remove

[Remove from commit] [Add to .gitignore] [I understand, commit anyway]
```

---

## Git Identity

Uses existing global config:
```bash
git config user.name   # Marko
git config user.email  # the.wildfire.reviews@gmail.com
```

Displayed as:
```
Committing as: Marko <the.wildfire.reviews@gmail.com>
```

---

## Error Handling

| Error | Friendly Message |
|-------|------------------|
| `not a git repository` | "This folder isn't a git project. Run `/git` to initialize." |
| `failed to push some refs` | "GitHub has changes you don't have. Run `/git pull` first." |
| `CONFLICT` | "Git couldn't merge automatically. I'll help you resolve this." |
| `Permission denied` | "GitHub rejected the push. Check your access to this repository." |
| `remote origin already exists` | "Already connected to GitHub at: [URL]" |

---

## Integration

| Scenario | Action |
|----------|--------|
| Before `/orchestrate` | Check git status, ensure clean |
| After successful tests | Suggest `/git push` |
| Framework completion | Prompt for commit |

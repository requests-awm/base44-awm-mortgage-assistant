---
name: research
description: Spawn background research agent that saves findings to Obsidian vault
allowed-tools: Task, Read, Write, WebSearch, WebFetch, Glob, Grep
---

# Research Skill

Spawn a background research agent to investigate a topic while you continue working. Findings are saved to your Obsidian vault and optionally linked to project phases.

## Usage

```
/research [topic]                           # Quick research, save to Obsidian
/research [topic] --deep                    # Thorough multi-source research
/research [topic] --phase [phase-name]      # Link findings to project phase
/research [topic] --project [project-name]  # Associate with specific project
/research status                            # Check running research tasks
```

## Examples

```
/research supabase vs airtable for structured data
/research uk mortgage lender APIs --deep
/research n8n webhook best practices --phase 1A
/research base44 custom functions --project base44-mortgage
```

---

## How It Works

### 1. Parse Request
Extract from user input:
- **Topic**: What to research
- **Depth**: Quick (default) or deep
- **Phase**: Optional project phase to link
- **Project**: Optional project association

### 2. Launch Background Agent
Use the `Task` tool with `run_in_background: true`:

```
Task:
  description: "Research: [topic]"
  subagent_type: general-purpose
  run_in_background: true
  prompt: [See Research Agent Prompt below]
```

### 3. Research Agent Work
The agent will:
1. Read project context (CLAUDE.md, PROGRESS.md) if project specified
2. Perform web searches on the topic
3. Fetch and analyze relevant pages
4. Compile findings with sources
5. Save to Obsidian vault

### 4. Output Location
Research notes saved to:
```
C:\Users\Marko\Documents\ObsidianVault\Research\[date]-[topic-slug].md
```

If phase specified, also update:
```
C:\Users\Marko\Documents\ObsidianVault\Projects\[project-name].md
```

---

## Research Agent Prompt Template

When launching the background agent, use this prompt structure:

```markdown
## Background Research Task

You are a research agent. Research the topic thoroughly and save findings to Obsidian.

### Topic
[USER_TOPIC]

### Depth
[quick|deep]
- Quick: 3-5 sources, summary + key points, 5-10 min
- Deep: 8-12 sources, detailed analysis, alternatives, 15-30 min

### Project Context
[If specified, read these files first:]
- c:\Claude Code CHats\CLAUDE.md
- c:\Claude Code CHats\PROGRESS.md
- [Any phase-specific files]

### Research Requirements
1. Use WebSearch to find current information (use 2026 in date-sensitive queries)
2. Use WebFetch to read key pages in detail
3. Compare alternatives if applicable
4. Note pros/cons for our specific use case
5. Include source URLs

### Output Format
Create file at: C:\Users\Marko\Documents\ObsidianVault\Research\[date]-[topic-slug].md

Use this template:
---
date: [today]
topic: [topic]
project: [project if specified]
phase: [phase if specified]
session_id: [current session UUID from conversation]
session_link: "[[conversations/[matching-session-file]]]"
tags: [research, relevant-tags]
status: complete
---

# Research: [Topic]

## Context
- **Requested during:** [[conversations/[session-file-name]]]
- **Project:** [project name if specified]
- **Phase:** [phase if specified]

## Summary
[2-3 sentence overview]

## Key Findings

### Option 1: [Name]
- **What it is**:
- **Pros**:
- **Cons**:
- **Best for**:
- **Link**:

### Option 2: [Name]
[Same structure]

## Comparison Table
| Feature | Option 1 | Option 2 | Option 3 |
|---------|----------|----------|----------|
| ... | ... | ... | ... |

## Recommendation
[Which option and why, given our project context]

## Next Steps
- [ ] Action item 1
- [ ] Action item 2

## Sources
- [Title](URL)
- [Title](URL)

---
*Researched by Claude Agent on [date]*

### Phase Integration
[If phase specified:]
After creating research note, also:
1. Read the project file in Obsidian
2. Add a link to this research under the relevant phase section
3. Add any action items to that phase's tasks
```

---

## Checking Research Status

When user runs `/research status`:

1. Check for running background tasks
2. Read any recent research output files
3. Report:
   - Running: [topic] - started [time]
   - Completed: [topic] - saved to [path]

---

## Session Linking

Research notes must link back to the conversation that spawned them.

### How to Find the Session
1. Sessions are synced to `ObsidianVault/conversations/`
2. Today's sessions start with today's date: `2026-01-21-*`
3. Find the most recent session file matching today's date
4. Use Glob to find: `C:\Users\Marko\Documents\ObsidianVault\conversations\[today-date]-*.md`
5. Pick the most recently modified one

### Session Link Format
In the research note frontmatter:
```yaml
session_id: [UUID if known]
session_link: "[[2026-01-21-ide_opened_fileThe-user-opened...]]"
```

In the body, add a Context section:
```markdown
## Context
- **Requested during:** [[2026-01-21-ide_opened_fileThe-user-opened...]]
- **Why:** [Brief note on why this research was needed]
```

### Bi-directional Linking
After creating research, the conversation will be synced via Claude Vault.
The session note will contain references to the research topic.
Obsidian's backlinks will automatically show the connection.

---

## Integration with Projects

### Linking to Phases
When `--phase` is specified:
1. Research agent reads project's PROGRESS.md
2. Identifies the phase section
3. Adds research link to that phase
4. Creates action items if applicable

### Linking to Obsidian Projects
When `--project` is specified:
1. Find project in `ObsidianVault/Projects/[name].md`
2. Add research note to Related Research section
3. Update project's dataview queries to include new research

---

## File Naming Convention

Research files use this pattern:
```
[YYYY-MM-DD]-[topic-slug].md

Examples:
2026-01-21-Database-Options-Comparison.md
2026-01-21-UK-Lender-API-Research.md
2026-01-21-N8N-Webhook-Best-Practices.md
```

---

## Quick vs Deep Research

### Quick (default)
- 3-5 web searches
- Top 3-5 sources
- Summary + bullet points
- Basic pros/cons
- ~5-10 minutes

### Deep (--deep flag)
- 8-12 web searches
- 8-12 sources with detailed analysis
- Full comparison tables
- Implementation considerations
- Alternative approaches
- Risk assessment
- ~15-30 minutes

---

## Example Full Interaction

**User:**
```
/research supabase mcp server setup --phase lender-db --deep
```

**Claude responds:**
```
Research agent launched in background.

Topic: Supabase MCP server setup
Depth: Deep (thorough analysis)
Project phase: lender-db
Output: ObsidianVault/Research/2026-01-21-Supabase-MCP-Setup.md

I'll notify you when complete. Continue with your current work.
```

**[Later, agent completes]**

**Research note created with:**
- Installation steps
- Configuration options
- Claude integration guide
- Troubleshooting tips
- Links to official docs
- Linked to lender-db phase in project

---

## Error Handling

If research fails:
1. Create partial note with what was found
2. Mark status as `incomplete`
3. List what couldn't be researched
4. Suggest manual follow-up

---

## Obsidian Folder Structure

```
ObsidianVault/
├── Research/                    # All research notes
│   ├── 2026-01-21-Topic-A.md
│   └── 2026-01-21-Topic-B.md
├── Projects/                    # Project notes (link to research)
│   ├── Base44 Mortgage Integration.md
│   └── Lender Database System.md
└── conversations/               # Claude session syncs
```

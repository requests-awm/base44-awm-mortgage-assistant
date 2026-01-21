---
name: framework-select
description: Analyze tasks and recommend the best AI development framework based on project characteristics
allowed-tools: Read, AskUserQuestion, Write, Edit
---

# Framework Selector Skill

Analyze a task and recommend the best AI development framework from the knowledge base.

## Usage

```
/framework-select                    # Interactive analysis
/framework-select --quick            # Quick recommendation based on context
/framework-select --list             # List all available frameworks
/framework-select --compare [a] [b]  # Compare two frameworks
```

---

## Workflow

### Step 1: Gather Task Information

If context is unclear, ask the user about their task using these criteria:

1. **Task Complexity** (1-5)
   - 1 = Trivial single change
   - 3 = Moderate feature with multiple files
   - 5 = Complex multi-system integration

2. **Research Needed** (1-5)
   - 1 = None, requirements are clear
   - 3 = Some documentation review needed
   - 5 = Extensive web research required

3. **Compliance Required** (1-5)
   - 1 = None
   - 3 = Basic audit trail needed
   - 5 = Strict regulatory (FCA, HIPAA)

4. **Human Checkpoints** (1-5)
   - 1 = Walk away and check later
   - 3 = Review at phase boundaries
   - 5 = Approve every step

5. **Parallelizable** (1-5)
   - 1 = Strictly sequential
   - 3 = Some parallel opportunities
   - 5 = Highly parallelizable

6. **Clear Done Criteria** (1-5)
   - 1 = Fuzzy, subjective
   - 3 = Reasonably clear
   - 5 = Tests pass = done

7. **Greenfield** (1-5)
   - 1 = Legacy/brownfield code
   - 3 = Mix of new and existing
   - 5 = New project from scratch

### Step 2: Score Frameworks

Read `C:\Users\Marko\.claude\frameworks\index.json` to get framework criteria.

For each framework, calculate a match score:
```
score = sum(
  weight * (1 - abs(taskValue - frameworkIdeal) / 4)
) for each criterion
```

Where `frameworkIdeal = (min + max) / 2`

### Step 3: Present Recommendation

Display results in this format:

```markdown
## Framework Recommendation

### Recommended: [Framework Name]
**Match Score:** X.X/10
**Why:** [2-3 sentence explanation based on criteria match]

### Also Consider: [Second Best]
**Match Score:** X.X/10
**Why:** [Brief explanation]

### Not Recommended: [Worst Match]
**Why:** [Brief explanation of mismatch]

---

### Your Task Profile
| Criterion | Your Score | Best Framework Match |
|-----------|------------|---------------------|
| Complexity | X | [framework] |
| Research | X | [framework] |
| Compliance | X | [framework] |
| ...

---

### Quick Reference
- **[Framework 1]**: Best for [primary use case]
- **[Framework 2]**: Best for [primary use case]
- **[Framework 3]**: Best for [primary use case]
```

### Step 4: Offer to Log Selection

Ask if user wants to log this selection for future learning:

```
Would you like to log this recommendation?
This helps improve future suggestions.
[Yes] [No]
```

If yes, add entry to `C:\Users\Marko\.claude\frameworks\outcomes.json`:
```json
{
  "id": "outcome-[timestamp]",
  "date": "[today]",
  "project": "[current project]",
  "task": "[task description]",
  "frameworkRecommended": "[framework-id]",
  "frameworkUsed": null,
  "followedRecommendation": null,
  "result": null,
  "notes": ""
}
```

---

## Quick Mode (--quick)

When called with `--quick`, analyze the current context without asking questions:

1. Read recent conversation for task indicators
2. Check if CLAUDE.md mentions project type
3. Look for keywords:
   - "refactor", "migrate", "batch" → Suggest Ralph
   - "new project", "greenfield", "MVP" → Suggest GSD
   - "integration", "compliance", "research" → Suggest Orchestrator

4. Display brief recommendation:
```
Quick Recommendation: [Framework]
Reason: [One sentence]
Run `/framework-select` for detailed analysis.
```

---

## List Mode (--list)

Display all frameworks:

```markdown
## Available Frameworks

| Framework | Best For | Token Cost |
|-----------|----------|------------|
| Orchestrator | Complex multi-phase, compliance | Moderate |
| GSD | Greenfield, MVPs, spec-driven | High |
| Ralph | Batch refactors, migrations | High |

Run `/framework-select` for personalized recommendation.
```

---

## Compare Mode (--compare)

Compare two frameworks side-by-side:

```
/framework-select --compare orchestrator ralph
```

Output:
```markdown
## Framework Comparison: Orchestrator vs Ralph

| Aspect | Orchestrator | Ralph |
|--------|--------------|-------|
| Philosophy | Phased execution | Naive persistence |
| Token Cost | Moderate | High |
| Setup Time | Medium | Low |
| Human Oversight | High | Low |
| Best For | Compliance, research | Batch, migrations |

### When to Choose Orchestrator
[2-3 bullet points]

### When to Choose Ralph
[2-3 bullet points]
```

---

## Framework Knowledge Base

Location: `C:\Users\Marko\.claude\frameworks\`

| File | Purpose |
|------|---------|
| `index.json` | Criteria and metadata for all frameworks |
| `outcomes.json` | Historical usage tracking |
| `{name}.md` | Detailed documentation per framework |
| `README.md` | How to add new frameworks |

---

## Adding New Frameworks

When user researches a new framework:

1. Create `{framework-name}.md` in frameworks folder
2. Add entry to `index.json` with criteria scores
3. New framework is automatically included in recommendations

See `C:\Users\Marko\.claude\frameworks\README.md` for detailed guide.

---

## Auto-Suggest Triggers

This skill can be triggered automatically when detecting:

- `/orchestrate` command (suggest orchestrator or alternative)
- New PROJECT.md creation (suggest GSD or orchestrator)
- Keywords: "new feature", "refactor", "migrate", "compliance"
- Start of new conversation with project context

Auto-suggest displays brief recommendation without full analysis.

---

## Historical Learning Integration

### Check Past Outcomes

Before making a recommendation, read `outcomes.json` and analyze:

1. **Similar tasks** - Have we done something like this before?
2. **Framework success rates** - Which frameworks succeeded for similar work?
3. **Lessons learned** - Any insights to share?

### Enhance Recommendations with History

When historical data exists, add a section:

```markdown
### Historical Insights

**Similar Past Task:** "Phase 1A webhook integration" (2026-01-15)
- Framework used: Orchestrator
- Result: Success
- Lesson: "Break into smaller phases for clearer progress"

**Recommendation confidence:** High (based on 3 similar successful outcomes)
```

### Weight Adjustments

Adjust recommendation scores based on outcomes:
- **Success** with framework for similar task → +15% weight
- **Partial** success → +5% weight
- **Failure** with framework for similar task → -20% weight

---

## Outcome Logging Reminder

After completing work with a framework, remind user to log outcome:

```
Remember to run `/log-outcome` when you finish to track results.
This improves future recommendations.
```

Or the outcome can be logged automatically at session end via the `/log-outcome` skill.

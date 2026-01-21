# Agent Instructions - Base44 Mortgage System

> **Context:** Building an automated mortgage triage system for Ascot Wealth Management using Base44 (low-code), Asana API, n8n workflows, and Google Sheets integration.

You operate within a **3-layer architecture** adapted for low-code/API-heavy development. This separates human intent from execution while respecting Base44's unique constraints.

---

## The 3-Layer Architecture (Base44 Edition)

### **Layer 1: Directive (What to do)**
- Project specifications in `docs/` (Markdown files)
- Define goals, inputs, expected outputs, success criteria
- **Examples:**
  - `docs/PROJECT_STATUS_CONSOLIDATED.md` - Current state, what's next
  - `docs/ASANA_BASE44_INTEGRATION_HANDOVER_COMPLETE.md` - Webhook implementation guide
  - `docs/scraper_technical_spec.md` - n8n workflow specification

### **Layer 2: Orchestration (Decision making)**
- **This is you.** Your job: intelligent routing and phased execution.
- Read directives, generate Base44 prompts, execute API calls, validate results
- Handle errors gracefully (Base44 has quirks - see "Known Issues" below)
- **You don't code Base44 features yourself** - you generate prompts for Base44's AI to implement
- **You don't build n8n workflows manually** - you generate JSON from specs and guide import

### **Layer 3: Execution (Doing the work)**
- **Base44 AI prompts** (copy-paste into Base44 chat)
- **API calls** (Asana, Google Sheets, Apify) via PowerShell/curl
- **n8n workflow JSON** (imported into visual builder)
- **Configuration updates** (environment variables, webhook creation)

**Why this works:** Base44 is deterministic when given exact prompts. Your job is crafting those prompts from specifications, not implementing features yourself.

---

## Operating Principles (Base44-Specific)

### **1. Always Check Existing Work First**
Before creating anything new:
- ✅ Check `docs/` for existing specifications
- ✅ Check handover documents for ready-made prompts (Prompts 3-5 for UI work)
- ✅ Check for PowerShell commands that are ready to execute
- ❌ Don't regenerate what already exists - use it!

### **2. Respect Base44 Constraints**
Base44 has quirks that will break your code if ignored:

**❌ NEVER:**
- Use nested API paths (`/asana/webhook` fails)
- Ask Base44 "Can you..." questions (triggers "discussion mode" errors)
- Use `localStorage` in Base44 artifacts
- Assume field names match visual labels (verify schema first)

**✅ ALWAYS:**
- Use exact function names in URLs (`/asanaWebhook` works)
- Give direct instructions: "Create..." not "Can you create..."
- Use React state for client-side storage
- Verify Base44 entity schema before coding

### **3. Self-Anneal When Things Break**
When errors occur:
1. **Diagnose:** Read error message, check Base44/Asana/n8n logs
2. **Fix:** Update prompt, regenerate code, or adjust API call
3. **Test:** Verify fix works (unless it costs money - ask user first)
4. **Document:** Update handover docs with what you learned
5. **Example:** Webhook fails with 404 → Check function published → Republish → Test → Update troubleshooting guide

### **4. Update Documentation as You Learn**
Handover docs are living documents. When you discover:
- API constraints (rate limits, required fields)
- Better approaches (more efficient workflows)
- Common errors (Asana comment posting fails gracefully)
- Timing expectations (webhook latency <10 seconds)

→ **Update the relevant doc** (but ask before overwriting major sections)

### **5. Phase Your Work (Critical for This Project)**
This project has **dependencies** - you can't build UI before the webhook exists. Always work in this order:

**Phase 1A:** Create webhook (unblocks everything)  
**Phase 1B:** Build Base44 UI (enables testing)  
**Phase 1C:** Test end-to-end (validates workflow)  
**Phase 1D:** Production rollout (gradual launch)  
**Phase 2:** n8n scraper (parallel track, doesn't block Phase 1)

❌ Don't jump ahead to Phase 2 if Phase 1A is incomplete.

---

## Self-Annealing Loop (Error Recovery)

Errors are learning opportunities. When something breaks:

1. **Identify Root Cause**
   - Base44 function error? → Check logs
   - Asana API failure? → Test manually with PowerShell
   - n8n workflow failure? → Check execution logs

2. **Fix the Issue**
   - Generate corrected Base44 prompt
   - Update API call parameters
   - Adjust n8n workflow configuration

3. **Test the Fix**
   - Minimal test (one task, one case)
   - If it costs tokens/credits → Ask user first

4. **Update Documentation**
   - Add to "Known Issues" section
   - Update troubleshooting guide
   - Document workaround for future sessions

5. **System is Now Stronger**
   - Next AI session has better context
   - Errors become part of the knowledge base

---

## File Organization

### **Documentation (Source of Truth):**
- `docs/PROJECT_STATUS_CONSOLIDATED.md` - Overall status, what's done vs what's next
- `docs/ASANA_BASE44_INTEGRATION_HANDOVER_COMPLETE.md` - Webhook implementation guide
- `docs/scraper_technical_spec.md` - n8n workflow specification
- `docs/project_context.md` - Business context, stakeholder needs
- `HANDOVER.md` - Master handover document (all context in one place)

### **Ready-to-Execute Assets:**
- **Base44 Prompts:** Prompts 3-5 in ASANA_BASE44_INTEGRATION_HANDOVER_COMPLETE.md (lines 324-424)
- **PowerShell Commands:** Webhook creation (ready to run)
- **n8n Workflow Spec:** Full node configuration in scraper_technical_spec.md

### **Deliverables (Where Work Lives):**
- **Base44 App:** `https://app.base44.com` (entities, functions, UI)
- **Asana Board:** TEST (`1212782871770137`) and PRODUCTION (`1204991703151113`)
- **Google Sheets:** Mortgage rates (`1XuK8iFxKUrWjHN1-TCTXEQzS0lfsK20ElAwSraRB2OQ`)
- **n8n Instance:** Workflow automation (TBD - needs setup)

**Key Principle:** Documentation lives locally for version control. Work lives in cloud services (Base44, Asana, Sheets) where the team can access it.

---

## Known Issues & Workarounds

### **Base44 Platform Quirks**

| Issue | Workaround |
|-------|------------|
| Nested API paths not supported | Use function name directly in URL path |
| "Discussion mode" errors | Rephrase as commands: "Create..." not "Can you..." |
| `localStorage` not available | Use React state or in-memory storage |
| Field name mismatches | Always verify Base44 entity schema first |

### **Asana API Constraints**

| Issue | Workaround |
|-------|------------|
| Webhook handshake required | Respond with `X-Hook-Secret` header on first request |
| Comment posting failures | Fail gracefully, log error, don't crash workflow |
| Task movement requires both GIDs | Always pass `project_gid` + `section_gid` |
| Rate limiting (150 req/min) | Batch operations when possible |

### **n8n Workflow Best Practices**

| Issue | Workaround |
|-------|------------|
| Apify rate limits | Use dataset fetch (not live scraper) |
| Google Sheets quota | Update full range (A1:K1000) not row-by-row |
| Validation failures | Log to "Failed Scrapes" sheet, don't crash workflow |
| LTV filtering | ONLY 60/75/85/95% (Base44 breaks with 70/80%) |

---

## Your Workflow (How You Actually Work)

### **Starting a New Task:**
1. Read `PROJECT_STATUS_CONSOLIDATED.md` to understand current state
2. Identify the **next unblocked task** (check dependencies)
3. Find the relevant specification in `docs/`
4. Generate/execute the required asset (prompt, API call, or workflow)
5. Test with minimal input (1 task, 1 case)
6. Validate success criteria
7. Update documentation with results

### **When You Encounter Errors:**
1. Check "Troubleshooting" sections in handover docs
2. Test manually (PowerShell for Asana, Base44 logs for functions)
3. Fix and re-test
4. Document the fix
5. Continue forward

### **When You're Unsure:**
1. Ask the user for clarification (don't guess critical business logic)
2. Reference stakeholder expectations (Nwabisa, Mark, Assistants)
3. Check FCA compliance constraints (human approval required)
4. Default to conservative approach (test board before production)

---

## Success Criteria (How You Know You're Done)

### **Phase 1A: Webhook Working**
- [ ] Webhook GID returned from Asana API
- [ ] Test task creates Base44 case
- [ ] Asana comment posted
- [ ] No errors in Base44 logs

### **Phase 1B: UI Complete**
- [ ] "Incomplete Cases" section visible
- [ ] Intake form pre-fills correctly
- [ ] Submit button activates case
- [ ] Second Asana comment posted

### **Phase 1C: End-to-End Validated**
- [ ] 3 consecutive successful test cases
- [ ] 0 duplicate cases
- [ ] Triage calculated correctly
- [ ] <10 second webhook latency

### **Phase 2: Scraper Operational**
- [ ] Weekly scrape running automatically
- [ ] 18-20 products in Google Sheets
- [ ] LTV values are 60/75/85/95 only
- [ ] No duplicates

---

## Critical Constraints (FCA Compliance)

**NON-NEGOTIABLE:**
- ✅ Human approval required before ALL client emails
- ✅ System provides information, NOT regulated financial advice
- ✅ Audit trails mandatory (all decisions logged)
- ✅ 24-hour default delay for email sending
- ✅ Clear disclaimers: "This is indicative and not regulated advice"

**If you're unsure whether something breaks compliance → Ask the user.**

---

## Summary

You sit between human intent (project docs) and deterministic execution (Base44 prompts, API calls, n8n workflows). Your job:

1. **Read specifications** from `docs/`
2. **Generate execution assets** (prompts, commands, workflows)
3. **Validate results** against success criteria
4. **Handle errors** using self-annealing loop
5. **Update documentation** with learnings
6. **Continuously improve** the system

Be pragmatic. Be reliable. Self-anneal. **Respect Base44's quirks.**

---

**Last Updated:** 2026-01-19  
**Project:** Base44 Mortgage System  
**Phase:** 1A (Webhook creation)  
**Next Action:** Execute webhook PowerShell command

# Q&A Log (Raw) - Phase 1: Research & Discovery

**Date:** 2026-01-22
**Phase:** 01 - Research & Discovery
**Task:** 01-01 - Interactive Q&A

---

## Round 1: Core Requirements Validation

### Q1: n8n Cloud Timeline
**Question:** What is the current timeline/urgency for getting n8n Cloud set up? This blocks Phase 5 (bug investigation).

**Answer:**
> I have a n8n cloud account I am able to create any and workflows needed Yep if we are able to just sync up asana when a task is to that specific Asana board column and it for it to replicate the move as well as mimic it down on the other boards that's cool but to give you some context I actually found Zapier agent that is well integrated with our boards and tasks and will also be able to configure and send a much more easily accessible webhook so this is a little bit more unclear and needs to go through a planning phase to unpack setup so I'm able to do that in a sub chat with a sub agent or new chat ,, there's no certain timeline if I'm able to complete that in a new chat today I'm happy to do so as well otherwise whenever is the most ideal time to proceed with that it just needs a little bit of more thorough look and unpacking but should not take long

**Selected Option:** Other (custom response provided)

**Key Insights:**
- n8n Cloud account exists and is accessible
- Discovered Zapier as potentially better alternative
- Zapier has better Asana integration
- Zapier webhooks may be easier to configure
- Needs separate planning session to evaluate n8n vs Zapier
- No firm timeline but can be addressed today if needed

---

### Q2: Legal/Compliance Team Access
**Question:** For Phase 1 (FCA Compliance), do you have access to legal/compliance team for workflow review?

**Answer:** Yes, available this week

**Key Insights:**
- Legal team is available for review within days
- Can proceed with Phase 1 implementation knowing review is imminent
- Should design workflow for legal team approval before production use

---

### Q3: Top Priority
**Question:** What is your highest priority concern among the 5 phases?

**Answer:** FCA Compliance (Phase 1) (Recommended)

**Key Insights:**
- FCA Compliance confirmed as highest priority
- Legal risk is primary concern
- Aligns with implementation plan recommendation

---

### Q4: Webhook Security Requirements
**Question:** For webhook security (Phase 2), do you have any specific security requirements or concerns?

**Answer:** HMAC signature verification (Recommended)

**Key Insights:**
- HMAC signature verification is required
- User selected only this option (not rate limiting or IP whitelisting)
- Cryptographic verification is sufficient security measure

---

## Round 2: Clarifications

### Q5: Webhook Platform Choice
**Question:** Given the new option of Zapier vs n8n for webhooks, which direction should the orchestration focus on?

**Answer:**
> create a planning session to evaluate Zapier versus N8n by creating a new chat and allowing me to plan thoroughly on what's the best scalable and manageable method of this approach and reliability is also very crucial Wanting to build clean system So if there is a easier way or manual method of doing so like best practise we can consider that as the biggest reason for the N8N and Xapier approach was the base 44 constraints that did not want to connect We are able to taste that out as if no enforced before and then go through a full proper planning phased approach with what's the best solution here

**Selected Option:** Defer decision to sub-agent (custom response provided)

**Key Insights:**
- Need separate planning chat to evaluate n8n vs Zapier
- Scalability, manageability, and reliability are key criteria
- Original webhook approach was workaround for Base44 constraints
- Should test if Base44 constraints still apply
- Wants best practice solution, not just a workaround
- Open to manual methods if they're cleaner

---

### Q6: Orchestration Scope
**Question:** Should we proceed with Phases 1-4 now while you explore the webhook setup separately?

**Answer:** Only do Phase 1 for now

**Key Insights:**
- Focus solely on Phase 1 (FCA Compliance)
- Defer other phases until webhook strategy is finalized
- Phases 2-5 may change based on webhook platform decision

---

### Q7: Phase 1 Feature Scope
**Question:** For Phase 1 (FCA Compliance), should we implement the full email approval workflow with all features?

**Answer:** Approval state machine (Recommended)

**Key Insights:**
- Implement core approval state machine (Draft → Pending → Approved → Sent)
- User did NOT select:
  - 24-hour delay enforcement
  - Emergency override capability
  - Audit trail logging
- Focus on essential approval workflow only
- Can add additional features in future iteration if needed

---

## Summary of Key Decisions

1. **Scope Change:** Only Phase 1 will be executed in this orchestration
2. **Webhook Decision Deferred:** Separate planning session needed for n8n vs Zapier evaluation
3. **Phase 1 Simplified:** Core approval state machine only (no 24hr delay, no override, minimal audit)
4. **Legal Review:** Available within days for workflow validation
5. **Security:** HMAC signature verification confirmed (when webhook platform decided)

---

## Questions Still Outstanding

1. What is the minimum audit trail needed for FCA compliance? (Just status changes or full who/when/why?)
2. Should approval state be stored in Base44 entity or separate table?
3. Who should have approval permissions? (All advisers or specific roles?)
4. What happens to pending approvals if email draft is edited?

**Approach:** Make reasonable assumptions based on FCA requirements, document in implementation, validate with legal team during review.

---

## Next Steps

1. Synthesize Q&A into clear requirements document
2. Minimal web research on FCA email approval best practices
3. Proceed to Phase 2: Planning (for Phase 1 implementation only)

# SOURCE_OF_TRUTH_INDEX.md — PromptBridge

## Document Authority

| Question | Authoritative document |
|---|---|
| What are the agent behavior rules and guardrails? | AGENTS.md |
| What is the product, who is it for, what is the MVP? | docs/PRODUCT_BLUEPRINT.md |
| What is the current state, active feature, and implementation lock? | docs/PROJECT_STATE.md |
| What verification commands must pass? | docs/VERIFICATION.md |
| What is the completed history of changes? | docs/DEV_LOG.md |
| What is in scope vs. later phase? | docs/PROJECT_SCOPE.md |
| Where do I find document authority? | docs/SOURCE_OF_TRUTH_INDEX.md (this file) |
| What must pass before a beta handoff? | docs/beta-test-checklist.md |
| What is the roadmap for next features? | docs/ROADMAP.md |
| What are the QA test cases? | docs/beta-test-checklist.md (also see docs/QA_CHECKLIST.md) |

## Document Roles

| Document | Role | Owner |
|---|---|---|
| AGENTS.md | Behavior rules for AI coding agents | AGENTS.md |
| docs/PROJECT_STATE.md | Live state, active feature, lock, handoff | PROJECT_STATE.md |
| docs/VERIFICATION.md | Commands, pass/fail criteria | VERIFICATION.md |
| docs/DEV_LOG.md | Completed history (reverse chrono) | DEV_LOG.md |
| docs/PRODUCT_BLUEPRINT.md | Product definition, users, problem, MVP, scope | PRODUCT_BLUEPRINT.md |
| docs/PROJECT_SCOPE.md | In-scope vs. out-of-scope boundary | PROJECT_SCOPE.md |
| docs/beta-test-checklist.md | Manual QA checklist for beta builds | — |
| docs/ROADMAP.md | Planned next features | ROADMAP.md |

## Conflict Resolution

If two documents disagree:
1. AGENTS.md wins for behavior rules.
2. PROJECT_STATE.md wins for current state and lock.
3. VERIFICATION.md wins for what counts as "done."
4. File this conflict in DEV_LOG.md and resolve before implementing.

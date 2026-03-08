//AGENT_401_Compliance_NOdeploy.md

# AGENT 401 — Compliance NOdeploy

Purpose: Enforce commissioning safety lock.

## Hard Block Rules

- Safety Lock State: LOCKED
- Never run `npm run build`.
- Never run deployment commands (`clasp push`, `firebase deploy`, GitHub release/deploy workflows).
- Keep all work local and repository-scoped.
- Never commit or publish live API keys, secrets, tokens, or credentials in repository files.

## Escalation

If deployment/build is requested, return a safety notice and require explicit human confirmation + separate deploy window.

---

## STAFF_LOGS

- Agent Status: GREEN
- Version Anchor: v1.0
- Department State: WORK
- Active Task ID: TASK_v1.0_WAITSTATE
- Task Pending: No
- Error State: None
- Last Update: 2026-03-01 13:40:35
- Agent Response to Commander: "CLOCKEDOUT. GREEN. v1.0 anchor synchronized. Standing by for client intake."

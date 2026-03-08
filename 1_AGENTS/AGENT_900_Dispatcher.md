//AGENT_900_Dispatcher.md

# AGENT 900 — Dispatcher

Purpose: canonical routing map for task-to-agent assignment.

## Fast Routing

- New feature implementation -> `AGENT_102_Planner.md` -> `AGENT_201_Fullstack_Execution.md` -> `AGENT_203_Debugger.md` -> `AGENT_230_DevLog.md`
- Bug or regression -> `AGENT_203_Debugger.md` -> `AGENT_201_Fullstack_Execution.md` -> `AGENT_230_DevLog.md`
- Console/browser error intelligence registry -> `AGENT_007_Problems.md` (+ `AGENT_203_Debugger.md`, `AGENT_201_Fullstack_Execution.md`)
- Client confusion/explanation -> `AGENT_303_Client_Advocate.md`
- Governance/compliance risk -> `AGENT_101_Architect_Governance.md` + `AGENT_303_Client_Advocate.md`
- Legal/regulation validation (`Virtual Lawyer` lane) -> `AGENT_104_Virtual_Lawyer.md` (+ `AGENT_303_Client_Advocate.md` for user-safe response)
- Canva/Paint.NET creative task -> `AGENT_301_Visuals.md`
- Blender/3D render prep -> `AGENT_302_3D_Viz.md`
- New task intake/runbook updates -> `AGENT_220_Task_Active.md`
- Completion audit/closure report -> `AGENT_221_Task_Archive.md`
- Docs consolidation/reference hygiene -> `AGENT_240_Docs.md`
- Session recovery/handoff context -> `AGENT_103_Handoff_Gemini.md`
- Marketing strategy and social content planning -> `AGENT_103_Marketing.md` (+ `AGENT_102_Planner.md`, `AGENT_303_Client_Advocate.md`)
- SEO strategy and discoverability planning -> `AGENT_203_SEO.md` (+ `AGENT_102_Planner.md`, `AGENT_201_Fullstack_Execution.md`)
- API keys / secret keys / credential handling -> `AGENT_101_Architect_Governance.md` (policy owner) + `AGENT_401_Compliance_NOdeploy.md` (safety gate) + `AGENT_201_Fullstack_Execution.md` (implementation lane)
- Build/deploy safety check -> `AGENT_401_Compliance_NOdeploy.md`
- Approved GitHub release/deploy -> `AGENT_502_Deployer_GitHub.md`
- Executive priority arbitration -> `AGENT_100_Commander_Daniel.md`
- Pause/break handling -> `AGENT_100_Commander_Daniel.md` (prompt global clock-out)
- Build-readiness consensus -> `AGENT_100_Commander_Daniel.md` (+ `AGENT_102`, `AGENT_201`, `AGENT_203`, `AGENT_101`, `AGENT_401`, `AGENT_501`)
- `AGENTS_Audit_YOURREPORT` -> `AGENT_100_Commander_Daniel.md` (+ all agents update `STAFF_LOGS` and return GREEN/RED state)
- `ROLLCALL` -> `AGENT_100_Commander_Daniel.md` (+ all agents return `AGENT_xxx READY` or `AGENT_xxx NOT_READY`)

## Natural Language Intake Routing (Commander Aliases)

- `Fix this ...` -> `AGENT_203_Debugger.md` (+ `AGENT_201_Fullstack_Execution.md`)
- `Learn this ...` -> `AGENT_240_Docs.md` (+ `AGENT_101_Architect_Governance.md` if policy impact)
- `New Task ...` -> `AGENT_102_Planner.md`
- `Add this Task ...` -> `AGENT_220_Task_Active.md` (+ `AGENT_102_Planner.md`)
- `Read this ...` -> `AGENT_240_Docs.md`
- `Include this ...` -> `AGENT_240_Docs.md`
- `Gemni said ...` -> `AGENT_240_Docs.md` -> `AGENT_102_Planner.md` / governance lanes as needed
- `Client just gave new request ...` -> `AGENT_402_Gatekeeper_Intake.md` -> `AGENT_102_Planner.md` -> assigned execution lanes
- `Stop Everything ...` / `Stop everything!` -> Emergency Brake (`AGENT_900_Dispatcher.md`) -> COLD-LOCK files + global PAUSE + state-save to `AGENT_220_Task_Active.md`
- `Actually, let's change direction ...` -> `AGENT_102_Planner.md` + `AGENT_101_Architect_Governance.md`
- `Make this sound more professional ...` / `Translate for Client ...` -> `AGENT_303_Client_Advocate.md` (client-safe export to `200_CLIENTKIT`)
- `What's the status for the client?` -> `AGENT_100_Commander_Daniel.md` -> summarize from `MASTER_LOG.md` + `STAFF_LOGS`
- `Explain this technical part to me ...` -> `AGENT_203_Debugger.md` or `AGENT_201_Fullstack_Execution.md`
- `Why is this like this?` -> `AGENT_203_Debugger.md`
- `Check this console error pattern ...` -> `AGENT_007_Problems.md` (+ `AGENT_203_Debugger.md`)
- `Find where we did this before ...` -> `AGENT_221_Task_Archive.md` + `AGENT_240_Docs.md`
- `Build social content strategy ...` -> `AGENT_103_Marketing.md`
- `Improve SEO for this page/flow ...` -> `AGENT_203_SEO.md`
- `Set up API key/secret ...` -> `AGENT_101_Architect_Governance.md` (+ `AGENT_401_Compliance_NOdeploy.md`, `AGENT_201_Fullstack_Execution.md`)
- `Does this look right on mobile?` -> `AGENT_202_Responsive_QA.md`
- `Is this safe to show?` -> `AGENT_104_Virtual_Lawyer.md`
- `I dont know what to do . You handle this` -> `AGENT_100_Commander_Daniel.md` triage mode via dispatcher

## Dispatch Rules

1. Choose the primary lane from Fast Routing.
2. Runtime code work always includes `AGENT_401_Compliance_NOdeploy.md` during commissioning.
3. Client-facing output always includes `AGENT_303_Client_Advocate.md` as final pass.
4. Record milestones in `AGENT_230_DevLog.md` at meaningful completion.
5. Final release work must pass through `AGENT_501_GoldMaster.md` before `AGENT_502_Deployer_GitHub.md`.
6. If user requests pause/break, Commander must ask: "Would you like to CLOCKOUT all agents and wait?"
7. Commander is the single reporting authority for multi-agent outcomes.
8. For `AGENTS_Audit_YOURREPORT`, Commander must produce one consolidated GREEN/RED health table from all agent `STAFF_LOGS`.
9. For `ROLLCALL`, Commander must produce one consolidated readiness list using exact agent-name response lines.
10. Natural-language aliases from Daniel must be treated as valid commands and routed by Commander without requiring strict syntax.
11. All natural-language triggers require Commander Confidence Check (`High` / `Medium` / `Low`) before execution.
12. For `I dont know what to do . You handle this`, Commander must state the 95% confidence sentence before acting.

## One-Line Command Pattern

- "Route: [task type] -> [primary agent] (+ [secondary agents])"
- Example: "Route: client onboarding FAQ update -> `AGENT_303_Client_Advocate.md` (+ `AGENT_240_Docs.md`, `AGENT_230_DevLog.md`)"

## Common Requests (Copy/Paste)

- "Route: implement new owner dashboard feature -> `AGENT_102_Planner.md` (+ `AGENT_201_Fullstack_Execution.md`, `AGENT_203_Debugger.md`, `AGENT_230_DevLog.md`, `AGENT_401_Compliance_NOdeploy.md`)"
- "Route: fix runtime error from console -> `AGENT_203_Debugger.md` (+ `AGENT_201_Fullstack_Execution.md`, `AGENT_230_DevLog.md`, `AGENT_401_Compliance_NOdeploy.md`)"
- "Route: explain portal behavior to client -> `AGENT_303_Client_Advocate.md` (+ `AGENT_240_Docs.md`)"
- "Route: write compliance-safe terms/disclaimer copy -> `AGENT_101_Architect_Governance.md` (+ `AGENT_303_Client_Advocate.md`, `AGENT_240_Docs.md`)"
- "Route: create Canva social asset pack -> `AGENT_301_Visuals.md` (+ `AGENT_303_Client_Advocate.md`)"
- "Route: prepare Blender product render setup -> `AGENT_302_3D_Viz.md` (+ `AGENT_301_Visuals.md`)"
- "Route: update active task manifest from new priorities -> `AGENT_220_Task_Active.md` (+ `AGENT_102_Planner.md`, `AGENT_230_DevLog.md`)"
- "Route: produce completion audit summary -> `AGENT_221_Task_Archive.md` (+ `AGENT_240_Docs.md`, `AGENT_230_DevLog.md`)"
- "Route: restore project context after session break -> `AGENT_103_Handoff_Gemini.md` (+ `AGENT_102_Planner.md`)"
- "Route: execute approved GitHub deployment -> `AGENT_502_Deployer_GitHub.md` (+ `AGENT_501_GoldMaster.md`, `AGENT_101_Architect_Governance.md`, `AGENT_230_DevLog.md`)"

## Emergency Routes

- "Route: production/site outage triage -> `AGENT_100_Commander_Daniel.md` (+ `AGENT_203_Debugger.md`, `AGENT_201_Fullstack_Execution.md`, `AGENT_401_Compliance_NOdeploy.md`, `AGENT_230_DevLog.md`)"
- "Route: accidental deploy or release rollback -> `AGENT_502_Deployer_GitHub.md` (+ `AGENT_501_GoldMaster.md`, `AGENT_101_Architect_Governance.md`, `AGENT_100_Commander_Daniel.md`, `AGENT_230_DevLog.md`)"
- "Route: high-risk client escalation -> `AGENT_303_Client_Advocate.md` (+ `AGENT_101_Architect_Governance.md`, `AGENT_100_Commander_Daniel.md`, `AGENT_240_Docs.md`)"

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

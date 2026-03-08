//AGENT_901_ReadOrder.md

# AGENT 901 — Read Order

Purpose: minimum read sequence to prevent context drift and preserve safe routing.

## First 5 Files (Always)

1. `AGENT_900_Dispatcher.md` — select the correct lane.
2. `AGENT_101_Architect_Governance.md` — enforce policy/risk boundaries.
3. `AGENT_102_Planner.md` — confirm scope and step order.
4. `AGENT_103_Handoff_Gemini.md` — restore session continuity/checksum.
5. `AGENT_230_DevLog.md` — anchor to latest milestone state.

## Then Read by Task Type

- Implementation: `AGENT_201_Fullstack_Execution.md`, `AGENT_203_Debugger.md`, `AGENT_401_Compliance_NOdeploy.md`
- Responsive QA: `AGENT_202_Responsive_QA.md`, `AGENT_203_Debugger.md`
- Client communications: `AGENT_303_Client_Advocate.md`, `AGENT_240_Docs.md`, `AGENT_402_Gatekeeper_Intake.md`
- Creative/3D: `AGENT_301_Visuals.md`, `AGENT_302_3D_Viz.md`
- Task operations: `AGENT_220_Task_Active.md`, `AGENT_221_Task_Archive.md`
- Deployment window only: `AGENT_501_GoldMaster.md`, `AGENT_502_Deployer_GitHub.md` (explicit approval required)
- Legal/regulatory review: `AGENT_104_Virtual_Lawyer.md`, `AGENT_101_Architect_Governance.md`, `AGENT_303_Client_Advocate.md`

## Session Rule

If routing remains ambiguous, escalate to `AGENT_100_Commander_Daniel.md` for final arbitration before execution.

## Session State Trigger

- `WORK` => Treat session as `CLOCKEDIN` and route all new tasks through Commander.
- Pause/Break request => Commander asks whether to `CLOCKOUT` all active agents and wait.
- Resume request => Commander reopens lane and reassigns based on latest completed task log.

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

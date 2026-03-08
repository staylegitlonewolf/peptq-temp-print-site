//AGENT_000_Setup.md

# 🆔 VERSION: [www.LVA.Studio.tech_v1.0]
# 🕒 STATUS: [PENDING]
# 🚥 TRIGGER: Change PENDING to [WORK] to Initialize Agency Stack

## Session Ignition Quick Path

- 🚀 SESSION START: Open `100_DEVKIT/0_STARTER/003_INSTANT_Handoff_Prompt.md` and paste the Mega-Prompt to initialize the 22-agent stack.

//////////////////////////////////////////////////////////////////////////
// CLOCK-IN SYSTEM
// CHANGE PENDING TO [CLOCKEDIN] TO START SESSION
//////////////////////////////////////////////////////////////////////////

[CLOCKEDIN] Agent 000 is now clocked in @Date_Time: ____________________
[CLOCKEDOUT] Agent 000 is now clocked out @Date_Time: ____________________

## 🔐 WORK/Pause Protocol

- `WORK` command means session state is now `CLOCKEDIN`.
- If user says pause/break/"I will come back", system response must ask:
	- "Would you like to CLOCKOUT all agents and wait?"
- If user confirms, set Commander + active lanes to `CLOCKEDOUT` and hold execution.
- On return, user speaks to Commander first for new routing.

---

## 📋 PROJECT INTAKE (LVA Studio Institutional Standard)

**Project Name:** ___________________________________________________
**Client ID:** ______________________________________________________
**Project Root:** LVA.Studio.WEB.Template/
**Target Domain:** __________________________________________________
**Version Anchor:** v1.0

---

## 🚦 COMMANDER INITIALIZATION

[PENDING] Waiting for Commander to assign me a task about the project.

[WORK]
[TASK_v1.0] Commander Directive:
> "Initialize the LVA Agent Stack for [Project Name]. Read the LVA_TECH_Manifesto. Adopt the 3-digit departmental routing. Establish the No-Build perimeter. Sync all Agent headers to [Version Anchor]."

---

## ✅ EXECUTION LOG

[Completed]
[TASK_v1.0] Agent 000 Response:
> "Status: Verified. Files are setup and synced for project [Version Anchor]. All departments (100-900) have been briefed on the No-Build mandate."

---

## 📝 TASK DISTRIBUTION (THE HANDOFF)

[TO-DO]

- [ ] AGENT_100_Commander: Approve Blueprint
- [ ] AGENT_102_Planner: Sequence Tasks
- [ ] AGENT_201_Fullstack: Initialize Local Sandbox
- [ ] AGENT_104_Virtual_Lawyer: Validate legal/regulatory posture on request

[Completed]

- [INCOMING] Commander v1.0 task - Setup Response:

> "Agency Staffed. Governance Locked. Awaiting WORK trigger for AGENT_102."

---

## 📌 Quick Operator Commands

- `WORK` -> Clock in and route through Commander.
- `PAUSE` / `BREAK` -> Prompt global clock-out confirmation.
- `RESUME` -> Restore Commander lane and continue from latest log.
- `REPORT` -> Commander summarizes assigned agents + latest completions.
- `ROLLCALL` -> Commander requests readiness lines from all agents and returns consolidated READY/NOT_READY list.

Natural-language aliases Commander accepts automatically:

- `Fix this ...`
- `Learn this ...`
- `New Task ...`
- `Add this Task ...`
- `Read this ...`
- `Include this ...`
- `Gemni said ...`
- `Client just gave new request ...`
- `Stop Everything ...`
- `Stop everything!`
- `Actually, let's change direction ...`
- `Make this sound more professional ...`
- `Translate for Client ...`
- `What's the status for the client?`
- `Explain this technical part to me ...`
- `Why is this like this?`
- `Find where we did this before ...`
- `Does this look right on mobile?`
- `Is this safe to show?`
- `I dont know what to do . You handle this`

### Updated Alias Quick-List (v13.02)

| Your Natural Phrase | Commander Routing Path |
| --- | --- |
| Translate this for Client... | `AGENT_303_Client_Advocate.md` |
| Is this legal? | `AGENT_104_Virtual_Lawyer.md` |
| Pivot the plan... | `AGENT_102_Planner.md` (+ `AGENT_101_Architect_Governance.md`) |
| Where is the fix for...? | `AGENT_203_Debugger.md` |
| Snapshot current state. | `AGENT_103_Handoff_Gemini.md` |
| Gemni said... | `AGENT_240_Docs.md` -> `AGENT_102_Planner.md` / governance lanes |
| Why is this like this? | `AGENT_203_Debugger.md` (root-cause in plain English) |
| I dont know what to do . You handle this | Commander triage mode via `AGENT_900_Dispatcher.md` |

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

# AGENT 000 - MASTER BOILERPLATE

Canonical shared text for AGENT documents in `1_AGENTS`.
Use references to these sections instead of duplicating policy text across role files.

## Core Governance Profile v1.0

## 👤 Persona & Tone

- **Role:** High-Compliance Research Procurement Architect.
- **Tone:** Professional, precise, and institutional.
- **Forbidden Vocabulary:** Never use "Cart", "Checkout", "Buy", or "Store".
- **Required Vocabulary:** Use "Manifest", "Inquiry", "Procurement", and "Registry".

## 🛡️ Governance Rules (Always Apply)

1. **Human-in-the-Loop (HITL):** Never apply code changes automatically. Propose the logic in chat first.
2. **Security Gate:** All member data must be fetched via the `mode: 'no-cors'` protocol for Apps Script.
3. **Relational Integrity:** Lot IDs must always link to a verified `LOT_REGISTRY` entry.
4. **QuickLinks Structural Rule:** When building the Owner Command Center UI, check for the existence of the `PEPTQ_Owner_QuickLinks` tab. If present, render a dynamic Resource Rail using `link_label` + `link_url`, sorted by `sort_order`.

## 🛰️ Inter-Agent Communication ACK (Required)

- If an agent is actively working a task, the first line of its internal status reply must be:
    - `THIS IS WORK AGENT_xxx`
- `AGENT_xxx` must match the lane document name (example: `AGENT_202`).
- Then include:
    1. current task action in one sentence,
    2. blocker or hand-off target lane (if any).
- Purpose: enforce fast lane identity and reduce cross-agent ambiguity during active execution.

### Directive: Automated Catalog Enrichment

- **Input:** Owner provides `title` and `image_file` from Owner Command Center uploader.
- **Step A:** Generate `handle` by slugifying `title`.
- **Step B:** Upload `image_file` to Google Drive and persist returned URL to `image_path`.
- **Step C:** Call PubChem enrichment by `CAS` (if supplied) with fallback to `title` lookup.
- **Step D:** If a match exists, map `formula`, `mass`, `cid_pubchem`, and `cas_number`.
- **Step E:** Append a new row to `PEPTQ_Catalog` with `visible=FALSE` for owner review before release.

## 🚫 CRITICAL SAFETY: DO NOT BUILD OR DEPLOY

- **NO BUILD:** You are strictly forbidden from running `npm run build` or any build-related scripts.
- **NO DEPLOY:** You are strictly forbidden from executing deployment commands (e.g., `clasp push`, `firebase deploy`, or manual production pushes).
- **LOCAL ONLY:** Keep all implementation changes in `src/` or `google-apps-script/`.
- **RATIONALE:** We are in a "Sprint State." We only build once all 73 tasks are verified.

## 📋 Global Mission: The 73-Task Sprint

- **Master Blueprint:** Your primary source of truth is `AGENT_220_Task_Active.md`.
- **Workflow:** You are authorized to work through tasks in sequential order.
- **Transition Rule:** Upon finishing a task, automatically analyze the requirements for the next task and propose a plan for it.
- **Reporting:** After every implementation, update `FORdev/manifests/devLOG.MD` and mark the task as `[DONE]` in `AGENT_220_Task_Active.md`.

## 🏗️ Technical Constraints (Full Stack)

- **Frontend:** React + Vite. Use `requestService.js` and `orderService.js` for Google Sheets comms.
- **Backend:** Google Apps Script (Standard Command Pattern). Use the `switch(command)` router in `Code.gs`.
- **Relational Map:**
    1. `PEPTQ_Catalog` -> Product Data & VIP Pricing.
    2. `PEPTQ_PortalRequest` -> The Waiting Room (Intake).
    3. `PEPTQ_Members` -> Approved Identity Vault.
    4. `PEPTQ_Orders` -> The Procurement Ledger.
    5. `PEPTQ_Owner` -> CMS & Layout Toggles.

## 🛠️ Execution Commands

- Test Logic: `npm test src/services/RequestService.test.js`
- Lint Check: `npm run lint`

## 🔒 Repo Policy Alignment

- Treat `.github/copilot-instructions.md` as authoritative policy.
- Never modify `dist/` or `build/` directories.

## Continuity Seal v12.67

- v12.67 - TOTAL SYSTEM LOCK - 2026-02-28

Operator: Daniel Fortier / System: Gemini 3 Flash

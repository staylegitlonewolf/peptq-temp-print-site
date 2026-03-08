//AGENT_220_Task_Active.md

# AGENT 220 — Task Active

> Sprint posture: Local-only lockdown (no build / no deploy from this repo).
> Implementation status: Completed implementation records have been moved to `FORdev/manifests/TASKS_Complete.MD`.

## Pre-Implementation Gate (Required Before New Code)

- [ ] Check `FORdev/manifests/masterDebugLog.md` for matching error signatures before creating or changing implementation logic.
- [ ] Check `FORdev/docsIndex.md` for priority references before implementing non-trivial frontend/backend behavior.
- [ ] If a missing reference is discovered during implementation, append the useful link into `FORdev/docsIndex.md`.
- [ ] For PubChem-related flows, verify endpoint/policy context in `FORdev/manifests/pubchemDoc.md` before updating fetch logic.
- [ ] Verify `HANDOFF_CHECKSUM` in `GEMINI_HANDOFF_PROMPT.md` matches current `FORdev/manifests/devLOG.MD` milestone anchor and `AGENT_220_Task_Active.md` completion state before new coding waves.

## Active Checklist (Manual / HITL)

> Commissioning mode: all remaining unchecked items are HITL live-ops validation steps (no net-new implementation required).
> Wave closure state (`v12.48`): Ready for Commissioning; implementation architecture is locked.

### A) Vault & Config Binding

- [ ] Confirm final Spreadsheet IDs for:
  - `PEPTQ_Catalog`
  - `PEPTQ_PortalRequest`
  - `PEPTQ_Members`
  - `PEPTQ_Orders`
  - `PEPTQ_Owner`
  - `PEPTQ_Owner_QuickLinks`
- [ ] Bind IDs in `backend_Google/v1/config.gs`:
  - `SPREADSHEET_ID` (fallback)
  - `SPREADSHEET_IDS` (per-vault map)
- [ ] Bind Drive folder ID in `backend_Google/v1/config.gs`:
  - `CATALOG_IMAGE_FOLDER_ID` (`Product_Photos`)

### B) Runtime Validation

- [ ] Run manual connectivity checks across vaults (Catalog, Members, Orders, Owner, Portal Request).
- [ ] Execute Apps Script Web App deployment manually in Google UI (HITL).
- [ ] Capture/update the active `/exec` URL in frontend API config handshake.
- [ ] Execute first-connect smoke test:
  - Waiting Room submit → `PEPTQ_PortalRequest` write verified
  - Duplicate guard behavior verified
  - Owner/member operational path verified

### C) Launch Readiness Confirmation

- [ ] Confirm guest/pending portal message copy.
- [ ] Confirm invoice payment instruction copy (institutional wording).
- [ ] Confirm backup snapshot performed before live cutover.

### D) Owner Command Center Sheet Setup

- [ ] Create/verify owner control tabs and locked headers:
  - `PEPTQ_Owner` (`section_id`, `is_visible`, `header_text`, `sub_text`, `cta_label`)
  - `PEPTQ_Owner_QuickLinks` (`link_id`, `link_label`, `link_url`, `is_visible`, `sort_order`)
- [ ] Seed required owner settings rows:
  - `OWNER_BUSINESS_NAME`
  - `OWNER_SUPPORT_EMAIL`
  - `OWNER_MASTER_PIN_POLICY`
  - `SITE_STATUS`
- [ ] Keep Waiting Room intake active in `PEPTQ_PortalRequest` for early inquiry review.
- [ ] Follow build spec in `FORdev/PEPTQ_Owner_GoogleSheets_Blueprint.md`.

### E) UPCOMING (Post-73 Planning Queue)

- [x] Agency Identity Setup is complete (`lvastudio.tech` canonical anchor with `.online` and `.store` strategic perimeter).
- [x] (UPCOMING) Archive PEPTQ institutional social presence (`@peptqresearch`) and intake-funnel compliance notes in operator/client docs.
- [x] (UPCOMING) Add client-facing social caption/compliance guidance for IG-led Waiting Room intake pathway.
- [x] (UPCOMING) Stage Meta Developer integration references and API-roadmap controls for future closed-loop intake automation.
- [ ] (UPCOMING) (Phase 1) (HITL) System Pulse Diagnostics is implemented in `OwnerPage`; complete live vault verification against bound sheet IDs.
- [ ] (UPCOMING) (Phase 1) (HITL) Execute FAQ seeding checklist in `PEPTQ_Owner` and validate dynamic FAQ ordering (`P1`, `P2`) and visibility toggles in `FAQ.jsx` on live runtime.
- [ ] (UPCOMING) (Post-Handover) Add next mission task specification (owner-provided) after completion of HITL commissioning smoke tests.
- [ ] (UPCOMING) (LVA) (Staged) Create agency sheets `LVA_Client_Master`, `LVA_Systems_Config`, `LVA_Billing_Ledger`, and `LVA_Service_Status` from blueprint; keep sync-later posture until dedicated Apps Script bindings are introduced.
- [x] (UPCOMING) (Governance) Implement Institutional Governance panel in OCC with LVA.STUDIO attribution, client ownership-rights statement, and Namecheap management deep-link.
- [x] (UPCOMING) (Governance) Add OCC bridge action `Access LVA Operator Portal` to complete managed-service transition path.
- [ ] (UPCOMING) (HITL) Validate Institutional Governance panel copy and Namecheap management deep-link behavior on live runtime.
- [x] (UPCOMING) (Phase 2) Add institutional greeting block (`Welcome back {operator_name}`) in `OwnerPage.jsx` using `PEPTQ_Members` session identity.
- [x] (UPCOMING) (Phase 2) Harden `OrderHistoryPage.jsx` with hybrid live-fetch plus local fallback merge to avoid flash-of-empty-state.
- [x] (UPCOMING) (Phase 3) Implement Master PIN recovery flow (temporary PIN issuance + forced rotation on next login) per v11.79 blueprint.
- [x] (UPCOMING) (Phase 3) Finalize pro-forma dispatch trigger from Owner fulfillment actions for direct invoice send workflow.
- [x] (UPCOMING) (Governance) Enforce terminology deprecation in upcoming wave (`Administrator` -> `Institutional Operator` / `System Owner`).
- [x] (UPCOMING) (Governance) Continue technical reference enrichment in `FORdev/docsIndex.md` for MDN/Google/PubChem support.

#### Final Closeout Run Card (v12.44)

- Execute the single-pass 10-minute commissioning script in `FORclient/PEPTQ_10_Minute_Closeout_Run_Card_v12.44.md`.
- This run card is the terminal HITL execution artifact before final sign-off.

#### Phase 1 HITL: FAQ Seeding Validation Run Card (10 Minutes)

Step 1 — Injection (2 minutes)

- Open `PEPTQ_Owner` and confirm headers: `section_id`, `is_visible`, `header_text`, `sub_text`, `cta_label`.
- Paste/update rows:

| section_id | is_visible | header_text | sub_text | cta_label |
| --- | --- | --- | --- | --- |
| FAQ_PAYMENT | TRUE | Settlement Protocols | Zelle: support [at] peptq.com | P1 |
| FAQ_SHIPPING | TRUE | Dispatch Timelines | Orders ship within 48h. | P2 |
| FAQ_LEGAL | TRUE | Research Compliance | 21+ only. Lab use only. | P3 |

Step 2 — UI Verification (3 minutes)

- Navigate to FAQ/Settlement UI.
- Verify ordering: `Settlement Protocols` renders first (`P1`).
- Set `FAQ_SHIPPING` → `is_visible=FALSE`, refresh UI, confirm it disappears.
- Set all FAQ rows to `FALSE` (or remove rows), refresh UI, confirm static institutional fallback returns.

Step 3 — Pulse Check (2 minutes)

- Open Owner Command Center (`/owner`).
- Confirm Bridge/Vault Pulse reports `Operational`.

#### Phase 1 FAQ Seeding Checklist (Copy/Paste Ready)

Use this in `PEPTQ_Owner` with the existing 5-column schema (`section_id`, `is_visible`, `header_text`, `sub_text`, `cta_label`):

| section_id | is_visible | header_text | sub_text | cta_label |
| --- | --- | --- | --- | --- |
| FAQ_PAYMENT | TRUE | Settlement Protocols | Zelle: support [at] peptq.com | P1 |
| FAQ_SHIPPING | TRUE | Dispatch Timelines | Orders ship within 48h of payment verification. | P2 |
| FAQ_LEGAL | TRUE | Research Compliance | 21+ only. Laboratory research use only. | P3 |

Validation checks:

- [ ] Confirm rows are present in `PEPTQ_Owner` with exact `FAQ_` prefix.
- [ ] Confirm priority order renders as `P1`, `P2`, `P3` in `FAQ.jsx`.
- [ ] Confirm toggling `is_visible` to `FALSE` removes item from FAQ UI.
- [ ] Confirm static fallback appears only when no visible `FAQ_` rows exist.

Reference: `FORdev/FAQ_Seeding_Checklist.md`

## Governance Rules (Still Enforced)

- Keep institutional vocabulary (`Request Access`, `Inquiry`, `Procurement`, `Registry`).
- Keep Apps Script bridge requests with `mode: 'no-cors'` where required.
- Preserve Waiting Room/VIP Vault separation:
  - `PEPTQ_PortalRequest` = Waiting Room
  - `PEPTQ_Members` = VIP Vault

## Reference Sources

- Completed implementation archive:
  - `FORdev/manifests/TASKS_Complete.MD`
- Full historical master manifest snapshot:
  - `FORdev/archives/TASKS_reference_2026-02-27.md`
- Task audit determination:
  - `TASKS_AUDIT.MD`
- Operational checklist + manual launch tracker:
  - `FORdev/manifests/DANIELtasks.md`
- Changelog timeline:
  - `FORdev/manifests/devLOG.MD`

## Continuity Seal

Inherited from `AGENT_000_MASTER_BOILERPLATE.md` (**Continuity Seal v12.67**).

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

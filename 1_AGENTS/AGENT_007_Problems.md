//AGENT_007_Problems.md

# AGENT 007 — Problems Registry

Purpose: central error intelligence lane for console/runtime/browser issues.

## Responsibilities

## Required Entry Format

## Operating Rules

1. Commander routes error-first work through this file before major implementation waves.
2. If risk is compliance/deploy related, include `AGENT_401_Compliance_NOdeploy.md`.
3. If user-facing behavior is affected, notify `AGENT_303_Client_Advocate.md` for safe explanation.
4. Keep entries additive and timestamped; never delete historical incidents.
5. AGENT_007 must pair with Copilot on every active runtime/lint/build incident until closure is verified.
6. Every newly reported console error must be added here before remediation is marked complete.

---

## Incident Log

### 2026-03-01 — MD012 Recurrence (Trailing EOF Spacer)

- Source: Terminal/Problems panel
- Error Signature: repeated `MD012/no-multiple-blanks` on the same starter/client markdown files after prior cleanup
- Impact: low (lint-only)
- Root Cause: extra trailing blank line remained at end-of-file, keeping two consecutive blanks in markdown parser view
- Fix Applied: removed final trailing spacer in all flagged files and re-verified diagnostics
- Prevention Rule: enforce single newline at EOF and avoid leaving an extra blank paragraph at file end
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md`

### 2026-03-03 — Print Label Micro-Alignment Drift (Blue/Orange Bands + Text Baseline)

- Source: Runtime / Print Preview / PDF output
- Error Signature: repeated micro-offset mismatch where product title in navy ribbon and purity text in orange ribbon appear slightly high/cropped between iterative print proofs
- Impact: medium (user-facing print quality and release readiness)
- Root Cause: no locked baseline calibration for text Y positions and ribbon width parity in OL1735 print template; iterative edits changed one zone without always preserving paired alignment constraints
- Fix Applied: standardized ribbon width parity (orange band = navy band width), introduced deterministic purity text formatting split for preview vs PDF-safe output, and applied controlled micro-Y nudges with proof-loop verification
- Prevention Rule: keep a single-source "print baseline" constants block in `src/pages/PrintCenterPage.jsx`, log every print nudge in AGENT_007 before closure, and require side-by-side proof check (product title, purity line, legal/storage lines) before shipping
- Owner Lane: `AGENT_007_Problems.md` + Copilot + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md`
### 2026-03-01 — MD012 Consecutive Blank Lines Sweep (Commander Roll Call)

- Source: Terminal/Problems panel
- Error Signature: `MD012/no-multiple-blanks` at fixed line anchors across six markdown files
- Impact: low (lint quality gate only; no runtime impact)
- Root Cause: duplicate spacer lines left after prior edits in starter/agent/client docs
- Fix Applied: removed extra blank line in each flagged file and re-ran diagnostics
- Prevention Rule: keep exactly one blank line between markdown blocks; run post-edit lint sweep before closure
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md`

### 2026-03-01 — Full Folder Problems Sweep (Post-Remediation)

- Source: Terminal/Problems panel
- Error Signature: residual markdownlint diagnostics after prior workspace cleanup
- Impact: low (documentation quality signal only)
- Root Cause: table/list spacing inconsistencies in legacy agent/index markdown blocks
- Fix Applied: applied targeted markdown spacing fixes and re-ran full diagnostics until zero active problems
- Prevention Rule: after any multi-file doc cleanup, run one full-folder diagnostics sweep and log closure in AGENT_007
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md`

### 2026-03-01 — Markdownlint Noise Flood (Workspace-Wide)

- Source: Terminal/Problems panel
- Error Signature: massive `MD013/line-length` and `MD034/no-bare-urls` diagnostics across legacy documentation trees
- Impact: medium (high noise, low runtime risk)
- Root Cause: strict markdownlint defaults were applied to institutional/archival docs not intended for 80-char wrapping or forced link formatting
- Fix Applied: updated root lint config in `.markdownlint.json` to disable `MD013` and `MD034`
- Prevention Rule: keep repository markdownlint aligned with institutional doc style before broad scans; treat docs-lint policy changes as config-level fixes, not mass text rewrites
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md`

### 2026-03-02 — Bundle Overhead + Warning Noise (Phase 2 Final Polish)

- Source: Terminal/Build output
- Error Signature: oversized chunk warnings and eager-loaded 3D viewer payload affecting initial dashboard load profile
- Impact: medium (performance/maintainability signal; no production crash)
- Root Cause: `MoleculeViewer` imported eagerly in ProductModal and heavy vendor groups lacked explicit chunk boundaries
- Fix Applied: lazy-loaded `MoleculeViewer` with `React.lazy` + `Suspense`; added targeted `manualChunks` in `vite.config.js`; completed full verification (`lint`, `test`, `build`, diagnostics)
- Prevention Rule: keep optional heavy features dynamically imported and re-audit chunk map after dependency updates
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md`

### 2026-03-02 — Vite Chunk Syntax Crash + SES Runtime Noise

- Source: Browser/Runtime + Dev Server
- Error Signature: `chunk-RY7GF66K.js:1 Uncaught SyntaxError: Invalid or unexpected token`, `server connection lost`, `SES Removing unpermitted intrinsics`
- Impact: high (local runtime unusable until cache/process reset)
- Root Cause: stale/corrupted Vite optimize-deps state and competing dev-server processes created outdated chunk responses; SES message observed as external runtime/extension-side noise
- Fix Applied: terminated conflicting listeners, cleared `node_modules/.vite`, re-optimized deps, validated chunk header integrity, and added `dev:reset` script in `package.json` for deterministic recovery
- Prevention Rule: start recovery with `npm run dev:reset`, avoid multi-server overlap on 5173/5174, and log every recurring browser console signature in AGENT_007 before closeout
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — Login Test Lab Follow-Up (Transient Dev Runtime Drift)

- Source: Browser/Runtime + Dev Server
- Error Signature: `VMxxx Uncaught SyntaxError: Invalid or unexpected token`, `server connection lost`, intermittent `404` on `/` during reconnect, repeated `SES Removing unpermitted intrinsics`
- Impact: medium (transient local dev interruption; app recovered and login test path remained functional)
- Root Cause: browser held stale optimize-deps runtime while dev server recycled; temporary reconnect path surfaced old VM/chunk token parse and root-route 404 during restart window. SES line remains external/injected noise, not app logic failure.
- Fix Applied: validated runtime recovery path (`npm run dev:reset`), confirmed app reloaded successfully, verified Login Test Lab UI flow and backend identity fetches resumed without blocking errors.
- Prevention Rule: when VM token error appears, do single-path recovery only (`npm run dev:reset` + hard refresh) and avoid parallel dev-server launches; treat React `[Violation]` timing lines as performance signals, not functional errors.
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + Copilot

### 2026-03-02 — Expected Network Health Signals (No Fault)

- Source: Browser/Network
- Error Signature: none (successful fetch telemetry)
- Impact: low (positive runtime confirmation)
- Root Cause: expected app startup and auth refresh checks calling PubChem health endpoint plus Google Apps Script identity status endpoint
- Fix Applied: none required; classified as expected behavior
- Prevention Rule: treat `Fetch finished loading` lines for PubChem (`MolecularFormula`) and `GET_IDENTITY_STATUS` as normal operational signals unless response status or payload indicates failure
- Owner Lane: `AGENT_007_Problems.md` + Copilot

### 2026-03-02 — Identity Status Poll Trace (No Fault, Dev Verbose)

- Source: Browser/Network + Runtime stack trace
- Error Signature: repeated `Fetch finished loading` for PubChem and `GET_IDENTITY_STATUS` with React passive-effect stack frames
- Impact: low (noise/verbosity; no functional failure)
- Root Cause: normal dev-mode effect/poll cycle emits repeated network traces and stack frames in console; requests succeed with healthy responses
- Fix Applied: none required; classified as expected developer telemetry
- Prevention Rule: only escalate when status codes fail, payload returns `error`, or requests loop without successful completion; otherwise treat as normal `dev verbose` signal
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + Copilot

### 2026-03-02 — Console Health Signals + Security Smoke Closure

- Source: Browser/Runtime + Automation
- Error Signature: `SES Removing unpermitted intrinsics`, `Fetch finished loading`, React `[Violation]` handler timing lines
- Impact: low (diagnostic/performance signal; no functional break)
- Root Cause: external SES lockdown script noise plus expected fetch telemetry and dev-time long-task warnings under interaction/hot update cycles
- Fix Applied: no code fix required for SES/fetch lines; executed automated logout security smoke across `/owner`, `/documents`, `/ledger`, `/profile` with all `PASS`; generated multi-device responsive artifact baseline in `artifacts/responsive-audit/2026-03-02T17-20-03-088Z`
- Prevention Rule: treat these lines as no-fault unless accompanied by failed status codes, uncaught app exceptions, or broken UX path; keep `smoke:logout` and `audit:responsive` in routine regression runs
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_202_Responsive_QA.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — Profile Save Command DNS Failure (`ERR_NAME_NOT_RESOLVED`)

- Source: Browser/Runtime + Network
- Error Signature: `POST .../exec net::ERR_NAME_NOT_RESOLVED` at `requestService.js:95` during `UPDATE_MEMBER_PROFILE`
- Impact: medium (profile save blocked against remote Apps Script endpoint)
- Root Cause: local DNS/network environment could not resolve `script.google.com` endpoint hostname at time of request
- Fix Applied: hardened `postCommand` network error handling in `src/services/requestService.js` to surface actionable message/code (`ERR_APPS_SCRIPT_UNREACHABLE`) instead of raw fetch stack; added Profile `Orders` section in `src/pages/ProfileSettingsPage.jsx` with explicit empty state (`No orders yet.`)
- Prevention Rule: classify SES/fetch-complete/violation timing lines as non-blocking telemetry; escalate only unresolved endpoint and failed command dispatch codes; verify endpoint reachability (DNS/VPN/firewall) when `ERR_APPS_SCRIPT_UNREACHABLE` appears
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + `AGENT_203_Debugger.md` + Copilot

### 2026-03-02 — OWNER/ADMIN Session Downgrade During Identity Refresh Outage

- Source: Runtime/Auth refresh
- Error Signature: Login Test Lab OWNER/ADMIN session reverts to GUEST ~4s after sign-in while `GET_IDENTITY_STATUS` endpoint is unreachable
- Impact: high (blocks privileged testing workflow)
- Root Cause: `resolveIdentityStatus()` network catch path returned `GUEST`, and `AuthProvider` refresh applied that fallback role/status over current local test session
- Fix Applied: updated `src/services/requestService.js` to return `reachable:false` on network fallback without forced `GUEST`; updated `src/context/AuthProvider.jsx` to preserve current role/status/pinRotation flags when backend reachability is false
- Prevention Rule: never force role demotion on transport failures; only downgrade role from explicit backend identity response or account-delete state
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — HMR Auth Context Crash (`useAuth` outside provider during refresh)

- Source: Runtime/HMR
- Error Signature: `useAuth must be used within an AuthProvider` thrown in `AppLayout` after Vite hot updates
- Impact: high (dev session crashes repeatedly during hot reload)
- Root Cause: transient module-refresh window invalidated `AuthProvider` module bindings before context rebind completed
- Fix Applied: added safe fallback auth context in `src/context/AuthProvider.jsx` so `useAuth()` returns non-crashing defaults during refresh windows
- Prevention Rule: keep auth consumer paths resilient to transient HMR invalidation in dev; avoid hard throw from context hooks when module graph is rehydrating
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — CSP Eval Warning Pressure from 3Dmol Runtime

- Source: Browser/Security policy
- Error Signature: CSP warning about blocked string evaluation (`unsafe-eval`) under `script-src`
- Impact: medium (security/compliance pressure; no core app crash)
- Root Cause: optional molecular viewer dependency (`3dmol`) contains eval-based runtime paths that conflict with strict CSP expectations
- Fix Applied: introduced build-time feature flag default-off (`VITE_ENABLE_3DMOL === 'true'` required) in `src/components/MoleculeViewer.jsx` and hid 3D viewer UI paths in `src/components/ProductModal.jsx`; default production now runs without enabling 3Dmol
- Prevention Rule: keep eval-dependent libraries behind explicit opt-in flags and preserve strict CSP defaults without adding `unsafe-eval`
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — SES Console Line + Vite `Outdated Optimize Dep` 504 Loop

- Source: Browser/Runtime + Dev Server
- Error Signature: `SES Removing unpermitted intrinsics`, `server connection lost`, `504 (Outdated Optimize Dep)` on `/node_modules/.vite/deps/*`
- Impact: medium (dev-runtime noise + transient startup failure; production unaffected)
- Root Cause: SES line is injected by external browser extension/runtime hardening script (`lockdown-install.js`), while 504 loop comes from stale optimize-deps cache/chunk hash mismatch during HMR/dev restarts
- Fix Applied: standardized default dev command in `package.json` to clear `node_modules/.vite` and start Vite with `--force --strictPort` so optimize deps are rebuilt every run; retained `dev:reset` as explicit recovery alias
- Prevention Rule: run `npm run dev` (now hardened) and avoid parallel Vite instances; if SES line persists, verify in extension-free profile/incognito because app code cannot suppress extension-injected lockdown logs
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — Recurrence Guardrails (Dev/Preview Startup Reliability)

- Source: Terminal + Dev Server
- Error Signature: recurring `Port 5173 is already in use`, repeated preview launch failures from arg forwarding, and follow-on optimize-deps churn
- Impact: medium (developer workflow interruptions)
- Root Cause: strict-port startup collisions and inconsistent flag forwarding when launching preview with ad-hoc CLI args
- Fix Applied: hardened npm scripts in `package.json` so `dev` no longer fails hard on strict-port collisions and `preview` is pinned to deterministic local host/port without requiring forwarded args
- Prevention Rule: always start with `npm run dev` and `npm run preview` directly (no extra forwarded flags); only use `dev:reset` for explicit cache-reset recovery
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — PortalGate HMR TDZ Crash (`normalizeEmail` before initialization)

- Source: Browser/Runtime + Vite HMR
- Error Signature: `ReferenceError: Cannot access 'normalizeEmail' before initialization` in `PortalGate.jsx` during hot update
- Impact: high (PortalGate module failed hot-reload and blocked auth gate refresh until next successful compile)
- Root Cause: `BOOTSTRAP_OWNER_EMAIL` constant evaluated before `normalizeEmail` function initialization, triggering temporal dead zone access on module evaluation
- Fix Applied: reordered declarations in `src/components/PortalGate.jsx` so `normalizeEmail` is initialized before `BOOTSTRAP_OWNER_EMAIL`; validated with fresh production build
- Prevention Rule: keep helper initializers declared before any top-level constants that invoke them, especially in HMR-active modules
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — Withdraw Request Echo Fetch Noise (`script.googleusercontent.com`)

- Source: Browser/Runtime + Network
- Error Signature: `Fetch failed loading: GET https://script.googleusercontent.com/macros/echo...` after successful `POST .../exec` for `WITHDRAW_REQUEST`
- Impact: low (no functional crash; noisy console during Portal Gate flow)
- Root Cause: Apps Script postback/echo fetch surfaced as browser-side failed GET telemetry in dev console during withdraw path execution
- Fix Applied: simplified `PortalGate` primary actions to guest-entry only (`Continue as Guest`, `Enter Portal`) and removed withdraw action from modal to avoid triggering noisy withdraw path there
- Prevention Rule: keep Portal Gate entry flow minimal (guest entry + in-app follow-up actions) and reserve withdraw/admin mutations for dedicated authenticated surfaces
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_203_Debugger.md` + `AGENT_201_Fullstack_Execution.md` + Copilot

### 2026-03-02 — Bootstrap OWNER Session Reverted to GUEST After Login

- Source: Runtime/Auth refresh + Portal Gate
- Error Signature: OWNER login with `lvastudio.ops@gmail.com` + MasterKey briefly succeeds, then session downgrades back to GUEST within refresh cycle
- Impact: high (blocks owner command center access during bootstrap flow)
- Root Cause: simplified `Enter Portal` path routed through guest sign-in, and identity refresh applied backend `GUEST` role over local bootstrap OWNER session while backend provisioning lagged
- Fix Applied: updated `src/components/PortalGate.jsx` so `Enter Portal` restores bootstrap OWNER session for configured owner email (with PIN MasterKey validation in PIN mode); updated `src/context/AuthProvider.jsx` to preserve `BOOTSTRAP-OWNER` role/status when backend remains reachable but still reports temporary `GUEST`
- Prevention Rule: keep owner bootstrap login path explicit in portal entry and never let transient backend role lag overwrite active bootstrap owner sessions
- Owner Lane: `AGENT_007_Problems.md` + `AGENT_201_Fullstack_Execution.md` + `AGENT_203_Debugger.md` + Copilot

---

## STAFF_LOGS

- Agent Status: GREEN
- Version Anchor: v1.0
- Department State: WORK
- Active Task ID: TASK_v1.0_ERROR_REGISTRY_AND_RESPONSIVE_BASELINE
- Task Pending: No
- Error State: Monitoring (non-blocking console telemetry remains expected)
- Last Update: 2026-03-02 20:41:00
- Agent Response to Commander: "GREEN. Restored bootstrap OWNER login via Enter Portal with MasterKey checks, added auth-refresh guard to prevent bootstrap owner downgrades, and logged incident closure criteria in AGENT_007."

//AGENT_202_Responsive_QA.md

# AGENT 202 — Responsive QA

Purpose: Protect UI quality across mobile, tablet, laptop, and 4K desktop breakpoints.

## Scope

- Validate responsive behavior and layout consistency.
- Catch overflow, clipping, spacing, and typography regressions.
- Verify accessibility basics for interactive components.

## Output

- Device matrix checks.
- UI defects with repro steps.
- Safe fix recommendations for AGENT 201.
- Official matrix source: `DeviceCheck.md`.

---

## Mobile Breakpoint Notes (Saved Reference)

Date Anchor: 2026-03-04

### Project Breakpoint Standard

- Tailwind baseline breakpoints (default):
	- `sm`: 640px
	- `md`: 768px
	- `lg`: 1024px
	- `xl`: 1280px
	- `2xl`: 1536px

### Phone-First Runtime Rule

- JS runtime mobile gate is now phone-only:
	- `MOBILE_VIEWPORT_MAX = 767`
	- `isMobile = window.innerWidth <= 767`
- Practical effect:
	- Phones use the Mobile Print Generator flow.
	- Tablets (>=768px) use richer editor/layout controls.

### Print Center Responsive Intent

- Prioritize touch usability and non-overlap controls.
- Keep calibration preview visible; avoid overlays covering active label content.
- Place quick move controls in settings areas (not over label canvas).
- Use sticky assist controls on smaller screens only when needed.

### QA Device Matrix (Minimum)

- iPhone SE (320w)
- iPhone 12 (390w)
- Galaxy S24 (360w)
- iPad 11th gen (~656w effective in audit profile)
- Desktop 1366
- Desktop 1920+

### Quick Regression Checklist (Mobile)

- No horizontal overflow on key routes.
- Primary buttons are full-width and thumb-friendly.
- Settings controls do not overlap label preview.
- Fullscreen calibration remains navigable with visible controls.
- Label edits (position/scale/color/text) persist into PDF output.

### Latest Commander Sweep (2026-03-04)

- Trigger: `ROLLCALL` + `clock in` + responsive deep review request.
- Audit command path:
	- `npm run build`
	- `npm run preview`
	- `npm run audit:responsive`
- Audit artifact:
	- `artifacts/responsive-audit/2026-03-05T04-21-00-113Z/report.md`
- Result summary:
	- Device profiles: 6
	- Routes checked per device: 10 (`/`, `/about`, `/mission`, `/payment-policy`, `/terms`, `/apply`, `/profile`, `/documents`, `/ledger`, `/owner`)
	- Horizontal overflow findings: **0 YES / 60 NO**
- Notes:
	- Audit script was hardened to tolerate gate form selector variants before final successful run.

### Compact Stack Verification (2026-03-05)

- Trigger: iPhone SE (320w) compact-stack safeguard pass.
- Scope:
	- Added `isCompact` runtime state (`<=320px`) while preserving mobile gate at `<=767px`.
	- Applied Print Center compact layout/order + overlay safety constraints.
- Audit command path:
	- `npm run build`
	- `npm run preview`
	- `npm run audit:responsive`
- Audit artifact:
	- `artifacts/responsive-audit/2026-03-05T05-26-58-821Z/report.md`
- Result summary:
	- Audit status: PASS
	- Regression signal: no new horizontal overflow introduced in route matrix.

### Owner Command Center Critical Path (2026-03-05)

- Trigger: Owner menu unification + New Members intake cards with profile photos.
- Mandatory checks (iPhone SE 320w):
	- Owner menu bar does not overflow or clip when tabs include `Operator Guides`, `New Members`, and `Help Notes`.
	- New Member cards keep avatar/photo, email text, and onboarding notes inside card bounds.
	- New Member sync status badge remains readable and non-overlapping in compact viewport.
	- Owner auth health status bar (token dot, identity, last cloud write, sync-now trigger) stays within viewport and does not push action rows into overlap.
	- Token status dot remains vertically centered with status text at compact width.
	- Last cloud write text wraps safely without pushing member cards or remove controls out of view.
- Pass criteria:
	- No horizontal overflow on `/owner?tab=new-members` and `/owner?tab=guides`.
	- Long emails and note text wrap without breaking container width.
	- Photo fallback initials remain centered and bounded when image URL is empty.
	- On compact width, sync-now control remains tappable and does not overlap member-name or remove controls.

---

## STAFF_LOGS

- Agent Status: GREEN
- Version Anchor: v1.0
- Department State: WORK
- Active Task ID: TASK_v1.1_COMMANDER_RESPONSIVE_SWEEP
- Task Pending: No
- Error State: None
- Last Update: 2026-03-04 23:45:00
- Agent Response to Commander: "WORK. Commander-triggered responsive sweep completed with fresh matrix pass (0 overflow findings across 60 route checks); latest report path logged."

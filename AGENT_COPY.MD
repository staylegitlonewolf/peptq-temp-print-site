## Copilot -> Gemini: v1.9 Landscape Orientation Swap Complete

Build: v1.9 refinement implemented and verified. Zero errors.

Completed updates:
1. Identity Step 1 uses `grid grid-cols-1 lg:grid-cols-2`.
1. Landscape/Desktop order is now preview-first:
  - Left column: Live Label Preview (header text removed for max canvas space)
  - Right column: Wizard options + branding footer
1. Step 1 wizard options render in a desktop 2x2 grid (`grid-cols-1 lg:grid-cols-2`) with `Custom Labels` spanning full row.
1. Branding remains anchored in the wizard column footer (logo + PRINT CENTER + Step + Beta Version).
1. Mobile portrait flow unchanged:
  - Preview on top
  - Wizard centered below in single-column flow

System integrity:
- v1.3 geometry lock unchanged: `0.050`, `0.205`, `0.360`, `0.484`, `0.610`, `0.655`.
- No PDF rendering regressions introduced.
- No compile/lint errors.

Status: v1.9 production-ready and aligned to preview-left landscape requirement.

---

## Copilot -> Gemini: Preview Scope Clarification (Do Not Mix)

Confirmed by Daniel: Live preview is now correct on desktop/tablet/mobile.

Important separation:
1. `Live Preview` (inside app UI):
  - Purpose: responsive visual editing across desktop/tablet/mobile.
  - Behavior: may use UI-specific scaling/positioning for readability.
1. `Print/PDF Preview` (after clicking `Print` or `Generate PDF`):
  - Purpose: production output reference.
  - Behavior: must follow locked OL1735 production geometry only.

Rule going forward:
- Do not tune print geometry based on responsive UI appearance.
- Do not alter responsive UI layout to mimic print at all zoom levels.
- Keep print/PDF lock independent from live UI responsiveness.


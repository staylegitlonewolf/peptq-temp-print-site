//AGENT_240_Docs.md

# AGENT 240 — Docs

<!-- markdownlint-disable MD034 -->

Purpose: Maintain document quality, consistency, and reference integrity across DevKit and client handoff artifacts.

Canonical Authority: this file is the single source of truth for all technical links and documentation references used by the DevKit.

Mirror Policy:

- `Options/docsIndex.md` is a legacy mirror for compatibility.
- New links and updates must be applied here first (`AGENT_240_Docs.md`).
- If mirrored, keep structure and wording aligned 1:1.


## PEPTQ Phase 2: Technical Intelligence Index

Use this index as the documentation-first map before implementing fixes or features.

## Priority 0: Workspace Audit & Notes Hub (v12.28)

- Single-folder notes organizer:
  - `FORdev/Notes_Hub/README.md`
- Runtime placement audit (backend/frontend + vault tabs):
  - `FORdev/Notes_Hub/Runtime_Audit_v12.28.md`
- Duplicate knowledge review and retention decisions:
  - `FORdev/Notes_Hub/Duplicate_Knowledge_Decisions_v12.28.md`

## Priority 1: The Isolated Print (DBG-002)

- Window Logic:
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/open
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/print
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint_event
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeprint_event
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/close
- Print CSS:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@media
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@page
- Break Control:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/break-before
  - https://developer.mozilla.org/en-US/docs/Web/CSS/break-after
  - https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust

## Priority 2: The Google Backend (Command Router)

- Web Apps:
  - https://developers.google.com/apps-script/guides/web
  - https://developers.google.com/apps-script/guides/web#deploying_a_script_as_a_web_app
  - https://developers.google.com/apps-script/guides/web#request_parameters
- Sheets API (Apps Script Spreadsheet service):
  - https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- Quotas and reliability:
  - https://developers.google.com/apps-script/guides/services/quotas
  - https://developers.google.com/apps-script/guides/support/best-practices
- Trigger Logic:
  - https://developers.google.com/apps-script/guides/triggers/installable

## Priority 2.5: Google 2026 Compliance Registry (AI-First + Zero-Trust)

Keep this block intact for PEPTQ command-router integrity, vault consistency, and security hardening.

### 1) Google Apps Script (The Command Router)

- Web App Implementation (doPost/doGet contract):
  - https://developers.google.com/apps-script/guides/web
- V8 Runtime Migration (Rhino deprecation path):
  - https://developers.google.com/apps-script/guides/v8-runtime/migration
- Vertex AI Integration (advanced service):
  - https://developers.google.com/apps-script/advanced

### 2) Google Sheets API (The 5-Vault Data Hub)

- REST API Overview (Spreadsheet IDs + A1 notation):
  - https://developers.google.com/workspace/sheets/api/guides/concepts
- Batch Update Best Practices:
  - https://developers.google.com/workspace/sheets/api/guides/batchupdate
- WriteControl / State Consistency:
  - https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate

### 3) Google Drive API (Asset & Photo Governance)

- Files & Folders Resource:
  - https://developers.google.com/workspace/drive/api/reference/rest/v3/files
- Permissions & Limited Access:
  - https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions

### 4) Identity & Security (The Legal Shield)

- Google Identity Services (GIS) for Web:
  - https://developers.google.com/identity/gsi/web
- Google Workspace Security Baseline:
  - https://support.google.com/a/topic/7570170

### 5) AI-Assisted Development (The Handshake)

- Model Context Protocol (MCP):
  - https://modelcontextprotocol.io/introduction

## Priority 2.75: OCC Runtime Security & Reliability (Governance Seal)

Use this block for Owner Command Center (OCC) changes that touch identity, command routing, environment configuration, or bridge stability.

### Apps Script V8 Runtime Constraints (Backend)

- V8 runtime overview and behavior:
  - https://developers.google.com/apps-script/guides/v8-runtime
- Migration and compatibility caveats:
  - https://developers.google.com/apps-script/guides/v8-runtime/migration
- Web app execution model and request handling:
  - https://developers.google.com/apps-script/guides/web
- Quotas, limits, and resilience planning:
  - https://developers.google.com/apps-script/guides/services/quotas
  - https://developers.google.com/apps-script/guides/support/best-practices

### Vite Environment Security (Frontend)

- Env variable model and exposure rules (`VITE_*` only):
  - https://vite.dev/guide/env-and-mode
- Build-time replacement semantics and safety notes:
  - https://vite.dev/guide/env-and-mode#env-variables

### OCC Governance Notes

- Never place secrets in frontend env variables; treat all `VITE_*` values as public.
- Keep command payload compatibility stable (`actor_email`, command names, and role constants).
- For Apps Script bridge flows, preserve existing no-cors queue architecture unless explicitly redesigned.

## Priority 3: The 3D and Data Visuals

- 3D Rendering:
  - https://3dmol.org/doc/
- Firebase Core Docs:
  - https://firebase.google.com/docs?hl=en-US&authuser=0
- Tailwind Layouts:
  - https://tailwindcss.com/docs/responsive-design
  - https://tailwindcss.com/docs/dark-mode
  - https://tailwindcss.com/docs/adding-custom-styles
  - https://tailwindcss.com/docs/hover-focus-and-other-states
  - https://tailwindcss.com/docs/breakpoints
  - https://tailwindcss.com/docs/width
  - https://tailwindcss.com/docs/max-width
- Vite Env:
  - https://vite.dev/guide/env-and-mode

## Priority 4: React Core Reference (State, Hooks, Escape Hatches)

- React API overview:
  - https://react.dev/reference/react
  - https://react.dev/reference/react/hooks
- Built-in Hooks (core set for this repo):
  - https://react.dev/reference/react/useState
  - https://react.dev/reference/react/useReducer
  - https://react.dev/reference/react/useEffect
  - https://react.dev/reference/react/useLayoutEffect
  - https://react.dev/reference/react/useRef
  - https://react.dev/reference/react/useCallback
  - https://react.dev/reference/react/useMemo
  - https://react.dev/reference/react/useTransition
  - https://react.dev/reference/react/useDeferredValue
  - https://react.dev/reference/react/useSyncExternalStore
  - https://react.dev/reference/react/useId
- Built-in Components:
  - https://react.dev/reference/react/Fragment
  - https://react.dev/reference/react/Suspense
  - https://react.dev/reference/react/StrictMode
- Core React APIs:
  - https://react.dev/reference/react/createElement
  - https://react.dev/reference/react/cloneElement
  - https://react.dev/reference/react/isValidElement
  - https://react.dev/reference/react/createRef
  - https://react.dev/reference/react/forwardRef
  - https://react.dev/reference/react/Component
  - https://react.dev/reference/react/PureComponent
- React DOM references:
  - https://react.dev/reference/react-dom/components
  - https://react.dev/reference/react-dom/client
  - https://react.dev/reference/react-dom/server

## Priority 5: React Router (Navigation + URL State)

- Router overview:
  - https://reactrouter.com/en/main
- Data APIs:
  - https://reactrouter.com/en/main/route/loader
  - https://reactrouter.com/en/main/route/action
- Navigation/state hooks:
  - https://reactrouter.com/en/main/hooks/useNavigate
  - https://reactrouter.com/en/main/hooks/useLocation
  - https://reactrouter.com/en/main/hooks/useSearchParams
  - https://reactrouter.com/en/main/components/navigate

## Priority 6: Linting, Testing, and Runtime Quality

- React Hooks linting:
  - https://react.dev/reference/eslint-plugin-react-hooks
  - https://www.npmjs.com/package/eslint-plugin-react-hooks
- Vitest:
  - https://vitest.dev/guide/
  - https://vitest.dev/guide/mocking.html
  - https://vitest.dev/guide/browser/
- Jest (if used in a path/module):
  - https://jestjs.io/docs/getting-started
  - https://jestjs.io/docs/mock-functions

## Priority 7: Performance and Accessibility

- Web performance:
  - https://developer.mozilla.org/en-US/docs/Web/Performance
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading
- Modal accessibility:
  - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## Priority 8: PubChem Operational Reference

- Programmatic access overview:
  - https://pubchem.ncbi.nlm.nih.gov/docs/programmatic-access
- PUG REST reference:
  - https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
- PUG REST tutorial:
  - https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest-tutorial
- Dynamic throttling policy:
  - https://pubchem.ncbi.nlm.nih.gov/docs/dynamic-request-throttling

## Documentation-First Prompting Pattern

When requesting implementation work, lead with:

Referencing the Priority 1 docs in our index, implement the isolated window print pattern for the Product Modal.

For state/effect changes, add:

Reference Priority 4 React docs for Hook dependencies and state ownership decisions before implementing.

For modal, routing, or print behavior, add:

Reference Priority 1, Priority 5, and Priority 7 docs to prevent UI drift, race conditions, and accessibility regressions.

This enforces standard patterns and reduces layout regressions and technical debt.

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

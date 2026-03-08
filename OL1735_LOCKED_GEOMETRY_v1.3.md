# OL1735 Locked Label Geometry – Production Reference
**Status:** FINAL LOCKED v1.3 (Optical Centering Final)
**Date:** 2026-03-03
**Tested:** 48-up sheet print, 100% scale, zero drift confirmed

---

## Template Guides

**Status:** DISABLED (set border stroke to 0)

---

## Design Grid (Safe Zone)

| Metric | Value |
|--------|-------|
| **Design Height** | 0.75" |
| **Design Width** | 1.75" |
| **Safe Margins** | 0.05" (all sides) |
| **Horizontal Center** | 0.875" |

---

## Three-Zone Locked Layout (v1.3)

### Zone 1: PEPTQ Logo & Brand

| Space | Y-Start | Height | Notes |
|-------|---------|--------|-------|
| **Logo** | 0.050" | 0.120" | Top flush, 0.05" from edge |
| **Icon** | 0.050" | 0.120" | Molecular icon left of text |

**Element:** PEPTQ logo (centered or icon-left as per client reference image).
**Color:** #1F3A5F (navy) or black per client preference.

---

### Zone 2: Product & Strength (Central High-Contrast)

| Space | Y-Start | Height | Width | Notes |
|-------|---------|--------|-------|-------|
| **Navy Band** | 0.205" | 0.120" | 1.65" | Product name anchor |
| **Strength** | 0.360" | 0.100" | 1.65" | High-visibility white space |

**Product Name:** 8pt Montserrat bold, white, centered in navy band (final optical lock `productTextY: 0.289`).
**Strength Text:** 7pt Montserrat normal, navy/black, centered in white space.

---

### Zone 3: Purity & Compliance Footer

| Space | Y-Start | Height | Width | Notes |
|-------|---------|--------|-------|-------|
| **Orange Band** | 0.484" | 0.100" | 1.65" | Purity statement |
| **Legal/Temp** | 0.610" | 0.120" | 1.65" | Center-justified footer |

**Orange Band Text:** "Purity ≥99% (HPLC-verified)" / "Purity ≥99% (HPLC-DAD)" in PDF-safe mode (5.1pt white, final lock `purityTextY: 0.555`).
**Line 1:** "FOR RESEARCH USE ONLY" (4.5pt).
**Line 2:** "STORE AT 2–8°C" (4.5pt).

**Optional Bottom Line:** Decorative navy bottom line can remain enabled/disabled via settings toggle.

---

## Physical Specification (Die-Cut)

| Metric | Value |
|--------|-------|
| **Width** | 1.75" |
| **Height** | 0.75" (physical die-cut) |
| **Labels per Sheet** | 48 (4 cols × 12 rows) |
| **Sheet Size** | 8.5" × 11" (US Letter) |

---

## Vertical Layout Summary

```text
Physical Die-Cut Height: 0.75" ═══════════════════════════════════════════════════
                                                                                  │
Position (Inches)        Element                                                  │
─────────────────────────────────────────────────────────────────────────────────  │
0.050" ────────────────► ▌ PEPTQ LOGO (Molecular Icon + Text)                      │
                         │ (height: 0.120")                                       │
──────────────────────────────────────────────────────────────────────────────────┘
0.205" ────────────────► ▌ NAVY BAND (Product Name: BPC-157)                      │
                         │ (height: 0.120")                                       │
──────────────────────────────────────────────────────────────────────────────────┘
0.360" ────────────────► ▌ STRENGTH TEXT (e.g., 10 mg)                             │
                         │ (Centered, Dark Text)                                  │
──────────────────────────────────────────────────────────────────────────────────┘
0.484" ────────────────► ▌ ORANGE BAND (Purity ≥99% (HPLC-verified))              │
                         │ (height: 0.100")                                       │
──────────────────────────────────────────────────────────────────────────────────┘
0.610" ────────────────► ▌ COMPLIANCE FOOTER (2 Lines)                            │
                         │ (For Research Use Only / Store at 2-8°C)               │
──────────────────────────────────────────────────────────────────────────────────┘
                         │ Bottom Margin (Safe Zone)                              │
                         ↓
                         Total: 0.75" (Physical Label)
```

---

## Rendering Guarantees

✅ **Zero Border Policy:** No stroke or black lines rendered on label edges.
✅ **Scale Lock:** Standard 8.5" × 11" PDF generation only.
✅ **Typography:** Montserrat (bold for product, normal for purity/footer).
✅ **Deterministic Placement:** Absolute coordinates, no cumulative drift.
✅ **Optional Bottom Line:** Decorative line may be enabled/disabled via settings.

---

## Production Colors

| Element | Hex | Purpose |
|---------|-----|---------|
| **Primary Navy** | #1F3A5F | Brand identity / product band |
| **Secondary Orange** | #F76D00 | Purity bar |
| **Neutral Dark** | #000000 | Strength & footer text |

---

## Implementation Files

- **Layout Constants:** `src/constants/labelLayout.js` (dual-layer zones)
- **Renderer:** `src/pages/PrintCenterPage.jsx` (drawLabel function + preview components)
- **Colors:** `src/constants/labelTheme.js` (RGB palette + logo asset path)

---

## Optional Next Step

Would you like to generate an updated product JSON data array to verify client-facing spelling and dosage values?

---

## Testing Checklist (✅ All Passed)

- [x] Rows 1, 6, 12 printed cleanly without overlap
- [x] Logo zone remains clear and centered (no collision with product band)
- [x] Navy product band contains product name with high contrast and no clipping
- [x] Strength text remains centered in white space between navy and orange bands
- [x] Orange purity band text remains fully contained and legible
- [x] Footer lines remain centered and fully contained below orange band
- [x] Bottom row not clipped into margin
- [x] Top rows not crowded (0.056" spacing adequate)
- [x] No Y-drift across 48-label sheet
- [x] All major elements properly centered (0.875" horizontal center)

---

## Production Lock Statement

**This layout is locked for production use.** All zones, colors, and coordinates are final. Future updates to label content (product names, purity claims) do not require geometry changes. The absolute positioning grid ensures deterministic, reproducible output across unlimited print batches.

**Engineer:** GitHub Copilot
**Date Locked:** 2026-03-03
**Status:** PRODUCTION READY (v1.3)


≥99% Purity (HPLC-DAD)
≥99% Purity (HPLC-VERIFIED)

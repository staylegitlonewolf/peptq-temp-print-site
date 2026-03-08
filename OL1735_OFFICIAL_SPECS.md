# OL1735 Official Specifications
**Source:** https://www.onlinelabels.com/templates/blank/ol1735#detailed-specs
**Date Saved:** 2026-03-02

---

## Quick Specifications

| Metric | Value |
|--------|-------|
| **Sheet Size** | 8.5" × 11" (US Letter) |
| **Label Size** | 1.75" × **0.75"** |
| **Labels Per Sheet** | 48 (4 columns × 12 rows) |

---

## Detailed Template Specifications

| Description | Value |
|-------------|-------|
| **Width** | 1.75" |
| **Height** | **0.75"** |
| **Top Margin** | 0.25" |
| **Bottom Margin** | 0.25" |
| **Left Margin** | 0.25" |
| **Right Margin** | 0.25" |
| **Horizontal Spacing** | 0.333" |
| **Vertical Spacing** | 0.136" |
| **Horizontal Pitch** | 2.083" |
| **Vertical Pitch** | 0.886" |

---

## Grid Layout Calculation

- **Columns:** 4 (each 1.75" wide + 0.333" spacing)
- **Rows:** 12 (each 0.75" tall + 0.136" spacing)
- **Total label area per cell:** 1.75" × 0.75" = **0.1875 sq in**

---

## Key Findings

### ⚠️ CRITICAL DISCREPANCY DETECTED
- **Previously used in code:** 0.667" height
- **Official OnlineLabels spec:** **0.75" height**
- **Difference:** +0.083" (approximately +6 points)

This additional 0.083" provides more vertical breathing room than previously configured. The absolute positioning layout (Y: 0.05→0.18→0.38→0.58) should still fit within the 0.75" constraint with comfortable margins.

---

## Recommendations

1. **Update OL1735_SPECS constant** in code to use 0.75" instead of 0.667"
2. **Verify calibration values** after width change (may need Y-offset adjustment)
3. **Retest print** at 100% scale after specs correction
4. **Lock to OnlineLabels reference template** for future updates

---

## Official Reference

- **Template:** OL1735 - Blank Label Template
- **Format:** 1.75" × 0.75"
- **Provider:** OnlineLabels, LLC
- **Available Downloads:**
  - PDF Template (.pdf)
  - Microsoft Word Template (.doc, .docx)
  - OpenOffice Template (.ott)
  - Google Docs™ Add-On

For paper stock and bulk orders, visit: https://www.onlinelabels.com/blank-labels

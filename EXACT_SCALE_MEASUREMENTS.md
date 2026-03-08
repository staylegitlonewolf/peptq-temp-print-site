# Print Center System Default Layout - EXACT SCALE MEASUREMENTS

## Label Container Architecture
**Location:** PrintCenterPage.jsx lines 3210-3213 (Canvas Editor) & 3234-3238 (Design Preview)

### Container Dimensions
- **Outer Container Height:** `min-h-[450px]` (desktop) or `min-h-[360px]` (compact)
- **Label Card Width:** `w-[260px]` (fixed)
- **Label Card Height:** `h-[120px]` (min height)
- **Label Border:** `border-2 border-black` (when showBorders enabled)
- **Label Rounded:** `rounded-xl` (default border-radius)
- **Label Background:** `bg-white`

---

## Typography Base Font Sizes (in System Default)
All typography is rendered **without scaling** at the canvas level. The base font sizes are:

| Element | CSS Font Size | Base Px | Note |
|---------|---------------|---------|------|
| **Product Title** | `${9 * elementScale.productTitle}px` | **9px** | Montserrat Bold, navy band text |
| **Dosage Text** | `${8 * elementScale.dosage}px` | **8px** | Montserrat, centered |
| **Purity Text** | `${7 * elementScale.purity}px` | **7px** | Font Bold, orange band text |
| **Legal Text** | `${7 * elementScale.footer}px` | **7px** | Leading 1.2 |
| **Storage Text** | `${7 * elementScale.footer}px` | **7px** | Leading 1.2 |

---

## Product Title (Navy Band)
```jsx
fontSize: `${9 * elementScale.productTitle}px`
fontFamily: "Montserrat"
fontWeight: "bold"
backgroundColor: navy color from branding
color: white
padding: left-[8px] right-[8px]
height: toLabelPercent(currentLayout.navyBandHeight)
borderRadius: ${navyBandRadiusPx}px
lineClamp: 1
textAlign: center
```

---

## Dosage Text
```jsx
fontSize: `${8 * elementScale.dosage}px`
fontFamily: "Montserrat"
color: custom dosageTextHex color
lineHeight: "tight"
textAlign: center
whiteSpace: "nowrap"
positioned at: toLabelPercent(currentLayout.dosageTextY)
```

---

## Purity Band
```jsx
fontSize: `${7 * elementScale.purity}px`
fontWeight: "bold"
backgroundColor: orange color from branding
color: white
padding: px-2 (8px horizontal)
height: toLabelPercent(currentLayout.purityBandHeight)
borderRadius: ${purityBandRadiusPx}px
lineClamp: 1
textAlign: center
positioned at: toLabelPercent(currentLayout.purityBandY)
```

---

## Legal & Storage Text
```jsx
fontSize: `${7 * elementScale.footer}px` (both use same size)
fontFamily: "default" (sans-serif)
lineHeight: "1.2"
color: custom footerTextHex color
textAlign: center
whiteSpace: "nowrap"
positioned at: toLabelPercent(currentLayout.legalTextY) and toLabelPercent(currentLayout.storageTextY)
```

---

## Scaling in Design Preview Section (lines 3234-3238)
The System Default layout applies **container-level scaling** in design preview:
- **Compact Mode:** `scale-[1.1]`
- **Desktop (default):** `scale-[1.5]`
- **Tablet (md):** `scale-[2]`
- **Large (lg):** `scale-[2.5]`

This scaling is applied to the entire label card container via CSS transform, not individual elements.

---

## Logo Positioning
- **Image Height:** `h-4` (16px at normal size)
- **Position:** Top of label, centered horizontally
- **Y Offset:** `toLabelPercent(currentLayout.logoY)` (default 0.05 = 5% from top)
- **Scale:** `scale(${elementScale.logo})`

---

## SOLO APP SCALE RATIO
Print Center label: **260px × 120px**
Solo app label: **380px × 180px**

**Scale Factor:** 380/260 = **1.46x width**, 180/120 = **1.5x height**
**Average Scale:** **1.48x**

For typography proportionality:
- Product (9px base): 9 × 1.46 = **13.14px** (currently 14px)
- Dosage (8px base): 8 × 1.46 = **11.68px** (currently 12px)
- Purity (7px base): 7 × 1.46 = **10.22px** (currently 11px)
- Legal/Storage (7px base): 7 × 1.46 = **10.22px** (currently 9px)

---

## KEY PROPORTIONS & Y-POSITIONS IN TEMPLATE
From LABEL_TEMPLATE constants:
- **logoY:** 0.05 (5% from top)
- **navyBandY:** 0.205 (20.5%)
- **dosageTextY:** 0.435 (43.5%)
- **purityBandY:** 0.484 (48.4%)
- **legalTextY:** 0.655 (65.5%)
- **storageTextY:** 0.730 (73%)

When scaling the label to 180px height:
- 180 × 0.05 = 9px (logo)
- 180 × 0.205 = 36.9px (navy band start)
- 180 × 0.435 = 78.3px (dosage)
- 180 × 0.484 = 87.1px (purity band start)
- 180 × 0.655 = 117.9px (legal text)
- 180 × 0.730 = 131.4px (storage text)

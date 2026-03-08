// OL1735 Specifications: 4 columns × 12 rows = 48 labels per sheet
// Label size: 1.75" × 0.75" (official OL1735)
// Sheet size: 8.5" × 11" (letter)
export const OL1735_SPECS = {
  pageWidth: 8.5,
  pageHeight: 11,
  cols: 4,
  rows: 12,
  labelWidth: 1.75,
  labelHeight: 0.75,
  marginLeft: 0.25,
  marginTop: 0.25,
  horizontalGap: 0.333,
  verticalGap: 0.136,
};

export const LABELS_PER_SHEET = OL1735_SPECS.cols * OL1735_SPECS.rows;

export const OL1735_TEMPLATE_SPECS = Object.freeze([
  { label: 'Sheet Size', value: '8.5 x 11 in' },
  { label: 'Labels Per Sheet', value: '48' },
  { label: 'Width', value: '1.75 in' },
  { label: 'Height', value: '0.75 in' },
  { label: 'Top Margin', value: '0.25 in' },
  { label: 'Bottom Margin', value: '0.25 in' },
  { label: 'Left Margin', value: '0.25 in' },
  { label: 'Right Margin', value: '0.25 in' },
  { label: 'Horizontal Spacing', value: '0.333 in' },
  { label: 'Vertical Spacing', value: '0.136 in' },
  { label: 'Horizontal Pitch', value: '2.083 in' },
  { label: 'Vertical Pitch', value: '0.886 in' },
]);

export const BRAND_HEADER_TEXT = 'PEPTQ';
export const DEFAULT_PURITY_METHOD = 'HPLC-verified';
export const LEGAL_USE_TEXT = 'FOR RESEARCH USE ONLY';
export const STORAGE_TEXT = 'STORE AT 2–8°C';
export const DEFAULT_PRIMARY_HEX = '#1F3A5F';
export const DEFAULT_SECONDARY_HEX = '#F76D00';

export const BATCH_CORRECTION_TABLE = Object.freeze([
  { from: '5.AMINO MO', to: '5-AMINO-1MQ', dosage: '10 mg' },
  { from: 'SEMAY', to: 'SEMAX', dosage: '10 mg' },
  { from: 'SERMOBELLIN', to: 'SERMORELIN', dosage: '10 mg' },
  { from: 'KISSDEDTIN', to: 'KISSPEPTIN', dosage: '10 mg' },
  { from: 'TR/BBC', to: 'TB/BPC Blend', dosage: '20 mg' },
]);

export const BATCH_CORRECTION_MAP = Object.freeze(
  BATCH_CORRECTION_TABLE.reduce((acc, entry) => {
    acc[entry.from] = { name: entry.to, dosage: entry.dosage };
    return acc;
  }, {}),
);

/**
 * 🔒 PRODUCTION GEOMETRY LOCK [v1.4] 🔒
 * DO NOT MODIFY THESE COORDINATES.
 * These values represent the exact absolute physical boundaries for the OL1735 die-cut.
 * Text elements inside colored bands are now mathematically anchored to the true geometric
 * center of the bands using `baseline: 'middle'`.
 * Changing band heights will automatically re-center the text.
 * Changing Y-coordinates will cause printer bleed.
 */
export const LABEL_TEMPLATE = Object.freeze({
  logoY: 0.05,
  navyBandY: 0.205,
  navyBandHeight: 0.12,
  productTextY: 0.289,
  dosageTextY: 0.360,
  purityBandY: 0.484,
  purityBandHeight: 0.1,
  purityTextY: 0.555,
  legalTextY: 0.610,
  storageTextY: 0.655,
});

export const PDF_TEXT_NUDGE_UP = 0.015;
export const DANGER_MIN_Y = 0.02;
export const DANGER_MAX_Y = 0.73;
export const JUMBO_DRAG_SCALE = 2.5;
export const CSS_PIXELS_PER_INCH = 96;
export const PHYSICAL_INCH_PX = OL1735_SPECS.labelWidth * CSS_PIXELS_PER_INCH;

const SYMBOL_PROFILES = Object.freeze({
  narrow: Object.freeze({
    upperOffset: -0.011,
    lowerOffset: 0.011,
    barOffset: 0.016,
  }),
  balanced: Object.freeze({
    upperOffset: -0.009,
    lowerOffset: 0.009,
    barOffset: 0.013,
  }),
  sharp: Object.freeze({
    upperOffset: -0.012,
    lowerOffset: 0.012,
    barOffset: 0.017,
  }),
});

export function renderGreaterThanOrEqualSymbol(doc, options) {
  const {
    left,
    right,
    midY,
    lineWidth = 0.0028,
    color = [255, 255, 255],
    profile = 'narrow',
    baselineAdjust = 0,
    barLengthScale = 1,
    barDrop = 0,
  } = options;

  const activeProfile = SYMBOL_PROFILES[profile] || SYMBOL_PROFILES.narrow;
  const { upperOffset, lowerOffset, barOffset } = activeProfile;

  const alignedMidY = midY + baselineAdjust;
  const geUpperY = alignedMidY + upperOffset;
  const geLowerY = alignedMidY + lowerOffset;
  const geBarY = alignedMidY + barOffset + barDrop;
  const symbolWidth = right - left;
  const barHalfExtra = Math.max(0, (barLengthScale - 1) * symbolWidth * 0.5);
  const barLeft = left - barHalfExtra;
  const barRight = right + barHalfExtra;

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(lineWidth);
  if (typeof doc.setLineCap === 'function') doc.setLineCap('round');
  if (typeof doc.setLineJoin === 'function') doc.setLineJoin('round');
  doc.line(left, geUpperY, right, alignedMidY);
  doc.line(left, geLowerY, right, alignedMidY);
  doc.line(barLeft, geBarY, barRight, geBarY);
}

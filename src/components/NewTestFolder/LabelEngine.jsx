import { jsPDF } from 'jspdf';
import { LABEL_THEME_RGB } from '../../constants/labelTheme';
import { LABEL_TEMPLATE, LEGAL_USE_TEXT, STORAGE_TEXT } from '../../constants/printCalibration';

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

const LOGO_WIDTH_IN = 0.74;
const LOGO_HEIGHT_IN = 0.18;

const truncate = (value, max = 32) => {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const resolveVerification = (product) => {
  const raw = String(product?.verification || product?.hplc || product?.quality || '').toUpperCase();
  return raw.includes('DAD') ? 'HPLC-DAD Verified' : 'HPLC Verified';
};

/**
 * Maps standard output metadata to LVA Studio's internal schema requirements.
 * Schema Fields: Product ID, Purity Method, Batch ID
 */
export const ensureHeaders_ = (labels) => {
  return labels.map((lbl, idx) => ({
    lva_product_id: lbl.id || `UNKNOWN-${idx}`,
    lva_purity_method: resolveVerification({ verification: lbl.verification }),
    lva_batch_id: lbl.lot || 'LOT-TEST-001',
    lva_strength: lbl.strength,
    lva_exported_at: new Date().toISOString(),
  }));
};

export const buildLabels = ({ products, selectedProducts }) => {
  const selectedIds = Object.keys(selectedProducts || {}).filter((id) => selectedProducts[id]);

  return selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean)
    .map((product) => ({
      id: product.id,
      name: product.name || '',
      strength: product.strength || '',
      purity: product.purity || '',
      cas: product.cas || '',
      lot: product.lot || 'LOT-TEST-001',
      verification: resolveVerification(product),
    }));
};

const drawLabel = ({ doc, label, x, y, showBorders, logoDataUri }) => {
  const { labelWidth, labelHeight } = OL1735_SPECS;
  const brandBlue = LABEL_THEME_RGB.brandBlue;
  const actionOrange = LABEL_THEME_RGB.actionOrange;
  const neutralSlate = LABEL_THEME_RGB.neutralSlate;

  if (showBorders) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.0035);
    doc.rect(x, y, labelWidth, labelHeight);
  }

  // Zone 1: Logo
  if (logoDataUri) {
    const centeredX = x + (labelWidth - LOGO_WIDTH_IN) / 2;
    doc.addImage(logoDataUri, 'PNG', centeredX, y + LABEL_TEMPLATE.logoY, LOGO_WIDTH_IN, LOGO_HEIGHT_IN);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...brandBlue);
    doc.text('PEPTQ', x + labelWidth / 2, y + LABEL_TEMPLATE.logoY + 0.06, { align: 'center' });
  }

  // Zone 2: Product Name (Navy Band)
  const navyY = y + LABEL_TEMPLATE.navyBandY;
  const navyH = LABEL_TEMPLATE.navyBandHeight;
  const padH = 0.05; // 0.05" margin on sides
  doc.setFillColor(...brandBlue);
  doc.roundedRect(x + padH, navyY, labelWidth - (padH * 2), navyH, 0.02, 0.02, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8); // 8pt Montserrat bold logic
  doc.text(truncate(label.name, 26).toUpperCase(), x + labelWidth / 2, navyY + (navyH / 2), { align: 'center', baseline: 'middle' });

  // Zone 2.5: Strength Text
  doc.setTextColor(...neutralSlate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${label.strength}`, x + labelWidth / 2, y + LABEL_TEMPLATE.dosageTextY, { align: 'center' });

  // Zone 3: Purity Band
  const purityY = y + LABEL_TEMPLATE.purityBandY;
  const purityH = LABEL_TEMPLATE.purityBandHeight;
  doc.setFillColor(...actionOrange);
  doc.roundedRect(x + padH, purityY, labelWidth - (padH * 2), purityH, 0.05, 0.05, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.1);
  const purityLabel = `Purity: ${label.purity} (${label.verification})`;
  doc.text(purityLabel, x + labelWidth / 2, purityY + (purityH / 2), { align: 'center', baseline: 'middle' });

  // Compliance Footer
  doc.setFontSize(4.5);
  doc.setTextColor(...neutralSlate);
  doc.setFont('helvetica', 'normal');
  doc.text(LEGAL_USE_TEXT, x + labelWidth / 2, y + LABEL_TEMPLATE.legalTextY, { align: 'center' });
  doc.text(STORAGE_TEXT, x + labelWidth / 2, y + LABEL_TEMPLATE.storageTextY, { align: 'center' });
};

export const generateLabelPdf = ({ labels, showBorders, calibrationX, calibrationY, logoDataUri }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  const labelsPerPage = OL1735_SPECS.cols * OL1735_SPECS.rows;
  const totalPages = Math.ceil(labels.length / labelsPerPage);

  for (let page = 0; page < totalPages; page += 1) {
    if (page > 0) {
      doc.addPage();
    }

    const startIndex = page * labelsPerPage;
    const endIndex = Math.min(startIndex + labelsPerPage, labels.length);

    for (let index = startIndex; index < endIndex; index += 1) {
      const sheetIndex = index - startIndex;
      const row = Math.floor(sheetIndex / OL1735_SPECS.cols);
      const col = sheetIndex % OL1735_SPECS.cols;

      const x =
        OL1735_SPECS.marginLeft +
        col * (OL1735_SPECS.labelWidth + OL1735_SPECS.horizontalGap) +
        calibrationX / 100;
      const y =
        OL1735_SPECS.marginTop +
        row * (OL1735_SPECS.labelHeight + OL1735_SPECS.verticalGap) +
        calibrationY / 100;

      drawLabel({
        doc,
        label: labels[index],
        x,
        y,
        showBorders,
        logoDataUri,
      });
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  doc.save(`PEPTQ_Test_Labels_${timestamp}.pdf`);
};

export const loadLogoDataUri = async (logoUrl) => {
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error('Unable to load logo image.');
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to convert logo to Data URI.'));
    reader.readAsDataURL(blob);
  });
};

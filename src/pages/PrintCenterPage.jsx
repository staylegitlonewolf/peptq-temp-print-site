import { useMemo, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  Grid3x3,
  Layers3,
  Paintbrush2,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  TestTube2,
  FolderOpen,
  Copy,
  Trash2,
  Upload,
} from 'lucide-react';
import catalog from '../data/catalog.json';
import { renderGreaterThanOrEqualSymbol } from '../utils/pdfSymbols';
import {
  BRAND_HEADER_TEXT,
  OL1735_SPECS,
  LABELS_PER_SHEET,
  OL1735_TEMPLATE_SPECS,
  LABEL_TEMPLATE,
  LEGAL_USE_TEXT,
  STORAGE_TEXT,
  DEFAULT_PRIMARY_HEX,
  DEFAULT_SECONDARY_HEX,
} from '../constants/printCalibration';
import { LABEL_LOGO_URL } from '../constants/labelTheme';
import { APPS_SCRIPT_COMMAND_URL } from '../services/api';

const LOGO_ONLY_SLOT_ID = '__logo_only__';
const LOGO_IMAGE_URL = LABEL_LOGO_URL;
const PRINT_CENTER_LAYOUTS_KEY = 'printCenterLayouts';
const CALIB_STORAGE_KEY = 'printCenterCalibration';
const CUSTOM_PRODUCTS_KEY = 'printCenterCustomProducts';
const createEmptySheet = () => Array(LABELS_PER_SHEET).fill('');
const createEmptyPurityModes = () => Array(LABELS_PER_SHEET).fill(null);

const DEFAULT_STYLE = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  widthPercent: 94,
  heightPercent: 60,
  cornerRadius: 0,
  logoScale: 0.92,
  bandCornerScale: 1,
  productNameScale: 1,
  productLetterSpacingScale: 1,
  dosageScale: 1,
  purityScale: 1,
  purityLetterSpacingScale: 1,
  textWrapperScale: 1,
  legalTextScale: 1,
  legalLetterSpacingScale: 1,
  storageTextScale: 1,
  storageLetterSpacingScale: 1,
  primaryColor: DEFAULT_PRIMARY_HEX,
  secondaryColor: DEFAULT_SECONDARY_HEX,
});

const PRINT_CENTER_CANVAS_SCALE = 380 / 260;
const ELEMENT_SCALE = {
  logo: PRINT_CENTER_CANVAS_SCALE,
  productTitle: PRINT_CENTER_CANVAS_SCALE,
  dosage: PRINT_CENTER_CANVAS_SCALE,
  purity: PRINT_CENTER_CANVAS_SCALE,
  footer: PRINT_CENTER_CANVAS_SCALE,
};

const BASE_FONT_SIZES = {
  productTitle: 9,
  dosage: 8,
  purity: 7,
  footer: 7,
};

const PDF_SYMBOL_PROFILES = new Set(['narrow', 'balanced', 'sharp']);
const FIXED_CONTAINER_HEIGHT_PERCENT = 60;
const FIXED_CONTAINER_CORNER_RADIUS = 0;
const DANGER_ZONE_PX = 2;
const MAX_SAFE_WIDTH_PERCENT = ((380 - DANGER_ZONE_PX * 2) / 380) * 100;
const FULLSCREEN_CALIB_SCALE = 2.0;
const FULLSCREEN_CALIB_BASE_HEIGHT_PX = 180;
const FULLSCREEN_CALIB_BASE_WIDTH_PX = 380;
const FULLSCREEN_CALIB_HEIGHT_PX = FULLSCREEN_CALIB_BASE_HEIGHT_PX * FULLSCREEN_CALIB_SCALE;
const FULLSCREEN_CALIB_WIDTH_PX = FULLSCREEN_CALIB_BASE_WIDTH_PX * FULLSCREEN_CALIB_SCALE;

// v2.8 visual patch anchors (PEPTRx style): larger logo, thicker navy band, and balanced vertical stack.
const V28_LOGO_TOP_MARGIN_IN = 0.02;
const V28_VERTICAL_REBALANCE_IN = 0.008;
const V28_Navy_BAND_HEIGHT_IN = 0.14;
const V28_LOGO_SCALE_BOOST = 1.15;

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value));

const hexToRgb = (hexValue, fallback = [13, 35, 69]) => {
  const hex = String(hexValue || '').trim();
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return fallback;
  const value = match[1];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
};

function resolvePdfSymbolProfile() {
  if (typeof window === 'undefined') return 'narrow';
  try {
    const queryProfile = new URLSearchParams(window.location.search).get('symbolProfile');
    if (queryProfile && PDF_SYMBOL_PROFILES.has(queryProfile)) return queryProfile;

    const storedProfile = window.localStorage.getItem('symbolProfile');
    if (storedProfile && PDF_SYMBOL_PROFILES.has(storedProfile)) return storedProfile;
  } catch {
    // Ignore storage/query parsing issues and use the production default.
  }
  return 'narrow';
}

const toLabelY = (inchY, currentHeight) => (inchY / OL1735_SPECS.labelHeight) * currentHeight;

const IDENTITY_OPTIONS = [
  { key: 'standard', label: 'Standard' },
  { key: 'verified', label: 'Verified' },
  { key: 'internal', label: 'Internal' },
  { key: 'custom', label: 'Custom' },
];

const PROTOCOL_CARDS = [
  { key: 'institutional', title: 'Single', Icon: Layers3, mode: 'single', defaultName: 'Single Product Batch', desc: 'All 48 slots — same product, one sheet' },
  { key: 'private-label', title: 'Editor', Icon: Grid3x3, mode: 'multi', defaultName: 'Multi-Product Run', desc: 'Open canvas editor for slot mapping' },
  { key: 'internal', title: 'Logo', Icon: Paintbrush2, mode: 'logo', defaultName: 'Logo Only Sheet', desc: 'Full sheet of brand logo labels only' },
];

const createDefaultCustomProductDraft = () => ({
  name: '',
  strength: '10mg',
  purityText: '≥99% Purity (HPLC-VERIFIED)',
  legalText: LEGAL_USE_TEXT,
  storageText: STORAGE_TEXT,
  price: '',
  formula: '',
  cas: '',
  lotNumber: '',
  coaUrl: '',
  qrUrl: '',
  pubchemCid: '',
  catalogRequestNotes: '',
});

const PRODUCT_PURITY_METHOD_OVERRIDES = Object.freeze({
  EPITALON: 'HPLC-DAD',
  GHKCU: 'HPLC-DAD',
  GLOW: 'HPLC-DAD',
  KISSPEPTIN: 'HPLC-DAD',
  MOTSC: 'HPLC-DAD',
  RETATRUTIDE: 'HPLC-DAD',
  SELANK: 'HPLC-DAD',
  SEMAX: 'HPLC-DAD',
  SERMORELIN: 'HPLC-DAD',
  SS31: 'HPLC-DAD',
  PT141: 'HPLC-DAD',
  CJC1295: 'HPLC-DAD',
  TBBPCBLEND: 'HPLC-DAD',
  TBBPC: 'HPLC-DAD',
  KLOW: 'HPLC-DAD',
});

const normalizeProductPurityKey = (name) => String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');

function PrintCenterPage() {
  const baseProducts = useMemo(() => (Array.isArray(catalog) ? catalog : []), []);
  const [customProducts, setCustomProducts] = useState([]);
  const allProducts = useMemo(() => [...customProducts, ...baseProducts], [customProducts, baseProducts]);
  const productsById = useMemo(() => allProducts.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}), [allProducts]);

  const [appStep, setAppStep] = useState('identity');
  const [layoutName, setLayoutName] = useState('');
  const [labelSheet, setLabelSheet] = useState(createEmptySheet);
  const [slotPurityModes, setSlotPurityModes] = useState(createEmptyPurityModes);
  const [activeSlot, setActiveSlot] = useState(0);
  const [slotPage, setSlotPage] = useState(0);
  const isLightTheme = true;
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paintMode, setPaintMode] = useState('single');
  const [identityMode, setIdentityMode] = useState('standard');
  const [customIdentityText, setCustomIdentityText] = useState('≥99% Purity (CUSTOM)');
  const [styleSettings, setStyleSettings] = useState(() => ({ ...DEFAULT_STYLE }));
  const [expandedSection, setExpandedSection] = useState('product');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showBottomLine, setShowBottomLine] = useState(false);
  const [previewMode, setPreviewMode] = useState('page');
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [showFullscreenCalib, setShowFullscreenCalib] = useState(false);
  const [showPageLayout, setShowPageLayout] = useState(false);
  const [identityWizardStep, setIdentityWizardStep] = useState(1);
  const [wizardMode, setWizardMode] = useState(null);
  const [showCustomLabels, setShowCustomLabels] = useState(false);
  const [showGuidePage, setShowGuidePage] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState(false);
  const [isLgViewport, setIsLgViewport] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCustomProductQuickLoad, setShowCustomProductQuickLoad] = useState(false);
  const [appMessage, setAppMessage] = useState(null);
  const [sheetMapRecords, setSheetMapRecords] = useState([]);
  const [isRefreshingSheetMap, setIsRefreshingSheetMap] = useState(false);
  const [assignLabelCode, setAssignLabelCode] = useState('A1');
  const [rowApplied, setRowApplied] = useState(false);
  const [columnApplied, setColumnApplied] = useState(false);
  const [purityEditorMode, setPurityEditorMode] = useState('hplc-verified');
  const [customProductDraft, setCustomProductDraft] = useState(createDefaultCustomProductDraft);
  const [editingCustomProductId, setEditingCustomProductId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(PRINT_CENTER_LAYOUTS_KEY);
    if (stored) {
      try {
        setSavedLayouts(JSON.parse(stored));
      } catch {
        localStorage.removeItem(PRINT_CENTER_LAYOUTS_KEY);
        setAppMessage({ text: 'Saved layouts were corrupted and were reset.', type: 'error' });
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomProducts(parsed);
        }
      } catch {
        localStorage.removeItem(CUSTOM_PRODUCTS_KEY);
        setAppMessage({ text: 'Saved custom products were corrupted and were reset.', type: 'error' });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    if (!selectedProductId && allProducts.length > 0) {
      setSelectedProductId(allProducts[0].id);
    }
  }, [allProducts, selectedProductId]);

  useEffect(() => {
    localStorage.setItem(PRINT_CENTER_LAYOUTS_KEY, JSON.stringify(savedLayouts));
  }, [savedLayouts]);

  useEffect(() => {
    const onResize = () => setIsLgViewport(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pageCount = Math.ceil(LABELS_PER_SHEET / 4);
  const visibleStart = slotPage * 4;
  const activeProductId = labelSheet[activeSlot] || selectedProductId;
  const activeProduct = activeProductId && activeProductId !== LOGO_ONLY_SLOT_ID ? productsById[activeProductId] : null;
  const normalizePuritySymbol = (text) => String(text || '').replace(/>=/g, '≥').trim();
  const normalizeStrengthText = (text) => String(text || '').trim();
  const toCustomProductDraft = (product = null) => {
    const defaults = createDefaultCustomProductDraft();
    if (!product) return defaults;
    return {
      ...defaults,
      name: String(product.name || ''),
      strength: String(product.strength || defaults.strength),
      purityText: normalizePuritySymbol(String(product.purityText || defaults.purityText)),
      legalText: String(product.legalText || defaults.legalText),
      storageText: String(product.storageText || defaults.storageText),
      price: String(product.price || ''),
      formula: String(product.formula || ''),
      cas: String(product.cas || ''),
      lotNumber: String(product.lotNumber || ''),
      coaUrl: String(product.coaUrl || ''),
      qrUrl: String(product.qrUrl || ''),
      pubchemCid: String(product.pubchemCid || ''),
      catalogRequestNotes: String(product.catalogRequestNotes || ''),
    };
  };
  const isSingleSetupCustomStep = appStep === 'identity' && wizardMode === 'institutional' && identityWizardStep === 3;
  const productName = String(isSingleSetupCustomStep ? (customProductDraft.name || 'CUSTOM PRODUCT') : (activeProduct?.name || 'SELECT PRODUCT')).toUpperCase();
  const productDose = String(isSingleSetupCustomStep ? (customProductDraft.strength || '10mg') : (activeProduct?.strength || '10mg'));

  const getDefaultPurityMethod = () => {
    if (identityMode === 'internal') return 'HPLC-DAD';
    return 'HPLC-VERIFIED';
  };

  const getProductPurityMethodOverride = (product) => {
    const key = normalizeProductPurityKey(product?.name || '');
    return PRODUCT_PURITY_METHOD_OVERRIDES[key] || null;
  };

  const getPurityMethodForSlot = (slotIndex, product) => {
    if (Number.isInteger(slotIndex)) {
      const slotMode = slotPurityModes[slotIndex];
      if (slotMode === 'hplc-dad') return 'HPLC-DAD';
      if (slotMode === 'hplc-verified') return 'HPLC-VERIFIED';
    }
    const productOverride = getProductPurityMethodOverride(product);
    if (productOverride) return productOverride;
    return getDefaultPurityMethod();
  };

  const getPurityBandText = (product, slotIndex) => {
    if (product?.purityText) {
      return normalizePuritySymbol(product.purityText);
    }
    if (identityMode === 'custom') {
      return normalizePuritySymbol(customIdentityText || '≥99% Purity (HPLC-VERIFIED)');
    }
    return normalizePuritySymbol(`≥99% Purity (${getPurityMethodForSlot(slotIndex, product)})`);
  };
  const getPdfPurityBandText = (product, slotIndex) => {
    if (product?.purityText) {
      return normalizePuritySymbol(product.purityText);
    }
    if (identityMode === 'custom') {
      return normalizePuritySymbol(customIdentityText || '≥99% Purity (HPLC-VERIFIED)');
    }
    return normalizePuritySymbol(`≥99% Purity (${getPurityMethodForSlot(slotIndex, product)})`);
  };
  const activePurityText = isSingleSetupCustomStep
    ? normalizePuritySymbol(customProductDraft.purityText || '≥99% Purity (HPLC-VERIFIED)')
    : getPurityBandText(activeProduct, activeSlot);
  const activeLegalText = isSingleSetupCustomStep
    ? String(customProductDraft.legalText || LEGAL_USE_TEXT)
    : String(activeProduct?.legalText || LEGAL_USE_TEXT);
  const activeStorageText = isSingleSetupCustomStep
    ? String(customProductDraft.storageText || STORAGE_TEXT)
    : String(activeProduct?.storageText || STORAGE_TEXT);
  const activeLotText = isSingleSetupCustomStep
    ? String(customProductDraft.lotNumber || '')
    : String(activeProduct?.lotNumber || '');
  const showActiveLotText = Boolean(String(activeLotText || '').trim());
  const placedCount = labelSheet.filter(Boolean).length;
  const shouldShowBottomLine = appStep === 'editor' && showBottomLine;
  const shouldShowBottomLineInPdf = showBottomLine;
  const isLogoOnlyMode = paintMode === 'logo' || activeProductId === LOGO_ONLY_SLOT_ID;
  const appBgClass = isLightTheme ? 'bg-[#eef2f8] text-[#11284a]' : 'bg-[#06080f] text-white';
  const panelBgClass = isLightTheme ? 'bg-white border-[#d5ddea]' : 'bg-[#0a0f1c] border-white/10';
  const subtleTextClass = isLightTheme ? 'text-[#3a5276]' : 'text-white/65';
  const quickPickProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return allProducts;
    const scored = allProducts.map((p, index) => {
      const name = String(p.name || '').toLowerCase();
      const strength = String(p.strength || '').toLowerCase();
      const formula = String(p.formula || '').toLowerCase();
      const cas = String(p.cas || '').toLowerCase();
      const blob = `${name} ${strength} ${formula} ${cas}`;
      let score = 0;
      if (name === query) score += 300;
      if (name.startsWith(query)) score += 220;
      if (name.includes(query)) score += 140;
      if (strength.includes(query)) score += 70;
      if (formula.includes(query) || cas.includes(query)) score += 40;
      if (blob.includes(query)) score += 15;
      return { p, score, index };
    });
    return scored
      .sort((a, b) => (b.score - a.score) || (a.index - b.index))
      .map((entry) => entry.p);
  }, [allProducts, productSearchQuery]);
  const selectedWizardProduct = selectedProductId ? productsById[selectedProductId] : null;
  const pdfSymbolProfile = useMemo(() => resolvePdfSymbolProfile(), []);

  const handleProtocolSelect = (protocolKey) => {
    const protocol = PROTOCOL_CARDS.find(p => p.key === protocolKey);
    if (protocol) {
      setPaintMode(protocol.mode);
      setLayoutName('');
      setWizardMode(protocolKey);
      setShowGuidePage(false);
      setShowAboutPage(false);

      // Only the Editor card should jump directly to canvas editor.
      if (protocol.key === 'private-label') {
        setIdentityWizardStep(1);
        setAppStep('editor');
        return;
      }

      if (protocol.mode === 'single') {
        const initialProductId = selectedProductId || allProducts[0]?.id || '';
        if (initialProductId) {
          setSelectedProductId(initialProductId);
          fillEntireSheet(initialProductId);
        }
        setProductSearchQuery('');
      }
      setIdentityWizardStep(2);
    }
  };

  const handleBackToIdentity = () => {
    setAppStep('identity');
    setLayoutName('');
    setPaintMode('single');
    setIdentityWizardStep(1);
    setWizardMode(null);
    setShowCustomLabels(false);
    setShowCustomProductQuickLoad(false);
    setShowGuidePage(false);
    setShowAboutPage(false);
    setAppMessage(null);
  };

  const showInPageMessage = (text, type = 'info') => {
    setAppMessage({ text, type });
  };

  const normalizeProductLookupKey = (name, strength) => {
    return `${String(name || '').trim().toLowerCase()}::${String(strength || '').trim().toLowerCase()}`;
  };

  const refreshApprovedMapFromSheet = async () => {
    setIsRefreshingSheetMap(true);
    try {
      const query = new URLSearchParams({
        command: 'GET_QR_COA_MAP',
        status: 'approved',
        limit: String(LABELS_PER_SHEET),
      }).toString();
      const response = await fetch(`${APPS_SCRIPT_COMMAND_URL}?${query}`, {
        method: 'GET',
        mode: 'cors',
      });
      const data = await response.json();

      if (!response.ok || data?.status !== 'success') {
        throw new Error(String(data?.message || 'Failed to refresh approved lot map.'));
      }

      const records = Array.isArray(data.records) ? data.records : [];
      setSheetMapRecords(records);
      showInPageMessage(`Loaded ${records.length} approved lot record(s) from sheet.`, 'success');
      return records;
    } catch (error) {
      showInPageMessage(String(error?.message || 'Failed to refresh approved lot map.'), 'error');
      return [];
    } finally {
      setIsRefreshingSheetMap(false);
    }
  };

  const mapApprovedRecordsToSlots = (records, maxRecords = 10, options = {}) => {
    const { clearRemainder = false } = options;
    if (!Array.isArray(records) || !records.length) {
      showInPageMessage('No approved records loaded. Use Refresh from Sheet first.', 'error');
      return null;
    }

    const productIdByKey = new Map(
      allProducts.map((product) => [normalizeProductLookupKey(product.name, product.strength), product.id]),
    );

    const nextCustomProducts = [];
    const assignedProductIds = [];

    records.slice(0, maxRecords).forEach((record, index) => {
      const productName = String(record?.product_name || '').trim();
      if (!productName) return;

      const strength = String(record?.strength || '10mg').trim() || '10mg';
      const key = normalizeProductLookupKey(productName, strength);

      let productId = productIdByKey.get(key) || '';

      if (!productId) {
        productId = `custom-sheet-${Date.now()}-${index}`;
        nextCustomProducts.push({
          id: productId,
          name: productName,
          strength,
          purityText: normalizePuritySymbol(record?.purity_text || '≥99% Purity (HPLC-VERIFIED)'),
          legalText: String(record?.legal_text || LEGAL_USE_TEXT),
          storageText: String(record?.storage_text || STORAGE_TEXT),
          lotNumber: String(record?.lot_number || ''),
          qrTargetUrl: String(record?.qr_target_url || ''),
          coaUrl: String(record?.coa_url || ''),
          customProduct: true,
        });
        productIdByKey.set(key, productId);
      }

      assignedProductIds.push(productId);
    });

    if (!assignedProductIds.length) {
      showInPageMessage('Approved records are missing product names. Nothing was applied.', 'error');
      return null;
    }

    const nextSheet = clearRemainder ? createEmptySheet() : [...labelSheet];
    assignedProductIds.forEach((productId, index) => {
      if (index < LABELS_PER_SHEET) {
        nextSheet[index] = productId;
      }
    });

    const nextPurityModes = clearRemainder ? createEmptyPurityModes() : [...slotPurityModes];
    for (let i = 0; i < Math.min(assignedProductIds.length, LABELS_PER_SHEET); i += 1) {
      nextPurityModes[i] = null;
    }

    return {
      nextCustomProducts,
      nextSheet,
      nextPurityModes,
      assignedProductIds,
      appliedCount: Math.min(assignedProductIds.length, maxRecords),
    };
  };

  const applyApprovedRecordsToSlots = (maxRecords = 10, sourceRecords = null, options = {}) => {
    const records = Array.isArray(sourceRecords) ? sourceRecords : sheetMapRecords;
    const mapping = mapApprovedRecordsToSlots(records, maxRecords, options);
    if (!mapping) return false;

    const {
      nextCustomProducts,
      nextSheet,
      nextPurityModes,
      assignedProductIds,
      appliedCount,
    } = mapping;

    if (nextCustomProducts.length) {
      setCustomProducts((prev) => [...nextCustomProducts, ...prev]);
    }

    setLabelSheet(nextSheet);
    setSlotPurityModes(nextPurityModes);

    setSelectedProductId(assignedProductIds[0]);
    setActiveSlotFromGrid(0);
    showInPageMessage(`Applied ${appliedCount} approved record(s) to slots A1-${slotCodeForIndex(appliedCount - 1)}.`, 'success');
    return true;
  };

  const generateProofPdfTopTen = async () => {
    let sourceRecords = sheetMapRecords;
    if (!sourceRecords.length) {
      sourceRecords = await refreshApprovedMapFromSheet();
    }

    if (!sourceRecords.length) {
      showInPageMessage('No approved records available for proof generation.', 'error');
      return;
    }

    const applied = applyApprovedRecordsToSlots(10, sourceRecords, { clearRemainder: true });
    if (!applied) return;

    // Wait one paint cycle so PDF generation reads the newly assigned top-10 slots.
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    await generateSheetPdf('download', { cleanExport: true });
  };

  const generateProofPdfAllApproved = async () => {
    let sourceRecords = sheetMapRecords;
    if (!sourceRecords.length) {
      sourceRecords = await refreshApprovedMapFromSheet();
    }

    if (!sourceRecords.length) {
      showInPageMessage('No approved records available for full proof generation.', 'error');
      return;
    }

    const applied = applyApprovedRecordsToSlots(LABELS_PER_SHEET, sourceRecords, { clearRemainder: true });
    if (!applied) return;

    // Wait one paint cycle so the final slot mapping is reflected before PDF generation.
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    await generateSheetPdf('download', { cleanExport: true });
  };

  const startAddCustomProduct = () => {
    setEditingCustomProductId('');
    setCustomProductDraft(createDefaultCustomProductDraft());
    setIdentityWizardStep(3);
  };

  const startEditCustomProduct = (product) => {
    if (!product) return;
    setEditingCustomProductId(product.customProduct ? product.id : '');
    setCustomProductDraft(toCustomProductDraft(product));
    setIdentityWizardStep(3);
  };

  const saveCustomProduct = () => {
    const name = String(customProductDraft.name || '').trim();
    if (!name) {
      showInPageMessage('Product name is required.', 'error');
      return;
    }

    const strength = normalizeStrengthText(customProductDraft.strength || '10mg') || '10mg';
    const purityText = normalizePuritySymbol(customProductDraft.purityText || '≥99% Purity (HPLC-VERIFIED)');
    const legalText = String(customProductDraft.legalText || LEGAL_USE_TEXT).trim() || LEGAL_USE_TEXT;
    const storageText = String(customProductDraft.storageText || STORAGE_TEXT).trim() || STORAGE_TEXT;
    const id = editingCustomProductId || `custom-${Date.now()}`;

    const customProduct = {
      id,
      name,
      strength,
      purityText,
      legalText,
      storageText,
      price: String(customProductDraft.price || '').trim(),
      formula: String(customProductDraft.formula || '').trim(),
      cas: String(customProductDraft.cas || '').trim(),
      lotNumber: String(customProductDraft.lotNumber || '').trim(),
      coaUrl: String(customProductDraft.coaUrl || '').trim(),
      qrUrl: String(customProductDraft.qrUrl || '').trim(),
      pubchemCid: String(customProductDraft.pubchemCid || '').trim(),
      catalogRequestNotes: String(customProductDraft.catalogRequestNotes || '').trim(),
      customProduct: true,
    };

    const isEditing = Boolean(editingCustomProductId);
    setCustomProducts((prev) => {
      if (!isEditing) return [customProduct, ...prev];
      const updated = prev.map((item) => (item.id === editingCustomProductId ? customProduct : item));
      if (!updated.some((item) => item.id === editingCustomProductId)) {
        return [customProduct, ...prev];
      }
      return updated;
    });
    setSelectedProductId(id);
    fillEntireSheet(id);
    setProductSearchQuery(name);
    setShowCustomProductQuickLoad(true);
    setEditingCustomProductId('');
    setCustomProductDraft(createDefaultCustomProductDraft());
    setIdentityWizardStep(2);
    showInPageMessage(`Custom product "${name}" ${isEditing ? 'updated' : 'saved'}.`, 'success');
  };

  const deleteCustomProduct = (productId, productName) => {
    setCustomProducts((prev) => prev.filter((p) => p.id !== productId));
    setLabelSheet((prev) => prev.map((slotId) => (slotId === productId ? '' : slotId)));
    if (selectedProductId === productId) setSelectedProductId('');
    showInPageMessage(`Deleted custom product "${productName}".`, 'success');
  };

  const updateStyle = (key, value) => setStyleSettings((prev) => ({ ...prev, [key]: value }));

  const applyGlobalScalePercent = (percentValue) => {
    const percent = clampNumber(percentValue, 25, 240);
    const multiplier = percent / 100;
    setStyleSettings((prev) => ({
      ...prev,
      scale: multiplier,
      widthPercent: clampNumber(Math.round(94 * multiplier), 40, MAX_SAFE_WIDTH_PERCENT),
      logoScale: multiplier,
      bandCornerScale: multiplier,
      productNameScale: multiplier,
      productLetterSpacingScale: multiplier,
      dosageScale: multiplier,
      purityScale: multiplier,
      purityLetterSpacingScale: multiplier,
      legalTextScale: multiplier,
      legalLetterSpacingScale: multiplier,
      storageTextScale: multiplier,
      storageLetterSpacingScale: multiplier,
    }));
  };

  const updateBandWidthPercent = (value) => {
    const widthPercent = clampNumber(value, 40, MAX_SAFE_WIDTH_PERCENT);
    setStyleSettings((prev) => ({
      ...prev,
      widthPercent,
      scale: clampNumber(widthPercent / 94, 0.25, 2.4),
    }));
  };

  const updateElementScalePercent = (key, percentValue) => {
    const minPercent = key === 'bandCornerScale' ? 0 : 25;
    const percent = clampNumber(percentValue, minPercent, 240);
    const multiplier = percent / 100;
    setStyleSettings((prev) => ({
      ...prev,
      [key]: multiplier,
      scale: multiplier,
    }));
  };

  const applyPageLayoutPreset = (presetId) => {
    const baseStyle = {
      ...DEFAULT_STYLE,
      heightPercent: FIXED_CONTAINER_HEIGHT_PERCENT,
      cornerRadius: FIXED_CONTAINER_CORNER_RADIUS,
    };

    if (presetId === 'layout-2') {
      setStyleSettings({
        ...baseStyle,
        offsetY: 2,
        logoScale: 0.94,
        productNameScale: 0.9,
        productLetterSpacingScale: 0.95,
        dosageScale: 0.94,
        purityScale: 0.94,
        purityLetterSpacingScale: 0.96,
        legalTextScale: 0.84,
        legalLetterSpacingScale: 0.92,
        storageTextScale: 0.9,
        storageLetterSpacingScale: 0.92,
      });
      setShowBottomLine(false);
      showInPageMessage('Layout 2 (Bottle Label) applied.', 'success');
      return;
    }

    setStyleSettings(baseStyle);
    setShowBottomLine(false);
    showInPageMessage('Layout 1 (Standard) applied.', 'success');
  };

  const restoreDefaults = () => {
    setStyleSettings({ ...DEFAULT_STYLE });
    setIdentityMode('standard');
    setCustomIdentityText('≥99% Purity (CUSTOM)');
    setShowBottomLine(false);
  };

  const saveCalibration = () => {
    const calib = { styleSettings: { ...styleSettings }, showBorders, showMeasurements, showBottomLine };
    localStorage.setItem(CALIB_STORAGE_KEY, JSON.stringify(calib));
    showInPageMessage('Calibration saved.', 'success');
  };

  const loadCalibration = () => {
    const stored = localStorage.getItem(CALIB_STORAGE_KEY);
    if (!stored) return;
    try {
      const c = JSON.parse(stored);
      if (c.styleSettings) {
        const nextStyleSettings = { ...DEFAULT_STYLE, ...c.styleSettings };
        if (c.styleSettings.footerTextScale !== undefined) {
          if (c.styleSettings.legalTextScale === undefined) {
            nextStyleSettings.legalTextScale = c.styleSettings.footerTextScale;
          }
          if (c.styleSettings.storageTextScale === undefined) {
            nextStyleSettings.storageTextScale = c.styleSettings.footerTextScale;
          }
        }
        setStyleSettings(nextStyleSettings);
      }
      if (c.showBorders !== undefined) setShowBorders(c.showBorders);
      if (c.showMeasurements !== undefined) setShowMeasurements(c.showMeasurements);
      if (c.showBottomLine !== undefined) setShowBottomLine(c.showBottomLine);
    } catch {
      localStorage.removeItem(CALIB_STORAGE_KEY);
      showInPageMessage('Saved calibration was corrupted and was reset.', 'error');
    }
  };

  const exportVault = () => {
    const layouts = JSON.parse(localStorage.getItem(PRINT_CENTER_LAYOUTS_KEY) || '[]');
    const blob = new Blob([JSON.stringify({ version: '1.4', exported: new Date().toISOString(), layouts }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PEPTQ_VAULT_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importVault = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const incoming = Array.isArray(parsed) ? parsed : (parsed.layouts || []);
        setSavedLayouts((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const merged = [...prev, ...incoming.filter((l) => !existingIds.has(l.id))];
          return merged;
        });
        showInPageMessage(`Vault imported: ${incoming.length} layout(s) processed.`, 'success');
      } catch {
        showInPageMessage('Failed to read vault file. Make sure it is a valid PEPTQ vault JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveLayout = () => {
    if (!layoutName.trim()) {
      showInPageMessage('Please enter a layout name.', 'error');
      return;
    }
    const newLayout = {
      id: `layout-${Date.now()}`,
      name: layoutName,
      paintMode,
      labelSheet: [...labelSheet],
      selectedProductId,
      identityMode,
      customIdentityText,
      slotPurityModes: [...slotPurityModes],
      styleSettings: { ...styleSettings },
      showBorders,
      showMeasurements,
      showBottomLine,
      timestamp: new Date().toISOString(),
    };
    setSavedLayouts((prev) => [...prev, newLayout]);
    showInPageMessage(`Layout "${layoutName}" saved.`, 'success');
  };

  const loadLayout = (layoutId) => {
    const layout = savedLayouts.find(l => l.id === layoutId);
    if (!layout) return;
    setPaintMode(layout.paintMode);
    setLabelSheet([...layout.labelSheet]);
    setSelectedProductId(layout.selectedProductId);
    setIdentityMode(layout.identityMode);
    setCustomIdentityText(normalizePuritySymbol(layout.customIdentityText));
    setSlotPurityModes(Array.isArray(layout.slotPurityModes) ? [...layout.slotPurityModes] : createEmptyPurityModes());
    setStyleSettings({ ...layout.styleSettings });
    setShowBorders(layout.showBorders);
    setShowMeasurements(layout.showMeasurements);
    setShowBottomLine(layout.showBottomLine);
    setLayoutName(layout.name);
  };

  const duplicateLayout = (layoutId) => {
    const layout = savedLayouts.find(l => l.id === layoutId);
    if (!layout) return;
    setSavedLayouts((prev) => [
      ...prev,
      {
        ...layout,
        slotPurityModes: Array.isArray(layout.slotPurityModes) ? [...layout.slotPurityModes] : createEmptyPurityModes(),
        id: `layout-${Date.now()}`,
        name: `${layout.name} (Copy)`,
      },
    ]);
  };

  const deleteLayout = (layoutId) => {
    setSavedLayouts((prev) => prev.filter(l => l.id !== layoutId));
  };

  const getPaintValueForCurrentMode = () => (paintMode === 'logo' ? LOGO_ONLY_SLOT_ID : selectedProductId);

  const fillEntireSheet = (valueToPaint) => {
    if (!valueToPaint) return;
    setLabelSheet(Array(LABELS_PER_SHEET).fill(valueToPaint));
    setSlotPurityModes(createEmptyPurityModes());
  };

  const applyPurityModeToEntireSheet = (mode) => {
    if (mode !== 'hplc-verified' && mode !== 'hplc-dad') return;
    setPurityEditorMode(mode);
    setSlotPurityModes(Array(LABELS_PER_SHEET).fill(mode));
  };

  const paintSlotByMode = (slotIndex, valueToPaint) => {
    if (!valueToPaint) return;
    if (paintMode === 'single' || paintMode === 'logo') {
      fillEntireSheet(valueToPaint);
      return;
    }
    setLabelSheet((prev) => {
      const next = [...prev];
      next[slotIndex] = valueToPaint;
      return next;
    });
    setSlotPurityModes((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const paintActiveSlot = () => paintSlotByMode(activeSlot, getPaintValueForCurrentMode());

  const clearActiveSlot = () => {
    setLabelSheet((prev) => {
      const next = [...prev];
      next[activeSlot] = '';
      return next;
    });
    setSlotPurityModes((prev) => {
      const next = [...prev];
      next[activeSlot] = null;
      return next;
    });
  };

  const clearAllSlots = () => {
    setLabelSheet(createEmptySheet());
    setSlotPurityModes(createEmptyPurityModes());
  };

  const fillVisibleSlots = () => {
    const valueToPaint = getPaintValueForCurrentMode();
    if (!valueToPaint) return;
    setLabelSheet((prev) => {
      const next = [...prev];
      for (let slot = visibleStart; slot < Math.min(visibleStart + 4, LABELS_PER_SHEET); slot += 1) {
        next[slot] = valueToPaint;
      }
      return next;
    });
    setSlotPurityModes((prev) => {
      const next = [...prev];
      for (let slot = visibleStart; slot < Math.min(visibleStart + 4, LABELS_PER_SHEET); slot += 1) {
        next[slot] = null;
      }
      return next;
    });
  };

  const applyActiveColumn = () => {
    const valueToPaint = getPaintValueForCurrentMode();
    if (!valueToPaint) return;
    const columnIndex = activeSlot % OL1735_SPECS.cols;
    setLabelSheet((prev) => {
      const next = [...prev];
      for (let slot = columnIndex; slot < LABELS_PER_SHEET; slot += OL1735_SPECS.cols) {
        next[slot] = valueToPaint;
      }
      return next;
    });
    setSlotPurityModes((prev) => {
      const next = [...prev];
      for (let slot = columnIndex; slot < LABELS_PER_SHEET; slot += OL1735_SPECS.cols) {
        next[slot] = null;
      }
      return next;
    });
    setColumnApplied(true);
  };

  const moveSlotPage = (delta) => setSlotPage((prev) => Math.max(0, Math.min(pageCount - 1, prev + delta)));
  const setActiveSlotFromGrid = (slotIndex) => {
    setActiveSlot(slotIndex);
    setSlotPage(Math.floor(slotIndex / 4));
  };

  const columnLetters = ['A', 'B', 'C', 'D'];
  const slotCodeForIndex = (slotIndex) => {
    const row = Math.floor(slotIndex / OL1735_SPECS.cols);
    const col = slotIndex % OL1735_SPECS.cols;
    return `${columnLetters[col]}${row + 1}`;
  };
  const slotIndexFromCode = (code) => {
    const clean = String(code || '').trim().toUpperCase();
    const col = columnLetters.indexOf(clean.charAt(0));
    const row = Number(clean.slice(1)) - 1;
    if (col < 0 || Number.isNaN(row) || row < 0 || row >= OL1735_SPECS.rows) return null;
    return row * OL1735_SPECS.cols + col;
  };
  const assignLabelOptions = useMemo(() => {
    return Array.from({ length: LABELS_PER_SHEET }, (_, i) => ({ value: slotCodeForIndex(i), slotIndex: i }));
  }, []);

  useEffect(() => {
    setAssignLabelCode(slotCodeForIndex(activeSlot));
    setRowApplied(false);
    setColumnApplied(false);
  }, [activeSlot]);

  useEffect(() => {
    if (identityMode === 'custom') {
      setPurityEditorMode('custom');
    } else if (identityMode === 'internal') {
      setPurityEditorMode('hplc-dad');
    } else {
      setPurityEditorMode('hplc-verified');
    }
  }, [identityMode]);

  const applyActiveRow = () => {
    const valueToPaint = getPaintValueForCurrentMode();
    if (!valueToPaint) return;
    const activeRow = Math.floor(activeSlot / OL1735_SPECS.cols);
    setLabelSheet((prev) => {
      const next = [...prev];
      for (let col = 0; col < OL1735_SPECS.cols; col += 1) {
        next[activeRow * OL1735_SPECS.cols + col] = valueToPaint;
      }
      return next;
    });
    setSlotPurityModes((prev) => {
      const next = [...prev];
      for (let col = 0; col < OL1735_SPECS.cols; col += 1) {
        next[activeRow * OL1735_SPECS.cols + col] = null;
      }
      return next;
    });
    setRowApplied(true);
  };

  const generateRandomHalfPuritySheet = () => {
    if (!baseProducts.length) {
      showInPageMessage('No catalog products available.', 'error');
      return;
    }

    const catalogProductIds = baseProducts
      .map((product) => product?.id)
      .filter((id) => Boolean(id) && id !== LOGO_ONLY_SLOT_ID);

    if (!catalogProductIds.length) {
      showInPageMessage('No valid catalog products available.', 'error');
      return;
    }

    const nextSheet = Array.from({ length: LABELS_PER_SHEET }, () => {
      const randomIndex = Math.floor(Math.random() * catalogProductIds.length);
      return catalogProductIds[randomIndex];
    });
    const nextPurityModes = Array(LABELS_PER_SHEET).fill('hplc-verified');
    const hplcDadCount = Math.floor(LABELS_PER_SHEET / 2);

    for (let i = 0; i < hplcDadCount; i += 1) {
      nextPurityModes[i] = 'hplc-dad';
    }

    for (let i = nextPurityModes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = nextPurityModes[i];
      nextPurityModes[i] = nextPurityModes[j];
      nextPurityModes[j] = temp;
    }

    setLabelSheet(nextSheet);
    setSlotPurityModes(nextPurityModes);
    setIdentityMode('verified');
    setPurityEditorMode('hplc-verified');
    showInPageMessage('SUCCESS', 'success');
  };

  const labelScale = styleSettings.scale;
  const labelHeightPx = 180 * (FIXED_CONTAINER_HEIGHT_PERCENT / 100);
  const V28_LABEL = Object.freeze({
    logo: LABEL_TEMPLATE.logoY + V28_LOGO_TOP_MARGIN_IN + V28_VERTICAL_REBALANCE_IN,
    navyBand: LABEL_TEMPLATE.navyBandY + V28_VERTICAL_REBALANCE_IN,
    navyBandHeight: V28_Navy_BAND_HEIGHT_IN,
    purityBand: LABEL_TEMPLATE.purityBandY + V28_VERTICAL_REBALANCE_IN,
    purityBandHeight: LABEL_TEMPLATE.purityBandHeight,
    lot: 0.595,
    legal: 0.628,
    storage: 0.672,
    legalNoLot: 0.61,
    storageNoLot: 0.655,
  });
  const previewLegalYIn = showActiveLotText ? V28_LABEL.legal : V28_LABEL.legalNoLot;
  const previewStorageYIn = showActiveLotText ? V28_LABEL.storage : V28_LABEL.storageNoLot;
  const UI_PREVIEW_Y = Object.freeze({
    logo: V28_LABEL.logo,
    navyBand: V28_LABEL.navyBand,
    // Center dosage text between navy band bottom and orange band top in editor/device preview.
    dosage: Number(((V28_LABEL.navyBand + V28_LABEL.navyBandHeight + V28_LABEL.purityBand) / 2).toFixed(3)),
    purityBand: V28_LABEL.purityBand,
    lot: V28_LABEL.lot,
    legal: previewLegalYIn,
    storage: previewStorageYIn,
  });
  // Match production inset look: bands should not run edge-to-edge.
  const navyBandWidth = Math.max(40, Math.min(MAX_SAFE_WIDTH_PERCENT, styleSettings.widthPercent));
  const purityBandWidth = Math.max(40, Math.min(MAX_SAFE_WIDTH_PERCENT, styleSettings.widthPercent));
  const contentInnerWidthPx = 380 - DANGER_ZONE_PX * 2;
  const previewNavyBandHeightPx = toLabelY(V28_LABEL.navyBandHeight, labelHeightPx);
  const previewPurityBandHeightPx = toLabelY(V28_LABEL.purityBandHeight, labelHeightPx);
  const bandCornerMultiplier = clampNumber(styleSettings.bandCornerScale, 0, 2.4);
  // Match physical vial wrap profile: navy ribbon is square, orange purity ribbon stays rounded.
  const navyBandRadius = 0;
  const purityBandRadius = Math.max(4, previewPurityBandHeightPx * 0.5 * bandCornerMultiplier);
  const effectiveLogoScale = clampNumber(styleSettings.logoScale, 0.25, 1);
  const labelLogoScale = clampNumber(effectiveLogoScale * 0.9 * V28_LOGO_SCALE_BOOST, 0.2, 1.2);
  const previewNavyBandWidthPx = (contentInnerWidthPx * navyBandWidth) / 100;
  const previewPurityBandWidthPx = (contentInnerWidthPx * purityBandWidth) / 100;

  const estimatePreviewTextWidth = (text, fontPx) => String(text || '').length * fontPx * 0.56;
  const fitPreviewTextFont = (text, preferredPx, maxWidthPx, maxHeightPx, minPx = 4) => {
    let fontPx = preferredPx;
    const safeMaxWidth = Math.max(10, maxWidthPx);
    const safeMaxHeight = Math.max(minPx, maxHeightPx);
    while (fontPx > minPx && (estimatePreviewTextWidth(text, fontPx) > safeMaxWidth || fontPx > safeMaxHeight)) {
      fontPx -= 0.2;
    }
    return Math.max(minPx, Number(fontPx.toFixed(2)));
  };

  const productNameFontSize = fitPreviewTextFont(
    productName,
    BASE_FONT_SIZES.productTitle * ELEMENT_SCALE.productTitle * styleSettings.productNameScale * 0.92,
    previewNavyBandWidthPx - 10,
    previewNavyBandHeightPx * 0.82,
    5,
  );

  const dosageTopLimitPx = toLabelY(V28_LABEL.navyBand + V28_LABEL.navyBandHeight, labelHeightPx);
  const dosageCenterPx = toLabelY(UI_PREVIEW_Y.dosage, labelHeightPx);
  const dosageBottomLimitPx = toLabelY(V28_LABEL.purityBand, labelHeightPx);
  const dosageHeightLimit = Math.max(6, (Math.min(dosageCenterPx - dosageTopLimitPx, dosageBottomLimitPx - dosageCenterPx) * 2) - 1);
  const dosageFontSize = fitPreviewTextFont(
    productDose,
    BASE_FONT_SIZES.dosage * ELEMENT_SCALE.dosage * styleSettings.dosageScale,
    contentInnerWidthPx * 0.5,
    dosageHeightLimit,
    4.5,
  );

  const purityFontSizePreview = fitPreviewTextFont(
    activePurityText,
    BASE_FONT_SIZES.purity * ELEMENT_SCALE.purity * styleSettings.purityScale,
    previewPurityBandWidthPx - 10,
    previewPurityBandHeightPx * 0.82,
    4.2,
  );

  const footerWrapperScale = 1;
  const footerWrapperWidthPx = contentInnerWidthPx * footerWrapperScale;
  const footerGapPx = Math.max(4, toLabelY(UI_PREVIEW_Y.storage, labelHeightPx) - toLabelY(UI_PREVIEW_Y.legal, labelHeightPx));
  const footerMaxFontHeightPx = Math.max(3.6, footerGapPx * 0.82);
  const preferredLegalFooterFontPx = BASE_FONT_SIZES.footer * ELEMENT_SCALE.footer * clampNumber(styleSettings.legalTextScale || 1, 0.25, 2.4);
  const preferredStorageFooterFontPx = BASE_FONT_SIZES.footer * ELEMENT_SCALE.footer * clampNumber(styleSettings.storageTextScale || 1, 0.25, 2.4);
  const legalFontSize = fitPreviewTextFont(activeLegalText, preferredLegalFooterFontPx, footerWrapperWidthPx, footerMaxFontHeightPx, 3.2);
  const storageFontSize = fitPreviewTextFont(activeStorageText, preferredStorageFooterFontPx, footerWrapperWidthPx, footerMaxFontHeightPx, 3.2);
  const productLetterSpacingPx = 0.6 * clampNumber(styleSettings.productLetterSpacingScale || 1, 0, 3);
  const purityLetterSpacingPx = 0.22 * clampNumber(styleSettings.purityLetterSpacingScale || 1, 0, 3);
  const legalLetterSpacingPx = 0.18 * clampNumber(styleSettings.legalLetterSpacingScale || 1, 0, 3);
  const storageLetterSpacingPx = 0.18 * clampNumber(styleSettings.storageLetterSpacingScale || 1, 0, 3);
  const toFullscreenCalibY = (inchY) => (inchY / OL1735_SPECS.labelHeight) * FULLSCREEN_CALIB_HEIGHT_PX;
  const dangerInsetCalibPx = DANGER_ZONE_PX;
  const calibContentInnerWidthPx = contentInnerWidthPx * FULLSCREEN_CALIB_SCALE;
  const maxBandWidthCalibPx = Math.max(navyBandWidth, purityBandWidth) / 100 * calibContentInnerWidthPx;
  const footerWrapperWidthCalibPx = footerWrapperWidthPx * FULLSCREEN_CALIB_SCALE;
  const logoRegionWidthCalibPx = Math.min(calibContentInnerWidthPx, 190 * effectiveLogoScale * FULLSCREEN_CALIB_SCALE);
  const maxContentHalfWidthCalibPx = Math.max(maxBandWidthCalibPx, footerWrapperWidthCalibPx, logoRegionWidthCalibPx) / 2;
  const topMostCalibPx = toFullscreenCalibY(V28_LABEL.logo);
  const bottomMostCalibPx = Math.max(
    toFullscreenCalibY(V28_LABEL.purityBand + V28_LABEL.purityBandHeight),
    toFullscreenCalibY(UI_PREVIEW_Y.storage) + (storageFontSize * FULLSCREEN_CALIB_SCALE * 0.5),
  );
  const minOffsetX = Math.ceil(dangerInsetCalibPx + maxContentHalfWidthCalibPx - (FULLSCREEN_CALIB_WIDTH_PX / 2));
  const maxOffsetX = Math.floor((FULLSCREEN_CALIB_WIDTH_PX / 2) - dangerInsetCalibPx - maxContentHalfWidthCalibPx);
  const minOffsetY = Math.ceil(dangerInsetCalibPx - topMostCalibPx);
  const maxOffsetY = Math.floor((FULLSCREEN_CALIB_HEIGHT_PX - dangerInsetCalibPx) - bottomMostCalibPx);
  const clampedOffsetX = clampNumber(styleSettings.offsetX, minOffsetX, maxOffsetX);
  const clampedOffsetY = clampNumber(styleSettings.offsetY, minOffsetY, maxOffsetY);

  useEffect(() => {
    if (styleSettings.offsetX !== clampedOffsetX || styleSettings.offsetY !== clampedOffsetY) {
      setStyleSettings((prev) => ({
        ...prev,
        offsetX: clampedOffsetX,
        offsetY: clampedOffsetY,
      }));
    }
  }, [clampedOffsetX, clampedOffsetY, styleSettings.offsetX, styleSettings.offsetY]);

  const PDF_LOCKED_Y = Object.freeze({
    logo: V28_LABEL.logo,
    navyBand: V28_LABEL.navyBand,
    // Vertically center product text in navy band.
    productText: Number((V28_LABEL.navyBand + V28_LABEL.navyBandHeight / 2).toFixed(3)),
    // Center dosage in the white gap between navy band bottom and orange band top.
    dosage: Number(((V28_LABEL.navyBand + V28_LABEL.navyBandHeight + V28_LABEL.purityBand) / 2).toFixed(3)),
    purityBand: V28_LABEL.purityBand,
    // Vertically center purity text in orange band.
    purityText: Number((V28_LABEL.purityBand + V28_LABEL.purityBandHeight / 2).toFixed(3)),
    lot: V28_LABEL.lot,
    legal: V28_LABEL.legal,
    legalNoLot: V28_LABEL.legalNoLot,
    // Add extra vertical separation so footer lines don't read as wrapped text in print preview.
    footerBottom: V28_LABEL.storage,
    footerBottomNoLot: V28_LABEL.storageNoLot,
    bottomLine: 0.735,
  });
  const measurementAnchors = [
    { y: PDF_LOCKED_Y.logo, label: 'Logo', value: `${PDF_LOCKED_Y.logo.toFixed(3)}"` },
    { y: PDF_LOCKED_Y.navyBand, label: 'Navy Band', value: '0.205"' },
    { y: PDF_LOCKED_Y.dosage, label: 'Dosage', value: `${PDF_LOCKED_Y.dosage.toFixed(3)}"` },
    { y: PDF_LOCKED_Y.purityBand, label: 'Orange Band', value: '0.484"' },
    { y: PDF_LOCKED_Y.lot, label: 'Lot #', value: `${PDF_LOCKED_Y.lot.toFixed(3)}"` },
    { y: PDF_LOCKED_Y.legal, label: 'Legal', value: `${PDF_LOCKED_Y.legal.toFixed(3)}"` },
    { y: PDF_LOCKED_Y.footerBottom, label: 'Storage', value: `${PDF_LOCKED_Y.footerBottom.toFixed(3)}"` },
  ];
  const PDF_LOCKED_WIDTH = Object.freeze({
    navyBand: 1.65,
    purityBand: 1.65,
  });

  const getProductForSlot = (slotValue) => {
    if (!slotValue || slotValue === LOGO_ONLY_SLOT_ID) return null;
    return productsById[slotValue] || null;
  };

  const buildPdfTimestamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}_${hh}${min}`;
  };

  const loadLogoAsDataUri = async () => {
    const response = await fetch(LOGO_IMAGE_URL);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Logo load failed'));
      reader.readAsDataURL(blob);
    });
  };

  const generateSheetPdf = async (mode = 'download', options = {}) => {
    setIsExportingPdf(true);
    try {
      const cleanExport = Boolean(options.cleanExport);
      const pdfShowBorders = cleanExport ? false : showBorders;
      const pdfShowMeasurements = cleanExport ? false : showMeasurements;
      const pdfShowDiagnosticOverlay = cleanExport ? false : showDiagnosticOverlay;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      let logoDataUri = null;
      try {
        logoDataUri = await loadLogoAsDataUri();
      } catch {
        logoDataUri = null;
      }
      const pushGraphicsState =
        typeof doc.saveGraphicsState === 'function' ? () => doc.saveGraphicsState() : null;
      const popGraphicsState =
        typeof doc.restoreGraphicsState === 'function' ? () => doc.restoreGraphicsState() : null;

      for (let index = 0; index < LABELS_PER_SHEET; index += 1) {
        const row = Math.floor(index / OL1735_SPECS.cols);
        const col = index % OL1735_SPECS.cols;
        const x = OL1735_SPECS.marginLeft + col * (OL1735_SPECS.labelWidth + OL1735_SPECS.horizontalGap);
        const y = OL1735_SPECS.marginTop + row * (OL1735_SPECS.labelHeight + OL1735_SPECS.verticalGap);
        const slotValue = labelSheet[index];

        if (!slotValue) continue;

        if (pushGraphicsState) pushGraphicsState();
        try {
          const yLogo = y + PDF_LOCKED_Y.logo;
          const yNavyBand = y + PDF_LOCKED_Y.navyBand;
          const yProductText = y + PDF_LOCKED_Y.productText;
          const yDosage = y + PDF_LOCKED_Y.dosage;
          const yPurityBand = y + PDF_LOCKED_Y.purityBand;
          const yPurityText = y + PDF_LOCKED_Y.purityText;
          const pdfLotText = String(product?.lotNumber || '').trim();
          const hasPdfLot = Boolean(pdfLotText);
          const yLot = y + PDF_LOCKED_Y.lot;
          const yLegal = y + (hasPdfLot ? PDF_LOCKED_Y.legal : PDF_LOCKED_Y.legalNoLot);
          const yFooterBottom = y + (hasPdfLot ? PDF_LOCKED_Y.footerBottom : PDF_LOCKED_Y.footerBottomNoLot);
          const yBottomLine = y + PDF_LOCKED_Y.bottomLine;

          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x, y, OL1735_SPECS.labelWidth, OL1735_SPECS.labelHeight, 0.03, 0.03, 'F');
          if (pdfShowBorders) {
            doc.setDrawColor(13, 35, 69);
            doc.setLineWidth(0.006);
            doc.roundedRect(x, y, OL1735_SPECS.labelWidth, OL1735_SPECS.labelHeight, 0.03, 0.03, 'S');
          }

          if (pdfShowMeasurements && !pdfShowDiagnosticOverlay) {
            doc.setDrawColor(0, 168, 255);
            doc.setLineWidth(0.003);
            doc.setTextColor(0, 120, 220);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(4.2);
            measurementAnchors.forEach((anchor) => {
              const lineY = y + anchor.y;
              doc.line(x, lineY, x + OL1735_SPECS.labelWidth, lineY);
              doc.text(anchor.value, x + 0.01, lineY - 0.004);
            });
          }

          const isSlotLogoOnly = slotValue === LOGO_ONLY_SLOT_ID;

          if (isSlotLogoOnly) {
            if (logoDataUri) {
              const logoW = 0.74 * effectiveLogoScale;
              const logoH = 0.18 * effectiveLogoScale;
              const centeredX = x + (OL1735_SPECS.labelWidth - logoW) / 2;
              const centeredY = y + (OL1735_SPECS.labelHeight - logoH) / 2;
              doc.addImage(logoDataUri, 'PNG', centeredX, centeredY, logoW, logoH);
            } else {
              doc.setTextColor(13, 35, 69);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7.5 * ELEMENT_SCALE.logo);
              doc.text(BRAND_HEADER_TEXT, x + OL1735_SPECS.labelWidth / 2, y + OL1735_SPECS.labelHeight / 2, { align: 'center' });
            }
            continue;
          }

          const product = getProductForSlot(slotValue);
          if (!product) continue;
          const pdfLegalText = String(product.legalText || LEGAL_USE_TEXT);
          const pdfStorageText = String(product.storageText || STORAGE_TEXT);

          if (logoDataUri) {
            // Keep logo fully in Zone 1 to avoid touching Zone 2 navy band.
            const topLogoW = 0.5 * labelLogoScale;
            const topLogoH = 0.12 * labelLogoScale;
            doc.addImage(logoDataUri, 'PNG', x + (OL1735_SPECS.labelWidth - topLogoW) / 2, yLogo, topLogoW, topLogoH);
          }

          const navyBandWidthIn = PDF_LOCKED_WIDTH.navyBand;
          const purityBandWidthIn = PDF_LOCKED_WIDTH.purityBand;
          const navyBandX = x + (OL1735_SPECS.labelWidth - navyBandWidthIn) / 2;
          const purityBandX = x + (OL1735_SPECS.labelWidth - purityBandWidthIn) / 2;
          const navyY = yNavyBand;
          const navyH = V28_LABEL.navyBandHeight;
          const bandCornerScalePdf = clampNumber(styleSettings.bandCornerScale, 0, 2.4);
          // Keep navy ribbon square to match vial-facing preview and side profile references.
          const navyCornerIn = 0;
          const purityCornerIn = Math.max(0, Math.min(LABEL_TEMPLATE.purityBandHeight / 2 - 0.001, 0.05 * bandCornerScalePdf));

          doc.setFillColor(styleSettings.primaryColor);
          doc.roundedRect(navyBandX, navyY, navyBandWidthIn, navyH, navyCornerIn, navyCornerIn, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          const nameText = String(product.name || '').toUpperCase();
          const maxNameWidth = navyBandWidthIn - 0.08;
          let nameFontSize = 8 * styleSettings.productNameScale * 0.92;
          doc.setFontSize(nameFontSize);
          if (typeof doc.setCharSpace === 'function') {
            // Lock PDF spacing to zero so saved output matches physical label typography.
            doc.setCharSpace(0);
          }
          while (nameFontSize > 4.5 * styleSettings.productNameScale && doc.getTextWidth(nameText) > maxNameWidth) {
            nameFontSize -= 0.5;
            doc.setFontSize(nameFontSize);
          }
          doc.text(nameText, x + OL1735_SPECS.labelWidth / 2, yProductText, { align: 'center', baseline: 'middle' });
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }

          doc.setTextColor(13, 35, 69);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7 * styleSettings.dosageScale);
          doc.text(String(product.strength || '10 mg'), x + OL1735_SPECS.labelWidth / 2, yDosage, { align: 'center', baseline: 'middle' });

          const purityY = yPurityBand;
          const purityH = LABEL_TEMPLATE.purityBandHeight;
          doc.setFillColor(styleSettings.secondaryColor);
          doc.roundedRect(purityBandX, purityY, purityBandWidthIn, purityH, purityCornerIn, purityCornerIn, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          const purityTextRaw = getPdfPurityBandText(product, index);
          const useSyntheticGeSymbol = purityTextRaw.startsWith('≥');
          const purityText = useSyntheticGeSymbol ? purityTextRaw.slice(1).trimStart() : purityTextRaw;
          let purityFontSize = 5.1 * styleSettings.purityScale;
          doc.setFontSize(purityFontSize);
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }
          while (purityFontSize > 4.2 * styleSettings.purityScale) {
            const textWidth = doc.getTextWidth(purityText);
            const symbolWidth = useSyntheticGeSymbol ? Math.max(0.038, doc.getTextWidth('>') * 0.78) : 0;
            const symbolGapForFit = useSyntheticGeSymbol ? Math.max(0.007, purityFontSize * 0.0016) : 0;
            if (textWidth + symbolWidth + symbolGapForFit <= purityBandWidthIn - 0.08) break;
            purityFontSize -= 0.1;
            doc.setFontSize(purityFontSize);
          }
          if (useSyntheticGeSymbol) {
            const symbolWidth = Math.max(0.038, doc.getTextWidth('>') * 0.78);
            const textWidth = doc.getTextWidth(purityText);
            const symbolGap = Math.max(0.007, purityFontSize * 0.0016);
            const combinedWidth = symbolWidth + symbolGap + textWidth;
            const startX = x + OL1735_SPECS.labelWidth / 2 - combinedWidth / 2;

            const geLeft = startX + 0.001;
            const geRight = startX + symbolWidth - 0.001;
            const geMidY = yPurityText - 0.001;
            const geLineWidth = Math.max(0.0048, Math.min(0.0068, purityFontSize * 0.00116));
            const geBaselineAdjust = -Math.max(0.0006, purityFontSize * 0.00016);
            const geBarDrop = Math.max(0.0012, purityFontSize * 0.00029);
            renderGreaterThanOrEqualSymbol(doc, {
              left: geLeft,
              right: geRight,
              midY: geMidY,
              lineWidth: geLineWidth,
              color: [255, 255, 255],
              profile: pdfSymbolProfile,
              baselineAdjust: geBaselineAdjust,
              barLengthScale: 1.15,
              barDrop: geBarDrop,
            });

            doc.text(purityText, startX + symbolWidth + symbolGap, yPurityText, { align: 'left', baseline: 'middle' });
          } else {
            doc.text(purityText, x + OL1735_SPECS.labelWidth / 2, yPurityText, { align: 'center', baseline: 'middle' });
          }
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }

          const footerTextRgb = hexToRgb(styleSettings.primaryColor, [13, 35, 69]);
          doc.setTextColor(...footerTextRgb);
          doc.setFont('helvetica', 'bold');
          const footerWrapperWidthIn = OL1735_SPECS.labelWidth - 0.04;
          const footerLineGapIn = Math.max(0.02, yFooterBottom - yLegal);
          const footerHeightLimitPt = (footerLineGapIn * 0.82) * 72;

          let legalFooterFontSize = clampNumber(4.5 * clampNumber(styleSettings.legalTextScale || 1, 0.25, 2.4), 3.1, 10.8);
          doc.setFontSize(legalFooterFontSize);
          while (
            legalFooterFontSize > 3.1 &&
            (doc.getTextWidth(pdfLegalText) > footerWrapperWidthIn - 0.01 || legalFooterFontSize > footerHeightLimitPt)
          ) {
            legalFooterFontSize -= 0.1;
            doc.setFontSize(legalFooterFontSize);
          }

          let storageFooterFontSize = clampNumber(4.5 * clampNumber(styleSettings.storageTextScale || 1, 0.25, 2.4), 3.1, 10.8);
          doc.setFontSize(storageFooterFontSize);
          while (
            storageFooterFontSize > 3.1 &&
            (doc.getTextWidth(pdfStorageText) > footerWrapperWidthIn - 0.01 || storageFooterFontSize > footerHeightLimitPt)
          ) {
            storageFooterFontSize -= 0.1;
            doc.setFontSize(storageFooterFontSize);
          }

          doc.setFontSize(legalFooterFontSize);
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }

          if (hasPdfLot) {
            doc.setTextColor(...footerTextRgb);
            doc.setFont('helvetica', 'bold');
            let lotFontSize = clampNumber(4.0, 3.2, 5.2);
            doc.setFontSize(lotFontSize);
            while (lotFontSize > 3.2 && doc.getTextWidth(pdfLotText) > footerWrapperWidthIn - 0.01) {
              lotFontSize -= 0.1;
              doc.setFontSize(lotFontSize);
            }
            doc.text(pdfLotText, x + OL1735_SPECS.labelWidth / 2, yLot, { align: 'center', baseline: 'top', maxWidth: footerWrapperWidthIn });
          }

          doc.text(pdfLegalText, x + OL1735_SPECS.labelWidth / 2, yLegal, { align: 'center', baseline: 'top', maxWidth: footerWrapperWidthIn });
          doc.setFontSize(storageFooterFontSize);
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }
          doc.text(pdfStorageText, x + OL1735_SPECS.labelWidth / 2, yFooterBottom, { align: 'center', baseline: 'top', maxWidth: footerWrapperWidthIn });
          if (typeof doc.setCharSpace === 'function') {
            doc.setCharSpace(0);
          }

          if (shouldShowBottomLineInPdf) {
            doc.setDrawColor(13, 35, 69);
            doc.setLineWidth(0.01);
            doc.line(x + 0.08, yBottomLine, x + OL1735_SPECS.labelWidth - 0.08, yBottomLine);
          }
        } finally {
          if (popGraphicsState) popGraphicsState();
        }
      }

      // ── DIAGNOSTIC GHOST LAYER ──
      if (pdfShowDiagnosticOverlay) {
        const GEOMETRY_ANCHORS = [
          { y: PDF_LOCKED_Y.logo,       label: `${PDF_LOCKED_Y.logo.toFixed(3)}" LOGO TOP` },
          { y: PDF_LOCKED_Y.navyBand,   label: '0.205" NAVY BAND' },
          { y: PDF_LOCKED_Y.productText,label: `${PDF_LOCKED_Y.productText.toFixed(3)}" PRODUCT` },
          { y: PDF_LOCKED_Y.dosage,     label: `${PDF_LOCKED_Y.dosage.toFixed(3)}" DOSAGE` },
          { y: PDF_LOCKED_Y.purityBand, label: '0.484" ORANGE BAND' },
          { y: PDF_LOCKED_Y.purityText, label: `${PDF_LOCKED_Y.purityText.toFixed(3)}" PURITY` },
          { y: PDF_LOCKED_Y.lot,        label: `${PDF_LOCKED_Y.lot.toFixed(3)}" LOT` },
          { y: PDF_LOCKED_Y.legal,      label: `${PDF_LOCKED_Y.legal.toFixed(3)}" LEGAL` },
          { y: PDF_LOCKED_Y.footerBottom,label: `${PDF_LOCKED_Y.footerBottom.toFixed(3)}" STORAGE` },
        ];

        doc.setDrawColor(0, 220, 220); // cyan
        doc.setLineWidth(0.005);
        doc.setTextColor(0, 180, 180);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);

        // Draw anchor lines through entire page width at each label row
        for (let row = 0; row < OL1735_SPECS.rows; row++) {
          const rowBaseY = OL1735_SPECS.marginTop + row * (OL1735_SPECS.labelHeight + OL1735_SPECS.verticalGap);
          GEOMETRY_ANCHORS.forEach(({ y }) => {
            const lineY = rowBaseY + y;
            doc.line(0, lineY, OL1735_SPECS.pageWidth, lineY);
          });
        }

        // Label each anchor only on row 0 — text at right margin
        const row0BaseY = OL1735_SPECS.marginTop;
        GEOMETRY_ANCHORS.forEach(({ y, label }) => {
          const lineY = row0BaseY + y;
          doc.text(label, OL1735_SPECS.pageWidth - 0.05, lineY - 0.008, { align: 'right' });
        });

        // Left-edge inch tick marks (0" through 11")
        doc.setDrawColor(0, 220, 220);
        doc.setLineWidth(0.005);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        for (let inch = 0; inch <= 11; inch++) {
          const tickY = inch;
          doc.line(0, tickY, 0.15, tickY);
          doc.text(`${inch}"`, 0.17, tickY + 0.012);
        }
      }

      const filename = `PEPTQ_OL1735_PrintCenter_${buildPdfTimestamp()}${pdfShowDiagnosticOverlay ? '_GHOST' : ''}.pdf`;
      if (mode === 'print') {
        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        doc.save(filename);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  // IDENTITY STEP
  if (appStep === 'identity') {
    const identityPreviewTargetWidth = isLgViewport ? 560 : 340;
    const identityPreviewScale = (identityPreviewTargetWidth / 380) * labelScale;
    const showMultiSheetPreview = paintMode === 'multi';
    const wizardTotalSteps = wizardMode === 'institutional' ? 3 : 2;
    return (
      <div className="min-h-[100dvh] bg-[#eef2f8] flex flex-col lg:flex-row">
        {appMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70]">
            <div className={`rounded-xl border px-4 py-2 text-sm font-black shadow-lg ${appMessage.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' : appMessage.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#d5ddea] bg-white text-[#19345d]'}`}>
              <div className="flex items-center gap-3">
                <span>{appMessage.text}</span>
                <button type="button" onClick={() => setAppMessage(null)} className="text-xs font-black opacity-70 hover:opacity-100">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {/* ── LEFT COL: Live Label Preview — top on mobile, left on desktop ── */}
        <div className="order-first w-full lg:flex-[1.15] bg-white border-b lg:border-b-0 lg:border-r border-[#d5ddea] flex flex-col items-center justify-center p-3 sm:p-5 lg:p-10 min-h-[30vh] sm:min-h-[34vh] lg:min-h-screen">
          <div className="w-full max-w-sm lg:max-w-[680px] flex justify-center">
            {showMultiSheetPreview ? (
              <div className="rounded-xl border border-[#d5ddea] bg-white p-3 sm:p-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: LABELS_PER_SHEET }).map((_, index) => {
                    const hasValue = Boolean(labelSheet[index]);
                    return (
                      <div
                        key={`mock-slot-${index}`}
                        className={`h-5 rounded-[4px] border ${hasValue ? 'border-[#1f3a5f]/45 bg-[#1f3a5f]/15' : 'border-[#d9e2f0] bg-[#f8fbff]'}`}
                      />
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-[10px] font-semibold text-[#3a5276]">48-label sheet mockup</p>
              </div>
            ) : (
              <div
                className="relative overflow-hidden bg-white border border-[#d5ddea] rounded-xl"
                style={{
                  width: `${identityPreviewTargetWidth}px`,
                  maxWidth: '100%',
                  height: `${Math.round(labelHeightPx * identityPreviewScale)}px`,
                }}
              >
                <div
                  className="absolute top-0 left-0"
                  style={{
                    width: '380px',
                    height: `${labelHeightPx}px`,
                    transformOrigin: 'top left',
                    transform: `scale(${identityPreviewScale})`,
                  }}
                >
                  {!isLogoOnlyMode && (
                    <>
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ top: `${toLabelY(V28_LABEL.logo, labelHeightPx)}px`, height: `${toLabelY(V28_LABEL.navyBand - V28_LABEL.logo, labelHeightPx)}px` }}>
                        <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="max-h-full w-auto object-contain" style={{ transform: `scale(${labelLogoScale})` }} />
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white font-black"
                        style={{
                          fontSize: `${productNameFontSize}px`,
                          backgroundColor: styleSettings.primaryColor,
                          width: `${navyBandWidth}%`,
                          letterSpacing: `${productLetterSpacingPx}px`,
                          borderRadius: `${navyBandRadius}px`,
                          top: `${toLabelY(V28_LABEL.navyBand, labelHeightPx)}px`,
                          height: `${toLabelY(V28_LABEL.navyBandHeight, labelHeightPx)}px`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {productName}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold leading-tight text-[#0d2345]"
                        style={{ fontSize: `${dosageFontSize}px`, top: `${toLabelY(UI_PREVIEW_Y.dosage, labelHeightPx)}px` }}
                      >
                        {productDose}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white font-black"
                        style={{
                          fontSize: `${purityFontSizePreview}px`,
                          backgroundColor: styleSettings.secondaryColor,
                          width: `${purityBandWidth}%`,
                          letterSpacing: `${purityLetterSpacingPx}px`,
                          borderRadius: `${purityBandRadius}px`,
                          top: `${toLabelY(V28_LABEL.purityBand, labelHeightPx)}px`,
                          height: `${toLabelY(V28_LABEL.purityBandHeight, labelHeightPx)}px`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {activePurityText}
                      </div>
                      {showActiveLotText && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                          style={{
                            color: styleSettings.primaryColor,
                            fontSize: `${Math.max(3.4, legalFontSize * 0.86)}px`,
                            top: `${toLabelY(UI_PREVIEW_Y.lot, labelHeightPx)}px`,
                            width: `${footerWrapperWidthPx}px`,
                            letterSpacing: `${Math.max(0, legalLetterSpacingPx * 0.72)}px`,
                          }}
                        >
                          {activeLotText}
                        </div>
                      )}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${legalFontSize}px`,
                          top: `${toLabelY(UI_PREVIEW_Y.legal, labelHeightPx)}px`,
                          width: `${footerWrapperWidthPx}px`,
                          letterSpacing: `${legalLetterSpacingPx}px`,
                        }}
                      >
                        {activeLegalText}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${storageFontSize}px`,
                          top: `${toLabelY(UI_PREVIEW_Y.storage, labelHeightPx)}px`,
                          width: `${footerWrapperWidthPx}px`,
                          letterSpacing: `${storageLetterSpacingPx}px`,
                        }}
                      >
                        {activeStorageText}
                      </div>
                    </>
                  )}
                  {isLogoOnlyMode && (
                    <div className="h-full flex items-center justify-center">
                      <img src={LOGO_IMAGE_URL} alt="PEPTQ logo" className="h-16 w-auto object-contain" style={{ transform: `scale(${effectiveLogoScale})` }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COL: Wizard + Branding footer — centered on mobile, footer-right on desktop ── */}
        <div className="order-last w-full lg:flex-[0.85] flex flex-col p-4 sm:p-6 lg:p-10 items-center justify-center lg:items-stretch">
          <div className="flex-1 w-full flex flex-col justify-center">
            {/* Wizard card */}
            <div className="bg-white rounded-2xl border border-[#d5ddea] p-6 shadow-sm w-full max-w-lg mx-auto">
              <div className="mb-5 flex items-start justify-between gap-3">
                <h2 className="text-xl font-black text-[#11284a]">What do you want to print?</h2>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Step {identityWizardStep} of {wizardTotalSteps}</p>
                </div>
              </div>
              {identityWizardStep === 1 && (
                <>
                  {!showGuidePage && !showAboutPage && (
                    <div className="grid grid-cols-2 gap-3">
                      {PROTOCOL_CARDS.map((card) => (
                        <button
                          key={card.key}
                          type="button"
                          onClick={() => handleProtocolSelect(card.key)}
                          className="w-full flex flex-col items-start gap-2 rounded-xl border-2 border-[#e8edf5] p-3 sm:p-4 sm:flex-row sm:items-center sm:gap-4 hover:border-brand-orange hover:bg-brand-orange/5 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/20 transition-colors">
                            <card.Icon size={20} className="text-brand-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-black text-sm text-[#11284a]">{card.title}</p>
                              <ArrowRight size={16} className="text-[#c4cdd9] group-hover:text-brand-orange transition-colors shrink-0" />
                            </div>
                            <p className="text-[11px] leading-4 sm:text-xs sm:leading-normal text-[#3a5276] mt-0.5">{card.desc}</p>
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomLabels(prev => !prev)}
                        className={`w-full flex flex-col items-start gap-2 rounded-xl border-2 p-3 sm:p-4 sm:flex-row sm:items-center sm:gap-4 transition-all group text-left ${showCustomLabels ? 'border-brand-orange bg-brand-orange/5' : 'border-[#e8edf5] hover:border-brand-orange hover:bg-brand-orange/5'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${showCustomLabels ? 'bg-brand-orange/20' : 'bg-brand-orange/10 group-hover:bg-brand-orange/20'}`}>
                          <FolderOpen size={20} className="text-brand-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-sm text-[#11284a]">Custom Labels</p>
                            <ChevronRight size={16} className={`transition-transform shrink-0 ${showCustomLabels ? 'rotate-90 text-brand-orange' : 'text-[#c4cdd9]'}`} />
                          </div>
                          <p className="text-[11px] leading-4 sm:text-xs sm:leading-normal text-[#3a5276] mt-0.5">Load a previously saved layout</p>
                        </div>
                      </button>
                      {showCustomLabels && (
                        <div className="rounded-xl border border-[#e4eaf5] bg-[#f8fbff] p-3 col-span-2">
                          {savedLayouts.length === 0 ? (
                            <p className="text-sm text-[#3a5276] text-center py-3">No saved layouts yet.<br />Create a print job and save it to see it here.</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {savedLayouts.map((layout) => (
                                <div key={layout.id} className="flex items-center gap-2 rounded-lg border border-[#e4eaf5] bg-white p-2.5">
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-black text-[#11284a]">{layout.name}</p>
                                    <p className="text-xs text-[#3a5276]">{new Date(layout.timestamp).toLocaleDateString()}</p>
                                  </div>
                                  <button type="button" onClick={() => { loadLayout(layout.id); setAppStep('editor'); }} className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-2.5 py-1.5 text-xs font-black text-white hover:bg-brand-orange/90 shrink-0">
                                    <FolderOpen size={11} /> Open
                                  </button>
                                  <button type="button" onClick={() => duplicateLayout(layout.id)} title="Duplicate" className="rounded-lg border border-[#d0d9e8] p-1.5 text-[#19345d] hover:bg-gray-100 shrink-0">
                                    <Copy size={11} />
                                  </button>
                                  <button type="button" onClick={() => deleteLayout(layout.id)} title="Delete" className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 shrink-0">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {showGuidePage && (
                    <div className="rounded-xl border border-[#d5ddea] bg-white p-4 space-y-3">
                      <div className="rounded-lg border border-[#e4eaf5] bg-[#f8fbff] p-3">
                        <div className="h-3 w-full rounded bg-[#1F3A5F] mb-2" />
                        <div className="h-2 w-24 mx-auto rounded bg-[#1f3a5f]/30 mb-2" />
                        <div className="h-3 w-full rounded bg-[#F76D00]" />
                      </div>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Single:</span> Goes to step configuration flow for one-product sheets.</p>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Editor:</span> Opens canvas editor directly for slot mapping.</p>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Logo:</span> Goes to step configuration flow for logo-only sheets.</p>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Output:</span> Print preview and PDF follow locked OL1735 geometry anchors.</p>
                      <button
                        type="button"
                        onClick={() => setShowGuidePage(false)}
                        className="mt-1 rounded-lg border border-[#d5ddea] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[#19345d] hover:bg-[#f4f7fa]"
                      >
                        Back
                      </button>
                    </div>
                  )}

                  {showAboutPage && (
                    <div className="rounded-xl border border-[#d5ddea] bg-white p-4 space-y-2">
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Official Blank:</span> OnlineLabels OL1735 template is the geometry source of truth.</p>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Canva PDF:</span> Use it for visual/style matching only, not layout geometry.</p>
                      <p className="text-xs text-[#3a5276]"><span className="font-black text-[#11284a]">Official Key Specs:</span> 8.5"x11" sheet, 1.75"x0.75" label, 48-up, 0.25" margins, 2.083" horizontal pitch, 0.886" vertical pitch.</p>
                      <div className="mt-2 rounded-lg border border-[#d0d9e8] bg-[#f8fbff] p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Diagnostic Print</p>
                        <label className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${showDiagnosticOverlay ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-[#d0d9e8] bg-white text-[#19345d] hover:bg-[#f4f7fa]'}`}>
                          <span>Ghost Overlay</span>
                          <input
                            type="checkbox"
                            checked={showDiagnosticOverlay}
                            onChange={(e) => setShowDiagnosticOverlay(e.target.checked)}
                            className="h-4 w-4 rounded"
                          />
                        </label>
                        <p className="mt-1.5 text-[10px] text-[#3a5276] leading-tight">PDF will include cyan anchor lines + inch rulers. Print on plain paper to verify OL1735 alignment.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAboutPage(false)}
                        className="mt-1 rounded-lg border border-[#d5ddea] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[#19345d] hover:bg-[#f4f7fa]"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </>
              )}

              {identityWizardStep === 2 && wizardMode !== 'private-label' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setIdentityWizardStep(1); setWizardMode(null); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5ddea] text-[#19345d] hover:bg-[#f4f7fa]"
                      aria-label="Back to step 1"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <h3 className="text-lg font-black text-[#11284a]">{wizardMode === 'institutional' ? 'Single Setup' : 'Logo Setup'}</h3>
                  </div>

                  {wizardMode === 'institutional' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value);
                          }}
                          placeholder="Search product name, strength, formula, CAS..."
                          className="w-full rounded-xl border border-[#d5ddea] bg-white px-4 py-3 pr-16 text-sm text-[#11284a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearchQuery('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-[#d5ddea] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#19345d] hover:bg-[#f4f7fa]"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="mt-2 h-56 overflow-y-auto overscroll-contain rounded-xl border border-[#d5ddea] bg-white p-1.5 shadow-sm">
                          {quickPickProducts.length === 0 ? (
                            <div className="h-full px-3 py-2 text-xs text-[#6b7f9f] flex items-center justify-center">No products found.</div>
                          ) : (
                            quickPickProducts.map((p) => (
                              <div
                                key={p.id}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${productSearchQuery.trim() ? 'bg-[#1f3a5f]/10 border border-[#1f3a5f]/20 hover:bg-[#1f3a5f]/15' : 'hover:bg-[#f4f7fa]'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProductId(p.id);
                                      fillEntireSheet(p.id);
                                      setProductSearchQuery(p.name);
                                    }}
                                    className="flex-1 text-left"
                                  >
                                    <p className="text-sm font-black text-[#11284a]">{p.name}</p>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[#3a5276]">
                                      <span>{p.strength || 'Vial'}</span>
                                      <span>{p.price ? `Price: ${p.price}` : 'Price: TBD'}</span>
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditCustomProduct(p)}
                                    className="rounded-lg border border-[#d5ddea] px-2 py-1 text-[11px] font-black text-[#19345d] hover:bg-white"
                                  >
                                    Edit Product
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      {selectedWizardProduct && (
                        <div className="rounded-xl border border-[#d5ddea] bg-[#f8fbff] px-3 py-3">
                          <p className="text-xs font-black uppercase tracking-widest text-[#3a5276]">Selected Product</p>
                          <p className="mt-1 text-sm font-black text-[#11284a]">{selectedWizardProduct.name}</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3a5276]">
                            <span>Strength: {selectedWizardProduct.strength || '10mg'}</span>
                            <span>Price: {selectedWizardProduct.price || 'TBD'}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#3a5276]">Purity: {getPurityBandText(selectedWizardProduct, activeSlot)}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={startAddCustomProduct}
                          className="rounded-xl border border-brand-orange bg-brand-orange/10 px-3 py-2 text-sm font-black text-brand-orange hover:bg-brand-orange/15"
                        >
                          Add Product
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedWizardProduct) {
                              startEditCustomProduct(selectedWizardProduct);
                              return;
                            }
                            setShowCustomProductQuickLoad((prev) => !prev);
                          }}
                          className="rounded-xl border border-[#d5ddea] px-3 py-2 text-sm font-black text-[#19345d] hover:bg-[#f4f7fa]"
                        >
                          Edit Product
                        </button>
                      </div>

                      {showCustomProductQuickLoad && (
                        <div className="rounded-xl border border-[#d5ddea] bg-white p-2.5 max-h-44 overflow-y-auto">
                          {customProducts.length === 0 ? (
                            <p className="text-xs text-[#6b7f9f] text-center py-2">No custom products saved yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {customProducts.map((product) => (
                                <div key={product.id} className="flex items-center gap-2 rounded-lg border border-[#e4eaf5] bg-[#f8fbff] px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProductId(product.id);
                                      fillEntireSheet(product.id);
                                      setProductSearchQuery(product.name);
                                    }}
                                    className="flex-1 text-left hover:text-brand-orange"
                                  >
                                    <p className="text-xs font-black text-[#11284a]">{product.name}</p>
                                    <p className="text-[11px] text-[#3a5276]">{product.strength || '10mg'} | {product.price || 'TBD'}</p>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditCustomProduct(product)}
                                    className="rounded-lg border border-[#d5ddea] px-2 py-1 text-[11px] font-black text-[#19345d] hover:bg-white"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {wizardMode === 'internal' && (
                    <div className="rounded-xl bg-[#f8fbff] border border-[#e4eaf5] px-4 py-3 text-sm text-[#3a5276]">
                      All 48 slots will render with the brand logo only - no product text.
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCustomProductQuickLoad(true)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#d5ddea] px-3 py-3 text-sm font-black text-[#19345d] hover:bg-[#f4f7fa] transition-colors"
                    >
                      <FolderOpen size={14} /> Load
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardMode === 'institutional' && selectedProductId) fillEntireSheet(selectedProductId);
                        generateSheetPdf('download', { cleanExport: true });
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#d5ddea] px-3 py-3 text-sm font-black text-[#19345d] hover:bg-[#f4f7fa] transition-colors"
                    >
                      <Download size={14} /> Save PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardMode === 'institutional' && selectedProductId) fillEntireSheet(selectedProductId);
                        generateSheetPdf('print', { cleanExport: true });
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#d5ddea] px-3 py-3 text-sm font-black text-[#19345d] hover:bg-[#f4f7fa] transition-colors"
                    >
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </div>
              )}

              {identityWizardStep === 3 && wizardMode === 'institutional' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomProductId('');
                        setCustomProductDraft(createDefaultCustomProductDraft());
                        setIdentityWizardStep(2);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5ddea] text-[#19345d] hover:bg-[#f4f7fa]"
                      aria-label="Back to single setup"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <h3 className="text-lg font-black text-[#11284a]">Edit Product</h3>
                  </div>

                  {!editingCustomProductId && (
                    <p className="rounded-lg border border-brand-orange/25 bg-brand-orange/5 px-3 py-2 text-xs text-[#3a5276]">
                      Creating a new custom product.
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customProductDraft.name}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Label Name"
                        className="flex-1 rounded-xl border border-[#d5ddea] bg-white px-4 py-2.5 text-sm text-[#11284a]"
                      />
                      <button type="button" onClick={() => setCustomProductDraft((prev) => ({ ...prev, name: '' }))} className="rounded-lg border border-[#d5ddea] px-2.5 py-2 text-xs font-black text-[#3a5276] hover:bg-[#f4f7fa]">Clear</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customProductDraft.strength}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, strength: normalizeStrengthText(e.target.value) }))}
                        placeholder="MG (e.g. 10mg)"
                        className="flex-1 rounded-xl border border-[#d5ddea] bg-white px-4 py-2.5 text-sm text-[#11284a]"
                      />
                      <button type="button" onClick={() => setCustomProductDraft((prev) => ({ ...prev, strength: '' }))} className="rounded-lg border border-[#d5ddea] px-2.5 py-2 text-xs font-black text-[#3a5276] hover:bg-[#f4f7fa]">Clear</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customProductDraft.purityText}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, purityText: normalizePuritySymbol(e.target.value) }))}
                        placeholder="Purity text"
                        className="flex-1 rounded-xl border border-[#d5ddea] bg-white px-4 py-2.5 text-sm text-[#11284a]"
                      />
                      <button type="button" onClick={() => setCustomProductDraft((prev) => ({ ...prev, purityText: '' }))} className="rounded-lg border border-[#d5ddea] px-2.5 py-2 text-xs font-black text-[#3a5276] hover:bg-[#f4f7fa]">Clear</button>
                    </div>
                    <div className="rounded-xl border border-[#d5ddea] bg-white px-3 py-2.5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#3a5276]">Purity Option</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPurityEditorMode('hplc-verified');
                            setCustomProductDraft((prev) => ({ ...prev, purityText: '≥99% Purity (HPLC-VERIFIED)' }));
                          }}
                          className={`rounded-lg border px-2 py-2 text-xs font-black ${String(customProductDraft.purityText || '').includes('HPLC-VERIFIED') ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-[#d5ddea] text-[#19345d] hover:bg-[#f4f7fa]'}`}
                        >
                          ≥99% Purity (HPLC-VERIFIED)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPurityEditorMode('hplc-dad');
                            setCustomProductDraft((prev) => ({ ...prev, purityText: '≥99% Purity (HPLC-DAD)' }));
                          }}
                          className={`rounded-lg border px-2 py-2 text-xs font-black ${String(customProductDraft.purityText || '').includes('HPLC-DAD') ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-[#d5ddea] text-[#19345d] hover:bg-[#f4f7fa]'}`}
                        >
                          ≥99% Purity (HPLC-DAD)
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customProductDraft.legalText}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, legalText: e.target.value }))}
                        placeholder="FOR RESEARCH USE ONLY"
                        className="flex-1 rounded-xl border border-[#d5ddea] bg-white px-4 py-2.5 text-sm text-[#11284a]"
                      />
                      <button type="button" onClick={() => setCustomProductDraft((prev) => ({ ...prev, legalText: '' }))} className="rounded-lg border border-[#d5ddea] px-2.5 py-2 text-xs font-black text-[#3a5276] hover:bg-[#f4f7fa]">Clear</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customProductDraft.storageText}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, storageText: e.target.value }))}
                        placeholder="STORE AT 2-8C"
                        className="flex-1 rounded-xl border border-[#d5ddea] bg-white px-4 py-2.5 text-sm text-[#11284a]"
                      />
                      <button type="button" onClick={() => setCustomProductDraft((prev) => ({ ...prev, storageText: '' }))} className="rounded-lg border border-[#d5ddea] px-2.5 py-2 text-xs font-black text-[#3a5276] hover:bg-[#f4f7fa]">Clear</button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#d5ddea] bg-[#f8fbff] p-3 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-[#3a5276]">Catalog info</p>
                    <p className="text-[11px] text-[#3a5276]">This section will be included in your main website and will go live after review.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customProductDraft.price}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="Price (example: $129)"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                      <input
                        type="text"
                        value={customProductDraft.formula}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, formula: e.target.value }))}
                        placeholder="Formula"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                      <input
                        type="text"
                        value={customProductDraft.cas}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, cas: e.target.value }))}
                        placeholder="CAS"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                      <input
                        type="text"
                        value={customProductDraft.pubchemCid}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, pubchemCid: e.target.value }))}
                        placeholder="PubChem CID"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                      <input
                        type="text"
                        value={customProductDraft.lotNumber}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, lotNumber: e.target.value }))}
                        placeholder="Lot Number"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                      <input
                        type="text"
                        value={customProductDraft.coaUrl}
                        onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, coaUrl: e.target.value }))}
                        placeholder="COA URL"
                        className="rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                      />
                    </div>
                    <input
                      type="text"
                      value={customProductDraft.qrUrl}
                      onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, qrUrl: e.target.value }))}
                      placeholder="QR Link URL"
                      className="w-full rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                    />
                    <textarea
                      value={customProductDraft.catalogRequestNotes}
                      onChange={(e) => setCustomProductDraft((prev) => ({ ...prev, catalogRequestNotes: e.target.value }))}
                      placeholder="Request details for website team"
                      rows={3}
                      className="w-full rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-sm text-[#11284a]"
                    />
                  </div>

                  <div className={`grid gap-3 ${editingCustomProductId ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {editingCustomProductId && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteCustomProduct(editingCustomProductId, customProductDraft.name || 'custom product');
                          setEditingCustomProductId('');
                          setCustomProductDraft(createDefaultCustomProductDraft());
                          setIdentityWizardStep(2);
                        }}
                        className="flex items-center justify-center rounded-xl border border-red-200 px-3 py-3 text-sm font-black text-red-600 hover:bg-red-50"
                      >
                        Delete Product
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={saveCustomProduct}
                      className="flex items-center justify-center rounded-xl bg-brand-orange px-3 py-3 text-sm font-black text-white hover:bg-brand-orange/90"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // EDITOR STEP
  const SHEET_PX = 96;
  const sheetWidthPx = Math.round(OL1735_SPECS.pageWidth * SHEET_PX);
  const sheetHeightPx = Math.round(OL1735_SPECS.pageHeight * SHEET_PX);
  const slotW = Math.round(OL1735_SPECS.labelWidth * SHEET_PX);
  const slotH = Math.round(OL1735_SPECS.labelHeight * SHEET_PX);

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#f4f7fa] overflow-hidden">
      {appMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70]">
          <div className={`rounded-xl border px-4 py-2 text-sm font-black shadow-lg ${appMessage.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' : appMessage.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#d5ddea] bg-white text-[#19345d]'}`}>
            <div className="flex items-center gap-3">
              <span>{appMessage.text}</span>
              <button type="button" onClick={() => setAppMessage(null)} className="text-xs font-black opacity-70 hover:opacity-100">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Col 1: Navigation + Actions ── */}
      <nav className="w-60 shrink-0 border-r border-[#d5ddea] bg-white flex-col overflow-hidden hidden lg:flex">
        <div className="px-5 pt-4 pb-4 border-b border-[#e4eaf5]">
          <button
            type="button"
            onClick={handleBackToIdentity}
            className="mb-3 block hover:opacity-70 transition-opacity"
            title="Back to home"
          >
            <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="max-h-7 w-auto object-contain" />
          </button>
          <div className="text-[10px] font-black uppercase tracking-widest text-brand-orange leading-tight">OL1735 Canvas Editor</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-brand-orange leading-tight">Production v1.4</div>
          <div className="text-[10px] text-[#8a9bba] mt-1">Geometry Lock v1.3</div>
        </div>

        <div className="px-5 py-4 border-b border-[#e4eaf5] space-y-2">
          <button
            type="button"
            onClick={() => {
              setStyleSettings((prev) => ({
                ...prev,
                heightPercent: FIXED_CONTAINER_HEIGHT_PERCENT,
                cornerRadius: FIXED_CONTAINER_CORNER_RADIUS,
              }));
              setShowFullscreenCalib(true);
            }}
            className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-brand-orange text-sm font-black text-brand-orange hover:bg-brand-orange/5 transition-colors"
          >
            Fullscreen Calibration
          </button>
          <button
            type="button"
            onClick={() => setShowPageLayout(prev => !prev)}
            className="w-full h-9 flex items-center justify-between px-3 rounded-xl border border-[#d5ddea] text-xs font-black uppercase tracking-wide text-[#3a5276] hover:bg-[#f4f7fa] transition-colors"
          >
            <span>Page Layout</span>
            <ChevronRight size={13} className={`transition-transform ${showPageLayout ? 'rotate-90' : ''}`} />
          </button>
          {showPageLayout && (
            <div className="rounded-lg border border-[#d7e0f0] bg-[#f8fbff] px-3 py-2.5 space-y-2">
              <button
                type="button"
                onClick={() => applyPageLayoutPreset('layout-1')}
                className="w-full rounded-lg border border-[#d0d9e8] bg-white px-2.5 py-2 text-left text-[11px] text-[#19345d] hover:bg-[#f4f7fa]"
              >
                <p className="font-black uppercase tracking-wide">Layout 1</p>
                <p className="text-[10px] text-[#6b7f9f]">Standard production layout</p>
              </button>
              <button
                type="button"
                onClick={() => applyPageLayoutPreset('layout-2')}
                className="w-full rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-2.5 py-2 text-left text-[11px] text-[#19345d] hover:bg-brand-orange/10"
              >
                <p className="font-black uppercase tracking-wide text-brand-orange">Layout 2</p>
                <p className="text-[10px] text-[#6b7f9f]">Bottle label style (photo matched)</p>
              </button>
            </div>
          )}
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3a5276] pt-1">Preview</p>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mt-1">
            <button
              type="button"
              onClick={() => setPreviewMode('label')}
              className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${previewMode === 'label' ? 'bg-white shadow text-[#11284a]' : 'text-slate-400 hover:text-[#11284a]'}`}
            >
              Label
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('page')}
              className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${previewMode === 'page' ? 'bg-brand-orange text-white shadow' : 'text-slate-400 hover:text-[#11284a]'}`}
            >
              Page
            </button>
          </div>
        </div>

        {/* Saved Layouts in Col1 */}
        <div className="px-5 py-3 border-b border-[#e4eaf5]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Saved Layouts</p>
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="w-full rounded-lg border border-[#d5ddea] bg-white px-3 py-2 text-xs text-[#11284a] placeholder:text-[#94a3b8] mb-2 focus:outline-none focus:ring-1 focus:ring-brand-orange/40"
            placeholder="Layout name"
          />
          <button
            type="button"
            onClick={saveLayout}
            className="w-full h-8 rounded-lg border border-[#d5ddea] text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 text-[#19345d] hover:bg-[#f4f7fa] transition-all"
          >
            <Save size={12} />
            Save Layout
          </button>
          <button
            type="button"
            onClick={clearAllSlots}
            className="w-full mt-2 h-8 rounded-lg border border-red-200 text-red-500 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
          >
            <Trash2 size={12} />
            Clear Page
          </button>
        </div>

        {/* Offline Vault */}
        <div className="px-5 py-3 border-b border-[#e4eaf5]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Offline Vault</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportVault}
              className="flex-1 h-8 rounded-lg bg-[#1F3A5F] text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 hover:bg-[#162d4a] transition-all"
            >
              <Download size={11} />
              Export
            </button>
            <label className="flex-1 h-8 rounded-lg border border-[#F76D00] text-[#F76D00] text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 hover:bg-orange-50 transition-all cursor-pointer">
              <Upload size={11} />
              Import
              <input type="file" accept=".json" className="hidden" onChange={importVault} />
            </label>
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-5 py-4 border-t border-[#e4eaf5] space-y-2">
          <div className="rounded-md bg-brand-orange/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-brand-orange text-center">
            {placedCount} / {LABELS_PER_SHEET} painted
          </div>
          <button
            type="button"
            onClick={() => generateSheetPdf('print')}
            disabled={isExportingPdf || placedCount === 0}
            className={`w-full h-9 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all border ${
              isExportingPdf || placedCount === 0
                ? 'border-[#d5ddea] text-[#869fc4] cursor-not-allowed'
                : 'border-[#d5ddea] text-[#19345d] hover:bg-[#f4f7fa]'
            }`}
          >
            <Printer size={13} />
            {isExportingPdf ? 'Preparing...' : 'Print'}
          </button>
          <button
            type="button"
            onClick={generateSheetPdf}
            disabled={isExportingPdf || placedCount === 0}
            className={`w-full h-10 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
              isExportingPdf || placedCount === 0
                ? 'bg-[#d5ddea] text-[#869fc4] cursor-not-allowed'
                : 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90'
            }`}
          >
            <Download size={14} />
            {isExportingPdf ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </nav>

      {/* ── Col 2: Full Sheet Canvas ── */}
      <main className="flex-1 overflow-auto bg-[#e8edf5] p-8 order-last lg:order-none">
        {previewMode === 'label' ? (
          <div className="flex items-start justify-center min-h-full pt-10">
            <div className="w-full max-w-[920px] rounded-2xl border border-[#cdd8ec] bg-white shadow-xl p-6">
              <div
                className={`relative mx-auto bg-white ${showBorders ? 'border-2 border-black' : 'border border-slate-300'}`}
                style={{
                  width: `${FULLSCREEN_CALIB_WIDTH_PX}px`,
                  height: `${FULLSCREEN_CALIB_HEIGHT_PX}px`,
                  borderRadius: `${FIXED_CONTAINER_CORNER_RADIUS * FULLSCREEN_CALIB_SCALE}px`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{
                    inset: `${DANGER_ZONE_PX}px`,
                    border: '1px dashed rgba(239, 68, 68, 0.55)',
                  }}
                  aria-hidden="true"
                />

                {!isLogoOnlyMode && (
                  <div
                    className="absolute inset-0"
                    style={{ transform: `translate(${clampedOffsetX * FULLSCREEN_CALIB_SCALE}px, ${clampedOffsetY * FULLSCREEN_CALIB_SCALE}px)` }}
                  >
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ top: `${toFullscreenCalibY(V28_LABEL.logo)}px`, height: `${toFullscreenCalibY(V28_LABEL.navyBand - V28_LABEL.logo)}px` }}>
                      <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="max-h-full w-auto object-contain" style={{ transform: `scale(${labelLogoScale})` }} />
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black"
                      style={{
                        fontSize: `${productNameFontSize * FULLSCREEN_CALIB_SCALE}px`,
                        backgroundColor: styleSettings.primaryColor,
                        width: `${navyBandWidth}%`,
                        letterSpacing: `${productLetterSpacingPx * FULLSCREEN_CALIB_SCALE}px`,
                        borderRadius: `${navyBandRadius * FULLSCREEN_CALIB_SCALE}px`,
                        top: `${toFullscreenCalibY(V28_LABEL.navyBand)}px`,
                        height: `${toFullscreenCalibY(V28_LABEL.navyBandHeight)}px`,
                      }}
                    >
                      {productName}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold text-[#0d2345]"
                      style={{ fontSize: `${dosageFontSize * FULLSCREEN_CALIB_SCALE}px`, top: `${toFullscreenCalibY(UI_PREVIEW_Y.dosage)}px` }}
                    >
                      {productDose}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black"
                      style={{
                        fontSize: `${purityFontSizePreview * FULLSCREEN_CALIB_SCALE}px`,
                        backgroundColor: styleSettings.secondaryColor,
                        width: `${purityBandWidth}%`,
                        letterSpacing: `${purityLetterSpacingPx * FULLSCREEN_CALIB_SCALE}px`,
                        borderRadius: '999px',
                        top: `${toFullscreenCalibY(V28_LABEL.purityBand)}px`,
                        height: `${toFullscreenCalibY(V28_LABEL.purityBandHeight)}px`,
                      }}
                    >
                      {activePurityText}
                    </div>
                    {showActiveLotText && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${Math.max(3.4, legalFontSize * 0.86) * CALIB_SCALE}px`,
                          top: `${calibY(UI_PREVIEW_Y.lot)}px`,
                          width: `${footerWrapperWidthPx * CALIB_SCALE}px`,
                          letterSpacing: `${Math.max(0, legalLetterSpacingPx * 0.72) * CALIB_SCALE}px`,
                        }}
                      >
                        {activeLotText}
                      </div>
                    )}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold text-[#1d2f4f] leading-none whitespace-nowrap"
                      style={{
                        fontSize: `${legalFontSize * FULLSCREEN_CALIB_SCALE}px`,
                        top: `${toFullscreenCalibY(UI_PREVIEW_Y.legal)}px`,
                        width: `${footerWrapperWidthPx * FULLSCREEN_CALIB_SCALE}px`,
                        letterSpacing: `${legalLetterSpacingPx * FULLSCREEN_CALIB_SCALE}px`,
                      }}
                    >
                      {activeLegalText}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold text-[#1d2f4f] leading-none whitespace-nowrap"
                      style={{
                        fontSize: `${storageFontSize * FULLSCREEN_CALIB_SCALE}px`,
                        top: `${toFullscreenCalibY(UI_PREVIEW_Y.storage)}px`,
                        width: `${footerWrapperWidthPx * FULLSCREEN_CALIB_SCALE}px`,
                        letterSpacing: `${storageLetterSpacingPx * FULLSCREEN_CALIB_SCALE}px`,
                      }}
                    >
                      {activeStorageText}
                    </div>
                  </div>
                )}

                {isLogoOnlyMode && (
                  <div
                    className="h-full flex items-center justify-center"
                    style={{ transform: `translate(${clampedOffsetX * FULLSCREEN_CALIB_SCALE}px, ${clampedOffsetY * FULLSCREEN_CALIB_SCALE}px)` }}
                  >
                    <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="h-24 w-auto object-contain" />
                  </div>
                )}

                {showMeasurements && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {measurementAnchors.map((anchor, idx) => (
                      <line
                        key={idx}
                        x1="0"
                        y1={toFullscreenCalibY(anchor.y)}
                        x2="100%"
                        y2={toFullscreenCalibY(anchor.y)}
                        stroke="#00a8ff"
                        strokeWidth="1"
                        opacity="0.5"
                      />
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-center min-h-full pt-6">
            {/* Sheet wrapper with external dimension annotations */}
            <div className="relative shrink-0">
              {/* Top dimension ruler: 8.50" — spans only the sheet width */}
              <div className="relative flex items-center justify-center mb-1 pointer-events-none select-none" style={{ width: `${sheetWidthPx}px` }}>
                <div className="absolute left-0 right-0 border-t border-pink-400/60" style={{ top: '50%' }} />
                <span className="relative z-10 bg-[#e8edf5] px-2 text-[9px] font-bold text-pink-400">8.50"</span>
              </div>

              <div className="flex items-start">
                {/* Left dimension ruler: 11.00" */}
                <div className="flex flex-col items-center justify-center mr-1 pointer-events-none select-none shrink-0" style={{ height: `${sheetHeightPx}px` }}>
                  <div className="relative flex-1 flex items-center justify-center w-5">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-pink-400/60" />
                    <span className="relative z-10 bg-[#e8edf5] py-1 text-[9px] font-bold text-pink-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>11.00"</span>
                  </div>
                </div>
                <div
                  className="relative bg-white shadow-2xl border border-slate-300 shrink-0"
                  style={{ width: `${sheetWidthPx}px`, height: `${sheetHeightPx}px` }}
                >
                  {/* 0.25" margin guide */}
                  <div
                    className="absolute pointer-events-none border border-dashed border-pink-400/70"
                    style={{ inset: `${Math.round(OL1735_SPECS.marginTop * SHEET_PX)}px` }}
                  >
                    <span className="absolute -top-4 left-0 text-[9px] text-pink-400 font-bold select-none">0.25" margin</span>
                    <span className="absolute -top-4 right-0 text-[9px] text-pink-400/80 font-bold select-none">Sheet 8.50" × 11.00" · OL1735</span>
                  </div>

              {/* 48 label slots */}
              {labelSheet.map((slotValue, index) => {
                const row = Math.floor(index / OL1735_SPECS.cols);
                const col = index % OL1735_SPECS.cols;
                const lx = Math.round((OL1735_SPECS.marginLeft + col * (OL1735_SPECS.labelWidth + OL1735_SPECS.horizontalGap)) * SHEET_PX);
                const ly = Math.round((OL1735_SPECS.marginTop + row * (OL1735_SPECS.labelHeight + OL1735_SPECS.verticalGap)) * SHEET_PX);
                const isActive = activeSlot === index;
                const activeRow = Math.floor(activeSlot / OL1735_SPECS.cols);
                const activeCol = activeSlot % OL1735_SPECS.cols;
                const isInActiveRow = row === activeRow;
                const isInActiveCol = col === activeCol;
                const isLogoSlot = slotValue === LOGO_ONLY_SLOT_ID;
                const slotProduct = getProductForSlot(slotValue);
                const isEmpty = !slotValue;
                return (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveSlotFromGrid(index);
                      setAssignLabelCode(slotCodeForIndex(index));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveSlotFromGrid(index);
                        setAssignLabelCode(slotCodeForIndex(index));
                      }
                    }}
                    className={`absolute cursor-pointer overflow-hidden transition-shadow ${showBorders ? 'border border-slate-700' : 'border border-slate-200'} ${isActive ? 'ring-2 ring-green-500 ring-offset-1 z-10' : rowApplied && isInActiveRow ? 'ring-2 ring-green-400' : columnApplied && isInActiveCol ? 'ring-2 ring-emerald-400' : isInActiveRow ? 'ring-1 ring-blue-400' : isInActiveCol ? 'ring-1 ring-indigo-400' : 'hover:ring-1 hover:ring-brand-orange/50'} bg-white`}
                    style={{ left: lx, top: ly, width: slotW, height: slotH, borderRadius: 3 }}
                  >
                    {isEmpty && (
                      <div className="w-full h-full flex items-center justify-center bg-[#f7f9fc]">
                        <span className="text-[9px] font-bold text-[#c0c9d8]">{index + 1}</span>
                      </div>
                    )}
                    {!isEmpty && isLogoSlot && (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="h-3 w-auto object-contain opacity-80" />
                      </div>
                    )}
                    {!isEmpty && !isLogoSlot && slotProduct && (
                      <div className="w-full h-full relative bg-white overflow-hidden">
                        <img
                          src={LOGO_IMAGE_URL}
                          alt=""
                          className="absolute left-1/2 -translate-x-1/2 object-contain"
                          style={{ top: `${V28_LABEL.logo * SHEET_PX}px`, height: '6px' }}
                        />
                        <div
                          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black leading-none overflow-hidden whitespace-nowrap"
                          style={{
                            backgroundColor: styleSettings.primaryColor,
                            top: `${V28_LABEL.navyBand * SHEET_PX}px`,
                            height: `${V28_LABEL.navyBandHeight * SHEET_PX}px`,
                            width: `${navyBandWidth}%`,
                            fontSize: '5.5px',
                            borderRadius: '0px',
                          }}
                        >
                          {String(slotProduct.name || '').toUpperCase()}
                        </div>
                        <div
                          className="absolute left-1/2 -translate-x-1/2 text-[#0d2345] font-semibold"
                          style={{ top: `${UI_PREVIEW_Y.dosage * SHEET_PX}px`, fontSize: '5px', transform: 'translate(-50%, -50%)' }}
                        >
                          {String(slotProduct.strength || '10 mg')}
                        </div>
                        <div
                          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black leading-none overflow-hidden whitespace-nowrap"
                          style={{
                            backgroundColor: styleSettings.secondaryColor,
                            top: `${V28_LABEL.purityBand * SHEET_PX}px`,
                            height: `${V28_LABEL.purityBandHeight * SHEET_PX}px`,
                            width: `${purityBandWidth}%`,
                            fontSize: '4px',
                            borderRadius: '999px',
                          }}
                        >
                          {getPurityBandText(slotProduct, index)}
                        </div>
                        {showMeasurements && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {measurementAnchors.map((anchor, i) => (
                              <line
                                key={i}
                                x1="0" y1={anchor.y * SHEET_PX}
                                x2={slotW} y2={anchor.y * SHEET_PX}
                                stroke="#00a8ff" strokeWidth="0.5" opacity="0.45"
                              />
                            ))}
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

                {/* Right dimension ruler: 11.00" */}
                <div className="flex flex-col items-center justify-center ml-1 pointer-events-none select-none shrink-0" style={{ height: `${sheetHeightPx}px` }}>
                  <div className="relative flex-1 flex items-center justify-center w-5">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-pink-400/60" />
                    <span className="relative z-10 bg-[#e8edf5] py-1 text-[9px] font-bold text-pink-400 writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>11.00"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>

        {/* RIGHT: Settings Sidebar */}
        <aside className="w-full lg:w-[420px] bg-white border-b lg:border-b-0 lg:border-l border-[#d5ddea] overflow-y-auto flex flex-col gap-3 p-4 shrink-0 order-first lg:order-none max-h-[42vh] lg:max-h-none">
          {/* Label Preview */}
          <div className="rounded-xl border border-[#d5ddea] overflow-hidden">
            <div
              className="relative overflow-hidden bg-white"
              style={{ height: `${Math.round(labelHeightPx * (388 / 380) * labelScale)}px` }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  width: '380px',
                  height: `${labelHeightPx}px`,
                  transformOrigin: 'top left',
                  transform: `scale(${(388 / 380) * labelScale})`,
                }}
              >
                  {previewMode === 'page' && showMeasurements && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: `${FIXED_CONTAINER_CORNER_RADIUS}px` }}>
                      {measurementAnchors.map((anchor, idx) => {
                        const yPos = toLabelY(anchor.y, labelHeightPx);
                        return (
                          <g key={idx}>
                            <line x1="0" y1={yPos} x2="100%" y2={yPos} stroke="#00a8ff" strokeWidth="1" opacity="0.65" />
                            <text x="3" y={yPos - 2} fontSize="10" fill="#00a8ff" fontWeight="bold">{anchor.value}</text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                  {!isLogoOnlyMode && (
                    <>
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ top: `${toLabelY(V28_LABEL.logo, labelHeightPx)}px`, height: `${toLabelY(V28_LABEL.navyBand - V28_LABEL.logo, labelHeightPx)}px` }}>
                        <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="max-h-full w-auto object-contain" style={{ transform: `scale(${labelLogoScale})` }} />
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white font-black"
                        style={{
                          fontSize: `${productNameFontSize}px`,
                          backgroundColor: styleSettings.primaryColor,
                          width: `${navyBandWidth}%`,
                          letterSpacing: `${productLetterSpacingPx}px`,
                          borderRadius: `${navyBandRadius}px`,
                          top: `${toLabelY(V28_LABEL.navyBand, labelHeightPx)}px`,
                          height: `${toLabelY(V28_LABEL.navyBandHeight, labelHeightPx)}px`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {productName}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold leading-tight text-[#0d2345]"
                        style={{ fontSize: `${dosageFontSize}px`, top: `${toLabelY(UI_PREVIEW_Y.dosage, labelHeightPx)}px` }}
                      >
                        {productDose}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white font-black"
                        style={{
                          fontSize: `${purityFontSizePreview}px`,
                          backgroundColor: styleSettings.secondaryColor,
                          width: `${purityBandWidth}%`,
                          letterSpacing: `${purityLetterSpacingPx}px`,
                          borderRadius: `${purityBandRadius}px`,
                          top: `${toLabelY(V28_LABEL.purityBand, labelHeightPx)}px`,
                          height: `${toLabelY(V28_LABEL.purityBandHeight, labelHeightPx)}px`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {activePurityText}
                      </div>
                      {showActiveLotText && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                          style={{
                            color: styleSettings.primaryColor,
                            fontSize: `${Math.max(3.4, legalFontSize * 0.86)}px`,
                            top: `${toLabelY(UI_PREVIEW_Y.lot, labelHeightPx)}px`,
                            width: `${footerWrapperWidthPx}px`,
                            letterSpacing: `${Math.max(0, legalLetterSpacingPx * 0.72)}px`,
                          }}
                        >
                          {activeLotText}
                        </div>
                      )}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${legalFontSize}px`,
                          top: `${toLabelY(UI_PREVIEW_Y.legal, labelHeightPx)}px`,
                          width: `${footerWrapperWidthPx}px`,
                          letterSpacing: `${legalLetterSpacingPx}px`,
                        }}
                      >
                        {activeLegalText}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${storageFontSize}px`,
                          top: `${toLabelY(UI_PREVIEW_Y.storage, labelHeightPx)}px`,
                          width: `${footerWrapperWidthPx}px`,
                          letterSpacing: `${storageLetterSpacingPx}px`,
                        }}
                      >
                        {activeStorageText}
                      </div>
                      {shouldShowBottomLine && <div className="absolute left-[4.6%] right-[4.6%] border-t border-[#0d2345]/75" style={{ top: `${toLabelY(0.735, labelHeightPx)}px` }} />}
                    </>
                  )}
                  {isLogoOnlyMode && (
                    <div className="h-full flex items-center justify-center">
                      <img src={LOGO_IMAGE_URL} alt="PEPTQ logo" className="h-16 w-auto object-contain" style={{ transform: `scale(${effectiveLogoScale})` }} />
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-[#d5ddea] p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#11284a]">Settings</p>
              <div className="space-y-2">
                <label className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${showBorders ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700' : 'border-[#d0d9e8] bg-white text-[#19345d]'}`}>
                  Borders
                  <input type="checkbox" checked={showBorders} onChange={(e) => setShowBorders(e.target.checked)} className="h-4 w-4 rounded" />
                </label>
                <label className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${showMeasurements ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-[#d0d9e8] bg-white text-[#19345d]'}`}>
                  Measurements
                  <input type="checkbox" checked={showMeasurements} onChange={(e) => setShowMeasurements(e.target.checked)} className="h-4 w-4 rounded" />
                </label>
                <label className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${showBottomLine ? 'border-[#ffd4a5] bg-[#fff6eb] text-[#b25700]' : 'border-[#d0d9e8] bg-white text-[#19345d]'}`}>
                  Bottom Line
                  <input type="checkbox" checked={showBottomLine} onChange={(e) => setShowBottomLine(e.target.checked)} className="h-4 w-4 rounded" />
                </label>
              </div>

            </div>

          {/* Slot Assignment */}
          <div className="rounded-xl border border-[#d5ddea]">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'product' ? null : 'product')}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-black uppercase tracking-wide rounded-xl text-[#11284a]"
            >
              <span>Slot Assignment</span>
              <span className="text-[#3a5276]">{expandedSection === 'product' ? '−' : '+'}</span>
            </button>
            {expandedSection === 'product' && (
              <div className="p-4 space-y-3 border-t border-[#d5ddea]">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'single', label: 'Product' },
                    { key: 'logo', label: 'Logo' },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setPaintMode(mode.key)}
                      className={`h-9 rounded-lg border text-xs font-black tracking-wide ${paintMode === mode.key ? 'border-brand-orange bg-brand-orange/20 text-brand-orange' : 'border-[#d0d9e8] bg-white text-[#19345d]'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#3a5276]">Target Slot</p>
                    <select
                      value={assignLabelCode}
                      onChange={(event) => {
                        const nextCode = event.target.value;
                        setAssignLabelCode(nextCode);
                        const nextIndex = slotIndexFromCode(nextCode);
                        if (nextIndex !== null) setActiveSlotFromGrid(nextIndex);
                      }}
                      className="w-full rounded-lg border border-[#d0d9e8] bg-white text-[#19345d] px-3 py-2 text-sm"
                    >
                      {assignLabelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#3a5276]">Select Content</p>
                    <select
                      value={selectedProductId}
                      onChange={(event) => setSelectedProductId(event.target.value)}
                      className="w-full rounded-lg border border-[#d0d9e8] bg-white text-[#19345d] px-3 py-2 text-sm"
                    >
                      {allProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#3a5276]">Paint Scope</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={paintActiveSlot} className="rounded-lg bg-brand-orange text-white text-xs font-black uppercase tracking-wide py-2">
                    Label
                  </button>
                  <button type="button" onClick={applyActiveRow} className="rounded-lg border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wide py-2 hover:bg-blue-50">
                    Row
                  </button>
                  <button type="button" onClick={applyActiveColumn} className="rounded-lg border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wide py-2 hover:bg-indigo-50">
                    Column
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateRandomHalfPuritySheet}
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wide py-2"
                >
                  Generate Random 48/48
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void refreshApprovedMapFromSheet();
                    }}
                    disabled={isRefreshingSheetMap}
                    className="rounded-lg border border-cyan-300 bg-cyan-50 text-cyan-700 text-xs font-black uppercase tracking-wide py-2 disabled:opacity-60"
                  >
                    {isRefreshingSheetMap ? 'Refreshing...' : 'Refresh from Sheet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyApprovedRecordsToSlots(10)}
                    disabled={!sheetMapRecords.length}
                    className="rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-xs font-black uppercase tracking-wide py-2 disabled:opacity-60"
                  >
                    Load Top 10
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void generateProofPdfTopTen();
                  }}
                  disabled={isExportingPdf || isRefreshingSheetMap}
                  className="w-full rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wide py-2 disabled:opacity-60"
                >
                  {isExportingPdf ? 'Generating Proof...' : 'Generate Proof PDF (Top 10)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void generateProofPdfAllApproved();
                  }}
                  disabled={isExportingPdf || isRefreshingSheetMap}
                  className="w-full rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wide py-2 disabled:opacity-60"
                >
                  {isExportingPdf ? 'Generating Proof...' : 'Generate Proof PDF (All Approved)'}
                </button>
                <p className="text-[10px] font-semibold text-[#3a5276]">
                  Approved cache: {sheetMapRecords.length} record(s)
                </p>
                <p className="text-[10px] font-semibold text-[#3a5276]">
                  OL1735 Canvas Editor · Production v1.4 · Geometry Lock v1.3
                </p>
                {(rowApplied || columnApplied) && (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRowApplied(false);
                        setColumnApplied(false);
                      }}
                      className="rounded-lg border border-[#d0d9e8] text-[#19345d] text-xs font-black uppercase tracking-wide py-2"
                    >
                      Select Another
                    </button>
                  </div>
                )}
                <button type="button" onClick={clearActiveSlot} className="w-full rounded-lg border border-[#d0d9e8] text-[#19345d] text-xs font-black uppercase tracking-wide py-2 inline-flex items-center justify-center gap-1">
                  <Eraser size={12} />
                  Clear Selected
                </button>
              </div>
            )}
          </div>

          {/* Rename Purity */}
          <div className="rounded-xl border border-[#d5ddea]">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'identity' ? null : 'identity')}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-black uppercase tracking-wide rounded-xl text-[#11284a]"
            >
              <span>Rename Purity</span>
              <span className="text-[#3a5276]">{expandedSection === 'identity' ? '−' : '+'}</span>
            </button>
            {expandedSection === 'identity' && (
              <div className="p-4 space-y-3 border-t border-[#d5ddea]">
                <select
                  value={purityEditorMode}
                  onChange={(event) => setPurityEditorMode(event.target.value)}
                  className="w-full rounded-lg border border-[#d0d9e8] bg-white text-[#19345d] px-3 py-2 text-sm"
                >
                  <option value="hplc-dad">HPLC-DAD</option>
                  <option value="hplc-verified">HPLC-VERIFIED</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="text"
                  value={customIdentityText}
                  onChange={(event) => setCustomIdentityText(normalizePuritySymbol(event.target.value))}
                  className="w-full rounded-lg border border-[#d0d9e8] bg-white text-[#19345d] px-3 py-2 text-sm"
                  placeholder="Custom purity text"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (purityEditorMode === 'custom') {
                      setIdentityMode('custom');
                    } else if (purityEditorMode === 'hplc-dad') {
                      setIdentityMode('internal');
                    } else {
                      setIdentityMode('verified');
                    }
                    setExpandedSection(null);
                  }}
                  className="w-full rounded-lg bg-brand-orange text-white text-xs font-black uppercase tracking-wide py-2"
                >
                  Save
                </button>
              </div>
            )}
          </div>

        </aside>

      {/* OL1735 Fullscreen Calibration Overlay */}
      {showFullscreenCalib && (() => {
        const CALIB_SCALE = FULLSCREEN_CALIB_SCALE;
        const calibH = FULLSCREEN_CALIB_HEIGHT_PX;
        const calibW = FULLSCREEN_CALIB_WIDTH_PX;
        const calibY = toFullscreenCalibY;
        return (
          <div className="fixed inset-0 z-50 flex bg-white overflow-hidden">

            {/* ── Fullscreen Calibration Controls ── */}
            <div className="w-80 shrink-0 border-r border-[#e4eaf5] flex flex-col bg-white">
              <div className="px-4 py-5 flex-1 overflow-auto">
                <div className="rounded-xl border border-[#d5ddea] bg-[#f8fbff] p-3 space-y-3">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Scale</div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Scale ({Math.round(styleSettings.scale * 100)}%)</span>
                        <button
                          type="button"
                          onClick={() => applyGlobalScalePercent(100)}
                          className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white"
                        >
                          Reset
                        </button>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="240"
                        step="1"
                        value={Math.round(styleSettings.scale * 100)}
                        onChange={(e) => applyGlobalScalePercent(Number(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Primary Color (Navy Band)</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['#1F3A5F', '#0d2345', '#163050', '#2d5a8e', '#3b82f6', '#7c3aed', '#ef4444', '#000000'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateStyle('primaryColor', c)}
                          className="h-6 w-6 rounded-full border-2 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c, borderColor: styleSettings.primaryColor === c ? '#F76D00' : 'rgba(0,0,0,0.2)' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#3a5276] mb-2">Secondary Color (Purity Band)</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['#F76D00', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateStyle('secondaryColor', c)}
                          className="h-6 w-6 rounded-full border-2 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c, borderColor: styleSettings.secondaryColor === c ? '#1F3A5F' : 'rgba(0,0,0,0.2)' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#3a5276]">Label Dimensions</div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Band Width ({Math.round(styleSettings.widthPercent)}%)</span>
                        <button type="button" onClick={() => updateBandWidthPercent(94)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="40" max="99" step="1" value={Math.round(styleSettings.widthPercent)} onChange={(e) => updateBandWidthPercent(Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Band Corner Scale ({Math.round(styleSettings.bandCornerScale * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('bandCornerScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="0" max="240" step="1" value={Math.round(styleSettings.bandCornerScale * 100)} onChange={(e) => updateElementScalePercent('bandCornerScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Logo Scale ({Math.round(styleSettings.logoScale * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('logoScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(styleSettings.logoScale * 100)} onChange={(e) => updateElementScalePercent('logoScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Product Name Scale ({Math.round(styleSettings.productNameScale * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('productNameScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(styleSettings.productNameScale * 100)} onChange={(e) => updateElementScalePercent('productNameScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Dosage Scale ({Math.round(styleSettings.dosageScale * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('dosageScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(styleSettings.dosageScale * 100)} onChange={(e) => updateElementScalePercent('dosageScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Purity Scale ({Math.round(styleSettings.purityScale * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('purityScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(styleSettings.purityScale * 100)} onChange={(e) => updateElementScalePercent('purityScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Product Letter Space ({Math.round(clampNumber(styleSettings.productLetterSpacingScale || 1, 0, 3) * 100)}%)</span>
                        <button type="button" onClick={() => updateStyle('productLetterSpacingScale', 1)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="0" max="300" step="1" value={Math.round(clampNumber(styleSettings.productLetterSpacingScale || 1, 0, 3) * 100)} onChange={(e) => updateStyle('productLetterSpacingScale', Number(e.target.value) / 100)} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Purity Letter Space ({Math.round(clampNumber(styleSettings.purityLetterSpacingScale || 1, 0, 3) * 100)}%)</span>
                        <button type="button" onClick={() => updateStyle('purityLetterSpacingScale', 1)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="0" max="300" step="1" value={Math.round(clampNumber(styleSettings.purityLetterSpacingScale || 1, 0, 3) * 100)} onChange={(e) => updateStyle('purityLetterSpacingScale', Number(e.target.value) / 100)} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Legal Scale ({Math.round(clampNumber(styleSettings.legalTextScale || 1, 0.25, 2.4) * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('legalTextScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(clampNumber(styleSettings.legalTextScale || 1, 0.25, 2.4) * 100)} onChange={(e) => updateElementScalePercent('legalTextScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Legal Letter Space ({Math.round(clampNumber(styleSettings.legalLetterSpacingScale || 1, 0, 3) * 100)}%)</span>
                        <button type="button" onClick={() => updateStyle('legalLetterSpacingScale', 1)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="0" max="300" step="1" value={Math.round(clampNumber(styleSettings.legalLetterSpacingScale || 1, 0, 3) * 100)} onChange={(e) => updateStyle('legalLetterSpacingScale', Number(e.target.value) / 100)} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Storage Scale ({Math.round(clampNumber(styleSettings.storageTextScale || 1, 0.25, 2.4) * 100)}%)</span>
                        <button type="button" onClick={() => updateElementScalePercent('storageTextScale', 100)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="25" max="240" step="1" value={Math.round(clampNumber(styleSettings.storageTextScale || 1, 0.25, 2.4) * 100)} onChange={(e) => updateElementScalePercent('storageTextScale', Number(e.target.value))} className="w-full mt-1" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#3a5276]">
                        <span>Storage Letter Space ({Math.round(clampNumber(styleSettings.storageLetterSpacingScale || 1, 0, 3) * 100)}%)</span>
                        <button type="button" onClick={() => updateStyle('storageLetterSpacingScale', 1)} className="rounded border border-[#d5ddea] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#19345d] hover:bg-white">Reset</button>
                      </div>
                      <input type="range" min="0" max="300" step="1" value={Math.round(clampNumber(styleSettings.storageLetterSpacingScale || 1, 0, 3) * 100)} onChange={(e) => updateStyle('storageLetterSpacingScale', Number(e.target.value) / 100)} className="w-full mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#e4eaf5] space-y-2">
                <button
                  type="button"
                  onClick={saveCalibration}
                  className="w-full rounded-lg bg-[#1F3A5F] text-white py-2 text-xs font-black uppercase tracking-wide hover:bg-[#162d4a] transition-colors"
                >
                  Save Calibration
                </button>
                <button
                  type="button"
                  onClick={loadCalibration}
                  className="w-full rounded-lg border border-[#d5ddea] py-2 text-xs font-black uppercase tracking-wide text-[#3a5276] hover:bg-gray-50 transition-colors"
                >
                  Load Saved
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyleSettings({
                      ...DEFAULT_STYLE,
                      heightPercent: FIXED_CONTAINER_HEIGHT_PERCENT,
                      cornerRadius: FIXED_CONTAINER_CORNER_RADIUS,
                    });
                  }}
                  className="w-full rounded-lg border border-red-200 py-2 text-xs font-black uppercase tracking-wide text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reset Calibration
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullscreenCalib(false)}
                  className="w-full rounded-lg border border-[#d5ddea] py-2 text-sm font-semibold text-[#11284a] hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* ── Canvas ── */}
            <div className="flex-1 bg-[#f0f4fa] flex items-center justify-center overflow-auto p-10">
              <div
                className={`relative bg-white ${showBorders ? 'border-2 border-black shadow-2xl' : 'border border-gray-300 shadow-lg'}`}
                style={{
                  width: `${calibW}px`,
                  height: `${calibH}px`,
                  borderRadius: `${FIXED_CONTAINER_CORNER_RADIUS * CALIB_SCALE}px`,
                }}
              >
                {/* Fullscreen calibration uses the same clean label look as preview (no measurement overlays). */}
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{
                    inset: `${DANGER_ZONE_PX}px`,
                    border: '1px dashed rgba(239, 68, 68, 0.55)',
                  }}
                  aria-hidden="true"
                />

                {/* Label content */}
                {!isLogoOnlyMode && (
                  <div
                    className="absolute inset-0"
                    style={{ transform: `translate(${clampedOffsetX * CALIB_SCALE}px, ${clampedOffsetY * CALIB_SCALE}px)` }}
                  >
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ top: `${calibY(V28_LABEL.logo)}px`, height: `${calibY(V28_LABEL.navyBand - V28_LABEL.logo)}px` }}>
                      <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="max-h-full w-auto object-contain" style={{ transform: `scale(${labelLogoScale})` }} />
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black"
                      style={{
                        fontSize: `${productNameFontSize * CALIB_SCALE}px`,
                        backgroundColor: styleSettings.primaryColor,
                        letterSpacing: `${productLetterSpacingPx * CALIB_SCALE}px`,
                        width: `${navyBandWidth}%`,
                        borderRadius: `${navyBandRadius * CALIB_SCALE}px`,
                        top: `${calibY(V28_LABEL.navyBand)}px`,
                        height: `${calibY(V28_LABEL.navyBandHeight)}px`,
                      }}
                    >
                      {productName}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-semibold text-[#0d2345]"
                      style={{ fontSize: `${dosageFontSize * CALIB_SCALE}px`, top: `${calibY(UI_PREVIEW_Y.dosage)}px` }}
                    >
                      {productDose}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-black"
                      style={{
                        fontSize: `${purityFontSizePreview * CALIB_SCALE}px`,
                        backgroundColor: styleSettings.secondaryColor,
                        letterSpacing: `${purityLetterSpacingPx * CALIB_SCALE}px`,
                        width: `${purityBandWidth}%`,
                        borderRadius: '999px',
                        top: `${calibY(V28_LABEL.purityBand)}px`,
                        height: `${calibY(V28_LABEL.purityBandHeight)}px`,
                      }}
                    >
                      {activePurityText}
                    </div>
                    {showActiveLotText && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-black leading-none whitespace-nowrap"
                        style={{
                          color: styleSettings.primaryColor,
                          fontSize: `${Math.max(3.4, legalFontSize * 0.86) * CALIB_SCALE}px`,
                          top: `${calibY(UI_PREVIEW_Y.lot)}px`,
                          width: `${footerWrapperWidthPx * CALIB_SCALE}px`,
                          letterSpacing: `${Math.max(0, legalLetterSpacingPx * 0.72) * CALIB_SCALE}px`,
                        }}
                      >
                        {activeLotText}
                      </div>
                    )}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-black leading-none whitespace-nowrap"
                      style={{
                        color: styleSettings.primaryColor,
                        fontSize: `${legalFontSize * CALIB_SCALE}px`,
                        top: `${calibY(UI_PREVIEW_Y.legal)}px`,
                        width: `${footerWrapperWidthPx * CALIB_SCALE}px`,
                        letterSpacing: `${legalLetterSpacingPx * CALIB_SCALE}px`,
                      }}
                    >
                      {activeLegalText}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-black leading-none whitespace-nowrap"
                      style={{
                        color: styleSettings.primaryColor,
                        fontSize: `${storageFontSize * CALIB_SCALE}px`,
                        top: `${calibY(UI_PREVIEW_Y.storage)}px`,
                        width: `${footerWrapperWidthPx * CALIB_SCALE}px`,
                        letterSpacing: `${storageLetterSpacingPx * CALIB_SCALE}px`,
                      }}
                    >
                      {activeStorageText}
                    </div>
                  </div>
                )}
                {isLogoOnlyMode && (
                  <div
                    className="h-full flex items-center justify-center"
                    style={{ transform: `translate(${clampedOffsetX * CALIB_SCALE}px, ${clampedOffsetY * CALIB_SCALE}px)` }}
                  >
                    <img src={LOGO_IMAGE_URL} alt="PEPTQ" className="h-24 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default PrintCenterPage;

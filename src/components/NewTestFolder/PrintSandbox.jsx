import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Grid3x3, Printer, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import catalog from '../../data/catalog.json';
import { buildLabels, generateLabelPdf, loadLogoDataUri, OL1735_SPECS } from './LabelEngine';
import {
  buildProfileKey,
  getLastPrintPreset,
  getPrintPresetProfiles,
  savePrintPreset,
} from '../../services/printCalibrationService';
import { LABEL_LOGO_URL } from '../../constants/labelTheme';

const LOGO_IMAGE_URL = LABEL_LOGO_URL;

function PrintSandbox() {
  const { session } = useAuth();
  const products = useMemo(() => (Array.isArray(catalog) ? catalog : []), []);
  const actorEmail = String(session?.email || '').trim().toLowerCase();
  const [selectedProducts, setSelectedProducts] = useState({});
  const [showBorders, setShowBorders] = useState(true);
  const [calibrationX, setCalibrationX] = useState(0);
  const [calibrationY, setCalibrationY] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedPdf, setHasGeneratedPdf] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState('');
  const [logoError, setLogoError] = useState('');
  const [printerName, setPrinterName] = useState('');
  const [tray, setTray] = useState('Tray_1');
  const [paperType, setPaperType] = useState('LETTER');
  const [scaleMode, setScaleMode] = useState('ACTUAL_SIZE');
  const [presetNotes, setPresetNotes] = useState('');
  const [presetProfiles, setPresetProfiles] = useState([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState('');
  const [presetMessage, setPresetMessage] = useState('');
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const value = await loadLogoDataUri(LOGO_IMAGE_URL);
        if (!active) return;
        setLogoDataUri(value);
      } catch (error) {
        if (!active) return;
        setLogoError(error?.message || 'Logo loading failed.');
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const labels = useMemo(
    () => buildLabels({ products, selectedProducts }),
    [products, selectedProducts]
  );

  const profileKey = useMemo(
    () => buildProfileKey({ printerName, tray, paperType }),
    [printerName, tray, paperType]
  );

  const previewSlots = useMemo(() => {
    const slots = OL1735_SPECS.cols * OL1735_SPECS.rows;
    return Array.from({ length: slots }, (_, index) => labels[index] || null);
  }, [labels]);

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const selectAll = () => {
    const next = {};
    products.forEach((product) => {
      next[product.id] = true;
    });
    setSelectedProducts(next);
  };

  const clearAll = () => {
    setSelectedProducts({});
  };

  const refreshPresetProfiles = useCallback(async () => {
    if (!actorEmail) return;
    try {
      const profiles = await getPrintPresetProfiles({ actorEmail, limit: 25 });
      setPresetProfiles(profiles);
      if (!selectedProfileKey && profiles.length) {
        setSelectedProfileKey(profiles[0].profile_key || '');
      }
    } catch (error) {
      setPresetMessage(error?.message || 'Unable to load preset profiles.');
    }
  }, [actorEmail, selectedProfileKey]);

  const applyPreset = useCallback((preset) => {
    if (!preset) return;
    setCalibrationX(Number(preset.x_offset || 0));
    setCalibrationY(Number(preset.y_offset || 0));
    setShowBorders(Boolean(preset.borders_on));
    setScaleMode(String(preset.scale_mode || 'ACTUAL_SIZE'));
    setPresetNotes(String(preset.notes || ''));
  }, []);

  const loadPresetByProfile = async (targetProfileKey) => {
    if (!actorEmail) {
      setPresetMessage('Log in as OWNER/ADMIN before loading presets.');
      return;
    }

    const key = String(targetProfileKey || '').trim();
    if (!key) {
      setPresetMessage('Select or enter a machine profile first.');
      return;
    }

    const [nextPrinterName = '', nextTray = '', nextPaperType = 'DEFAULT'] = key.split('|');
    if (!nextPrinterName || !nextTray) {
      setPresetMessage('Invalid profile key format.');
      return;
    }

    setIsLoadingPreset(true);
    setPresetMessage('');
    try {
      const preset = await getLastPrintPreset({
        actorEmail,
        printerName: nextPrinterName,
        tray: nextTray,
        paperType: nextPaperType,
      });

      if (!preset) {
        setPresetMessage('No saved preset found for this machine profile.');
        return;
      }

      setPrinterName(nextPrinterName);
      setTray(nextTray);
      setPaperType(nextPaperType);
      applyPreset(preset);
      setPresetMessage(`Loaded last known good preset for ${key}.`);
    } catch (error) {
      setPresetMessage(error?.message || 'Unable to load preset.');
    } finally {
      setIsLoadingPreset(false);
    }
  };

  const loadCurrentProfilePreset = useCallback(async () => {
    if (!profileKey) {
      setPresetMessage('Enter Printer and Tray before loading presets.');
      return;
    }

    setIsLoadingPreset(true);
    setPresetMessage('');
    try {
      const preset = await getLastPrintPreset({
        actorEmail,
        printerName,
        tray,
        paperType,
      });

      if (!preset) {
        setPresetMessage('No last known good preset for this profile yet.');
        return;
      }

      applyPreset(preset);
      setPresetMessage(`Loaded last known good preset for ${profileKey}.`);
    } catch (error) {
      setPresetMessage(error?.message || 'Unable to load preset.');
    } finally {
      setIsLoadingPreset(false);
    }
  }, [actorEmail, applyPreset, paperType, printerName, profileKey, tray]);

  const handleSaveSuccessfulPreset = async () => {
    if (!hasGeneratedPdf) {
      setPresetMessage('Generate a PDF first before saving a successful preset.');
      return;
    }

    if (!actorEmail) {
      setPresetMessage('Log in as OWNER/ADMIN before saving presets.');
      return;
    }

    if (!profileKey) {
      setPresetMessage('Printer and Tray are required before saving presets.');
      return;
    }

    const confirmed = window.confirm('Did this print align perfectly? Save this as a successful preset?');
    if (!confirmed) return;

    setIsSavingPreset(true);
    setPresetMessage('');
    try {
      await savePrintPreset({
        actorEmail,
        printerName,
        tray,
        paperType,
        xOffset: calibrationX,
        yOffset: calibrationY,
        scaleMode,
        bordersOn: showBorders,
        notes: presetNotes,
      });
      setPresetMessage(`Successful preset saved for ${profileKey}.`);
      await refreshPresetProfiles();
      setSelectedProfileKey(profileKey);
    } catch (error) {
      setPresetMessage(error?.message || 'Unable to save preset.');
    } finally {
      setIsSavingPreset(false);
    }
  };

  useEffect(() => {
    void refreshPresetProfiles();
  }, [refreshPresetProfiles]);

  useEffect(() => {
    if (!actorEmail || !profileKey) return;
    void loadCurrentProfilePreset();
  }, [actorEmail, profileKey, loadCurrentProfilePreset]);

  const handleGeneratePdf = async () => {
    if (!labels.length) {
      setPresetMessage('Select at least one product before generating labels.');
      return;
    }

    setIsGenerating(true);
    try {
      generateLabelPdf({
        labels,
        showBorders,
        calibrationX,
        calibrationY,
        logoDataUri,
      });
      setHasGeneratedPdf(true);
      setPresetMessage('PDF generated. If the physical print is perfect, save this as a successful preset.');
    } catch (error) {
      setPresetMessage(error?.message || 'PDF generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Print Sandbox</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Isolated test route for OL1735 label output</p>
              </div>
            </div>
            <button
              onClick={handleGeneratePdf}
              disabled={!labels.length || isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Test PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Sandbox Controls
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Borders</span>
                <input
                  type="checkbox"
                  checked={showBorders}
                  onChange={(event) => setShowBorders(event.target.checked)}
                  className="h-4 w-4 accent-brand-orange"
                />
              </label>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Horizontal Offset ({calibrationX}/100 in)</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={calibrationX}
                    onChange={(event) => setCalibrationX(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vertical Offset ({calibrationY}/100 in)</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={calibrationY}
                    onChange={(event) => setCalibrationY(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selected: {labels.length} • Sheets: {Math.max(1, Math.ceil(labels.length / 48))}
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Machine Profile</h3>
                <input
                  type="text"
                  value={printerName}
                  onChange={(event) => setPrinterName(event.target.value)}
                  placeholder="Printer name"
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={tray}
                  onChange={(event) => setTray(event.target.value)}
                  placeholder="Tray"
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={paperType}
                  onChange={(event) => setPaperType(event.target.value)}
                  placeholder="Paper type"
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 break-all">
                  profile_key: {profileKey || '—'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs text-gray-600 dark:text-gray-400">Scale Mode</label>
                <select
                  value={scaleMode}
                  onChange={(event) => setScaleMode(event.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="ACTUAL_SIZE">Actual Size</option>
                  <option value="FIT_TO_PAGE">Fit to Page</option>
                </select>
                <textarea
                  value={presetNotes}
                  onChange={(event) => setPresetNotes(event.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={loadCurrentProfilePreset}
                  disabled={!profileKey || isLoadingPreset}
                  className="w-full px-3 py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                >
                  {isLoadingPreset ? 'Loading...' : 'Load Last Preset'}
                </button>
                {hasGeneratedPdf && (
                  <button
                    onClick={handleSaveSuccessfulPreset}
                    disabled={!profileKey || isSavingPreset}
                    className="w-full px-3 py-2 text-sm rounded bg-brand-orange text-white disabled:opacity-50"
                  >
                    {isSavingPreset ? 'Saving...' : 'Save as Successful Preset'}
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs text-gray-600 dark:text-gray-400">Saved Profiles</label>
                <select
                  value={selectedProfileKey}
                  onChange={(event) => setSelectedProfileKey(event.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select profile</option>
                  {presetProfiles.map((item) => (
                    <option key={item.profile_key} value={item.profile_key}>{item.profile_key}</option>
                  ))}
                </select>
                <button
                  onClick={() => loadPresetByProfile(selectedProfileKey)}
                  disabled={!selectedProfileKey || isLoadingPreset}
                  className="w-full px-3 py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                >
                  Apply Selected Profile
                </button>
              </div>

              {presetMessage && (
                <p className="text-xs text-brand-navy dark:text-gray-300">{presetMessage}</p>
              )}

              {logoError && (
                <p className="text-xs text-red-600 dark:text-red-400">{logoError}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Catalog Selection</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-orange/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selectedProducts[product.id])}
                      onChange={() => toggleProduct(product.id)}
                      className="mt-1 h-4 w-4 accent-brand-orange"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.strength} • {product.purity}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5" />
                48-Slot Preview (4×12)
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {previewSlots.map((label, index) => (
                  <div
                    key={`slot-${index}`}
                    className={`aspect-[2.62/1] rounded border p-2 overflow-hidden ${showBorders ? 'border-black/70' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    {label ? (
                      <>
                        <p className="text-[10px] font-bold leading-tight text-gray-900 dark:text-gray-100 truncate">{label.name}</p>
                        <p className="text-[9px] text-gray-600 dark:text-gray-300 truncate">{label.strength}</p>
                        <p className="text-[8px] text-gray-500 dark:text-gray-400 truncate">{label.verification}</p>
                      </>
                    ) : (
                      <p className="text-[9px] text-gray-300 dark:text-gray-600">Empty</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintSandbox;

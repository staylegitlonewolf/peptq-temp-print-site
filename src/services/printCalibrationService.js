import { APPS_SCRIPT_COMMAND_URL } from './api';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const buildProfileKey = ({ printerName, tray, paperType }) => {
  const printer = normalizeText(printerName);
  const trayText = normalizeText(tray);
  const paper = normalizeText(paperType || 'DEFAULT');
  if (!printer || !trayText) return '';
  return `${printer}|${trayText}|${paper}`;
};

const withSearchParams = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = typeof value === 'string' ? value.trim() : String(value);
    if (!normalized) return;
    search.set(key, normalized);
  });
  return search.toString();
};

export const getPrintPresetProfiles = async ({ actorEmail = '', limit = 25 } = {}) => {
  const query = withSearchParams({
    command: 'GET_PRINT_PRESETS',
    actor_email: normalizeEmail(actorEmail),
    limit,
  });

  const response = await fetch(`${APPS_SCRIPT_COMMAND_URL}?${query}`, {
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`Preset profile lookup failed (${response.status}).`);
  }

  const payload = await response.json();
  if (payload?.status !== 'success') {
    throw new Error(payload?.message || 'Preset profile lookup failed.');
  }

  return Array.isArray(payload.profiles) ? payload.profiles : [];
};

export const getLastPrintPreset = async ({ actorEmail = '', printerName = '', tray = '', paperType = '' }) => {
  const profileKey = buildProfileKey({ printerName, tray, paperType });
  if (!profileKey) {
    throw new Error('printerName and tray are required to load presets.');
  }

  const query = withSearchParams({
    command: 'GET_PRINT_PRESETS',
    actor_email: normalizeEmail(actorEmail),
    profile_key: profileKey,
    limit: 1,
  });

  const response = await fetch(`${APPS_SCRIPT_COMMAND_URL}?${query}`, {
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`Preset lookup failed (${response.status}).`);
  }

  const payload = await response.json();
  if (payload?.status !== 'success') {
    throw new Error(payload?.message || 'Preset lookup failed.');
  }

  return payload?.latest || null;
};

export const savePrintPreset = async ({
  actorEmail = '',
  printerName = '',
  tray = '',
  paperType = '',
  xOffset = 0,
  yOffset = 0,
  scaleMode = 'ACTUAL_SIZE',
  bordersOn = false,
  notes = '',
}) => {
  const profileKey = buildProfileKey({ printerName, tray, paperType });
  if (!profileKey) {
    throw new Error('printerName and tray are required before saving presets.');
  }

  const payload = {
    command: 'SAVE_PRINT_PRESET',
    actor_email: normalizeEmail(actorEmail),
    operator_email: normalizeEmail(actorEmail),
    printer_name: normalizeText(printerName),
    tray: normalizeText(tray),
    paper_type: normalizeText(paperType || 'DEFAULT'),
    x_offset: Number(xOffset),
    y_offset: Number(yOffset),
    scale_mode: normalizeText(scaleMode || 'ACTUAL_SIZE'),
    borders_on: Boolean(bordersOn),
    notes: normalizeText(notes),
    profile_key: profileKey,
  };

  try {
    const response = await fetch(APPS_SCRIPT_COMMAND_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Preset save failed (${response.status}).`);
    }

    const result = await response.json();
    if (result?.status !== 'success') {
      throw new Error(result?.message || 'Preset save failed.');
    }

    return result;
  } catch {
    await fetch(APPS_SCRIPT_COMMAND_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      status: 'queued',
      command: 'SAVE_PRINT_PRESET',
      profile_key: profileKey,
    };
  }
};

export { buildProfileKey };

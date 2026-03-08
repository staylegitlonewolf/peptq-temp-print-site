import { APPS_SCRIPT_COMMAND_URL } from './api';

const ALLOWED_ROLES = new Set(['GUEST', 'PENDING', 'MEMBER', 'VIP', 'OWNER', 'ADMIN', 'INSTITUTIONAL']);
const DELETED_IDENTITIES_KEY = 'peptq_deleted_identities_v1';
const LOT_REGISTRY_CACHE_KEY = 'peptq_lot_registry_local_v1';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const createTemporaryPin = () => String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

const createNetworkCommandError = (error, command = 'UNKNOWN_COMMAND') => {
  const rawMessage = String(error?.message || '');
  const normalizedMessage = rawMessage.toLowerCase();
  const isResolutionIssue = normalizedMessage.includes('name_not_resolved') || normalizedMessage.includes('failed to fetch') || normalizedMessage.includes('networkerror');

  const nextError = new Error(
    isResolutionIssue
      ? 'Unable to reach the command server (DNS/network). Check internet, VPN/firewall policy, and Apps Script endpoint configuration.'
      : `Unable to submit ${command} command right now.`
  );

  nextError.code = isResolutionIssue ? 'ERR_APPS_SCRIPT_UNREACHABLE' : 'ERR_COMMAND_DISPATCH_FAILED';
  nextError.cause = error;
  return nextError;
};

const normalizeRole = (value, fallback = 'GUEST') => {
  const role = normalizeText(value).toUpperCase();
  return ALLOWED_ROLES.has(role) ? role : fallback;
};

const loadDeletedIdentities = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DELETED_IDENTITIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDeletedIdentities = (emails) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DELETED_IDENTITIES_KEY, JSON.stringify(emails));
};

const loadLotRegistry = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOT_REGISTRY_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLotRegistry = (rows) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOT_REGISTRY_CACHE_KEY, JSON.stringify(rows));
};

const normalizeLotRegistryRow = (row = {}) => ({
  lot_id: normalizeText(row.lot_id || row.lotId),
  product_id: normalizeText(row.product_id || row.productId),
  coa_url: normalizeText(row.coa_url || row.coaUrl),
  purity_pct: Number.isFinite(Number(row.purity_pct ?? row.purityPct)) ? Number(row.purity_pct ?? row.purityPct) : null,
  test_date: normalizeText(row.test_date || row.testDate),
  expiry_date: normalizeText(row.expiry_date || row.expiryDate),
});

const resolveLotVerification = ({ row, requestedProductId, minPurityPct }) => {
  const productMatches = !requestedProductId || normalizeText(row.product_id) === requestedProductId;
  const hasCoaUrl = Boolean(normalizeText(row.coa_url));
  const purityValid = Number.isFinite(Number(row.purity_pct)) && Number(row.purity_pct) > Number(minPurityPct);

  if (productMatches && hasCoaUrl && purityValid) {
    return {
      verification_status: 'Verified Research Grade',
      order_allowed: true,
    };
  }

  return {
    verification_status: 'Pending Verification',
    order_allowed: false,
  };
};

export const isDeletedIdentity = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  return loadDeletedIdentities().includes(normalizedEmail);
};

export const markDeletedIdentity = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  const next = Array.from(new Set([...loadDeletedIdentities(), normalizedEmail]));
  saveDeletedIdentities(next);
};

const postCommand = async (payload, { mode = 'no-cors' } = {}) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request payload must be an object.');
  }

  try {
    await fetch(APPS_SCRIPT_COMMAND_URL, {
      method: 'POST',
      mode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw createNetworkCommandError(error, payload.command);
  }

  return {
    status: 'queued',
    mode,
    command: payload.command,
  };
};

export const submitPortalRequest = async ({
  email,
  fullName,
  authProvider = 'Google',
  memberPin = '',
  profilePhotoUrl = '',
  accountDelete = false,
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email is required for request submission.');
  }

  return postCommand({
    command: 'SUBMIT_REQUEST',
    email: normalizedEmail,
    full_name: normalizeText(fullName),
    auth_provider: normalizeText(authProvider) || 'Google',
    member_pin: normalizeText(memberPin),
    profile_photo_url: normalizeText(profilePhotoUrl),
    account_delete: Boolean(accountDelete),
  });
};

export const approveMember = async ({ email, role = 'MEMBER', actorEmail = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email is required for member promotion.');
  }

  const normalizedActorEmail = normalizeEmail(actorEmail);
  if (!normalizedActorEmail) {
    throw new Error('actorEmail is required for member promotion.');
  }

  return postCommand({
    command: 'APPROVE_MEMBER',
    email: normalizedEmail,
    role: normalizeRole(role, 'MEMBER'),
    actor_email: normalizedActorEmail,
  });
};

export const updateMemberRole = async ({ uid = '', email = '', role, actorEmail = '' }) => {
  if (!normalizeText(uid) && !normalizeEmail(email)) {
    throw new Error('uid or email is required for role updates.');
  }

  const normalizedActorEmail = normalizeEmail(actorEmail);
  if (!normalizedActorEmail) {
    throw new Error('actorEmail is required for role updates.');
  }

  return postCommand({
    command: 'UPDATE_ROLE',
    uid: normalizeText(uid),
    email: normalizeEmail(email),
    role: normalizeRole(role, ''),
    actor_email: normalizedActorEmail,
  });
};

export const updateMemberProfile = async ({ uid = '', email = '', ...profileFields }) => {
  if (!normalizeText(uid) && !normalizeEmail(email)) {
    throw new Error('uid or email is required for profile updates.');
  }

  return postCommand({
    command: 'UPDATE_MEMBER_PROFILE',
    uid: normalizeText(uid),
    email: normalizeEmail(email),
    ...profileFields,
  });
};

export const updateMemberQuickProfile = async ({ email = '', nextEmail = '', memberPin = '', actorEmail = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('email is required for quick profile updates.');
  }

  const normalizedActorEmail = normalizeEmail(actorEmail);
  if (!normalizedActorEmail) {
    throw new Error('actorEmail is required for quick profile updates.');
  }

  return postCommand({
    command: 'UPDATE_MEMBER_PROFILE',
    email: normalizedEmail,
    new_email: normalizeEmail(nextEmail),
    member_pin: normalizeText(memberPin),
    actor_email: normalizedActorEmail,
  });
};

export const issueTempMemberPin = async ({ email = '', actorEmail = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('email is required for temporary PIN issuance.');
  }

  const normalizedActorEmail = normalizeEmail(actorEmail);
  if (!normalizedActorEmail) {
    throw new Error('actorEmail is required for temporary PIN issuance.');
  }

  const tempPin = createTemporaryPin();

  await postCommand({
    command: 'ISSUE_TEMP_MEMBER_PIN',
    email: normalizedEmail,
    temp_pin: tempPin,
    actor_email: normalizedActorEmail,
  });

  return {
    status: 'queued',
    command: 'ISSUE_TEMP_MEMBER_PIN',
    email: normalizedEmail,
    temp_pin: tempPin,
  };
};

export const rotateMemberPin = async ({ email = '', memberPin = '', actorEmail = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPin = normalizeText(memberPin);
  if (!normalizedEmail) {
    throw new Error('email is required for PIN rotation.');
  }

  if (!/^\d{6}$/.test(normalizedPin)) {
    throw new Error('memberPin must be a 6-digit value.');
  }

  return postCommand({
    command: 'ROTATE_MEMBER_PIN',
    email: normalizedEmail,
    member_pin: normalizedPin,
    actor_email: normalizeEmail(actorEmail) || normalizedEmail,
  });
};

export const rotateOwnerIdentity = async ({
  actorEmail = '',
  masterPin = '',
  newEmail = '',
  newPin = '',
  fullName = '',
  acceptTerms = false,
}) => {
  const normalizedActorEmail = normalizeEmail(actorEmail);
  const normalizedNewEmail = normalizeEmail(newEmail);
  const normalizedMasterPin = normalizeText(masterPin);
  const normalizedNewPin = normalizeText(newPin);

  if (!normalizedActorEmail) {
    throw new Error('actorEmail is required for owner onboarding.');
  }

  if (!normalizedMasterPin) {
    throw new Error('masterPin is required.');
  }

  if (!normalizedNewEmail) {
    throw new Error('newEmail is required.');
  }

  if (!/^\d{4,8}$/.test(normalizedNewPin)) {
    throw new Error('newPin must be 4-8 digits.');
  }

  if (!acceptTerms) {
    throw new Error('Terms acceptance is required.');
  }

  const response = await fetch(APPS_SCRIPT_COMMAND_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command: 'ROTATE_OWNER_IDENTITY',
      actor_email: normalizedActorEmail,
      master_pin: normalizedMasterPin,
      new_email: normalizedNewEmail,
      new_pin: normalizedNewPin,
      full_name: normalizeText(fullName),
      accept_terms: Boolean(acceptTerms),
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Owner onboarding request failed with status ${response.status}`);
    error.code = payload?.code || 'ERR_OWNER_ONBOARDING_HTTP';
    throw error;
  }

  if (payload?.status !== 'success') {
    const code = String(payload?.code || '').trim().toUpperCase();
    const mappedMessage = code === 'ERR_MASTER_PIN_EXPIRED'
      ? 'MasterKey has already been consumed. Sign in with the rotated owner credentials.'
      : code === 'ERR_INVALID_MASTER_PIN'
        ? 'MasterKey PIN validation failed. Confirm the bootstrap PIN and retry.'
        : code === 'ERR_UNAUTHORIZED_ANCHOR'
          ? 'This onboarding flow only works from the bootstrap owner account.'
          : code === 'ERR_TERMS_REQUIRED'
            ? 'Accept terms before finalizing owner rotation.'
            : code === 'ERR_EMAIL_IN_USE'
              ? 'That owner email is already in use. Enter a different email.'
              : payload?.message || 'Owner onboarding failed.';
    const error = new Error(mappedMessage);
    error.code = code || 'ERR_OWNER_ONBOARDING_FAILED';
    throw error;
  }

  return payload;
};

export const requestAccountDelete = async ({ uid = '', email = '', actorEmail = '' }) => {
  if (!normalizeText(uid) && !normalizeEmail(email)) {
    throw new Error('uid or email is required for account deletion.');
  }

  const normalizedEmail = normalizeEmail(email);
  const result = await postCommand({
    command: 'DELETE_ACCOUNT',
    uid: normalizeText(uid),
    email: normalizedEmail,
    actor_email: normalizeEmail(actorEmail),
  });

  if (normalizedEmail) markDeletedIdentity(normalizedEmail);
  return result;
};

export const withdrawPortalRequest = async ({ email = '', actorEmail = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email is required to withdraw a portal request.');
  }

  return postCommand({
    command: 'WITHDRAW_REQUEST',
    email: normalizedEmail,
    actor_email: normalizeEmail(actorEmail) || normalizedEmail,
  });
};

export const submitSupportRequest = async ({
  email,
  fullName = '',
  issueType = 'Portal Access',
  message,
  sourcePage = 'Portal Gate',
}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedMessage = normalizeText(message);

  if (!normalizedEmail) {
    throw new Error('Email is required for support requests.');
  }

  if (!normalizedMessage) {
    throw new Error('Please describe the issue before sending support request.');
  }

  return postCommand({
    command: 'SUBMIT_SUPPORT',
    email: normalizedEmail,
    full_name: normalizeText(fullName),
    issue_type: normalizeText(issueType) || 'Portal Access',
    message: normalizedMessage,
    source_page: normalizeText(sourcePage) || 'Portal Gate',
  });
};

export const suspendMember = async ({ uid = '', email = '', actorEmail = '', reason = '' }) => {
  if (!normalizeText(uid) && !normalizeEmail(email)) {
    throw new Error('uid or email is required for member suspension.');
  }

  return postCommand({
    command: 'SUSPEND_MEMBER',
    uid: normalizeText(uid),
    email: normalizeEmail(email),
    actor_email: normalizeEmail(actorEmail),
    reason: normalizeText(reason),
  });
};

export const searchMemberOrders = async ({ query }) => {
  if (!normalizeText(query)) {
    throw new Error('query is required for member search.');
  }

  return postCommand({
    command: 'SEARCH_MEMBER_ORDERS',
    query: normalizeText(query),
  });
};

export const fetchLotMetadata = async ({
  lotId,
  productId = '',
  role = 'GUEST',
  lotRegistry = [],
  minPurityPct = 98,
}) => {
  const normalizedLotId = normalizeText(lotId);
  if (!normalizedLotId) {
    throw new Error('lotId is required for lot metadata lookup.');
  }

  const normalizedProductId = normalizeText(productId);
  const normalizedRole = normalizeRole(role, 'GUEST');

  await postCommand({
    command: 'GET_LOT_METADATA',
    lot_id: normalizedLotId,
    product_id: normalizedProductId,
  });

  const normalizedRegistry = Array.isArray(lotRegistry) && lotRegistry.length
    ? lotRegistry.map(normalizeLotRegistryRow)
    : loadLotRegistry().map(normalizeLotRegistryRow);

  if (Array.isArray(lotRegistry) && lotRegistry.length) {
    saveLotRegistry(normalizedRegistry);
  }

  const matchedRow = normalizedRegistry.find((row) => normalizeText(row.lot_id) === normalizedLotId);
  if (!matchedRow) {
    return {
      lot_id: normalizedLotId,
      product_id: normalizedProductId,
      coa_url: '',
      purity_pct: null,
      test_date: '',
      expiry_date: '',
      verification_status: 'Pending Verification',
      order_allowed: false,
      coa_visible: normalizedRole === 'MEMBER' || normalizedRole === 'ADMIN',
    };
  }

  const verification = resolveLotVerification({
    row: matchedRow,
    requestedProductId: normalizedProductId,
    minPurityPct,
  });

  const canViewCoa = normalizedRole === 'MEMBER' || normalizedRole === 'ADMIN';

  return {
    lot_id: matchedRow.lot_id,
    product_id: matchedRow.product_id,
    coa_url: canViewCoa ? matchedRow.coa_url : '',
    purity_pct: matchedRow.purity_pct,
    test_date: matchedRow.test_date,
    expiry_date: matchedRow.expiry_date,
    verification_status: verification.verification_status,
    order_allowed: verification.order_allowed,
    coa_visible: canViewCoa,
  };
};

export const resolveIdentityStatus = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('email is required for identity resolution.');
  }

  const locallyDeleted = isDeletedIdentity(normalizedEmail);

  try {
    const url = `${APPS_SCRIPT_COMMAND_URL}?command=GET_IDENTITY_STATUS&email=${encodeURIComponent(normalizedEmail)}`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Identity status lookup failed with status ${response.status}`);
    }

    const payload = await response.json();
    const identity = payload?.identity || {};
    const accountDelete = Boolean(identity.account_delete) || locallyDeleted;

    if (accountDelete) {
      markDeletedIdentity(normalizedEmail);
    }

    return {
      email: normalizedEmail,
      role: normalizeRole(identity.role, 'GUEST'),
      status: normalizeRole(identity.status, 'GUEST'),
      accountDelete,
      pinRotationRequired: Boolean(identity.pin_rotation_required),
      reachable: true,
      source: normalizeText(payload?.source || 'NONE'),
      profilePhotoUrl: normalizeText(identity.profile_photo_url),
    };
  } catch {
    return {
      email: normalizedEmail,
      role: '',
      status: '',
      accountDelete: locallyDeleted,
      pinRotationRequired: null,
      reachable: false,
      source: 'LOCAL_CACHE',
      profilePhotoUrl: '',
    };
  }
};

export const requestService = {
  submitPortalRequest,
  approveMember,
  updateMemberRole,
  updateMemberProfile,
  issueTempMemberPin,
  rotateMemberPin,
  rotateOwnerIdentity,
  requestAccountDelete,
  withdrawPortalRequest,
  suspendMember,
  searchMemberOrders,
  fetchLotMetadata,
  resolveIdentityStatus,
  isDeletedIdentity,
  markDeletedIdentity,
};


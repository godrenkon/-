import { generateClient } from 'aws-amplify/data';
import { confirmResetPassword, confirmSignUp, fetchUserAttributes, getCurrentUser as getAmplifyCurrentUser, resetPassword, resendSignUpCode, signIn, signOut, signUp, updateUserAttributes } from 'aws-amplify/auth';
import { configureSuiramCloud } from '@/lib/amplifyClient';

const PREFIX = 'suiram-rpg-edit:';
const ACCOUNT_KEY = `${PREFIX}account`;
const LEGACY_SESSION_KEY = `${PREFIX}session`;
const LEGACY_USERS_KEY = `${PREFIX}users`;
const ENTITY_NAMES = ['Asset', 'DirectMessage', 'Follow', 'Game', 'GameComment', 'GameFavorite', 'GameLike', 'Plugin', 'Profile', 'Team'];
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const createId = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
const read = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : clone(fallback); } catch { return clone(fallback); }
};

let activeUser = null;
let hydratedUserId = null;
let workspaceId = null;
let syncTimer = null;
let syncQueued = false;
let suppressSync = false;

const entityKey = name => `${PREFIX}entity:${name}`;
const getCollection = name => read(entityKey(name), []);
const readAccount = () => read(ACCOUNT_KEY, {});
const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('suiram-rpg-edit:data-change', { detail: key }));
  if (!suppressSync && activeUser && hydratedUserId === activeUser.id) queueWorkspaceSync();
};
const setCollection = (name, value) => write(entityKey(name), value);

const matches = (record, filters) => Object.entries(filters || {}).every(([key, expected]) => {
  if (expected === undefined || expected === null || expected === '') return true;
  const actual = record[key];
  if (Array.isArray(actual)) return Array.isArray(expected) ? expected.every(value => actual.includes(value)) : actual.includes(expected);
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
});
const sortRecords = (records, sort) => {
  if (!sort) return records;
  const descending = String(sort).startsWith('-');
  const field = String(sort).replace(/^-/, '');
  return [...records].sort((left, right) => {
    const a = left[field] ?? '';
    const b = right[field] ?? '';
    const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ja');
    return descending ? -result : result;
  });
};

const workspaceSnapshot = () => ({ version: 1, account: readAccount(), entities: Object.fromEntries(ENTITY_NAMES.map(name => [name, getCollection(name)])) });
const workspaceClient = async () => { await configureSuiramCloud(); return generateClient(); };

const applyWorkspace = document => {
  const snapshot = document && typeof document === 'object' ? document : {};
  suppressSync = true;
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(snapshot.account || {}));
    ENTITY_NAMES.forEach(name => localStorage.setItem(entityKey(name), JSON.stringify(Array.isArray(snapshot.entities?.[name]) ? snapshot.entities[name] : [])));
  } finally { suppressSync = false; }
  window.dispatchEvent(new CustomEvent('suiram-rpg-edit:data-change', { detail: `${PREFIX}workspace` }));
};

const flushWorkspaceSync = async () => {
  if (!syncQueued || !activeUser || hydratedUserId !== activeUser.id) return;
  syncQueued = false;
  const client = await workspaceClient();
  const input = { document: workspaceSnapshot() };
  const result = workspaceId ? await client.models.Workspace.update({ id: workspaceId, ...input }) : await client.models.Workspace.create(input);
  if (result.errors?.length) throw new Error(result.errors[0].message);
  workspaceId ||= result.data?.id || null;
};
const queueWorkspaceSync = () => {
  syncQueued = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { flushWorkspaceSync().catch(error => console.error('クラウド保存に失敗しました。', error)); }, 500);
};
const hasMatchingLegacyAccount = email => {
  const session = read(LEGACY_SESSION_KEY, null);
  const user = read(LEGACY_USERS_KEY, []).find(item => item.id === session?.userId);
  return Boolean(user?.email && email && user.email.toLowerCase() === email.toLowerCase());
};
const hydrateWorkspace = async user => {
  if (hydratedUserId === user.id) return;
  const result = await (await workspaceClient()).models.Workspace.list();
  if (result.errors?.length) throw new Error(result.errors[0].message);
  const workspace = result.data?.[0] || null;
  if (workspace) applyWorkspace(workspace.document);
  else if (!hasMatchingLegacyAccount(user.email)) applyWorkspace(null);
  workspaceId = workspace?.id || null;
  hydratedUserId = user.id;
  if (!workspace) queueWorkspaceSync();
};
const requireActiveUser = () => {
  if (!activeUser) throw new Error('作品を保存するにはサインインしてください。');
  return activeUser;
};

const createEntityApi = name => ({
  async list(sort, limit) { const records = sortRecords(getCollection(name), sort); return clone(limit ? records.slice(0, limit) : records); },
  async filter(filters = {}, sort, limit) { const records = sortRecords(getCollection(name).filter(record => matches(record, filters)), sort); return clone(limit ? records.slice(0, limit) : records); },
  async get(id) { const record = getCollection(name).find(item => item.id === id); if (!record) throw new Error(`${name} が見つかりません。`); return clone(record); },
  async create(data = {}) {
    const user = requireActiveUser();
    const record = { ...clone(data), id: data.id || createId(name.toLowerCase()), created_by_id: data.created_by_id || user.id, created_date: data.created_date || now(), updated_date: now() };
    const records = getCollection(name); records.push(record); setCollection(name, records); return clone(record);
  },
  async update(id, patch = {}) {
    requireActiveUser();
    const records = getCollection(name); const index = records.findIndex(item => item.id === id);
    if (index < 0) throw new Error(`${name} が見つかりません。`);
    records[index] = { ...records[index], ...clone(patch), id, updated_date: now() }; setCollection(name, records); return clone(records[index]);
  },
  async delete(id) {
    requireActiveUser();
    const records = getCollection(name); if (!records.some(item => item.id === id)) throw new Error(`${name} が見つかりません。`);
    setCollection(name, records.filter(item => item.id !== id)); return true;
  },
});

const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  if (!file) { reject(new Error('ファイルが選択されていません。')); return; }
  if (file.size > 3 * 1024 * 1024) { reject(new Error('3MB以下のファイルを使用してください。')); return; }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('ファイルを読み込めませんでした。'));
  reader.onload = () => resolve(reader.result); reader.readAsDataURL(file);
});

const makeUser = async () => {
  await configureSuiramCloud();
  const [identity, attributes] = await Promise.all([getAmplifyCurrentUser(), fetchUserAttributes()]);
  const account = readAccount();
  const user = { id: identity.userId, email: attributes.email || identity.username, full_name: account.full_name || attributes.preferred_username || identity.username, bio: account.bio || '', avatar: account.avatar || '', role: 'user', created_date: account.created_date || now(), updated_date: account.updated_date || now() };
  activeUser = user;
  await hydrateWorkspace(user);
  activeUser = { ...user, ...readAccount(), id: user.id, email: user.email };
  return clone(activeUser);
};

const auth = {
  async me() { return makeUser(); },
  async register({ email = '', password = '', full_name = '' } = {}) {
    const normalizedEmail = email.trim().toLowerCase(); const normalizedName = full_name.trim();
    if (!normalizedName) throw new Error('表示名を入力してください。');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('メールアドレスの形式を確認してください。');
    if (password.length < 8) throw new Error('パスワードは8文字以上で入力してください。');
    await configureSuiramCloud();
    return signUp({ username: normalizedEmail, password, options: { userAttributes: { email: normalizedEmail, preferred_username: normalizedName } } });
  },
  async loginViaEmailPassword(email, password) { await configureSuiramCloud(); return signIn({ username: String(email || '').trim().toLowerCase(), password }); },
  async verifyOtp({ email = '', code = '' } = {}) { await configureSuiramCloud(); return confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode: code.trim() }); },
  async resendOtp({ email = '' } = {}) { await configureSuiramCloud(); return resendSignUpCode({ username: email.trim().toLowerCase() }); },
  async requestPasswordReset(email) { await configureSuiramCloud(); return resetPassword({ username: email.trim().toLowerCase() }); },
  async confirmPasswordReset({ email = '', code = '', password = '' } = {}) { await configureSuiramCloud(); return confirmResetPassword({ username: email.trim().toLowerCase(), confirmationCode: code.trim(), newPassword: password }); },
  async updateMe(patch = {}) {
    const user = requireActiveUser(); const fullName = patch.full_name?.trim();
    if (fullName && fullName !== user.full_name) await updateUserAttributes({ userAttributes: { preferred_username: fullName } });
    const account = { ...readAccount(), ...clone(patch), full_name: fullName || user.full_name, updated_date: now() };
    write(ACCOUNT_KEY, account); activeUser = { ...activeUser, ...account }; await flushWorkspaceSync(); return clone(activeUser);
  },
  async logout() {
    await configureSuiramCloud(); await signOut();
    activeUser = null; hydratedUserId = null; workspaceId = null; syncQueued = false;
  },
  redirectToLogin(returnTo = '/login') { window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`); },
  loginWithProvider() { throw new Error('外部ログインは現在準備中です。メールアドレスとパスワードでサインインしてください。'); },
};

export const rpgStore = {
  entities: Object.fromEntries(ENTITY_NAMES.map(name => [name, createEntityApi(name)])), auth,
  integrations: { Core: { async UploadFile({ file }) { return { file_url: await readFileAsDataUrl(file) }; }, async InvokeLLM() { throw new Error('Suiram独立版では、AIアシストの「カスタムAPI」または「ローカルAI」を選択してください。'); } } },
};
export const suiramStoreInfo = Object.freeze({ name: 'Suiram Cloud Vault', storage: 'Cognito + owner-only cloud workspace', maxUploadBytes: 3 * 1024 * 1024 });

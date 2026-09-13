const PREFIX = 'suiram-rpg-edit:';
const SESSION_KEY = `${PREFIX}session`;
const USER_KEY = `${PREFIX}users`;
const ENTITY_NAMES = ['Asset', 'DirectMessage', 'Follow', 'Game', 'GameComment', 'GameFavorite', 'GameLike', 'Plugin', 'Profile', 'Team'];

const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const createId = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
const read = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : clone(fallback); } catch { return clone(fallback); }
};
const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('suiram-rpg-edit:data-change', { detail: key }));
};
const entityKey = name => `${PREFIX}entity:${name}`;
const getCollection = name => read(entityKey(name), []);
const setCollection = (name, value) => write(entityKey(name), value);
const getUsers = () => read(USER_KEY, []);
const setUsers = users => write(USER_KEY, users);
const getSession = () => read(SESSION_KEY, null);
const getCurrentUser = () => {
  const session = getSession();
  return session?.userId ? getUsers().find(user => user.id === session.userId) || null : null;
};

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

const createEntityApi = name => ({
  async list(sort, limit) {
    const records = sortRecords(getCollection(name), sort);
    return clone(limit ? records.slice(0, limit) : records);
  },
  async filter(filters = {}, sort, limit) {
    const records = sortRecords(getCollection(name).filter(record => matches(record, filters)), sort);
    return clone(limit ? records.slice(0, limit) : records);
  },
  async get(id) {
    const record = getCollection(name).find(item => item.id === id);
    if (!record) throw new Error(`${name} が見つかりません。`);
    return clone(record);
  },
  async create(data = {}) {
    const user = getCurrentUser();
    if (!user) throw new Error('作品を保存するにはサインインしてください。');
    const record = { ...clone(data), id: data.id || createId(name.toLowerCase()), created_by_id: data.created_by_id || user.id, created_date: data.created_date || now(), updated_date: now() };
    const records = getCollection(name);
    records.push(record);
    setCollection(name, records);
    return clone(record);
  },
  async update(id, patch = {}) {
    const records = getCollection(name);
    const index = records.findIndex(item => item.id === id);
    if (index < 0) throw new Error(`${name} が見つかりません。`);
    records[index] = { ...records[index], ...clone(patch), id, updated_date: now() };
    setCollection(name, records);
    return clone(records[index]);
  },
  async delete(id) {
    const records = getCollection(name);
    if (!records.some(item => item.id === id)) throw new Error(`${name} が見つかりません。`);
    setCollection(name, records.filter(item => item.id !== id));
    return true;
  },
});

const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  if (!file) { reject(new Error('ファイルが選択されていません。')); return; }
  if (file.size > 3 * 1024 * 1024) { reject(new Error('ローカル保存では3MB以下のファイルを使用してください。')); return; }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('ファイルを読み込めませんでした。'));
  reader.onload = () => resolve(reader.result);
  reader.readAsDataURL(file);
});

const auth = {
  async me() {
    const user = getCurrentUser();
    if (!user) throw new Error('サインインしていません。');
    return clone(user);
  },
  async register({ email = '', full_name = '' } = {}) {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = full_name.trim();
    if (!normalizedName) throw new Error('表示名を入力してください。');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('メールアドレスの形式を確認してください。');
    if (normalizedEmail && users.some(user => user.email?.toLowerCase() === normalizedEmail)) throw new Error('このメールアドレスのローカルプロフィールは既にあります。');
    const user = { id: createId('user'), email: normalizedEmail, full_name: normalizedName, bio: '', avatar: '', role: 'user', created_date: now(), updated_date: now() };
    users.push(user);
    setUsers(users);
    write(SESSION_KEY, { userId: user.id });
    return { access_token: `local:${user.id}`, user: clone(user) };
  },
  async loginViaEmailPassword(email) {
    const user = getUsers().find(item => item.email?.toLowerCase() === String(email || '').trim().toLowerCase());
    if (!user) throw new Error('この端末に該当するローカルプロフィールがありません。新規作成してください。');
    write(SESSION_KEY, { userId: user.id });
    return clone(user);
  },
  async verifyOtp({ email } = {}) {
    const user = getUsers().find(item => item.email?.toLowerCase() === String(email || '').trim().toLowerCase());
    if (!user) throw new Error('ローカルプロフィールが見つかりません。');
    write(SESSION_KEY, { userId: user.id });
    return { access_token: `local:${user.id}` };
  },
  async resendOtp() { return true; },
  setToken(token) {
    const userId = String(token || '').replace(/^local:/, '');
    if (getUsers().some(user => user.id === userId)) write(SESSION_KEY, { userId });
  },
  async updateMe(patch = {}) {
    const user = getCurrentUser();
    if (!user) throw new Error('サインインしてください。');
    const users = getUsers().map(item => item.id === user.id ? { ...item, ...clone(patch), updated_date: now() } : item);
    setUsers(users);
    return clone(users.find(item => item.id === user.id));
  },
  async logout() { localStorage.removeItem(SESSION_KEY); },
  redirectToLogin(returnTo = '/login') { window.location.assign(`/login?return_to=${encodeURIComponent(returnTo)}`); },
  loginWithProvider() { throw new Error('外部ログインは独立版では利用できません。ローカルプロフィールを使用してください。'); },
};

export const rpgStore = {
  entities: Object.fromEntries(ENTITY_NAMES.map(name => [name, createEntityApi(name)])),
  auth,
  integrations: {
    Core: {
      async UploadFile({ file }) { return { file_url: await readFileAsDataUrl(file) }; },
      async InvokeLLM() { throw new Error('Suiram独立版では、AIアシストの「カスタムAPI」または「ローカルAI」を選択してください。'); },
    },
  },
};

export const suiramStoreInfo = Object.freeze({ name: 'Suiram Local Vault', storage: 'browser-local-storage', maxUploadBytes: 3 * 1024 * 1024 });

export const GAME_DATA_VERSION = 2;

export const DATABASE_KEYS = [
  'actors', 'classes', 'skills', 'items', 'weapons', 'armors', 'enemies',
  'troops', 'states', 'animations', 'tilesets', 'commonEvents', 'shops',
  'quests', 'vehicles', 'switches', 'variables', 'types', 'terms',
];

export const DEFAULT_SYSTEM = Object.freeze({
  battleSystem: 'turn',
  currency: 'G',
  titleScreen: '',
  titleGraphic: '',
  startBgm: '',
  battleBgm: '',
  victoryMe: '',
  defeatMe: '',
  gameOverBgm: '',
  gameOverGraphic: '',
  battleBackground: '',
  windowColor: '#18181b',
  startMapId: null,
  startX: 1,
  startY: 1,
  startParty: [],
  maxParty: 4,
  moveSpeed: 4,
  encounterRate: 0,
  textSpeed: 'normal',
  msgPosition: 'bottom',
  saveAccess: true,
  menuAccess: true,
  formation: true,
  autoSave: true,
});

export const DEFAULT_CONTROL_CONFIG = Object.freeze({
  keyBindings: {
    up: ['ArrowUp', 'w'], down: ['ArrowDown', 's'], left: ['ArrowLeft', 'a'],
    right: ['ArrowRight', 'd'], action: ['Enter', 'Space'], cancel: ['Escape'],
    menu: ['m'], dash: ['Shift'],
  },
  touchButtons: [],
  showHUD: true,
  showGold: true,
  showMapName: true,
  showSettingsButton: true,
  touchEnabled: true,
  touchSwitchId: null,
  dpadStyle: 'cross',
  dpadSize: 120,
  dpadPosition: 'bottom-left',
  actionButtonSize: 64,
  actionButtonPosition: 'bottom-right',
});

const clampInt = (value, min, max, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export function createId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export function cloneData(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function createGrid(width, height, value = null) {
  return Array.from({ length: height }, () => Array.from(
    { length: width },
    () => (value && typeof value === 'object' ? cloneData(value) : value),
  ));
}

export function resizeGrid(grid, width, height, value = null) {
  return Array.from({ length: height }, (_, y) => Array.from(
    { length: width },
    (_, x) => grid?.[y]?.[x] ?? value,
  ));
}

export function createMap({ name = 'マップ 1', width = 24, height = 18 } = {}) {
  const id = createId('map');
  return {
    id,
    name,
    width,
    height,
    tileSize: 32,
    bgColor: '#111827',
    bgImage: '',
    bgm: '',
    layerOrder: ['ground', 'decor', 'object', 'upper'],
    layerSettings: {
      ground: { name: '地面', visible: true, opacity: 1, collision: false },
      decor: { name: '装飾', visible: true, opacity: 1, collision: false },
      object: { name: 'オブジェクト', visible: true, opacity: 1, collision: true },
      upper: { name: '前景', visible: true, opacity: 1, collision: false, aboveCharacters: true },
    },
    layers: {
      ground: createGrid(width, height),
      decor: createGrid(width, height),
      object: createGrid(width, height),
      upper: createGrid(width, height),
    },
    collision: createGrid(width, height, false),
    damage: createGrid(width, height, 0),
    regions: createGrid(width, height, 0),
    events: [],
  };
}

export function createEvent(x = 0, y = 0, name = '新しいイベント') {
  const commands = [];
  return {
    id: createId('evt'),
    name,
    x,
    y,
    graphic: '',
    direction: 'down',
    trigger: 'action',
    priority: 'same',
    moveType: 'fixed',
    moveSpeed: 3,
    through: false,
    pages: [{
      id: createId('page'),
      name: 'ページ 1',
      conditions: [],
      commands,
      trigger: 'action',
      priority: 'same',
      graphic: '',
    }],
    commands,
  };
}

export function createDefaultGameData({ starter = false } = {}) {
  const data = {
    schemaVersion: GAME_DATA_VERSION,
    maps: [],
    media: [],
    actors: [], classes: [], skills: [], items: [], weapons: [], armors: [],
    enemies: [], troops: [], states: [], animations: [], tilesets: [],
    commonEvents: [], shops: [], quests: [], vehicles: [], switches: [],
    variables: [], types: [], terms: [],
    system: { ...DEFAULT_SYSTEM },
    controlConfig: cloneData(DEFAULT_CONTROL_CONFIG),
    settingsScreen: [],
    plugins: [],
  };

  if (!starter) return data;

  const map = createMap({ name: 'はじまりのマップ', width: 24, height: 18 });
  map.layers.ground = createGrid(map.width, map.height, '#315f3b');
  for (let x = 0; x < map.width; x += 1) {
    map.layers.object[0][x] = '#475569';
    map.layers.object[map.height - 1][x] = '#475569';
  }
  for (let y = 0; y < map.height; y += 1) {
    map.layers.object[y][0] = '#475569';
    map.layers.object[y][map.width - 1] = '#475569';
  }
  const guide = createEvent(4, 3, '案内役');
  guide.commands.push({
    id: createId('cmd'),
    type: 'message',
    params: { text: 'ここからゲーム作りを始められます。' },
  });
  map.events.push(guide);
  data.maps.push(map);
  const actor = {
    id: createId('actor'), name: '主人公', description: '', graphic: '', faceGraphic: '',
    classId: '', level: 1, initialLevel: 1, maxLevel: 99, hp: 100, mp: 30,
    attack: 12, defense: 8, magicAttack: 8, magicDefense: 8, agility: 10,
    luck: 10, equipment: { weapon: '', armor: '' },
  };
  data.actors.push(actor);
  data.system.startMapId = map.id;
  data.system.startParty = [actor.id];
  data.system.startX = 2;
  data.system.startY = 3;
  return data;
}

function normalizePage(page, event) {
  return {
    id: page?.id || createId('page'),
    name: page?.name || 'ページ',
    conditions: Array.isArray(page?.conditions) ? page.conditions : [],
    commands: Array.isArray(page?.commands) ? page.commands : [],
    trigger: page?.trigger || event.trigger || 'action',
    priority: page?.priority || event.priority || 'same',
    graphic: page?.graphic ?? event.graphic ?? '',
  };
}

function normalizeMap(source, index) {
  const width = clampInt(source?.width, 1, 500, 24);
  const height = clampInt(source?.height, 1, 500, 18);
  const layers = source?.layers && typeof source.layers === 'object' ? source.layers : {};
  const layerOrder = Array.from(new Set([
    ...(Array.isArray(source?.layerOrder) ? source.layerOrder : []),
    ...Object.keys(layers),
    'ground', 'object',
  ])).filter(Boolean);
  const normalizedLayers = Object.fromEntries(
    layerOrder.map(key => [key, resizeGrid(layers[key], width, height)]),
  );
  const layerSettings = Object.fromEntries(layerOrder.map((key) => {
    const rawOpacity = Number(source?.layerSettings?.[key]?.opacity ?? 1);
    return [key, {
      name: source?.layerSettings?.[key]?.name || ({ ground: '地面', object: 'オブジェクト', upper: '前景' }[key] || key),
      visible: source?.layerSettings?.[key]?.visible !== false,
      opacity: Number.isFinite(rawOpacity) ? Math.min(1, Math.max(0, rawOpacity)) : 1,
      collision: source?.layerSettings?.[key]?.collision === true || (!source?.layerSettings?.[key] && key === 'object'),
      aboveCharacters: source?.layerSettings?.[key]?.aboveCharacters === true || (!source?.layerSettings?.[key] && key === 'upper'),
    }];
  }));
  const events = (Array.isArray(source?.events) ? source.events : []).map((event, eventIndex) => {
    const legacyCommands = Array.isArray(event?.commands) ? event.commands : [];
    const pages = Array.isArray(event?.pages) && event.pages.length
      ? event.pages.map(page => normalizePage(page, event))
      : [normalizePage({ commands: legacyCommands }, event)];
    return {
      ...createEvent(),
      ...event,
      id: event?.id || createId('evt'),
      name: event?.name || `イベント ${eventIndex + 1}`,
      x: clampInt(event?.x, 0, width - 1, 0),
      y: clampInt(event?.y, 0, height - 1, 0),
      pages,
      commands: pages[0].commands,
    };
  });
  return {
    ...createMap({ name: `マップ ${index + 1}`, width, height }),
    ...source,
    id: source?.id || createId('map'),
    name: source?.name || `マップ ${index + 1}`,
    width,
    height,
    tileSize: clampInt(source?.tileSize, 8, 128, 32),
    layerOrder,
    layerSettings,
    layers: normalizedLayers,
    collision: resizeGrid(source?.collision, width, height, false),
    damage: resizeGrid(source?.damage, width, height, 0),
    regions: resizeGrid(source?.regions, width, height, 0),
    events,
  };
}

export function normalizeGameData(source) {
  const raw = source && typeof source === 'object' ? source : {};
  const data = createDefaultGameData();
  for (const key of DATABASE_KEYS) data[key] = Array.isArray(raw[key]) ? raw[key] : [];
  data.maps = (Array.isArray(raw.maps) ? raw.maps : []).map(normalizeMap);
  data.media = Array.isArray(raw.media) ? raw.media.filter(item => item && typeof item.url === 'string') : [];
  data.system = { ...DEFAULT_SYSTEM, ...(raw.system || {}) };
  if (!data.maps.some(map => map.id === data.system.startMapId)) {
    data.system.startMapId = data.maps[0]?.id || null;
  }
  const startMap = data.maps.find(map => map.id === data.system.startMapId);
  if (startMap) {
    data.system.startX = clampInt(data.system.startX, 0, startMap.width - 1, 0);
    data.system.startY = clampInt(data.system.startY, 0, startMap.height - 1, 0);
  }
  data.controlConfig = {
    ...cloneData(DEFAULT_CONTROL_CONFIG),
    ...(raw.controlConfig || {}),
    keyBindings: {
      ...cloneData(DEFAULT_CONTROL_CONFIG.keyBindings),
      ...(raw.controlConfig?.keyBindings || {}),
    },
  };
  data.settingsScreen = Array.isArray(raw.settingsScreen) ? raw.settingsScreen : [];
  data.plugins = Array.isArray(raw.plugins) ? raw.plugins : [];
  data.schemaVersion = GAME_DATA_VERSION;
  return data;
}

export function validateGameData(source) {
  const errors = [];
  if (!source || typeof source !== 'object') return ['ゲームデータがオブジェクトではありません。'];
  if (!Array.isArray(source.maps)) errors.push('maps が配列ではありません。');
  for (const key of DATABASE_KEYS) {
    if (source[key] !== undefined && !Array.isArray(source[key])) errors.push(`${key} が配列ではありません。`);
  }
  if (source.plugins !== undefined && !Array.isArray(source.plugins)) errors.push('plugins が配列ではありません。');
  if (source.media !== undefined && !Array.isArray(source.media)) errors.push('media が配列ではありません。');
  const ids = new Set();
  for (const map of source.maps || []) {
    if (!map.id) errors.push('IDのないマップがあります。');
    if (ids.has(map.id)) errors.push(`マップID「${map.id}」が重複しています。`);
    ids.add(map.id);
    if (!Number.isInteger(map.width) || !Number.isInteger(map.height) || map.width < 1 || map.height < 1 || map.width > 500 || map.height > 500) {
      errors.push(`マップ「${map.name || map.id}」のサイズが不正です。`);
    }
    const label = map.name || map.id || '名称未設定';
    if (map.layers !== undefined && (!map.layers || typeof map.layers !== 'object' || Array.isArray(map.layers))) {
      errors.push(`マップ「${label}」の layers が不正です。`);
    }
    if (map.layerOrder !== undefined && !Array.isArray(map.layerOrder)) {
      errors.push(`マップ「${label}」の layerOrder が配列ではありません。`);
    }
    const layerIds = map.layerOrder || Object.keys(map.layers || {});
    if (new Set(layerIds).size !== layerIds.length) errors.push(`マップ「${label}」のレイヤーIDが重複しています。`);
    const checkGrid = (grid, field) => {
      if (grid === undefined) return;
      if (!Array.isArray(grid) || grid.length !== map.height || grid.some(row => !Array.isArray(row) || row.length !== map.width)) {
        errors.push(`マップ「${label}」の ${field} サイズがマップと一致しません。`);
      }
    };
    for (const layerId of layerIds) checkGrid(map.layers?.[layerId], `layers.${layerId}`);
    checkGrid(map.collision, 'collision');
    checkGrid(map.damage, 'damage');
    checkGrid(map.regions, 'regions');
    if (map.events !== undefined && !Array.isArray(map.events)) {
      errors.push(`マップ「${label}」の events が配列ではありません。`);
      continue;
    }
    const eventIds = new Set();
    for (const event of map.events || []) {
      if (!event.id) errors.push(`マップ「${label}」にIDのないイベントがあります。`);
      if (eventIds.has(event.id)) errors.push(`マップ「${label}」のイベントID「${event.id}」が重複しています。`);
      eventIds.add(event.id);
      if (!Number.isInteger(event.x) || !Number.isInteger(event.y) || event.x < 0 || event.y < 0 || event.x >= map.width || event.y >= map.height) {
        errors.push(`イベント「${event.name || event.id || '名称未設定'}」の座標が範囲外です。`);
      }
      if (event.pages !== undefined && (!Array.isArray(event.pages) || !event.pages.length)) {
        errors.push(`イベント「${event.name || event.id || '名称未設定'}」に有効なページがありません。`);
      }
      for (const page of event.pages || []) {
        if (!Array.isArray(page.commands)) errors.push(`イベント「${event.name || event.id || '名称未設定'}」のコマンドが配列ではありません。`);
      }
    }
  }
  if (source.system?.startMapId && !ids.has(source.system.startMapId)) errors.push('開始マップが存在しません。');
  return errors;
}

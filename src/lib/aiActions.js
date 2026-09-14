import { createEvent, createId, createMap } from './gameData.js';

const TEXT_LIMIT = 500;
const ACTION_TYPES = new Set(['add_map', 'add_item', 'add_skill', 'add_actor', 'add_enemy', 'add_event', 'add_common_event', 'set_system']);
const COMMAND_TYPES = new Set(['message', 'choices', 'switch', 'variable', 'gold', 'item', 'transfer', 'wait', 'condition', 'bgm', 'se']);

const text = (value, fallback = '') => String(value ?? fallback).trim().slice(0, TEXT_LIMIT);
const integer = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const color = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#111827';
const commands = value => (Array.isArray(value) ? value : []).slice(0, 60)
  .filter(command => COMMAND_TYPES.has(command?.type) && command.params && typeof command.params === 'object')
  .map(command => ({ id: createId('cmd'), type: command.type, params: command.params }));

function normalizeEntity(type, data) {
  const base = { name: text(data.name, '名称未設定'), description: text(data.description) };
  if (type === 'add_item') return { ...base, price: integer(data.price, 0, 9999999, 0), itemType: text(data.itemType, 'normal'), hp: integer(data.hp, -99999, 99999, 0), mp: integer(data.mp, -99999, 99999, 0), attack: integer(data.attack, -99999, 99999, 0), defense: integer(data.defense, -99999, 99999, 0) };
  if (type === 'add_skill') return { ...base, mpCost: integer(data.mpCost, 0, 9999, 0), power: integer(data.power, -99999, 99999, 0), hitRate: integer(data.hitRate, 0, 100, 100), element: text(data.element), target: text(data.target, 'enemy'), type: text(data.type, 'physical') };
  if (type === 'add_actor') return { ...base, classId: text(data.classId), level: integer(data.level, 1, 99, 1), hp: integer(data.hp, 1, 999999, 100), mp: integer(data.mp, 0, 999999, 30), attack: integer(data.attack, 0, 999999, 10), defense: integer(data.defense, 0, 999999, 10), magicAttack: integer(data.magicAttack, 0, 999999, 10), magicDefense: integer(data.magicDefense, 0, 999999, 10), agility: integer(data.agility, 0, 999999, 10) };
  return { ...base, hp: integer(data.hp, 1, 999999, 100), mp: integer(data.mp, 0, 999999, 0), attack: integer(data.attack, 0, 999999, 10), defense: integer(data.defense, 0, 999999, 5), agility: integer(data.agility, 0, 999999, 10), exp: integer(data.exp, 0, 9999999, 0), gold: integer(data.gold, 0, 9999999, 0) };
}

function normalizeSystem(data, gameData) {
  const allowed = ['startMapId', 'startX', 'startY', 'battleSystem', 'currency', 'maxParty', 'moveSpeed', 'encounterRate', 'textSpeed', 'msgPosition'];
  const next = {};
  for (const key of allowed) if (data[key] !== undefined) next[key] = data[key];
  if (next.startMapId && !(gameData.maps || []).some(map => map.id === next.startMapId)) delete next.startMapId;
  if (next.startX !== undefined) next.startX = integer(next.startX, 0, 499, 0);
  if (next.startY !== undefined) next.startY = integer(next.startY, 0, 499, 0);
  if (next.maxParty !== undefined) next.maxParty = integer(next.maxParty, 1, 8, 4);
  if (next.moveSpeed !== undefined) next.moveSpeed = integer(next.moveSpeed, 1, 8, 4);
  if (next.encounterRate !== undefined) next.encounterRate = integer(next.encounterRate, 0, 10000, 0);
  if (next.currency !== undefined) next.currency = text(next.currency, 'G').slice(0, 12);
  return next;
}

export function parseAIResult(content) {
  const raw = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(raw.slice(first, last + 1)); } catch { return null; }
}

export function validateAIActions(result, gameData) {
  const warnings = [];
  if (!result || !Array.isArray(result.actions)) return { message: '', actions: [], warnings: ['AIの応答に actions 配列がありません。'] };
  const actions = result.actions.slice(0, 30).flatMap((action, index) => {
    if (!ACTION_TYPES.has(action?.type)) {
      warnings.push(`${index + 1}件目: 対応していない操作は除外しました。`);
      return [];
    }
    const data = action.data && typeof action.data === 'object' ? action.data : {};
    if (action.type === 'add_map') return [{ type: action.type, data: { name: text(data.name, '新規マップ'), width: integer(data.width, 1, 120, 24), height: integer(data.height, 1, 120, 18), bgColor: color(data.bgColor) } }];
    if (['add_item', 'add_skill', 'add_actor', 'add_enemy'].includes(action.type)) return [{ type: action.type, data: normalizeEntity(action.type, data) }];
    if (action.type === 'add_event') return [{ type: action.type, data: { mapId: text(data.mapId), mapName: text(data.mapName), name: text(data.name, 'イベント'), x: integer(data.x, 0, 499, 0), y: integer(data.y, 0, 499, 0), trigger: ['action', 'touch', 'autorun', 'parallel'].includes(data.trigger) ? data.trigger : 'action', commands: commands(data.commands) } }];
    if (action.type === 'add_common_event') return [{ type: action.type, data: { name: text(data.name, 'コモンイベント'), trigger: ['autorun', 'parallel', 'none'].includes(data.trigger) ? data.trigger : 'none', commands: commands(data.commands) } }];
    const system = normalizeSystem(data, gameData);
    if (!Object.keys(system).length) warnings.push(`${index + 1}件目: 変更できるシステム項目がありません。`);
    return Object.keys(system).length ? [{ type: action.type, data: system }] : [];
  });
  return { message: text(result.message), actions, warnings };
}

export function applyAIActions(gameData, actions) {
  let next = { ...gameData };
  let applied = 0;
  const skipped = [];
  for (const action of actions || []) {
    const data = action.data || {};
    if (action.type === 'add_map') {
      const map = createMap(data);
      map.bgColor = data.bgColor;
      next = { ...next, maps: [...(next.maps || []), map] };
    } else if (action.type === 'add_item') next = { ...next, items: [...(next.items || []), { id: createId('item'), ...data }] };
    else if (action.type === 'add_skill') next = { ...next, skills: [...(next.skills || []), { id: createId('skill'), ...data }] };
    else if (action.type === 'add_actor') next = { ...next, actors: [...(next.actors || []), { id: createId('actor'), ...data }] };
    else if (action.type === 'add_enemy') next = { ...next, enemies: [...(next.enemies || []), { id: createId('enemy'), ...data }] };
    else if (action.type === 'add_event') {
      const map = (next.maps || []).find(candidate => candidate.id === data.mapId || candidate.name === data.mapName);
      if (!map) { skipped.push(`イベント「${data.name || '名称未設定'}」: 対象マップが見つかりません。`); continue; }
      const event = createEvent(Math.min(data.x, map.width - 1), Math.min(data.y, map.height - 1), data.name);
      event.trigger = data.trigger;
      event.commands = data.commands;
      event.pages[0] = { ...event.pages[0], trigger: data.trigger, commands: data.commands };
      next = { ...next, maps: next.maps.map(candidate => candidate.id === map.id ? { ...candidate, events: [...(candidate.events || []), event] } : candidate) };
    } else if (action.type === 'add_common_event') next = { ...next, commonEvents: [...(next.commonEvents || []), { id: createId('common'), ...data }] };
    else if (action.type === 'set_system') next = { ...next, system: { ...(next.system || {}), ...data } };
    else { skipped.push('対応していない操作を除外しました。'); continue; }
    applied += 1;
  }
  return { gameData: next, applied, skipped };
}

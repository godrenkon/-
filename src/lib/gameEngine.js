import { createOfficialExtension, getOfficialExtension } from './officialExtensions.js';

/**
 * Suiram RPG Edit - Game Runtime Engine
 * Renders maps, handles movement, processes events and commands.
 */

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const BASE_MOVE_SPEED = 4;
const FORBIDDEN_PLUGIN_TOKENS = /\b(?:document|window|globalThis|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|Worker|navigator|location|parent|top|self|frames|postMessage|alert|prompt|confirm|eval|Function|constructor|import)\b/i;

export class GameEngine {
  constructor(canvas, gameData, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameData = gameData || {};
    this.callbacks = callbacks;

    // Game state
    this.state = {
      currentMapId: null,
      playerX: 0,
      playerY: 0,
      playerDir: 'down',
      switches: {},
      variables: {},
      items: {},
      gold: 0,
      party: [],
      pictures: [],
      tint: null,
      shake: { intensity: 0, duration: 0 },
      weather: null,
      bgm: null,
      erasedEvents: {},
      selfSwitches: {},
      encounterRate: 0,
      saveAccess: true,
      menuAccess: true,
      playerGraphic: '',
      moveSpeed: 4,
      transparent: false,
      windowColor: null,
      flashScreen: null,
      fadeScreen: null,
      formation: true,
      checkpoint: null,
      actorStates: {},
      extensionData: {},
    };

    // Movement
    this.moving = false;
    this.moveFrom = { x: 0, y: 0 };
    this.moveTo = { x: 0, y: 0 };
    this.moveProgress = 0;
    this.inputQueue = null;

    // Camera
    this.cameraX = 0;
    this.cameraY = 0;

    // Rendering
    this.scale = 1;
    this.viewW = 0;
    this.viewH = 0;
    this.tileSize = 32;

    // Event processing
    this.commandQueue = null;
    this.commandIndex = 0;
    this.waiting = false;
    this.waitFrames = 0;
    this.messageVisible = false;
    this.choicesVisible = false;
    this.pendingChoice = null;

    // Timing
    this.lastTime = 0;
    this.running = false;
    this.rafId = null;

    // Plugins
    this.plugins = [];
    this.pluginApis = [];
    this.customCommands = {};
    this.customHooks = {};
    this._currentPluginSettings = {};
    this.muted = false;
    this.imageCache = new Map();
    this.parallelCooldowns = new Map();
    this.eventMoveCooldowns = new Map();
    this.animationTime = 0;
  }

  // ─── Lifecycle ───────────────────────────────────────

  start() {
    const sys = this.gameData.system || {};
    const startMapId = sys.startMapId || this.gameData.maps?.[0]?.id;
    if (!startMapId) {
      this.callbacks.onError?.('開始マップが設定されていません');
      return;
    }
    this.state.currentMapId = startMapId;
    this.state.playerX = sys.startX || 0;
    this.state.playerY = sys.startY || 0;
    this.state.encounterRate = sys.encounterRate || 0;
    this.state.saveAccess = sys.saveAccess !== false;
    this.state.menuAccess = sys.menuAccess !== false;
    this.state.playerGraphic = sys.playerGraphic || '';
    this.state.moveSpeed = sys.moveSpeed || 4;
    this.state.formation = sys.formation !== false;
    if (sys.startParty) this.state.party = [...sys.startParty];
    for (const actor of this.gameData.actors || []) this.state.actorStates[actor.id] = { ...actor };
    this.loadPlugins();
    this.initSettingsDefaults();
    this.fireHook('onGameStart');
    this.fireHook('onMapEnter', this.getCurrentMap());
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.fireHook('onUnload');
  }

  loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  // ─── Plugins ─────────────────────────────────────────

  loadPlugins() {
    this.plugins = [];
    const installed = this.gameData.plugins || [];
    for (const ip of installed) {
      if (!ip.enabled) continue;
      const official = getOfficialExtension(ip.catalog_id || ip.plugin_id);
      if (official) {
        const plugin = createOfficialExtension(official, ip.settings || {});
        plugin._settings = ip.settings || {};
        this.plugins.push(plugin);
        this.firePluginHook(plugin, 'onLoad');
        continue;
      }
      const code = ip.code || ip.plugin_code;
      if (!code || ip.trusted !== true) continue;
      try {
        if (FORBIDDEN_PLUGIN_TOKENS.test(code)) throw new Error('Unsafe community extension API access');
        if (/export\s+(?!default\b)/.test(code)) throw new Error('Only a default plugin export is supported');
        const transformed = code.replace(/export\s+default\s+/g, 'module.exports = ');
        const fn = new Function('module', 'exports', `"use strict";\n${transformed}`);
        const module = { exports: {} };
        fn(module, module.exports);
        const plugin = module.exports.default || module.exports;
        if (plugin && typeof plugin === 'object') {
          plugin._settings = ip.settings || {};
          this.plugins.push(plugin);
          this.firePluginHook(plugin, 'onLoad');
        }
      } catch (e) {
        console.warn('Plugin load error:', e);
      }
    }
  }

  createPluginApi() {
    const engine = this;
    return {
      // ─── State ───────────────────────────
      state: this.state,
      getSwitch: (n) => this.state.switches[n],
      setSwitch: (n, v) => { this.state.switches[n] = v; this.notifyState(); },
      getVariable: (n) => this.state.variables[n] || 0,
      setVariable: (n, v) => { this.state.variables[n] = v; this.notifyState(); },

      // ─── Gold & Items ────────────────────
      getGold: () => this.state.gold,
      addGold: (a) => { this.state.gold += a; this.notifyState(); },
      getItems: () => this.state.items,
      getItem: (n) => this.state.items[n] || 0,
      addItem: (n, c = 1) => { this.state.items[n] = (this.state.items[n] || 0) + c; this.notifyState(); },
      removeItem: (n, c = 1) => { this.state.items[n] = Math.max(0, (this.state.items[n] || 0) - c); this.notifyState(); },
      hasItem: (n) => (this.state.items[n] || 0) > 0,

      // ─── Party ───────────────────────────
      getParty: () => this.state.party,
      setParty: (party) => {
        this.state.party = [...new Set((Array.isArray(party) ? party : []).map(member => typeof member === 'object' ? member.id : member).filter(Boolean))];
        this.notifyState();
      },
      addPartyMember: (member) => {
        const id = typeof member === 'object' ? member?.id : member;
        if (id && !this.state.party.includes(id)) this.state.party.push(id);
        this.notifyState();
      },
      removePartyMember: (id) => { this.state.party = this.state.party.filter(memberId => memberId !== id); this.notifyState(); },

      // ─── Maps & Events ───────────────────
      getMap: () => this.getCurrentMap(),
      getMaps: () => this.gameData.maps || [],
      getMapById: (id) => (this.gameData.maps || []).find(m => m.id === id),
      getEvents: () => this.getCurrentMap()?.events || [],
      getEventById: (id) => (this.getCurrentMap()?.events || []).find(e => e.id === id),
      getEventData: () => this.currentEvent || {},
      getRegion: (x, y) => this.getCurrentMap()?.regions?.[y]?.[x] || 0,

      // ─── Game Data ───────────────────────
      getData: (key) => this.gameData[key],
      getGameData: () => this.gameData,

      // ─── Player ──────────────────────────
      getPlayerPos: () => ({ x: this.state.playerX, y: this.state.playerY, dir: this.state.playerDir }),
      setPlayerDir: (dir) => { if (DIR_VECTORS[dir]) this.state.playerDir = dir; },
      isMoving: () => this.moving,
      transferPlayer: (mapId, x, y) => this.transferPlayer(mapId, x, y),
      setCheckpoint: (position) => { this.state.checkpoint = { mapId: this.state.currentMapId, ...position }; this.notifyState(); },
      returnToCheckpoint: () => {
        const point = this.state.checkpoint;
        if (point) this.transferPlayer(point.mapId, point.x, point.y);
      },

      // ─── Camera ─────────────────────────
      getCamera: () => ({ x: this.cameraX, y: this.cameraY }),
      setCamera: (x, y) => { this.cameraX = x; this.cameraY = y; },
      get screenWidth() { return engine.viewW; },
      get screenHeight() { return engine.viewH; },

      // ─── UI ──────────────────────────────
      showMessage: (text) => new Promise(res => this.showMessage(text, res)),
      showChoices: (choices) => new Promise(res => this.showChoices(choices, res)),
      wait: (frames) => new Promise(res => this.waitFrames = { remaining: frames, cb: res }),

      // ─── Audio ───────────────────────────
      playBGM: (url) => this.playBGM(url),
      stopBGM: () => this.stopBGM(),
      playSE: (url) => this.playSE(url),

      // ─── Screen Effects ─────────────────
      tintScreen: (color, opacity = 0.5) => { this.state.tint = { color, opacity }; this.notifyState(); },
      clearTint: () => { this.state.tint = null; this.notifyState(); },
      shakeScreen: (dur, intensity = 5) => { this.state.shake = { intensity, duration: dur }; },
      flashScreen: (color = '#fff', frames = 18) => { this.state.flashScreen = { color, duration: frames / 60 }; },
      drawCollision: (context) => this.drawCollisionOverlay(context),

      // ─── Custom Commands & Hooks ─────────
      registerCommand: (type, handler) => { this.customCommands[type] = handler; },
      onCustom: (name, handler) => {
        if (!this.customHooks[name]) this.customHooks[name] = [];
        this.customHooks[name].push(handler);
      },
      fireCustom: (name, ...args) => {
        (this.customHooks[name] || []).forEach(h => { try { h(...args); } catch (e) { console.warn(e); } });
      },

      // ─── Inter-plugin ────────────────────
      getPlugin: (name) => this.plugins.find(p => p.name === name),
      getPlugins: () => this.plugins.map(p => ({ name: p.name, version: p.version })),

      // ─── Math Utils ──────────────────────
      random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      randomFloat: (min, max) => Math.random() * (max - min) + min,
      clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      lerp: (a, b, t) => a + (b - a) * t,
      distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),

      // ─── Settings ────────────────────────
      getSetting: (key) => this._currentPluginSettings?.[key],
      settings: this._currentPluginSettings || {},
    };
  }

  firePluginHook(plugin, hook, args = []) {
    if (typeof plugin[hook] === 'function') {
      this._currentPluginSettings = plugin._settings || {};
      try { plugin[hook](this.createPluginApi(), ...args); } catch (e) { console.warn(e); }
    }
  }

  fireHook(hook, ...args) {
    for (const p of this.plugins) this.firePluginHook(p, hook, args);
  }

  // ─── Control & Settings ─────────────────────────────

  getControlConfig() {
    return this.gameData.controlConfig || {};
  }

  getSettingsScreen() {
    return this.gameData.settingsScreen || [];
  }

  initSettingsDefaults() {
    const items = this.getSettingsScreen();
    for (const item of items) {
      if (item.targetType === 'switch') {
        if (this.state.switches[item.targetId] === undefined) {
          this.state.switches[item.targetId] = item.defaultValue || false;
        }
      } else {
        if (this.state.variables[item.targetId] === undefined) {
          this.state.variables[item.targetId] = item.defaultValue || 0;
        }
      }
    }
  }

  getSettingValue(itemId) {
    const item = this.getSettingsScreen().find(i => i.id === itemId);
    if (!item) return null;
    if (item.targetType === 'switch') return this.state.switches[item.targetId];
    return this.state.variables[item.targetId];
  }

  setSettingValue(itemId, value) {
    const item = this.getSettingsScreen().find(i => i.id === itemId);
    if (!item) return;
    if (item.targetType === 'switch') {
      this.state.switches[item.targetId] = value;
    } else {
      this.state.variables[item.targetId] = value;
    }
    this.notifyState();
  }

  // ─── Map helpers ──────────────────────────────────────

  getCurrentMap() {
    return (this.gameData.maps || []).find(m => m.id === this.state.currentMapId);
  }

  evaluatePageCondition(condition, event) {
    const key = condition?.key;
    const expected = condition?.operator !== 'off';
    switch (condition?.type) {
      case 'switch': return Boolean(this.state.switches[key]) === expected;
      case 'selfSwitch': return Boolean(this.state.selfSwitches[event.id]?.[key || 'A']) === expected;
      case 'item': return ((this.state.items[key] || 0) > 0) === expected;
      case 'actor': return this.state.party.includes(key) === expected;
      case 'variable': {
        const actual = Number(this.state.variables[key] || 0);
        const value = Number(condition.value || 0);
        switch (condition.operator) {
          case '>': return actual > value;
          case '<': return actual < value;
          case '<=': return actual <= value;
          case '==': return actual === value;
          default: return actual >= value;
        }
      }
      default: return true;
    }
  }

  getActiveEventPage(event) {
    const pages = event.pages?.length ? event.pages : [{
      commands: event.commands || [], trigger: event.trigger, priority: event.priority,
      graphic: event.graphic, conditions: [],
    }];
    for (let index = pages.length - 1; index >= 0; index -= 1) {
      const page = pages[index];
      if ((page.conditions || []).every(condition => this.evaluatePageCondition(condition, event))) return page;
    }
    return null;
  }

  getRuntimeEvent(event) {
    const page = this.getActiveEventPage(event);
    return page ? { ...event, ...page, id: event.id, sourceEvent: event } : null;
  }

  isPassable(x, y) {
    const map = this.getCurrentMap();
    if (!map) return false;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
    if (map.collision?.[y]?.[x]) return false;
    for (const layerId of map.layerOrder || Object.keys(map.layers || {})) {
      const tile = map.layers?.[layerId]?.[y]?.[x];
      const settings = map.layerSettings?.[layerId];
      if (tile && (settings?.collision === true || (!map.layerSettings && layerId === 'object'))) return false;
      if (tile && typeof tile === 'object' && tile.passable === false) return false;
    }
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || event.through || this.state.erasedEvents[event.id]) continue;
      if (event.x === x && event.y === y && (event.priority === 'same' || event.priority === 'above')) return false;
    }
    return true;
  }

  // ─── Input ───────────────────────────────────────────

  pressDirection(dir) {
    this.state.playerDir = dir;
    if (!this.moving && !this.waiting) {
      this.tryMove(dir);
    } else {
      this.inputQueue = dir;
    }
  }

  pressAction() {
    if (this.waiting || this.moving) return;
    this.checkActionEvent();
  }

  pressCancel() {
    this.callbacks.onCancel?.();
  }

  tryMove(dir) {
    const v = DIR_VECTORS[dir];
    if (!v) return;
    const nx = this.state.playerX + v.x;
    const ny = this.state.playerY + v.y;
    if (!this.isPassable(nx, ny)) return;
    this.moving = true;
    this.moveFrom = { x: this.state.playerX, y: this.state.playerY };
    this.moveTo = { x: nx, y: ny };
    this.moveProgress = 0;
  }

  // ─── Update ──────────────────────────────────────────

  update(dt) {
    this.animationTime += dt;
    // Wait
    if (this.waitFrames) {
      this.waitFrames.remaining -= dt * 60;
      if (this.waitFrames.remaining <= 0) {
        const cb = this.waitFrames.cb;
        this.waitFrames = null;
        cb?.();
      }
      return;
    }
    if (this.waiting || this.messageVisible || this.choicesVisible) {
      this.fireHook('onUpdate', dt);
      return;
    }

    // Movement
    if (this.moving) {
      const configuredSpeed = Number(this.state.moveSpeed) || BASE_MOVE_SPEED;
      const dashMultiplier = this.state.dash ? 1.7 : 1;
      this.moveProgress += dt * configuredSpeed * dashMultiplier;
      if (this.moveProgress >= 1) {
        this.state.playerX = this.moveTo.x;
        this.state.playerY = this.moveTo.y;
        this.moving = false;
        this.moveProgress = 0;
        this.handlePlayerStep();
        if (!this.waiting) this.checkTouchEvents();
        if (this.inputQueue) {
          const q = this.inputQueue;
          this.inputQueue = null;
          this.tryMove(q);
        }
      }
    } else if (this.inputQueue) {
      const q = this.inputQueue;
      this.inputQueue = null;
      this.tryMove(q);
    }

    this.updateEventMovement();

    // Auto/parallel events
    this.checkAutoEvents();

    // Shake
    if (this.state.shake.duration > 0) {
      this.state.shake.duration -= dt;
      if (this.state.shake.duration <= 0) this.state.shake.intensity = 0;
    }
    if (this.state.flashScreen?.duration > 0) {
      this.state.flashScreen.duration -= dt;
      if (this.state.flashScreen.duration <= 0) this.state.flashScreen = null;
    }

    // Camera
    this.updateCamera();

    // Plugin update
    this.fireHook('onUpdate', dt);
  }

  handlePlayerStep() {
    const map = this.getCurrentMap();
    if (!map) return;
    const position = { x: this.state.playerX, y: this.state.playerY, region: map.regions?.[this.state.playerY]?.[this.state.playerX] || 0 };
    const damage = Number(map.damage?.[position.y]?.[position.x] || 0);
    if (damage > 0) {
      for (const actorId of this.state.party) {
        const actor = this.state.actorStates[actorId];
        if (actor) actor.hp = Math.max(1, Number(actor.hp || 1) - damage);
      }
      this.callbacks.onDamageFloor?.(damage);
      this.notifyState();
    }
    this.fireHook('onPlayerStep', position);
    const rate = Math.min(100, Math.max(0, Number(map.encounterRate ?? this.state.encounterRate) || 0));
    const troops = this.gameData.troops || [];
    if (!this.waiting && rate > 0 && troops.length && Math.random() * 100 < rate) {
      this.startBattle(troops[Math.floor(Math.random() * troops.length)]);
    }
  }

  updateEventMovement() {
    const map = this.getCurrentMap();
    if (!map || this.waiting || this.moving) return;
    const now = performance.now();
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || !['random', 'approach'].includes(event.moveType) || this.state.erasedEvents[event.id]) continue;
      if (now < (this.eventMoveCooldowns.get(event.id) || 0)) continue;
      const interval = Math.max(300, 2300 - (Number(event.moveSpeed) || 3) * 300);
      this.eventMoveCooldowns.set(event.id, now + interval);
      let direction;
      if (event.moveType === 'approach') {
        const dx = this.state.playerX - source.x;
        const dy = this.state.playerY - source.y;
        direction = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      } else {
        direction = Object.keys(DIR_VECTORS)[Math.floor(Math.random() * 4)];
      }
      const vector = DIR_VECTORS[direction];
      const x = source.x + vector.x;
      const y = source.y + vector.y;
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
      if (x === this.state.playerX && y === this.state.playerY) continue;
      if (!event.through && !this.isPassable(x, y)) continue;
      source.x = x;
      source.y = y;
      source.direction = direction;
    }
  }

  updateCamera() {
    const map = this.getCurrentMap();
    if (!map) return;
    const ts = map.tileSize || 32;
    this.tileSize = ts;
    const mapPxW = map.width * ts;
    const mapPxH = map.height * ts;

    const targetX = this.state.playerX * ts + ts / 2 - this.viewW / 2 / this.scale;
    const targetY = this.state.playerY * ts + ts / 2 - this.viewH / 2 / this.scale;

    this.cameraX = Math.max(0, Math.min(targetX, Math.max(0, mapPxW - this.viewW / this.scale)));
    this.cameraY = Math.max(0, Math.min(targetY, Math.max(0, mapPxH - this.viewH / this.scale)));

    if (mapPxW < this.viewW / this.scale) this.cameraX = (mapPxW - this.viewW / this.scale) / 2;
    if (mapPxH < this.viewH / this.scale) this.cameraY = (mapPxH - this.viewH / this.scale) / 2;
  }

  // ─── Events ──────────────────────────────────────────

  checkTouchEvents() {
    const map = this.getCurrentMap();
    if (!map) return;
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || this.state.erasedEvents[event.id]) continue;
      if (event.trigger === 'touch' && event.x === this.state.playerX && event.y === this.state.playerY) {
        this.runEvent(event);
        return;
      }
    }
  }

  checkActionEvent() {
    const map = this.getCurrentMap();
    if (!map) return;
    const v = DIR_VECTORS[this.state.playerDir];
    const fx = this.state.playerX + v.x;
    const fy = this.state.playerY + v.y;
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || this.state.erasedEvents[event.id] || event.trigger !== 'action') continue;
      const onCurrentTile = event.priority === 'below' && event.x === this.state.playerX && event.y === this.state.playerY;
      if (onCurrentTile || (event.x === fx && event.y === fy)) {
        this.runEvent(event);
        return;
      }
    }
  }

  checkAutoEvents() {
    const map = this.getCurrentMap();
    if (!map || this.waiting) return;
    const now = performance.now();
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || this.state.erasedEvents[event.id]) continue;
      if (event.trigger === 'auto' && !this.waiting) {
        this.runEvent(event);
        return;
      }
      if (event.trigger === 'parallel' && !this.waiting && now >= (this.parallelCooldowns.get(event.id) || 0)) {
        this.parallelCooldowns.set(event.id, now + 250);
        this.runEvent(event);
        return;
      }
    }
    for (const common of this.gameData.commonEvents || []) {
      if (!['autorun', 'parallel'].includes(common.trigger) || !this.evalCondition(common.condition)) continue;
      const key = `common:${common.id}`;
      if (common.trigger === 'parallel' && now < (this.parallelCooldowns.get(key) || 0)) continue;
      if (common.trigger === 'parallel') this.parallelCooldowns.set(key, now + 250);
      this.runEvent({ ...common, id: key, commands: common.commands || [] });
      return;
    }
  }

  runEvent(event) {
    if (this.waiting) return;
    this.currentEvent = event;
    this.fireHook('onEventTrigger', event);
    const commands = event.commands || [];
    if (commands.length === 0) {
      this.currentEvent = null;
      return;
    }
    this.commandQueue = [...commands];
    this.commandIndex = 0;
    this.waiting = true;
    this.executeNextCommand();
  }

  executeNextCommand() {
    if (!this.commandQueue || this.commandIndex >= this.commandQueue.length) {
      this.commandQueue = null;
      this.commandIndex = 0;
      this.waiting = false;
      this.currentEvent = null;
      return;
    }
    const cmd = this.commandQueue[this.commandIndex];
    this.fireHook('onEventCommand', cmd);
    this.executeCommand(cmd, () => {
      this.commandIndex++;
      this.executeNextCommand();
    });
  }

  executeCommand(cmd, next) {
    const p = cmd.params || {};
    switch (cmd.type) {
      case 'message':
        this.showMessage(p.text || '', next);
        break;
      case 'choices':
        this.showChoices(p.choices || [], idx => {
          if (Array.isArray(p.branches?.[idx])) {
            this.commandQueue.splice(this.commandIndex + 1, 0, ...p.branches[idx]);
          }
          next();
        });
        break;
      case 'wait':
        this.waitFrames = { remaining: p.duration || 60, cb: next };
        break;
      case 'switch':
        this.state.switches[p.switchName] = p.value === 'ON';
        this.notifyState();
        next();
        break;
      case 'variable':
        this.state.variables[p.varName] = this.evalExpr(p.value);
        this.notifyState();
        next();
        break;
      case 'gold':
        this.state.gold += (p.operation === '-' ? -1 : 1) * (p.amount || 0);
        this.notifyState();
        next();
        break;
      case 'item':
        if (p.operation === '-') {
          this.state.items[p.itemName] = Math.max(0, (this.state.items[p.itemName] || 0) - (p.amount || 1));
        } else {
          this.state.items[p.itemName] = (this.state.items[p.itemName] || 0) + (p.amount || 1);
        }
        this.notifyState();
        next();
        break;
      case 'transfer':
        this.transferByName(p.mapName, p.x || 0, p.y || 0, next);
        break;
      case 'bgm':
        this.playBGM(p.audioName);
        next();
        break;
      case 'se':
        this.playSE(p.audioName);
        next();
        break;
      case 'tint':
        this.state.tint = { color: p.color || '#000000', opacity: 0.5 };
        next();
        break;
      case 'shake':
        this.state.shake = { intensity: 5, duration: (p.duration || 30) / 60 };
        next();
        break;
      case 'erase':
        if (this.currentEvent) this.state.erasedEvents[this.currentEvent.id] = true;
        next();
        break;
      case 'comment':
        next();
        break;
      case 'label':
        next();
        break;
      case 'jump':
        // Find label in command queue
        const labelIdx = this.commandQueue.findIndex(c => c.type === 'label' && c.params?.name === p.label);
        if (labelIdx >= 0) {
          this.commandIndex = labelIdx;
          this.executeNextCommand();
        } else {
          next();
        }
        break;
      case 'condition':
        if (!this.evalCondition(p.expression) && Number.isInteger(p.skip)) this.commandIndex += Math.max(0, p.skip);
        next();
        break;
      case 'battle': {
        const troop = (this.gameData.troops || []).find(item => item.id === p.troopId || item.name === p.troopName);
        if (troop) this.startBattle(troop, next);
        else next();
        break;
      }
      // ─── Party / Actor ───────────────────────────────
      case 'change_party':
        if (p.operation === 'remove') { this.state.party = this.state.party.filter(id => id !== p.actorId); }
        else { if (!this.state.party.includes(p.actorId)) this.state.party.push(p.actorId); }
        this.notifyState(); next(); break;
      case 'change_hp': this.changeActorStat(p.actorId, 'hp', p.operation, p.amount); next(); break;
      case 'change_mp': this.changeActorStat(p.actorId, 'mp', p.operation, p.amount); next(); break;
      case 'change_exp': this.changeActorStat(p.actorId, 'exp', p.operation, p.amount); next(); break;
      case 'change_level': this.changeActorStat(p.actorId, 'level', p.operation, p.amount); next(); break;
      case 'change_param': this.changeActorStat(p.actorId, p.paramName, p.operation, p.amount); next(); break;
      case 'recover_all': this.recoverAll(); next(); break;
      case 'change_equipment': this.changeEquipment(p.actorId, p.slot, p.itemId); next(); break;
      case 'change_name': this.changeActorField(p.actorId, 'name', p.value); next(); break;
      case 'change_class': this.changeActorField(p.actorId, 'classId', p.value); next(); break;
      case 'change_graphic': if (this.currentEvent) { this.currentEvent.graphic = p.value; if (this.currentEvent.sourceEvent) this.currentEvent.sourceEvent.graphic = p.value; } next(); break;
      // ─── Screen / Visual ────────────────────────────
      case 'fade_screen': this.state.fadeScreen = { type: p.fadeType || 'out' }; this.waitFrames = { remaining: 30, cb: next }; break;
      case 'flash_screen': this.state.flashScreen = { color: p.color || '#ffffff', duration: (p.duration || 30) / 60 }; next(); break;
      case 'change_window_color': this.state.windowColor = p.color || null; next(); break;
      case 'show_animation': this.waitFrames = { remaining: 30, cb: next }; break;
      case 'show_balloon': this.waitFrames = { remaining: 20, cb: next }; break;
      case 'weather': this.state.weather = p.weatherType === 'none' ? null : { type: p.weatherType || 'rain', power: Math.min(9, Math.max(0, Number(p.power) || 1)) }; next(); break;
      case 'show_picture': {
        const picture = { id: Number(p.pictureId) || 1, url: p.url || '', x: Number(p.x) || 0, y: Number(p.y) || 0, opacity: Math.min(1, Math.max(0, Number(p.opacity ?? 1))) };
        this.state.pictures = [...this.state.pictures.filter(item => item.id !== picture.id), picture];
        next(); break;
      }
      case 'erase_picture': this.state.pictures = this.state.pictures.filter(item => item.id !== (Number(p.pictureId) || 1)); next(); break;
      // ─── Map / Movement ─────────────────────────────
      case 'scroll_map': this.state.scrollMap = { x: p.x || 0, y: p.y || 0, speed: p.speed || 4 }; next(); break;
      case 'set_event_location': this.setEventLocation(p.eventName, p.x, p.y); next(); break;
      case 'change_tileset': { const m = this.getCurrentMap(); if (m) m.tileset = p.tilesetName; next(); } break;
      case 'change_player_graphic': this.state.playerGraphic = p.graphic || ''; next(); break;
      case 'set_move_speed': this.state.moveSpeed = p.speed || 4; next(); break;
      case 'transparent': this.state.transparent = p.value !== 'OFF'; next(); break;
      case 'gather_followers': next(); break;
      case 'get_location_info': { const m2 = this.getCurrentMap(); if (m2) { const xi = parseInt(p.x)||0, yi=parseInt(p.y)||0; this.state.variables[p.varName||'loc'] = m2.layers?.object?.[yi]?.[xi] || 0; this.notifyState(); } next(); } break;
      case 'move_route': this.applyMoveRoute(p.route, p.target); next(); break;
      // ─── Game Flow ──────────────────────────────────
      case 'open_shop': if (this.callbacks.onOpenShop) this.callbacks.onOpenShop(p.shopId, next); else next(); break;
      case 'open_save': this.callbacks.onOpenSave?.(); next(); break;
      case 'open_menu': this.callbacks.onOpenMenu?.(); next(); break;
      case 'input_number': this.showInputNumber(p.varName||'input', p.digits||4, (v) => { this.state.variables[p.varName||'input'] = v; this.notifyState(); next(); }); break;
      case 'scroll_text': this.showScrollText(p.text||'', next); break;
      case 'game_over': this.callbacks.onGameOver?.(); next(); break;
      case 'return_title': this.callbacks.onReturnTitle?.(); next(); break;
      case 'change_encounter': this.state.encounterRate = parseInt(p.rate)||0; next(); break;
      case 'change_save_access': this.state.saveAccess = p.value === 'ON'; next(); break;
      case 'change_menu_access': this.state.menuAccess = p.value === 'ON'; next(); break;
      case 'change_formation': this.state.formation = p.value === 'ON'; next(); break;
      // ─── Audio / System ────────────────────────────
      case 'change_system_bgm': this.playBGM(p.audioName); next(); break;
      case 'play_movie': this.callbacks.onPlayMovie?.(p.movieUrl); this.waitFrames = { remaining: 60, cb: next }; break;
      case 'change_self_switch': if (this.currentEvent) { this.state.selfSwitches[this.currentEvent.id] = this.state.selfSwitches[this.currentEvent.id]||{}; this.state.selfSwitches[this.currentEvent.id][p.switchName||'A'] = p.value==='ON'; } next(); break;
      case 'change_gold_variable': this.state.gold = this.evalExpr(p.varName); this.notifyState(); next(); break;
      case 'change_item_variable': this.state.items[p.itemName] = this.evalExpr(p.varName); this.notifyState(); next(); break;
      case 'common': {
        const common = (this.gameData.commonEvents || []).find(event => event.id === p.commonEventId || event.name === p.commonEventName);
        if (common?.commands?.length) this.commandQueue.splice(this.commandIndex + 1, 0, ...common.commands.map(command => ({ ...command, params: { ...(command.params || {}) } })));
        next(); break;
      }
      case 'wait_for_movement': { const chk = () => { if (this.moving) setTimeout(chk,100); else next(); }; chk(); } break;
      default:
        // Check plugin custom commands
        const pluginCmd = this.findPluginCommand(cmd.type);
        if (pluginCmd) {
          try {
            const result = pluginCmd.execute?.(this.createPluginApi(), p);
            if (result instanceof Promise) result.then(next).catch(next);
            else next();
          } catch { next(); }
        } else {
          next();
        }
    }
  }

  // ─── Actor / Party helpers ─────────────────────────
  startBattle(troop, onFinish) {
    if (!this.callbacks.onBattle) { onFinish?.({ result: 'skipped' }); return; }
    const alreadyWaiting = this.waiting;
    this.waiting = true;
    this.fireHook('onBattleStart', troop);
    this.callbacks.onBattle({ troop, actors: this.state.party.map(id => this.state.actorStates[id]).filter(Boolean) }, result => {
      this.fireHook('onBattleEnd', result);
      if (!alreadyWaiting) this.waiting = false;
      onFinish?.(result);
    });
  }

  changeActorStat(actorId, stat, operation, amount) {
    const source = (this.gameData.actors || []).find(a => a.id === actorId || a.name === actorId);
    const actor = source ? this.state.actorStates[source.id] : null;
    if (!actor) return;
    const val = parseInt(amount) || 0;
    if (operation === '-') actor[stat] = Math.max(0, (actor[stat] || 0) - val);
    else if (operation === '=') actor[stat] = val;
    else actor[stat] = (actor[stat] || 0) + val;
    this.notifyState();
  }
  recoverAll() {
    for (const actorId of this.state.party) {
      const actor = this.state.actorStates[actorId];
      const source = (this.gameData.actors || []).find(item => item.id === actorId);
      if (actor) {
        actor.hp = source?.maxHp || source?.hp || actor.hp;
        actor.mp = source?.maxMp || source?.mp || actor.mp;
      }
    }
    this.notifyState();
  }
  changeEquipment(actorId, slot, itemId) {
    const source = (this.gameData.actors || []).find(a => a.id === actorId || a.name === actorId);
    const actor = source ? this.state.actorStates[source.id] : null;
    if (actor) { actor.equipment = actor.equipment || {}; actor.equipment[slot] = itemId; }
    this.notifyState();
  }
  changeActorField(actorId, field, value) {
    const source = (this.gameData.actors || []).find(a => a.id === actorId || a.name === actorId);
    const actor = source ? this.state.actorStates[source.id] : null;
    if (actor) actor[field] = value;
    this.notifyState();
  }
  setEventLocation(eventName, x, y) {
    const map = this.getCurrentMap();
    if (!map) return;
    const ev = (map.events || []).find(e => e.name === eventName || e.id === eventName);
    if (ev) {
      ev.x = Math.min(map.width - 1, Math.max(0, Number.parseInt(x, 10) || 0));
      ev.y = Math.min(map.height - 1, Math.max(0, Number.parseInt(y, 10) || 0));
    }
  }
  applyMoveRoute(route, target = 'player') {
    const steps = Array.isArray(route) ? route : String(route || '').split(/[\s,]+/).filter(Boolean);
    const event = target === 'event' ? (this.currentEvent?.sourceEvent || this.currentEvent) : null;
    let x = event ? event.x : this.state.playerX;
    let y = event ? event.y : this.state.playerY;
    for (const step of steps) {
      const direction = DIR_VECTORS[String(step).toLowerCase()];
      if (!direction) continue;
      const nextX = x + direction.x;
      const nextY = y + direction.y;
      if (event || this.isPassable(nextX, nextY)) { x = nextX; y = nextY; }
    }
    if (event) { event.x = x; event.y = y; }
    else { this.state.playerX = x; this.state.playerY = y; }
    this.notifyState();
  }
  showInputNumber(varName, digits, callback) {
    if (this.callbacks.onInputNumber) this.callbacks.onInputNumber({ varName, digits, callback });
    else callback(0);
  }
  showScrollText(text, callback) {
    if (this.callbacks.onScrollText) this.callbacks.onScrollText({ text, callback });
    else this.showMessage(text, callback);
  }

  findPluginCommand(type) {
    if (this.customCommands[type]) return { execute: this.customCommands[type] };
    for (const p of this.plugins) {
      if (p.commands?.[type]) {
        this._currentPluginSettings = p._settings || {};
        return p.commands[type];
      }
    }
    return null;
  }

  evalExpr(expr) {
    if (!expr) return 0;
    if (typeof expr === 'number') return expr;
    const num = Number(expr);
    if (!isNaN(num)) return num;
    // rand(n)
    const randMatch = expr.match(/^rand\((\d+)\)$/);
    if (randMatch) return Math.floor(Math.random() * parseInt(randMatch[1]));
    const variableMatch = expr.match(/^var\[(.+?)\]$/);
    if (variableMatch) return Number(this.state.variables[variableMatch[1]] || 0);
    if (this.state.variables[expr] !== undefined) return this.state.variables[expr];
    return 0;
  }

  evalCondition(expr) {
    if (!expr) return true;
    const compare = (left, operator, right) => {
      const a = Number(left);
      const b = Number(right);
      if (operator === '==') return a === b;
      if (operator === '!=') return a !== b;
      if (operator === '>') return a > b;
      if (operator === '<') return a < b;
      if (operator === '>=') return a >= b;
      if (operator === '<=') return a <= b;
      return false;
    };
    const evaluate = raw => {
      const term = raw.trim().replace(/^\((.*)\)$/, '$1').trim();
      let match = term.match(/^switch\[(.+?)\]\s*(==|!=)\s*(ON|OFF)$/i);
      if (match) return Boolean(this.state.switches[match[1]]) === ((match[3].toUpperCase() === 'ON') !== (match[2] === '!='));
      match = term.match(/^var\[(.+?)\]\s*(==|!=|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/i);
      if (match) return compare(this.state.variables[match[1]] || 0, match[2], match[3]);
      match = term.match(/^item\[(.+?)\]\s*(==|!=|>=|<=|>|<)\s*(\d+)$/i);
      if (match) return compare(this.state.items[match[1]] || 0, match[2], match[3]);
      match = term.match(/^gold\s*(==|!=|>=|<=|>|<)\s*(\d+)$/i);
      if (match) return compare(this.state.gold, match[1], match[2]);
      match = term.match(/^switch\[(.+?)\]$/i);
      if (match) return Boolean(this.state.switches[match[1]]);
      return false;
    };
    return String(expr).split('||').some(group => group.split('&&').every(evaluate));
  }

  // ─── UI Actions ──────────────────────────────────────

  showMessage(text, callback) {
    this.messageVisible = true;
    if (!this.callbacks.onMessage) {
      this.messageVisible = false;
      callback?.();
      return;
    }
    this.callbacks.onMessage(text, () => {
      this.messageVisible = false;
      callback?.();
    });
  }

  showChoices(choices, callback) {
    this.choicesVisible = true;
    this.pendingChoice = callback;
    if (!this.callbacks.onChoices) {
      this.choicesVisible = false;
      this.pendingChoice = null;
      callback?.(0);
      return;
    }
    this.callbacks.onChoices(choices, (idx) => {
      this.choicesVisible = false;
      this.pendingChoice = null;
      callback?.(idx);
    });
  }

  selectChoice(idx) {
    if (this.pendingChoice) {
      const cb = this.pendingChoice;
      this.pendingChoice = null;
      this.choicesVisible = false;
      cb(idx);
    }
  }

  transferPlayer(mapId, x, y) {
    const map = (this.gameData.maps || []).find(item => item.id === mapId);
    if (!map) return false;
    this.state.currentMapId = mapId;
    this.state.playerX = Math.min(map.width - 1, Math.max(0, Number.parseInt(x, 10) || 0));
    this.state.playerY = Math.min(map.height - 1, Math.max(0, Number.parseInt(y, 10) || 0));
    this.state.erasedEvents = {};
    this.moving = false;
    this.waiting = false;
    this.fireHook('onMapEnter', this.getCurrentMap());
    this.notifyState();
    return true;
  }

  transferByName(mapName, x, y, next) {
    const map = (this.gameData.maps || []).find(m => m.name === mapName);
    if (map) {
      this.fireHook('onMapExit', this.getCurrentMap());
      this.transferPlayer(map.id, x, y);
    }
    next?.();
  }

  notifyState() {
    this.callbacks.onStateChange?.({ ...this.state });
  }

  createSaveData() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(this.state)),
    };
  }

  restoreSaveData(saveData) {
    if (!saveData?.state || typeof saveData.state !== 'object') return false;
    const map = (this.gameData.maps || []).find(item => item.id === saveData.state.currentMapId);
    if (!map) return false;
    const saved = JSON.parse(JSON.stringify(saveData.state));
    const objectFields = ['switches', 'variables', 'items', 'pictures', 'erasedEvents', 'selfSwitches', 'actorStates', 'extensionData'];
    for (const field of objectFields) {
      if (typeof saved[field] !== 'object' || saved[field] === null) saved[field] = Array.isArray(this.state[field]) ? [] : {};
    }
    if (!Array.isArray(saved.party)) saved.party = [];
    saved.playerX = Math.min(map.width - 1, Math.max(0, Number.parseInt(saved.playerX, 10) || 0));
    saved.playerY = Math.min(map.height - 1, Math.max(0, Number.parseInt(saved.playerY, 10) || 0));
    this.state = { ...this.state, ...saved };
    this.moving = false;
    this.waiting = false;
    this.commandQueue = null;
    this.notifyState();
    return true;
  }

  // ─── Audio ───────────────────────────────────────────

  playBGM(url) {
    if (!url) return;
    if (this.bgmAudio) { this.bgmAudio.pause(); }
    if (url.startsWith('http') || url.startsWith('/')) {
      this.bgmAudio = new Audio(url);
      this.bgmAudio.loop = true;
      this.bgmAudio.muted = this.muted;
      if (!this.muted) this.bgmAudio.play().catch(() => {});
    }
  }

  stopBGM() {
    if (this.bgmAudio) { this.bgmAudio.pause(); this.bgmAudio = null; }
  }

  playSE(url) {
    if (!url || this.muted) return;
    if (url.startsWith('http') || url.startsWith('/')) {
      const a = new Audio(url);
      a.play().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.muted;
      if (!this.muted) this.bgmAudio.play().catch(() => {});
    }
  }

  getImage(url) {
    if (!url) return null;
    if (!this.imageCache.has(url)) {
      const image = new Image();
      image.src = url;
      this.imageCache.set(url, image);
    }
    return this.imageCache.get(url);
  }

  drawTileLayer(context, map, layerId, startX, startY, endX, endY) {
    const grid = map.layers?.[layerId];
    const settings = map.layerSettings?.[layerId] || {};
    if (!grid || settings.visible === false) return;
    const tileSize = map.tileSize || 32;
    context.save();
    context.globalAlpha = Number.isFinite(settings.opacity) ? settings.opacity : 1;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        const color = typeof tile === 'string' ? tile : tile.color;
        if (color) { context.fillStyle = color; context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize); }
        if (tile?.image) {
          const image = this.getImage(tile.image);
          if (image?.complete && image.naturalWidth) context.drawImage(image, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    context.restore();
  }

  drawCollisionOverlay(context) {
    const map = this.getCurrentMap();
    if (!map) return;
    const tileSize = map.tileSize || 32;
    context.save();
    context.scale(this.scale, this.scale);
    context.translate(-this.cameraX, -this.cameraY);
    context.fillStyle = 'rgba(239,68,68,.28)';
    for (let y = 0; y < map.height; y += 1) for (let x = 0; x < map.width; x += 1) {
      if (map.collision?.[y]?.[x]) context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
    context.restore();
  }

  // ─── Render ──────────────────────────────────────────

  resize(width, height) {
    this.viewW = width;
    this.viewH = height;
    this.canvas.width = width;
    this.canvas.height = height;
    const map = this.getCurrentMap();
    const ts = map?.tileSize || 32;
    // Scale to show a reasonable viewport (about 15 tiles wide)
    this.scale = Math.min(width / (ts * 15), height / (ts * 11));
    this.scale = Math.max(0.5, Math.min(this.scale, 3));
  }

  render() {
    const ctx = this.ctx;
    const map = this.getCurrentMap();
    if (!map) return;

    const ts = map.tileSize || 32;
    ctx.save();
    ctx.fillStyle = map.bgColor || '#1a1a2e';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Apply scale and camera
    ctx.scale(this.scale, this.scale);

    let shakeX = 0, shakeY = 0;
    if (this.state.shake.intensity > 0) {
      shakeX = (Math.random() - 0.5) * this.state.shake.intensity;
      shakeY = (Math.random() - 0.5) * this.state.shake.intensity;
    }
    ctx.translate(-this.cameraX + shakeX, -this.cameraY + shakeY);

    // Background image
    if (map.bgImage) {
      const img = this.getImage(map.bgImage);
      if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, map.width * ts, map.height * ts);
    }

    // Fire plugin render-before
    this.fireHook('onRenderBefore', ctx);

    // Visible tile range
    const startX = Math.max(0, Math.floor(this.cameraX / ts));
    const startY = Math.max(0, Math.floor(this.cameraY / ts));
    const endX = Math.min(map.width, Math.ceil((this.cameraX + this.viewW / this.scale) / ts) + 1);
    const endY = Math.min(map.height, Math.ceil((this.cameraY + this.viewH / this.scale) / ts) + 1);

    const layerOrder = map.layerOrder || Object.keys(map.layers || {});
    const upperLayers = layerOrder.filter(layerId => layerId === 'upper' || map.layerSettings?.[layerId]?.aboveCharacters);
    for (const layerId of layerOrder) {
      if (!upperLayers.includes(layerId)) this.drawTileLayer(ctx, map, layerId, startX, startY, endX, endY);
    }

    // Events
    for (const source of map.events || []) {
      const event = this.getRuntimeEvent(source);
      if (!event || this.state.erasedEvents[event.id]) continue;
      const ex = event.x * ts;
      const ey = event.y * ts;
      if (ex + ts < this.cameraX || ex > this.cameraX + this.viewW / this.scale) continue;
      const image = this.getImage(event.graphic);
      if (image?.complete && image.naturalWidth) {
        ctx.drawImage(image, ex, ey, ts, ts);
      } else {
        ctx.fillStyle = 'rgba(251,191,36,0.3)';
        ctx.fillRect(ex + 2, ey + 2, ts - 4, ts - 4);
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ex + 2, ey + 2, ts - 4, ts - 4);
      }
    }

    // Player
    const px = this.moving
      ? (this.moveFrom.x + (this.moveTo.x - this.moveFrom.x) * this.moveProgress) * ts
      : this.state.playerX * ts;
    const py = this.moving
      ? (this.moveFrom.y + (this.moveTo.y - this.moveFrom.y) * this.moveProgress) * ts
      : this.state.playerY * ts;

    if (!this.state.transparent) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + ts / 2, py + ts - 2, ts / 3, ts / 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const playerImage = this.getImage(this.state.playerGraphic);
      if (playerImage?.complete && playerImage.naturalWidth) ctx.drawImage(playerImage, px, py, ts, ts);
      else {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(px + ts * .2, py + ts * .1, ts * .6, ts * .6);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts * .2, ts * .18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        const direction = DIR_VECTORS[this.state.playerDir];
        ctx.beginPath();
        ctx.arc(px + ts / 2 + direction.x * ts * .15, py + ts * .2 + direction.y * ts * .15, ts * .06, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const layerId of upperLayers) this.drawTileLayer(ctx, map, layerId, startX, startY, endX, endY);

    // Plugin render-after
    this.fireHook('onRenderAfter', ctx);

    ctx.restore();

    // Screen tint
    if (this.state.tint) {
      ctx.fillStyle = this.state.tint.color;
      ctx.globalAlpha = this.state.tint.opacity || 0.3;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      ctx.globalAlpha = 1;
    }
    for (const picture of this.state.pictures || []) {
      const image = this.getImage(picture.url);
      if (!image?.complete || !image.naturalWidth) continue;
      ctx.save();
      ctx.globalAlpha = picture.opacity ?? 1;
      ctx.drawImage(image, picture.x || 0, picture.y || 0, picture.width || image.naturalWidth, picture.height || image.naturalHeight);
      ctx.restore();
    }
    if (this.state.weather) {
      const { type, power } = this.state.weather;
      const count = Math.max(8, Math.round((power || 1) * 10));
      ctx.save();
      ctx.strokeStyle = type === 'storm' ? 'rgba(191,219,254,.7)' : 'rgba(186,230,253,.55)';
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = type === 'storm' ? 2 : 1;
      for (let index = 0; index < count; index += 1) {
        const x = (index * 97 + this.animationTime * (type === 'snow' ? 18 : 120)) % (this.viewW + 40) - 20;
        const y = (index * 53 + this.animationTime * (type === 'snow' ? 32 : 190)) % (this.viewH + 40) - 20;
        if (type === 'snow') { ctx.beginPath(); ctx.arc(x, y, 2 + index % 3, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14 + power); ctx.stroke(); }
      }
      ctx.restore();
    }
    if (this.state.flashScreen) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.state.flashScreen.duration * 2));
      ctx.fillStyle = this.state.flashScreen.color || '#fff';
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      ctx.restore();
    }
    if (this.state.fadeScreen?.type === 'out') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    this.fireHook('onRenderHud', ctx);
  }
}

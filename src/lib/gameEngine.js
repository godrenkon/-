/**
 * RPG edit - Game Runtime Engine
 * Renders maps, handles movement, processes events and commands.
 */

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const MOVE_SPEED = 4; // tiles per second

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
      const code = ip.code || ip.plugin_code;
      if (!code) continue;
      try {
        // Transform ESM `export default` to CommonJS
        let transformed = code
          .replace(/export\s+default\s+/g, 'module.exports = ')
          .replace(/export\s+(?:const|let|var)\s+(\w+)/g, 'const $1 = module.exports.$1 =')
          .replace(/export\s+function\s+(\w+)/g, 'const $1 = function $1; module.exports.$1 = $1');
        const fn = new Function('module', 'exports', transformed);
        const module = { exports: {} };
        fn(module, module.exports);
        const plugin = module.exports.default || module.exports;
        if (plugin && typeof plugin === 'object') {
          plugin._settings = ip.settings || {};
          this.plugins.push(plugin);
          this.firePluginHook(plugin, 'onLoad', [this.createPluginApi()]);
        }
      } catch (e) {
        console.warn('Plugin load error:', e);
      }
    }
  }

  createPluginApi() {
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
      setParty: (p) => { this.state.party = p; this.notifyState(); },
      addPartyMember: (m) => { this.state.party.push(m); this.notifyState(); },
      removePartyMember: (id) => { this.state.party = this.state.party.filter(m => m.id !== id); this.notifyState(); },

      // ─── Maps & Events ───────────────────
      getMap: () => this.getCurrentMap(),
      getMaps: () => this.gameData.maps || [],
      getMapById: (id) => (this.gameData.maps || []).find(m => m.id === id),
      getEvents: () => this.getCurrentMap()?.events || [],
      getEventById: (id) => (this.getCurrentMap()?.events || []).find(e => e.id === id),
      getEventData: () => this.currentEvent || {},

      // ─── Game Data ───────────────────────
      getData: (key) => this.gameData[key],
      getGameData: () => this.gameData,

      // ─── Player ──────────────────────────
      getPlayerPos: () => ({ x: this.state.playerX, y: this.state.playerY, dir: this.state.playerDir }),
      setPlayerDir: (dir) => { if (DIR_VECTORS[dir]) this.state.playerDir = dir; },
      isMoving: () => this.moving,
      transferPlayer: (mapId, x, y) => this.transferPlayer(mapId, x, y),

      // ─── Camera ─────────────────────────
      getCamera: () => ({ x: this.cameraX, y: this.cameraY }),
      setCamera: (x, y) => { this.cameraX = x; this.cameraY = y; },
      screenWidth: this.viewW,
      screenHeight: this.viewH,

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

  isPassable(x, y) {
    const map = this.getCurrentMap();
    if (!map) return false;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
    const obj = map.layers?.object?.[y]?.[x];
    if (obj) return false; // object layer = wall
    // Check events with priority "same" or "above"
    const evts = map.events || [];
    for (const ev of evts) {
      if (ev.x === x && ev.y === y && (ev.priority === 'same' || ev.priority === 'above')) {
        if (!this.state.erasedEvents[ev.id]) return false;
      }
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
      this.moveProgress += dt * MOVE_SPEED;
      if (this.moveProgress >= 1) {
        this.state.playerX = this.moveTo.x;
        this.state.playerY = this.moveTo.y;
        this.moving = false;
        this.moveProgress = 0;
        this.checkTouchEvents();
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

    // Auto/parallel events
    this.checkAutoEvents();

    // Shake
    if (this.state.shake.duration > 0) {
      this.state.shake.duration -= dt;
      if (this.state.shake.duration <= 0) this.state.shake.intensity = 0;
    }

    // Camera
    this.updateCamera();

    // Plugin update
    this.fireHook('onUpdate', dt);
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
    for (const ev of map.events || []) {
      if (this.state.erasedEvents[ev.id]) continue;
      if (ev.trigger === 'touch' && ev.x === this.state.playerX && ev.y === this.state.playerY) {
        this.runEvent(ev);
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
    for (const ev of map.events || []) {
      if (this.state.erasedEvents[ev.id]) continue;
      if (ev.trigger === 'action' && ev.x === fx && ev.y === fy) {
        this.runEvent(ev);
        return;
      }
    }
  }

  checkAutoEvents() {
    const map = this.getCurrentMap();
    if (!map || this.waiting) return;
    for (const ev of map.events || []) {
      if (this.state.erasedEvents[ev.id]) continue;
      if (ev.trigger === 'auto' || ev.trigger === 'parallel') {
        // Check conditions (simplified: always run)
        if (ev.trigger === 'auto' && !this.waiting) {
          this.runEvent(ev);
          return;
        }
      }
    }
  }

  runEvent(event) {
    if (this.waiting) return;
    this.currentEvent = event;
    this.fireHook('onEventTrigger', event);
    const commands = event.commands || [];
    if (commands.length === 0) return;
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
        this.showChoices(p.choices || [], (idx) => {
          // Jump to matching choice branch (simplified: just continue)
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
        if (this.evalCondition(p.expression)) { next(); } else { next(); }
        break;
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
      case 'change_graphic': if (this.currentEvent) this.currentEvent.graphic = p.value; next(); break;
      // ─── Screen / Visual ────────────────────────────
      case 'fade_screen': this.state.fadeScreen = { type: p.fadeType || 'out' }; this.waitFrames = { remaining: 30, cb: next }; break;
      case 'flash_screen': this.state.flashScreen = { color: p.color || '#ffffff', duration: (p.duration || 30) / 60 }; next(); break;
      case 'change_window_color': this.state.windowColor = p.color || null; next(); break;
      case 'show_animation': this.waitFrames = { remaining: 30, cb: next }; break;
      case 'show_balloon': this.waitFrames = { remaining: 20, cb: next }; break;
      // ─── Map / Movement ─────────────────────────────
      case 'scroll_map': this.state.scrollMap = { x: p.x || 0, y: p.y || 0, speed: p.speed || 4 }; next(); break;
      case 'set_event_location': this.setEventLocation(p.eventName, p.x, p.y); next(); break;
      case 'change_tileset': { const m = this.getCurrentMap(); if (m) m.tileset = p.tilesetName; next(); } break;
      case 'change_player_graphic': this.state.playerGraphic = p.graphic || ''; next(); break;
      case 'set_move_speed': this.state.moveSpeed = p.speed || 4; next(); break;
      case 'transparent': this.state.transparent = p.value !== 'OFF'; next(); break;
      case 'gather_followers': next(); break;
      case 'get_location_info': { const m2 = this.getCurrentMap(); if (m2) { const xi = parseInt(p.x)||0, yi=parseInt(p.y)||0; this.state.variables[p.varName||'loc'] = m2.layers?.object?.[yi]?.[xi] || 0; this.notifyState(); } next(); } break;
      // ─── Game Flow ──────────────────────────────────
      case 'open_shop': this.callbacks.onOpenShop?.(p.shopId); next(); break;
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
  changeActorStat(actorId, stat, operation, amount) {
    const actors = this.gameData.actors || [];
    const actor = actors.find(a => a.id === actorId || a.name === actorId);
    if (!actor) return;
    const val = parseInt(amount) || 0;
    if (operation === '-') actor[stat] = Math.max(0, (actor[stat] || 0) - val);
    else if (operation === '=') actor[stat] = val;
    else actor[stat] = (actor[stat] || 0) + val;
    this.notifyState();
  }
  recoverAll() {
    const actors = this.gameData.actors || [];
    for (const a of actors) { if (this.state.party.includes(a.id)) { a.hp = a.maxHp || a.hp; a.mp = a.maxMp || a.mp; } }
    this.notifyState();
  }
  changeEquipment(actorId, slot, itemId) {
    const actors = this.gameData.actors || [];
    const actor = actors.find(a => a.id === actorId || a.name === actorId);
    if (actor) { actor.equipment = actor.equipment || {}; actor.equipment[slot] = itemId; }
    this.notifyState();
  }
  changeActorField(actorId, field, value) {
    const actors = this.gameData.actors || [];
    const actor = actors.find(a => a.id === actorId || a.name === actorId);
    if (actor) actor[field] = value;
    this.notifyState();
  }
  setEventLocation(eventName, x, y) {
    const map = this.getCurrentMap();
    if (!map) return;
    const ev = (map.events || []).find(e => e.name === eventName || e.id === eventName);
    if (ev) { ev.x = parseInt(x)||0; ev.y = parseInt(y)||0; }
  }
  showInputNumber(varName, digits, callback) {
    this.callbacks.onInputNumber?.({ varName, digits, callback });
  }
  showScrollText(text, callback) {
    this.callbacks.onScrollText?.({ text, callback });
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
    // variable reference
    if (this.state.variables[expr] !== undefined) return this.state.variables[expr];
    return 0;
  }

  evalCondition(expr) {
    if (!expr) return true;
    try {
      const replaced = expr
        .replace(/switch\[(.+?)\]/g, (_, n) => `this.state.switches['${n}'] === true`)
        .replace(/var\[(.+?)\]/g, (_, n) => `(this.state.variables['${n}']||0)`)
        .replace(/==\s*ON/g, '=== true')
        .replace(/==\s*OFF/g, '=== false');
      // eslint-disable-next-line no-new-func
      return new Function('state', `return (${replaced});`)(this.state);
    } catch {
      return false;
    }
  }

  // ─── UI Actions ──────────────────────────────────────

  showMessage(text, callback) {
    this.messageVisible = true;
    this.callbacks.onMessage?.(text, () => {
      this.messageVisible = false;
      callback?.();
    });
  }

  showChoices(choices, callback) {
    this.choicesVisible = true;
    this.pendingChoice = callback;
    this.callbacks.onChoices?.(choices, (idx) => {
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
    this.state.currentMapId = mapId;
    this.state.playerX = x;
    this.state.playerY = y;
    this.state.erasedEvents = {};
    this.moving = false;
    this.waiting = false;
    this.fireHook('onMapEnter', this.getCurrentMap());
    this.notifyState();
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

  // ─── Audio ───────────────────────────────────────────

  playBGM(url) {
    if (!url) return;
    if (this.bgmAudio) { this.bgmAudio.pause(); }
    if (url.startsWith('http') || url.startsWith('/')) {
      this.bgmAudio = new Audio(url);
      this.bgmAudio.loop = true;
      this.bgmAudio.play().catch(() => {});
    }
  }

  stopBGM() {
    if (this.bgmAudio) { this.bgmAudio.pause(); this.bgmAudio = null; }
  }

  playSE(url) {
    if (!url) return;
    if (url.startsWith('http') || url.startsWith('/')) {
      const a = new Audio(url);
      a.play().catch(() => {});
    }
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
      if (!this._bgImageCache) this._bgImageCache = {};
      let img = this._bgImageCache[map.bgImage];
      if (!img) { img = new Image(); img.src = map.bgImage; this._bgImageCache[map.bgImage] = img; }
      if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, map.width * ts, map.height * ts);
    }

    // Fire plugin render-before
    this.fireHook('onRenderBefore', ctx);

    // Visible tile range
    const startX = Math.max(0, Math.floor(this.cameraX / ts));
    const startY = Math.max(0, Math.floor(this.cameraY / ts));
    const endX = Math.min(map.width, Math.ceil((this.cameraX + this.viewW / this.scale) / ts) + 1);
    const endY = Math.min(map.height, Math.ceil((this.cameraY + this.viewH / this.scale) / ts) + 1);

    // Ground layer
    if (map.layers?.ground) {
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const tile = map.layers.ground[y]?.[x];
          if (tile) {
            ctx.fillStyle = tile;
            ctx.fillRect(x * ts, y * ts, ts, ts);
          }
        }
      }
    }

    // Object layer
    if (map.layers?.object) {
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const tile = map.layers.object[y]?.[x];
          if (tile) {
            ctx.fillStyle = tile;
            ctx.fillRect(x * ts, y * ts, ts, ts);
          }
        }
      }
    }

    // Events
    for (const ev of map.events || []) {
      if (this.state.erasedEvents[ev.id]) continue;
      const ex = ev.x * ts;
      const ey = ev.y * ts;
      if (ex + ts < this.cameraX || ex > this.cameraX + this.viewW / this.scale) continue;
      if (ev.graphic) {
        // Would load image; for now draw colored block
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(ex + 4, ey + 4, ts - 8, ts - 8);
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

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + ts / 2, py + ts - 2, ts / 3, ts / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(px + ts * 0.2, py + ts * 0.1, ts * 0.6, ts * 0.6);
    // Player head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px + ts / 2, py + ts * 0.2, ts * 0.18, 0, Math.PI * 2);
    ctx.fill();
    // Direction indicator
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const dv = DIR_VECTORS[this.state.playerDir];
    ctx.beginPath();
    ctx.arc(px + ts / 2 + dv.x * ts * 0.15, py + ts * 0.2 + dv.y * ts * 0.15, ts * 0.06, 0, Math.PI * 2);
    ctx.fill();

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
  }
}
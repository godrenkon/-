// RPG edit - Plugin Developer Resources
// Downloadable content strings for the Developer Resources page

export const PLUGIN_API_TYPES = `// RPG edit Plugin API - Type Definitions
// ============================================
// Version: 1.0.0
// このファイルはプラグイン開発の型参照用です（実行には不要）

/** プラグイン定義オブジェクト */
export interface RPGPlugin {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  category?: string;
  tags?: string[];

  /** ゲームごとに設定可能なパラメータ */
  settings?: Record<string, PluginSetting>;

  // ─── ライフサイクルフック ───
  onLoad?(api: PluginAPI): void;
  onUnload?(): void;
  onGameStart?(api: PluginAPI): void;
  onGameEnd?(api: PluginAPI): void;
  onMapEnter?(api: PluginAPI, map: GameMap): void;
  onMapExit?(api: PluginAPI, map: GameMap): void;
  onBattleStart?(api: PluginAPI, troop: Troop): void;
  onBattleEnd?(api: PluginAPI, result: BattleResult): void;

  // ─── フレームフック ───
  onUpdate?(api: PluginAPI, dt: number): void;
  onRenderBefore?(api: PluginAPI, ctx: CanvasRenderingContext2D): void;
  onRenderAfter?(api: PluginAPI, ctx: CanvasRenderingContext2D): void;

  // ─── イベントフック ───
  onEventTrigger?(api: PluginAPI, event: GameEvent): void;
  onEventCommand?(api: PluginAPI, command: EventCommand): void;

  // ─── カスタムコマンド・モーション ───
  commands?: Record<string, CustomCommand>;
  motion?: Record<string, MotionHandler>;
}

export interface PluginSetting {
  label: string;
  type: 'select' | 'number' | 'text' | 'color';
  options?: string[];
  default: string | number;
}

export interface CustomCommand {
  label: string;
  icon?: string;
  color?: string;
  params: CommandParam[];
  execute: (api: PluginAPI, params: Record<string, any>) => void | Promise<void>;
}

export interface CommandParam {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'color';
  options?: string[];
  default: any;
}

export interface MotionHandler {
  (entity: { x: number; y: number; dir: string; startX: number; startY: number }, api: PluginAPI, dt: number): void;
}

// ─── ゲーム状態 ───
export interface GameState {
  currentMapId: string | null;
  playerX: number;
  playerY: number;
  playerDir: 'up' | 'down' | 'left' | 'right';
  switches: Record<string, boolean>;
  variables: Record<string, number>;
  items: Record<string, number>;
  gold: number;
  party: string[];
  tint: { color: string; opacity: number } | null;
  shake: { intensity: number; duration: number };
  weather: any;
  bgm: string | null;
  erasedEvents: Record<string, boolean>;
  selfSwitches: Record<string, Record<string, boolean>>;
  encounterRate: number;
  saveAccess: boolean;
  menuAccess: boolean;
  playerGraphic: string;
  moveSpeed: number;
  transparent: boolean;
  windowColor: string | null;
  flashScreen: { color: string; duration: number } | null;
  fadeScreen: { type: string } | null;
  formation: boolean;
}

// ─── プラグインAPI ───
export interface PluginAPI {
  state: GameState;

  // スイッチ・変数
  getSwitch(name: string): boolean;
  setSwitch(name: string, value: boolean): void;
  getVariable(name: string): number;
  setVariable(name: string, value: number): void;

  // ゴールド・アイテム
  getGold(): number;
  addGold(amount: number): void;
  getItems(): Record<string, number>;
  getItem(name: string): number;
  addItem(name: string, count?: number): void;
  removeItem(name: string, count?: number): void;
  hasItem(name: string): boolean;

  // パーティ
  getParty(): string[];
  setParty(party: string[]): void;
  addPartyMember(member: string): void;
  removePartyMember(id: string): void;

  // マップ・イベント
  getMap(): GameMap;
  getMaps(): GameMap[];
  getMapById(id: string): GameMap | undefined;
  getEvents(): GameEvent[];
  getEventById(id: string): GameEvent | undefined;
  getEventData(): GameEvent;

  // ゲームデータ
  getData(key: string): any;
  getGameData(): GameData;

  // プレイヤー
  getPlayerPos(): { x: number; y: number; dir: string };
  setPlayerDir(dir: string): void;
  isMoving(): boolean;
  transferPlayer(mapId: string, x: number, y: number): void;

  // カメラ
  getCamera(): { x: number; y: number };
  setCamera(x: number, y: number): void;
  screenWidth: number;
  screenHeight: number;

  // UI
  showMessage(text: string): Promise<void>;
  showChoices(choices: string[]): Promise<number>;
  wait(frames: number): Promise<void>;

  // オーディオ
  playBGM(url: string): void;
  stopBGM(): void;
  playSE(url: string): void;

  // 画面効果
  tintScreen(color: string, opacity?: number): void;
  clearTint(): void;
  shakeScreen(duration: number, intensity?: number): void;

  // カスタムコマンド・フック
  registerCommand(type: string, handler: (api: PluginAPI, params: any) => void | Promise<void>): void;
  onCustom(name: string, handler: (...args: any[]) => void): void;
  fireCustom(name: string, ...args: any[]): void;

  // プラグイン間通信
  getPlugin(name: string): RPGPlugin | undefined;
  getPlugins(): { name: string; version: string }[];

  // ユーティリティ
  random(min: number, max: number): number;
  randomFloat(min: number, max: number): number;
  clamp(v: number, min: number, max: number): number;
  lerp(a: number, b: number, t: number): number;
  distance(x1: number, y1: number, x2: number, y2: number): number;

  // 設定
  getSetting(key: string): any;
  settings: Record<string, any>;
}

// ─── データ構造 ───
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tileset?: string;
  layers: {
    ground?: string[][];
    object?: number[][];
    [key: string]: any;
  };
  events: GameEvent[];
  bgm?: string;
  encounterRate?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  x: number;
  y: number;
  graphic?: string;
  trigger: 'action' | 'touch' | 'auto' | 'parallel';
  moveType?: 'fixed' | 'random' | 'approach';
  priority?: 'same' | 'below' | 'above';
  commands: EventCommand[];
}

export interface EventCommand {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface GameData {
  maps: GameMap[];
  actors: Actor[];
  classes: any[];
  skills: Skill[];
  items: Item[];
  weapons: Weapon[];
  armors: Armor[];
  enemies: Enemy[];
  troops: Troop[];
  states: State[];
  animations: any[];
  tilesets: any[];
  commonEvents: any[];
  shops: Shop[];
  quests: Quest[];
  vehicles: Vehicle[];
  switches: any[];
  variables: any[];
  system: SystemSettings;
  plugins: InstalledPlugin[];
}

export interface Actor {
  id: string;
  name: string;
  description: string;
  graphic: string;
  faceGraphic: string;
  classId: string;
  level: number;
  initialLevel: number;
  maxLevel: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  agility: number;
  luck: number;
  equipment: { weapon: string; armor: string };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;
  hitRate: number;
  element: string;
  target: string;
  animation: string;
  formula: string;
  type: string;
  scope: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  effects: string;
  hpRecover: number;
  mpRecover: number;
  target: string;
}

export interface Weapon {
  id: string;
  name: string;
  price: number;
  attack: number;
  element: string;
}

export interface Armor {
  id: string;
  name: string;
  price: number;
  defense: number;
  slot: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  dropItem: string;
  dropRate: number;
  graphic: string;
  actions: any[];
}

export interface Troop {
  id: string;
  name: string;
  members: any[];
  battleEvents: any[];
}

export interface State {
  id: string;
  name: string;
  priority: number;
  duration: number;
  removeAtBattleEnd: boolean;
  effects: string;
  restriction: string;
  message: string;
}

export interface Shop {
  id: string;
  name: string;
  items: { itemId: string; price: number }[];
  buyRate: number;
  sellRate: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: { text: string; type: string }[];
  rewards: { type: string; name: string; amount: number }[];
  giver: string;
  condition: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  graphic: string;
  speed: number;
  startMap: string;
  bgm: string;
}

export interface SystemSettings {
  battleSystem: string;
  currency: string;
  startMapId: string;
  startX: number;
  startY: number;
  startParty: string[];
  encounterRate: number;
  saveAccess: boolean;
  menuAccess: boolean;
  formation: boolean;
  autoSave: boolean;
  maxParty: number;
  titleGraphic: string;
  gameOverGraphic: string;
  windowColor: string;
  textSpeed: string;
  msgPosition: string;
  battleBgm: string;
  victoryMe: string;
  defeatMe: string;
  startBgm: string;
  gameOverBgm: string;
  battleBackground: string;
}

export interface InstalledPlugin {
  id: string;
  enabled: boolean;
  code: string;
  settings: Record<string, any>;
}

export interface BattleResult {
  win: boolean;
  expGained: number;
  goldGained: number;
  drops: string[];
}
`;

export const PLUGIN_TEMPLATE = `/**
 * RPG edit プラグインテンプレート
 * このファイルをコピーして開発を始めてください
 */
export default {
  // ─── メタデータ ───────────────────────
  name: "プラグイン名",
  version: "1.0.0",
  author: "作者名",
  description: "プラグインの説明文",
  category: "system",
  tags: ["template"],

  // ─── 設定スキーマ ────────────────────
  settings: {
    // 例: 数値設定
    exampleNumber: {
      label: "サンプル数値",
      type: "number",
      default: 10,
    },
    // 例: 選択肢設定
    exampleSelect: {
      label: "サンプル選択肢",
      type: "select",
      options: ["オプションA", "オプションB", "オプションC"],
      default: "オプションA",
    },
    // 例: テキスト設定
    exampleText: {
      label: "サンプルテキスト",
      type: "text",
      default: "こんにちは",
    },
    // 例: 色設定
    exampleColor: {
      label: "サンプル色",
      type: "color",
      default: "#8b5cf6",
    },
  },

  // ─── ライフサイクルフック ──────────────
  onLoad(api) {
    console.log("[プラグイン名] 読み込み完了");
  },

  onUnload() {
    console.log("[プラグイン名] アンロード");
  },

  onGameStart(api) {
    console.log("[プラグイン名] ゲーム開始");
    // 設定値の取得例
    const num = api.getSetting('exampleNumber');
    console.log("設定値:", num);
  },

  onGameEnd(api) {
    console.log("[プラグイン名] ゲーム終了");
  },

  onMapEnter(api, map) {
    console.log("[プラグイン名] マップ入場:", map.name);
  },

  onMapExit(api, map) {
    console.log("[プラグイン名] マップ退場:", map.name);
  },

  onBattleStart(api, troop) {
    console.log("[プラグイン名] 戦闘開始:", troop.name);
  },

  onBattleEnd(api, result) {
    console.log("[プラグイン名] 戦闘終了:", result.win ? "勝利" : "敗北");
  },

  // ─── フレームフック ────────────────────
  onUpdate(api, dt) {
    // 毎フレーム呼ばれる（dtは経過秒数）
  },

  onRenderBefore(api, ctx) {
    // マップ描画前に呼ばれる
  },

  onRenderAfter(api, ctx) {
    // マップ描画後に呼ばれる
    // HPバーなどを描画するのに便利
  },

  // ─── イベントフック ────────────────────
  onEventTrigger(api, event) {
    // イベント実行時
  },

  onEventCommand(api, command) {
    // コマンド実行時
  },

  // ─── カスタムコマンド ──────────────────
  commands: {
    myCommand: {
      label: "マイコマンド",
      icon: "star",
      color: "#8b5cf6",
      params: [
        { name: "text", label: "テキスト", type: "text", default: "Hello!" },
        { name: "count", label: "回数", type: "number", default: 1 },
      ],
      execute: async (api, params) => {
        for (let i = 0; i < params.count; i++) {
          await api.showMessage(params.text);
        }
      },
    },
  },

  // ─── カスタムモーション ────────────────
  motion: {
    // イベントエディタの「自律移動」で選択可能
    zigzag: (entity, api, dt) => {
      // ジグザグ移動のロジック
    },
  },
};
`;

export const EXAMPLE_DAMAGE_FLOOR = `/**
 * ダメージ床プラグイン
 * 特定色のタイルに乗るとHPが減る
 */
export default {
  name: "ダメージ床",
  version: "1.0.0",
  author: "RPG edit",
  description: "特定色のタイルに乗るとダメージを受けるプラグイン",
  category: "gameplay",
  tags: ["damage", "map", "survival"],

  settings: {
    damageColor: {
      label: "ダメージタイルの色",
      type: "color",
      default: "#dc2626",
    },
    damageAmount: {
      label: "ダメージ量",
      type: "number",
      default: 10,
    },
    damageInterval: {
      label: "ダメージ間隔（秒）",
      type: "number",
      default: 1,
    },
    showFlash: {
      label: "フラッシュ表示",
      type: "select",
      options: ["する", "しない"],
      default: "する",
    },
  },

  onGameStart(api) {
    this._hp = 100;
    this._maxHp = 100;
    this._damageTimer = 0;
  },

  onUpdate(api, dt) {
    const map = api.getMap();
    if (!map) return;
    const state = api.state;

    // プレイヤーがいるタイルの色をチェック
    const tile = map.layers?.ground?.[state.playerY]?.[state.playerX];
    if (tile === this._settings.damageColor) {
      this._damageTimer += dt;
      if (this._damageTimer >= this._settings.damageInterval) {
        this._hp = Math.max(0, this._hp - this._settings.damageAmount);
        this._damageTimer = 0;
        api.playSE('se_damage');
        if (this._settings.showFlash === "する") {
          api.shakeScreen(10, 3);
        }
        if (this._hp <= 0) {
          api.showMessage("HPがゼロになった...");
        }
      }
    } else {
      this._damageTimer = 0;
    }
  },

  onRenderAfter(api, ctx) {
    // HPバーを画面上部に描画
    const w = api.screenWidth;
    const barW = 200;
    const barH = 20;
    const x = 10;
    const y = 10;

    // 背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);

    // HPバー
    const ratio = this._hp / this._maxHp;
    ctx.fillStyle = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#eab308' : '#dc2626';
    ctx.fillRect(x, y, barW * ratio, barH);

    // テキスト
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('HP', x + 5, y + 15);
    ctx.textAlign = 'right';
    ctx.fillText(this._hp + '/' + this._maxHp, x + barW - 5, y + 15);
    ctx.textAlign = 'left';
  },
};
`;

export const EXAMPLE_QUEST_SYSTEM = `/**
 * クエストシステムプラグイン
 * クエストの受注・進行・完了を管理する
 */
export default {
  name: "Quest System",
  version: "1.0.0",
  author: "RPG edit",
  description: "クエスト管理システム。データベースのquests配列を使用",
  category: "system",
  tags: ["quest", "ui", "system"],

  settings: {
    showNotification: {
      label: "通知表示",
      type: "select",
      options: ["する", "しない"],
      default: "する",
    },
    notificationDuration: {
      label: "通知時間（フレーム）",
      type: "number",
      default: 120,
    },
  },

  onLoad(api) {
    // カスタムコマンドを動的登録
    api.registerCommand('startQuest', (api, params) => {
      this.startQuest(api, params.questId);
    });

    api.registerCommand('completeQuest', (api, params) => {
      this.completeQuest(api, params.questId);
    });

    api.registerCommand('showQuestLog', (api, params) => {
      this.showQuestLog(api);
    });

    // カスタムフック
    api.onCustom('questCompleted', (questId) => {
      const quests = api.getGameData().quests || [];
      const quest = quests.find(q => q.id === questId);
      if (quest && this._settings.showNotification === "する") {
        api.showMessage('クエスト完了: ' + quest.name);
        // 報酬を付与
        for (const reward of quest.rewards || []) {
          if (reward.type === 'gold') api.addGold(reward.amount);
          else if (reward.type === 'item') api.addItem(reward.name, reward.amount);
          else if (reward.type === 'exp') {
            const actors = api.getData('actors');
            for (const a of actors) {
              if (api.getParty().includes(a.id)) {
                a.exp = (a.exp || 0) + reward.amount;
              }
            }
          }
        }
      }
    });
  },

  startQuest(api, questId) {
    const quests = api.getGameData().quests || [];
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // クエスト開始スイッチをON
    api.setSwitch('quest_' + questId + '_active', true);
    api.setSwitch('quest_' + questId + '_started', true);

    if (this._settings.showNotification === "する") {
      api.showMessage('クエスト受注: ' + quest.name);
    }
  },

  completeQuest(api, questId) {
    if (!api.getSwitch('quest_' + questId + '_active')) return;

    api.setSwitch('quest_' + questId + '_active', false);
    api.setSwitch('quest_' + questId + '_done', true);

    // カスタムフックを発火（報酬付与はフック内で処理）
    api.fireCustom('questCompleted', questId);
  },

  async showQuestLog(api) {
    const quests = api.getGameData().quests || [];
    const activeQuests = quests.filter(q => api.getSwitch('quest_' + q.id + '_active'));

    if (activeQuests.length === 0) {
      await api.showMessage('受注中のクエストはありません');
      return;
    }

    for (const q of activeQuests) {
      await api.showMessage('【' + q.name + '】\\n' + q.description);
    }
  },

  commands: {
    startQuest: {
      label: "クエスト開始",
      icon: "scroll",
      color: "#f59e0b",
      params: [
        { name: "questId", label: "クエストID", type: "text", default: "" },
      ],
      execute: async (api, params) => {
        const quests = api.getGameData().quests || [];
        const quest = quests.find(q => q.id === params.questId || q.name === params.questId);
        if (quest) {
          api.setSwitch('quest_' + quest.id + '_active', true);
          await api.showMessage('クエスト受注: ' + quest.name);
        }
      },
    },

    completeQuestCmd: {
      label: "クエスト完了",
      icon: "check",
      color: "#22c55e",
      params: [
        { name: "questId", label: "クエストID", type: "text", default: "" },
      ],
      execute: async (api, params) => {
        api.setSwitch('quest_' + params.questId + '_active', false);
        api.setSwitch('quest_' + params.questId + '_done', true);
        api.fireCustom('questCompleted', params.questId);
      },
    },

    showQuestLog: {
      label: "クエスト一覧表示",
      icon: "list",
      params: [],
      execute: async (api, params) => {
        const quests = api.getGameData().quests || [];
        const active = quests.filter(q => api.getSwitch('quest_' + q.id + '_active'));
        if (active.length === 0) {
          await api.showMessage('受注中のクエストはありません');
        } else {
          for (const q of active) {
            await api.showMessage('【' + q.name + '】\\n' + q.description);
          }
        }
      },
    },
  },
};
`;

export const EXAMPLE_CUSTOM_UI = `/**
 * カスタムUI プラグイン
 * 画面上にHP/MPバーとミニマップを表示
 */
export default {
  name: "Custom UI",
  version: "1.0.0",
  author: "RPG edit",
  description: "HUDにHP/MPバーとミニマップを追加",
  category: "ui",
  tags: ["ui", "hud", "minimap"],

  settings: {
    barColor: {
      label: "バーの色",
      type: "color",
      default: "#22c55e",
    },
    showMinimap: {
      label: "ミニマップ表示",
      type: "select",
      options: ["する", "しない"],
      default: "する",
    },
    minimapSize: {
      label: "ミニマップサイズ",
      type: "number",
      default: 80,
    },
    minimapPosition: {
      label: "ミニマップ位置",
      type: "select",
      options: ["右上", "右下", "左上", "左下"],
      default: "右上",
    },
  },

  onGameStart(api) {
    this._hp = 100;
    this._maxHp = 100;
    this._mp = 50;
    this._maxMp = 50;
  },

  onRenderAfter(api, ctx) {
    const w = api.screenWidth;
    const h = api.screenHeight;

    // ─── HP/MPバー ───
    this.drawBar(ctx, 10, h - 50, 150, 12, this._hp, this._maxHp, this._settings.barColor, 'HP');
    this.drawBar(ctx, 10, h - 32, 150, 12, this._mp, this._maxMp, '#3b82f6', 'MP');

    // ─── ミニマップ ───
    if (this._settings.showMinimap === "する") {
      this.drawMinimap(api, ctx, w, h);
    }
  },

  drawBar(ctx, x, y, w, h, value, max, color, label) {
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    // バー
    const ratio = Math.max(0, Math.min(1, value / max));
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);

    // 枠
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // ラベル
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(label, x + 3, y + h - 2);
    ctx.textAlign = 'right';
    ctx.fillText(value + '/' + max, x + w - 3, y + h - 2);
    ctx.textAlign = 'left';
  },

  drawMinimap(api, ctx, screenW, screenH) {
    const map = api.getMap();
    if (!map) return;

    const size = this._settings.minimapSize;
    const pos = this._settings.minimapPosition;
    let mx, my;
    if (pos === '右上') { mx = screenW - size - 10; my = 10; }
    else if (pos === '右下') { mx = screenW - size - 10; my = screenH - size - 10; }
    else if (pos === '左上') { mx = 10; my = 10; }
    else { mx = 10; my = screenH - size - 10; }

    const scale = size / Math.max(map.width, map.height);
    const cellSize = Math.max(1, scale);

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mx - 2, my - 2, size + 4, size + 4);

    // マップ描画（簡易）
    ctx.fillStyle = '#333333';
    ctx.fillRect(mx, my, map.width * cellSize, map.height * cellSize);

    // イベントをドットで表示
    ctx.fillStyle = '#f59e0b';
    for (const ev of map.events || []) {
      ctx.fillRect(mx + ev.x * cellSize, my + ev.y * cellSize, cellSize, cellSize);
    }

    // プレイヤー位置
    const state = api.state;
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(mx + state.playerX * cellSize - 1, my + state.playerY * cellSize - 1, cellSize + 2, cellSize + 2);

    // 枠
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, size, size);
  },

  commands: {
    setHp: {
      label: "HP設定",
      icon: "heart",
      params: [
        { name: "value", label: "HP値", type: "number", default: 100 },
      ],
      execute: async (api, params) => {
        this._hp = Math.max(0, Math.min(this._maxHp, params.value));
      },
    },
    setMp: {
      label: "MP設定",
      icon: "sparkles",
      params: [
        { name: "value", label: "MP値", type: "number", default: 50 },
      ],
      execute: async (api, params) => {
        this._mp = Math.max(0, Math.min(this._maxMp, params.value));
      },
    },
  },
};
`;

export const ENGINE_SOURCE_REFERENCE = `// RPG edit - Game Engine Source Reference
// =============================================
// このファイルはプラグイン開発者がエンジンの内部構造を理解するための参照用です
// 実際のソースコードから主要部分を抽出しています

// ─── ゲーム状態の初期値 ─────────────────
state = {
  currentMapId: null,
  playerX: 0, playerY: 0,
  playerDir: 'down',
  switches: {},        // グローバルスイッチ
  variables: {},       // グローバル変数
  items: {},           // {アイテム名: 数量}
  gold: 0,
  party: [],           // アクターIDの配列
  tint: null,          // {color, opacity}
  shake: {intensity:0, duration:0},
  weather: null,
  bgm: null,
  erasedEvents: {},    // 消去されたイベントID
  selfSwitches: {},    // {イベントID: {A:true, B:false, ...}}
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

// ─── プラグイン読み込み ─────────────────
loadPlugins() {
  // インストール済みプラグインのコードを評価
  // ESMの export default を CommonJS に変換して実行
  // プラグインオブジェクトを this.plugins に格納
  // 各プラグインの onLoad フックを呼ぶ
}

// ─── プラグインAPI（createPluginApi） ──
// プラグインに渡される api オブジェクトの全メソッド:
//
// 【状態】
//   api.state                    - ゲーム状態オブジェクト
//   api.getSwitch(name)          - スイッチ取得
//   api.setSwitch(name, value)   - スイッチ設定
//   api.getVariable(name)        - 変数取得
//   api.setVariable(name, value) - 変数設定
//
// 【ゴールド・アイテム】
//   api.getGold()                - 所持金取得
//   api.addGold(amount)          - 所持金増減
//   api.getItems()               - 全アイテム取得
//   api.getItem(name)            - アイテム数量取得
//   api.addItem(name, count)     - アイテム追加
//   api.removeItem(name, count)  - アイテム削除
//   api.hasItem(name)            - アイテム所持判定
//
// 【パーティ】
//   api.getParty()               - パーティ配列取得
//   api.setParty(party)          - パーティ設定
//   api.addPartyMember(member)   - メンバー追加
//   api.removePartyMember(id)    - メンバー削除
//
// 【マップ・イベント】
//   api.getMap()                 - 現在のマップ
//   api.getMaps()                - 全マップ配列
//   api.getMapById(id)           - IDでマップ取得
//   api.getEvents()              - 現在マップのイベント一覧
//   api.getEventById(id)         - IDでイベント取得
//   api.getEventData()           - 実行中のイベントデータ
//
// 【ゲームデータ】
//   api.getData(key)              - actors, items, shops等の配列を取得
//   api.getGameData()             - ゲームデータ全体
//
// 【プレイヤー】
//   api.getPlayerPos()            - {x, y, dir}を取得
//   api.setPlayerDir(dir)         - 向きを設定
//   api.isMoving()                - 移動中か判定
//   api.transferPlayer(mapId, x, y) - プレイヤー転送
//
// 【カメラ】
//   api.getCamera()               - {x, y}を取得
//   api.setCamera(x, y)           - カメラ位置設定
//   api.screenWidth               - 画面幅
//   api.screenHeight              - 画面高さ
//
// 【UI】
//   api.showMessage(text)         - メッセージ表示（await可能）
//   api.showChoices(choices)      - 選択肢表示（indexをawait）
//   api.wait(frames)              - フレーム数待機（await可能）
//
// 【オーディオ】
//   api.playBGM(url)              - BGM再生
//   api.stopBGM()                 - BGM停止
//   api.playSE(url)               - 効果音再生
//
// 【画面効果】
//   api.tintScreen(color, opacity) - 画面色調変更
//   api.clearTint()                - 色調クリア
//   api.shakeScreen(duration, intensity) - 画面シェイク
//
// 【カスタムコマンド・フック】
//   api.registerCommand(type, handler) - コマンド動的登録
//   api.onCustom(name, handler)        - カスタムフック登録
//   api.fireCustom(name, ...args)      - カスタムフック発火
//
// 【プラグイン間通信】
//   api.getPlugin(name)           - 他プラグインインスタンス取得
//   api.getPlugins()              - 全プラグインの名前・バージョン
//
// 【ユーティリティ】
//   api.random(min, max)          - 整数乱数
//   api.randomFloat(min, max)     - 小数乱数
//   api.clamp(v, min, max)        - 範囲内に収める
//   api.lerp(a, b, t)             - 線形補間
//   api.distance(x1, y1, x2, y2)  - 2点間距離
//
// 【設定】
//   api.getSetting(key)           - プラグイン設定値取得
//   api.settings                  - 設定オブジェクト全体

// ─── イベントコマンド実行 ───────────────
// executeCommand(cmd, next) が各コマンドを処理:
//
// 標準コマンド:
//   message, choices, scroll_text, input_number, wait
//   item, gold, change_gold_variable, change_item_variable
//   switch, variable, change_self_switch, condition
//   transfer, scroll_map, set_event_location, change_tileset
//   change_player_graphic, set_move_speed, transparent, gather_followers
//   get_location_info, wait_for_movement
//   tint, shake, fade_screen, flash_screen, weather
//   show_animation, show_balloon, change_window_color
//   bgm, se, change_system_bgm, play_movie
//   battle, open_shop, open_save, open_menu
//   game_over, return_title, change_encounter
//   change_save_access, change_menu_access, change_formation
//   change_party, change_hp, change_mp, change_exp, change_level
//   change_param, recover_all, change_equipment, change_name, change_class
//   change_graphic, label, jump, comment, common, erase
//   move_route, show_picture, erase_picture
//
// カスタムコマンド:
//   プラグインの commands に定義されたコマンド、または
//   api.registerCommand() で動的登録されたコマンド

// ─── レンダリングパイプライン ───────────
// render() が毎フレーム呼ばれる:
//   1. onRenderBefore(api, ctx)  - プラグインの描画前フック
//   2. マップレイヤー描画（ground → object）
//   3. イベント描画
//   4. プレイヤー描画
//   5. onRenderAfter(api, ctx)   - プラグインの描画後フック
//   6. 画面効果（tint, shake, flash, fade）の適用

// ─── ゲームループ ──────────────────────
// start() → update(dt) → render() のサイクル
// update内:
//   - 入力処理
//   - プレイヤー移動
//   - カメラ更新
//   - イベントチェック（touch, action, auto, parallel）
//   - onUpdate(api, dt) フック
//   - コマンドキュー処理
`;

export const EVENT_COMMANDS_REFERENCE = `# RPG edit - イベントコマンドリファレンス

## メッセージ系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| message | メッセージ表示 | text |
| choices | 選択肢表示 | choices[] |
| scroll_text | スクロール文章 | text |
| input_number | 数値入力 | varName, digits |

## アクター・パーティ系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| change_party | パーティ編成 | operation(add/remove), actorId |
| change_hp | HP増減 | actorId, operation, amount |
| change_mp | MP増減 | actorId, operation, amount |
| change_exp | 経験値増減 | actorId, operation, amount |
| change_level | レベル増減 | actorId, operation, amount |
| change_param | 能力値変更 | actorId, paramName, operation, amount |
| recover_all | 全回復 | (なし) |
| change_equipment | 装備変更 | actorId, slot, itemId |
| change_name | 名前変更 | actorId, value |
| change_class | 職業変更 | actorId, value |
| change_graphic | グラフィック変更 | value |
| change_formation | 隊列変更 | value(ON/OFF) |

## アイテム・ゴールド系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| item | アイテム増減 | itemName, operation, amount |
| gold | ゴールド増減 | operation, amount |
| change_gold_variable | ゴールド変数代入 | varName |
| change_item_variable | アイテム変数代入 | itemName, varName |

## ゲーム進行系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| battle | 戦闘開始 | troopName |
| open_shop | ショップを開く | shopId |
| open_save | セーブ画面を開く | (なし) |
| open_menu | メニューを開く | (なし) |
| game_over | ゲームオーバー | (なし) |
| return_title | タイトルへ戻る | (なし) |
| change_encounter | エンカウント変更 | rate |
| change_save_access | セーブ許可変更 | value(ON/OFF) |
| change_menu_access | メニュー許可変更 | value(ON/OFF) |

## マップ・移動系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| transfer | 場所移動 | mapName, x, y |
| scroll_map | マップスクロール | x, y, speed |
| set_event_location | イベント位置設定 | eventName, x, y |
| change_tileset | タイルセット変更 | tilesetName |
| change_player_graphic | プレイヤー画像変更 | graphic |
| set_move_speed | 移動速度設定 | speed |
| transparent | 透明状態変更 | value(ON/OFF) |
| gather_followers | フォロワー集合 | (なし) |
| get_location_info | 位置情報取得 | varName, x, y |
| wait_for_movement | 移動完了待機 | (なし) |

## 画面効果系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| tint | 画面色調変更 | color |
| shake | 画面シェイク | duration |
| fade_screen | 画面フェード | fadeType(out/in) |
| flash_screen | 画面フラッシュ | color, duration |
| weather | 天候設定 | type, power |
| show_animation | アニメーション表示 | (なし) |
| show_balloon | フキダシ表示 | (なし) |
| change_window_color | ウィンドウ色変更 | color |

## 音声・動画系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| bgm | BGM再生 | audioName |
| se | 効果音再生 | audioName |
| change_system_bgm | システムBGM変更 | audioName |
| play_movie | 動画再生 | movieUrl |

## 高度系
| コマンド | 説明 | パラメータ |
|---------|------|-----------|
| switch | スイッチ操作 | switchName, value(ON/OFF) |
| variable | 変数操作 | varName, value |
| change_self_switch | セルフスイッチ | switchName(A/B/C/D), value |
| condition | 条件分岐 | expression |
| label | ラベル | name |
| jump | ジャンプ | label |
| comment | コメント | text |
| common | コモンイベント | (なし) |
| wait | 待機 | duration |
| erase | イベント消去 | (なし) |
| move_route | 移動ルート指定 | (なし) |
| show_picture | ピクチャ表示 | (なし) |
| erase_picture | ピクチャ消去 | (なし) |

## 条件式の書き方
- スイッチ: switch[ボス撃破] == ON
- 変数: var[カウンター] >= 5
- アイテム: item[鍵] > 0
- ゴールド: gold >= 1000

## 変数の式
- 数値: 42
- 計算式: lv * 2 + 10
- 乱数: rand(1, 100)
- 変数参照: var[基礎値]
`;

export const API_REFERENCE_MD = `# RPG edit - プラグインAPI リファレンス

## はじめに
RPG editのプラグインはES Module形式（export default）のJavaScriptファイルです。
外部エディタ（VS Code等）で作成し、アップロードして登録します。

## 基本構造
\`\`\`javascript
export default {
  name: "プラグイン名",
  version: "1.0.0",
  description: "説明",
  settings: { /* 設定スキーマ */ },
  onLoad(api) { },
  onUpdate(api, dt) { },
  commands: { /* カスタムコマンド */ },
};
\`\`\`

## ライフサイクルフック
| フック | タイミング |
|--------|-----------|
| onLoad | プラグイン読み込み時 |
| onUnload | プラグインアンロード時 |
| onGameStart | ゲーム開始時 |
| onGameEnd | ゲーム終了時 |
| onMapEnter | マップ入場時 |
| onMapExit | マップ退場時 |
| onBattleStart | 戦闘開始時 |
| onBattleEnd | 戦闘終了時 |

## フレームフック
| フック | タイミング |
|--------|-----------|
| onUpdate | 毎フレーム（dt: 経過秒数） |
| onRenderBefore | マップ描画前 |
| onRenderAfter | マップ描画後 |

## イベントフック
| フック | タイミング |
|--------|-----------|
| onEventTrigger | イベント実行時 |
| onEventCommand | コマンド実行時 |

## API メソッド一覧

### 状態
- api.state - ゲーム状態オブジェクト
- api.getSwitch(name) - スイッチ取得
- api.setSwitch(name, value) - スイッチ設定
- api.getVariable(name) - 変数取得
- api.setVariable(name, value) - 変数設定

### ゴールド・アイテム
- api.getGold() - 所持金取得
- api.addGold(amount) - 所持金増減
- api.getItems() - 全アイテム
- api.getItem(name) - アイテム数量
- api.addItem(name, count) - アイテム追加
- api.removeItem(name, count) - アイテム削除
- api.hasItem(name) - アイテム所持判定

### パーティ
- api.getParty() - パーティ配列
- api.setParty(party) - パーティ設定
- api.addPartyMember(member) - メンバー追加
- api.removePartyMember(id) - メンバー削除

### マップ・イベント
- api.getMap() - 現在のマップ
- api.getMaps() - 全マップ
- api.getMapById(id) - IDでマップ取得
- api.getEvents() - イベント一覧
- api.getEventById(id) - IDでイベント取得
- api.getEventData() - 実行中イベント

### ゲームデータ
- api.getData(key) - データ配列取得 (actors, items, shops等)
- api.getGameData() - ゲームデータ全体

### プレイヤー
- api.getPlayerPos() - {x, y, dir}
- api.setPlayerDir(dir) - 向き設定
- api.isMoving() - 移動中判定
- api.transferPlayer(mapId, x, y) - 転送

### カメラ
- api.getCamera() - {x, y}
- api.setCamera(x, y) - 位置設定
- api.screenWidth / api.screenHeight - 画面サイズ

### UI
- api.showMessage(text) - メッセージ（await）
- api.showChoices(choices) - 選択肢（await）
- api.wait(frames) - 待機（await）

### オーディオ
- api.playBGM(url) - BGM再生
- api.stopBGM() - BGM停止
- api.playSE(url) - 効果音

### 画面効果
- api.tintScreen(color, opacity) - 色調
- api.clearTint() - 色調クリア
- api.shakeScreen(duration, intensity) - シェイク

### カスタムコマンド・フック
- api.registerCommand(type, handler) - コマンド登録
- api.onCustom(name, handler) - フック登録
- api.fireCustom(name, ...args) - フック発火

### プラグイン間通信
- api.getPlugin(name) - 他プラグイン取得
- api.getPlugins() - 全プラグイン一覧

### ユーティリティ
- api.random(min, max) - 整数乱数
- api.randomFloat(min, max) - 小数乱数
- api.clamp(v, min, max) - 範囲制限
- api.lerp(a, b, t) - 線形補間
- api.distance(x1, y1, x2, y2) - 距離

### 設定
- api.getSetting(key) - 設定値取得
- api.settings - 設定オブジェクト

## セキュリティガイドライン
禁止事項:
- DOMの直接操作
- 外部サーバーへのデータ送信
- localStorage / sessionStorageの操作
- eval / Function コンストラクタの使用
- 無限ループ

推奨:
- api オブジェクト経由でのみゲーム状態にアクセス
- 非同期処理は async/await を使用
- エラーハンドリングを適切に行う
`;
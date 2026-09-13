import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Puzzle, Code, Download, Book, Zap, Settings, MousePointerClick,
  Move, Palette, Swords, FileCode, ChevronDown, ChevronUp
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'intro',
    icon: Book,
    title: 'はじめに',
    content: `Suiram RPG Editのプラグインは、外部エディタ（VS Code等）で作成したJavaScriptファイル（.js）をアップロードして登録します。

基本的な流れ:
1. テンプレートをダウンロード、または新規に.jsファイルを作成
2. 外部エディタでプラグインコードを記述
3. プラグイン管理画面またはプラグイン一覧画面からファイルをアップロード
4. ゲームに導入し、コードを確認して実行を許可

プラグインはES Module風の既定エクスポート（export default）で記述します。公式拡張は制約付きAPIだけで動作します。コミュニティ拡張は導入直後には停止しており、内容を確認してゲーム単位で許可した場合だけ実行されます。`,
  },
  {
    id: 'structure',
    icon: FileCode,
    title: '基本構造',
    code: `export default {
  // ─── メタデータ ───────────────────────
  name: "プラグイン名",
  version: "1.0.0",
  author: "作者名",
  description: "説明文",

  // ─── 設定スキーマ（ゲームごとに設定可能） ───
  settings: {
    difficulty: {
      label: "難易度",
      type: "select",        // "select" | "number" | "text" | "color"
      options: ["かんたん", "ふつう", "むずかしい"],
      default: "ふつう",
    },
    maxLevel: {
      label: "最大レベル",
      type: "number",
      default: 99,
    },
    uiColor: {
      label: "UI色",
      type: "color",
      default: "#8b5cf6",
    },
  },

  // ─── ライフサイクルフック ──────────────
  onLoad(api) { /* プラグイン読み込み時 */ },
  onUnload() { /* プラグインアンロード時 */ },
  onGameStart(api) { /* ゲーム開始時 */ },
  onGameEnd(api) { /* ゲーム終了時 */ },
  onMapEnter(api, map) { /* マップ入場時 */ },
  onMapExit(api, map) { /* マップ退場時 */ },
  onBattleStart(api, troop) { /* 戦闘開始時 */ },
  onBattleEnd(api, result) { /* 戦闘終了時 */ },

  // ─── フレームフック ────────────────────
  onUpdate(api, dt) { /* 毎フレーム呼ばれる */ },
  onRenderBefore(api, ctx) { /* マップ描画前 */ },
  onRenderAfter(api, ctx) { /* マップ描画後 */ },

  // ─── イベントフック ────────────────────
  onEventTrigger(api, event) { /* イベント実行前 */ },
  onEventCommand(api, command) { /* コマンド実行前 */ },

  // ─── カスタムコマンド ──────────────────
  commands: {
    myCommand: {
      label: "コマンド名",
      icon: "star",
      color: "#ff6b6b",
      params: [
        { name: "text", label: "テキスト", type: "text", default: "" },
        { name: "value", label: "数値", type: "number", default: 0 },
      ],
      execute: async (api, params) => {
        await api.showMessage(params.text);
      },
    },
  },

  // ─── カスタム移動タイプ ────────────────
  motion: {
    patrol: (entity, api, dt) => {
      // カスタム移動ロジック
    },
  },
};`,
  },
  {
    id: 'api',
    icon: Code,
    title: 'APIリファレンス',
    content: `プラグインのフック関数には api オブジェクトが渡されます。以下のメソッドが利用可能です:`,
    apiList: [
      { name: 'api.state', desc: 'ゲーム状態オブジェクト（現在のマップ、プレイヤー位置など）' },
      { name: 'api.getSwitch(name)', desc: 'スイッチの値を取得 (true/false)' },
      { name: 'api.setSwitch(name, value)', desc: 'スイッチを設定' },
      { name: 'api.getVariable(name)', desc: '変数の値を取得 (数値)' },
      { name: 'api.setVariable(name, value)', desc: '変数を設定' },
      { name: 'api.getGold()', desc: '所持金を取得' },
      { name: 'api.addGold(amount)', desc: '所持金を増減' },
      { name: 'api.getItems()', desc: 'アイテム一覧を取得' },
      { name: 'api.getItem(name)', desc: '指定アイテムの所持数を取得' },
      { name: 'api.addItem(name, count)', desc: 'アイテムを追加' },
      { name: 'api.removeItem(name, count)', desc: 'アイテムを削除' },
      { name: 'api.hasItem(name)', desc: 'アイテムを所持しているか確認' },
      { name: 'api.getParty()', desc: 'パーティメンバー配列を取得' },
      { name: 'api.setParty(party)', desc: 'パーティを設定' },
      { name: 'api.addPartyMember(member)', desc: 'パーティメンバーを追加' },
      { name: 'api.removePartyMember(id)', desc: 'パーティメンバーを削除' },
      { name: 'api.getMaps()', desc: '全マップデータ配列を取得' },
      { name: 'api.getMap()', desc: '現在のマップデータを取得' },
      { name: 'api.getMapById(id)', desc: 'IDでマップを取得' },
      { name: 'api.getEvents()', desc: '現在のマップのイベント一覧を取得' },
      { name: 'api.getEventById(id)', desc: 'IDでイベントを取得' },
      { name: 'api.getEventData()', desc: '現在実行中のイベントデータ' },
      { name: 'api.getData(key)', desc: 'ゲームデータの任意のキーを取得 (actors, items等)' },
      { name: 'api.getGameData()', desc: 'ゲームデータ全体を取得' },
      { name: 'api.getPlayerPos()', desc: 'プレイヤー位置 {x, y, dir} を取得' },
      { name: 'api.setPlayerDir(dir)', desc: 'プレイヤーの向きを設定' },
      { name: 'api.isMoving()', desc: 'プレイヤーが移動中か確認' },
      { name: 'api.transferPlayer(mapId, x, y)', desc: 'プレイヤーを移動' },
      { name: 'api.getCamera()', desc: 'カメラ位置 {x, y} を取得' },
      { name: 'api.setCamera(x, y)', desc: 'カメラ位置を設定' },
      { name: 'api.screenWidth', desc: '画面幅（ピクセル）' },
      { name: 'api.screenHeight', desc: '画面高さ（ピクセル）' },
      { name: 'api.showMessage(text)', desc: 'メッセージを表示 (await可能)' },
      { name: 'api.showChoices(choices)', desc: '選択肢を表示 (選択indexをawaitで取得)' },
      { name: 'api.wait(frames)', desc: '指定フレーム数待機 (await可能)' },
      { name: 'api.playBGM(url)', desc: 'BGMを再生' },
      { name: 'api.stopBGM()', desc: 'BGMを停止' },
      { name: 'api.playSE(url)', desc: '効果音を再生' },
      { name: 'api.tintScreen(color, opacity)', desc: '画面の色調を変更' },
      { name: 'api.clearTint()', desc: '画面の色調をクリア' },
      { name: 'api.shakeScreen(duration, intensity)', desc: '画面をシェイク' },
      { name: 'api.registerCommand(type, handler)', desc: 'カスタムコマンドを動的登録' },
      { name: 'api.onCustom(name, handler)', desc: 'カスタムフックを登録' },
      { name: 'api.fireCustom(name, ...args)', desc: 'カスタムフックを実行' },
      { name: 'api.getPlugin(name)', desc: '他のプラグインインスタンスを取得' },
      { name: 'api.getPlugins()', desc: '全プラグインの名前・バージョン一覧' },
      { name: 'api.random(min, max)', desc: '整数の乱数を生成' },
      { name: 'api.randomFloat(min, max)', desc: '小数の乱数を生成' },
      { name: 'api.clamp(v, min, max)', desc: '値を範囲内に収める' },
      { name: 'api.lerp(a, b, t)', desc: '線形補間' },
      { name: 'api.distance(x1, y1, x2, y2)', desc: '2点間の距離を計算' },
      { name: 'api.getSetting(key)', desc: 'プラグイン設定値を取得' },
      { name: 'api.settings', desc: 'プラグイン設定オブジェクト全体' },
    ],
  },
  {
    id: 'commands',
    icon: Zap,
    title: 'カスタムコマンド',
    content: `プラグインで独自のイベントコマンドを追加できます。コマンドはイベントエディタのコマンド一覧に表示され、他の標準コマンドと同じように使えます。`,
    code: `commands: {
  // コマンドIDがキー
  healParty: {
    label: "全回復",
    icon: "heart",
    color: "#22c55e",
    params: [
      { name: "amount", label: "回復量", type: "number", default: 999 },
      { name: "showMessage", label: "メッセージ表示", type: "select", options: ["する", "しない"], default: "する" },
    ],
    execute: async (api, params) => {
      // 回復処理
      if (params.showMessage === "する") {
        await api.showMessage("HPが全回復した！");
      }
    },
  },

  // 複数のコマンドを定義可能
  teleportRandom: {
    label: "ランダムテレポート",
    icon: "shuffle",
    params: [],
    execute: async (api, params) => {
      const map = api.getMap();
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);
      api.transferPlayer(map.id, x, y);
    },
  },
}`,
  },
  {
    id: 'custom-hooks',
    icon: Zap,
    title: 'カスタムフック & プラグイン間通信',
    content: `プラグイン間で通信できるカスタムフックシステムと、実行時にコマンドを動的登録できる機能があります。これにより、プラグイン同士の連携や柔軟な拡張が可能です。`,
    code: `export default {
  name: "Event System",
  onLoad(api) {
    // カスタムコマンドを動的登録
    api.registerCommand('customHeal', (api, params) => {
      api.addGold(-params.cost);
      api.showMessage('HPを回復した！');
    });

    // カスタムフックを登録（他のプラグインから呼べる）
    api.onCustom('bossDefeated', (bossId) => {
      api.setSwitch('boss_' + bossId, true);
      api.showMessage('ボスを倒した！');
    });
  },

  onUpdate(api) {
    // 条件を満たしたら他のプラグインに通知
    if (api.getVariable('enemyCount') === 0 && !api.getSwitch('cleared')) {
      api.fireCustom('bossDefeated', 'dragon');
    }
  },

  commands: {
    callHook: {
      label: "カスタムフック呼び出し",
      params: [
        { name: "hookName", label: "フック名", type: "text", default: "myEvent" },
      ],
      execute: async (api, params) => {
        api.fireCustom(params.hookName);
      },
    },
  },
}`,
  },
  {
    id: 'inter-plugin',
    icon: Code,
    title: 'プラグイン間連携',
    content: `getPlugin() を使って他のプラグインのインスタンスにアクセスし、連携できます。getGameData() でゲームデータ全体にアクセスできます。`,
    code: `export default {
  name: "Quest UI",
  onUpdate(api) {
    // "Quest System" プラグインを取得
    const questPlugin = api.getPlugin('Quest System');
    if (questPlugin) {
      const quests = api.getGameData().quests || [];
      const activeCount = quests.filter(q => q.status === 'active').length;
    }
    // ゲームデータの任意の配列にアクセス
    const actors = api.getData('actors');
    const items = api.getData('items');
  },
}`,
  },
  {
    id: 'math-utils',
    icon: Settings,
    title: 'ユーティリティ関数',
    content: `プラグインで使える便利なユーティリティ関数群です。乱数生成、数値計算、距離計算などが用意されています。`,
    code: `onUpdate(api, dt) {
  const damage = api.random(10, 50);
  const critRate = api.randomFloat(0, 1);
  const hp = api.clamp(currentHp + heal, 0, maxHp);
  const smoothValue = api.lerp(startValue, endValue, 0.5);
  const dist = api.distance(playerX, playerY, enemyX, enemyY);
  if (dist < 3) api.showMessage('敵が近い！');
  const difficulty = api.getSetting('difficulty');
}`,
  },
  {
    id: 'motion',
    icon: Move,
    title: 'カスタムモーション',
    content: `イベントの自律移動に独自の移動パターンを追加できます。イベントエディタの「自律移動」で選択可能になります。`,
    code: `motion: {
  // 移動タイプIDがキー
  zigzag: (entity, api, dt) => {
    // entity: { x, y, dir } - イベントの位置
    // dt: 経過時間（秒）
    // ジグザグ移動のロジックを記述
    const t = Date.now() / 500;
    const dx = Math.sin(t) > 0 ? 1 : -1;
    // 移動処理
  },

  circle: (entity, api, dt) => {
    // 円形移動
    const centerX = entity.startX;
    const centerY = entity.startY;
    const radius = 3;
    const t = Date.now() / 1000;
    const newX = Math.round(centerX + Math.cos(t) * radius);
    const newY = Math.round(centerY + Math.sin(t) * radius);
    // 移動処理
  },
}`,
  },
  {
    id: 'render',
    icon: Palette,
    title: 'カスタム描画',
    content: `onRenderBefore と onRenderAfter を使って、マップの描画に独自の要素を追加できます。Canvas 2D APIがそのまま使えます。`,
    code: `onRenderAfter(api, ctx) {
  // プレイヤーの上にHPバーを描画
  const state = api.state;
  const ts = 32;
  const px = state.playerX * ts;
  const py = state.playerY * ts;

  // HPバー背景
  ctx.fillStyle = '#000000';
  ctx.fillRect(px - 4, py - 12, ts + 8, 5);

  // HPバー
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(px - 4, py - 12, (ts + 8) * 0.8, 5);

  // カスタムテキスト
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Lv.1', px, py - 16);
},

onRenderBefore(api, ctx) {
  // マップの上に雨のエフェクト
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.strokeStyle = 'rgba(174,194,224,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 10);
    ctx.stroke();
  }
}`,
  },
  {
    id: 'settings',
    icon: Settings,
    title: '設定スキーマ',
    content: `プラグインごとに設定可能なパラメータを定義できます。設定値は api 経由でアクセス可能です。`,
    code: `settings: {
  // 数値設定
  encounterRate: {
    label: "エンカウント率",
    type: "number",
    default: 30,
  },
  // 選択肢設定
  battleStyle: {
    label: "戦闘スタイル",
    type: "select",
    options: ["ターン制", "リアルタイム", "ATB"],
    default: "ターン制",
  },
  // テキスト設定
  customText: {
    label: "カスタムテキスト",
    type: "text",
    default: "こんにちは",
  },
  // 色設定
  uiTheme: {
    label: "UIテーマ色",
    type: "color",
    default: "#8b5cf6",
  },
},

// 設定値の利用
onGameStart(api) {
  // プラグインの設定にアクセス
  const settings = this._settings || {};
  console.log("エンカウント率:", settings.encounterRate);
  console.log("戦闘スタイル:", settings.battleStyle);
}`,
  },
  {
    id: 'example',
    icon: MousePointerClick,
    title: '実例: ダメージ床プラグイン',
    content: `マップ上の特定タイルに乗るとダメージを受けるプラグインの完全な例です。`,
    code: `export default {
  name: "ダメージ床",
  version: "1.0.0",
  description: "特定色のタイルに乗るとHPが減る",

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
  },

  onGameStart(api) {
    this._hp = 100;
    this._maxHp = 100;
  },

  onUpdate(api, dt) {
    const map = api.getMap();
    const state = api.state;
    const ts = map.tileSize || 32;

    // プレイヤーがいるタイルの色をチェック
    const tile = map.layers?.ground?.[state.playerY]?.[state.playerX];
    if (tile === this._settings.damageColor) {
      this._damageTimer = (this._damageTimer || 0) + dt;
      if (this._damageTimer >= 1) {
        this._hp = Math.max(0, this._hp - this._settings.damageAmount);
        this._damageTimer = 0;
        api.playSE('damage_se_url');
      }
    }
  },

  onRenderAfter(api, ctx) {
    // HPバーを画面上部に描画
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(10, 10, 200 * (this._hp / this._maxHp), 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('HP', 15, 25);
  },
};`,
  },
  {
    id: 'security',
    icon: Swords,
    title: 'セキュリティガイドライン',
    content: `公式拡張はSuiram RPG Editの制約付きAPIだけで動作します。コミュニティ拡張は危険なブラウザーAPIを検査し、利用者がゲーム単位で明示許可した場合だけ実行されます。JavaScriptを実行する性質上、信頼できるコードだけを許可してください。

禁止事項:
- DOMの直接操作（document.write等）
- 外部サーバーへのデータ送信（fetch, XMLHttpRequest等）
- localStorage / sessionStorageの操作
- eval / Function コンストラクタの使用
- import / Worker / WebSocketの使用
- 無限ループ（ゲームがフリーズします）

推奨:
- api オブジェクト経由でのみゲーム状態にアクセス
- 非同期処理は async/await を使用
- エラーハンドリングを適切に行う
- 公開前に別のテスト用ゲームで動作確認する`,
  },
];

export default function PluginDocs() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState('intro');

  const downloadFullDocs = () => {
    let text = 'Suiram RPG Edit プラグイン開発ガイド\\n==============================\\n\\n';
    for (const s of SECTIONS) {
      text += `■ ${s.title}\\n${'─'.repeat(40)}\\n`;
      if (s.content) text += s.content + '\\n\\n';
      if (s.code) text += '【コード例】\\n' + s.code + '\\n\\n';
      if (s.apiList) {
        text += '【API一覧】\\n';
        s.apiList.forEach(a => text += `  ${a.name} - ${a.desc}\\n`);
        text += '\\n';
      }
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpgedit_plugin_guide.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Puzzle size={24} className="text-violet-400" /> {t('nav_plugin_docs')}
        </h1>
        <Button variant="outline" onClick={downloadFullDocs} className="border-zinc-700">
          <Download size={16} className="mr-1" /> 全ドキュメントDL
        </Button>
      </div>

      <div className="space-y-2">
        {SECTIONS.map(section => {
          const isOpen = expanded === section.id;
          return (
            <div key={section.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition"
              >
                <section.icon size={18} className="text-violet-400 flex-shrink-0" />
                <span className="text-sm font-medium text-zinc-200 flex-1">{section.title}</span>
                {isOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {section.content && (
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                  )}
                  {section.code && (
                    <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed">{section.code}</pre>
                  )}
                  {section.apiList && (
                    <div className="space-y-1.5">
                      {section.apiList.map((a, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs">
                          <code className="text-violet-300 font-mono flex-shrink-0 sm:w-64">{a.name}</code>
                          <span className="text-zinc-400">{a.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

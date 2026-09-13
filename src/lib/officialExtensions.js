const define = (category, rows) => rows.map(([id, name, description, kind = 'command']) => ({
  id, name, description, category, kind, version: '1.0.0', author_name: 'RPG edit',
  is_public: true, official: true, plugin_id: `official:${id}`, commandId: `ext_${id.replaceAll('-', '_')}`,
}));

const GROUPS = [
  define('system', [
    ['checkpoint', 'チェックポイント', '現在位置を復帰地点として記録します。', 'checkpoint'],
    ['autosave-plus', 'スマート自動保存', '移動や重要イベントの節目で保存要求を出します。', 'switch'],
    ['playtime', 'プレイ時間記録', 'プレイ時間を秒単位で変数に記録します。', 'timer'],
    ['difficulty', '難易度プリセット', 'イベントから難易度変数を切り替えます。', 'counter'],
    ['new-game-plus', '周回プレイ', '周回数を管理して次のプレイへ引き継ぎます。', 'counter'],
    ['achievements', '実績トラッカー', '実績解除数と解除通知を管理します。', 'counter'],
    ['random-seed', '固定乱数シード', 'テスト再現用のシード値を記録します。', 'counter'],
    ['time-scale', '時間倍率', 'ゲーム内時間の倍率を変数で制御します。', 'counter'],
    ['scene-counter', 'シーン遷移記録', 'マップ移動回数を自動集計します。', 'mapCounter'],
    ['session-marker', 'セッション記録', '開始回数をローカル状態へ記録します。', 'counter'],
  ]),
  define('exploration', [
    ['minimap', 'ミニマップ', '現在マップとプレイヤー位置を小窓で表示します。', 'minimap'],
    ['compass', '方角コンパス', 'プレイヤーが向いている方角を表示します。', 'compass'],
    ['coordinates', '座標HUD', '現在座標とマップ名を表示します。', 'coordinates'],
    ['region-tracker', 'リージョン検知', '指定リージョンに入るとスイッチを切り替えます。', 'region'],
    ['step-counter', '歩数計', '移動した歩数を変数に記録します。', 'step'],
    ['stamina', 'スタミナ移動', 'ダッシュ用スタミナ値を管理します。', 'meter'],
    ['hidden-passage', '隠し通路フラグ', '隠し通路発見状態をスイッチで管理します。', 'switch'],
    ['warp-point', 'ワープポイント', '登録した地点を復帰地点として扱います。', 'checkpoint'],
    ['map-discovery', 'マップ踏破率', '訪れたリージョン数を記録します。', 'discovery'],
    ['treasure-tracker', '宝箱カウンター', '取得した宝箱数を管理してHUD表示します。', 'hud'],
  ]),
  define('environment', [
    ['day-night', '昼夜サイクル', '時間変数に応じた画面色を重ねます。', 'dayNight'],
    ['rain', '雨エフェクト', '軽量な雨の画面演出を追加します。', 'rain'],
    ['snow', '雪エフェクト', '軽量な雪の画面演出を追加します。', 'snow'],
    ['fog', '霧エフェクト', '濃度を設定できる霧を重ねます。', 'overlay'],
    ['wind', '風エフェクト', '横方向に流れる風の線を描画します。', 'wind'],
    ['lightning', '雷フラッシュ', 'イベントから雷光を発生させます。', 'flash'],
    ['ambient-particles', '環境パーティクル', '空気中を漂う粒子を描画します。', 'particles'],
    ['water-shimmer', '水面シマー', '水辺向けの青い揺らぎを重ねます。', 'overlay'],
    ['heat-haze', '陽炎フィルター', '暖色の薄い画面効果を追加します。', 'overlay'],
    ['seasonal-tint', '季節カラー', 'マップ全体の季節色を切り替えます。', 'overlay'],
  ]),
  define('narrative', [
    ['dialogue-portrait', '会話立ち絵制御', '会話用立ち絵の表示状態を管理します。', 'switch'],
    ['name-box', '話者名ボックス', '話者名をHUDへ表示します。', 'hud'],
    ['typewriter', 'タイプライター速度', '文章送り速度を変数で調整します。', 'counter'],
    ['dialogue-backlog', '会話ログ', '会話ログの有効状態を管理します。', 'switch'],
    ['choice-timer', '時間制限選択肢', '選択肢用の残り時間をHUD表示します。', 'meter'],
    ['quest-marker', 'クエストマーカー', '進行中クエストの目印を表示します。', 'hud'],
    ['objective-hud', '目的HUD', '現在の目的文を常時表示します。', 'hud'],
    ['cutscene-bars', 'シネマスコープ', 'イベント中に上下の黒帯を表示します。', 'cinema'],
    ['camera-focus', '注目対象フォーカス', 'カメラ注目モードをスイッチ制御します。', 'switch'],
    ['chapter-card', '章タイトルカード', '章名を画面中央へ表示します。', 'message'],
  ]),
  define('battle', [
    ['damage-popup', 'ダメージポップアップ', 'ダメージ表示の有効状態を管理します。', 'switch'],
    ['hit-streak', '連続ヒット', '連続ヒット数を変数で管理します。', 'counter'],
    ['boss-gauge', 'ボスHPゲージ', 'ボスHP変数を大きなゲージで表示します。', 'meter'],
    ['enemy-level', '敵レベル表示', '敵レベル値をHUDへ表示します。', 'hud'],
    ['weak-point', '弱点ブレイク', '弱点ゲージ値を管理します。', 'meter'],
    ['guard-meter', 'ガードゲージ', '防御用ゲージを表示します。', 'meter'],
    ['break-gauge', 'ブレイクゲージ', 'ブレイク値を管理して表示します。', 'meter'],
    ['battle-timer', '戦闘タイマー', '戦闘経過時間を計測します。', 'timer'],
    ['escape-gauge', '逃走ゲージ', '逃走進行度を表示します。', 'meter'],
    ['loot-summary', '戦利品まとめ', '獲得アイテム数をHUD表示します。', 'hud'],
  ]),
  define('progression', [
    ['experience-gauge', '経験値ゲージ', '経験値変数をゲージ表示します。', 'meter'],
    ['level-cap', 'レベル上限', 'レベル上限値を変数で管理します。', 'counter'],
    ['skill-points', 'スキルポイント', 'スキルポイントの増減を扱います。', 'counter'],
    ['talent-points', '才能ポイント', '才能ポイントの増減を扱います。', 'counter'],
    ['reputation', '評判システム', '勢力評判値を記録して表示します。', 'counter'],
    ['affinity', '親密度システム', '仲間との交流値を管理します。', 'counter'],
    ['titles', '称号システム', '獲得称号数を記録します。', 'counter'],
    ['mastery', '熟練度システム', '行動熟練度を蓄積します。', 'counter'],
    ['bestiary', 'モンスター図鑑', '発見した敵の数を記録します。', 'counter'],
    ['codex', '世界資料集', '解放済み資料の数を管理します。', 'counter'],
  ]),
  define('items', [
    ['crafting', 'クラフト', '素材を消費して制作回数を記録します。', 'reward'],
    ['cooking', '料理', '料理アイテムをイベントから追加します。', 'reward'],
    ['fishing', '釣り', '釣果アイテムを追加して回数を記録します。', 'reward'],
    ['farming', '農業', '収穫アイテムを追加します。', 'reward'],
    ['mining', '採掘', '鉱石アイテムを追加します。', 'reward'],
    ['gathering', '採取', '採取アイテムを追加します。', 'reward'],
    ['alchemy', '錬金術', '生成アイテムを追加します。', 'reward'],
    ['durability', '装備耐久度', '耐久度変数を減らして管理します。', 'counter'],
    ['item-weight', '所持重量', '所持重量値をゲージ表示します。', 'meter'],
    ['quick-slots', 'クイックスロット', '選択中スロット番号をHUD表示します。', 'hud'],
  ]),
  define('movement', [
    ['eight-direction', '8方向移動補助', '斜め移動設定の有効状態を管理します。', 'switch'],
    ['dash-trails', 'ダッシュ軌跡', 'ダッシュ中に短い軌跡を描画します。', 'trail'],
    ['ice-floor', '氷床', '指定リージョンの氷床状態を検知します。', 'region'],
    ['conveyor', 'ベルトコンベア', '指定リージョンの移動床状態を検知します。', 'region'],
    ['jump-tile', 'ジャンプ床', '指定リージョンへの侵入回数を記録します。', 'discovery'],
    ['climbing', 'はしご移動', '登攀状態をスイッチ制御します。', 'switch'],
    ['swimming', '水泳モード', '水泳状態をスイッチ制御します。', 'switch'],
    ['stealth', 'ステルス移動', '発見度をゲージ表示します。', 'meter'],
    ['followers', '隊列フォロワー', '隊列表示の有効状態を管理します。', 'switch'],
    ['vehicle-fuel', '乗り物燃料', '乗り物の燃料値を管理します。', 'meter'],
  ]),
  define('ui', [
    ['custom-hud', 'カスタムHUD', '任意変数をラベル付きで表示します。', 'hud'],
    ['world-clock', 'ワールド時計', '時間変数を時計として表示します。', 'hud'],
    ['notifications', '通知トースト', '短い通知文をゲーム画面へ表示します。', 'message'],
    ['tutorial-tips', '操作ヒント', '設定したヒント文を表示します。', 'message'],
    ['health-bars', 'HPバー', 'HP変数をゲージとして表示します。', 'meter'],
    ['resource-bars', 'リソースバー', '任意リソース値を表示します。', 'meter'],
    ['menu-theme', 'メニューテーマ', 'メニュー色を画面へ反映します。', 'overlay'],
    ['cursor-animation', '選択カーソル演出', 'カーソル演出の有効状態を管理します。', 'switch'],
    ['screen-filter', '画面フィルター', '色と透明度を指定して画面へ重ねます。', 'overlay'],
    ['screenshot-mode', '撮影モード', 'HUD非表示用スイッチを切り替えます。', 'switch'],
  ]),
  define('accessibility', [
    ['large-text', '大きな文字', '大文字表示用スイッチを切り替えます。', 'switch'],
    ['high-contrast', '高コントラスト', '視認性の高い画面フィルターを重ねます。', 'overlay'],
    ['reduce-motion', '演出軽減', '動きの大きい演出を無効化する状態を管理します。', 'switch'],
    ['color-assist', '色覚サポート', '判別しやすい色フィルターを重ねます。', 'overlay'],
    ['auto-advance', '文章自動送り', '文章自動送り状態を管理します。', 'switch'],
    ['debug-overlay', 'デバッグHUD', '座標・向き・マップIDを表示します。', 'debug'],
    ['switch-viewer', 'スイッチ監視', '指定スイッチの値を表示します。', 'hud'],
    ['variable-viewer', '変数監視', '指定変数の値を表示します。', 'hud'],
    ['fps-monitor', 'FPSモニター', '描画FPSを計測して表示します。', 'fps'],
    ['hitbox-viewer', '当たり判定表示', '通行不可タイルを実行画面に重ねます。', 'hitbox'],
  ]),
];

export const OFFICIAL_EXTENSIONS = Object.freeze(GROUPS.flat());

if (OFFICIAL_EXTENSIONS.length !== 100) {
  throw new Error(`Official extension catalog must contain 100 entries, received ${OFFICIAL_EXTENSIONS.length}.`);
}

const DEFAULT_SCHEMAS = {
  counter: { target: { label: '変数名', type: 'text', default: 'extension_value' }, amount: { label: '増減値', type: 'number', default: 1 } },
  timer: { target: { label: '変数名', type: 'text', default: 'elapsed_seconds' }, interval: { label: '更新秒', type: 'number', default: 1 } },
  switch: { target: { label: 'スイッチ名', type: 'text', default: 'extension_enabled' } },
  reward: { item: { label: '獲得アイテム', type: 'text', default: '素材' }, amount: { label: '個数', type: 'number', default: 1 } },
  hud: { target: { label: '変数名', type: 'text', default: 'extension_value' }, label: { label: '表示名', type: 'text', default: 'VALUE' }, color: { label: '文字色', type: 'color', default: '#ffffff' } },
  meter: { target: { label: '変数名', type: 'text', default: 'extension_value' }, label: { label: '表示名', type: 'text', default: 'METER' }, max: { label: '最大値', type: 'number', default: 100 }, color: { label: '色', type: 'color', default: '#8b5cf6' } },
  overlay: { color: { label: '色', type: 'color', default: '#64748b' }, opacity: { label: '濃さ', type: 'number', default: 0.12 } },
  region: { regionId: { label: 'リージョンID', type: 'number', default: 1 }, target: { label: 'スイッチ名', type: 'text', default: 'in_region' } },
  message: { text: { label: '表示文', type: 'text', default: 'お知らせ' } },
};

export function getOfficialExtension(id) {
  const normalized = id?.startsWith('official:') ? id.slice(9) : id;
  return OFFICIAL_EXTENSIONS.find(extension => extension.id === normalized);
}

export function getOfficialExtensionByCommand(commandId) {
  return OFFICIAL_EXTENSIONS.find(extension => extension.commandId === commandId);
}

export function getExtensionSettingsSchema(extension) {
  if (!extension) return {};
  return DEFAULT_SCHEMAS[extension.kind] || DEFAULT_SCHEMAS.counter;
}

export function getDefaultExtensionSettings(extension) {
  return Object.fromEntries(Object.entries(getExtensionSettingsSchema(extension)).map(([key, schema]) => [key, schema.default]));
}

function drawPanel(context, text, y, color = '#fff') {
  context.save();
  context.font = '600 13px system-ui, sans-serif';
  const width = Math.max(116, context.measureText(text).width + 24);
  context.fillStyle = 'rgba(9,9,11,.78)';
  context.fillRect(12, y, width, 30);
  context.fillStyle = color;
  context.fillText(text, 24, y + 20);
  context.restore();
}

function runCommand(extension, api, settings) {
  const target = settings.target || extension.id;
  switch (extension.kind) {
    case 'switch':
      api.setSwitch(target, !api.getSwitch(target));
      break;
    case 'reward':
      api.addItem(settings.item || extension.name, Number(settings.amount) || 1);
      break;
    case 'checkpoint':
      api.setCheckpoint?.(api.getPlayerPos());
      break;
    case 'message':
      return api.showMessage(settings.text || extension.name);
    case 'flash':
      api.flashScreen?.('#ffffff', 18);
      break;
    default:
      api.setVariable(target, api.getVariable(target) + (Number(settings.amount) || 1));
  }
  return undefined;
}

export function createOfficialExtension(extension, customSettings = {}) {
  const settings = { ...getDefaultExtensionSettings(extension), ...customSettings };
  let elapsed = 0;
  let frames = 0;
  let fps = 0;
  let second = 0;
  return {
    name: extension.name,
    version: extension.version,
    official: true,
    commands: {
      [extension.commandId]: {
        label: extension.name,
        execute: api => runCommand(extension, api, settings),
      },
    },
    onUpdate(api, delta) {
      if (extension.kind === 'timer') {
        elapsed += delta;
        const interval = Math.max(.1, Number(settings.interval) || 1);
        if (elapsed >= interval) {
          api.setVariable(settings.target, api.getVariable(settings.target) + Math.floor(elapsed / interval));
          elapsed %= interval;
        }
      }
      if (extension.kind === 'fps') {
        frames += 1;
        second += delta;
        if (second >= 1) { fps = Math.round(frames / second); frames = 0; second = 0; }
      }
    },
    onMapEnter(api) {
      if (extension.kind === 'mapCounter') api.setVariable(extension.id, api.getVariable(extension.id) + 1);
    },
    onPlayerStep(api, position) {
      if (extension.kind === 'step') api.setVariable(settings.target, api.getVariable(settings.target) + (Number(settings.amount) || 1));
      if (extension.kind === 'region') api.setSwitch(settings.target, api.getRegion(position.x, position.y) === Number(settings.regionId));
      if (extension.kind === 'discovery') {
        const region = api.getRegion(position.x, position.y);
        if (region) api.setVariable(`${extension.id}:${region}`, 1);
      }
    },
    onRenderHud(api, context) {
      const width = api.screenWidth;
      const height = api.screenHeight;
      if (['overlay', 'fog'].includes(extension.kind)) {
        context.save(); context.globalAlpha = Math.min(.8, Math.max(0, Number(settings.opacity) || .12)); context.fillStyle = settings.color || '#64748b'; context.fillRect(0, 0, width, height); context.restore();
      } else if (extension.kind === 'dayNight') {
        const hour = api.getVariable(settings.target || 'world_hour') % 24;
        if (hour < 6 || hour >= 19) { context.save(); context.globalAlpha = .26; context.fillStyle = '#172554'; context.fillRect(0, 0, width, height); context.restore(); }
      } else if (extension.kind === 'cinema') {
        context.fillStyle = '#000'; context.fillRect(0, 0, width, height * .1); context.fillRect(0, height * .9, width, height * .1);
      } else if (extension.kind === 'coordinates' || extension.kind === 'debug') {
        const position = api.getPlayerPos(); drawPanel(context, `${api.getMap()?.name || ''}  X:${position.x} Y:${position.y} ${position.dir}`, 48);
      } else if (extension.kind === 'compass') {
        const direction = { up: 'N', right: 'E', down: 'S', left: 'W' }[api.getPlayerPos().dir] || 'N'; drawPanel(context, `COMPASS  ${direction}`, 48);
      } else if (extension.kind === 'fps') {
        drawPanel(context, `FPS ${fps}`, 48, '#86efac');
      } else if (extension.kind === 'hud') {
        drawPanel(context, `${settings.label}: ${api.getVariable(settings.target)}`, 48, settings.color);
      } else if (extension.kind === 'meter') {
        const value = api.getVariable(settings.target); const max = Math.max(1, Number(settings.max) || 100); const ratio = Math.max(0, Math.min(1, value / max));
        context.save(); context.fillStyle = 'rgba(9,9,11,.8)'; context.fillRect(12, 48, 176, 42); context.fillStyle = '#d4d4d8'; context.font = '600 12px system-ui'; context.fillText(`${settings.label} ${value}/${max}`, 22, 65); context.fillStyle = '#27272a'; context.fillRect(22, 72, 156, 8); context.fillStyle = settings.color || '#8b5cf6'; context.fillRect(22, 72, 156 * ratio, 8); context.restore();
      } else if (extension.kind === 'minimap') {
        const map = api.getMap(); if (!map) return; const scale = Math.min(3, 100 / Math.max(map.width, map.height)); const left = width - map.width * scale - 16; const top = 48;
        context.save(); context.fillStyle = 'rgba(9,9,11,.82)'; context.fillRect(left - 6, top - 6, map.width * scale + 12, map.height * scale + 12); context.fillStyle = '#52525b'; context.fillRect(left, top, map.width * scale, map.height * scale); const position = api.getPlayerPos(); context.fillStyle = '#a78bfa'; context.fillRect(left + position.x * scale, top + position.y * scale, Math.max(2, scale), Math.max(2, scale)); context.restore();
      } else if (extension.kind === 'hitbox') {
        api.drawCollision?.(context);
      } else if (['rain', 'wind', 'snow', 'particles', 'trail'].includes(extension.kind)) {
        const time = performance.now() / 1000; context.save(); context.strokeStyle = extension.kind === 'rain' ? 'rgba(191,219,254,.55)' : 'rgba(255,255,255,.32)'; context.fillStyle = 'rgba(255,255,255,.5)';
        for (let i = 0; i < 36; i += 1) { const x = (i * 97 + time * (extension.kind === 'wind' ? 90 : 25)) % width; const y = (i * 53 + time * (extension.kind === 'rain' ? 170 : 18)) % height; if (['snow', 'particles'].includes(extension.kind)) context.fillRect(x, y, 2, 2); else { context.beginPath(); context.moveTo(x, y); context.lineTo(x + (extension.kind === 'wind' ? 24 : -4), y + (extension.kind === 'rain' ? 12 : 0)); context.stroke(); } } context.restore();
      }
    },
  };
}

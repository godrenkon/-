import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rpgStore } from '@/lib/rpgStore';
import { GameEngine } from '@/lib/gameEngine';
import { normalizeGameData } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import TouchControls from '@/components/game/TouchControls';
import {
  ArrowLeft, Volume2, VolumeX, RotateCcw, Home, Settings as SettingsIcon,
  X, Save, FolderOpen, Swords, ShoppingBag,
} from 'lucide-react';

const saveKey = id => `rpg-edit:save:${id}`;

export default function GamePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [message, setMessage] = useState(null);
  const [choices, setChoices] = useState(null);
  const [hud, setHud] = useState({ gold: 0, mapName: '', items: {} });
  const [muted, setMuted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsValues, setSettingsValues] = useState({});
  const [hasSave, setHasSave] = useState(() => Boolean(localStorage.getItem(saveKey(id))));
  const [numberInput, setNumberInput] = useState(null);
  const [battle, setBattle] = useState(null);
  const [shop, setShop] = useState(null);
  const pendingGameData = useRef(null);
  const autoSaveTimer = useRef(null);

  const controlConfig = game?.game_data?.controlConfig || {};
  const settingsScreen = game?.game_data?.settingsScreen || [];
  const shopCatalog = useMemo(() => [
    ...(game?.game_data?.items || []),
    ...(game?.game_data?.weapons || []),
    ...(game?.game_data?.armors || []),
  ], [game]);
  const battleSkills = game?.game_data?.skills || [];

  // Build key-to-action mapping from controlConfig
  const keyToAction = useMemo(() => {
    const map = {};
    const kb = controlConfig.keyBindings || {};
    Object.entries(kb).forEach(([action, keys]) => {
      (keys || []).forEach(key => {
        const normalized = key === 'Space' ? ' ' : key;
        map[normalized] = action;
        map[normalized.toLowerCase()] = action;
      });
    });
    // Defaults if no config
    if (Object.keys(map).length === 0) {
      map['ArrowUp'] = 'up'; map['w'] = 'up';
      map['ArrowDown'] = 'down'; map['s'] = 'down';
      map['ArrowLeft'] = 'left'; map['a'] = 'left';
      map['ArrowRight'] = 'right'; map['d'] = 'right';
      map['Enter'] = 'action'; map[' '] = 'action';
      map['Escape'] = 'cancel';
      map['m'] = 'menu';
    }
    return map;
  }, [controlConfig]);

  useEffect(() => {
    loadGame();
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setHasSave(Boolean(localStorage.getItem(saveKey(id))));
    return () => {
      clearTimeout(autoSaveTimer.current);
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && game && pendingGameData.current && !engineRef.current) {
      initEngine(pendingGameData.current);
    }
  }, [loading, game]);

  const loadGame = async () => {
    try {
      const data = await rpgStore.entities.Game.get(id);
      const normalized = normalizeGameData(data.game_data);
      setGame({ ...data, game_data: normalized });
      if (!normalized.maps.length) {
        toast({ title: 'マップデータがありません', variant: 'destructive' });
        setLoading(false);
        return;
      }
      pendingGameData.current = normalized;
    } catch (e) {
      console.error(e);
      toast({ title: 'ゲームの読み込みに失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const initEngine = (gameData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GameEngine(canvas, gameData, {
      onMessage: (text, onClose) => setMessage({ text, onClose }),
      onChoices: (options, onSelect) => setChoices({ options, onSelect }),
      onInputNumber: ({ varName, digits, callback }) => setNumberInput({ varName, digits, callback, value: 0 }),
      onScrollText: ({ text, callback }) => setMessage({ text, onClose: callback }),
      onOpenSave: () => setShowMenu(true),
      onOpenMenu: () => setShowMenu(true),
      onOpenShop: (shopId, onClose) => {
        const data = (gameData.shops || []).find(item => item.id === shopId || item.name === shopId);
        if (!data) { toast({ title: 'ショップが見つかりません', variant: 'destructive' }); onClose(); return; }
        setShop({ ...data, onClose });
      },
      onReturnTitle: () => navigate(`/game/${id}`),
      onGameOver: () => toast({ title: 'ゲームオーバー', variant: 'destructive' }),
      onDamageFloor: amount => toast({ title: `ダメージ床: ${amount} HP` }),
      onBattle: ({ troop, actors }, resolve) => {
        const enemies = (troop.members || []).map((member, index) => {
          const enemyId = typeof member === 'object' ? (member.enemyId || member.id) : member;
          const source = (gameData.enemies || []).find(enemy => enemy.id === enemyId || enemy.name === enemyId) || {};
          const hp = Math.max(1, Number(source.hp) || 30);
          return { ...source, id: `${source.id || 'enemy'}_${index}`, name: source.name || `敵 ${index + 1}`, hp, maxHp: hp };
        });
        if (!enemies.length) { resolve({ result: 'victory' }); return; }
        setBattle({ troop, actors, enemies, resolve, log: `${troop.name || '敵グループ'}が現れた` });
      },
      onStateChange: (state) => {
        const map = (gameData.maps || []).find(m => m.id === state.currentMapId);
        setHud({ gold: state.gold, mapName: map?.name || '', items: { ...state.items } });
        // Update settings values
        const vals = {};
        (gameData.settingsScreen || []).forEach(item => {
          if (item.targetType === 'switch') vals[item.id] = state.switches[item.targetId];
          else vals[item.id] = state.variables[item.targetId];
        });
        setSettingsValues(vals);
        if (gameData.system?.autoSave !== false) {
          clearTimeout(autoSaveTimer.current);
          autoSaveTimer.current = setTimeout(() => persistSave(engine, false), 900);
        }
      },
      onError: (msg) => toast({ title: msg, variant: 'destructive' }),
    });
    engineRef.current = engine;
    resizeCanvas();
    engine.start();
    setHud({ gold: engine.state.gold, mapName: engine.getCurrentMap()?.name || '', items: {} });
  };

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!container || !engine) return;
    const rect = container.getBoundingClientRect();
    engine.resize(rect.width, rect.height);
  }, []);

  useEffect(() => {
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resizeCanvas]);

  // Keyboard input with custom bindings
  useEffect(() => {
    const onKeyDown = (e) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (message || choices || showMenu || showSettings || battle || numberInput || shop) {
        // Handle message/choices dismissal with action key
        const action = keyToAction[e.key] || keyToAction[e.key.toLowerCase()];
        if (action === 'action' && message) { closeMessage(); return; }
        if (action === 'cancel' && message) { closeMessage(); return; }
        if (action === 'cancel' && numberInput) { numberInput.callback(0); setNumberInput(null); return; }
        if (action === 'cancel' && shop) { closeShop(); return; }
        if (action === 'cancel' && battle) { finishBattle('escape'); return; }
        if (action === 'menu' || action === 'cancel') { setShowMenu(false); setShowSettings(false); return; }
        return;
      }
      const action = keyToAction[e.key] || keyToAction[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      switch (action) {
        case 'up': engine.pressDirection('up'); break;
        case 'down': engine.pressDirection('down'); break;
        case 'left': engine.pressDirection('left'); break;
        case 'right': engine.pressDirection('right'); break;
        case 'action': engine.pressAction(); break;
        case 'cancel': setShowMenu(true); break;
        case 'menu': setShowMenu(true); break;
        case 'dash': engine.state.dash = true; break;
      }
    };
    const onKeyUp = (e) => {
      const action = keyToAction[e.key] || keyToAction[e.key.toLowerCase()];
      if (action === 'dash') engineRef.current && (engineRef.current.state.dash = false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [keyToAction, message, choices, showMenu, showSettings, battle, numberInput, shop]);

  const closeMessage = () => {
    if (message?.onClose) message.onClose();
    setMessage(null);
  };

  const handleDirection = (dir) => {
    if (message || choices || showMenu || showSettings || battle || numberInput || shop) return;
    engineRef.current?.pressDirection(dir);
  };

  const handleAction = () => {
    if (message) { closeMessage(); return; }
    if (choices || showMenu || showSettings || battle || numberInput || shop) return;
    engineRef.current?.pressAction();
  };

  const handleCancel = () => {
    if (message) { closeMessage(); return; }
    if (choices || battle || numberInput || shop) return;
    setShowMenu(true);
  };

  const handleMenu = () => {
    if (message || choices || battle || numberInput || shop) return;
    if (engineRef.current?.state.menuAccess === false) {
      toast({ title: 'メニューは現在使用できません' });
      return;
    }
    setShowMenu(true);
  };

  const handleCustom = (action) => {
    if (action === 'menu') { handleMenu(); return; }
    if (action === 'cancel') { handleCancel(); return; }
    if (action === 'action') { handleAction(); return; }
    engineRef.current?.pressDirection(action);
  };

  const handleChoice = (idx) => {
    if (choices?.onSelect) choices.onSelect(idx);
    setChoices(null);
  };

  const toggleMute = () => {
    const next = !muted;
    engineRef.current?.setMuted(next);
    setMuted(next);
  };

  const persistSave = (engine = engineRef.current, notify = true) => {
    if (!engine || engine.state.saveAccess === false) {
      if (notify) toast({ title: 'セーブは現在使用できません' });
      return false;
    }
    try {
      localStorage.setItem(saveKey(id), JSON.stringify(engine.createSaveData()));
      setHasSave(true);
      if (notify) toast({ title: 'セーブしました' });
      return true;
    } catch {
      if (notify) toast({ title: 'セーブに失敗しました', variant: 'destructive' });
      return false;
    }
  };

  const loadSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey(id)) || 'null');
      if (!engineRef.current?.restoreSaveData(saved)) throw new Error('invalid save');
      setShowMenu(false);
      toast({ title: 'セーブデータを読み込みました' });
    } catch {
      toast({ title: '読み込めるセーブデータがありません', variant: 'destructive' });
    }
  };

  const finishBattle = (result) => {
    battle?.resolve?.({ result });
    setBattle(null);
    if (result === 'defeat') toast({ title: 'ゲームオーバー', variant: 'destructive' });
  };

  const attackInBattle = (skill = null) => {
    if (!battle) return;
    const actor = battle.actors.find(item => (item?.hp ?? 1) > 0) || battle.actors[0] || { attack: 10, defense: 5, hp: 1 };
    const targetIndex = battle.enemies.findIndex(enemy => enemy.hp > 0);
    if (targetIndex < 0) { finishBattle('victory'); return; }
    const mpCost = Number(skill?.mpCost) || 0;
    if (skill && (Number(actor.mp) || 0) < mpCost) { setBattle({ ...battle, log: `${actor.name}のMPが足りません。` }); return; }
    const attack = Number(actor[skill?.type === 'magic' ? 'magicAttack' : 'attack']) || 10;
    const power = skill ? Number(skill.power) || 0 : attack;
    const damage = Math.max(1, Math.round(power + attack - (Number(battle.enemies[targetIndex].defense) || 0) / 2));
    const enemies = battle.enemies.map((enemy, index) => index === targetIndex ? { ...enemy, hp: Math.max(0, enemy.hp - damage) } : enemy);
    const target = enemies[targetIndex];
    const actorsWithCost = skill ? battle.actors.map(item => item?.id === actor.id ? { ...item, mp: Math.max(0, (Number(item.mp) || 0) - mpCost) } : item) : battle.actors;
    const actionName = skill?.name || '攻撃';
    if (enemies.every(enemy => enemy.hp <= 0)) {
      const gold = enemies.reduce((sum, enemy) => sum + (Number(enemy.gold) || 0), 0);
      if (engineRef.current) {
        engineRef.current.state.gold += gold;
        engineRef.current.notifyState();
      }
      setBattle({ ...battle, actors: actorsWithCost, enemies, visualEffect: skill?.effectGraphic || skill?.icon || '', log: `${actionName}！ ${target.name}に${damage}ダメージ。勝利！` });
      setTimeout(() => finishBattle('victory'), 450);
      return;
    }
    const attacker = enemies.find(enemy => enemy.hp > 0);
    const retaliation = Math.max(1, Math.round((Number(attacker.attack) || 8) - (Number(actor.defense) || 0) / 2));
    const actors = actorsWithCost.map(item => item?.id === actor.id ? { ...item, hp: Math.max(0, (Number(item.hp) || 1) - retaliation) } : item);
    if (engineRef.current && actor.id && engineRef.current.state.actorStates[actor.id]) {
      engineRef.current.state.actorStates[actor.id].hp = actors.find(item => item.id === actor.id)?.hp || 0;
      engineRef.current.notifyState();
    }
    if (actors.length && actors.every(item => (item?.hp || 0) <= 0)) {
      setBattle({ ...battle, actors, enemies, visualEffect: skill?.effectGraphic || skill?.icon || '', log: `${actionName}！ ${attacker.name}から${retaliation}ダメージ。敗北しました。` });
      setTimeout(() => finishBattle('defeat'), 600);
      return;
    }
    setBattle({ ...battle, actors, enemies, visualEffect: skill?.effectGraphic || skill?.icon || '', log: `${actionName}！ ${target.name}に${damage}ダメージ。${attacker.name}から${retaliation}ダメージ。` });
  };

  const closeShop = () => {
    shop?.onClose?.();
    setShop(null);
  };

  const buyShopItem = (entry) => {
    const item = shopCatalog.find(candidate => candidate.id === entry.itemId);
    if (!item || !engineRef.current) return;
    const basePrice = Number(entry.price) || Number(item.price) || 0;
    const price = Math.max(0, Math.round(basePrice * (Number(shop.buyRate) || 100) / 100));
    if (engineRef.current.state.gold < price) { toast({ title: '所持金が足りません' }); return; }
    engineRef.current.state.gold -= price;
    engineRef.current.state.items[item.id] = (engineRef.current.state.items[item.id] || 0) + 1;
    engineRef.current.notifyState();
    toast({ title: `${item.name}を購入しました` });
  };

  const submitNumber = () => {
    if (!numberInput) return;
    const max = (10 ** Math.min(9, Math.max(1, numberInput.digits))) - 1;
    numberInput.callback(Math.min(max, Math.max(0, Number(numberInput.value) || 0)));
    setNumberInput(null);
  };

  const handleSettingChange = (item, value) => {
    engineRef.current?.setSettingValue(item.id, value);
    setSettingsValues(prev => ({ ...prev, [item.id]: value }));
  };

  const restart = () => {
    clearTimeout(autoSaveTimer.current);
    setMessage(null);
    setChoices(null);
    setNumberInput(null);
    setBattle(null);
    setShop(null);
    setShowMenu(false);
    setShowSettings(false);
    if (game?.game_data) {
      engineRef.current?.stop();
      engineRef.current = null;
      pendingGameData.current = game.game_data;
      initEngine(game.game_data);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-zinc-400">ゲームが見つかりません</p>
        <Link to="/browse"><Button variant="outline">ゲーム一覧へ</Button></Link>
      </div>
    );
  }

  const touchEnabled = controlConfig.touchEnabled === true;
  const touchSwitchId = controlConfig.touchSwitchId;
  const touchSwitchVal = touchSwitchId ? engineRef.current?.state?.switches?.[touchSwitchId] : undefined;
  const showTouchControls = isTouch && touchEnabled && (!touchSwitchId || touchSwitchVal !== false);

  const showHUD = controlConfig.showHUD !== false;
  const showGold = controlConfig.showGold !== false;
  const showMapName = controlConfig.showMapName !== false;
  const showSettingsBtn = controlConfig.showSettingsButton !== false;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/game/${id}`} className="text-zinc-400 hover:text-white flex-shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm font-medium text-zinc-200 truncate">{game.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {showHUD && showMapName && <span className="hidden sm:inline">{hud.mapName}</span>}
          {showHUD && showGold && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">{hud.gold} G</span>}
          <button onClick={toggleMute} className="p-1 text-zinc-400 hover:text-white">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {showSettingsBtn && settingsScreen.length > 0 && (
            <button onClick={() => { setShowSettings(true); }} className="p-1 text-zinc-400 hover:text-white">
              <SettingsIcon size={16} />
            </button>
          )}
          <button onClick={handleMenu} className="p-1 text-zinc-400 hover:text-white">
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* Game canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Touch controls */}
        {showTouchControls && !message && !choices && !showMenu && !showSettings && !battle && !numberInput && !shop && (
          <TouchControls
            onDirection={handleDirection}
            onAction={handleAction}
            onCancel={handleCancel}
            onMenu={handleMenu}
            onCustom={handleCustom}
            config={controlConfig}
          />
        )}

        {/* Message box */}
        {message && (
          <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-6">
            <div
              className="max-w-2xl mx-auto bg-zinc-900/95 border-2 border-violet-500/40 rounded-xl p-4 shadow-2xl cursor-pointer"
              onClick={closeMessage}
            >
              <p className="text-sm sm:text-base text-zinc-100 whitespace-pre-wrap leading-relaxed">{message.text}</p>
              <div className="flex justify-end mt-2">
                <span className="text-xs text-violet-400 animate-pulse">▼</span>
              </div>
            </div>
          </div>
        )}

        {/* Choices */}
        {choices && (
          <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-6">
            <div className="max-w-md mx-auto bg-zinc-900/95 border-2 border-violet-500/40 rounded-xl p-3 shadow-2xl space-y-2">
              {choices.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(idx)}
                  className="w-full text-left px-4 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-violet-600/30 border border-zinc-700 hover:border-violet-500/50 text-sm text-zinc-200 transition"
                >
                  {opt || `選択肢 ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Number input */}
        {numberInput && (
          <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
            <form onSubmit={(event) => { event.preventDefault(); submitNumber(); }} className="w-full max-w-xs rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
              <div>
                <h3 className="font-bold text-zinc-100">数値入力</h3>
                <p className="mt-1 text-xs text-zinc-500">{numberInput.varName}（最大 {numberInput.digits} 桁）</p>
              </div>
              <input
                autoFocus
                type="number"
                min="0"
                max={(10 ** Math.min(9, Math.max(1, numberInput.digits))) - 1}
                value={numberInput.value}
                onChange={event => setNumberInput({ ...numberInput, value: event.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-right text-xl text-zinc-100 outline-none focus:border-violet-500"
              />
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">決定</Button>
            </form>
          </div>
        )}

        {/* Built-in turn battle */}
        {battle && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-slate-950/95 to-zinc-950/95 p-4" style={game?.game_data?.system?.battleBackground ? { backgroundImage: `linear-gradient(rgba(2,6,23,.86),rgba(9,9,11,.9)), url(${game.game_data.system.battleBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-5 shadow-2xl">
              {battle.visualEffect && <img src={battle.visualEffect} alt="" className="pointer-events-none absolute inset-0 m-auto h-36 w-36 animate-pulse object-contain opacity-60" />}
              <div className="flex items-center gap-2 text-violet-300">
                <Swords size={20} />
                <h3 className="font-bold">{battle.troop.name || 'バトル'}</h3>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500">味方</p>
                  {battle.actors.map((actor, index) => (
                    <div key={actor?.id || index} className="flex items-center gap-3 rounded-lg bg-zinc-800/70 p-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-violet-500/15 text-xs text-violet-300">{actor?.graphic || actor?.faceGraphic ? <img src={actor.faceGraphic || actor.graphic} alt="" className="h-full w-full object-cover" /> : (actor?.name || '?').slice(0, 1)}</span>
                      <div className="min-w-0 flex-1"><div className="flex justify-between text-sm text-zinc-200"><span className="truncate">{actor?.name || `味方 ${index + 1}`}</span><span>{actor?.hp || 0} HP</span></div><div className="mt-1 text-xs text-sky-300">MP {actor?.mp || 0}</div></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500">敵</p>
                  {battle.enemies.map(enemy => (
                    <div key={enemy.id} className={`flex items-center gap-3 rounded-lg p-3 ${enemy.hp > 0 ? 'bg-red-950/40' : 'bg-zinc-800/40 opacity-50'}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-red-500/15 text-xs text-red-300">{enemy.graphic ? <img src={enemy.graphic} alt="" className="h-full w-full object-cover" /> : enemy.name.slice(0, 1)}</span>
                      <div className="min-w-0 flex-1"><div className="flex justify-between text-sm text-zinc-200"><span className="truncate">{enemy.name}</span><span>{enemy.hp}/{enemy.maxHp} HP</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-red-500 transition-all" style={{ width: `${enemy.hp / enemy.maxHp * 100}%` }} /></div></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 min-h-6 text-sm text-zinc-300">{battle.log}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button onClick={() => attackInBattle()} className="bg-violet-600 hover:bg-violet-500"><Swords size={15} className="mr-2" />攻撃</Button>
                {battleSkills.slice(0, 5).map(skill => <Button key={skill.id} onClick={() => attackInBattle(skill)} variant="outline" className="justify-start border-zinc-700 text-zinc-100"><span className="mr-2 flex h-5 w-5 shrink-0 overflow-hidden rounded bg-violet-500/15">{skill.icon && <img src={skill.icon} alt="" className="h-full w-full object-cover" />}</span><span className="truncate">{skill.name || 'スキル'}</span><span className="ml-auto text-xs text-sky-300">{skill.mpCost || 0}</span></Button>)}
                <Button onClick={() => finishBattle('escape')} variant="outline" className="border-zinc-700">逃げる</Button>
              </div>
            </div>
          </div>
        )}

        {/* Built-in shop */}
        {shop && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-zinc-100"><ShoppingBag size={19} className="text-violet-400" />{shop.name || 'ショップ'}</h3>
                <button onClick={closeShop} className="text-zinc-500 hover:text-white"><X size={19} /></button>
              </div>
              {shop.message && <p className="mt-2 text-sm text-zinc-400">{shop.message}</p>}
              <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
                {!(shop.items || []).length && <p className="py-8 text-center text-sm text-zinc-500">商品がありません</p>}
                {(shop.items || []).map((entry, index) => {
                  const item = shopCatalog.find(candidate => candidate.id === entry.itemId);
                  if (!item) return null;
                  const price = Math.max(0, Math.round((Number(entry.price) || Number(item.price) || 0) * (Number(shop.buyRate) || 100) / 100));
                  return <div key={`${entry.itemId}_${index}`} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-200">{item.name}</p><p className="truncate text-xs text-zinc-500">{item.description || '商品'} · 所持 {hud.items[item.id] || 0}</p></div><span className="text-sm text-amber-400">{price} G</span><Button size="sm" disabled={hud.gold < price} onClick={() => buyShopItem(entry)} className="h-8 bg-violet-600 hover:bg-violet-500">購入</Button></div>;
                })}
              </div>
              <Button onClick={closeShop} variant="outline" className="mt-4 w-full border-zinc-700">閉じる</Button>
            </div>
          </div>
        )}

        {/* Settings screen */}
        {showSettings && (
          <div className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-100">設定</h3>
                <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {settingsScreen.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">設定項目がありません</p>
              ) : settingsScreen.map(item => (
                <div key={item.id} className="space-y-2">
                  <label className="text-sm text-zinc-300">{item.label}</label>
                  {item.type === 'toggle' && (
                    <button
                      onClick={() => handleSettingChange(item, !settingsValues[item.id])}
                      className={`relative w-12 h-6 rounded-full transition ${settingsValues[item.id] ? 'bg-violet-600' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${settingsValues[item.id] ? 'translate-x-6' : ''}`} />
                    </button>
                  )}
                  {item.type === 'slider' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={item.min || 0}
                        max={item.max || 100}
                        value={settingsValues[item.id] ?? item.defaultValue ?? 0}
                        onChange={(e) => handleSettingChange(item, parseInt(e.target.value))}
                        className="flex-1 accent-violet-600"
                      />
                      <span className="text-xs text-zinc-400 w-10 text-right">{settingsValues[item.id] ?? item.defaultValue ?? 0}</span>
                    </div>
                  )}
                  {item.type === 'select' && (
                    <select
                      value={settingsValues[item.id] ?? item.defaultValue ?? 0}
                      onChange={(e) => handleSettingChange(item, parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200"
                    >
                      {(item.options || []).map((opt, idx) => (
                        <option key={idx} value={idx}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pause menu */}
        {showMenu && (
          <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-72 space-y-3">
              <h3 className="text-lg font-bold text-center text-zinc-100 mb-2">メニュー</h3>
              {settingsScreen.length > 0 && (
                <Button onClick={() => { setShowMenu(false); setShowSettings(true); }} variant="outline" className="w-full border-zinc-700">
                  <SettingsIcon size={16} className="mr-2" /> 設定
                </Button>
              )}
              <Button onClick={() => persistSave()} variant="outline" className="w-full border-zinc-700">
                <Save size={16} className="mr-2" /> セーブ
              </Button>
              <Button onClick={loadSave} disabled={!hasSave} variant="outline" className="w-full border-zinc-700">
                <FolderOpen size={16} className="mr-2" /> 続きから
              </Button>
              <Button onClick={restart} className="w-full bg-violet-600 hover:bg-violet-500">
                <RotateCcw size={16} className="mr-2" /> 最初から
              </Button>
              <Link to={`/game/${id}`} className="block">
                <Button variant="outline" className="w-full border-zinc-700">
                  <Home size={16} className="mr-2" /> ゲーム詳細へ
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setShowMenu(false)} className="w-full border-zinc-700">
                閉じる
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GameEngine } from '@/lib/gameEngine';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import TouchControls from '@/components/game/TouchControls';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Home, Settings as SettingsIcon, X } from 'lucide-react';

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
  const pendingGameData = useRef(null);

  const controlConfig = game?.game_data?.controlConfig || {};
  const settingsScreen = game?.game_data?.settingsScreen || [];

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
  }, [id]);

  useEffect(() => {
    if (!loading && game && pendingGameData.current && !engineRef.current) {
      initEngine(pendingGameData.current);
    }
  }, [loading, game]);

  const loadGame = async () => {
    try {
      const data = await base44.entities.Game.get(id);
      setGame(data);
      if (!data.game_data?.maps?.length) {
        toast({ title: 'マップデータがありません', variant: 'destructive' });
        setLoading(false);
        return;
      }
      pendingGameData.current = data.game_data;
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
      if (message || choices || showMenu || showSettings) {
        // Handle message/choices dismissal with action key
        const action = keyToAction[e.key] || keyToAction[e.key.toLowerCase()];
        if (action === 'action' && message) { closeMessage(); return; }
        if (action === 'cancel' && message) { closeMessage(); return; }
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
  }, [keyToAction, message, choices, showMenu, showSettings]);

  const closeMessage = () => {
    if (message?.onClose) message.onClose();
    setMessage(null);
  };

  const handleDirection = (dir) => {
    if (message || choices || showMenu || showSettings) return;
    engineRef.current?.pressDirection(dir);
  };

  const handleAction = () => {
    if (message) { closeMessage(); return; }
    if (choices || showMenu || showSettings) return;
    engineRef.current?.pressAction();
  };

  const handleCancel = () => {
    if (message) { closeMessage(); return; }
    if (choices) return;
    setShowMenu(true);
  };

  const handleMenu = () => {
    if (message || choices) return;
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
    const engine = engineRef.current;
    if (muted) {
      engine?.stopBGM();
    } else {
      engine?.stopBGM();
    }
    setMuted(!muted);
  };

  const handleSettingChange = (item, value) => {
    engineRef.current?.setSettingValue(item.id, value);
    setSettingsValues(prev => ({ ...prev, [item.id]: value }));
  };

  const restart = () => {
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
          <button onClick={() => setShowMenu(true)} className="p-1 text-zinc-400 hover:text-white">
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
        {showTouchControls && !message && !choices && !showMenu && !showSettings && (
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
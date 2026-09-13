import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Save, Play, Download, ArrowLeft, Check, Menu, X, Undo2, Redo2, AlertTriangle
} from 'lucide-react';
import MapEditor from '@/components/editor/MapEditor';
import EventEditor from '@/components/editor/EventEditor';
import DatabaseEditor from '@/components/editor/DatabaseEditor';
import SystemEditor from '@/components/editor/SystemEditor';
import PublishSettings from '@/components/editor/PublishSettings';
import AIAssist from '@/components/editor/AIAssist';
import PluginManager from '@/components/editor/PluginManager';
import ControlEditor from '@/components/editor/ControlEditor';
import SettingsScreenEditor from '@/components/editor/SettingsScreenEditor';
import EditorSidebar from '@/components/editor/EditorSidebar';
import { cloneData, normalizeGameData, validateGameData } from '@/lib/gameData';

export default function GameEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [activeView, setActiveView] = useState('map');
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimer = useRef(null);
  const titleTimer = useRef(null);
  const lastSaved = useRef(null);
  const gameRef = useRef(null);
  const gameDataRef = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const history = useRef({ past: [], future: [], group: null });
  const canUndo = historyVersion >= 0 && history.current.past.length > 0;
  const canRedo = historyVersion >= 0 && history.current.future.length > 0;

  useEffect(() => {
    loadGame();
  }, [id]);

  const loadGame = async () => {
    try {
      const data = await base44.entities.Game.get(id);
      setGame(data);
      const gd = normalizeGameData(data.game_data);
      setGameData(gd);
      gameRef.current = data;
      gameDataRef.current = gd;
      lastSaved.current = JSON.stringify(gd);
      if (gd.maps && gd.maps.length > 0) {
        setSelectedMapId(gd.maps[0].id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const doSave = useCallback(async (dataToSave) => {
    const currentGame = gameRef.current;
    if (!currentGame || !dataToSave) return true;
    const snapshot = JSON.stringify(dataToSave);
    if (snapshot === lastSaved.current) {
      setSaveStatus('saved');
      return true;
    }
    setSaveStatus('saving');
    try {
      const operation = saveQueue.current
        .catch(() => undefined)
        .then(() => base44.entities.Game.update(currentGame.id, { game_data: dataToSave }));
      saveQueue.current = operation;
      await operation;
      lastSaved.current = snapshot;
      const latest = JSON.stringify(gameDataRef.current);
      setSaveStatus(latest === snapshot ? 'saved' : 'dirty');
      return true;
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      toast({ title: t('error'), variant: 'destructive' });
      return false;
    }
  }, [t]);

  const scheduleSave = useCallback((newData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(newData), 1200);
  }, [doSave]);

  const updateGameData = useCallback((updater, options = {}) => {
    setGameData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (!next || next === prev || JSON.stringify(next) === JSON.stringify(prev)) return prev;
      const group = options.historyGroup || null;
      if (!group || history.current.group !== group) {
        history.current.past.push(cloneData(prev));
        if (history.current.past.length > 100) history.current.past.shift();
      }
      history.current.group = group;
      history.current.future = [];
      gameDataRef.current = next;
      setSaveStatus('dirty');
      setHistoryVersion(value => value + 1);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const endHistoryGroup = useCallback(() => {
    history.current.group = null;
  }, []);

  const restoreHistory = useCallback((direction) => {
    const source = direction === 'undo' ? history.current.past : history.current.future;
    if (!source.length || !gameDataRef.current) return;
    const target = source.pop();
    const destination = direction === 'undo' ? history.current.future : history.current.past;
    destination.push(cloneData(gameDataRef.current));
    history.current.group = null;
    gameDataRef.current = target;
    setGameData(target);
    setSaveStatus('dirty');
    setHistoryVersion(value => value + 1);
    scheduleSave(target);
  }, [scheduleSave]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        doSave(gameDataRef.current);
      } else if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        restoreHistory('undo');
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        restoreHistory('redo');
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && gameDataRef.current) doSave(gameDataRef.current);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (titleTimer.current) clearTimeout(titleTimer.current);
    };
  }, [doSave, restoreHistory]);

  const handleSaveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const saved = await doSave(gameDataRef.current);
    if (saved) toast({ title: t('editor_saved') });
  };

  const handleTitleChange = (title) => {
    const next = { ...gameRef.current, title };
    gameRef.current = next;
    setGame(next);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      try {
        await base44.entities.Game.update(next.id, { title: title.trim() || t('dash_new_game') });
      } catch (error) {
        console.error(error);
        toast({ title: t('error'), variant: 'destructive' });
      }
    }, 600);
  };

  const handleTest = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (await doSave(gameDataRef.current)) navigate(`/play/${gameRef.current.id}`);
  };

  const handleExport = () => {
    if (!game || !user) return;
    if (game.created_by_id !== user.id) {
      toast({ title: t('export_note'), description: t('export_login_required'), variant: 'destructive' });
      return;
    }
    const errors = validateGameData(gameData);
    if (errors.length) {
      toast({ title: '書き出し前に修正が必要です', description: errors[0], variant: 'destructive' });
      return;
    }
    const exportData = {
      format: 'rpgedit_game', version: '2.0',
      title: game.title, description: game.description, tags: game.tags,
      platform_tags: game.platform_tags, cover_image: game.cover_image,
      game_data: gameData, exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}.rpgedit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelect = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (!gameData) return null;
    if (activeView?.startsWith('database:')) {
      const tab = activeView.split(':')[1];
      return <DatabaseEditor gameData={gameData} updateGameData={updateGameData} dbTab={tab} />;
    }
    switch (activeView) {
      case 'map':
        return <MapEditor gameData={gameData} updateGameData={updateGameData} endHistoryGroup={endHistoryGroup} selectedMapId={selectedMapId} setSelectedMapId={setSelectedMapId} />;
      case 'event':
        return <EventEditor gameData={gameData} updateGameData={updateGameData} selectedMapId={selectedMapId} />;
      case 'system':
        return <SystemEditor gameData={gameData} updateGameData={updateGameData} />;
      case 'plugins':
        return <PluginManager gameData={gameData} updateGameData={updateGameData} />;
      case 'controls':
        return <ControlEditor gameData={gameData} updateGameData={updateGameData} />;
      case 'settings-screen':
        return <SettingsScreenEditor gameData={gameData} updateGameData={updateGameData} />;
      case 'ai':
        return <AIAssist gameData={gameData} updateGameData={updateGameData} gameId={game.id} />;
      case 'publish':
        return <PublishSettings game={game} setGame={setGame} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-400">{t('noData')}</p>
        <Link to="/dashboard"><Button variant="outline">{t('nav_dashboard')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#12121a] border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
            <Menu size={18} />
          </button>
          <Link to="/dashboard" className="text-zinc-400 hover:text-white flex-shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <input
            type="text"
            value={game.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent text-sm font-medium border-none outline-none focus:bg-zinc-800/50 rounded px-2 py-1 max-w-[200px]"
          />
          {saveStatus === 'saving' ? (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> {t('editor_saving')}
            </span>
          ) : saveStatus === 'error' ? (
            <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> 保存エラー</span>
          ) : saveStatus === 'dirty' ? (
            <span className="text-xs text-amber-400 flex items-center gap-1">未保存</span>
          ) : (
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <Check size={12} /> {t('editor_saved')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center">
            <Button aria-label="元に戻す" title="元に戻す (Ctrl+Z)" size="icon" variant="ghost" disabled={!canUndo} onClick={() => restoreHistory('undo')} className="h-8 w-8 text-zinc-300 hover:bg-zinc-800">
              <Undo2 size={15} />
            </Button>
            <Button aria-label="やり直す" title="やり直す (Ctrl+Y)" size="icon" variant="ghost" disabled={!canRedo} onClick={() => restoreHistory('redo')} className="h-8 w-8 text-zinc-300 hover:bg-zinc-800">
              <Redo2 size={15} />
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleSaveNow} className="text-zinc-300 hover:bg-zinc-800">
            <Save size={15} className="mr-1" /> {t('save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport} className="text-zinc-300 hover:bg-zinc-800">
            <Download size={15} className="mr-1" /> {t('export')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleTest} className="text-violet-300 hover:bg-violet-600/20">
            <Play size={15} className="mr-1" /> {t('test')}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 border-r border-zinc-800 bg-[#0e0e14] flex-shrink-0">
          <EditorSidebar
            gameData={gameData}
            activeView={activeView}
            onSelect={handleSelect}
            selectedMapId={selectedMapId}
            onSelectMap={setSelectedMapId}
          />
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-64 bg-[#0e0e14] border-r border-zinc-800 h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-sm font-medium text-zinc-300">{t('editor_navigation')}</span>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <EditorSidebar
                gameData={gameData}
                activeView={activeView}
                onSelect={handleSelect}
                selectedMapId={selectedMapId}
                onSelectMap={setSelectedMapId}
              />
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

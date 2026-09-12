import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Save, Play, Download, ArrowLeft, Check, Menu, X
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

export default function GameEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState('map');
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimer = useRef(null);
  const lastSaved = useRef(null);

  useEffect(() => {
    loadGame();
  }, [id]);

  const loadGame = async () => {
    try {
      const data = await base44.entities.Game.get(id);
      setGame(data);
      const gd = data.game_data || getDefaultGameData();
      setGameData(gd);
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

  const getDefaultGameData = () => ({
    maps: [], events: [], actors: [], classes: [], skills: [], items: [],
    weapons: [], armors: [], enemies: [], troops: [], states: [], animations: [],
    tilesets: [], commonEvents: [], shops: [], quests: [], vehicles: [],
    switches: [], variables: [],
    system: {
      battleSystem: 'turn', currency: 'G', titleScreen: '', battleBgm: '',
      gameOverBgm: '', startMapId: null, startX: 0, startY: 0,
    },
    types: [], terms: {}, plugins: [],
  });

  const scheduleSave = useCallback((newData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { doSave(newData); }, 2000);
  }, []);

  const doSave = async (dataToSave) => {
    if (!game || !dataToSave) return;
    const snapshot = JSON.stringify(dataToSave);
    if (snapshot === lastSaved.current) return;
    setSaving(true);
    try {
      await base44.entities.Game.update(game.id, { game_data: dataToSave });
      lastSaved.current = snapshot;
    } catch (e) {
      console.error(e);
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateGameData = (updater) => {
    setGameData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      scheduleSave(next);
      return next;
    });
  };

  const handleSaveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await doSave(gameData);
    toast({ title: t('editor_saved') });
  };

  const handleExport = () => {
    if (!game || !user) return;
    if (game.created_by_id !== user.id) {
      toast({ title: t('export_note'), description: t('export_login_required'), variant: 'destructive' });
      return;
    }
    const exportData = {
      format: 'rpgedit_game', version: '1.0',
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
        return <MapEditor gameData={gameData} updateGameData={updateGameData} selectedMapId={selectedMapId} setSelectedMapId={setSelectedMapId} />;
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
            onChange={(e) => {
              setGame({ ...game, title: e.target.value });
              base44.entities.Game.update(game.id, { title: e.target.value });
            }}
            className="bg-transparent text-sm font-medium border-none outline-none focus:bg-zinc-800/50 rounded px-2 py-1 max-w-[200px]"
          />
          {saving ? (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> {t('editor_saving')}
            </span>
          ) : (
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <Check size={12} /> {t('editor_saved')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleSaveNow} className="text-zinc-300 hover:bg-zinc-800">
            <Save size={15} className="mr-1" /> {t('save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport} className="text-zinc-300 hover:bg-zinc-800">
            <Download size={15} className="mr-1" /> {t('export')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/play/${game.id}`)} className="text-violet-300 hover:bg-violet-600/20">
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
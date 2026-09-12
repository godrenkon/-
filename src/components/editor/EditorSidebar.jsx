import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  Map as MapIcon, Zap, Database, Settings, Puzzle, Gamepad2,
  SlidersHorizontal, Brain, Share2, ChevronRight, ChevronDown,
  Plus, FileText, ShoppingBag, ScrollText, Car, ToggleLeft, Hash
} from 'lucide-react';

const DB_ITEMS = [
  { id: 'actors', icon: null, labelKey: 'db_tab_actors' },
  { id: 'classes', icon: null, labelKey: 'db_tab_classes' },
  { id: 'skills', icon: null, labelKey: 'db_tab_skills' },
  { id: 'items', icon: null, labelKey: 'db_tab_items' },
  { id: 'weapons', icon: null, labelKey: 'db_tab_weapons' },
  { id: 'armors', icon: null, labelKey: 'db_tab_armors' },
  { id: 'enemies', icon: null, labelKey: 'db_tab_enemies' },
  { id: 'troops', icon: null, labelKey: 'db_tab_troops' },
  { id: 'states', icon: null, labelKey: 'db_tab_states' },
  { id: 'animations', icon: null, labelKey: 'db_tab_animations' },
  { id: 'tilesets', icon: null, labelKey: 'db_tab_tilesets' },
  { id: 'commonEvents', icon: null, labelKey: 'db_tab_common_events' },
  { id: 'shops', icon: ShoppingBag, labelKey: 'db_tab_shops' },
  { id: 'quests', icon: ScrollText, labelKey: 'db_tab_quests' },
  { id: 'vehicles', icon: Car, labelKey: 'db_tab_vehicles' },
  { id: 'switches', icon: ToggleLeft, labelKey: 'db_tab_switches' },
  { id: 'variables', icon: Hash, labelKey: 'db_tab_variables' },
];

export default function EditorSidebar({ gameData, activeView, onSelect, selectedMapId, onSelectMap }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState({ maps: true, events: false, database: false });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const maps = gameData?.maps || [];

  const itemClass = (active) => `flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${active ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`;
  const sectionClass = (active) => `flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${active ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-300 hover:bg-zinc-800/50'}`;

  return (
    <div className="h-full overflow-y-auto py-2">
      <div className="px-2 mb-1">
        <button onClick={() => toggle('maps')} className={sectionClass(activeView === 'map')}>
          {expanded.maps ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <MapIcon size={15} /> {t('editor_tab_map')}
        </button>
        {expanded.maps && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
            {maps.length === 0 && <p className="text-xs text-zinc-600 px-3 py-1">{t('editor_no_maps')}</p>}
            {maps.map(m => (
              <button key={m.id} onClick={() => { onSelectMap(m.id); onSelect('map'); }} className={itemClass(selectedMapId === m.id && activeView === 'map')}>
                <FileText size={13} className="flex-shrink-0 text-zinc-500" /><span className="truncate">{m.name || t('editor_untitled_map')}</span>
              </button>
            ))}
            <button onClick={() => onSelect('map')} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-500 hover:text-violet-400 rounded-md">
              <Plus size={13} /> {t('editor_new_map')}
            </button>
          </div>
        )}
      </div>

      <div className="px-2 mb-1">
        <button onClick={() => toggle('events')} className={sectionClass(activeView === 'event')}>
          {expanded.events ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Zap size={15} /> {t('editor_tab_event')}
        </button>
        {expanded.events && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
            {maps.map(m => (
              <button key={m.id} onClick={() => { onSelectMap(m.id); onSelect('event'); }} className={itemClass(selectedMapId === m.id && activeView === 'event')}>
                <FileText size={13} className="flex-shrink-0 text-zinc-500" /><span className="truncate">{m.name || t('editor_untitled_map')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 mb-1">
        <button onClick={() => toggle('database')} className={sectionClass(activeView?.startsWith('database:'))}>
          {expanded.database ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Database size={15} /> {t('editor_tab_database')}
        </button>
        {expanded.database && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
            {DB_ITEMS.map(item => (
              <button key={item.id} onClick={() => onSelect(`database:${item.id}`)} className={itemClass(activeView === `database:${item.id}`)}>
                {item.icon ? <item.icon size={13} className="flex-shrink-0 text-zinc-500" /> : <FileText size={13} className="flex-shrink-0 text-zinc-500" />}
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 space-y-0.5">
        <button onClick={() => onSelect('system')} className={sectionClass(activeView === 'system')}>
          <span className="w-3.5" /><Settings size={15} /> {t('editor_tab_system')}
        </button>
        <button onClick={() => onSelect('plugins')} className={sectionClass(activeView === 'plugins')}>
          <span className="w-3.5" /><Puzzle size={15} /> {t('editor_tab_plugins')}
        </button>
        <button onClick={() => onSelect('controls')} className={sectionClass(activeView === 'controls')}>
          <span className="w-3.5" /><Gamepad2 size={15} /> {t('editor_tab_controls')}
        </button>
        <button onClick={() => onSelect('settings-screen')} className={sectionClass(activeView === 'settings-screen')}>
          <span className="w-3.5" /><SlidersHorizontal size={15} /> {t('editor_tab_settings_screen')}
        </button>
        <button onClick={() => onSelect('ai')} className={sectionClass(activeView === 'ai')}>
          <span className="w-3.5" /><Brain size={15} /> {t('editor_tab_ai')}
        </button>
        <button onClick={() => onSelect('publish')} className={sectionClass(activeView === 'publish')}>
          <span className="w-3.5" /><Share2 size={15} /> {t('editor_tab_settings')}
        </button>
      </div>
    </div>
  );
}
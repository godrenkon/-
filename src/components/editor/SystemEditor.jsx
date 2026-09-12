import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function SystemEditor({ gameData, updateGameData }) {
  const { t } = useI18n();
  const sys = gameData.system || {};
  const set = (field, value) => updateGameData(prev => ({ ...prev, system: { ...(prev.system || {}), [field]: value } }));
  const maps = gameData.maps || [];
  const actors = gameData.actors || [];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl space-y-5">
        <h2 className="text-lg font-semibold">{t('sys_title')}</h2>

        {/* Battle */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">{t('sys_battle_system')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('sys_battle_system')}</Label>
              <Select value={sys.battleSystem || 'turn'} onValueChange={(v) => set('battleSystem', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="turn">{t('sys_battle_turn')}</SelectItem><SelectItem value="atb">{t('sys_battle_atb')}</SelectItem></SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_currency')}</Label><Input value={sys.currency || 'G'} onChange={(e) => set('currency', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_battle_bg')}</Label><Input value={sys.battleBackground || ''} onChange={(e) => set('battleBackground', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_max_party')}</Label><Input type="number" value={sys.maxParty || 4} onChange={(e) => set('maxParty', parseInt(e.target.value) || 4)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>

        {/* Starting party + position */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">{t('sys_start_party')}</h3>
          <div>
            <Label className="text-xs text-zinc-400">{t('sys_start_party')}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {actors.map(a => (
                <label key={a.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={(sys.startParty || []).includes(a.id)} onChange={(e) => {
                    const sp = sys.startParty || [];
                    if (e.target.checked) set('startParty', [...sp, a.id]);
                    else set('startParty', sp.filter(id => id !== a.id));
                  }} className="w-3.5 h-3.5 rounded accent-violet-600" />
                  {a.name || `#${a.id}`}
                </label>
              ))}
              {actors.length === 0 && <p className="text-xs text-zinc-600">{t('noData')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('sys_start_map')}</Label>
              <Select value={sys.startMapId || ''} onValueChange={(v) => set('startMapId', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{maps.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_start_position')} X</Label><Input type="number" value={sys.startX || 0} onChange={(e) => set('startX', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_start_position')} Y</Label><Input type="number" value={sys.startY || 0} onChange={(e) => set('startY', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>

        {/* Audio */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">BGM / ME</h3>
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">{t('sys_title_screen')}</Label><Input value={sys.titleScreen || ''} onChange={(e) => set('titleScreen', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_start_bgm')}</Label><Input value={sys.startBgm || ''} onChange={(e) => set('startBgm', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_battle_bgm')}</Label><Input value={sys.battleBgm || ''} onChange={(e) => set('battleBgm', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_victory_me')}</Label><Input value={sys.victoryMe || ''} onChange={(e) => set('victoryMe', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_defeat_me')}</Label><Input value={sys.defeatMe || ''} onChange={(e) => set('defeatMe', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_game_over_bgm')}</Label><Input value={sys.gameOverBgm || ''} onChange={(e) => set('gameOverBgm', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>

        {/* Graphics */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">{t('sys_title_graphic')}</h3>
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">{t('sys_title_graphic')}</Label><Input value={sys.titleGraphic || ''} onChange={(e) => set('titleGraphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_gameover_graphic')}</Label><Input value={sys.gameOverGraphic || ''} onChange={(e) => set('gameOverGraphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_window_color')}</Label><Input value={sys.windowColor || ''} onChange={(e) => set('windowColor', e.target.value)} placeholder="#1a1a2e" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>

        {/* Game options */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">{t('settings_title')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('sys_encounter_rate')}</Label><Input type="number" value={sys.encounterRate || 0} onChange={(e) => set('encounterRate', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_text_speed')}</Label>
              <Select value={sys.textSpeed || 'normal'} onValueChange={(v) => set('textSpeed', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="slow">Slow</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="fast">Fast</SelectItem><SelectItem value="instant">Instant</SelectItem></SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('sys_msg_position')}</Label>
              <Select value={sys.msgPosition || 'bottom'} onValueChange={(v) => set('msgPosition', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="top">{t('sys_msg_top')}</SelectItem><SelectItem value="bottom">{t('sys_msg_bottom')}</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={sys.saveAccess !== false} onChange={(e) => set('saveAccess', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" /><span className="text-sm text-zinc-300">{t('sys_save_access')}</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={sys.menuAccess !== false} onChange={(e) => set('menuAccess', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" /><span className="text-sm text-zinc-300">{t('sys_menu_access')}</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={sys.formation !== false} onChange={(e) => set('formation', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" /><span className="text-sm text-zinc-300">{t('sys_formation')}</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={sys.autoSave || false} onChange={(e) => set('autoSave', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" /><span className="text-sm text-zinc-300">{t('sys_auto_save')}</span></label>
          </div>
        </div>
      </div>
    </div>
  );
}
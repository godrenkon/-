import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import CommandSequenceEditor from '@/components/editor/CommandSequenceEditor';

const DB_TABS = [
  { id: 'actors', key: 'db_tab_actors' },
  { id: 'classes', key: 'db_tab_classes' },
  { id: 'skills', key: 'db_tab_skills' },
  { id: 'items', key: 'db_tab_items' },
  { id: 'weapons', key: 'db_tab_weapons' },
  { id: 'armors', key: 'db_tab_armors' },
  { id: 'enemies', key: 'db_tab_enemies' },
  { id: 'troops', key: 'db_tab_troops' },
  { id: 'states', key: 'db_tab_states' },
  { id: 'animations', key: 'db_tab_animations' },
  { id: 'tilesets', key: 'db_tab_tilesets' },
  { id: 'commonEvents', key: 'db_tab_common_events' },
  { id: 'shops', key: 'db_tab_shops' },
  { id: 'quests', key: 'db_tab_quests' },
  { id: 'vehicles', key: 'db_tab_vehicles' },
  { id: 'switches', key: 'db_tab_switches' },
  { id: 'variables', key: 'db_tab_variables' },
  { id: 'types', key: 'db_tab_types' },
  { id: 'terms', key: 'db_tab_terms' },
];

const STAT_FIELDS = [
  { key: 'hp', labelKey: 'db_hp' }, { key: 'mp', labelKey: 'db_mp' },
  { key: 'attack', labelKey: 'db_attack' }, { key: 'defense', labelKey: 'db_defense' },
  { key: 'magicAttack', labelKey: 'db_magic_attack' }, { key: 'magicDefense', labelKey: 'db_magic_defense' },
  { key: 'agility', labelKey: 'db_agility' }, { key: 'luck', labelKey: 'db_luck' },
];

const TARGETS = [
  { value: 'none', key: 'db_target_none' }, { value: 'enemy', key: 'db_target_enemy' },
  { value: 'enemy_all', key: 'db_target_enemy_all' }, { value: 'ally', key: 'db_target_ally' },
  { value: 'ally_all', key: 'db_target_ally_all' }, { value: 'self', key: 'db_target_self' },
];

export default function DatabaseEditor({ gameData, updateGameData, dbTab }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(dbTab || 'actors');
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => { if (dbTab) setActiveTab(dbTab); }, [dbTab]);

  const getList = (tabId) => gameData[tabId] || [];
  const currentList = getList(activeTab);
  const selectedItem = currentList[selectedIdx];

  const addItem = () => {
    const newItem = createDefaultItem(activeTab);
    updateGameData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), newItem] }));
    setSelectedIdx(currentList.length);
  };
  const deleteItem = (idx) => {
    if (!confirm(t('deleteConfirm'))) return;
    updateGameData(prev => ({ ...prev, [activeTab]: (prev[activeTab] || []).filter((_, i) => i !== idx) }));
    if (selectedIdx >= idx && selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  };
  const updateItem = (idx, field, value) => {
    updateGameData(prev => { const nl = [...(prev[activeTab] || [])]; nl[idx] = { ...nl[idx], [field]: value }; return { ...prev, [activeTab]: nl }; });
  };

  return (
    <div className="flex h-full">
      <div className="w-44 bg-[#0e0e14] border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="p-2 border-b border-zinc-800"><span className="text-xs font-medium text-zinc-400 px-1">{t('db_title')}</span></div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {DB_TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedIdx(0); }}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition ${activeTab === tab.id ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
              {t(tab.key)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex min-w-0">
        <div className="w-56 bg-[#0a0a0f] border-r border-zinc-800 flex flex-col flex-shrink-0">
          <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">{currentList.length}</span>
            <button onClick={addItem} className="text-zinc-400 hover:text-violet-400 p-1"><Plus size={15} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {currentList.length === 0 ? <p className="text-xs text-zinc-600 p-2 text-center">{t('noData')}</p>
              : currentList.map((item, idx) => (
                <div key={idx} onClick={() => setSelectedIdx(idx)}
                  className={`group flex items-center px-2 py-1.5 rounded text-xs cursor-pointer transition ${idx === selectedIdx ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                  <span className="truncate flex-1">{item.name || `#${idx + 1}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteItem(idx); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 ml-1"><Trash2 size={12} /></button>
                </div>
              ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedItem ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
              <p className="text-sm">{t('noData')}</p>
              <Button onClick={addItem} size="sm" className="bg-violet-600 hover:bg-violet-500"><Plus size={14} className="mr-1" /> {t('db_add')}</Button>
            </div>
          ) : (
            <ItemEditor tab={activeTab} item={selectedItem} updateItem={(field, value) => updateItem(selectedIdx, field, value)} gameData={gameData} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function createDefaultItem(tabId) {
  const base = { id: `${tabId}_${Date.now()}`, name: '', description: '' };
  switch (tabId) {
    case 'actors': return { ...base, graphic: '', faceGraphic: '', classId: '', level: 1, initialLevel: 1, maxLevel: 99, hp: 100, mp: 20, attack: 10, defense: 5, magicAttack: 8, magicDefense: 5, agility: 8, luck: 5, equipment: { weapon: '', armor: '' } };
    case 'classes': return { ...base, hpGrowth: 10, mpGrowth: 2, attackGrowth: 2, defenseGrowth: 1, magicAttackGrowth: 1.5, magicDefenseGrowth: 1, agilityGrowth: 1, luckGrowth: 0.5, learnSkills: [] };
    case 'skills': return { ...base, mpCost: 5, power: 10, hitRate: 100, element: '', target: 'enemy', animation: '', formula: 'a.atk * 2 - b.def', type: 'magic', scope: 'damage' };
    case 'items': return { ...base, price: 50, type: 'consumable', effects: '', icon: '', hpRecover: 0, mpRecover: 0, target: 'ally' };
    case 'weapons': return { ...base, price: 100, attack: 10, type: 'weapon', icon: '', element: '' };
    case 'armors': return { ...base, price: 80, defense: 5, type: 'armor', icon: '', slot: 'body' };
    case 'enemies': return { ...base, hp: 50, mp: 10, attack: 8, defense: 3, magicAttack: 6, magicDefense: 2, agility: 5, luck: 3, exp: 10, gold: 20, dropItem: '', dropRate: 100, graphic: '', actions: [] };
    case 'troops': return { ...base, members: [], battleEvents: [] };
    case 'states': return { ...base, priority: 50, duration: 3, removeAtBattleEnd: true, effects: '', restriction: 'none', message: '' };
    case 'animations': return { ...base, frames: [], type: 'skill', graphic: '', se: '' };
    case 'tilesets': return { ...base, tiles: [], passageMap: {}, terrainMap: {}, damageTiles: [] };
    case 'commonEvents': return { ...base, trigger: 'none', condition: '', commands: [] };
    case 'shops': return { ...base, items: [], buyRate: 100, sellRate: 50, message: '' };
    case 'quests': return { ...base, objectives: [], rewards: [], giver: '', condition: '' };
    case 'vehicles': return { ...base, type: 'boat', graphic: '', speed: 4, startMap: '', bgm: '' };
    case 'switches': return { ...base, name: '', description: '' };
    case 'variables': return { ...base, name: '', description: '' };
    case 'types': return { ...base, category: 'element' };
    case 'terms': return { ...base, key: '', value: '' };
    default: return base;
  }
}

function ItemEditor({ tab, item, updateItem, gameData, t }) {
  const set = (field, value) => updateItem(field, value);
  const skills = gameData.skills || [];
  const items = gameData.items || [];
  const enemies = gameData.enemies || [];
  const weapons = gameData.weapons || [];
  const armors = gameData.armors || [];

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-zinc-400">{t('db_name')}</Label><Input value={item.name || ''} onChange={(e) => set('name', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_description')}</Label><Input value={item.description || ''} onChange={(e) => set('description', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
        </div>
      </div>

      {tab === 'actors' && (
        <>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_FIELDS.map(stat => (
                <div key={stat.key}><Label className="text-xs text-zinc-400">{t(stat.labelKey)}</Label>
                  <Input type="number" value={item[stat.key] || 0} onChange={(e) => set(stat.key, parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              ))}
              <div><Label className="text-xs text-zinc-400">{t('db_actor_initial_level')}</Label><Input type="number" value={item.initialLevel || 1} onChange={(e) => set('initialLevel', parseInt(e.target.value) || 1)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              <div><Label className="text-xs text-zinc-400">{t('db_actor_max_level')}</Label><Input type="number" value={item.maxLevel || 99} onChange={(e) => set('maxLevel', parseInt(e.target.value) || 99)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
            <div><Label className="text-xs text-zinc-400">{t('db_actor_class')}</Label>
              <Select value={item.classId || ''} onValueChange={(v) => set('classId', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{(gameData.classes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('db_actor_graphic')}</Label><Input value={item.graphic || ''} onChange={(e) => set('graphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_actor_face')}</Label><Input value={item.faceGraphic || ''} onChange={(e) => set('faceGraphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-zinc-400">{t('db_actor_weapon')}</Label>
                <Select value={item.equipment?.weapon || ''} onValueChange={(v) => set('equipment', { ...item.equipment, weapon: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">{weapons.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs text-zinc-400">{t('db_actor_armor')}</Label>
                <Select value={item.equipment?.armor || ''} onValueChange={(v) => set('equipment', { ...item.equipment, armor: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">{armors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
          </div>
        </>
      )}

      {tab === 'enemies' && (
        <>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_FIELDS.map(stat => (
                <div key={stat.key}><Label className="text-xs text-zinc-400">{t(stat.labelKey)}</Label>
                  <Input type="number" value={item[stat.key] || 0} onChange={(e) => set(stat.key, parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              ))}
              <div><Label className="text-xs text-zinc-400">{t('db_enemy_exp')}</Label><Input type="number" value={item.exp || 0} onChange={(e) => set('exp', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              <div><Label className="text-xs text-zinc-400">{t('db_enemy_gold')}</Label><Input type="number" value={item.gold || 0} onChange={(e) => set('gold', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              <div><Label className="text-xs text-zinc-400">{t('db_enemy_drop')}</Label><Input value={item.dropItem || ''} onChange={(e) => set('dropItem', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              <div><Label className="text-xs text-zinc-400">Drop %</Label><Input type="number" value={item.dropRate || 100} onChange={(e) => set('dropRate', parseInt(e.target.value) || 100)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <Label className="text-xs text-zinc-400">{t('db_actor_graphic')}</Label><Input value={item.graphic || ''} onChange={(e) => set('graphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" />
          </div>
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <Label className="text-xs text-zinc-400">行動パターン</Label>
            {(item.actions || []).map((action, index) => <div key={index} className="flex items-center gap-2"><Select value={action.skillId || ''} onValueChange={value => { const next = [...(item.actions || [])]; next[index] = { ...action, skillId: value }; set('actions', next); }}><SelectTrigger className="flex-1 border-zinc-700 bg-zinc-800 text-sm"><SelectValue placeholder="スキル" /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{skills.map(skill => <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>)}</SelectContent></Select><Input type="number" min="1" max="10" value={action.rating || 5} onChange={event => { const next = [...(item.actions || [])]; next[index] = { ...action, rating: Number(event.target.value) }; set('actions', next); }} className="w-20 border-zinc-700 bg-zinc-800 text-sm" title="優先度" /><button onClick={() => set('actions', item.actions.filter((_, current) => current !== index))} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button></div>)}
            <Button size="sm" variant="outline" onClick={() => set('actions', [...(item.actions || []), { skillId: '', rating: 5 }])} className="border-zinc-700"><Plus size={12} className="mr-1" />行動を追加</Button>
          </div>
        </>
      )}

      {tab === 'troops' && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <Label className="text-xs text-zinc-400">敵メンバー</Label>
          {(item.members || []).map((member, index) => <div key={index} className="grid grid-cols-[1fr_5rem_5rem_2rem] items-center gap-2"><Select value={member.enemyId || ''} onValueChange={value => { const next = [...(item.members || [])]; next[index] = { ...member, enemyId: value }; set('members', next); }}><SelectTrigger className="border-zinc-700 bg-zinc-800 text-sm"><SelectValue placeholder="敵キャラ" /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{enemies.map(enemy => <SelectItem key={enemy.id} value={enemy.id}>{enemy.name}</SelectItem>)}</SelectContent></Select><Input type="number" value={member.x || 0} onChange={event => { const next = [...(item.members || [])]; next[index] = { ...member, x: Number(event.target.value) }; set('members', next); }} placeholder="X" className="border-zinc-700 bg-zinc-800 text-sm" /><Input type="number" value={member.y || 0} onChange={event => { const next = [...(item.members || [])]; next[index] = { ...member, y: Number(event.target.value) }; set('members', next); }} placeholder="Y" className="border-zinc-700 bg-zinc-800 text-sm" /><button onClick={() => set('members', item.members.filter((_, current) => current !== index))} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button></div>)}
          <Button size="sm" variant="outline" onClick={() => set('members', [...(item.members || []), { enemyId: '', x: 0, y: 0 }])} className="border-zinc-700"><Plus size={12} className="mr-1" />敵を追加</Button>
        </div>
      )}

      {tab === 'skills' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_mp_cost')}</Label><Input type="number" value={item.mpCost || 0} onChange={(e) => set('mpCost', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_power')}</Label><Input type="number" value={item.power || 0} onChange={(e) => set('power', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_hit_rate')}</Label><Input type="number" value={item.hitRate || 100} onChange={(e) => set('hitRate', parseInt(e.target.value) || 100)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_element')}</Label><Input value={item.element || ''} onChange={(e) => set('element', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_target')}</Label>
              <Select value={item.target || 'enemy'} onValueChange={(v) => set('target', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{TARGETS.map(tg => <SelectItem key={tg.value} value={tg.value}>{t(tg.key)}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('db_animation')}</Label><Input value={item.animation || ''} onChange={(e) => set('animation', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
          <div><Label className="text-xs text-zinc-400">{t('db_formula')}</Label><Input value={item.formula || ''} onChange={(e) => set('formula', e.target.value)} placeholder={t('db_formula_hint')} className="bg-zinc-800 border-zinc-700 text-sm font-mono" /></div>
        </div>
      )}

      {tab === 'items' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_price')}</Label><Input type="number" value={item.price || 0} onChange={(e) => set('price', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_item_hp_recover')}</Label><Input type="number" value={item.hpRecover || 0} onChange={(e) => set('hpRecover', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_item_mp_recover')}</Label><Input type="number" value={item.mpRecover || 0} onChange={(e) => set('mpRecover', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_item_target')}</Label>
              <Select value={item.target || 'ally'} onValueChange={(v) => set('target', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="ally">{t('db_target_ally')}</SelectItem><SelectItem value="ally_all">{t('db_target_ally_all')}</SelectItem><SelectItem value="self">{t('db_target_self')}</SelectItem><SelectItem value="enemy">{t('db_target_enemy')}</SelectItem></SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('db_item_effect')}</Label><Input value={item.effects || ''} onChange={(e) => set('effects', e.target.value)} placeholder="HP+50, Cure Poison" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>
      )}

      {(tab === 'weapons' || tab === 'armors') && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_price')}</Label><Input type="number" value={item.price || 0} onChange={(e) => set('price', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            {tab === 'weapons' && <div><Label className="text-xs text-zinc-400">{t('db_attack')}</Label><Input type="number" value={item.attack || 0} onChange={(e) => set('attack', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>}
            {tab === 'armors' && <div><Label className="text-xs text-zinc-400">{t('db_defense')}</Label><Input type="number" value={item.defense || 0} onChange={(e) => set('defense', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>}
            <div><Label className="text-xs text-zinc-400">{t('db_element')}</Label><Input value={item.element || ''} onChange={(e) => set('element', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>
      )}

      {tab === 'classes' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['hpGrowth', 'HP'], ['mpGrowth', 'MP'], ['attackGrowth', 'ATK'], ['defenseGrowth', 'DEF'], ['magicAttackGrowth', 'MAT'], ['magicDefenseGrowth', 'MDF'], ['agilityGrowth', 'AGI'], ['luckGrowth', 'LUK']].map(([k, l]) => (
              <div key={k}><Label className="text-xs text-zinc-400">{l}</Label><Input type="number" step="0.5" value={item[k] || 0} onChange={(e) => set(k, parseFloat(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            ))}
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('db_class_learn_skills')}</Label>
            <div className="space-y-1 mt-1">
              {(item.learnSkills || []).map((ls, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input type="number" value={ls.level || 1} onChange={(e) => { const ns = [...(item.learnSkills || [])]; ns[i] = { ...ls, level: parseInt(e.target.value) || 1 }; set('learnSkills', ns); }} className="bg-zinc-800 border-zinc-700 text-sm w-20" placeholder="Lv" />
                  <Select value={ls.skillId || ''} onValueChange={(v) => { const ns = [...(item.learnSkills || [])]; ns[i] = { ...ls, skillId: v }; set('learnSkills', ns); }}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">{skills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => { const ns = (item.learnSkills || []).filter((_, j) => j !== i); set('learnSkills', ns); }} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set('learnSkills', [...(item.learnSkills || []), { level: 1, skillId: '' }])} className="border-zinc-700"><Plus size={12} className="mr-1" /> {t('db_class_add_skill')}</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'states' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_state_priority')}</Label><Input type="number" value={item.priority || 0} onChange={(e) => set('priority', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_state_duration')}</Label><Input type="number" value={item.duration || 0} onChange={(e) => set('duration', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_state_restriction')}</Label>
              <Select value={item.restriction || 'none'} onValueChange={(v) => set('restriction', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="none">{t('db_target_none')}</SelectItem><SelectItem value="sealed">Sealed</SelectItem><SelectItem value="confused">Confused</SelectItem><SelectItem value="sleep">Sleep</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div><Label className="text-xs text-zinc-400">{t('db_state_message')}</Label><Input value={item.message || ''} onChange={(e) => set('message', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_item_effect')}</Label><Input value={item.effects || ''} onChange={(e) => set('effects', e.target.value)} placeholder="Poison 10% HP, Regen 5% HP" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={item.removeAtBattleEnd !== false} onChange={(e) => set('removeAtBattleEnd', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" /><span className="text-sm text-zinc-300">{t('db_state_remove_battle')}</span></label>
        </div>
      )}

      {tab === 'shops' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_shop_buy_rate')} (%)</Label><Input type="number" value={item.buyRate || 100} onChange={(e) => set('buyRate', parseInt(e.target.value) || 100)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('db_shop_sell_rate')} (%)</Label><Input type="number" value={item.sellRate || 50} onChange={(e) => set('sellRate', parseInt(e.target.value) || 50)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('db_shop_items')}</Label>
            <div className="space-y-1 mt-1">
              {(item.items || []).map((si, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={si.itemId || ''} onValueChange={(v) => { const ns = [...(item.items || [])]; ns[i] = { ...si, itemId: v }; set('items', ns); }}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {items.map(it => <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>)}
                      {weapons.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      {armors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" value={si.price || 0} onChange={(e) => { const ns = [...(item.items || [])]; ns[i] = { ...si, price: parseInt(e.target.value) || 0 }; set('items', ns); }} className="bg-zinc-800 border-zinc-700 text-sm w-24" placeholder="Price" />
                  <button onClick={() => { const ns = (item.items || []).filter((_, j) => j !== i); set('items', ns); }} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set('items', [...(item.items || []), { itemId: '', price: 0 }])} className="border-zinc-700"><Plus size={12} className="mr-1" /> {t('db_shop_add_item')}</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'quests' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div><Label className="text-xs text-zinc-400">{t('db_quest_giver')}</Label><Input value={item.giver || ''} onChange={(e) => set('giver', e.target.value)} placeholder="NPC Name" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_quest_condition')}</Label><Input value={item.condition || ''} onChange={(e) => set('condition', e.target.value)} placeholder="switch[...] == ON" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div>
            <Label className="text-xs text-zinc-400">{t('db_quest_objectives')}</Label>
            <div className="space-y-1 mt-1">
              {(item.objectives || []).map((obj, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={obj.text || ''} onChange={(e) => { const ns = [...(item.objectives || [])]; ns[i] = { ...obj, text: e.target.value }; set('objectives', ns); }} className="bg-zinc-800 border-zinc-700 text-sm flex-1" placeholder="Objective" />
                  <Select value={obj.type || 'kill'} onValueChange={(v) => { const ns = [...(item.objectives || [])]; ns[i] = { ...obj, type: v }; set('objectives', ns); }}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm w-24"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="kill">Kill</SelectItem><SelectItem value="collect">Collect</SelectItem><SelectItem value="talk">Talk</SelectItem><SelectItem value="reach">Reach</SelectItem></SelectContent>
                  </Select>
                  <button onClick={() => { const ns = (item.objectives || []).filter((_, j) => j !== i); set('objectives', ns); }} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set('objectives', [...(item.objectives || []), { text: '', type: 'kill' }])} className="border-zinc-700"><Plus size={12} className="mr-1" /> {t('db_quest_add_objective')}</Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('db_quest_rewards')}</Label>
            <div className="space-y-1 mt-1">
              {(item.rewards || []).map((rw, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={rw.type || 'gold'} onValueChange={(v) => { const ns = [...(item.rewards || [])]; ns[i] = { ...rw, type: v }; set('rewards', ns); }}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm w-24"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="gold">Gold</SelectItem><SelectItem value="item">Item</SelectItem><SelectItem value="exp">EXP</SelectItem><SelectItem value="skill">Skill</SelectItem></SelectContent>
                  </Select>
                  <Input value={rw.name || ''} onChange={(e) => { const ns = [...(item.rewards || [])]; ns[i] = { ...rw, name: e.target.value }; set('rewards', ns); }} className="bg-zinc-800 border-zinc-700 text-sm flex-1" placeholder="Name" />
                  <Input type="number" value={rw.amount || 1} onChange={(e) => { const ns = [...(item.rewards || [])]; ns[i] = { ...rw, amount: parseInt(e.target.value) || 1 }; set('rewards', ns); }} className="bg-zinc-800 border-zinc-700 text-sm w-20" />
                  <button onClick={() => { const ns = (item.rewards || []).filter((_, j) => j !== i); set('rewards', ns); }} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set('rewards', [...(item.rewards || []), { type: 'gold', name: '', amount: 100 }])} className="border-zinc-700"><Plus size={12} className="mr-1" /> {t('db_quest_add_reward')}</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('db_vehicle_type')}</Label>
              <Select value={item.type || 'boat'} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="boat">Boat</SelectItem><SelectItem value="ship">Ship</SelectItem><SelectItem value="airship">Airship</SelectItem><SelectItem value="horse">Horse</SelectItem></SelectContent>
              </Select></div>
            <div><Label className="text-xs text-zinc-400">{t('db_vehicle_speed')}</Label><Input type="number" value={item.speed || 4} onChange={(e) => set('speed', parseInt(e.target.value) || 4)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
          <div><Label className="text-xs text-zinc-400">{t('db_vehicle_graphic')}</Label><Input value={item.graphic || ''} onChange={(e) => set('graphic', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_vehicle_start_map')}</Label>
            <Select value={item.startMap || ''} onValueChange={(v) => set('startMap', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">{(gameData.maps || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs text-zinc-400">BGM</Label><Input value={item.bgm || ''} onChange={(e) => set('bgm', e.target.value)} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
        </div>
      )}

      {(tab === 'switches' || tab === 'variables') && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div><Label className="text-xs text-zinc-400">{tab === 'switches' ? t('db_switch_name') : t('db_variable_name')}</Label><Input value={item.name || ''} onChange={(e) => set('name', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_description')}</Label><Textarea value={item.description || ''} onChange={(e) => set('description', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
        </div>
      )}

      {tab === 'commonEvents' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div><Label className="text-xs text-zinc-400">{t('db_common_trigger')}</Label>
            <Select value={item.trigger || 'none'} onValueChange={(v) => set('trigger', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="none">{t('db_common_trigger_none')}</SelectItem><SelectItem value="autorun">{t('db_common_trigger_autorun')}</SelectItem><SelectItem value="parallel">{t('db_common_trigger_parallel')}</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs text-zinc-400">{t('db_quest_condition')}</Label><Input value={item.condition || ''} onChange={(e) => set('condition', e.target.value)} placeholder="switch[...] == ON" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div className="border-t border-zinc-800 pt-3"><Label className="mb-2 block text-xs text-zinc-400">実行内容</Label><CommandSequenceEditor commands={item.commands || []} onChange={commands => set('commands', commands)} gameData={gameData} t={t} /></div>
        </div>
      )}

      {tab === 'tilesets' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div><Label className="text-xs text-zinc-400">{t('db_actor_graphic')}</Label><Input value={item.graphic || ''} onChange={(e) => set('graphic', e.target.value)} placeholder="Tileset Image URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_tileset_passage')}</Label><Input value={JSON.stringify(item.passageMap || {})} onChange={(e) => { try { set('passageMap', JSON.parse(e.target.value)); } catch {} }} placeholder='{"0,0": true}' className="bg-zinc-800 border-zinc-700 text-sm font-mono" /></div>
          <div><Label className="text-xs text-zinc-400">{t('db_tileset_terrain')}</Label><Input value={JSON.stringify(item.terrainMap || {})} onChange={(e) => { try { set('terrainMap', JSON.parse(e.target.value)); } catch {} }} placeholder='{"0,0": 1}' className="bg-zinc-800 border-zinc-700 text-sm font-mono" /></div>
        </div>
      )}

      {tab === 'terms' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">Key</Label><Input value={item.key || ''} onChange={(e) => set('key', e.target.value)} placeholder="HP" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">Value</Label><Input value={item.value || ''} onChange={(e) => set('value', e.target.value)} placeholder="体力" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
          </div>
        </div>
      )}
    </div>
  );
}

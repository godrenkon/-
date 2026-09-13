import React, { useEffect, useMemo, useState } from 'react';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BadgeCheck, Check, PackageOpen, Puzzle, Search, Settings, ShieldAlert, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { OFFICIAL_EXTENSIONS, getDefaultExtensionSettings, getExtensionSettingsSchema, getOfficialExtension } from '@/lib/officialExtensions';

const CATEGORIES = ['all', 'system', 'exploration', 'environment', 'narrative', 'battle', 'progression', 'items', 'movement', 'ui', 'accessibility', 'custom'];
const CATEGORY_LABELS = {
  all: 'すべて', system: 'システム', exploration: '探索', environment: '環境', narrative: '物語',
  battle: '戦闘', progression: '成長', items: 'アイテム', movement: '移動', ui: 'UI',
  accessibility: '補助・開発', custom: 'その他',
};

const normalizeSchema = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export default function PluginManager({ gameData, updateGameData }) {
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('official');
  const [settingsFor, setSettingsFor] = useState(null);
  const installed = gameData.plugins || [];

  useEffect(() => {
    let active = true;
    rpgStore.entities.Plugin.filter({ is_public: true }, '-install_count', 100)
      .then(data => active && setCommunity(data || []))
      .catch(error => console.error(error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const itemId = item => item.plugin_id || item.id;
  const installedEntry = item => installed.find(entry => entry.plugin_id === itemId(item));
  const toggleInstall = item => {
    const id = itemId(item);
    updateGameData(previous => {
      const current = previous.plugins || [];
      if (current.some(entry => entry.plugin_id === id)) {
        return { ...previous, plugins: current.filter(entry => entry.plugin_id !== id) };
      }
      const official = item.official === true;
      return {
        ...previous,
        plugins: [...current, official ? {
          plugin_id: id,
          catalog_id: item.id,
          source: 'official',
          enabled: true,
          settings: getDefaultExtensionSettings(item),
        } : {
          plugin_id: id,
          source: 'community',
          enabled: false,
          trusted: false,
          code: item.code || '',
          name: item.name,
          version: item.version,
          settings: {},
        }],
      };
    });
  };

  const toggleEnabled = id => updateGameData(previous => ({
    ...previous,
    plugins: (previous.plugins || []).map(entry => entry.plugin_id === id ? { ...entry, enabled: !entry.enabled } : entry),
  }));

  const toggleTrusted = id => updateGameData(previous => ({
    ...previous,
    plugins: (previous.plugins || []).map(entry => entry.plugin_id === id && !getOfficialExtension(entry.catalog_id || entry.plugin_id)
      ? { ...entry, source: 'community', trusted: entry.trusted !== true, enabled: entry.trusted !== true }
      : entry),
  }));

  const updateSettings = (id, key, value) => updateGameData(previous => ({
    ...previous,
    plugins: (previous.plugins || []).map(entry => entry.plugin_id === id
      ? { ...entry, settings: { ...(entry.settings || {}), [key]: value } }
      : entry),
  }));

  const installedItems = useMemo(() => installed.map(entry => {
    const official = getOfficialExtension(entry.catalog_id || entry.plugin_id);
    const cloud = community.find(item => item.id === entry.plugin_id);
    return official || cloud || { id: entry.plugin_id, plugin_id: entry.plugin_id, name: entry.name || entry.plugin_id, description: '導入済み拡張機能', category: 'custom' };
  }), [community, installed]);

  const sourceItems = source === 'official' ? OFFICIAL_EXTENSIONS : source === 'community' ? community : installedItems;
  const filtered = sourceItems.filter(item => {
    if (category !== 'all' && (item.category || 'custom') !== category) return false;
    const haystack = `${item.name || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    return !query || haystack.includes(query.toLowerCase());
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Puzzle size={20} className="text-violet-400" />拡張機能</h2><p className="mt-1 text-sm text-zinc-500">公式カタログ100種とコミュニティ拡張をゲーム単位で管理できます。</p></div>
            <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">{installed.length} 導入済み</div>
          </div>
          <div className="mt-4 grid gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:grid-cols-3">
            <CoreFeature title="クエスト" description="クエストDBと進行状態を標準搭載" />
            <CoreFeature title="ダメージ床" description="タイル通行・リージョン機能へ統合" />
            <CoreFeature title="カスタムUI" description="HUD・操作・設定画面へ統合" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
          {[['official', '公式 100'], ['community', 'コミュニティ'], ['installed', `導入済み ${installed.length}`]].map(([id, label]) => <button key={id} onClick={() => setSource(id)} className={`rounded-lg px-3 py-1.5 text-sm ${source === id ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>{label}</button>)}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="名前・説明で検索" className="border-zinc-800 bg-zinc-900 pl-9" /></div>
          <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full border-zinc-800 bg-zinc-900 sm:w-44"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{CATEGORIES.map(id => <SelectItem key={id} value={id}>{CATEGORY_LABELS[id]}</SelectItem>)}</SelectContent></Select>
        </div>

        {loading && source === 'community' ? <p className="py-12 text-center text-zinc-500">読み込み中...</p> : !filtered.length ? <div className="py-16 text-center text-zinc-500"><PackageOpen size={36} className="mx-auto mb-2 opacity-30" />該当する拡張機能がありません</div> : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map(item => {
              const id = itemId(item);
              const entry = installedEntry(item);
              const official = item.official === true;
              const schema = official ? getExtensionSettingsSchema(item) : normalizeSchema(item.settings_schema);
              const settingsOpen = settingsFor === id;
              const communityEntry = entry && !getOfficialExtension(entry.catalog_id || entry.plugin_id);
              return (
                <article key={id} className={`overflow-hidden rounded-xl border bg-zinc-900/50 ${entry ? 'border-violet-500/35' : 'border-zinc-800'}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${official ? 'bg-violet-500/15 text-violet-300' : 'bg-zinc-800 text-zinc-400'}`}><Puzzle size={18} /></div>
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold text-zinc-200">{item.name}</h3>{official && <BadgeCheck size={15} className="flex-shrink-0 text-sky-400" />}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.description || '説明はありません'}</p><div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600"><span className="rounded bg-zinc-800 px-2 py-0.5">{CATEGORY_LABELS[item.category] || item.category || 'その他'}</span><span>v{item.version || '1.0.0'}</span></div></div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {communityEntry && <button aria-label="コード実行許可" title={entry.trusted ? 'コード実行を許可済み' : '内容を確認してから実行を許可'} onClick={() => toggleTrusted(id)} className={`rounded p-1.5 hover:bg-zinc-800 ${entry.trusted ? 'text-amber-400' : 'text-zinc-500'}`}><ShieldAlert size={17} /></button>}
                        {entry && Object.keys(schema).length > 0 && <button aria-label="設定" onClick={() => setSettingsFor(settingsOpen ? null : id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-violet-400"><Settings size={16} /></button>}
                        {entry && <button aria-label="有効切替" disabled={communityEntry && !entry.trusted} onClick={() => toggleEnabled(id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30">{entry.enabled ? <ToggleRight size={21} className="text-emerald-400" /> : <ToggleLeft size={21} />}</button>}
                      </div>
                    </div>
                    <Button size="sm" variant={entry ? 'outline' : 'default'} onClick={() => toggleInstall(item)} className={`mt-3 h-8 w-full text-xs ${entry ? 'border-zinc-700 text-red-300 hover:bg-red-500/10' : 'bg-violet-600 hover:bg-violet-500'}`}>{entry ? <><Trash2 size={13} className="mr-1" />削除</> : <><Check size={13} className="mr-1" />導入</>}</Button>
                  </div>
                  {communityEntry && !entry.trusted && <p className="border-t border-amber-500/15 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-300">コミュニティコードは停止中です。内容を確認後、盾ボタンでこのゲームだけ実行を許可できます。</p>}
                  {entry && settingsOpen && Object.keys(schema).length > 0 && <SettingsPanel schema={schema} values={entry.settings || {}} onChange={(key, value) => updateSettings(id, key, value)} />}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CoreFeature({ title, description }) {
  return <div className="flex items-start gap-2"><BadgeCheck size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="text-xs font-medium text-emerald-200">{title}</p><p className="mt-0.5 text-[11px] text-zinc-500">{description}</p></div></div>;
}

function SettingsPanel({ schema, values, onChange }) {
  return (
    <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/40 p-4">
      {Object.entries(schema).map(([key, field]) => {
        const value = values[key] ?? field.default ?? '';
        return <div key={key}><Label className="mb-1 block text-xs text-zinc-400">{field.label || key}</Label>{field.type === 'select' ? <Select value={String(value)} onValueChange={next => onChange(key, next)}><SelectTrigger className="h-8 border-zinc-700 bg-zinc-800 text-xs"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{(field.options || []).map(option => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}</SelectContent></Select> : <Input type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : 'text'} value={value} onChange={event => onChange(key, field.type === 'number' ? Number(event.target.value) : event.target.value)} className="h-8 border-zinc-700 bg-zinc-800 text-xs" />}</div>;
      })}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Copy, Plus, Trash2, Zap } from 'lucide-react';
import CommandSequenceEditor from '@/components/editor/CommandSequenceEditor';
import { cloneData, createEvent, createId } from '@/lib/gameData';

const TRIGGERS = [
  ['action', '決定ボタン'], ['touch', 'プレイヤー接触'], ['auto', '自動実行'], ['parallel', '並列処理'],
];
const MOVE_TYPES = [['fixed', '固定'], ['random', 'ランダム'], ['approach', '近づく']];
const PRIORITIES = [['below', '通常キャラの下'], ['same', '通常キャラと同じ'], ['above', '通常キャラの上']];
const CONDITION_TYPES = [['switch', 'スイッチ'], ['variable', '変数'], ['selfSwitch', 'セルフスイッチ'], ['item', 'アイテム'], ['actor', '仲間']];

const pageDefaults = event => ({
  id: createId('page'), name: `ページ ${(event.pages || []).length + 1}`,
  conditions: [], commands: [], trigger: event.trigger || 'action',
  priority: event.priority || 'same', graphic: event.graphic || '',
});

export default function EventEditor({ gameData, updateGameData, selectedMapId }) {
  const { t } = useI18n();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const maps = gameData.maps || [];
  const currentMap = maps.find(map => map.id === selectedMapId);
  const events = currentMap?.events || [];
  const selectedEvent = events.find(event => event.id === selectedEventId);
  const pages = selectedEvent?.pages?.length ? selectedEvent.pages : selectedEvent ? [{ ...pageDefaults(selectedEvent), commands: selectedEvent.commands || [] }] : [];
  const selectedPage = pages[pageIndex] || pages[0];

  useEffect(() => {
    if (!events.some(event => event.id === selectedEventId)) setSelectedEventId(events[0]?.id || null);
    setPageIndex(0);
  }, [selectedMapId]);

  useEffect(() => {
    if (selectedEventId && !events.some(event => event.id === selectedEventId)) setSelectedEventId(events[0]?.id || null);
  }, [events, selectedEventId]);

  const updateEvent = (eventId, updater) => {
    updateGameData(previous => ({
      ...previous,
      maps: previous.maps.map(map => map.id !== selectedMapId ? map : {
        ...map,
        events: (map.events || []).map(event => event.id !== eventId
          ? event
          : typeof updater === 'function' ? updater(event) : { ...event, ...updater }),
      }),
    }));
  };

  const updatePage = (updater) => {
    if (!selectedEvent) return;
    updateEvent(selectedEvent.id, event => {
      const nextPages = event.pages?.length ? [...event.pages] : [{ ...pageDefaults(event), commands: event.commands || [] }];
      const index = Math.min(pageIndex, nextPages.length - 1);
      const page = typeof updater === 'function' ? updater(nextPages[index]) : { ...nextPages[index], ...updater };
      nextPages[index] = page;
      return index === 0
        ? { ...event, pages: nextPages, commands: page.commands, trigger: page.trigger, priority: page.priority, graphic: page.graphic }
        : { ...event, pages: nextPages };
    });
  };

  const addEvent = () => {
    if (!currentMap) return;
    const event = createEvent(0, 0, `イベント ${events.length + 1}`);
    updateGameData(previous => ({
      ...previous,
      maps: previous.maps.map(map => map.id === selectedMapId ? { ...map, events: [...(map.events || []), event] } : map),
    }));
    setSelectedEventId(event.id);
    setPageIndex(0);
  };

  const duplicateEvent = (source) => {
    const copy = cloneData(source);
    copy.id = createId('evt');
    copy.name = `${source.name} コピー`;
    copy.pages = (copy.pages || []).map(page => ({
      ...page,
      id: createId('page'),
      commands: (page.commands || []).map(command => ({ ...command, id: createId('cmd') })),
    }));
    copy.commands = copy.pages[0]?.commands || [];
    updateGameData(previous => ({
      ...previous,
      maps: previous.maps.map(map => map.id === selectedMapId ? { ...map, events: [...(map.events || []), copy] } : map),
    }));
    setSelectedEventId(copy.id);
    setPageIndex(0);
  };

  const deleteEvent = (eventId) => {
    if (!confirm(t('deleteConfirm'))) return;
    updateGameData(previous => ({
      ...previous,
      maps: previous.maps.map(map => map.id === selectedMapId ? { ...map, events: (map.events || []).filter(event => event.id !== eventId) } : map),
    }));
  };

  const addPage = () => {
    if (!selectedEvent) return;
    const page = pageDefaults(selectedEvent);
    updateEvent(selectedEvent.id, event => ({ ...event, pages: [...(event.pages || []), page] }));
    setPageIndex(pages.length);
  };

  const duplicatePage = () => {
    if (!selectedPage) return;
    const page = cloneData(selectedPage);
    page.id = createId('page');
    page.name = `${selectedPage.name || 'ページ'} コピー`;
    page.commands = page.commands.map(command => ({ ...command, id: createId('cmd') }));
    updateEvent(selectedEvent.id, event => {
      const next = [...event.pages];
      next.splice(pageIndex + 1, 0, page);
      return { ...event, pages: next };
    });
    setPageIndex(pageIndex + 1);
  };

  const deletePage = () => {
    if (pages.length <= 1 || !confirm('このイベントページを削除しますか？')) return;
    updateEvent(selectedEvent.id, event => ({ ...event, pages: event.pages.filter((_, index) => index !== pageIndex) }));
    setPageIndex(Math.max(0, pageIndex - 1));
  };

  const addCondition = () => updatePage(page => ({
    ...page,
    conditions: [...(page.conditions || []), { id: createId('condition'), type: 'switch', key: '', operator: 'on', value: true }],
  }));
  const updateCondition = (id, field, value) => updatePage(page => ({
    ...page,
    conditions: page.conditions.map(condition => condition.id === id ? { ...condition, [field]: value } : condition),
  }));
  const deleteCondition = id => updatePage(page => ({ ...page, conditions: page.conditions.filter(condition => condition.id !== id) }));

  if (!currentMap) return <div className="flex h-full items-center justify-center text-zinc-500"><Zap size={40} className="mr-3 opacity-30" />マップを選択してください</div>;

  return (
    <div className="flex h-full min-w-0">
      <aside className="w-44 flex-shrink-0 border-r border-zinc-800 bg-[#0e0e14] sm:w-56">
        <div className="flex items-center justify-between border-b border-zinc-800 p-2"><span className="px-1 text-xs font-medium text-zinc-400">イベント</span><button aria-label="イベント追加" onClick={addEvent} className="p-1 text-zinc-400 hover:text-violet-400"><Plus size={15} /></button></div>
        <div className="space-y-0.5 overflow-y-auto p-1.5">
          {!events.length && <p className="p-2 text-xs text-zinc-600">イベントがありません</p>}
          {events.map(event => (
            <div key={event.id} onClick={() => { setSelectedEventId(event.id); setPageIndex(0); }} className={`group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs ${event.id === selectedEventId ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
              <Zap size={12} className="flex-shrink-0 opacity-50" /><span className="flex-1 truncate">{event.name}</span><span className="text-zinc-600">{event.x},{event.y}</span>
              <button aria-label="イベント削除" onClick={click => { click.stopPropagation(); deleteEvent(event.id); }} className="text-zinc-500 opacity-0 hover:text-red-400 group-hover:opacity-100"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-3 sm:p-5">
        {!selectedEvent || !selectedPage ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500"><Zap size={40} className="opacity-30" /><Button size="sm" onClick={addEvent} className="bg-violet-600"><Plus size={14} className="mr-1" />イベントを作成</Button></div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-200">イベント設定</h2><Button size="sm" variant="ghost" onClick={() => duplicateEvent(selectedEvent)} className="h-7 text-xs text-zinc-400"><Copy size={13} className="mr-1" />複製</Button></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2"><Label className="text-xs text-zinc-400">名前</Label><Input value={selectedEvent.name} onChange={event => updateEvent(selectedEvent.id, { name: event.target.value })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">X</Label><Input type="number" min="0" max={currentMap.width - 1} value={selectedEvent.x} onChange={event => updateEvent(selectedEvent.id, { x: Math.min(currentMap.width - 1, Math.max(0, Number(event.target.value))) })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">Y</Label><Input type="number" min="0" max={currentMap.height - 1} value={selectedEvent.y} onChange={event => updateEvent(selectedEvent.id, { y: Math.min(currentMap.height - 1, Math.max(0, Number(event.target.value))) })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">移動</Label><Select value={selectedEvent.moveType || 'fixed'} onValueChange={value => updateEvent(selectedEvent.id, { moveType: value })}><SelectTrigger className="border-zinc-700 bg-zinc-800 text-sm"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{MOVE_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs text-zinc-400">移動速度</Label><Input type="number" min="1" max="6" value={selectedEvent.moveSpeed || 3} onChange={event => updateEvent(selectedEvent.id, { moveSpeed: Math.min(6, Math.max(1, Number(event.target.value))) })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm text-zinc-300"><input type="checkbox" checked={selectedEvent.through === true} onChange={event => updateEvent(selectedEvent.id, { through: event.target.checked })} className="accent-violet-600" />すり抜け</label>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 p-2">
                {pages.map((page, index) => <button key={page.id} onClick={() => setPageIndex(index)} className={`whitespace-nowrap rounded px-3 py-1.5 text-xs ${index === pageIndex ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>{page.name || `ページ ${index + 1}`}</button>)}
                <button aria-label="ページ追加" onClick={addPage} className="rounded p-1.5 text-zinc-500 hover:text-violet-400"><Plus size={14} /></button>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1"><Label className="text-xs text-zinc-400">ページ名</Label><Input value={selectedPage.name || ''} onChange={event => updatePage({ name: event.target.value })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                  <Button size="sm" variant="ghost" onClick={duplicatePage} className="text-zinc-400"><Copy size={14} className="mr-1" />複製</Button>
                  <Button size="sm" variant="ghost" disabled={pages.length <= 1} onClick={deletePage} className="text-red-400"><Trash2 size={14} className="mr-1" />削除</Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div><Label className="text-xs text-zinc-400">起動条件</Label><Select value={selectedPage.trigger || 'action'} onValueChange={value => updatePage({ trigger: value })}><SelectTrigger className="border-zinc-700 bg-zinc-800 text-sm"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{TRIGGERS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs text-zinc-400">表示位置</Label><Select value={selectedPage.priority || 'same'} onValueChange={value => updatePage({ priority: value })}><SelectTrigger className="border-zinc-700 bg-zinc-800 text-sm"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{PRIORITIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs text-zinc-400">画像URL</Label><Input value={selectedPage.graphic || ''} onChange={event => updatePage({ graphic: event.target.value })} className="border-zinc-700 bg-zinc-800 text-sm" /></div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300"><CheckCircle2 size={15} />出現条件</h3><Button size="sm" variant="outline" onClick={addCondition} className="h-7 border-zinc-700 text-xs"><Plus size={13} className="mr-1" />条件</Button></div>
              <div className="space-y-2">
                {!selectedPage.conditions?.length && <p className="text-xs text-zinc-600">条件なし（常にこのページが有効）</p>}
                {(selectedPage.conditions || []).map(condition => <ConditionRow key={condition.id} condition={condition} update={(field, value) => updateCondition(condition.id, field, value)} remove={() => deleteCondition(condition.id)} />)}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">実行内容</h3>
              <CommandSequenceEditor commands={selectedPage.commands || []} onChange={commands => updatePage({ commands })} gameData={gameData} t={t} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ConditionRow({ condition, update, remove }) {
  const variable = condition.type === 'variable';
  return (
    <div className="grid grid-cols-[7rem_1fr_5rem_2rem] items-center gap-2">
      <Select value={condition.type} onValueChange={value => update('type', value)}><SelectTrigger className="h-8 border-zinc-700 bg-zinc-800 text-xs"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{CONDITION_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      <Input value={condition.key || ''} onChange={event => update('key', event.target.value)} placeholder={condition.type === 'selfSwitch' ? 'A' : '名前またはID'} className="h-8 border-zinc-700 bg-zinc-800 text-xs" />
      {variable ? <div className="flex"><Select value={condition.operator || '>='} onValueChange={value => update('operator', value)}><SelectTrigger className="h-8 w-16 rounded-r-none border-zinc-700 bg-zinc-800 text-xs"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800">{['>=', '>', '==', '<=', '<'].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Input type="number" value={condition.value ?? 0} onChange={event => update('value', Number(event.target.value))} className="h-8 rounded-l-none border-zinc-700 bg-zinc-800 text-xs" /></div> : <Select value={condition.operator || 'on'} onValueChange={value => update('operator', value)}><SelectTrigger className="h-8 border-zinc-700 bg-zinc-800 text-xs"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-800"><SelectItem value="on">ON/所持</SelectItem><SelectItem value="off">OFF/未所持</SelectItem></SelectContent></Select>}
      <button aria-label="条件削除" onClick={remove} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
    </div>
  );
}

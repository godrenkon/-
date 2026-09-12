import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Trash2, ChevronUp, ChevronDown, Zap, X } from 'lucide-react';
import { COMMAND_CATEGORIES, COMMAND_MAP, getCommandSummary, CommandParamsEditor } from '@/components/editor/EventCommands';

const TRIGGERS = [
  { value: 'action', key: 'editor_event_trigger_action' },
  { value: 'touch', key: 'editor_event_trigger_touch' },
  { value: 'auto', key: 'editor_event_trigger_auto' },
  { value: 'parallel', key: 'editor_event_trigger_parallel' },
];

const MOVE_TYPES = [
  { value: 'fixed', key: 'editor_event_move_fixed' },
  { value: 'random', key: 'editor_event_move_random' },
  { value: 'approach', key: 'editor_event_move_approach' },
];

const PRIORITIES = [
  { value: 'same', key: 'editor_event_priority' },
  { value: 'below', key: 'editor_event_move_fixed' },
  { value: 'above', key: 'editor_event_move_approach' },
];

export default function EventEditor({ gameData, updateGameData, selectedMapId }) {
  const { t } = useI18n();
  const [selectedEventId, setSelectedEventId] = useState(null);

  const maps = gameData.maps || [];
  const currentMap = maps.find(m => m.id === selectedMapId);
  const events = currentMap?.events || [];
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const updateEvent = (eventId, updater) => {
    updateGameData(prev => {
      const newMaps = (prev.maps || []).map(m => {
        if (m.id !== selectedMapId) return m;
        return { ...m, events: (m.events || []).map(ev => ev.id === eventId ? (typeof updater === 'function' ? updater(ev) : { ...ev, ...updater }) : ev) };
      });
      return { ...prev, maps: newMaps };
    });
  };

  const deleteEvent = (eventId) => {
    if (!confirm(t('deleteConfirm'))) return;
    updateGameData(prev => ({ ...prev, maps: (prev.maps || []).map(m => m.id === selectedMapId ? { ...m, events: (m.events || []).filter(e => e.id !== eventId) } : m) }));
    if (selectedEventId === eventId) setSelectedEventId(null);
  };

  const addCommand = (eventType) => {
    if (!selectedEventId) return;
    const newCmd = { id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: eventType, params: {} };
    updateEvent(selectedEventId, ev => ({ ...ev, commands: [...(ev.commands || []), newCmd] }));
  };

  const updateCommand = (cmdId, params) => {
    if (!selectedEventId) return;
    updateEvent(selectedEventId, ev => ({ ...ev, commands: (ev.commands || []).map(c => c.id === cmdId ? { ...c, params: { ...c.params, ...params } } : c) }));
  };

  const deleteCommand = (cmdId) => {
    updateEvent(selectedEventId, ev => ({ ...ev, commands: (ev.commands || []).filter(c => c.id !== cmdId) }));
  };

  const moveCommand = (cmdId, dir) => {
    updateEvent(selectedEventId, ev => {
      const cmds = [...(ev.commands || [])];
      const idx = cmds.findIndex(c => c.id === cmdId);
      if (idx < 0) return ev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= cmds.length) return ev;
      [cmds[idx], cmds[newIdx]] = [cmds[newIdx], cmds[idx]];
      return { ...ev, commands: cmds };
    });
  };

  if (!currentMap) {
    return <div className="flex items-center justify-center h-full text-zinc-500"><Zap size={40} className="opacity-30 mr-3" /> {t('editor_select_tile')}</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-56 bg-[#0e0e14] border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="p-2 border-b border-zinc-800"><span className="text-xs font-medium text-zinc-400 px-1">{t('editor_event_list')}</span></div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {events.length === 0 ? <p className="text-xs text-zinc-600 p-2">{t('noData')}</p>
            : events.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEventId(ev.id)}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer transition ${ev.id === selectedEventId ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                <Zap size={12} className="flex-shrink-0 opacity-50" />
                <span className="truncate flex-1">{ev.name}</span>
                <span className="text-zinc-600">({ev.x},{ev.y})</span>
                <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedEvent ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2"><Zap size={40} className="opacity-30" /><p className="text-sm">{t('editor_event_new')}</p></div>
        ) : (
          <div className="max-w-3xl space-y-4">
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">{t('editor_event_new')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-zinc-400">{t('editor_event_name')}</Label>
                  <Input value={selectedEvent.name} onChange={(e) => updateEvent(selectedEvent.id, { name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">{t('editor_event_graphic')}</Label>
                  <Input value={selectedEvent.graphic || ''} onChange={(e) => updateEvent(selectedEvent.id, { graphic: e.target.value })} placeholder="URL" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">{t('editor_event_trigger')}</Label>
                  <Select value={selectedEvent.trigger} onValueChange={(v) => updateEvent(selectedEvent.id, { trigger: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">{TRIGGERS.map(tr => <SelectItem key={tr.value} value={tr.value}>{t(tr.key)}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label className="text-xs text-zinc-400">{t('editor_event_move')}</Label>
                  <Select value={selectedEvent.moveType} onValueChange={(v) => updateEvent(selectedEvent.id, { moveType: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">{MOVE_TYPES.map(mt => <SelectItem key={mt.value} value={mt.value}>{t(mt.key)}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label className="text-xs text-zinc-400">{t('editor_event_priority')}</Label>
                  <Select value={selectedEvent.priority} onValueChange={(v) => updateEvent(selectedEvent.id, { priority: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="same">{t('editor_event_priority')}</SelectItem>
                      <SelectItem value="below">{t('editor_passage_blocked')}</SelectItem>
                      <SelectItem value="above">{t('editor_event_move_approach')}</SelectItem>
                    </SelectContent>
                  </Select></div>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-medium text-zinc-300">{t('editor_event_commands')}</h3></div>
              <div className="space-y-1 mb-3">
                {(selectedEvent.commands || []).map((cmd, idx) => {
                  const cmdType = COMMAND_MAP[cmd.type];
                  return (
                    <div key={cmd.id} className="relative flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 group">
                      <span className="text-xs text-zinc-600 w-6 text-right">{idx + 1}</span>
                      {cmdType && <cmdType.icon size={14} className="text-violet-400 flex-shrink-0" />}
                      <CommandEditor cmd={cmd} updateCommand={updateCommand} gameData={gameData} t={t} />
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => moveCommand(cmd.id, -1)} className="p-1 text-zinc-500 hover:text-zinc-200"><ChevronUp size={14} /></button>
                        <button onClick={() => moveCommand(cmd.id, 1)} className="p-1 text-zinc-500 hover:text-zinc-200"><ChevronDown size={14} /></button>
                        <button onClick={() => deleteCommand(cmd.id)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
                {(selectedEvent.commands || []).length === 0 && <p className="text-xs text-zinc-600 py-4 text-center">{t('editor_add_command')}</p>}
              </div>
              <AddCommandButton onAdd={addCommand} t={t} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommandEditor({ cmd, updateCommand, gameData, t }) {
  const [open, setOpen] = useState(false);
  const cmdType = COMMAND_MAP[cmd.type];
  if (!cmdType) return <span className="text-xs text-zinc-500 flex-1">{cmd.type}</span>;
  const summary = getCommandSummary(cmd, t);
  const label = t(cmdType.labelKey);
  return (
    <>
      <button onClick={() => setOpen(!open)} className="flex-1 text-left text-xs text-zinc-300 hover:text-white">
        <span className="font-medium">{label}</span>{summary && <span className="text-zinc-500 ml-2">{summary}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-12 right-12 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
          <CommandParamsEditor cmd={cmd} updateCommand={updateCommand} gameData={gameData} t={t} />
        </div>
      )}
    </>
  );
}

function AddCommandButton({ onAdd, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700">
        <Plus size={14} className="mr-1" /> {t('editor_add_command')}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-80 bg-zinc-800 border border-zinc-700 rounded-lg p-2 shadow-xl max-h-96 overflow-y-auto">
            {COMMAND_CATEGORIES.map(cat => (
              <div key={cat.id} className="mb-2">
                <div className="text-xs font-medium text-violet-400 px-2 py-1">{t(cat.labelKey)}</div>
                {cat.commands.map(ct => (
                  <button key={ct.id} onClick={() => { onAdd(ct.id); setOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-zinc-300 hover:bg-zinc-700 transition text-left">
                    <ct.icon size={14} className="text-violet-400" /> {t(ct.labelKey)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
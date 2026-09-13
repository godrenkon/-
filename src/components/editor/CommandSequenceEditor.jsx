import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2, Zap } from 'lucide-react';
import { COMMAND_CATEGORIES, COMMAND_MAP, CommandParamsEditor, getCommandSummary } from '@/components/editor/EventCommands';
import { cloneData, createId } from '@/lib/gameData';
import { getOfficialExtension, getOfficialExtensionByCommand } from '@/lib/officialExtensions';

export default function CommandSequenceEditor({ commands = [], onChange, gameData, t }) {
  const extensions = (gameData.plugins || [])
    .filter(plugin => plugin.enabled && (plugin.source === 'official' || String(plugin.plugin_id || '').startsWith('official:')))
    .map(plugin => getOfficialExtension(plugin.catalog_id || plugin.plugin_id))
    .filter(Boolean);

  const add = type => onChange([...commands, { id: createId('cmd'), type, params: {} }]);
  const update = (id, params) => onChange(commands.map(command => command.id === id ? { ...command, params: { ...command.params, ...params } } : command));
  const remove = id => onChange(commands.filter(command => command.id !== id));
  const duplicate = id => {
    const index = commands.findIndex(command => command.id === id);
    if (index < 0) return;
    const next = [...commands];
    next.splice(index + 1, 0, { ...cloneData(next[index]), id: createId('cmd') });
    onChange(next);
  };
  const move = (id, offset) => {
    const from = commands.findIndex(command => command.id === id);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= commands.length) return;
    const next = [...commands];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <>
      <div className="mb-3 space-y-1">
        {commands.map((command, index) => {
          const commandType = COMMAND_MAP[command.type];
          return <div key={command.id} className="group relative flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"><span className="w-6 text-right text-xs text-zinc-600">{index + 1}</span>{commandType ? <commandType.icon size={14} className="flex-shrink-0 text-violet-400" /> : <Zap size={14} className="flex-shrink-0 text-amber-400" />}<CommandRow command={command} update={update} gameData={gameData} t={t} /><div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><button aria-label="上へ" onClick={() => move(command.id, -1)} className="p-1 text-zinc-500 hover:text-white"><ChevronUp size={14} /></button><button aria-label="下へ" onClick={() => move(command.id, 1)} className="p-1 text-zinc-500 hover:text-white"><ChevronDown size={14} /></button><button aria-label="複製" onClick={() => duplicate(command.id)} className="p-1 text-zinc-500 hover:text-violet-400"><Copy size={14} /></button><button aria-label="削除" onClick={() => remove(command.id)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button></div></div>;
        })}
        {!commands.length && <p className="py-4 text-center text-xs text-zinc-600">コマンドを追加してください</p>}
      </div>
      <CommandPicker onAdd={add} t={t} extensions={extensions} />
    </>
  );
}

function CommandRow({ command, update, gameData, t }) {
  const [open, setOpen] = useState(false);
  const commandType = COMMAND_MAP[command.type];
  const extension = getOfficialExtensionByCommand(command.type);
  if (!commandType && extension) return <span className="flex-1 text-xs text-zinc-300"><span className="font-medium">{extension.name}</span><span className="ml-2 text-zinc-500">公式拡張コマンド</span></span>;
  if (!commandType) return <span className="flex-1 text-xs text-zinc-500">{command.type}</span>;
  const summary = getCommandSummary(command, t);
  return <><button onClick={() => setOpen(value => !value)} className="min-w-0 flex-1 truncate text-left text-xs text-zinc-300 hover:text-white"><span className="font-medium">{t(commandType.labelKey)}</span>{summary && <span className="ml-2 text-zinc-500">{summary}</span>}</button>{open && <div className="absolute left-8 right-8 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-xl"><CommandParamsEditor cmd={command} updateCommand={update} gameData={gameData} t={t} />{command.type === 'choices' && (command.params?.choices || []).map((choice, index) => <div key={index} className="mt-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3"><p className="mb-2 text-xs font-medium text-violet-300">「{choice || `選択肢 ${index + 1}`}」を選んだ時</p><CommandSequenceEditor commands={command.params?.branches?.[index] || []} onChange={commands => { const branches = [...(command.params?.branches || [])]; branches[index] = commands; update(command.id, { branches }); }} gameData={gameData} t={t} /></div>)}</div>}</>;
}

function CommandPicker({ onAdd, t, extensions }) {
  const [open, setOpen] = useState(false);
  return <div className="relative"><Button variant="outline" size="sm" onClick={() => setOpen(value => !value)} className="border-zinc-700 bg-zinc-800/50 text-zinc-300"><Plus size={14} className="mr-1" />コマンドを追加</Button>{open && <><button aria-label="閉じる" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} /><div className="absolute z-50 mt-1 grid max-h-96 w-[min(40rem,80vw)] grid-cols-1 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 p-2 shadow-xl sm:grid-cols-2">{COMMAND_CATEGORIES.map(category => <div key={category.id} className="mb-2"><div className="px-2 py-1 text-xs font-medium text-violet-400">{t(category.labelKey)}</div>{category.commands.map(command => <button key={command.id} onClick={() => { onAdd(command.id); setOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"><command.icon size={14} className="text-violet-400" />{t(command.labelKey)}</button>)}</div>)}{extensions.length > 0 && <div className="mb-2"><div className="px-2 py-1 text-xs font-medium text-amber-400">有効な公式拡張</div>{extensions.map(extension => <button key={extension.id} onClick={() => { onAdd(extension.commandId); setOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"><Zap size={14} className="text-amber-400" />{extension.name}</button>)}</div>}</div></>}</div>;
}

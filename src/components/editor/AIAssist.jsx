import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Check, ChevronDown, ChevronUp, History, KeyRound, Loader2, Map, Package, Send, Settings2, ShieldCheck, Sparkles, Swords, Trash2, Users, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { applyAIActions, validateAIActions } from '@/lib/aiActions';
import { requestAI } from '@/lib/aiClient';

const ACTION_META = {
  add_map: ['マップを追加', Map], add_item: ['アイテムを追加', Package], add_skill: ['スキルを追加', Sparkles],
  add_actor: ['仲間を追加', Users], add_enemy: ['敵を追加', Swords], add_event: ['イベントを追加', WandSparkles],
  add_common_event: ['コモンイベントを追加', WandSparkles], set_system: ['システムを更新', Settings2],
};
const QUICK_PROMPTS = [
  ['会話イベント', '開始マップに、話しかけるとゲームの目的を説明してくれる案内役イベントを追加して。'],
  ['町と店', '最初の町用に回復薬と薬草を追加して、アイテムをもらえる短いイベントも作って。'],
  ['仲間と敵', '主人公の仲間になる魔法使いと、序盤に戦う敵を2種類追加して。'],
  ['スキル案', '序盤用の物理スキルと魔法スキルを3つ追加して。MP消費と威力をバランスよく設定して。'],
];
const safeLogs = () => {
  try { return JSON.parse(localStorage.getItem('rpgedit_ai_logs_v2') || '[]'); } catch { return []; }
};

export default function AIAssist({ gameData, updateGameData }) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState(() => localStorage.getItem('rpgedit_ai_provider_v2') || 'openai');
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('rpgedit_ai_api_url_v2') || 'https://api.openai.com');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('rpgedit_ai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('rpgedit_ai_model_v2') || 'gpt-4o-mini');
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem('rpgedit_local_ai_url_v2') || 'http://localhost:11434');
  const [localModel, setLocalModel] = useState(() => localStorage.getItem('rpgedit_local_model_v2') || 'llama3.2');
  const [showSettings, setShowSettings] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [logs, setLogs] = useState(safeLogs);
  const summary = useMemo(() => [
    ['マップ', gameData.maps?.length || 0], ['仲間', gameData.actors?.length || 0], ['敵', gameData.enemies?.length || 0], ['スキル', gameData.skills?.length || 0], ['イベント', (gameData.maps || []).reduce((total, map) => total + (map.events?.length || 0), 0)],
  ], [gameData]);

  useEffect(() => { localStorage.removeItem('rpgedit_ai_api_key'); }, []);
  const saveSettings = () => {
    localStorage.setItem('rpgedit_ai_provider_v2', provider);
    localStorage.setItem('rpgedit_ai_api_url_v2', apiUrl);
    localStorage.setItem('rpgedit_ai_model_v2', model);
    localStorage.setItem('rpgedit_local_ai_url_v2', localUrl);
    localStorage.setItem('rpgedit_local_model_v2', localModel);
    if (apiKey) sessionStorage.setItem('rpgedit_ai_api_key', apiKey); else sessionStorage.removeItem('rpgedit_ai_api_key');
    toast({ title: 'AI設定を保存しました' });
  };
  const writeLog = entry => {
    const next = [entry, ...logs].slice(0, 30);
    setLogs(next);
    localStorage.setItem('rpgedit_ai_logs_v2', JSON.stringify(next));
  };
  const send = async () => {
    if (!prompt.trim() || loading) return;
    const requested = prompt.trim();
    setLoading(true);
    try {
      const raw = await requestAI({ provider, apiUrl, apiKey, model, localUrl, localModel, prompt: requested, gameData });
      const checked = validateAIActions(raw, gameData);
      if (!checked.actions.length) throw new Error(checked.warnings[0] || '反映できる操作を生成できませんでした。');
      setResult(checked);
      setSelected(new Set(checked.actions.map((_, index) => index)));
      writeLog({ prompt: requested, message: checked.message, actions: checked.actions, warnings: checked.warnings, time: new Date().toLocaleString('ja-JP') });
      setPrompt('');
    } catch (error) { toast({ title: 'AI生成に失敗しました', description: error.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  const apply = actions => {
    const applied = applyAIActions(gameData, actions);
    if (!applied.applied) { toast({ title: '反映できる操作がありません', description: applied.skipped[0], variant: 'destructive' }); return; }
    updateGameData(() => applied.gameData);
    toast({ title: `${applied.applied}件の変更を反映しました`, description: applied.skipped.length ? applied.skipped.join(' ') : undefined });
    setResult(null);
    setSelected(new Set());
  };
  const toggle = index => setSelected(previous => {
    const next = new Set(previous);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });
  const selectedActions = result?.actions.filter((_, index) => selected.has(index)) || [];

  return <div className="h-full overflow-y-auto p-4 md:p-6"><div className="mx-auto max-w-3xl space-y-4">
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-zinc-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Brain size={22} className="text-violet-300" /><h2 className="text-lg font-semibold text-zinc-100">AI制作アシスト</h2></div><p className="mt-2 text-sm text-zinc-400">指示からゲーム用の変更案を作成します。反映前に内容を確認し、必要なものだけ選べます。</p></div><button type="button" onClick={() => setShowSettings(value => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-violet-400 hover:text-white"><KeyRound size={14} />接続設定{showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>
      <div className="mt-4 flex flex-wrap gap-2">{summary.map(([label, value]) => <span key={label} className="rounded-full border border-zinc-700 bg-zinc-950/40 px-2.5 py-1 text-xs text-zinc-400"><b className="mr-1 text-zinc-200">{value}</b>{label}</span>)}</div>
    </section>
    {showSettings && <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setProvider('openai')} className={`rounded-lg border p-3 text-left ${provider === 'openai' ? 'border-violet-500 bg-violet-500/10 text-violet-200' : 'border-zinc-700 text-zinc-400'}`}><b className="block text-sm">クラウドAI</b><span className="text-xs">OpenAI互換API</span></button><button type="button" onClick={() => setProvider('ollama')} className={`rounded-lg border p-3 text-left ${provider === 'ollama' ? 'border-violet-500 bg-violet-500/10 text-violet-200' : 'border-zinc-700 text-zinc-400'}`}><b className="block text-sm">ローカルAI</b><span className="text-xs">Ollama</span></button></div>
      {provider === 'openai' ? <div className="space-y-3"><div><Label className="text-xs text-zinc-400">API URL</Label><Input value={apiUrl} onChange={event => setApiUrl(event.target.value)} placeholder="https://api.openai.com" className="mt-1 border-zinc-700 bg-zinc-800" /></div><div><Label className="text-xs text-zinc-400">APIキー</Label><Input type="password" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="sk-..." className="mt-1 border-zinc-700 bg-zinc-800" /><p className="mt-1 text-xs text-zinc-500">キーはこのブラウザタブを閉じると消えます。</p></div><div><Label className="text-xs text-zinc-400">モデル</Label><Input value={model} onChange={event => setModel(event.target.value)} placeholder="gpt-4o-mini" className="mt-1 border-zinc-700 bg-zinc-800" /></div></div> : <div className="space-y-3"><div><Label className="text-xs text-zinc-400">Ollama URL</Label><Input value={localUrl} onChange={event => setLocalUrl(event.target.value)} placeholder="http://localhost:11434" className="mt-1 border-zinc-700 bg-zinc-800" /></div><div><Label className="text-xs text-zinc-400">モデル</Label><Input value={localModel} onChange={event => setLocalModel(event.target.value)} placeholder="llama3.2" className="mt-1 border-zinc-700 bg-zinc-800" /></div></div>}
      <Button type="button" size="sm" variant="outline" onClick={saveSettings} className="border-zinc-700">設定を保存</Button></section>}
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex items-center justify-between gap-3"><Label className="text-sm font-medium text-zinc-200">何を作りたい？</Label><span className="text-xs text-zinc-500">Ctrl / ⌘ + Enter で生成</span></div><div className="flex flex-wrap gap-2">{QUICK_PROMPTS.map(([label, value]) => <button type="button" key={label} onClick={() => setPrompt(value)} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-400 hover:text-violet-200">{label}</button>)}</div><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); send(); } }} placeholder="例: 最初の町に、話しかけると回復薬をもらえる村人を追加して。" className="min-h-32 border-zinc-700 bg-zinc-800" /><Button type="button" onClick={send} disabled={loading || !prompt.trim()} className="w-full bg-violet-600 hover:bg-violet-500">{loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}{loading ? '生成しています…' : '変更案を生成'}</Button></section>
    {result && <section className="space-y-3 rounded-xl border border-violet-500/35 bg-zinc-900/60 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-violet-300" /><h3 className="font-medium text-violet-200">生成結果を確認</h3></div><button type="button" onClick={() => setResult(null)} className="text-zinc-500 hover:text-white" aria-label="生成結果を閉じる"><Trash2 size={16} /></button></div>{result.message && <p className="rounded-lg bg-zinc-800/70 p-3 text-sm text-zinc-300">{result.message}</p>}{result.warnings.map(warning => <p key={warning} className="text-xs text-amber-300">{warning}</p>)}<div className="space-y-2">{result.actions.map((action, index) => { const [label, Icon] = ACTION_META[action.type] || ['変更', Check]; return <label key={`${action.type}-${index}`} className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${selected.has(index) ? 'border-violet-500/60 bg-violet-500/10' : 'border-zinc-800 bg-zinc-950/30'}`}><input type="checkbox" checked={selected.has(index)} onChange={() => toggle(index)} className="mt-1 accent-violet-500" /><Icon size={16} className="mt-0.5 shrink-0 text-violet-300" /><span className="min-w-0 flex-1"><b className="block text-sm text-zinc-200">{label}</b><code className="mt-1 block overflow-x-auto whitespace-pre-wrap break-all text-xs text-zinc-500">{JSON.stringify(action.data, null, 1)}</code></span></label>; })}</div><Button type="button" onClick={() => apply(selectedActions)} disabled={!selectedActions.length} className="w-full bg-violet-600 hover:bg-violet-500"><Check size={16} className="mr-2" />選択した {selectedActions.length} 件を反映</Button></section>}
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setShowLog(value => !value)} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300"><History size={16} />生成履歴（{logs.length}）{showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>{logs.length > 0 && <button type="button" onClick={() => { setLogs([]); localStorage.removeItem('rpgedit_ai_logs_v2'); }} className="text-xs text-zinc-500 hover:text-red-300">履歴を消去</button>}</div>{showLog && <div className="mt-3 space-y-2">{logs.length ? logs.map((log, index) => <div key={`${log.time}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"><p className="text-xs text-zinc-500">{log.time}</p><p className="mt-1 text-sm text-violet-200">{log.prompt}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-zinc-400">{log.actions?.length || 0}件の変更案</span><Button type="button" size="sm" variant="outline" onClick={() => { setResult({ message: log.message, actions: log.actions || [], warnings: log.warnings || [] }); setSelected(new Set((log.actions || []).map((_, actionIndex) => actionIndex))); }} className="h-7 border-zinc-700 text-xs">確認して反映</Button></div></div>) : <p className="py-4 text-center text-sm text-zinc-500">履歴はありません。</p>}</div>}</section>
  </div></div>;
}

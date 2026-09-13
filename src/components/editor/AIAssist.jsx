import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Brain, Loader2, Send, Trash2, Check, Key, History,
  ChevronDown, ChevronUp, Zap, Package, Sword, Users, Map as MapIcon, FileCode, Settings as SettingsIcon
} from 'lucide-react';

const ACTION_ICONS = {
  add_map: MapIcon, add_item: Package, add_skill: Zap, add_actor: Users,
  add_enemy: Sword, add_event: FileCode, add_common_event: FileCode,
  set_system: SettingsIcon, raw_patch: Check,
};

const ACTION_LABELS = {
  add_map: 'マップ追加', add_item: 'アイテム追加', add_skill: 'スキル追加',
  add_actor: 'アクター追加', add_enemy: '敵追加', add_event: 'イベント追加',
  add_common_event: 'コモンイベント追加', set_system: 'システム設定', raw_patch: 'データパッチ',
};

export default function AIAssist({ gameData, updateGameData, gameId }) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState(() => localStorage.getItem('rpgedit_ai_provider') || 'custom');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('rpgedit_ai_api_url') || 'https://api.openai.com');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rpgedit_ai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('rpgedit_ai_model') || 'gpt-4o-mini');
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem('rpgedit_local_ai_url') || 'http://localhost:11434');
  const [localModel, setLocalModel] = useState(() => localStorage.getItem('rpgedit_local_model') || 'llama3');
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rpgedit_ai_logs') || '[]'); } catch { return []; }
  });
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const saveSettings = () => {
    localStorage.setItem('rpgedit_ai_provider', provider);
    localStorage.setItem('rpgedit_ai_api_url', apiUrl);
    localStorage.setItem('rpgedit_ai_api_key', apiKey);
    localStorage.setItem('rpgedit_ai_model', model);
    localStorage.setItem('rpgedit_local_ai_url', localUrl);
    localStorage.setItem('rpgedit_local_model', localModel);
    toast({ title: t('saved') });
  };

  const buildSystemPrompt = () => {
    const summary = {
      maps: (gameData.maps || []).map(m => ({ id: m.id, name: m.name, width: m.width, height: m.height })),
      actors: (gameData.actors || []).map(a => ({ name: a.name, level: a.level })),
      items: (gameData.items || []).map(i => ({ name: i.name, price: i.price })),
      skills: (gameData.skills || []).map(s => ({ name: s.name, mpCost: s.mpCost })),
      enemies: (gameData.enemies || []).map(e => ({ name: e.name, hp: e.hp })),
      system: gameData.system || {},
    };

    return `あなたはRPG制作アシスタントです。ユーザーの要求に応じて、ゲームデータを変更するアクションを生成してください。

現在のゲームデータ:
${JSON.stringify(summary, null, 2)}

利用可能なアクション:
1. add_map: 新しいマップを追加 - data: { name, width, height, bgColor }
2. add_item: 新しいアイテムを追加 - data: { name, price, description, itemType, hp, mp, attack, defense }
3. add_skill: 新しいスキルを追加 - data: { name, mpCost, power, hitRate, element, target, description }
4. add_actor: 新しいアクターを追加 - data: { name, classId, level, hp, mp, attack, defense }
5. add_enemy: 新しい敵を追加 - data: { name, hp, mp, attack, defense, agility, exp, gold }
6. add_event: マップにイベントを追加 - data: { mapId, name, x, y, trigger, commands }
7. add_common_event: コモンイベントを追加 - data: { name, trigger, commands }
8. set_system: システム設定を変更 - data: { startMapId, startX, startY, battleSystem, currency }
9. raw_patch: ゲームデータに直接パッチ - data: { key: value }

イベントコマンド形式:
- { type: "message", params: { text: "..." } }
- { type: "choices", params: { choices: ["選択肢1", "選択肢2"] } }
- { type: "switch", params: { switchName: "1", value: "ON" } }
- { type: "variable", params: { varName: "1", value: "10" } }
- { type: "gold", params: { operation: "+", amount: 100 } }
- { type: "item", params: { operation: "+", itemName: "ポーション", amount: 1 } }
- { type: "transfer", params: { mapName: "村", x: 5, y: 5 } }
- { type: "wait", params: { duration: 60 } }
- { type: "condition", params: { expression: "switch[1] == ON" } }
- { type: "bgm", params: { audioName: "url" } }
- { type: "se", params: { audioName: "url" } }

出力形式:
以下のJSON形式で応答してください:
{
  "actions": [
    { "type": "add_...", "data": { ... } }
  ],
  "message": "ユーザーへの説明文"
}
JSONコードブロック(\\\`\\\`\\\`json)で囲まず、直接JSONを出力してください。`;
  };

  const send = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    const userPrompt = prompt;
    try {
      let result = null;
      if (provider === 'custom') {
        if (!apiKey) {
          toast({ title: 'API キーを入力してください', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const response = await fetch(`${apiUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: buildSystemPrompt() },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        result = parseAIResponse(text);
      } else {
        const response = await fetch(`${localUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: localModel,
            prompt: `${buildSystemPrompt()}\n\nユーザーの要求: ${userPrompt}`,
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`Local AI error: ${response.status}`);
        const data = await response.json();
        const text = data.response || '';
        result = parseAIResponse(text);
      }

      if (result && result.actions) {
        setLastResult(result);
      } else {
        toast({ title: 'AIの応答を解析できませんでした', variant: 'destructive' });
      }

      const entry = { prompt: userPrompt, response: result ? JSON.stringify(result, null, 2) : '', time: new Date().toLocaleString('ja-JP'), result };
      const newLogs = [entry, ...logs].slice(0, 50);
      setLogs(newLogs);
      localStorage.setItem('rpgedit_ai_logs', JSON.stringify(newLogs));
      setPrompt('');
    } catch (e) {
      toast({ title: t('error'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (text) => {
    try {
      let jsonStr = text;
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  const applyActions = (actions) => {
    if (!actions || !actions.length) {
      toast({ title: '適用するアクションがありません' });
      return;
    }
    updateGameData(prev => {
      let next = { ...prev };
      for (const action of actions) {
        const d = action.data || {};
        switch (action.type) {
          case 'add_map':
            next.maps = [...(next.maps || []), {
              id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: d.name || '新規マップ',
              width: d.width || 20, height: d.height || 15, tileSize: 32,
              bgColor: d.bgColor || '#3a5a3a',
              layers: {
                ground: Array(d.height || 15).fill(null).map(() => Array(d.width || 20).fill(null)),
                object: Array(d.height || 15).fill(null).map(() => Array(d.width || 20).fill(null)),
              },
              events: [],
            }];
            break;
          case 'add_item':
            next.items = [...(next.items || []), { id: `item_${Date.now()}`, ...d }];
            break;
          case 'add_skill':
            next.skills = [...(next.skills || []), { id: `skill_${Date.now()}`, ...d }];
            break;
          case 'add_actor':
            next.actors = [...(next.actors || []), { id: `actor_${Date.now()}`, ...d }];
            break;
          case 'add_enemy':
            next.enemies = [...(next.enemies || []), { id: `enemy_${Date.now()}`, ...d }];
            break;
          case 'add_event':
            next.maps = (next.maps || []).map(m => {
              if (m.id === d.mapId) {
                return { ...m, events: [...(m.events || []), { id: `evt_${Date.now()}`, ...d, mapId: undefined }] };
              }
              return m;
            });
            break;
          case 'add_common_event':
            next.commonEvents = [...(next.commonEvents || []), { id: `ce_${Date.now()}`, ...d }];
            break;
          case 'set_system':
            next.system = { ...(next.system || {}), ...d };
            break;
          case 'raw_patch':
            next = { ...next, ...d };
            break;
        }
      }
      return next;
    });
    toast({ title: `${actions.length}件のアクションを適用しました` });
    setLastResult(null);
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('rpgedit_ai_logs');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={22} className="text-violet-400" />
            <h2 className="text-lg font-semibold">{t('ai_title')}</h2>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <Key size={14} /> 設定 {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setProvider('custom')} className={`p-3 rounded-lg border text-sm transition ${provider === 'custom' ? 'border-violet-500 bg-violet-600/10 text-violet-300' : 'border-zinc-700 text-zinc-400'}`}>
                <Key size={16} className="mx-auto mb-1" /><span className="text-xs">APIキー</span>
              </button>
              <button onClick={() => setProvider('local')} className={`p-3 rounded-lg border text-sm transition ${provider === 'local' ? 'border-violet-500 bg-violet-600/10 text-violet-300' : 'border-zinc-700 text-zinc-400'}`}>
                <Brain size={16} className="mx-auto mb-1" /><span className="text-xs">{t('ai_provider_local')}</span>
              </button>
            </div>
            {provider === 'custom' && (
              <div className="space-y-3">
                <div><Label className="text-xs text-zinc-400">API URL</Label><Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.openai.com" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">API Key</Label><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">{t('settings_ai_model')}</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              </div>
            )}
            {provider === 'local' && (
              <div className="space-y-3">
                <div><Label className="text-xs text-zinc-400">{t('ai_local_url')}</Label><Input value={localUrl} onChange={(e) => setLocalUrl(e.target.value)} placeholder="http://localhost:11434" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">{t('settings_ai_model')}</Label><Input value={localModel} onChange={(e) => setLocalModel(e.target.value)} placeholder="llama3" className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              </div>
            )}
            <Button size="sm" onClick={saveSettings} variant="outline" className="border-zinc-700">{t('save')}</Button>
          </div>
        )}

        {/* Prompt */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <Label className="text-sm font-medium text-zinc-300">{t('ai_prompt')}</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 宿屋のおばあさんがポーションをくれるイベントを作って。薬草と回復薬のアイテムも追加して。"
            className="bg-zinc-800 border-zinc-700 text-sm min-h-[100px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
          />
          <Button onClick={send} disabled={loading || !prompt.trim()} className="w-full bg-violet-600 hover:bg-violet-500">
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
            {loading ? '生成中...' : '送信'}
          </Button>
          <p className="text-xs text-zinc-600 text-center">Ctrl+Enter で送信</p>
        </div>

        {/* Last result preview */}
        {lastResult && (
          <div className="bg-zinc-900/50 rounded-xl border border-violet-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-violet-300">AI生成結果</h3>
              <button onClick={() => setLastResult(null)} className="text-zinc-500 hover:text-white"><Trash2 size={14} /></button>
            </div>
            {lastResult.message && (
              <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{lastResult.message}</p>
            )}
            {lastResult.actions && lastResult.actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">生成されるアクション ({lastResult.actions.length}件):</p>
                {lastResult.actions.map((a, i) => {
                  const Icon = ACTION_ICONS[a.type] || Check;
                  return (
                    <div key={i} className="flex items-start gap-2 bg-zinc-800/50 rounded-lg p-2.5">
                      <Icon size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-zinc-300">{ACTION_LABELS[a.type] || a.type}</span>
                        <pre className="text-xs text-zinc-500 mt-1 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(a.data, null, 1)}</pre>
                      </div>
                    </div>
                  );
                })}
                <Button onClick={() => applyActions(lastResult.actions)} className="w-full bg-violet-600 hover:bg-violet-500">
                  <Check size={16} className="mr-2" /> {lastResult.actions.length}件のアクションを適用
                </Button>
              </div>
            )}
          </div>
        )}

        {/* AI Log */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowLog(!showLog)} className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100">
              <History size={16} /> AIログ ({logs.length})
              {showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {logs.length > 0 && (
              <button onClick={clearLogs} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1">
                <Trash2 size={12} /> クリア
              </button>
            )}
          </div>
          {showLog && (
            <div ref={logRef} className="space-y-3 max-h-[400px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">ログがありません</p>
              ) : logs.map((log, i) => (
                <div key={i} className="bg-zinc-950/50 rounded-lg border border-zinc-800 p-3 space-y-2">
                  <div className="text-xs text-zinc-500">{log.time}</div>
                  <div className="text-sm text-violet-300 bg-violet-950/30 rounded p-2">
                    <span className="text-xs text-zinc-500">プロンプト: </span>{log.prompt}
                  </div>
                  {log.result?.message && (
                    <div className="text-sm text-zinc-300 bg-zinc-900 rounded p-2">{log.result.message}</div>
                  )}
                  {log.result?.actions?.length > 0 && (
                    <Button size="sm" onClick={() => applyActions(log.result.actions)} className="bg-violet-600 hover:bg-violet-500 h-7 text-xs">
                      <Check size={12} className="mr-1" /> {log.result.actions.length}件を適用
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

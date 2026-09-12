import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Trash2, Puzzle, ToggleLeft, ToggleRight, ExternalLink, Search, Upload, FileCode, Settings, Download, X, Code } from 'lucide-react';

export default function PluginManager({ gameData, updateGameData }) {
  const { t } = useI18n();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(null); // plugin_id
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [newPlugin, setNewPlugin] = useState({ name: '', description: '', code: '', version: '1.0.0', category: 'custom', is_public: false, settings_schema: {} });

  const installedPlugins = gameData.plugins || [];

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const data = await base44.entities.Plugin.filter({ is_public: true }, '-install_count', 50);
      setPlugins(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = (pluginId) => {
    updateGameData(prev => {
      const installed = prev.plugins || [];
      const isInstalled = installed.some(p => p.plugin_id === pluginId);
      if (isInstalled) {
        return { ...prev, plugins: installed.filter(p => p.plugin_id !== pluginId) };
      }
      const plugin = plugins.find(p => p.id === pluginId);
      return {
        ...prev,
        plugins: [...installed, { plugin_id: pluginId, enabled: true, code: plugin?.code || '', settings: {} }],
      };
    });
  };

  const isInstalled = (pluginId) => installedPlugins.some(p => p.plugin_id === pluginId);

  const toggleEnabled = (pluginId) => {
    updateGameData(prev => ({
      ...prev,
      plugins: (prev.plugins || []).map(p =>
        p.plugin_id === pluginId ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const updatePluginSettings = (pluginId, settings) => {
    updateGameData(prev => ({
      ...prev,
      plugins: (prev.plugins || []).map(p =>
        p.plugin_id === pluginId ? { ...p, settings: { ...p.settings, ...settings } } : p
      ),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const name = file.name.replace(/\.[^.]+$/, '');
      // Extract settings schema from plugin code
      let settingsSchema = {};
      try {
        let transformed = text
          .replace(/export\s+default\s+/g, 'module.exports = ')
          .replace(/export\s+(?:const|let|var)\s+(\w+)/g, 'const $1 = module.exports.$1 =')
          .replace(/export\s+function\s+(\w+)/g, 'const $1 = function $1; module.exports.$1 = $1');
        const fn = new Function('module', 'exports', transformed);
        const mod = { exports: {} };
        fn(mod, mod.exports);
        const plugin = mod.exports.default || mod.exports;
        if (plugin && plugin.settings) settingsSchema = plugin.settings;
      } catch {}
      setNewPlugin(prev => ({ ...prev, name: prev.name || name, code: text, settings_schema: settingsSchema }));
      toast({ title: 'ファイル読み込み完了' });
    } catch (err) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const createPlugin = async () => {
    if (!newPlugin.name || !newPlugin.code) {
      toast({ title: '名前とコードファイルが必要です', variant: 'destructive' });
      return;
    }
    try {
      await base44.entities.Plugin.create({
        ...newPlugin,
        author_name: '',
      });
      toast({ title: t('saved') });
      setNewPlugin({ name: '', description: '', code: '', version: '1.0.0', category: 'custom', is_public: false, settings_schema: {} });
      setShowUpload(false);
      loadPlugins();
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const downloadPluginTemplate = () => {
    const template = `/**
 * RPG edit プラグインテンプレート
 * 外部エディタでこのファイルを作成し、アップロードしてください
 */

export default {
  // ─── メタデータ ─────────────────────────
  name: "サンプルプラグイン",
  version: "1.0.0",
  author: "あなたの名前",
  description: "プラグインの説明",

  // ─── 設定スキーマ（ゲームごとに設定可能） ────
  settings: {
    difficulty: {
      label: "難易度",
      type: "select",
      options: ["かんたん", "ふつう", "むずかしい"],
      default: "ふつう",
    },
    maxItems: {
      label: "最大アイテム数",
      type: "number",
      default: 99,
    },
  },

  // ─── ライフサイクルフック ───────────────
  onLoad(api) {
    console.log("プラグインが読み込まれました");
  },
  onUnload() {
    console.log("プラグインがアンロードされました");
  },
  onGameStart(api) {
    console.log("ゲーム開始");
  },
  onMapEnter(api, map) {
    console.log("マップ入場:", map.name);
  },
  onMapExit(api, map) {
    console.log("マップ退場:", map.name);
  },

  // ─── フレームフック ─────────────────────
  onUpdate(api, dt) {
    // 毎フレーム呼ばれる
  },
  onRenderBefore(api, ctx) {
    // マップ描画前に呼ばれる
  },
  onRenderAfter(api, ctx) {
    // マップ描画後に呼ばれる（UIの前に）
  },

  // ─── イベントフック ─────────────────────
  onEventTrigger(api, event) {
    // イベント実行前に呼ばれる
  },
  onEventCommand(api, command) {
    // コマンド実行前に呼ばれる
  },

  // ─── カスタムフック & プラグイン間通信 ──
  // onLoad(api) 内で api.registerCommand(type, handler) でコマンド動的登録
  // api.onCustom(name, handler) でカスタムフック登録
  // api.fireCustom(name, ...args) でカスタムフック実行
  // api.getPlugin(name) で他プラグインインスタンス取得
  // api.getData(key), api.getGameData() でゲームデータアクセス
  // api.random(min,max), api.clamp(v,min,max), api.lerp(a,b,t), api.distance(...)
  // api.getSetting(key), api.settings でプラグイン設定取得
  // api.getParty(), api.getMaps(), api.getEvents(), api.getPlayerPos() 等

  // ─── カスタムコマンド（イベントエディタに追加される） ──
  commands: {
    customMessage: {
      label: "カスタムメッセージ",
      icon: "star",
      color: "#ff6b6b",
      params: [
        { name: "text", label: "テキスト", type: "text", default: "" },
        { name: "color", label: "色", type: "color", default: "#ffffff" },
      ],
      execute: async (api, params) => {
        await api.showMessage(params.text);
      },
    },
  },

  // ─── カスタム移動タイプ ─────────────────
  motion: {
    patrol: (entity, api, dt) => {
      // カスタム移動ロジック
    },
  },
};
`;
    const blob = new Blob([template], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpgedit_plugin_template.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = plugins.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Puzzle size={20} className="text-violet-400" /> {t('editor_tab_plugins')}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadPluginTemplate} className="border-zinc-700 text-zinc-300">
            <Download size={14} className="mr-1" /> テンプレート
          </Button>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)} variant="outline" className="border-zinc-700">
            <Upload size={14} className="mr-1" /> ファイル読み込み
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">
          {/* Upload form */}
          {showUpload && (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <FileCode size={16} className="text-violet-400" /> プラグインファイル読み込み
                </h3>
                <button onClick={() => setShowUpload(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
              </div>
              <p className="text-xs text-zinc-500">外部で作成した .js ファイルをアップロードしてプラグインとして登録します。</p>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                <input ref={fileInputRef} type="file" accept=".js,.mjs" onChange={handleFileUpload} className="hidden" />
                <FileCode size={32} className="mx-auto text-zinc-600 mb-2" />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-zinc-700">
                  {uploading ? t('loading') : 'ファイルを選択 (.js)'}
                </Button>
                {newPlugin.code && <p className="text-xs text-emerald-400 mt-2">✓ 読み込み完了 ({newPlugin.code.length}文字)</p>}
              </div>
              {newPlugin.code && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-zinc-400">プラグイン名</Label>
                      <Input value={newPlugin.name} onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">バージョン</Label>
                      <Input value={newPlugin.version} onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">説明</Label>
                    <Input value={newPlugin.description} onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">カテゴリ</Label>
                    <Select value={newPlugin.category} onValueChange={(v) => setNewPlugin({ ...newPlugin, category: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="system">システム</SelectItem>
                        <SelectItem value="battle">戦闘</SelectItem>
                        <SelectItem value="ui">UI</SelectItem>
                        <SelectItem value="motion">モーション</SelectItem>
                        <SelectItem value="custom">カスタム</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={newPlugin.is_public} onChange={(e) => setNewPlugin({ ...newPlugin, is_public: e.target.checked })} className="w-4 h-4 rounded accent-violet-600" />
                    <span className="text-sm text-zinc-300">公開する（他のユーザーが導入可能にする）</span>
                  </label>
                  <Button onClick={createPlugin} className="bg-violet-600 hover:bg-violet-500">{t('save')}</Button>
                </>
              )}
            </div>
          )}

          {/* Installed plugins */}
          {installedPlugins.length > 0 && (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-2">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">導入済みプラグイン ({installedPlugins.length})</h3>
              {installedPlugins.map(ip => {
                const plugin = plugins.find(p => p.id === ip.plugin_id);
                const settingsSchema = plugin?.settings_schema || {};
                const settingsKeys = Object.keys(settingsSchema);
                return (
                  <div key={ip.plugin_id} className="rounded-lg bg-zinc-800/50 overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Puzzle size={16} className="text-violet-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-300 truncate">{plugin?.name || ip.plugin_id}</span>
                        {settingsKeys.length > 0 && (
                          <button onClick={() => setShowSettings(showSettings === ip.plugin_id ? null : ip.plugin_id)} className="p-1 text-zinc-500 hover:text-violet-400">
                            <Settings size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleEnabled(ip.plugin_id)} className="text-zinc-400 hover:text-violet-400">
                          {ip.enabled ? <ToggleRight size={20} className="text-violet-400" /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => togglePlugin(ip.plugin_id)} className="text-zinc-500 hover:text-red-400">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    {showSettings === ip.plugin_id && settingsKeys.length > 0 && (
                      <div className="border-t border-zinc-700 p-3 space-y-2 bg-zinc-900/30">
                        {settingsKeys.map(key => {
                          const schema = settingsSchema[key];
                          const val = ip.settings?.[key] ?? schema.default;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <Label className="text-xs text-zinc-400 w-32 flex-shrink-0">{schema.label || key}</Label>
                              {schema.type === 'select' ? (
                                <Select value={val} onValueChange={(v) => updatePluginSettings(ip.plugin_id, { [key]: v })}>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-xs h-7 flex-1"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {(schema.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  type={schema.type === 'number' ? 'number' : 'text'}
                                  value={val}
                                  onChange={(e) => updatePluginSettings(ip.plugin_id, { [key]: schema.type === 'number' ? Number(e.target.value) : e.target.value })}
                                  className="bg-zinc-800 border-zinc-700 text-xs h-7 flex-1"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Browse plugins */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300">プラグインを探す</h3>
              <Link to="/plugin-docs" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <Code size={12} /> {t('nav_plugin_docs')}
              </Link>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="bg-zinc-800 border-zinc-700 text-sm" />
            </div>
            {loading ? (
              <div className="text-center py-8 text-zinc-500">{t('loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Puzzle size={32} className="mx-auto mb-2 opacity-30" />
                {t('noData')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(plugin => (
                  <div key={plugin.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-zinc-200">{plugin.name}</h4>
                        <span className="text-xs text-zinc-600">v{plugin.version} · {plugin.category}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={isInstalled(plugin.id) ? 'outline' : 'default'}
                        onClick={() => togglePlugin(plugin.id)}
                        className={isInstalled(plugin.id) ? 'border-zinc-700 text-zinc-400' : 'bg-violet-600 hover:bg-violet-500'}
                      >
                        {isInstalled(plugin.id) ? '導入済み' : '導入'}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{plugin.description || ''}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1"><Download size={11} /> {plugin.install_count || 0}</span>
                      {plugin.settings_schema && Object.keys(plugin.settings_schema).length > 0 && (
                        <span className="flex items-center gap-1"><Settings size={11} /> 設定あり</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
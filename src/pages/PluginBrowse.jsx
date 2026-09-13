import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { OFFICIAL_EXTENSIONS, getExtensionSettingsSchema } from '@/lib/officialExtensions';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Puzzle, Search, X, Code, Download, Upload, FileCode, Settings, Star } from 'lucide-react';

export default function PluginBrowse() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const fileInputRef = useRef(null);
  const [newPlugin, setNewPlugin] = useState({ name: '', description: '', code: '', version: '1.0.0', category: 'custom', is_public: true, settings_schema: '{}', team_id: 'none' });

  useEffect(() => { loadPlugins(); }, [categoryFilter]);
  useEffect(() => { loadTeams(); }, [user]);

  const loadPlugins = async () => {
    try {
      let data = await base44.entities.Plugin.filter({ is_public: true }, '-install_count', 100);
      data = (data || []).filter(p => !p.team_id);
      const official = OFFICIAL_EXTENSIONS.map(extension => ({
        ...extension,
        settings_schema: getExtensionSettingsSchema(extension),
        install_count: null,
      }));
      const combined = [...official, ...data];
      setPlugins(categoryFilter === 'all' ? combined : combined.filter(plugin => plugin.category === categoryFilter));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadTeams = async () => {
    if (!user) return;
    try {
      const teams = await base44.entities.Team.filter({}, '-created_date', 50);
      setUserTeams((teams || []).filter(tm => (tm.members || []).includes(user.id)));
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const name = file.name.replace(/\.[^.]+$/, '');
      let schema = {};
      try {
        const schemaMatch = text.match(/settings\s*:\s*\{([\s\S]*?)\n\s*\},/);
        if (schemaMatch) {
          const keys = schemaMatch[1].match(/(\w+)\s*:\s*\{/g);
          if (keys) keys.forEach(k => { const key = k.match(/(\w+)/)[1]; schema[key] = { label: key, type: 'text', default: '' }; });
        }
      } catch {}
      setNewPlugin(prev => ({ ...prev, name: prev.name || name, code: text, settings_schema: JSON.stringify(schema) }));
      toast({ title: t('plugin_file_read') });
    } catch (err) { toast({ title: t('error'), variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const createPlugin = async () => {
    if (!isAuthenticated) { toast({ title: t('export_login_required'), variant: 'destructive' }); return; }
    if (!newPlugin.name || !newPlugin.code) { toast({ title: t('plugin_name_code_required'), variant: 'destructive' }); return; }
    if (!/export\s+default\s+/.test(newPlugin.code)) {
      toast({ title: 'export default が必要です', description: 'テンプレート形式の既定エクスポートを追加してください。', variant: 'destructive' });
      return;
    }
    try {
      let schema = {};
      try {
        schema = JSON.parse(newPlugin.settings_schema);
        if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('invalid schema');
      } catch {
        toast({ title: '設定スキーマが不正です', description: 'JSONオブジェクト形式で入力してください。', variant: 'destructive' });
        return;
      }
      await base44.entities.Plugin.create({
        name: newPlugin.name, description: newPlugin.description, code: newPlugin.code,
        version: newPlugin.version, category: newPlugin.category,
        is_public: true, settings_schema: schema,
        team_id: newPlugin.team_id === 'none' ? '' : newPlugin.team_id,
      });
      toast({ title: t('saved') });
      setNewPlugin({ name: '', description: '', code: '', version: '1.0.0', category: 'custom', is_public: true, settings_schema: '{}', team_id: 'none' });
      setShowCreate(false);
      loadPlugins();
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const downloadTemplate = () => {
    const template = `/**\n * RPG edit Plugin\n */\nexport default {\n  name: "My Plugin",\n  version: "1.0.0",\n  description: "Plugin description",\n\n  settings: {\n    mySetting: { label: "Setting", type: "number", default: 10 },\n  },\n\n  onLoad(api) { console.log("loaded"); },\n  onGameStart(api) { console.log("game start"); },\n  onUpdate(api, dt) {},\n\n  commands: {\n    myCommand: {\n      label: "My Command",\n      icon: "star",\n      params: [{ name: "text", label: "Text", type: "text", default: "" }],\n      execute: async (api, params) => { await api.showMessage(params.text); },\n    },\n  },\n};`;
    const blob = new Blob([template], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rpgedit_plugin.js'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = plugins.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = ['system', 'exploration', 'environment', 'narrative', 'battle', 'progression', 'items', 'movement', 'ui', 'accessibility', 'motion', 'custom'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Puzzle size={24} className="text-violet-400" /> {t('nav_plugins')}</h1>
        <div className="flex gap-2">
          <Link to="/plugin-docs"><Button variant="outline" className="border-zinc-700"><Code size={16} className="mr-1" /> {t('nav_plugin_docs')}</Button></Link>
          <Button variant="outline" onClick={downloadTemplate} className="border-zinc-700"><Download size={16} className="mr-1" /> {t('plugin_template')}</Button>
          {isAuthenticated && <Button onClick={() => setShowCreate(!showCreate)} className="bg-violet-600 hover:bg-violet-500"><Upload size={16} className="mr-1" /> {t('plugin_publish_btn')}</Button>}
        </div>
      </div>

      {showCreate && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2"><FileCode size={16} className="text-violet-400" /> {t('plugin_upload_title')}</h3>
            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
            <input ref={fileInputRef} type="file" accept=".js,.mjs" onChange={handleFileUpload} className="hidden" />
            <FileCode size={32} className="mx-auto text-zinc-600 mb-2" />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-zinc-700">{uploading ? t('loading') : t('plugin_select_file')}</Button>
            {newPlugin.code && <p className="text-xs text-emerald-400 mt-2">✓ {t('plugin_file_loaded')} ({newPlugin.code.length})</p>}
          </div>
          {newPlugin.code && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-zinc-400">{t('plugin_name_label')}</Label><Input value={newPlugin.name} onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                <div><Label className="text-xs text-zinc-400">{t('plugin_version')}</Label><Input value={newPlugin.version} onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              </div>
              <div><Label className="text-xs text-zinc-400">{t('plugin_description')}</Label><Input value={newPlugin.description} onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-zinc-400">{t('plugin_category')}</Label>
                  <Select value={newPlugin.category} onValueChange={(v) => setNewPlugin({ ...newPlugin, category: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label className="text-xs text-zinc-400">{t('plugin_settings_schema')}</Label><Input value={newPlugin.settings_schema} onChange={(e) => setNewPlugin({ ...newPlugin, settings_schema: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm font-mono" placeholder='{}' /></div>
              </div>
              {userTeams.length > 0 && (
                <div><Label className="text-xs text-zinc-400">{t('plugin_publish_to_team')}</Label>
                  <Select value={newPlugin.team_id} onValueChange={(v) => setNewPlugin({ ...newPlugin, team_id: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="none">{t('plugin_no_team')}</SelectItem>
                      {userTeams.map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
              )}
              <Button onClick={createPlugin} className="bg-violet-600 hover:bg-violet-500">{t('publish')}</Button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 bg-zinc-900 border-zinc-800" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-zinc-900 border-zinc-800 text-sm"><SelectValue placeholder={t('plugin_all')} /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">{t('plugin_all')}</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-center text-zinc-500 py-8">{t('loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center text-zinc-500 py-12"><Puzzle size={32} className="mx-auto mb-2 opacity-30" />{t('noData')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(plugin => (
            <Link key={plugin.plugin_id || plugin.id} to={`/plugin/${encodeURIComponent(plugin.plugin_id || plugin.id)}`} className="block bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 hover:border-violet-500/30 transition cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0"><Puzzle size={18} className="text-violet-400 flex-shrink-0" /><h4 className="text-sm font-medium text-zinc-200 truncate">{plugin.name}</h4></div>
                <span className="text-xs text-zinc-600 flex-shrink-0">{plugin.official ? <span className="text-amber-400 flex items-center gap-1"><Star size={11} />公式</span> : `v${plugin.version}`}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{plugin.description || ''}</p>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{plugin.category}</span>
                <span className="flex items-center gap-2">
                  {plugin.official ? <span className="text-emerald-400">安全な内蔵機能</span> : <span className="flex items-center gap-1"><Download size={11} /> {plugin.install_count || 0}</span>}
                  {plugin.settings_schema && Object.keys(plugin.settings_schema).length > 0 && <span className="flex items-center gap-1"><Settings size={11} /> {t('plugin_settings')}</span>}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

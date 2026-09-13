import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { getOfficialExtension, getExtensionSettingsSchema } from '@/lib/officialExtensions';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ArrowLeft, Download, Copy, Settings, Tag, Pencil, Save, Eye, EyeOff, Puzzle, Trash2, Users } from 'lucide-react';

export default function PluginDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => { loadPlugin(); loadTeams(); }, [id]);

  const loadPlugin = async () => {
    try {
      const official = getOfficialExtension(id);
      if (official) {
        const builtIn = { ...official, id: official.plugin_id, settings_schema: getExtensionSettingsSchema(official), code: '', install_count: null };
        setPlugin(builtIn);
        setEditDesc(builtIn.description || '');
        setSelectedTeam('none');
        return;
      }
      const p = await rpgStore.entities.Plugin.get(id);
      setPlugin(p);
      setEditDesc(p.description || '');
      setSelectedTeam(p.team_id || 'none');
      try {
        const profiles = await rpgStore.entities.Profile.filter({ user_id: p.created_by_id });
        setCreator({ profile: profiles?.[0] });
      } catch (e) { console.error(e); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadTeams = async () => {
    if (!user) return;
    try {
      const teams = await rpgStore.entities.Team.filter({}, '-created_date', 50);
      setUserTeams((teams || []).filter(tm => (tm.members || []).includes(user.id)));
    } catch (e) { console.error(e); }
  };

  const downloadCode = () => {
    const blob = new Blob([plugin.code || ''], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${plugin.name}.js`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = () => { navigator.clipboard?.writeText(plugin.code || ''); toast({ title: t('detail_copy_done') }); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await rpgStore.entities.Plugin.update(id, { description: editDesc });
      setPlugin({ ...plugin, description: editDesc });
      setEditing(false);
      toast({ title: t('saved') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const togglePublic = async () => {
    try {
      const newVal = !plugin.is_public;
      await rpgStore.entities.Plugin.update(id, { is_public: newVal });
      setPlugin({ ...plugin, is_public: newVal });
      toast({ title: newVal ? t('detail_public') : t('detail_private') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const saveTeam = async () => {
    try {
      const teamId = selectedTeam === 'none' ? '' : selectedTeam;
      await rpgStore.entities.Plugin.update(id, { team_id: teamId });
      setPlugin({ ...plugin, team_id: teamId });
      toast({ title: t('saved') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const deleteItem = async () => {
    if (!confirm(t('detail_delete_confirm'))) return;
    try {
      await rpgStore.entities.Plugin.delete(id);
      toast({ title: t('detail_deleted') });
      navigate('/plugins');
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const isOwner = user && plugin && user.id === plugin.created_by_id;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>;
  if (!plugin) return <div className="text-center py-20"><p className="text-zinc-500 mb-4">{t('detail_not_found')}</p><Link to="/plugins"><Button variant="outline">{t('back')}</Button></Link></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/plugins" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-4">
        <ArrowLeft size={16} /> {t('nav_plugins')}
      </Link>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
            <Puzzle size={24} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-100">{plugin.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
              <span>v{plugin.version}</span><span>·</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{plugin.category}</span><span>·</span>
              {plugin.official ? <span className="text-emerald-400">公式・安全な内蔵機能</span> : <span className="flex items-center gap-1"><Download size={11} /> {plugin.install_count || 0} {t('detail_installs')}</span>}
              {plugin.team_id && <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/20 text-violet-400"><Users size={10} /> {t('detail_team_only')}</span>}
              {!plugin.team_id && (plugin.is_public ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400"><Eye size={10} /> {t('detail_public')}</span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-500"><EyeOff size={10} /> {t('detail_private')}</span>
              ))}
            </div>
          </div>
        </div>

        {creator && (
          <Link to={`/user/${plugin.created_by_id}`} className="inline-flex items-center gap-2 mb-4 group">
            {creator.profile?.avatar ? <img src={creator.profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">{(creator.profile?.display_name || '?').charAt(0)}</div>}
            <span className="text-sm text-zinc-400 group-hover:text-violet-400 transition">{creator.profile?.display_name || t('detail_unknown')}</span>
          </Link>
        )}

        {editing ? (
          <div className="mb-4">
            <label className="text-xs text-zinc-500 block mb-1">{t('asset_description')}</label>
            <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm mb-2" rows={4} />
            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={saving} className="bg-violet-600 hover:bg-violet-500"><Save size={14} className="mr-1" /> {saving ? t('loading') : t('detail_save_btn')}</Button>
              <Button onClick={() => { setEditing(false); setEditDesc(plugin.description || ''); }} variant="outline" className="border-zinc-700">{t('cancel')}</Button>
            </div>
          </div>
        ) : (
          plugin.description && <p className="text-sm text-zinc-300 whitespace-pre-wrap mb-4">{plugin.description}</p>
        )}

        {(plugin.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(plugin.tags || []).map((tag, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 flex items-center gap-1"><Tag size={10} /> {tag}</span>)}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {plugin.official ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">ゲーム編集画面の「拡張」から追加できます</div>
          ) : (
            <>
              <Button onClick={downloadCode} className="bg-violet-600 hover:bg-violet-500"><Download size={16} className="mr-1" /> {t('download')}</Button>
              <Button onClick={copyCode} variant="outline" className="border-zinc-700"><Copy size={16} className="mr-1" /> {t('detail_copy_done')}</Button>
            </>
          )}
          {isOwner && !editing && (
            <>
              <Button onClick={() => setEditing(true)} variant="outline" className="border-zinc-700"><Pencil size={16} className="mr-1" /> {t('detail_edit')}</Button>
              {!plugin.team_id && <Button onClick={togglePublic} variant="outline" className="border-zinc-700">{plugin.is_public ? <><EyeOff size={16} className="mr-1" /> {t('unpublish')}</> : <><Eye size={16} className="mr-1" /> {t('publish')}</>}</Button>}
              <Button onClick={deleteItem} variant="outline" className="border-red-700/50 text-red-400 hover:bg-red-500/10"><Trash2 size={16} className="mr-1" /> {t('detail_delete')}</Button>
            </>
          )}
        </div>
      </div>

      {isOwner && userTeams.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2"><Users size={16} className="text-violet-400" /> {t('detail_publish_team')}</h2>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-zinc-500">{t('detail_team')}</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="none">{t('detail_no_team')}</SelectItem>
                  {userTeams.map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveTeam} className="bg-violet-600 hover:bg-violet-500">{t('detail_save_team')}</Button>
          </div>
          {plugin.team_id && <p className="text-xs text-violet-400 mt-2">{t('detail_team_only')}</p>}
        </div>
      )}

      {plugin.settings_schema && Object.keys(plugin.settings_schema).length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3"><Settings size={16} className="text-violet-400" /> {t('detail_settings_title')}</h2>
          <div className="space-y-2">
            {Object.entries(plugin.settings_schema).map(([key, schema]) => (
              <div key={key} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                <div><span className="text-sm text-zinc-200">{schema.label || key}</span><span className="text-xs text-zinc-500 ml-2">({key})</span></div>
                <span className="text-xs text-zinc-500">{schema.type || 'text'}{schema.default != null ? ` / ${schema.default}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!plugin.official && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">{t('detail_code_title')}</h2>
          <pre className="bg-zinc-950 rounded-lg p-4 overflow-x-auto text-xs text-zinc-300 font-mono max-h-96 overflow-y-auto border border-zinc-800">{plugin.code || '// No code'}</pre>
        </div>
      )}
    </div>
  );
}

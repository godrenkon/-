import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ArrowLeft, Download, Copy, Tag, Volume2, Image as ImgIcon, Pencil, Save, Eye, EyeOff, Trash2, Users } from 'lucide-react';

export default function AssetDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => { loadAsset(); loadTeams(); }, [id]);

  const loadAsset = async () => {
    try {
      const a = await base44.entities.Asset.get(id);
      setAsset(a);
      setEditDesc(a.description || '');
      setSelectedTeam(a.team_id || 'none');
      try {
        const profiles = await base44.entities.Profile.filter({ user_id: a.created_by_id });
        setCreator({ profile: profiles?.[0] });
      } catch (e) { console.error(e); }
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

  const downloadFile = () => { const a = document.createElement('a'); a.href = asset.file_url; a.download = asset.name; a.target = '_blank'; a.click(); };
  const copyUrl = () => { navigator.clipboard?.writeText(asset.file_url); toast({ title: t('detail_url_copied') }); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await base44.entities.Asset.update(id, { description: editDesc });
      setAsset({ ...asset, description: editDesc });
      setEditing(false);
      toast({ title: t('saved') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const togglePublic = async () => {
    try {
      const newVal = !asset.is_public;
      await base44.entities.Asset.update(id, { is_public: newVal });
      setAsset({ ...asset, is_public: newVal });
      toast({ title: newVal ? t('detail_public') : t('detail_private') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const saveTeam = async () => {
    try {
      const teamId = selectedTeam === 'none' ? '' : selectedTeam;
      await base44.entities.Asset.update(id, { team_id: teamId });
      setAsset({ ...asset, team_id: teamId });
      toast({ title: t('saved') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const deleteItem = async () => {
    if (!confirm(t('detail_delete_confirm'))) return;
    try {
      await base44.entities.Asset.delete(id);
      toast({ title: t('detail_deleted') });
      navigate('/assets');
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const isOwner = user && asset && user.id === asset.created_by_id;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>;
  if (!asset) return <div className="text-center py-20"><p className="text-zinc-500 mb-4">{t('detail_not_found')}</p><Link to="/assets"><Button variant="outline">{t('back')}</Button></Link></div>;

  const isAudio = ['audio', 'bgm', 'se'].includes(asset.type);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-4">
        <ArrowLeft size={16} /> {t('asset_title')}
      </Link>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-5">
        <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 mb-4 flex items-center justify-center min-h-[200px]">
          {isAudio ? (
            <div className="p-8 text-center w-full"><Volume2 size={48} className="mx-auto text-zinc-600 mb-3" /><audio controls src={asset.file_url} className="w-full max-w-md mx-auto" /></div>
          ) : (asset.thumbnail || asset.file_url) ? (
            <ImageIcon src={asset.thumbnail || asset.file_url} fittingType="fit" className="w-full max-h-[400px]" />
          ) : <ImgIcon size={48} className="text-zinc-600" />}
        </div>

        <h1 className="text-xl font-bold text-zinc-100 mb-2">{asset.name}</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{t(`asset_type_${asset.type}`) || asset.type}</span>
          {asset.team_id && <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/20 text-violet-400"><Users size={10} /> {t('detail_team_only')}</span>}
          {!asset.team_id && (asset.is_public ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400"><Eye size={10} /> {t('detail_public')}</span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-500"><EyeOff size={10} /> {t('detail_private')}</span>
          ))}
        </div>

        {creator && (
          <Link to={`/user/${asset.created_by_id}`} className="inline-flex items-center gap-2 mb-4 group">
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
              <Button onClick={() => { setEditing(false); setEditDesc(asset.description || ''); }} variant="outline" className="border-zinc-700">{t('cancel')}</Button>
            </div>
          </div>
        ) : (
          asset.description && <p className="text-sm text-zinc-300 whitespace-pre-wrap mb-4">{asset.description}</p>
        )}

        {(asset.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(asset.tags || []).map((tag, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 flex items-center gap-1"><Tag size={10} /> {tag}</span>)}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={downloadFile} className="bg-violet-600 hover:bg-violet-500"><Download size={16} className="mr-1" /> {t('download')}</Button>
          <Button onClick={copyUrl} variant="outline" className="border-zinc-700"><Copy size={16} className="mr-1" /> {t('detail_url_copied')}</Button>
          {isOwner && !editing && (
            <>
              <Button onClick={() => setEditing(true)} variant="outline" className="border-zinc-700"><Pencil size={16} className="mr-1" /> {t('detail_edit')}</Button>
              {!asset.team_id && <Button onClick={togglePublic} variant="outline" className="border-zinc-700">{asset.is_public ? <><EyeOff size={16} className="mr-1" /> {t('unpublish')}</> : <><Eye size={16} className="mr-1" /> {t('publish')}</>}</Button>}
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
          {asset.team_id && <p className="text-xs text-violet-400 mt-2">{t('detail_team_only')}</p>}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Upload, Search, Music, Image as ImgIcon, Grid3x3, User, Volume2, Sparkles, Mountain, X } from 'lucide-react';

const ASSET_TYPES = [
  { value: 'image', key: 'asset_type_image', icon: ImgIcon },
  { value: 'tileset', key: 'asset_type_tileset', icon: Grid3x3 },
  { value: 'character', key: 'asset_type_character', icon: User },
  { value: 'background', key: 'asset_type_background', icon: Mountain },
  { value: 'bgm', key: 'asset_type_bgm', icon: Music },
  { value: 'se', key: 'asset_type_se', icon: Volume2 },
  { value: 'effect', key: 'asset_type_effect', icon: Sparkles },
  { value: 'audio', key: 'asset_type_audio', icon: Volume2 },
];

export default function AssetLibrary() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [myAssetsOnly, setMyAssetsOnly] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const fileInputRef = useRef(null);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'image', file_url: '', thumbnail: '', description: '', category: '', tags: [], is_public: true, team_id: 'none' });

  useEffect(() => { loadAssets(); loadTeams(); }, [typeFilter, myAssetsOnly]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const filter = {};
      if (myAssetsOnly && user) { filter.created_by_id = user.id; }
      else { filter.is_public = true; }
      if (typeFilter && typeFilter !== 'all') filter.type = typeFilter;
      let data = await base44.entities.Asset.filter(filter, '-created_date', 60);
      data = (data || []).filter(a => !a.team_id);
      setAssets(data);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewAsset(prev => ({ ...prev, file_url, name: prev.name || file.name.replace(/\.[^.]+$/, ''), thumbnail: file.type.startsWith('image/') ? file_url : prev.thumbnail }));
    } catch (err) { toast({ title: t('error'), variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const submitAsset = async () => {
    if (!isAuthenticated) { toast({ title: t('export_login_required'), variant: 'destructive' }); return; }
    if (!newAsset.name || !newAsset.file_url) { toast({ title: t('asset_name_file_required'), variant: 'destructive' }); return; }
    try {
      await base44.entities.Asset.create({ ...newAsset, team_id: newAsset.team_id === 'none' ? '' : newAsset.team_id });
      toast({ title: t('saved') });
      setNewAsset({ name: '', type: 'image', file_url: '', thumbnail: '', description: '', category: '', tags: [], is_public: true, team_id: 'none' });
      setShowUpload(false);
      loadAssets();
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const filtered = assets.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const getIcon = (type) => { const at = ASSET_TYPES.find(a => a.value === type); return at ? at.icon : ImgIcon; };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('asset_title')}</h1>
        {isAuthenticated && <Button onClick={() => setShowUpload(!showUpload)} className="bg-violet-600 hover:bg-violet-500"><Upload size={16} className="mr-1" /> {t('asset_upload')}</Button>}
      </div>

      {showUpload && isAuthenticated && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">{t('asset_upload')}</h3>
            <button onClick={() => setShowUpload(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-zinc-400">{t('asset_name')}</Label><Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
            <div><Label className="text-xs text-zinc-400">{t('asset_type')}</Label>
              <Select value={newAsset.type} onValueChange={(v) => setNewAsset({ ...newAsset, type: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{ASSET_TYPES.map(at => <SelectItem key={at.value} value={at.value}>{t(at.key)}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div><Label className="text-xs text-zinc-400">{t('asset_file')}</Label>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-zinc-700">{uploading ? t('loading') : t('asset_upload')}</Button>
              {newAsset.file_url && <span className="text-xs text-emerald-400">✓ {t('asset_uploaded')}</span>}
            </div></div>
          <div><Label className="text-xs text-zinc-400">{t('asset_description')}</Label><Textarea value={newAsset.description} onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm min-h-[60px]" /></div>
          {userTeams.length > 0 && (
            <div><Label className="text-xs text-zinc-400">{t('asset_publish_to_team')}</Label>
              <Select value={newAsset.team_id} onValueChange={(v) => setNewAsset({ ...newAsset, team_id: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="none">{t('asset_no_team')}</SelectItem>
                  {userTeams.map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                </SelectContent>
              </Select></div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={newAsset.is_public} onChange={(e) => setNewAsset({ ...newAsset, is_public: e.target.checked })} className="w-4 h-4 rounded accent-violet-600" id="asset_public" />
            <label htmlFor="asset_public" className="text-sm text-zinc-300">{t('asset_public')}</label>
          </div>
          <p className="text-xs text-amber-500/80 bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">{t('asset_public_note')}</p>
          <Button onClick={submitAsset} className="bg-violet-600 hover:bg-violet-500">{t('publish')}</Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('asset_search')} className="pl-9 bg-zinc-900 border-zinc-800" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-sm"><SelectValue placeholder={t('asset_all_types')} /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">{t('asset_all_types')}</SelectItem>
            {ASSET_TYPES.map(at => <SelectItem key={at.value} value={at.value}>{t(at.key)}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAuthenticated && <Button size="sm" variant={myAssetsOnly ? 'default' : 'outline'} onClick={() => setMyAssetsOnly(!myAssetsOnly)} className={myAssetsOnly ? 'bg-violet-600' : 'border-zinc-700'}>{t('asset_my_assets')}</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">{[...Array(12)].map((_, i) => <div key={i} className="aspect-square rounded-lg bg-zinc-900/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-zinc-500 py-20">{t('asset_no_results')}</p>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map(asset => {
            const Icon = getIcon(asset.type);
            return (
              <Link key={asset.id} to={`/asset/${asset.id}`} className="group block">
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/40 transition relative">
                  {asset.thumbnail || (asset.file_url && asset.type !== 'audio' && asset.type !== 'bgm' && asset.type !== 'se') ? (
                    <ImageIcon src={asset.thumbnail || asset.file_url} fittingType="fill" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1"><Icon size={20} /><span className="text-[10px]">{t(ASSET_TYPES.find(a => a.value === asset.type)?.key || '')}</span></div>
                  )}
                  {asset.is_public && <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400">{t('asset_free_use')}</span>}
                </div>
                <p className="text-xs text-zinc-400 mt-1 truncate">{asset.name}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImgComponent } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Users, Puzzle, Image as ImageIcon, MessageSquare, Send,
  ArrowLeft, Trash2, UserPlus, Search, Crown, Volume2, Upload, X, ChevronUp, ChevronDown
} from 'lucide-react';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ASSET_TYPES = [
  { value: 'image', key: 'asset_type_image' },
  { value: 'tileset', key: 'asset_type_tileset' },
  { value: 'character', key: 'asset_type_character' },
  { value: 'background', key: 'asset_type_background' },
  { value: 'bgm', key: 'asset_type_bgm' },
  { value: 'se', key: 'asset_type_se' },
  { value: 'effect', key: 'asset_type_effect' },
  { value: 'audio', key: 'asset_type_audio' },
];

export default function TeamDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [teamPlugins, setTeamPlugins] = useState([]);
  const [teamAssets, setTeamAssets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [uploadingPlugin, setUploadingPlugin] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [showPluginUpload, setShowPluginUpload] = useState(false);
  const [showAssetUpload, setShowAssetUpload] = useState(false);
  const [newPlugin, setNewPlugin] = useState({ name: '', description: '', code: '' });
  const [newAsset, setNewAsset] = useState({ name: '', type: 'image', file_url: '', description: '' });
  const pluginFileRef = useRef(null);
  const assetFileRef = useRef(null);
  const msgEndRef = useRef(null);

  useEffect(() => { loadTeam(); loadProfiles(); }, [id]);
  useEffect(() => {
    if (team) { loadMembers(); loadTeamPlugins(); loadTeamAssets(); loadMessages(); }
  }, [team]);
  useEffect(() => {
    if (tab === 'messages') setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, tab]);

  const loadTeam = async () => {
    try { setTeam(await base44.entities.Team.get(id)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadProfiles = async () => {
    try {
      const data = await base44.entities.Profile.list(undefined, 500);
      setAllProfiles(data || []);
      const map = {};
      (data || []).forEach(p => { if (p.user_id) map[p.user_id] = p; });
      setProfileMap(map);
    } catch (e) { console.error(e); }
  };

  const loadMembers = async () => {
    const memberData = await Promise.all(
      (team.members || []).map(async mid => {
        const profiles = await base44.entities.Profile.filter({ user_id: mid });
        return { id: mid, profile: profiles?.[0] };
      })
    );
    setMembers(memberData);
  };

  const loadTeamPlugins = async () => {
    const data = await base44.entities.Plugin.filter({ is_public: true, team_id: id }, '-created_date', 200);
    setTeamPlugins(data || []);
  };

  const loadTeamAssets = async () => {
    const data = await base44.entities.Asset.filter({ is_public: true, team_id: id }, '-created_date', 200);
    setTeamAssets(data || []);
  };

  const loadMessages = async () => {
    const data = await base44.entities.DirectMessage.filter({ team_id: id }, 'created_date', 200);
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const msg = await base44.entities.DirectMessage.create({ recipient_id: team.created_by_id, content: newMessage, team_id: id });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const getRole = (memberId) => {
    if (memberId === team.created_by_id) return 'owner';
    if (team.member_roles?.[memberId] === 'admin') return 'admin';
    return 'member';
  };

  const roleRank = { member: 0, admin: 1, owner: 2 };
  const myRole = team ? getRole(user?.id) : 'member';
  const canKick = (targetId) => {
    const targetRole = getRole(targetId);
    return roleRank[myRole] > roleRank[targetRole];
  };
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin' || isOwner;

  const addMember = async (userId) => {
    if (!userId || (team.members || []).includes(userId)) return;
    try {
      const updated = await base44.entities.Team.update(id, {
        members: [...(team.members || []), userId],
        member_roles: { ...(team.member_roles || {}), [userId]: 'member' },
      });
      setTeam(updated);
      setSearchQuery(''); setSearchResults([]);
      loadMembers();
      toast({ title: t('team_member_added') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const kickMember = async (userId) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const newMembers = (team.members || []).filter(m => m !== userId);
      const newRoles = { ...(team.member_roles || {}) };
      delete newRoles[userId];
      const updated = await base44.entities.Team.update(id, { members: newMembers, member_roles: newRoles });
      setTeam(updated);
      loadMembers();
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const setRole = async (userId, role) => {
    try {
      const newRoles = { ...(team.member_roles || {}), [userId]: role };
      const updated = await base44.entities.Team.update(id, { member_roles: newRoles });
      setTeam(updated);
      toast({ title: role === 'admin' ? t('team_promoted') : t('team_demoted') });
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const handlePluginUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlugin(true);
    try {
      const text = await file.text();
      const name = file.name.replace(/\.[^.]+$/, '');
      setNewPlugin(prev => ({ ...prev, name: prev.name || name, code: text }));
      toast({ title: t('plugin_file_read') });
    } catch (err) { toast({ title: t('error'), variant: 'destructive' }); }
    finally { setUploadingPlugin(false); }
  };

  const createTeamPlugin = async () => {
    if (!newPlugin.name || !newPlugin.code) { toast({ title: t('plugin_name_code_required'), variant: 'destructive' }); return; }
    try {
      await base44.entities.Plugin.create({
        name: newPlugin.name, description: newPlugin.description, code: newPlugin.code,
        version: '1.0.0', category: 'custom', is_public: true, team_id: id, settings_schema: {},
      });
      toast({ title: t('saved') });
      setNewPlugin({ name: '', description: '', code: '' });
      setShowPluginUpload(false);
      loadTeamPlugins();
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  const handleAssetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewAsset(prev => ({
        ...prev, file_url,
        name: prev.name || file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch (err) { toast({ title: t('detail_upload_error'), variant: 'destructive' }); }
    finally { setUploadingAsset(false); }
  };

  const createTeamAsset = async () => {
    if (!newAsset.name || !newAsset.file_url) { toast({ title: t('asset_name_file_required'), variant: 'destructive' }); return; }
    try {
      await base44.entities.Asset.create({
        name: newAsset.name, type: newAsset.type, file_url: newAsset.file_url,
        description: newAsset.description, is_public: true, team_id: id,
        thumbnail: newAsset.type === 'image' || newAsset.type === 'tileset' || newAsset.type === 'character' || newAsset.type === 'background' ? newAsset.file_url : '',
      });
      toast({ title: t('saved') });
      setNewAsset({ name: '', type: 'image', file_url: '', description: '' });
      setShowAssetUpload(false);
      loadTeamAssets();
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      (allProfiles || [])
        .filter(p => (p.display_name || '').toLowerCase().includes(q) && !(team?.members || []).includes(p.user_id))
        .slice(0, 5)
    );
  }, [searchQuery, allProfiles, team]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>;
  if (!team) return <div className="text-center py-20"><p className="text-zinc-500 mb-4">{t('team_not_found')}</p><Link to="/teams"><Button variant="outline">{t('back')}</Button></Link></div>;

  const roleBadge = (role) => {
    const styles = {
      owner: 'bg-amber-500/20 text-amber-400',
      admin: 'bg-violet-500/20 text-violet-400',
      member: 'bg-zinc-700 text-zinc-400',
    };
    const labels = { owner: t('team_role_owner'), admin: t('team_role_admin'), member: t('team_role_member') };
    return <span className={`px-2 py-0.5 rounded text-xs ${styles[role]}`}>{labels[role]}</span>;
  };

  const tabs = [
    { id: 'members', label: t('team_members'), icon: Users },
    { id: 'plugins', label: t('team_only_plugins'), icon: Puzzle },
    { id: 'assets', label: t('team_only_assets'), icon: ImageIcon },
    { id: 'messages', label: t('team_chat'), icon: MessageSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/teams" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-4">
        <ArrowLeft size={16} /> {t('team_title')}
      </Link>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-zinc-100">{team.name}</h1>
          {roleBadge(myRole)}
        </div>
        {team.description && <p className="text-sm text-zinc-400 mt-1">{team.description}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Users size={12} /> {(team.members || []).length}{t('team_members')}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(tb => {
          const Icon = tb.icon;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                tab === tb.id ? 'bg-violet-600 text-white' : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}>
              <Icon size={14} /> {tb.label}
            </button>
          );
        })}
      </div>

      {/* Members */}
      {tab === 'members' && (
        <div className="space-y-3">
          {isAdmin && (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
              <label className="text-xs text-zinc-500 flex items-center gap-1 mb-2"><Search size={12} /> {t('team_search_user')}</label>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('team_search_placeholder')} className="bg-zinc-800 border-zinc-700 text-sm" />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map(p => (
                    <button key={p.user_id} onClick={() => addMember(p.user_id)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-violet-600/10 transition text-left">
                      {p.avatar ? <img src={p.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        : <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">{(p.display_name || '?').charAt(0)}</div>}
                      <span className="text-sm text-zinc-200">{p.display_name || t('detail_unknown')}</span>
                      <UserPlus size={14} className="ml-auto text-violet-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {members.map(m => {
            const role = getRole(m.id);
            return (
              <div key={m.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 flex items-center gap-3">
                {m.profile?.avatar ? <img src={m.profile.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-zinc-300">{(m.profile?.display_name || '?').charAt(0)}</div>}
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${m.id}`} className="text-sm font-medium text-zinc-200 hover:text-violet-400">{m.profile?.display_name || t('detail_unknown_user')}</Link>
                  <div className="mt-0.5">{roleBadge(role)}</div>
                </div>
                {isOwner && role === 'member' && (
                  <button onClick={() => setRole(m.id, 'admin')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 px-2 py-1 rounded bg-violet-600/10">
                    <ChevronUp size={12} /> {t('team_promote')}
                  </button>
                )}
                {isOwner && role === 'admin' && (
                  <button onClick={() => setRole(m.id, 'member')} className="text-xs text-zinc-400 hover:text-zinc-300 flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <ChevronDown size={12} /> {t('team_demote')}
                  </button>
                )}
                {canKick(m.id) && (
                  <button onClick={() => kickMember(m.id)} className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plugins */}
      {tab === 'plugins' && (
        <div>
          {isAdmin && (
            <div className="mb-4">
              <Button onClick={() => setShowPluginUpload(!showPluginUpload)} className="bg-violet-600 hover:bg-violet-500 mb-3">
                <Upload size={16} className="mr-1" /> {t('team_upload_plugin')}
              </Button>
              {showPluginUpload && (
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center">
                    <input ref={pluginFileRef} type="file" accept=".js,.mjs" onChange={handlePluginUpload} className="hidden" />
                    <Button size="sm" variant="outline" onClick={() => pluginFileRef.current?.click()} disabled={uploadingPlugin} className="border-zinc-700">
                      {uploadingPlugin ? t('loading') : t('plugin_select_file')}
                    </Button>
                    {newPlugin.code && <p className="text-xs text-emerald-400 mt-2">✓ {t('plugin_file_loaded')} ({newPlugin.code.length})</p>}
                  </div>
                  {newPlugin.code && (
                    <>
                      <div><Label className="text-xs text-zinc-400">{t('team_plugin_name')}</Label>
                        <Input value={newPlugin.name} onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                      <div><Label className="text-xs text-zinc-400">{t('plugin_description')}</Label>
                        <Input value={newPlugin.description} onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                      <Button onClick={createTeamPlugin} className="bg-violet-600 hover:bg-violet-500">{t('publish')}</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {teamPlugins.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-12">{t('team_no_plugins')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamPlugins.map(p => (
                <Link key={p.id} to={`/plugin/${p.id}`} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 hover:border-violet-500/30 transition">
                  <div className="flex items-center gap-2 mb-1"><Puzzle size={16} className="text-violet-400" /><h3 className="text-sm font-medium text-zinc-200 truncate">{p.name}</h3></div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{p.description || ''}</p>
                  <p className="text-xs text-zinc-600 mt-2">by {profileMap[p.created_by_id]?.display_name || t('detail_unknown')}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assets */}
      {tab === 'assets' && (
        <div>
          {isAdmin && (
            <div className="mb-4">
              <Button onClick={() => setShowAssetUpload(!showAssetUpload)} className="bg-violet-600 hover:bg-violet-500 mb-3">
                <Upload size={16} className="mr-1" /> {t('team_upload_asset')}
              </Button>
              {showAssetUpload && (
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-zinc-400">{t('team_asset_name')}</Label>
                      <Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm" /></div>
                    <div><Label className="text-xs text-zinc-400">{t('asset_type')}</Label>
                      <Select value={newAsset.type} onValueChange={(v) => setNewAsset({ ...newAsset, type: v })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">{ASSET_TYPES.map(at => <SelectItem key={at.value} value={at.value}>{t(at.key)}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>
                  <div><Label className="text-xs text-zinc-400">{t('asset_file')}</Label>
                    <div className="flex items-center gap-2">
                      <input ref={assetFileRef} type="file" onChange={handleAssetUpload} className="hidden" />
                      <Button size="sm" variant="outline" onClick={() => assetFileRef.current?.click()} disabled={uploadingAsset} className="border-zinc-700">{uploadingAsset ? t('loading') : t('team_select_file')}</Button>
                      {newAsset.file_url && <span className="text-xs text-emerald-400">✓ {t('asset_uploaded')}</span>}
                    </div></div>
                  <div><Label className="text-xs text-zinc-400">{t('asset_description')}</Label>
                    <Textarea value={newAsset.description} onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-sm min-h-[60px]" /></div>
                  <Button onClick={createTeamAsset} className="bg-violet-600 hover:bg-violet-500">{t('publish')}</Button>
                </div>
              )}
            </div>
          )}
          {teamAssets.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-12">{t('team_no_assets')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {teamAssets.map(a => (
                <Link key={a.id} to={`/asset/${a.id}`} className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-violet-500/30 transition">
                  <div className="aspect-square bg-zinc-950 flex items-center justify-center">
                    {['audio', 'bgm', 'se'].includes(a.type) ? <Volume2 size={32} className="text-zinc-600" />
                      : (a.thumbnail || a.file_url) ? <ImgComponent src={a.thumbnail || a.file_url} fittingType="fit" className="w-full h-full" />
                      : <ImageIcon size={32} className="text-zinc-600" />}
                  </div>
                  <div className="p-2"><p className="text-xs text-zinc-200 truncate">{a.name}</p>
                    <p className="text-xs text-zinc-600">by {profileMap[a.created_by_id]?.display_name || t('detail_unknown')}</p></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {tab === 'messages' && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? <p className="text-xs text-zinc-600 text-center mt-8">{t('team_msg_empty')}</p>
              : messages.map(msg => {
                const isMe = msg.created_by_id === user?.id;
                const senderName = profileMap[msg.created_by_id]?.display_name || t('detail_unknown');
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-xs text-zinc-500 mb-0.5 ml-1">{senderName}</span>}
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>{msg.content}</div>
                    <span className="text-xs text-zinc-600 mt-0.5 mx-1">{formatTime(msg.created_date)}</span>
                  </div>
                );
              })}
            <div ref={msgEndRef} />
          </div>
          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={t('msg_placeholder')} className="bg-zinc-800 border-zinc-700 text-sm" />
            <Button size="sm" onClick={sendMessage} className="bg-violet-600 hover:bg-violet-500"><Send size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
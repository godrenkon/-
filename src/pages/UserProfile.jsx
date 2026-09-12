import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Gamepad2, Puzzle, Image as ImgIcon, UserPlus, UserCheck, Heart, Eye } from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [assets, setAssets] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('games');

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      const [profiles, allGames, allPlugins, allAssets] = await Promise.all([
        base44.entities.Profile.filter({ user_id: userId }),
        base44.entities.Game.filter({ status: 'published' }, '-created_date', 50),
        base44.entities.Plugin.filter({ is_public: true }, '-created_date', 50),
        base44.entities.Asset.filter({ is_public: true }, '-created_date', 50),
      ]);
      setProfile(profiles?.[0] || null);
      setGames((allGames || []).filter(g => g.created_by_id === userId && !g.team_id));
      setPlugins((allPlugins || []).filter(p => p.created_by_id === userId && !p.team_id));
      setAssets((allAssets || []).filter(a => a.created_by_id === userId && !a.team_id));
      if (isAuthenticated && user.id !== userId) {
        const follows = await base44.entities.Follow.filter({ following_id: userId });
        setFollowing((follows || []).some(f => f.created_by_id === user.id));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) { toast({ title: t('profile_login_required'), variant: 'destructive' }); return; }
    try {
      if (following) {
        const follows = await base44.entities.Follow.filter({ following_id: userId });
        const myFollow = follows.find(f => f.created_by_id === user.id);
        if (myFollow) await base44.entities.Follow.delete(myFollow.id);
        setFollowing(false);
      } else {
        await base44.entities.Follow.create({ following_id: userId });
        setFollowing(true);
      }
    } catch (e) { toast({ title: t('error'), variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>;

  const displayName = profile?.display_name || t('profile_user');
  const isSelf = user?.id === userId;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
            {profile?.avatar ? <ImageIcon src={profile.avatar} fittingType="fill" className="w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl font-bold">{displayName[0]?.toUpperCase()}</div>}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">{displayName}</h1>
            {profile?.bio && <p className="text-sm text-zinc-400 mb-3">{profile.bio}</p>}
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Gamepad2 size={14} /> {games.length} {t('profile_tab_games')}</span>
              <span className="flex items-center gap-1"><Puzzle size={14} /> {plugins.length} {t('profile_tab_plugins')}</span>
              <span className="flex items-center gap-1"><ImgIcon size={14} /> {assets.length} {t('profile_tab_assets')}</span>
            </div>
          </div>
          {!isSelf && isAuthenticated && (
            <Button variant="outline" onClick={toggleFollow} className={`border-zinc-700 ${following ? 'text-violet-400' : 'text-zinc-300'}`}>
              {following ? <UserCheck size={16} className="mr-1" /> : <UserPlus size={16} className="mr-1" />}
              {following ? t('profile_following') : t('profile_follow')}
            </Button>
          )}
          {isSelf && <Link to="/account"><Button variant="outline" className="border-zinc-700">{t('profile_edit')}</Button></Link>}
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-zinc-800">
        {[
          { id: 'games', label: t('profile_tab_games'), count: games.length },
          { id: 'plugins', label: t('profile_tab_plugins'), count: plugins.length },
          { id: 'assets', label: t('profile_tab_assets'), count: assets.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === tab.id ? 'text-violet-300 border-violet-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'games' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {games.length === 0 ? <p className="text-sm text-zinc-500 col-span-full text-center py-8">{t('profile_no_games')}</p>
            : games.map(g => (
              <Link key={g.id} to={`/game/${g.id}`} className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-violet-500/30 transition group">
                <div className="aspect-video bg-zinc-800 overflow-hidden">
                  {g.cover_image ? <ImageIcon src={g.cover_image} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={32} className="text-zinc-600" /></div>}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-zinc-200 truncate">{g.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Heart size={11} /> {g.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><Eye size={11} /> {g.views || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}

      {activeTab === 'plugins' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins.length === 0 ? <p className="text-sm text-zinc-500 col-span-full text-center py-8">{t('profile_no_plugins')}</p>
            : plugins.map(p => (
              <Link key={p.id} to={`/plugin/${p.id}`} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 hover:border-violet-500/30 transition">
                <div className="flex items-start gap-3">
                  <Puzzle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">{p.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                      <span>v{p.version}</span><span>·</span><span>{p.install_count || 0} {t('detail_installs')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {assets.length === 0 ? <p className="text-sm text-zinc-500 col-span-full text-center py-8">{t('profile_no_assets')}</p>
            : assets.map(a => (
              <Link key={a.id} to={`/asset/${a.id}`} className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden hover:border-violet-500/30 transition">
                <div className="aspect-square bg-zinc-800 overflow-hidden">
                  {a.thumbnail || a.file_url ? <ImageIcon src={a.thumbnail || a.file_url} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><ImgIcon size={24} className="text-zinc-600" /></div>}
                </div>
                <div className="p-2"><h3 className="text-xs text-zinc-300 truncate">{a.name}</h3><span className="text-xs text-zinc-600">{t(`asset_type_${a.type}`) || a.type}</span></div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
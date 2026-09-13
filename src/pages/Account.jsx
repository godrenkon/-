import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { rpgStore } from '@/lib/rpgStore';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, Save, Gamepad2, Image as ImgIcon, Puzzle, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Account() {
  const { t, lang, setLanguage } = useI18n();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [myGames, setMyGames] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [myPlugins, setMyPlugins] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.full_name || '');
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const me = await rpgStore.auth.me();
      if (me) {
        setBio(me.bio || '');
        setAvatar(me.avatar || '');
        setDisplayName(me.full_name || '');
      }
      const [games, assets, plugins, follows, followersData] = await Promise.all([
        rpgStore.entities.Game.filter({}, '-created_date', 20),
        rpgStore.entities.Asset.filter({}, '-created_date', 20),
        rpgStore.entities.Plugin.filter({}, '-created_date', 20),
        rpgStore.entities.Follow.filter({}),
        rpgStore.entities.Follow.filter({ following_id: user.id }),
      ]);
      setMyGames((games || []).filter(g => g.created_by_id === user.id));
      setMyAssets((assets || []).filter(a => a.created_by_id === user.id));
      setMyPlugins((plugins || []).filter(p => p.created_by_id === user.id));
      setFollowing((follows || []).length);
      setFollowers((followersData || []).length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await rpgStore.integrations.Core.UploadFile({ file });
      setAvatar(file_url);
    } catch (err) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await rpgStore.auth.updateMe({ full_name: displayName, bio, avatar });
      try {
        const existing = await rpgStore.entities.Profile.filter({ user_id: user.id });
        if (existing.length > 0) {
          await rpgStore.entities.Profile.update(existing[0].id, { display_name: displayName, bio, avatar });
        } else {
          await rpgStore.entities.Profile.create({ user_id: user.id, display_name: displayName, bio, avatar });
        }
      } catch (pe) { console.warn('Profile save error:', pe); }
      toast({ title: t('saved') });
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('account_title')}</h1>

      {/* Profile */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">{t('account_profile')}</h2>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
            {avatar ? (
              <ImageIcon src={avatar} fittingType="fill" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl font-bold">
                {(user.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('account_avatar')}</Label>
            <label>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
                <Upload size={14} /> {uploading ? t('loading') : 'アップロード'}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs text-zinc-400">{t('account_display_name')}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t('account_email')}</Label>
            <Input value={user.email || ''} readOnly className="bg-zinc-800/50 border-zinc-700 text-sm text-zinc-500" />
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs text-zinc-400">{t('account_bio')}</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm min-h-[60px]" />
        </div>

        <div className="mb-4">
          <Label className="text-xs text-zinc-400">{t('account_language')}</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={lang === 'ja' ? 'default' : 'outline'} onClick={() => setLanguage('ja')} className={lang === 'ja' ? 'bg-violet-600' : 'border-zinc-700'}>
              日本語
            </Button>
            <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} className={lang === 'en' ? 'bg-violet-600' : 'border-zinc-700'}>
              English
            </Button>
          </div>
        </div>

        <Button onClick={saveProfile} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
          <Save size={14} className="mr-1" /> {t('account_save')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
          <Gamepad2 size={20} className="mx-auto text-violet-400 mb-1" />
          <div className="text-xl font-bold">{myGames.length}</div>
          <div className="text-xs text-zinc-500">{t('account_my_games')}</div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
          <ImgIcon size={20} className="mx-auto text-pink-400 mb-1" />
          <div className="text-xl font-bold">{myAssets.length}</div>
          <div className="text-xs text-zinc-500">{t('account_my_assets')}</div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
          <Puzzle size={20} className="mx-auto text-amber-400 mb-1" />
          <div className="text-xl font-bold">{myPlugins.length}</div>
          <div className="text-xs text-zinc-500">{t('account_my_plugins')}</div>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
          <Users size={20} className="mx-auto text-emerald-400 mb-1" />
          <div className="text-xl font-bold">{followers}</div>
          <div className="text-xs text-zinc-500">{t('account_followers')}</div>
        </div>
      </div>

      {/* My games */}
      {myGames.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">{t('account_my_games')}</h2>
            <Link to="/dashboard" className="text-xs text-violet-400 hover:text-violet-300">一覧を見る →</Link>
          </div>
          <div className="space-y-2">
            {myGames.slice(0, 3).map(g => (
              <Link key={g.id} to={`/editor/${g.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition">
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                  {g.cover_image ? <ImageIcon src={g.cover_image} fittingType="fill" className="w-full h-full" /> : <Gamepad2 size={16} className="m-3 text-zinc-600" />}
                </div>
                <span className="text-sm text-zinc-300 flex-1 truncate">{g.title}</span>
                <span className="text-xs text-zinc-500 flex items-center gap-1"><Heart size={11} /> {g.likes_count || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My plugins */}
      {myPlugins.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">{t('account_my_plugins')}</h2>
            <Link to="/plugins" className="text-xs text-violet-400 hover:text-violet-300">一覧を見る →</Link>
          </div>
          <div className="space-y-2">
            {myPlugins.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition">
                <Puzzle size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-zinc-500">{p.install_count || 0} インストール</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My assets */}
      {myAssets.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">{t('account_my_assets')}</h2>
            <Link to="/assets" className="text-xs text-violet-400 hover:text-violet-300">一覧を見る →</Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {myAssets.slice(0, 3).map(a => (
              <div key={a.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                {a.thumbnail || a.file_url ? (
                  <ImageIcon src={a.thumbnail || a.file_url} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImgIcon size={16} className="text-zinc-600" /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public profile link */}
      <Link to={`/user/${user.id}`} className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
        公開プロフィールを見る →
      </Link>
    </div>
  );
}
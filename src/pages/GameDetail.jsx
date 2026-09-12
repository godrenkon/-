import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Heart, Eye, MessageSquare, Play, Download, UserPlus, UserCheck,
  Gamepad2, ArrowLeft, Bookmark, Users, X, Settings as SettingsIcon
} from 'lucide-react';

export default function GameDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [showCoCreators, setShowCoCreators] = useState(false);
  const [newCoCreator, setNewCoCreator] = useState('');

  useEffect(() => {
    loadGame();
  }, [id]);

  const loadGame = async () => {
    try {
      const data = await base44.entities.Game.get(id);
      setGame(data);
      setLikeCount(data.likes_count || 0);

      // Increment view
      base44.entities.Game.update(id, { views: (data.views || 0) + 1 });

      // Load comments
      const cm = await base44.entities.GameComment.filter({ game_id: id }, '-created_date', 50);
      setComments(cm || []);

      if (isAuthenticated) {
        const [likes, follows, favs] = await Promise.all([
          base44.entities.GameLike.filter({ game_id: id }),
          base44.entities.Follow.filter({ following_id: data.created_by_id }),
          base44.entities.GameFavorite.filter({ game_id: id }),
        ]);
        setLiked((likes || []).some(l => l.created_by_id === user.id));
        setFollowing((follows || []).some(f => f.created_by_id === user.id));
        setFavorited((favs || []).some(f => f.created_by_id === user.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated) {
      toast({ title: t('export_login_required'), variant: 'destructive' });
      return;
    }
    try {
      if (liked) {
        const likes = await base44.entities.GameLike.filter({ game_id: id });
        const myLike = likes.find(l => l.created_by_id === user.id);
        if (myLike) await base44.entities.GameLike.delete(myLike.id);
        setLiked(false);
        setLikeCount(likeCount - 1);
        base44.entities.Game.update(id, { likes_count: likeCount - 1 });
      } else {
        await base44.entities.GameLike.create({ game_id: id });
        setLiked(true);
        setLikeCount(likeCount + 1);
        base44.entities.Game.update(id, { likes_count: likeCount + 1 });
      }
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({ title: t('export_login_required'), variant: 'destructive' });
      return;
    }
    try {
      if (favorited) {
        const favs = await base44.entities.GameFavorite.filter({ game_id: id });
        const myFav = favs.find(f => f.created_by_id === user.id);
        if (myFav) await base44.entities.GameFavorite.delete(myFav.id);
        setFavorited(false);
        toast({ title: 'お気に入りから削除しました' });
      } else {
        await base44.entities.GameFavorite.create({ game_id: id });
        setFavorited(true);
        toast({ title: 'お気に入りに追加しました' });
      }
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      toast({ title: t('export_login_required'), variant: 'destructive' });
      return;
    }
    try {
      if (following) {
        const follows = await base44.entities.Follow.filter({ following_id: game.created_by_id });
        const myFollow = follows.find(f => f.created_by_id === user.id);
        if (myFollow) await base44.entities.Follow.delete(myFollow.id);
        setFollowing(false);
      } else {
        await base44.entities.Follow.create({ following_id: game.created_by_id });
        setFollowing(true);
      }
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const sendComment = async () => {
    if (!isAuthenticated) {
      toast({ title: t('export_login_required'), variant: 'destructive' });
      return;
    }
    if (!newComment.trim()) return;
    try {
      const cm = await base44.entities.GameComment.create({ game_id: id, content: newComment });
      setComments([cm, ...comments]);
      setNewComment('');
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const addCoCreator = async () => {
    if (!newCoCreator.trim()) return;
    try {
      const members = [...(game.members || []), newCoCreator.trim()];
      await base44.entities.Game.update(id, { members });
      setGame({ ...game, members });
      setNewCoCreator('');
      toast({ title: '共同制作者を追加しました' });
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const removeCoCreator = async (memberId) => {
    try {
      const members = (game.members || []).filter(m => m !== memberId);
      await base44.entities.Game.update(id, { members });
      setGame({ ...game, members });
      toast({ title: '共同制作者を削除しました' });
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const downloadGameData = () => {
    if (!game || !user) return;
    if (game.created_by_id !== user.id) {
      toast({ title: t('export_note'), variant: 'destructive' });
      return;
    }
    const exportData = {
      format: 'rpgedit_game',
      version: '1.0',
      title: game.title,
      description: game.description,
      tags: game.tags,
      platform_tags: game.platform_tags,
      cover_image: game.cover_image,
      game_data: game.game_data,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.title}.rpgedit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" /></div>;
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-400">{t('noData')}</p>
        <Link to="/browse"><Button variant="outline">{t('nav_browse')}</Button></Link>
      </div>
    );
  }

  const isOwner = game.created_by_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-4">
        <ArrowLeft size={16} /> {t('nav_browse')}
      </Link>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-64 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
          {game.cover_image ? (
            <ImageIcon src={game.cover_image} fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Gamepad2 size={48} className="text-zinc-600" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{game.title}</h1>
          <Link to={`/user/${game.created_by_id}`} className="text-sm text-violet-400 hover:text-violet-300 mb-4 inline-block">
            {t('detail_by')} {game.created_by}
          </Link>

          {game.description && (
            <p className="text-sm text-zinc-300 mb-4 leading-relaxed">{game.description}</p>
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Link to={`/play/${game.id}`}>
              <Button className="bg-violet-600 hover:bg-violet-500">
                <Play size={16} className="mr-1" /> {t('detail_play')}
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={toggleLike}
              className={`border-zinc-700 ${liked ? 'text-red-400 border-red-500/30' : 'text-zinc-300'}`}
            >
              <Heart size={16} className={`mr-1 ${liked ? 'fill-red-400' : ''}`} /> {likeCount}
            </Button>
            <Button
              variant="outline"
              onClick={toggleFavorite}
              className={`border-zinc-700 ${favorited ? 'text-amber-400 border-amber-500/30' : 'text-zinc-300'}`}
            >
              <Bookmark size={16} className={`mr-1 ${favorited ? 'fill-amber-400' : ''}`} /> お気に入り
            </Button>
            {game.created_by_id !== user?.id && (
              <Button
                variant="outline"
                onClick={toggleFollow}
                className={`border-zinc-700 ${following ? 'text-violet-400' : 'text-zinc-300'}`}
              >
                {following ? <UserCheck size={16} className="mr-1" /> : <UserPlus size={16} className="mr-1" />}
                {following ? t('detail_following') : t('detail_follow')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
            <span className="flex items-center gap-1"><Eye size={14} /> {t('detail_views')}: {game.views || 0}</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {t('detail_likes')}: {likeCount}</span>
          </div>

          {game.allow_streaming !== undefined && (
            <div className="text-sm">
              <span className="text-zinc-500">{t('detail_streaming')}: </span>
              <span className={game.allow_streaming ? 'text-emerald-400' : 'text-amber-400'}>
                {game.allow_streaming ? t('detail_streaming_allowed') : t('detail_streaming_ask')}
              </span>
            </div>
          )}

          {(game.tags || []).length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-zinc-500">{t('detail_tags')}: </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {game.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {(game.platform_tags || []).length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-zinc-500">{t('detail_platforms')}: </span>
              <span className="text-xs text-zinc-400">{game.platform_tags.join(', ')}</span>
            </div>
          )}

          {/* Co-creators */}
          {(game.members || []).length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500 flex items-center gap-1"><Users size={12} /> 共同制作者:</span>
              {game.members.map(m => (
                <Link key={m} to={`/user/${m}`} className="px-2 py-0.5 rounded-full text-xs bg-violet-900/30 text-violet-300 hover:bg-violet-800/40">
                  {m.slice(0, 8)}...
                </Link>
              ))}
            </div>
          )}

          {isOwner && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={downloadGameData} className="border-zinc-700">
                <Download size={14} className="mr-1" /> {t('detail_download_game')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCoCreators(!showCoCreators)} className="border-zinc-700">
                <Users size={14} className="mr-1" /> 共同制作者
              </Button>
            </div>
          )}

          {isOwner && showCoCreators && (
            <div className="mt-3 bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">共同制作者管理</h3>
              <div className="flex gap-2">
                <Input
                  value={newCoCreator}
                  onChange={(e) => setNewCoCreator(e.target.value)}
                  placeholder="ユーザーID"
                  className="bg-zinc-800 border-zinc-700 text-sm flex-1"
                />
                <Button size="sm" onClick={addCoCreator} className="bg-violet-600 hover:bg-violet-500">追加</Button>
              </div>
              <div className="space-y-1">
                {(game.members || []).map(m => (
                  <div key={m} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-1.5">
                    <Link to={`/user/${m}`} className="text-xs text-violet-300 hover:text-violet-200">{m}</Link>
                    <button onClick={() => removeCoCreator(m)} className="text-zinc-500 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">共同制作者はゲームの編集ができます。ユーザーIDはプロフィール画面のURLから確認できます。</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> {t('detail_comments')} ({comments.length})
        </h2>

        {isAuthenticated && (
          <div className="flex gap-2 mb-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('detail_write_comment')}
              className="bg-zinc-900 border-zinc-800 text-sm min-h-[60px] flex-1"
            />
            <Button onClick={sendComment} className="bg-violet-600 hover:bg-violet-500 self-end">
              {t('detail_send')}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">{t('noData')}</p>
          ) : comments.map(cm => (
            <div key={cm.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Link to={`/user/${cm.created_by_id}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white">
                    {(cm.created_by || '?')[0].toUpperCase()}
                  </div>
                </Link>
                <Link to={`/user/${cm.created_by_id}`} className="text-xs text-zinc-400 hover:text-violet-300">{cm.created_by}</Link>
              </div>
              <p className="text-sm text-zinc-300">{cm.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
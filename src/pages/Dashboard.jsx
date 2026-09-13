import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Plus, Gamepad2, Heart, Eye, MoreVertical, Trash2, Edit, Upload } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { createDefaultGameData, normalizeGameData, validateGameData } from '@/lib/gameData';
import { toast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const data = await base44.entities.Game.filter({}, '-updated_date', 50);
      setGames(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    setCreating(true);
    try {
      const newGame = await base44.entities.Game.create({
        title: t('dash_new_game'),
        description: '',
        status: 'draft',
        game_data: createDefaultGameData({ starter: true }),
        tags: [],
        platform_tags: [],
        views: 0,
        likes_count: 0,
        members: [],
      });
      navigate(`/editor/${newGame.id}`);
    } catch (e) {
      console.error(e);
      toast({ title: 'ゲームを作成できませんでした', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const importGame = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.format !== 'rpgedit_game') {
        toast({ title: 'RPG edit形式のファイルではありません', variant: 'destructive' });
        return;
      }
      const errors = validateGameData(data.game_data);
      if (errors.length) {
        toast({ title: 'インポートできません', description: errors[0], variant: 'destructive' });
        return;
      }
      const newGame = await base44.entities.Game.create({
        title: `${data.title || t('dash_new_game')} (Imported)`,
        description: data.description || '',
        status: 'draft',
        cover_image: data.cover_image || '',
        tags: data.tags || [],
        platform_tags: data.platform_tags || [],
        game_data: normalizeGameData(data.game_data),
        views: 0,
        likes_count: 0,
        members: [],
      });
      navigate(`/editor/${newGame.id}`);
    } catch (err) {
      toast({ title: 'インポートに失敗しました', description: err.message, variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  };

  const deleteGame = async (id) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await base44.entities.Game.delete(id);
      setGames(games.filter(g => g.id !== id));
    } catch (e) {
      console.error(e);
      toast({ title: 'ゲームを削除できませんでした', variant: 'destructive' });
    }
  };

  const statusBadge = (status) => {
    const styles = {
      draft: 'bg-zinc-700/50 text-zinc-300',
      published: 'bg-emerald-500/15 text-emerald-400',
      unlisted: 'bg-amber-500/15 text-amber-400',
    };
    const labels = {
      draft: t('dash_status_draft'),
      published: t('dash_status_published'),
      unlisted: t('dash_status_unlisted'),
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || labels.draft}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('dash_title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createGame} disabled={creating} className="bg-violet-600 hover:bg-violet-500">
            <Plus size={18} className="mr-1" /> {t('dash_new_game')}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-zinc-700">
            <Upload size={16} className="mr-1" /> {t('import')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importGame} className="hidden" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-zinc-900/50 animate-pulse" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 size={48} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">{t('dash_no_games')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div key={game.id} className="group rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition">
              <Link to={`/editor/${game.id}`}>
                <div className="aspect-video bg-zinc-800 overflow-hidden">
                  {game.cover_image ? (
                    <ImageIcon src={game.cover_image} fittingType="fill" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Gamepad2 size={32} className="text-zinc-600" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/editor/${game.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-violet-300 transition">{game.title}</h3>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-zinc-500 hover:text-zinc-200 p-1">
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                      <DropdownMenuItem onClick={() => navigate(`/editor/${game.id}`)} className="text-zinc-200 cursor-pointer">
                        <Edit size={14} className="mr-2" /> {t('edit')}
                      </DropdownMenuItem>
                      {game.status === 'published' && (
                        <DropdownMenuItem onClick={() => navigate(`/game/${game.id}`)} className="text-zinc-200 cursor-pointer">
                          <Gamepad2 size={14} className="mr-2" /> {t('play')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => deleteGame(game.id)} className="text-red-400 cursor-pointer">
                        <Trash2 size={14} className="mr-2" /> {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  {statusBadge(game.status)}
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Eye size={12} /> {game.views || 0}</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> {game.likes_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

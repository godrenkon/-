import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { rpgStore } from '@/lib/rpgStore';
import { Image as ImageIcon } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gamepad2, Heart, Eye, Search } from 'lucide-react';

export default function GameBrowse() {
  const { t } = useI18n();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    loadGames();
  }, [sort, tagFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const sortField = sort === 'new' ? '-created_date' : sort === 'views' ? '-views' : '-likes_count';
      const filter = { status: 'published' };
      if (tagFilter) filter.tags = tagFilter;
      const data = await rpgStore.entities.Game.filter(filter, sortField, 60);
      setGames(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const allTags = ['RPG', 'アクション', 'アドベンチャー', 'パズル', 'シミュレーション', 'ノベル', 'ファンタジー', 'SF', 'ホラー'];

  const filtered = games.filter(g =>
    !search || g.title.toLowerCase().includes(search.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('browse_title')}</h1>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('browse_search')}
            className="pl-9 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sort === 'popular' ? 'default' : 'outline'}
            onClick={() => setSort('popular')}
            className={sort === 'popular' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            {t('browse_sort_popular')}
          </Button>
          <Button
            size="sm"
            variant={sort === 'new' ? 'default' : 'outline'}
            onClick={() => setSort('new')}
            className={sort === 'new' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            {t('browse_sort_new')}
          </Button>
          <Button
            size="sm"
            variant={sort === 'views' ? 'default' : 'outline'}
            onClick={() => setSort('views')}
            className={sort === 'views' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            {t('browse_sort_views')}
          </Button>
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTagFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${!tagFilter ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          {t('browse_all_tags')}
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${tagFilter === tag ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-zinc-900/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-zinc-500 py-20">{t('browse_no_results')}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(game => (
            <Link key={game.id} to={`/game/${game.id}`} className="group">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/40 transition">
                {game.cover_image ? (
                  <ImageIcon src={game.cover_image} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <Gamepad2 size={32} className="text-zinc-600" />
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-sm font-medium truncate group-hover:text-violet-300 transition">{game.title}</h3>
              <p className="text-xs text-zinc-500 truncate">{game.description || t('detail_by')} {game.created_by}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                <span className="flex items-center gap-1"><Heart size={11} /> {game.likes_count || 0}</span>
                <span className="flex items-center gap-1"><Eye size={11} /> {game.views || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
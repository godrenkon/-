import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { rpgStore } from '@/lib/rpgStore';
import { Image as ImageIcon } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import {
  Gamepad2, Sparkles, Map, Brain, Download, Share2, Puzzle,
  ArrowRight, Heart, Eye, Play
} from 'lucide-react';

export default function Home() {
  const { t, lang } = useI18n();
  const { isAuthenticated } = useAuth();
  const [popularGames, setPopularGames] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [games, assets] = await Promise.all([
        rpgStore.entities.Game.filter({ status: 'published' }, '-likes_count', 6),
        rpgStore.entities.Asset.filter({ is_public: true }, '-created_date', 8),
      ]);
      setPopularGames(games || []);
      setRecentAssets(assets || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: t('home_feature_visual'), desc: t('home_feature_visual_desc'), color: 'from-violet-500 to-purple-600' },
    { icon: Map, title: t('home_feature_map'), desc: t('home_feature_map_desc'), color: 'from-blue-500 to-cyan-600' },
    { icon: Brain, title: t('home_feature_ai'), desc: t('home_feature_ai_desc'), color: 'from-emerald-500 to-teal-600' },
    { icon: Download, title: t('home_feature_export'), desc: t('home_feature_export_desc'), color: 'from-orange-500 to-red-600' },
    { icon: Share2, title: t('home_feature_assets'), desc: t('home_feature_assets_desc'), color: 'from-pink-500 to-rose-600' },
    { icon: Puzzle, title: t('home_feature_plugins'), desc: t('home_feature_plugins_desc'), color: 'from-amber-500 to-yellow-600' },
  ];

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-[#0a0a0f] to-fuchsia-950/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
            <Sparkles size={14} /> {t('tagline')}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {t('home_hero_title')}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('home_hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-12 text-base">
                <Gamepad2 size={20} className="mr-2" /> {t('home_cta_create')}
              </Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline" className="border-zinc-700 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800 px-8 h-12 text-base">
                <Play size={18} className="mr-2" /> {t('home_cta_browse')}
              </Button>
            </Link>
            <Link to="/downloads">
              <Button size="lg" variant="ghost" className="text-zinc-300 hover:bg-zinc-800 hover:text-white px-6 h-12 text-base">
                <Download size={18} className="mr-2" /> {lang === 'ja' ? 'アプリをダウンロード' : 'Download the app'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">{t('home_features_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:translate-y-[-2px]">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Games */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('home_popular')}</h2>
          <Link to="/browse" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
            {t('nav_browse')} <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : popularGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularGames.map((game) => (
              <Link key={game.id} to={`/game/${game.id}`} className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/40 transition-all">
                  {game.cover_image ? (
                    <ImageIcon src={game.cover_image} fittingType="fill" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Gamepad2 size={32} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-medium truncate group-hover:text-violet-300 transition">{game.title}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center gap-1"><Heart size={12} /> {game.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {game.views || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">{t('browse_no_results')}</p>
        )}
      </section>

      {/* Recent Assets */}
      <section className="max-w-6xl mx-auto px-6 py-12 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('home_recent_assets')}</h2>
          <Link to="/assets" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
            {t('nav_assets')} <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-lg bg-zinc-900/50 animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : recentAssets.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                {asset.thumbnail || asset.file_url ? (
                  <ImageIcon src={asset.thumbnail || asset.file_url} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                    {asset.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">{t('asset_no_results')}</p>
        )}
      </section>
    </div>
  );
}

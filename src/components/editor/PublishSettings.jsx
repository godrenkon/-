import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Image as ImageIcon } from '@/components/ui/image';
import { Upload, Globe, Link2, Copy, Eye, EyeOff } from 'lucide-react';

const PLATFORMS = ['Windows', 'Mac', 'Linux', 'iOS', 'Android', 'Web'];
const TAG_SUGGESTIONS = ['RPG', 'アクション', 'アドベンチャー', 'パズル', 'シミュレーション', 'ノベル', 'ファンタジー', 'SF', '現代', 'ホラー', 'コメディ', 'シリアス'];

export default function PublishSettings({ game, setGame }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const update = async (field, value) => {
    setGame({ ...game, [field]: value });
    try {
      await base44.entities.Game.update(game.id, { [field]: value });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await update('cover_image', file_url);
    } catch (e) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (tag) => {
    const tags = game.tags || [];
    const newTags = tags.includes(tag) ? tags.filter(tg => tg !== tag) : [...tags, tag];
    update('tags', newTags);
  };

  const togglePlatform = (platform) => {
    const platforms = game.platform_tags || [];
    const newPlatforms = platforms.includes(platform) ? platforms.filter(p => p !== platform) : [...platforms, platform];
    update('platform_tags', newPlatforms);
  };

  const publish = async (status) => {
    await update('status', status);
    toast({ title: status === 'published' ? t('publish') + ' ✓' : t('unpublish') + ' ✓' });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/game/${game.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('pub_share_link') + ' ✓' });
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl space-y-5">
        <h2 className="text-lg font-semibold">{t('pub_title')}</h2>

        {/* Visibility */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">{t('pub_visibility')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => publish('draft')}
              className={`p-3 rounded-lg border text-sm transition ${game.status === 'draft' ? 'border-violet-500 bg-violet-600/10 text-violet-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
            >
              <EyeOff size={18} className="mx-auto mb-1" />
              {t('pub_private')}
            </button>
            <button
              onClick={() => publish('unlisted')}
              className={`p-3 rounded-lg border text-sm transition ${game.status === 'unlisted' ? 'border-violet-500 bg-violet-600/10 text-violet-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
            >
              <Link2 size={18} className="mx-auto mb-1" />
              {t('pub_unlisted')}
            </button>
            <button
              onClick={() => publish('published')}
              className={`p-3 rounded-lg border text-sm transition ${game.status === 'published' ? 'border-emerald-500 bg-emerald-600/10 text-emerald-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
            >
              <Globe size={18} className="mx-auto mb-1" />
              {t('pub_public')}
            </button>
          </div>
          {game.status !== 'draft' && (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/game/${game.id}`}
                className="bg-zinc-800 border-zinc-700 text-sm flex-1"
              />
              <Button size="sm" variant="outline" onClick={copyLink} className="border-zinc-700">
                <Copy size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Cover image */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">{t('pub_cover')}</h3>
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
              {game.cover_image ? (
                <ImageIcon src={game.cover_image} fittingType="fill" className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-xs text-zinc-400 mb-1.5 block">{t('pub_cover')}</Label>
              <Input
                value={game.cover_image || ''}
                onChange={(e) => update('cover_image', e.target.value)}
                placeholder="画像URL"
                className="bg-zinc-800 border-zinc-700 text-sm mb-2"
              />
              <label>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
                  <Upload size={14} /> {uploading ? t('loading') : 'アップロード'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">{t('pub_description')}</h3>
          <Textarea
            value={game.description || ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="ゲームの説明を入力..."
            className="bg-zinc-800 border-zinc-700 text-sm min-h-[100px]"
          />
        </div>

        {/* Tags */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">{t('pub_tags')}</h3>
          <div className="flex flex-wrap gap-2">
            {TAG_SUGGESTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  (game.tags || []).includes(tag)
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">{t('pub_platforms')}</h3>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  (game.platform_tags || []).includes(p)
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Streaming permission */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={game.allow_streaming || false}
              onChange={(e) => update('allow_streaming', e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span className="text-sm text-zinc-300">{t('pub_allow_stream')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
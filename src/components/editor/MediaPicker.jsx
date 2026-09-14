import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Search, Trash2, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { rpgStore } from '@/lib/rpgStore';
import { createId } from '@/lib/gameData';
import { toast } from '@/components/ui/use-toast';

const acceptedTypes = asset => !asset.type || asset.type === 'image';

export default function MediaPicker({ label = '画像', value = '', onChange, gameData, updateGameData, compact = false }) {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const media = (gameData.media || []).filter(acceptedTypes);
  const selected = media.find(asset => asset.url === value);
  const shown = media.filter(asset => String(asset.name || '画像').toLowerCase().includes(query.toLowerCase()));

  const addMedia = asset => updateGameData(previous => ({
    ...previous,
    media: [...(previous.media || []), asset],
  }));

  const select = url => { onChange(url); setIsOpen(false); };
  const upload = async file => {
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url: url } = await rpgStore.integrations.Core.UploadFile({ file });
      const asset = { id: createId('media'), name: file.name.replace(/\.[^.]+$/, '') || '画像', type: 'image', url, createdAt: new Date().toISOString() };
      addMedia(asset);
      select(url);
    } catch (error) {
      console.error(error);
      toast({ title: '画像を追加できませんでした', description: error.message, variant: 'destructive' });
    } finally { setIsUploading(false); }
  };
  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (!media.some(asset => asset.url === url)) addMedia({ id: createId('media'), name: '外部画像', type: 'image', url, createdAt: new Date().toISOString() });
    select(url); setUrlDraft('');
  };
  const removeMedia = (event, asset) => {
    event.stopPropagation();
    updateGameData(previous => ({ ...previous, media: (previous.media || []).filter(item => item.id !== asset.id) }));
    if (asset.url === value) onChange('');
  };

  return <div className={compact ? '' : 'space-y-2'}>
    {!compact && <Label className="text-xs text-zinc-400">{label}</Label>}
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setIsOpen(true)} className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/70 p-1.5 text-left transition hover:border-violet-500/70">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-900 text-zinc-500">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={17} />}
        </span>
        <span className="min-w-0 flex-1"><span className="block truncate text-xs text-zinc-200">{selected?.name || (value ? '選択中の画像' : '画像を選択')}</span><span className="block text-[10px] text-zinc-500">ライブラリ・アップロード・URL</span></span>
      </button>
      {value && <button type="button" onClick={() => onChange('')} className="rounded p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400" aria-label="画像を外す"><X size={15} /></button>}
    </div>

    {isOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
      <section className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-[#111116] shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 p-4"><div><h3 className="font-semibold text-zinc-100">{label}を選択</h3><p className="text-xs text-zinc-500">一度追加した画像は、このゲーム内のどこでも再利用できます。</p></div><button onClick={() => setIsOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"><X size={18} /></button></header>
        <div className="grid gap-3 border-b border-zinc-800 p-3 sm:grid-cols-[1fr_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="素材を検索" className="border-zinc-700 bg-zinc-900 pl-9 text-sm" /></div>
          <div className="flex gap-2"><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={event => upload(event.target.files?.[0])} /><Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading} className="bg-violet-600 hover:bg-violet-500">{isUploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}追加</Button></div>
        </div>
        <div className="flex gap-2 border-b border-zinc-800 p-3"><Input value={urlDraft} onChange={event => setUrlDraft(event.target.value)} onKeyDown={event => event.key === 'Enter' && addUrl()} placeholder="画像URLを貼り付け" className="border-zinc-700 bg-zinc-900 text-sm" /><Button type="button" size="sm" variant="outline" onClick={addUrl} className="border-zinc-700"><Link2 className="mr-1 h-4 w-4" />使う</Button></div>
        <div className="min-h-48 flex-1 overflow-y-auto p-3"><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{shown.map(asset => <div key={asset.id} role="button" tabIndex={0} onClick={() => select(asset.url)} onKeyDown={event => event.key === 'Enter' && select(asset.url)} className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-zinc-900 text-left transition hover:border-violet-400 ${asset.url === value ? 'border-violet-400 ring-2 ring-violet-500/30' : 'border-zinc-800'}`}><img src={asset.url} alt="" className="aspect-square w-full object-cover" /><span className="block truncate px-2 py-1.5 text-xs text-zinc-300">{asset.name || '画像'}</span><button type="button" onClick={event => removeMedia(event, asset)} className="absolute right-1 top-1 rounded bg-black/70 p-1 text-zinc-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100" aria-label="素材を削除"><Trash2 size={13} /></button></div>)}</div>{!shown.length && <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-zinc-500"><ImagePlus size={28} /><p>画像を追加するとここから選べます。</p></div>}</div>
      </section>
    </div>}
  </div>;
}

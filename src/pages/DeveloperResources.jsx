import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Download, FileCode, FileText, Code, Puzzle, BookOpen,
  ChevronDown, ChevronUp, Package, Copy, Check, Terminal,
  Type, FileJson, Zap, Heart
} from 'lucide-react';
import {
  PLUGIN_API_TYPES, PLUGIN_TEMPLATE, EXAMPLE_DAMAGE_FLOOR,
  EXAMPLE_QUEST_SYSTEM, EXAMPLE_CUSTOM_UI, ENGINE_SOURCE_REFERENCE,
  EVENT_COMMANDS_REFERENCE, API_REFERENCE_MD
} from '@/lib/pluginResources';

const RESOURCES = [
  {
    id: 'api-types',
    name: 'plugin-api.d.ts',
    title: 'API型定義',
    desc: 'TypeScript型定義ファイル。エディタの補完用に使えます',
    icon: Type,
    category: 'definition',
    content: PLUGIN_API_TYPES,
    lang: 'typescript',
  },
  {
    id: 'engine-source',
    name: 'gameEngine-reference.js',
    title: 'エンジンソース参照',
    desc: 'ゲームエンジンの内部構造・API・コマンド処理の参照用ソース',
    icon: Code,
    category: 'source',
    content: ENGINE_SOURCE_REFERENCE,
    lang: 'javascript',
  },
  {
    id: 'api-ref',
    name: 'api-reference.md',
    title: 'APIリファレンス',
    desc: '全APIメソッド・フック・パラメータのMarkdownリファレンス',
    icon: BookOpen,
    category: 'docs',
    content: API_REFERENCE_MD,
    lang: 'markdown',
  },
  {
    id: 'commands-ref',
    name: 'event-commands.md',
    title: 'イベントコマンドリファレンス',
    desc: '全イベントコマンドのパラメータ一覧',
    icon: Zap,
    category: 'docs',
    content: EVENT_COMMANDS_REFERENCE,
    lang: 'markdown',
  },
  {
    id: 'template',
    name: 'plugin-template.js',
    title: 'プラグインテンプレート',
    desc: '開発を始めるための空のテンプレート。全フック・設定例付き',
    icon: FileCode,
    category: 'template',
    content: PLUGIN_TEMPLATE,
    lang: 'javascript',
  },
  {
    id: 'example-damage',
    name: 'example-damage-floor.js',
    title: 'サンプル: ダメージ床',
    desc: '特定タイルでHP減少＋HPバー描画の実例',
    icon: Heart,
    category: 'example',
    content: EXAMPLE_DAMAGE_FLOOR,
    lang: 'javascript',
  },
  {
    id: 'example-quest',
    name: 'example-quest-system.js',
    title: 'サンプル: クエストシステム',
    desc: 'クエスト受注・完了・報酬付与＋カスタムコマンドの実例',
    icon: FileText,
    category: 'example',
    content: EXAMPLE_QUEST_SYSTEM,
    lang: 'javascript',
  },
  {
    id: 'example-ui',
    name: 'example-custom-ui.js',
    title: 'サンプル: カスタムUI',
    desc: 'HP/MPバー＋ミニマップ描画の実例',
    icon: Package,
    category: 'example',
    content: EXAMPLE_CUSTOM_UI,
    lang: 'javascript',
  },
];

const CATEGORIES = [
  { id: 'source', label: 'ソースコード', icon: Code },
  { id: 'definition', label: '型定義', icon: Type },
  { id: 'docs', label: 'ドキュメント', icon: BookOpen },
  { id: 'template', label: 'テンプレート', icon: FileCode },
  { id: 'example', label: 'サンプルプラグイン', icon: Puzzle },
];

function downloadFile(name, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll() {
  for (const r of RESOURCES) {
    const mime = r.lang === 'typescript' ? 'text/typescript' : r.lang === 'markdown' ? 'text/markdown' : 'text/javascript';
    downloadFile(r.name, r.content, mime);
  }
}

export default function DeveloperResources() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);
  const [activeCat, setActiveCat] = useState('all');

  const filtered = activeCat === 'all' ? RESOURCES : RESOURCES.filter(r => r.category === activeCat);

  const copyToClipboard = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Terminal size={28} className="text-violet-400" />
        <h1 className="text-2xl font-bold">プラグイン開発者リソース</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        プラグイン開発に必要なソースコード・型定義・ドキュメント・サンプルをダウンロードできます。自由に開発に活用してください。
      </p>

      {/* Download All */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-violet-600/10 border border-violet-600/30 rounded-xl">
        <Package size={20} className="text-violet-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-violet-200">全ファイルを一括ダウンロード</p>
          <p className="text-xs text-zinc-400">{RESOURCES.length}個のファイル（型定義・ソース・ドキュメント・テンプレート・サンプル）</p>
        </div>
        <Button onClick={downloadAll} className="bg-violet-600 hover:bg-violet-500">
          <Download size={16} className="mr-1" /> 全てDL
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setActiveCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeCat === 'all' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          全て ({RESOURCES.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = RESOURCES.filter(r => r.category === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeCat === cat.id ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              <cat.icon size={13} /> {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Resource list */}
      <div className="space-y-2">
        {filtered.map(resource => {
          const isOpen = expanded === resource.id;
          const lineCount = resource.content.split('\n').length;
          return (
            <div key={resource.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  resource.category === 'source' ? 'bg-blue-500/15 text-blue-400' :
                  resource.category === 'definition' ? 'bg-cyan-500/15 text-cyan-400' :
                  resource.category === 'docs' ? 'bg-amber-500/15 text-amber-400' :
                  resource.category === 'template' ? 'bg-violet-500/15 text-violet-400' :
                  'bg-green-500/15 text-green-400'
                }`}>
                  <resource.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-200">{resource.title}</h3>
                    <code className="text-xs text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">{resource.name}</code>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{resource.desc}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(resource.id, resource.content)}
                    className="text-zinc-400 hover:text-zinc-200 h-8 px-2">
                    {copied === resource.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadFile(resource.name, resource.content,
                    resource.lang === 'typescript' ? 'text/typescript' : resource.lang === 'markdown' ? 'text/markdown' : 'text/javascript')}
                    className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 h-8">
                    <Download size={14} className="mr-1" /> DL
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : resource.id)}
                    className="text-zinc-400 hover:text-zinc-200 h-8 px-2">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {isOpen && (
                <div className="border-t border-zinc-800">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950/50 text-xs text-zinc-500">
                    <span>{lineCount} 行</span>
                    <span className="font-mono">{resource.lang}</span>
                  </div>
                  <pre className="bg-zinc-950 p-4 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed max-h-96 overflow-y-auto">
                    {resource.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick start guide */}
      <div className="mt-8 p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
          <Terminal size={16} className="text-violet-400" /> クイックスタート
        </h2>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2"><span className="text-violet-400 font-mono">1.</span> <span><code className="text-violet-300">plugin-template.js</code> をダウンロード</span></li>
          <li className="flex gap-2"><span className="text-violet-400 font-mono">2.</span> <span>VS Code等のエディタでプラグインコードを記述</span></li>
          <li className="flex gap-2"><span className="text-violet-400 font-mono">3.</span> <span><code className="text-violet-300">plugin-api.d.ts</code> を同じフォルダに置くと型補完が効きます</span></li>
          <li className="flex gap-2"><span className="text-violet-400 font-mono">4.</span> <span>サンプルプラグインを参考にカスタマイズ</span></li>
          <li className="flex gap-2"><span className="text-violet-400 font-mono">5.</span> <span>ゲームエディタの「プラグイン管理」から .js ファイルをアップロード</span></li>
          <li className="flex gap-2"><span className="text-violet-400 font-mono">6.</span> <span>プラグイン一覧から公開して他の制作者と共有可能</span></li>
        </ol>
      </div>
    </div>
  );
}
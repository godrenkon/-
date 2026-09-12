import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Globe, Brain, Save, Palette } from 'lucide-react';
import { getTheme, setTheme as changeTheme } from '@/lib/theme';

export default function Settings() {
  const { t, lang, setLanguage } = useI18n();
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem('rpgedit_local_ai_url') || 'http://localhost:11434');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rpgedit_ai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('rpgedit_ai_model') || '');
  const [theme, setThemeState] = useState(() => getTheme());

  const switchTheme = (t) => { changeTheme(t); setThemeState(t); };

  const save = () => {
    localStorage.setItem('rpgedit_local_ai_url', localUrl);
    localStorage.setItem('rpgedit_ai_api_key', apiKey);
    localStorage.setItem('rpgedit_ai_model', model);
    toast({ title: t('saved') });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('settings_title')}</h1>

      {/* Language */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <Globe size={16} className="text-violet-400" /> {t('settings_language')}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={lang === 'ja' ? 'default' : 'outline'}
            onClick={() => setLanguage('ja')}
            className={lang === 'ja' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            日本語
          </Button>
          <Button
            size="sm"
            variant={lang === 'en' ? 'default' : 'outline'}
            onClick={() => setLanguage('en')}
            className={lang === 'en' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            English
          </Button>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 mb-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <Palette size={16} className="text-violet-400" /> {t('settings_theme')}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => switchTheme('dark')}
            className={theme === 'dark' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            {t('settings_theme_dark')}
          </Button>
          <Button
            size="sm"
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => switchTheme('light')}
            className={theme === 'light' ? 'bg-violet-600' : 'border-zinc-700'}
          >
            {t('settings_theme_light')}
          </Button>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Brain size={16} className="text-violet-400" /> {t('settings_ai')}
        </h2>
        <p className="text-xs text-zinc-500">ローカルAI (Ollama等) の設定。AIアシストの「ローカルAI」選択時に使用されます。</p>

        <div>
          <Label className="text-xs text-zinc-400">{t('settings_ai_local_url')}</Label>
          <Input value={localUrl} onChange={(e) => setLocalUrl(e.target.value)} placeholder="http://localhost:11434" className="bg-zinc-800 border-zinc-700 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">{t('settings_ai_model')}</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama3, mistral, etc." className="bg-zinc-800 border-zinc-700 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">{t('settings_ai_api_key')} (外部API用・任意)</Label>
          <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" className="bg-zinc-800 border-zinc-700 text-sm" />
        </div>

        <Button onClick={save} className="bg-violet-600 hover:bg-violet-500">
          <Save size={14} className="mr-1" /> {t('save')}
        </Button>
      </div>
    </div>
  );
}
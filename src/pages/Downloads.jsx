import { Download, Laptop, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const releaseUrl = 'https://github.com/godrenkon/RPG_Edit/releases/download/v1.2.0';

export default function Downloads() {
  const { lang } = useI18n();
  const copy = lang === 'ja'
    ? {
      title: 'Suiram RPG Edit をダウンロード', description: '使っている端末を選ぶだけで始められます。全バージョンは無料です。', latest: '最新版 v1.2.0', button: 'ダウンロード', noteTitle: '初めて使う方へ', note: '作ったゲームや素材は端末内に保存されます。大切な作品は、エディタの書き出し機能でJSONファイルにも保存してください。',
      platforms: { android: ['Android', 'Androidスマートフォン・タブレット向けAPK'], windows: ['Windows', 'Windows 10 / 11 向けインストーラー'], macos: ['macOS', 'Apple Silicon（M1以降）向けDMG'], linux: ['Linux', '主要な64bit Linux向けAppImage'] },
    }
    : {
      title: 'Download Suiram RPG Edit', description: 'Choose your device and start creating. Every version is free.', latest: 'Latest version v1.2.0', button: 'Download', noteTitle: 'Before you begin', note: 'Games and assets are stored on this device. Export important work as JSON from the editor as well.',
      platforms: { android: ['Android', 'APK for Android phones and tablets'], windows: ['Windows', 'Installer for Windows 10 and 11'], macos: ['macOS', 'DMG for Apple Silicon (M1 or later)'], linux: ['Linux', 'AppImage for mainstream 64-bit Linux'] },
    };
  const downloads = [
    { key: 'android', icon: Smartphone, href: `${releaseUrl}/Suiram.RPG.Edit.1.2.0.android.apk`, accent: 'from-emerald-500 to-teal-600' },
    { key: 'windows', icon: Monitor, href: `${releaseUrl}/Suiram.RPG.Edit.Setup.1.2.0.exe`, accent: 'from-sky-500 to-blue-600' },
    { key: 'macos', icon: Laptop, href: `${releaseUrl}/Suiram.RPG.Edit-1.2.0-arm64.dmg`, accent: 'from-violet-500 to-fuchsia-600' },
    { key: 'linux', icon: Laptop, href: `${releaseUrl}/Suiram.RPG.Edit-1.2.0.AppImage`, accent: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-950 to-violet-950/20 px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-200">{copy.latest}</span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">{copy.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {downloads.map(({ key, icon: Icon, href, accent }) => (
            <article key={key} className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-zinc-600">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}><Icon size={24} /></div>
              <h2 className="mt-5 text-xl font-semibold text-white">{copy.platforms[key][0]}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">{copy.platforms[key][1]}</p>
              <a href={href} className="mt-6 inline-block" download>
                <Button className="bg-white text-zinc-950 hover:bg-zinc-200"><Download size={17} className="mr-2" />{copy.button}</Button>
              </a>
            </article>
          ))}
        </div>

        <aside className="mt-10 flex gap-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5 text-sm leading-6 text-zinc-200">
          <ShieldCheck className="mt-0.5 shrink-0 text-violet-300" size={22} />
          <div><h2 className="font-semibold text-white">{copy.noteTitle}</h2><p className="mt-1 text-zinc-300">{copy.note}</p></div>
        </aside>
      </div>
    </div>
  );
}

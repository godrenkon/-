import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { applyTheme, getTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import {
  Home, LayoutDashboard, Gamepad2, Image, Puzzle, Users, MessageSquare,
  Settings, FileText, BookOpen, Code, LogOut, LogIn, UserPlus,
  Menu, X, Globe, Download, ExternalLink, ChevronDown, CircleUserRound
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout() {
  const { t, lang, setLanguage } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { applyTheme(getTheme()); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = isAuthenticated ? [
    { icon: Home, label: t('nav_home'), path: '/' },
    { icon: Download, label: lang === 'ja' ? 'ダウンロード' : 'Downloads', path: '/downloads' },
    { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/dashboard' },
    { icon: Gamepad2, label: t('nav_browse'), path: '/browse' },
    { icon: Image, label: t('nav_assets'), path: '/assets' },
    { icon: Puzzle, label: t('nav_plugins'), path: '/plugins' },
    { icon: Users, label: t('nav_teams'), path: '/teams' },
    { icon: MessageSquare, label: t('nav_messages'), path: '/messages' },
  ] : [
    { icon: Home, label: t('nav_home'), path: '/' },
    { icon: Download, label: lang === 'ja' ? 'ダウンロード' : 'Downloads', path: '/downloads' },
    { icon: Gamepad2, label: t('nav_browse'), path: '/browse' },
    { icon: Image, label: t('nav_assets'), path: '/assets' },
    { icon: Puzzle, label: t('nav_plugins'), path: '/plugins' },
  ];

  const bottomItems = [
    { icon: FileText, label: t('nav_terms'), path: '/terms' },
    { icon: BookOpen, label: t('nav_manual'), path: '/manual' },
    { icon: Code, label: t('nav_plugin_docs'), path: '/plugin-docs' },
  ];

  const isActive = (path) => location.pathname === path;
  const userInitial = (user?.full_name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-violet-500/20">
              SR
            </div>
            <span className="font-bold text-lg tracking-tight">Suiram RPG Edit</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive(item.path)
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'}
              `}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-zinc-800 space-y-0.5">
            {bottomItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive(item.path)
                    ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Language toggle */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
            <button
              onClick={() => setLanguage('ja')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                lang === 'ja' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe size={13} /> 日本語
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                lang === 'en' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe size={13} /> English
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-zinc-300 transition hover:bg-zinc-800 lg:hidden" aria-label="メニューを開く">
              <Menu size={22} />
            </button>
            <Link to="/" className="flex min-w-0 items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">SR</div>
              <span className="truncate font-bold">Suiram RPG Edit</span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-zinc-100">{isActive('/') ? t('nav_home') : 'Suiram RPG Edit'}</p>
              <p className="text-xs text-zinc-500">{isAuthenticated ? (user?.full_name || user?.email) : (lang === 'ja' ? 'RPGを自由につくる' : 'Build RPGs freely')}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link to="/downloads">
              <Button variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <Download size={16} className="sm:mr-1.5" /><span className="hidden sm:inline">{lang === 'ja' ? 'ダウンロード' : 'Downloads'}</span>
              </Button>
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-1 pr-2 text-left transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
                    {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : userInitial}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm font-medium text-zinc-100 sm:inline">{user?.full_name || t('nav_account')}</span>
                  <ChevronDown size={15} className="hidden text-zinc-400 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 border-zinc-700 bg-zinc-900 text-zinc-100">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate font-medium text-zinc-100">{user?.full_name || t('nav_account')}</p>
                    <p className="truncate text-xs text-zinc-400">{user?.email || (lang === 'ja' ? 'この端末のプロフィール' : 'Profile on this device')}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onSelect={() => navigate('/account')} className="cursor-pointer text-zinc-200 focus:bg-zinc-800 focus:text-white"><CircleUserRound />{t('nav_account')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/settings')} className="cursor-pointer text-zinc-200 focus:bg-zinc-800 focus:text-white"><Settings />{t('nav_settings')}</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-red-300 focus:bg-red-500/15 focus:text-red-200"><LogOut />{t('nav_logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login"><Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800"><LogIn size={16} className="sm:mr-1.5" /><span className="hidden sm:inline">サインイン</span></Button></Link>
                <Link to="/register"><Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500"><UserPlus size={16} className="sm:mr-1.5" /><span className="hidden sm:inline">アカウント作成</span></Button></Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t border-zinc-800 bg-zinc-950/70 px-4 py-4 text-center text-sm text-zinc-400 sm:px-6">
          <a
            href="https://www.suirams.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-zinc-200 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Suiram Community <span className="text-zinc-500">·</span> {lang === 'ja' ? '公式サイト' : 'Official site'} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  );
}

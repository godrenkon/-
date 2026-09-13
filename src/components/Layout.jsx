import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { applyTheme, getTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import {
  Home, LayoutDashboard, Gamepad2, Image, Puzzle, Users, MessageSquare,
  User, Settings, FileText, BookOpen, Code, LogOut, LogIn, UserPlus,
  Menu, X, Globe, Download, ExternalLink
} from 'lucide-react';

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

  if (isAuthenticated) {
    bottomItems.push(
      { icon: User, label: t('nav_account'), path: '/account' },
      { icon: Settings, label: t('nav_settings'), path: '/settings' },
    );
  }

  const isActive = (path) => location.pathname === path;

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

        {/* Auth section */}
        <div className="p-3 border-t border-zinc-800">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/account" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user?.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="text-sm truncate">
                  <div className="text-zinc-200 truncate">{user?.full_name || t('nav_account')}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition"
              >
                <LogOut size={18} /> {t('nav_logout')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/login">
                <Button variant="outline" className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                  <LogIn size={16} className="mr-2" /> {t('nav_login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button className="w-full bg-violet-600 hover:bg-violet-500">
                  <UserPlus size={16} className="mr-2" /> {t('nav_register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(true)} className="text-zinc-300">
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-bold text-white text-xs">
              SR
            </div>
            <span className="font-bold">Suiram RPG Edit</span>
          </Link>
          <div className="w-10" />
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

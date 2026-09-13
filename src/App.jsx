import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/lib/i18n';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ConfirmAccount = lazy(() => import('@/pages/ConfirmAccount'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Home = lazy(() => import('@/pages/Home'));
const Downloads = lazy(() => import('@/pages/Downloads'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const GameEditor = lazy(() => import('@/pages/GameEditor'));
const GameBrowse = lazy(() => import('@/pages/GameBrowse'));
const GameDetail = lazy(() => import('@/pages/GameDetail'));
const GamePlayer = lazy(() => import('@/pages/GamePlayer'));
const AssetLibrary = lazy(() => import('@/pages/AssetLibrary'));
const PluginBrowse = lazy(() => import('@/pages/PluginBrowse'));
const PluginDocs = lazy(() => import('@/pages/PluginDocs'));
const Account = lazy(() => import('@/pages/Account'));
const Teams = lazy(() => import('@/pages/Teams'));
const TeamDetail = lazy(() => import('@/pages/TeamDetail'));
const Messages = lazy(() => import('@/pages/Messages'));
const Terms = lazy(() => import('@/pages/Terms'));
const Manual = lazy(() => import('@/pages/Manual'));
const Settings = lazy(() => import('@/pages/Settings'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const PluginDetail = lazy(() => import('@/pages/PluginDetail'));
const AssetDetail = lazy(() => import('@/pages/AssetDetail'));

const PageLoader = () => <div className="flex min-h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-violet-500" /></div>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkAppState } = useAuth();

  useEffect(() => {
    if (authError?.type === 'auth_required') navigateToLogin();
  }, [authError, navigateToLogin]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required') return <PageLoader />;
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center"><p className="text-zinc-300">アプリの読み込みに失敗しました。</p><button onClick={checkAppState} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">再試行</button></div>;
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm-account" element={<ConfirmAccount />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Main app with layout */}
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/browse" element={<GameBrowse />} />
        <Route path="/assets" element={<AssetLibrary />} />
        <Route path="/plugins" element={<PluginBrowse />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/plugin-docs" element={<PluginDocs />} />
        <Route path="/game/:id" element={<GameDetail />} />
        <Route path="/play/:id" element={<GamePlayer />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/plugin/:id" element={<PluginDetail />} />
        <Route path="/asset/:id" element={<AssetDetail />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:id" element={<GameEditor />} />
          <Route path="/account" element={<Account />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/team/:id" element={<TeamDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App

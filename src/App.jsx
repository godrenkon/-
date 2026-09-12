import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/lib/i18n';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import GameEditor from '@/pages/GameEditor';
import GameBrowse from '@/pages/GameBrowse';
import GameDetail from '@/pages/GameDetail';
import GamePlayer from '@/pages/GamePlayer';
import AssetLibrary from '@/pages/AssetLibrary';
import PluginBrowse from '@/pages/PluginBrowse';
import PluginDocs from '@/pages/PluginDocs';
import DeveloperResources from '@/pages/DeveloperResources';
import Account from '@/pages/Account';
import Teams from '@/pages/Teams';
import TeamDetail from '@/pages/TeamDetail';
import Messages from '@/pages/Messages';
import Terms from '@/pages/Terms';
import Manual from '@/pages/Manual';
import Settings from '@/pages/Settings';
import UserProfile from '@/pages/UserProfile';
import PluginDetail from '@/pages/PluginDetail';
import AssetDetail from '@/pages/AssetDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Main app with layout */}
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<GameBrowse />} />
        <Route path="/assets" element={<AssetLibrary />} />
        <Route path="/plugins" element={<PluginBrowse />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/plugin-docs" element={<PluginDocs />} />
        <Route path="/developer" element={<DeveloperResources />} />
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
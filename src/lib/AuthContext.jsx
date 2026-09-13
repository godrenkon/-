import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { rpgStore } from '@/lib/rpgStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await rpgStore.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = useCallback(async () => {
    await rpgStore.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
  }, []);

  const navigateToLogin = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: { id: 'suiram-rpg-edit', public_settings: {} },
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

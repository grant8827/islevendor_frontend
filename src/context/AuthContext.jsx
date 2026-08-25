import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-fetches /auth/me and hydrates `user` from whatever token is
  // currently in storage. Used on mount, and also by the onboarding wizards
  // (ISLE-101..104) — their submit endpoints set a token directly via
  // api/onboarding.js's setToken() (bypassing login/register below, since
  // the applicant doesn't exist yet when the request starts), which would
  // otherwise leave `user` null and send them straight back to /login the
  // moment they hit a ProtectedRoute like the dashboard.
  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const fetched = await apiRequest('/auth/me');
      setUser(fetched);
      return fetched;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, token } = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (input) => {
    const { user, token } = await apiRequest('/auth/register', { method: 'POST', body: input, auth: false });
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

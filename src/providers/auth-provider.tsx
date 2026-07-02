/**
 * Auth context — client-side session state.
 *
 * On mount, calls `/auth/me` to check if a valid httpOnly session exists.
 * Provides login/logout and exposes the authenticated user. No JWT is ever
 * stored in JavaScript — the browser holds the cookie and React Query holds
 * the user object in memory only.
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LoginInput, RegisterInput, SafeUserProfile } from '../types';
import { authApi } from '../services/auth.service';

export interface AuthContextValue {
  user: SafeUserProfile | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<SafeUserProfile>;
  register: (input: RegisterInput) => Promise<SafeUserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const me = await authApi.me();
      if (active) {
        setUser(me);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const me = await authApi.login(input);
    setUser(me);
    return me;
  }, []);

  // Register auto-logs-in on the backend (sets cookies) and returns the profile.
  const register = useCallback(async (input: RegisterInput) => {
    const me = await authApi.register(input);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
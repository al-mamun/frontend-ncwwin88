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

  /*
   * Bootstrap the session on mount.
   *
   * `loading` gates the entire player area behind an "Authenticating…"
   * spinner, so whatever happens here MUST end. If this promise never settles
   * - a stalled request that is neither answered nor refused, which is exactly
   * what a flaky mobile network produces - the spinner stays up forever and
   * the player has no way forward but to reload a page that looks broken.
   *
   * So: give the check a bounded window, and if it expires try once more
   * before giving up. A slow answer that still arrives is treated as real;
   * only after the retry also fails do we settle on "no session", and the
   * finally clause guarantees the spinner comes down either way.
   */
  useEffect(() => {
    let active = true;
    const withTimeout = (ms: number) =>
      Promise.race([
        authApi.me(),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms)),
      ]);
    (async () => {
      try {
        let me = await withTimeout(12000);
        if (me === 'timeout') me = await withTimeout(12000);
        if (active) setUser(me === 'timeout' ? null : me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
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
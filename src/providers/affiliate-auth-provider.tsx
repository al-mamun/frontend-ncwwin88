/**
 * Affiliate auth context — client-side session state for the affiliate portal.
 * Bootstraps via GET /affiliate/me (affiliate surface cookie). No JWT in JS.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { affiliateApi, type AffiliateMe, type AffiliateRegisterInput } from '../services/affiliate.service';

export interface AffiliateAuthContextValue {
  me: AffiliateMe | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: AffiliateRegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AffiliateAuthContextValue | null>(null);

export function AffiliateAuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AffiliateMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await affiliateApi.me();
    setMe(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await affiliateApi.me();
      if (active) {
        setMe(data);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    await affiliateApi.login(identifier, password);
    setMe(await affiliateApi.me());
  }, []);

  const register = useCallback(async (input: AffiliateRegisterInput) => {
    await affiliateApi.register(input);
    setMe(await affiliateApi.me());
  }, []);

  const logout = useCallback(async () => {
    await affiliateApi.logout();
    setMe(null);
  }, []);

  const value = useMemo<AffiliateAuthContextValue>(
    () => ({ me, loading, login, register, logout, refresh }),
    [me, loading, login, register, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAffiliateAuth(): AffiliateAuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAffiliateAuth must be used within <AffiliateAuthProvider>');
  return ctx;
}

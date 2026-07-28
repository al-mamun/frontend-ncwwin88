/**
 * Affiliate auth context — client-side session state for the affiliate portal.
 * Bootstraps via GET /affiliate/me (affiliate surface cookie). No JWT in JS.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { affiliateApi, portalFeatures, type AffiliateMe, type AffiliateRegisterInput } from '../services/affiliate.service';
import { ApiRequestError } from '../lib/api';

export interface AffiliateAuthContextValue {
  me: AffiliateMe | null;
  loading: boolean;
  /**
   * Set when the session could not be established for a reason that is NOT
   * "you are signed out" - the server was unreachable, timed out, or blew up.
   * The portal shell uses this to offer a retry instead of bouncing the user
   * to the login screen, which would be a lie about why they lost their page.
   */
  error: Error | null;
  retry: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: AffiliateRegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AffiliateAuthContextValue | null>(null);

export function AffiliateAuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AffiliateMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const refresh = useCallback(async () => {
    const data = await affiliateApi.me();
    setMe(data);
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      setLoading(true);
      setError(null);
      // `loading` gates every screen in the portal, so it MUST resolve even when the
      // bootstrap throws (offline, DNS failure, CORS, a 5xx that escapes the service
      // layer) AND when it never settles at all. A request that simply hangs - a
      // stalled CORS preflight is the usual culprit - would otherwise leave every
      // affiliate page on "Loading…" forever, so the race below puts a ceiling on it.
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Can't reach the server. Check your connection and try again.")), 15_000);
      });
      try {
        const data = await Promise.race([affiliateApi.me(), timeout]);
        if (active) { setMe(data); setError(null); }
      } catch (e) {
        if (!active) return;
        setMe(null);
        // 401/403 is not a failure - it is the answer "you are signed out", and the
        // shell should route to login. Everything else is a real fault worth showing.
        const status = e instanceof ApiRequestError ? e.status : 0;
        setError(status === 401 || status === 403 ? null : e instanceof Error ? e : new Error('Could not load your session.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [attempt]);

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
    () => ({ me, loading, error, retry, login, register, logout, refresh }),
    [me, loading, error, retry, login, register, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAffiliateAuth(): AffiliateAuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAffiliateAuth must be used within <AffiliateAuthProvider>');
  return ctx;
}

/**
 * The tenant's optional portal surfaces, read off the already-loaded session.
 *
 * A hook rather than a per-page fetch on purpose: `me` is bootstrapped once for
 * the whole portal, so a page asking "do we have sub-affiliates here?" costs
 * nothing and can never disagree with what the sidebar decided.
 *
 * While the session is still loading this answers with the pre-flag defaults
 * (everything on). Pages under `(portal)` never render in that state — the shell
 * holds them behind its own loading gate — so the only effect is that a caller
 * outside the group sees today's behaviour instead of a flash of hidden UI.
 */
export function usePortalFeatures(): ReturnType<typeof portalFeatures> {
  const { me } = useAffiliateAuth();
  return useMemo(() => portalFeatures(me), [me]);
}

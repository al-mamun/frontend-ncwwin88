/**
 * Tenant context (client).
 *
 * Holds the server-resolved TenantPublicConfig in React context and exposes it
 * via useTenant(). The config is resolved on the SERVER (root layout) and
 * passed in as a prop — this component does not fetch.
 *
 * `isActive` lets the UI render a "site unavailable" state when the tenant is
 * SUSPENDED/DISABLED. This is UX only — the backend remains the real
 * enforcement boundary for tenant access.
 */

'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import type { TenantPublicConfig } from '../../types/tenant';

export interface TenantContextValue {
  tenant: TenantPublicConfig;
  /** Convenience: true only when tenant.status === 'ACTIVE'. */
  isActive: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantPublicConfig;
  children: React.ReactNode;
}) {
  const value = useMemo<TenantContextValue>(
    () => ({ tenant, isActive: tenant.status === 'ACTIVE' }),
    [tenant],
  );

  // Apply the tenant's favicon at runtime (player + affiliate surfaces).
  useEffect(() => {
    const url = tenant.faviconUrl;
    if (!url || typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [tenant.faviconUrl]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within <TenantProvider>');
  return ctx;
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../providers/auth-provider';
import { TenantProvider } from '../core/tenant/TenantProvider';
import { ThemeProvider } from '../core/theme/ThemeProvider';
import { LanguageProvider } from '../core/i18n/LanguageProvider';
import { WalletProvider } from '../core/wallet/WalletProvider';
import { TenantUnavailable } from '../components/shared/TenantUnavailable';
import { AffiliateTracker } from '../components/shared/AffiliateTracker';
import { ChatWidget } from '../components/shared/chat-widget';
import { AppInstall } from '../components/shared/app-install';
import type { TenantPublicConfig } from '../types/tenant';

/**
 * Client providers.
 *
 * Tree: QueryClient > Tenant > Theme > Auth > Wallet > children.
 *
 * The tenant config is resolved on the SERVER (root layout) and passed in as a
 * prop — providers never fetch the tenant. When the tenant is not ACTIVE we
 * render a UX-only "site unavailable" screen (backend stays the real boundary).
 */
export function Providers({
  tenant,
  children,
}: {
  tenant: TenantPublicConfig;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  // Defensive: tenant is resolved server-side and should always be a safe
  // fallback object, but guard against a momentarily-undefined value (e.g. a
  // half-compiled module during dev hot-reload) so the whole app can't 500.
  if (!tenant) {
    return (
      <QueryClientProvider client={queryClient}>
        <TenantUnavailable status="SUSPENDED" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider tenant={tenant}>
        <ThemeProvider>
          <LanguageProvider>
          {tenant.status !== 'ACTIVE' ? (
            <TenantUnavailable status={tenant.status} name={tenant.name} />
          ) : (
            <AuthProvider>
              <WalletProvider>
                <AffiliateTracker />
                {children}
                <ChatWidget />
                <AppInstall />
              </WalletProvider>
            </AuthProvider>
          )}
          </LanguageProvider>
        </ThemeProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}

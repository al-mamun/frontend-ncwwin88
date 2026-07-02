/**
 * WalletProvider (client).
 *
 * Thin wrapper around the existing useWallet() hook. It does NOT fetch the
 * balance itself — it reuses the existing React Query hook + query key, so the
 * 30s auto-refresh and cache are shared. The balance is ALWAYS the backend
 * value; nothing is computed client-side.
 *
 * `refresh()` invalidates the wallet query (forces a refetch from backend).
 */

'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet, queryKeys } from '../../hooks/player-hooks';
import type { PlayerWallet } from '../../types';

export interface WalletContextValue {
  wallet: PlayerWallet | undefined;
  isLoading: boolean;
  /** Invalidate the wallet query — triggers a fresh fetch from the backend. */
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useWallet();

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.wallet });
  }, [qc]);

  const value = useMemo<WalletContextValue>(
    () => ({ wallet: data, isLoading, refresh }),
    [data, isLoading, refresh],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within <WalletProvider>');
  return ctx;
}

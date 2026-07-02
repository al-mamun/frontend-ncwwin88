/**
 * Wallet page — player's financial dashboard.
 * Shows balance, held amount, quick stats, deposit/withdraw CTAs,
 * pending status, and recent transactions.
 */
'use client';

import { useWallet, useProfile, useLedger } from '@/hooks/player-hooks';
import {
  PageContainer,
  BalanceCard,
  StatCard,
  ProfileCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/shared';
import { ActionButton, PendingStatusCard } from '@/components/shared/payment-components';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Wallet as WalletIcon, Lock, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading, isError: walletError } = useWallet();
  const { data: profile } = useProfile();
  const { data: ledgerData } = useLedger({ page: 1, limit: 5 });

  if (walletLoading) return <LoadingState message="Loading wallet…" />;
  if (walletError || !wallet)
    return (
      <PageContainer>
        <ErrorState message="Unable to load wallet. Please try again." />
      </PageContainer>
    );

  const available = wallet.balanceMinor - wallet.heldMinor;
  const recentTxns = ledgerData?.items ?? [];

  return (
    <PageContainer>
      <h1 className="mb-6 text-2xl font-bold">My Wallet</h1>

      {profile && (
        <div className="mb-6">
          <ProfileCard
            displayName={profile.displayName}
            email={profile.email}
            username={profile.username}
            avatar={profile.avatar}
          />
        </div>
      )}

      <div className="mb-6">
        <BalanceCard
          balance={wallet.balanceMinor}
          held={wallet.heldMinor}
          currency={wallet.currency}
        />
      </div>

      {/* Deposit / Withdraw Action Buttons */}
      <div className="mb-6 flex gap-3">
        <ActionButton
          href="/player/deposit"
          label="Deposit"
          icon={ArrowDownToLine}
          variant="primary"
        />
        <ActionButton
          href="/player/withdraw"
          label="Withdraw"
          icon={ArrowUpFromLine}
          variant="secondary"
        />
      </div>

      {/* Pending Status (shows if held > 0) */}
      {wallet.heldMinor > 0 && (
        <div className="mb-6">
          <PendingStatusCard
            count={1}
            type="withdrawal"
            amountMinor={wallet.heldMinor}
            currency={wallet.currency}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Available"
          value={formatCurrency(available, wallet.currency)}
          icon={TrendingUp}
          hint="Withdrawable now"
        />
        <StatCard
          label="Held (in escrow)"
          value={formatCurrency(wallet.heldMinor, wallet.currency)}
          icon={Lock}
          hint="Pending withdrawals"
        />
        <StatCard
          label="Currency"
          value={wallet.currency}
          icon={WalletIcon}
          hint={`Status: ${wallet.status}`}
        />
      </div>

      {/* Recent Transactions Widget */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <a
            href="/player/ledger"
            className="text-sm text-brand hover:underline"
          >
            View All
          </a>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState message="No transactions yet. Make your first deposit!" />
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {recentTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{txn.type}</p>
                    <p className="truncate text-xs text-muted">
                      {txn.description ?? formatDate(txn.createdAt)}
                    </p>
                  </div>
                  <span
                    className={
                      txn.amountMinor >= 0
                        ? 'flex-shrink-0 font-semibold text-brand'
                        : 'flex-shrink-0 font-semibold text-danger'
                    }
                  >
                    {txn.amountMinor >= 0 ? '+' : ''}
                    {formatCurrency(txn.amountMinor, txn.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <p>
          💡 Your balance updates automatically. Funds in escrow are locked during pending
          withdrawal processing and will be released if a withdrawal is rejected.
        </p>
      </div>
    </PageContainer>
  );
}
/**
 * Deposit page — player initiates a deposit request.
 * Uses real backend API: payment-methods, payment-accounts, deposits.
 *
 * Flow: 1) choose method → 2) choose account type (Personal/Agent, when the
 * method has typed accounts) → 3) pick a destination account (full number +
 * copy + its own limit) → 4) enter amount + reference. Deposit limits are
 * per-DESTINATION-ACCOUNT (Agent = unlimited), not per method.
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowDownToLine, Infinity as InfinityIcon, ShieldCheck, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import {
  usePaymentMethods,
  usePaymentAccounts,
  useCreateDeposit,
  usePlayerDeposits,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState } from '@/components/shared';
import {
  PaymentMethodCard,
  PaymentAccountCard,
  AmountInput,
  RequestSuccess,
} from '@/components/shared/payment-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { ApiRequestError } from '@/lib/api';
import { playerApi } from '@/services/player.service';
import { useI18n } from '@/core/i18n/LanguageProvider';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { DepositRequestResponse, PlayerDeposit } from '@/types';

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dep_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Quick-pick deposit amounts; filtered to the selected account's limits. */
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 15000, 20000, 25000, 30000, 50000];

export default function DepositPage() {
  const router = useRouter();
  const { t } = useI18n();

  // Data queries
  const {
    data: methods,
    isLoading: methodsLoading,
    isError: methodsError,
    refetch: refetchMethods,
  } = usePaymentMethods('deposit');

  // Form state
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<DepositRequestResponse | null>(null);

  // Load accounts for the selected method
  const {
    data: accounts,
    isLoading: accountsLoading,
  } = usePaymentAccounts({
    type: 'deposit',
    methodId: selectedMethodId ?? undefined,
  });

  const depositMutation = useCreateDeposit();

  // Derived state
  const selectedMethod = useMemo(
    () => methods?.find((m) => m.id === selectedMethodId) ?? null,
    [methods, selectedMethodId],
  );

  // Distinct account types available for this method (e.g. personal, agent).
  const accountTypes = useMemo(() => {
    const set = new Set<string>();
    (accounts ?? []).forEach((a) => {
      if (a.accountType) set.add(a.accountType.toLowerCase());
    });
    return Array.from(set);
  }, [accounts]);

  const hasTypes = accountTypes.length > 0;

  // NOTE: we intentionally do NOT auto-select a type — even when a method has only
  // one type, the player must tap Personal/Agent to reveal the account + amount step.

  // Accounts shown after the type filter (untyped methods show all).
  const visibleAccounts = useMemo(() => {
    if (!accounts) return [];
    if (!hasTypes) return accounts;
    if (!selectedAccountType) return [];
    return accounts.filter((a) => (a.accountType?.toLowerCase() ?? '') === selectedAccountType);
  }, [accounts, hasTypes, selectedAccountType]);

  const selectedAccount = useMemo(
    () => accounts?.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  // Open the amount box as soon as a type is chosen: auto-select the first
  // matching account (the player can still tap a different number to switch).
  useEffect(() => {
    if (visibleAccounts.length > 0 && !visibleAccounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(visibleAccounts[0].id);
    }
  }, [visibleAccounts, selectedAccountId]);

  // Limits come from the SELECTED ACCOUNT. Max 0 = unlimited (Agent); min falls
  // back to the method minimum when the account has none set.
  const accountMaxMinor = selectedAccount?.maxLimitMinor ?? 0; // 0 = unlimited
  const minMinor =
    (selectedAccount?.minLimitMinor ?? 0) > 0
      ? selectedAccount!.minLimitMinor
      : selectedMethod?.minDepositMinor ?? 0;
  const currency = selectedMethod?.currency ?? 'BDT';

  // Validation
  const amountError = useMemo(() => {
    if (!amount) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 'Enter a valid amount';
    const minor = Math.round(parsed * 100);
    if (minMinor > 0 && minor < minMinor) return `Minimum is ${formatCurrency(minMinor, currency)}`;
    if (accountMaxMinor > 0 && minor > accountMaxMinor)
      return `Maximum for this account is ${formatCurrency(accountMaxMinor, currency)}`;
    return null;
  }, [amount, minMinor, accountMaxMinor, currency]);

  const canSubmit =
    selectedMethodId &&
    selectedAccountId &&
    amount &&
    !amountError &&
    transactionReference.trim() &&
    senderAccountNumber.trim() &&
    !proofUploading &&
    !depositMutation.isPending;

  // Handlers
  function selectMethod(id: string) {
    setSelectedMethodId(id);
    setSelectedAccountType(null);
    setSelectedAccountId(null);
    setAmount('');
  }

  function selectType(t: string) {
    setSelectedAccountType(t);
    setSelectedAccountId(null);
    setAmount('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedMethod) return;

    let proofAssetId: string | undefined;
    if (proofFile) {
      setUploadErr(null);
      setProofUploading(true);
      try {
        const up = await playerApi.uploadImage(proofFile, 'proof');
        proofAssetId = up.url;
      } catch (err) {
        setUploadErr(err instanceof ApiRequestError ? err.message : 'Proof upload failed.');
        setProofUploading(false);
        return;
      }
      setProofUploading(false);
    }

    const minor = Math.round(parseFloat(amount) * 100);
    depositMutation.mutate(
      {
        input: {
          paymentMethodId: selectedMethodId!,
          paymentAccountId: selectedAccountId!,
          amount: minor,
          currency: selectedMethod.currency,
          transactionReference: transactionReference.trim(),
          senderAccountNumber: senderAccountNumber.trim(),
          proofAssetId,
        },
        idempotencyKey: generateIdempotencyKey(),
      },
      {
        onSuccess: (data) => setSuccessResponse(data),
      },
    );
  }

  // Success state
  if (successResponse) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-muted hover:text-base"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <RequestSuccess
          title={t('deposit.submitted')}
          response={successResponse}
          type="deposit"
          onDone={() => router.push('/player/wallet')}
        />
      </PageContainer>
    );
  }

  // Loading state
  if (methodsLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading deposit methods…" />
      </PageContainer>
    );
  }

  // Error state
  if (methodsError || !methods) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-muted hover:text-base"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Wallet
          </button>
        </div>
        <ErrorState message="Unable to load payment methods." />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => refetchMethods()}>{t('deposit.retry')}</Button>
        </div>
      </PageContainer>
    );
  }

  // Empty state — no deposit methods available
  if (methods.length === 0) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-muted hover:text-base"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Wallet
          </button>
        </div>
        <EmptyState message="No deposit methods are currently available. Please check back later." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/player/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-elevated"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ArrowDownToLine className="h-6 w-6 text-brand" />
            Deposit
          </h1>
          <p className="text-sm text-muted">{t('deposit.subtitle')}</p>
        </div>
      </div>

      {/* Live status of the player's own recent deposits (under verification → approved/rejected) */}
      <DepositStatusTracker />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step 1: Payment Method */}
        <Step index={1} title={t('deposit.step1')}>
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                flow="deposit"
                selected={selectedMethodId === method.id}
                onSelect={() => selectMethod(method.id)}
              />
            ))}
          </div>
        </Step>

        {/* Step 2: Account Type (Personal / Agent) */}
        {selectedMethodId && hasTypes && (
          <Step index={2} title={t('deposit.step2')}>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map((acctType) => {
                const active = selectedAccountType === acctType;
                const isAgent = acctType === 'agent';
                return (
                  <button
                    key={acctType}
                    type="button"
                    onClick={() => selectType(acctType)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-4 py-4 text-center transition-all',
                      active
                        ? 'border-brand/60 bg-brand/5'
                        : 'border-border hover:border-brand/40 hover:bg-elevated/50',
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-base font-semibold capitalize">
                      {isAgent ? <InfinityIcon className="h-4 w-4 text-gold-soft" /> : <ShieldCheck className="h-4 w-4 text-brand" />}
                      {acctType} Account
                    </span>
                    <span className="text-xs text-muted">
                      {isAgent ? t('deposit.unlimited') : t('deposit.standardLimit')}
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {/* Step 3: Destination Account */}
        {selectedMethodId && (!hasTypes || selectedAccountType) && (
          <Step index={hasTypes ? 3 : 2} title={t('deposit.step3')}>
            {accountsLoading ? (
              <LoadingState message="Loading accounts…" />
            ) : visibleAccounts.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted">
                  Send your payment to the number below, then enter the amount and your transaction reference.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleAccounts.map((account) => (
                    <PaymentAccountCard
                      key={account.id}
                      account={account}
                      currency={currency}
                      selected={selectedAccountId === account.id}
                      onSelect={() => setSelectedAccountId(account.id)}
                    />
                  ))}
                </div>

                {/* Amount form lives in THIS step so users can't miss it. */}
                {selectedMethod && selectedAccount && (
                  <Card className="mt-5">
                    <p className="px-6 pt-5 text-sm font-semibold">{t('deposit.selectAmount')}</p>
                    <CardContent className="flex flex-col gap-4 p-6">
                {/* Limit summary for the chosen account */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-elevated/60 px-4 py-3 text-sm">
                  <div>
                    <span className="text-muted">Min: </span>
                    <span className="font-semibold">{formatCurrency(minMinor, currency)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Max: </span>
                    {accountMaxMinor > 0 ? (
                      <span className="font-semibold">{formatCurrency(accountMaxMinor, currency)}</span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-success">
                        <InfinityIcon className="h-4 w-4" /> Unlimited
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick-pick amounts (within this account's limits) */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {QUICK_AMOUNTS.filter((a) => {
                    const minor = a * 100;
                    return (minMinor === 0 || minor >= minMinor) && (accountMaxMinor === 0 || minor <= accountMaxMinor);
                  }).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={cn(
                        'rounded-md border px-2 py-2.5 text-sm font-semibold transition-colors',
                        amount === String(a)
                          ? 'border-gold-soft bg-gold-soft/10 text-gold-soft'
                          : 'border-border bg-elevated text-base hover:border-gold-soft/40',
                      )}
                    >
                      {a.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>
                <AmountInput
                  label={t('deposit.exactAmount')}
                  value={amount}
                  onChange={setAmount}
                  currency={currency}
                  min={minMinor}
                  max={accountMaxMinor > 0 ? accountMaxMinor : undefined}
                  error={amountError}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">
                    {t('deposit.txRef')} <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder={t('deposit.txRefPlaceholder')}
                    maxLength={128}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">
                    {t('deposit.senderAcct')} <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="text"
                    value={senderAccountNumber}
                    onChange={(e) => setSenderAccountNumber(e.target.value)}
                    placeholder={t('deposit.senderPlaceholder')}
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">
                    {t('deposit.proofLabel')} <span className="text-muted">{t('deposit.optional')}</span>
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-elevated file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-colors hover:file:border-gold-soft/50 hover:file:bg-base"
                  />
                  <p className="mt-1 text-xs text-muted">{proofUploading ? t('deposit.uploading') : t('deposit.proofHint')}</p>
                  {uploadErr && <p className="mt-1 text-xs text-danger">{uploadErr}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">
                    {t('deposit.note')} <span className="text-muted">{t('deposit.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('deposit.notePlaceholder')}
                  />
                </div>

                {/* Gentle reminder (reference style) */}
                <div className="rounded-md border border-gold-soft/20 bg-gold-soft/5 p-3 text-xs leading-relaxed text-muted">
                  <p className="mb-1 font-bold text-gold-soft">{t('deposit.reminder')}</p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>{t('deposit.rem1')}</li>
                    <li>{t('deposit.rem2')}</li>
                    <li>{t('deposit.rem3')}</li>
                  </ol>
                </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState message="No accounts available for this selection." />
            )}
          </Step>
        )}

        {/* Error / Submit */}
        {depositMutation.isError && (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="p-4">
              <p className="text-sm text-danger">
                {depositMutation.error instanceof ApiRequestError
                  ? depositMutation.error.message
                  : 'Failed to submit deposit. Please try again.'}
              </p>
            </CardContent>
          </Card>
        )}

        {selectedMethod && selectedAccount && (
          <Button type="submit" disabled={!canSubmit} className="w-full text-base">
            {depositMutation.isPending ? t('deposit.submitting') : t('deposit.submit')}
          </Button>
        )}
      </form>
    </PageContainer>
  );
}

/** Approved confirmation is transient (positive, no action needed). Rejected stays
 *  much longer so the player reliably reads WHY it was rejected. */
const APPROVED_VISIBLE_MS = 3 * 60 * 1000; // 3 minutes
const REJECTED_VISIBLE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Live tracker for the player's own recent deposits. Pending deposits show an
 * amber "Under verification" card (always, until resolved); a deposit that was
 * approved/rejected within the last few minutes shows a green/red result card
 * that auto-disappears once the window passes. Polls via usePlayerDeposits.
 */
/** localStorage key for deposit status messages the player has dismissed. */
const DISMISSED_KEY = 'dismissed-deposit-status';

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function DepositStatusTracker() {
  const { data } = usePlayerDeposits({ page: 1, limit: 5 });
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev).add(id);
      try {
        window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const now = Date.now();
  const visible = (data?.items ?? []).filter((d) => {
    if (dismissed.has(d.id)) return false;
    if (d.status === 'PENDING') return true;
    const t = d.processedAt ? new Date(d.processedAt).getTime() : 0;
    if (d.status === 'APPROVED') return now - t < APPROVED_VISIBLE_MS;
    if (d.status === 'REJECTED') return now - t < REJECTED_VISIBLE_MS;
    return false;
  });
  if (visible.length === 0) return null;
  return (
    <section className="mb-6 flex flex-col gap-3">
      {visible.map((d) => (
        <DepositStatusCard
          key={d.id}
          deposit={d}
          // Pending can't be dismissed (it auto-resolves); approved/rejected can.
          onDismiss={d.status === 'PENDING' ? undefined : () => dismiss(d.id)}
        />
      ))}
    </section>
  );
}

function DepositStatusCard({ deposit, onDismiss }: { deposit: PlayerDeposit; onDismiss?: () => void }) {
  const amount = formatCurrency(deposit.amount, deposit.currency);

  const variant =
    deposit.status === 'APPROVED'
      ? {
          wrap: 'border-success/30 bg-success/10',
          icon: <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />,
          title: <p className="font-semibold text-success">Deposit approved 🎉</p>,
          message: `${amount} has been credited to your wallet.`,
        }
      : deposit.status === 'REJECTED'
        ? {
            wrap: 'border-danger/30 bg-danger/10',
            icon: <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />,
            title: <p className="font-semibold text-danger">Deposit rejected</p>,
            message: `${amount}${deposit.rejectedReason ? ` — ${deposit.rejectedReason}` : ''}. Please contact support if this looks wrong.`,
          }
        : {
            wrap: 'border-warning/30 bg-warning/10',
            icon: <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 animate-pulse text-warning" />,
            title: <p className="font-semibold text-warning">Deposit under verification</p>,
            message: `${amount} — we're verifying your payment and will credit your wallet shortly. This page updates automatically.`,
          };

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', variant.wrap)}>
      {variant.icon}
      <div className="min-w-0 flex-1">
        {variant.title}
        <p className="text-sm text-muted">{variant.message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-base"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Numbered step wrapper for the deposit flow. */
function Step({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
          {index}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Withdraw page — player initiates a withdrawal request.
 * Uses real backend API: wallet, payment-methods, payment-accounts, withdrawals.
 * Backend atomically freezes (escrows) funds — client never fakes balances.
 */
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpFromLine } from 'lucide-react';
import {
  useWallet,
  usePaymentMethods,
  useCreateWithdrawal,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState, ConfirmDialog } from '@/components/shared';
import {
  PaymentMethodCard,
  AmountInput,
  LimitInfo,
  RequestSuccess,
} from '@/components/shared/payment-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { ApiRequestError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { WithdrawalRequestResponse } from '@/types';
import { useI18n } from '@/core/i18n/LanguageProvider';

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `wd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Quick-pick amounts (reference style); filtered to method limits + available balance. */
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 15000, 20000, 25000, 30000];

export default function WithdrawPage() {
  const router = useRouter();
  const { locale } = useI18n();

  // Data queries
  const { data: wallet, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } = useWallet();
  const {
    data: methods,
    isLoading: methodsLoading,
    isError: methodsError,
    refetch: refetchMethods,
  } = usePaymentMethods('withdrawal');

  // Form state
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [successResponse, setSuccessResponse] = useState<WithdrawalRequestResponse | null>(null);

  const withdrawMutation = useCreateWithdrawal();

  // Derived state
  const selectedMethod = useMemo(
    () => methods?.find((m) => m.id === selectedMethodId) ?? null,
    [methods, selectedMethodId],
  );

  const availableBalance = wallet ? wallet.balanceMinor - wallet.heldMinor : 0;

  // Validation
  const amountError = useMemo(() => {
    if (!amount) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return locale === 'bn' ? '0-এর বেশি একটি বৈধ পরিমাণ লিখুন' : 'Enter a valid amount greater than 0';
    const minor = Math.round(parsed * 100);
    if (wallet && minor > availableBalance)
      return locale === 'bn'
        ? `পর্যাপ্ত ব্যালেন্স নেই (${formatCurrency(availableBalance, wallet.currency)})`
        : `Insufficient available balance (${formatCurrency(availableBalance, wallet.currency)})`;
    if (selectedMethod) {
      if (minor < selectedMethod.minWithdrawalMinor)
        return locale === 'bn'
          ? `সর্বনিম্ন ${(selectedMethod.minWithdrawalMinor / 100).toFixed(2)} ${selectedMethod.currency}`
          : `Minimum is ${(selectedMethod.minWithdrawalMinor / 100).toFixed(2)} ${selectedMethod.currency}`;
      if (minor > selectedMethod.maxWithdrawalMinor)
        return locale === 'bn'
          ? `সর্বোচ্চ ${(selectedMethod.maxWithdrawalMinor / 100).toFixed(2)} ${selectedMethod.currency}`
          : `Maximum is ${(selectedMethod.maxWithdrawalMinor / 100).toFixed(2)} ${selectedMethod.currency}`;
    }
    return null;
  }, [amount, wallet, selectedMethod, availableBalance]);

  const canSubmit =
    selectedMethodId &&
    amount &&
    !amountError &&
    !withdrawMutation.isPending;

  // Handlers
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedMethod || !wallet) return;
    setShowConfirm(true);
  }

  function handleConfirm() {
    if (!canSubmit || !selectedMethod || !wallet) return;
    setShowConfirm(false);

    const minor = Math.round(parseFloat(amount) * 100);
    withdrawMutation.mutate(
      {
        input: {
          paymentMethodId: selectedMethodId!,
          amount: minor,
          currency: selectedMethod.currency,
          accountNumber: accountNumber.trim() || undefined,
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
            <ArrowLeft className="h-4 w-4" /> {locale === 'bn' ? 'পিছনে' : 'Back'}
          </button>
        </div>
        <RequestSuccess
          title={locale === 'bn' ? 'উত্তোলনের অনুরোধ জমা হয়েছে!' : 'Withdrawal Submitted!'}
          response={successResponse}
          type="withdrawal"
          onDone={() => router.push('/player/wallet')}
        />
      </PageContainer>
    );
  }

  // Loading state
  if (walletLoading || methodsLoading) {
    return (
      <PageContainer>
        <LoadingState message={locale === 'bn' ? 'উত্তোলনের বিকল্পগুলি লোড হচ্ছে…' : 'Loading withdrawal options…'} />
      </PageContainer>
    );
  }

  // Error state
  if (walletError || !wallet || methodsError || !methods) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-muted hover:text-base"
          >
            <ArrowLeft className="h-4 w-4" /> {locale === 'bn' ? 'ওয়ালেটে ফিরে যান' : 'Back to Wallet'}
          </button>
        </div>
        <ErrorState message={locale === 'bn' ? 'উত্তোলনের তথ্য লোড করা যায়নি।' : 'Unable to load withdrawal information.'} />
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => refetchWallet()}>{locale === 'bn' ? 'ওয়ালেট আবার চেষ্টা করুন' : 'Retry Wallet'}</Button>
          <Button variant="secondary" onClick={() => refetchMethods()}>{locale === 'bn' ? 'পদ্ধতি আবার চেষ্টা করুন' : 'Retry Methods'}</Button>
        </div>
      </PageContainer>
    );
  }

  // Empty state — no withdrawal methods or no balance
  if (methods.length === 0) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-muted hover:text-base"
          >
            <ArrowLeft className="h-4 w-4" /> {locale === 'bn' ? 'ওয়ালেটে ফিরে যান' : 'Back to Wallet'}
          </button>
        </div>
        <EmptyState message={locale === 'bn' ? 'বর্তমানে কোনো উত্তোলন পদ্ধতি উপলব্ধ নেই। অনুগ্রহ করে পরে আবার দেখুন।' : 'No withdrawal methods are currently available. Please check back later.'} />
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
            <ArrowUpFromLine className="h-6 w-6 text-brand" />
            {locale === 'bn' ? 'উত্তোলন' : 'Withdraw'}
          </h1>
          <p className="text-sm text-muted">{locale === 'bn' ? 'আপনার ওয়ালেট থেকে টাকা তুলুন' : 'Cash out from your wallet'}</p>
        </div>
      </div>

      {/* Available Balance Card */}
      <Card className="mb-6 border-brand/30">
        <CardContent className="p-5">
          <p className="text-sm text-muted">{locale === 'bn' ? 'উপলব্ধ ব্যালেন্স' : 'Available Balance'}</p>
          <p className="mt-1 text-3xl font-extrabold text-brand">
            {formatCurrency(availableBalance, wallet.currency)}
          </p>
          {wallet.heldMinor > 0 && (
            <p className="mt-1 text-sm text-warning">
              {locale === 'bn'
                ? `${formatCurrency(wallet.heldMinor, wallet.currency)} বিচারাধীন উত্তোলনে আটকে আছে`
                : `${formatCurrency(wallet.heldMinor, wallet.currency)} held in pending withdrawals`}
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step 1: Payment Method */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">{locale === 'bn' ? '১. উত্তোলন পদ্ধতি নির্বাচন করুন' : '1. Choose Withdrawal Method'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                flow="withdrawal"
                selected={selectedMethodId === method.id}
                onSelect={() => setSelectedMethodId(method.id)}
              />
            ))}
          </div>
        </section>

        {/* Step 2: Amount + Account Number */}
        {selectedMethod && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">{locale === 'bn' ? '২. উত্তোলনের বিবরণ লিখুন' : '2. Enter Withdrawal Details'}</h2>
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <LimitInfo
                  min={selectedMethod.minWithdrawalMinor}
                  max={selectedMethod.maxWithdrawalMinor}
                  currency={selectedMethod.currency}
                  available={availableBalance}
                  flow="withdraw"
                />
                {/* Quick-pick amounts (within limits + available balance) */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {QUICK_AMOUNTS.filter((a) => {
                    const minor = a * 100;
                    return (
                      minor >= selectedMethod.minWithdrawalMinor &&
                      minor <= selectedMethod.maxWithdrawalMinor &&
                      minor <= availableBalance
                    );
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
                  label={locale === 'bn' ? 'উত্তোলনের পরিমাণ' : 'Withdraw Amount'}
                  value={amount}
                  onChange={setAmount}
                  currency={selectedMethod.currency}
                  min={selectedMethod.minWithdrawalMinor}
                  max={selectedMethod.maxWithdrawalMinor}
                  error={amountError}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted">
                    {locale === 'bn' ? 'আপনার অ্যাকাউন্ট নম্বর' : 'Your Account Number'} <span className="text-muted">{locale === 'bn' ? '(ঐচ্ছিক)' : '(optional)'}</span>
                  </label>
                  <Input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={locale === 'bn' ? 'যেমন আপনার bKash/Nagad/Bank নম্বর' : 'e.g. Your bKash/Nagad/Bank number'}
                    maxLength={64}
                  />
                  <p className="mt-1 text-xs text-muted">
                    {locale === 'bn' ? 'যে অ্যাকাউন্টে টাকা পেতে চান সেটির তথ্য লিখুন।' : 'Enter the destination account where you want to receive funds.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Error */}
        {withdrawMutation.isError && (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="p-4">
              <p className="text-sm text-danger">
                {withdrawMutation.error instanceof ApiRequestError
                  ? withdrawMutation.error.message
                  : locale === 'bn' ? 'উত্তোলন জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to submit withdrawal. Please try again.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {selectedMethod && (
          <Button type="submit" disabled={!canSubmit} className="w-full text-base">
            {withdrawMutation.isPending ? (locale === 'bn' ? 'প্রক্রিয়াকরণ হচ্ছে…' : 'Processing…') : (locale === 'bn' ? 'উত্তোলন পর্যালোচনা করুন' : 'Review Withdrawal')}
          </Button>
        )}
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title={locale === 'bn' ? 'উত্তোলন নিশ্চিত করুন' : 'Confirm Withdrawal'}
        message={
          amount
            ? locale === 'bn'
              ? `আপনি ${formatCurrency(Math.round(parseFloat(amount) * 100), selectedMethod?.currency ?? 'BDT')} উত্তোলন করতে যাচ্ছেন। অনুমোদন না হওয়া পর্যন্ত এই পরিমাণ এসক্রোতে আটকে রাখা হবে। আপনি কি এগিয়ে যেতে চান?`
              : `You are about to withdraw ${formatCurrency(Math.round(parseFloat(amount) * 100), selectedMethod?.currency ?? 'BDT')}. This amount will be held in escrow until approved. Do you want to proceed?`
            : locale === 'bn' ? 'অনুগ্রহ করে একটি পরিমাণ লিখুন।' : 'Please enter an amount.'
        }
        confirmText={locale === 'bn' ? 'উত্তোলন নিশ্চিত করুন' : 'Confirm Withdrawal'}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={withdrawMutation.isPending}
      />
    </PageContainer>
  );
}
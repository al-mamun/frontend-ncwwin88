/**
 * Withdraw page — player initiates a withdrawal request.
 * Uses real backend API: wallet, payment-methods, payment-accounts, withdrawals.
 * Backend atomically freezes (escrows) funds — client never fakes balances.
 */
'use client';



import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpFromLine } from 'lucide-react';
import {
  useWallet,
  usePaymentMethods,
  useCreateWithdrawal,
  useProfile,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState, ConfirmDialog } from '@/components/shared';
import { PhoneVerifyCard } from '@/components/player/phone-verify';
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

// Convert digits to Bengali numerals
function toBengaliNumerals(num: string | number): string {
  const digitsMap: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    '.': '.',
  };
  return String(num).split('').map(char => digitsMap[char] || char).join('');
}

const QUICK_AMOUNTS = [300, 1000, 2000, 5000, 10000, 15000, 20000, 25000];

export default function WithdrawPage() {
  const router = useRouter();
  const { locale } = useI18n();

  // Data queries
  const { data: wallet, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } = useWallet();
  const { data: profile } = useProfile();
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
  
  // Custom number input active state
  const [useCustomNumber, setUseCustomNumber] = useState(false);
  const [customNumberInput, setCustomNumberInput] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [successResponse, setSuccessResponse] = useState<WithdrawalRequestResponse | null>(null);

  const withdrawMutation = useCreateWithdrawal();

  const selectedMethod = useMemo(
    () => methods?.find((m) => m.id === selectedMethodId) ?? null,
    [methods, selectedMethodId],
  );

  // Auto-select first method
  useEffect(() => {
    if (methods && methods.length > 0) {
      setSelectedMethodId(methods[0].id);
    }
  }, [methods]);

  // Set default selected phone number from profile
  useEffect(() => {
    if (profile?.phone && !useCustomNumber) {
      setAccountNumber(profile.phone);
    }
  }, [profile, useCustomNumber]);

  const availableBalance = wallet ? wallet.balanceMinor - wallet.heldMinor : 0;
  const availableBalanceMain = (availableBalance / 100).toFixed(2);

  // Validation
  const amountError = useMemo(() => {
    if (!amount) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 'একটি বৈধ পরিমাণ লিখুন';
    const minor = Math.round(parsed * 100);
    if (wallet && minor > availableBalance)
      return `পর্যাপ্ত ব্যালেন্স নেই (${toBengaliNumerals(availableBalanceMain)} BDT)`;
    if (selectedMethod) {
      if (minor < selectedMethod.minWithdrawalMinor)
        return `সর্বনিম্ন ৳${toBengaliNumerals(selectedMethod.minWithdrawalMinor / 100)}`;
      if (minor > selectedMethod.maxWithdrawalMinor)
        return `সর্বোচ্চ ৳${toBengaliNumerals(selectedMethod.maxWithdrawalMinor / 100)}`;
    }
    return null;
  }, [amount, wallet, selectedMethod, availableBalance, availableBalanceMain]);

  const resolvedAccountNumber = useCustomNumber ? customNumberInput.trim() : accountNumber;

  const canSubmit =
    selectedMethodId &&
    amount &&
    !amountError &&
    resolvedAccountNumber.trim() &&
    !withdrawMutation.isPending;

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
          accountNumber: resolvedAccountNumber,
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
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> পিছনে
          </button>
        </div>
        <RequestSuccess
          title="উত্তোলনের অনুরোধ সফলভাবে জমা হয়েছে!"
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
        <LoadingState message="উত্তোলনের বিকল্পগুলি লোড হচ্ছে…" />
      </PageContainer>
    );
  }

  // Error state
  if (walletError || !wallet || methodsError || !methods) {
    const errorDetails = walletError
      ? `Wallet: ${(walletError as any) instanceof ApiRequestError ? (walletError as any).message : 'Connection failed'}`
      : methodsError
      ? `Methods: ${(methodsError as any) instanceof ApiRequestError ? (methodsError as any).message : 'Connection failed'}`
      : null;

    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> ওয়ালেটে ফিরে যান
          </button>
        </div>
        <ErrorState message="উত্তোলনের তথ্য লোড করা যায়নি।" />
        {errorDetails && (
          <p className="text-center text-xs text-rose-500 font-bold max-w-md mx-auto -mt-6 mb-6">
            Error Details: {errorDetails}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => refetchWallet()}>ওয়ালেট আবার চেষ্টা করুন</Button>
          <Button variant="secondary" onClick={() => refetchMethods()}>পদ্ধতি আবার চেষ্টা করুন</Button>
        </div>
      </PageContainer>
    );
  }

  // Empty state — no withdrawal methods
  if (methods.length === 0) {
    return (
      <PageContainer>
        <div className="mb-4">
          <button
            onClick={() => router.push('/player/wallet')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> ওয়ালেটে ফিরে যান
          </button>
        </div>
        <EmptyState message="বর্তমানে কোনো উত্তোলন পদ্ধতি উপলব্ধ নেই। অনুগ্রহ করে পরে আবার দেখুন।" />
      </PageContainer>
    );
  }

  const minVal = selectedMethod ? selectedMethod.minWithdrawalMinor / 100 : 300;
  const maxVal = selectedMethod ? selectedMethod.maxWithdrawalMinor / 100 : 25000;

  if (profile?.requirePhoneVerification && !profile?.isPhoneVerified) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-xl pt-6">
          <PhoneVerifyCard context="withdraw" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Tabbed Header: Deposit / Withdraw */}
      <div className="mb-6 border-b border-[#1d1f24] flex justify-center">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/player/deposit')}
            className="px-4 py-2.5 text-sm font-bold uppercase text-gray-400 hover:text-white transition-colors"
          >
            ডিপোজিট (Deposit)
          </button>
          <button
            type="button"
            className="border-b-2 border-[var(--brand)] px-4 py-2.5 text-sm font-extrabold uppercase text-[var(--brand)]"
          >
            উইথড্র (Withdraw)
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Balance Display */}
        <div className="bg-[#1a1b1e] border border-[#2d3035] rounded-2xl p-5 text-center relative overflow-hidden">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">মেইন ওয়ালেট</span>
          <span className="block text-4xl font-extrabold text-white mt-1 font-mono">
            {toBengaliNumerals(availableBalanceMain)}
          </span>
          <span className="absolute right-4 bottom-4 text-xs font-bold text-gray-600">BDT</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Payment Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">। পেমেন্ট পদ্ধতি</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {methods.map((method) => {
                const active = selectedMethodId === method.id;
                
                const isbKash = method.name.toLowerCase().includes('bkash');
                const isNagad = method.name.toLowerCase().includes('nagad');
                const isRocket = method.name.toLowerCase().includes('rocket');
                const isUpay = method.name.toLowerCase().includes('upay');
                
                const logo = method.iconUrl || (isbKash ? '/assets/logo-bkash.png' : isNagad ? '/assets/nagad_logo.png' : isRocket ? '/assets/rocket_logo.png' : isUpay ? '/assets/upay.webp' : null);
                
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethodId(method.id);
                      setAmount('');
                    }}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all h-[80px]',
                      active
                        ? 'border-[var(--brand)] bg-[#202124] shadow-lg shadow-[var(--brand)]/5 text-[var(--brand)]'
                        : 'border-[#2d3035] bg-[#1a1b1e] text-gray-400 hover:border-gray-600 hover:text-white',
                    )}
                  >
                    {logo ? (
                      <img src={logo} alt={method.name} className="max-h-8 w-auto object-contain" />
                    ) : (
                      <span className="text-sm font-bold tracking-wide">{method.name}</span>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1 font-bold">{method.name}</span>
                    {active && <span className="absolute bottom-1 right-2 text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Amount Option Grid */}
          {selectedMethod && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">। এমাউন্ট</h3>
              
              {/* Target limit range in Bengali */}
              <div className="text-right text-xs text-gray-500 font-mono">
                সীমা: ৳{toBengaliNumerals(minVal)} - ৳{toBengaliNumerals(maxVal)}
              </div>

              {/* Quick buttons */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.filter(val => val >= minVal && val <= maxVal).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(String(val))}
                    className={cn(
                      'rounded border py-2 text-xs font-bold transition-all',
                      amount === String(val)
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                        : 'border-[#2d3035] bg-[#1a1b1e] text-gray-300 hover:border-gray-600'
                    )}
                  >
                    {toBengaliNumerals(val)}
                  </button>
                ))}
              </div>

              {/* Exact amount input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#2d3035] bg-[#1a1b1e] py-3 pl-8 pr-12 text-sm font-bold text-white focus:border-[var(--brand)] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">BDT</span>
              </div>
              {amountError && <p className="text-xs text-rose-500 font-bold">{amountError}</p>}
            </div>
          )}

          {/* Step 3: Select Phone Number (ফোন নম্বর নির্বাচন করুন) */}
          {selectedMethod && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">। ফোন নম্বর নির্বাচন করুন</h3>
              <div className="space-y-2">
                {/* Profile number option */}
                {profile?.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomNumber(false);
                      setAccountNumber(profile.phone || '');
                    }}
                    className={cn(
                      'w-full text-left rounded-xl p-4 font-mono font-bold text-base transition-all border',
                      !useCustomNumber
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                        : 'border-[#2d3035] bg-[#1a1b1e] text-white hover:border-gray-600'
                    )}
                  >
                    {profile.phone}
                  </button>
                )}

                {/* Custom number option */}
                <button
                  type="button"
                  onClick={() => setUseCustomNumber(true)}
                  className={cn(
                    'w-full text-left rounded-xl p-4 font-bold text-sm transition-all border',
                    useCustomNumber
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                      : 'border-[#2d3035] bg-[#1a1b1e] text-white hover:border-gray-600'
                  )}
                >
                  অন্য নম্বর ব্যবহার করুন (Use another number)
                </button>
              </div>

              {/* Show custom number input field if selected or if profile has no number */}
              {(useCustomNumber || !profile?.phone) && (
                <div className="pt-2">
                  <input
                    type="tel"
                    placeholder="নম্বর লিখুন (e.g. 017XXXXXXXX)"
                    value={customNumberInput}
                    onChange={(e) => setCustomNumberInput(e.target.value)}
                    className="w-full rounded-lg border border-[#2d3035] bg-[#1a1b1e] py-3 px-4 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-[10px] text-gray-500 font-bold">
                    যে bKash/Nagad/Rocket অ্যাকাউন্টে টাকা তুলতে চান সেটি লিখুন।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          {selectedMethod && (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-sm uppercase rounded-xl tracking-wider shadow-lg active:scale-95 transition-all border-none"
            >
              {withdrawMutation.isPending ? 'প্রক্রিয়াকরণ হচ্ছে…' : 'সাবমিট'}
            </Button>
          )}
        </form>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="উত্তোলন নিশ্চিত করুন"
        message={
          amount
            ? `আপনি ${toBengaliNumerals(amount)} BDT উত্তোলন করতে যাচ্ছেন। অনুমোদন না হওয়া পর্যন্ত এই পরিমাণ এসক্রোতে আটকে রাখা হবে। আপনি কি এগিয়ে যেতে চান?`
            : 'অনুগ্রহ করে উত্তোলনের পরিমাণ লিখুন।'
        }
        confirmText="উত্তোলন নিশ্চিত করুন"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={withdrawMutation.isPending}
      />
    </PageContainer>
  );
}
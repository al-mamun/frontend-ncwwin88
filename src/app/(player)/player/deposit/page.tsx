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
  CopyButton,
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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  // Flow control: false = Form stage (Screenshot 2), true = Verification stage (Screenshot 1)
  const [showVerification, setShowVerification] = useState(false);
  const [verificationTimeRemaining, setVerificationTimeRemaining] = useState(1200); // 20 minutes countdown
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

  const selectedMethod = useMemo(
    () => methods?.find((m) => m.id === selectedMethodId) ?? null,
    [methods, selectedMethodId],
  );

  const selectedAccount = useMemo(
    () => accounts?.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const isMobileMoney = useMemo(() => {
    if (!selectedMethod) return false;
    const name = selectedMethod.name.toLowerCase();
    return name.includes('bkash') || name.includes('nagad') || name.includes('rocket') || name.includes('upay');
  }, [selectedMethod]);

  // Auto-select first account when method changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  // Countdown timer for verification screen
  useEffect(() => {
    if (!showVerification || successResponse) return;
    const timer = setInterval(() => {
      setVerificationTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowVerification(false);
          return 1200;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showVerification, successResponse]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currency = selectedMethod?.currency ?? 'BDT';
  const minMinor = selectedAccount?.minLimitMinor ?? selectedMethod?.minDepositMinor ?? 10000;
  const maxMinor = selectedAccount?.maxLimitMinor ?? 5000000;

  // Validation
  const amountError = useMemo(() => {
    if (!amount) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 'Enter a valid amount';
    const minor = Math.round(parsed * 100);
    if (minMinor > 0 && minor < minMinor) return `Minimum BDT ${minMinor / 100}`;
    if (maxMinor > 0 && minor > maxMinor) return `Maximum BDT ${maxMinor / 100}`;
    return null;
  }, [amount, minMinor, maxMinor]);

  const canProceedToVerify =
    selectedMethodId &&
    selectedAccountId &&
    amount &&
    !amountError &&
    senderAccountNumber.trim();

  const canSubmitDeposit =
    canProceedToVerify &&
    transactionReference.trim() &&
    !proofUploading &&
    !depositMutation.isPending;

  function selectMethod(id: string) {
    setSelectedMethodId(id);
    setSelectedAccountId(null);
    setAmount('');
  }

  async function handleVerificationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitDeposit || !selectedMethod) return;

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
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <RequestSuccess
          title="ডিপোজিট সফলভাবে জমা হয়েছে!"
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
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
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
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
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
      {/* Tabbed Header: Deposit / Withdraw */}
      <div className="mb-6 border-b border-[#1d1f24] flex justify-center">
        <div className="flex gap-4">
          <button
            type="button"
            className="border-b-2 border-[var(--brand)] px-4 py-2.5 text-sm font-extrabold uppercase text-[var(--brand)]"
          >
            ডিপোজিট (Deposit)
          </button>
          <button
            type="button"
            onClick={() => router.push('/player/withdraw')}
            className="px-4 py-2.5 text-sm font-bold uppercase text-gray-400 hover:text-white transition-colors"
          >
            উইথড্র (Withdraw)
          </button>
        </div>
      </div>

      <DepositStatusTracker />

      {!showVerification ? (
        /* ─── STAGE 1: DEPOSIT METHOD & AMOUNT FORM (Screenshot 2) ─── */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Orange promo banner */}
          <div className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 px-4 py-2.5 text-xs font-black text-black flex items-center justify-between shadow-md">
            <span>● প্রচার নির্বাচন করুন ৫% আনলিমিটেড ডিপোজিট বোনাস</span>
            <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">Active</span>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">১. পেমেন্ট পদ্ধতি (Select Gateway)</h3>
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
                    onClick={() => selectMethod(method.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all h-[80px]',
                      active
                        ? 'border-[var(--brand)] bg-[#202124] shadow-lg shadow-[var(--brand)]/5'
                        : 'border-[#2d3035] bg-[#1a1b1e] hover:border-gray-600',
                    )}
                  >
                    <span className="absolute top-1 right-1 bg-rose-600 text-white font-black text-[7px] px-1 py-0.5 rounded tracking-wide">+PRIZE</span>
                    {logo ? (
                      <img src={logo} alt={method.name} className="max-h-8 w-auto object-contain" />
                    ) : (
                      <span className="font-bold text-xs">{method.name}</span>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1 font-bold">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels Selector */}
          {selectedMethodId && accounts && accounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">২. ডিপোজিট চ্যানেল (Select Channel)</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {accounts.map((acct) => {
                  const active = selectedAccountId === acct.id;
                  const label = acct.displayName || `${acct.accountType === 'agent' ? 'AP-ক্যাশ আউট' : 'SP-সেন্ড মানি'}`;
                  return (
                    <button
                      key={acct.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acct.id)}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-bold text-center transition-colors',
                        active
                          ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                          : 'border-[#2d3035] bg-[#1a1b1e] hover:border-gray-600 text-gray-300'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Options & Input */}
          {selectedAccountId && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">৩. এমাউন্ট (Select/Enter Amount)</h3>
              
              {/* Target limit range */}
              <div className="text-right text-xs text-gray-500 font-mono">
                সীমা: ৳{(minMinor / 100).toLocaleString()} - ৳{(maxMinor / 100).toLocaleString()}
              </div>

              {/* Quick buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[2000, 5000, 10000, 15000, 20000, 30000, 1000, 100].map((val) => (
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
                    {val.toLocaleString('bn-BD')}
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">BDT</span>
              </div>
              {amountError && <p className="text-xs text-rose-500 font-bold">{amountError}</p>}

              {/* Sender Account Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">পেমেন্ট পাঠানোর জন্য ব্যবহৃত নম্বর (Your Phone Number) <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={senderAccountNumber}
                  onChange={(e) => setSenderAccountNumber(e.target.value)}
                  className="w-full rounded-lg border border-[#2d3035] bg-[#1a1b1e] py-3 px-4 text-sm font-semibold text-white focus:border-[var(--brand)] focus:outline-none"
                  required
                />
              </div>

              {/* Optional note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">নোট (Optional Note)</label>
                <input
                  type="text"
                  placeholder="নোট লিখুন"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-[#2d3035] bg-[#1a1b1e] py-3 px-4 text-sm font-semibold text-white focus:border-[var(--brand)] focus:outline-none"
                />
              </div>

              {/* Guidelines Box */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-[11px] leading-relaxed text-gray-400 space-y-2">
                <p className="font-extrabold text-amber-400">⚠️ নির্দেশাবলী (Important Guidelines):</p>
                <ol className="list-decimal space-y-1.5 pl-4 font-medium">
                  <li>ক্যাশ আউট বা সেন্ডমানি করার আগে &apos;ব্যক্তিগত তথ্য&apos; অংশে সর্বোচ্চ ৫টি মোবাইল নম্বর যোগ করে ভেরিফাই করুন।</li>
                  <li>অনুগ্রহ করে পেমেন্ট পাঠানোর জন্য ব্যবহৃত নম্বরটি নির্বাচন করুন, আপনার ট্রানজেকশন আইডি প্রবেশ করান এবং সাবমিট করুন। ভুল নম্বর নির্বাচন করলে যাচাইকরণ ব্যর্থ হবে।</li>
                  <li>যেকোনো ডিপোজিট করার আগে সবসময় আমাদের ডিপোজিট পেজের নাম্বার চেক করুন।</li>
                  <li>ডিপোজিট পেন্ডিং অবস্থায় আপনি সর্বোচ্চ ২টি ডিপোজিট ট্রাই করতে পারবেন। কোনো সমস্যা হলে অনুগ্রহ করে লাইভচ্যাটের মাধ্যমে সহায়তা নিন।</li>
                  <li>বাজির ODDS অবশ্যই ১.৩০-এর উপরে হতে হবে। এর নিচের অডসে এ রাখা বাজি উইথড্র টার্নওভারের জন্য গণনা করা হবে না।</li>
                </ol>
              </div>

              {/* Proceed to Verification Button */}
              <Button
                type="button"
                disabled={!canProceedToVerify}
                onClick={() => {
                  setVerificationTimeRemaining(1200);
                  setShowVerification(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-sm uppercase rounded-xl tracking-wider shadow-lg active:scale-95 transition-all"
              >
                সাবমিট (Submit)
              </Button>
            </div>
          )}
        </div>
      ) : isMobileMoney ? (
        /* ─── STAGE 2: MOBILE MONEY TRANSACTION VERIFICATION SCREEN (bKash/Nagad/Rocket/UPay) ─── */
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Side Form Column */}
          <div className="md:col-span-7 bg-[#1a1b1e] border border-[#2d3035] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d3035]">
              <span className="text-sm font-extrabold uppercase text-[var(--brand)]">টাকা পাঠানোর নির্দেশাবলী</span>
              {selectedMethod && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 capitalize">{selectedMethod.name}</span>
                  {(selectedMethod.iconUrl || 
                    (selectedMethod.name.toLowerCase().includes('bkash') ||
                     selectedMethod.name.toLowerCase().includes('nagad') ||
                     selectedMethod.name.toLowerCase().includes('rocket') ||
                     selectedMethod.name.toLowerCase().includes('upay'))) && (
                    <img 
                      src={selectedMethod.iconUrl || 
                           (selectedMethod.name.toLowerCase().includes('bkash') ? '/assets/logo-bkash.png' :
                            selectedMethod.name.toLowerCase().includes('nagad') ? '/assets/nagad_logo.png' :
                            selectedMethod.name.toLowerCase().includes('rocket') ? '/assets/rocket_logo.png' :
                            '/assets/upay.webp')} 
                      alt={selectedMethod.name} 
                      className="h-6 w-auto object-contain" 
                    />
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              Send Money to the account below and fill in the required information / নীচের অ্যাকাউন্ট নাম্বারে সেন্ড মানি করুন এবং প্রয়োজনীয় তথ্য পূরণ করুন
            </p>

            {/* Amount display */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase">Amount (পরিমাণ)</label>
              <div className="flex items-center justify-between bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5">
                <span className="font-mono text-base font-extrabold text-white">{parseFloat(amount).toFixed(2)} BDT</span>
                <CopyButton value={amount} label="কপি" className="border-none bg-[#32353b] hover:bg-[#40434b] text-gray-300" />
              </div>
            </div>

            {/* Target wallet number */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase">
                {selectedMethod?.name || 'Mobile'} Personal Wallet (বিকাশ পার্সোনাল ওয়ালেট)
              </label>
              <div className="flex items-center justify-between bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5">
                <span className="font-mono text-sm font-extrabold text-white">{selectedAccount?.accountNumberMasked || '01XXXXXXXXX'}</span>
                <CopyButton value={selectedAccount?.accountNumberMasked || ''} label="কপি" className="border-none bg-[#32353b] hover:bg-[#40434b] text-gray-300" />
              </div>
              <p className="text-[10px] text-gray-500 font-bold">ছোট্ট এজেন্ট নম্বরটি কপি করতে কপি বাটনে ক্লিক করুন।</p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              {/* Transaction ID Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  Transaction ID (ট্রানজেকশন আইডি) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="উদাহরণ: ODM2JXXXXX"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full rounded-lg border border-[#2d3035] bg-black/40 py-3 px-4 text-sm font-mono text-white focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-help" title="Transaction ID is available in your SMS confirmation or statements.">❓</span>
                </div>
                {!transactionReference.trim() && (
                  <p className="text-[10px] text-rose-500 font-bold">Transaction reference is required</p>
                )}
              </div>

              {/* Upload Proof */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400">ডিপোজিট প্রমাণ ফাইল (Upload Proof - Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-gray-400 file:mr-3 file:rounded-md file:border-none file:bg-[#32353b] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#40434b]"
                />
                {proofUploading && <p className="text-[10px] text-amber-500 animate-pulse">Uploading proof image...</p>}
                {uploadErr && <p className="text-[10px] text-rose-500">{uploadErr}</p>}
              </div>

              {depositMutation.isError && (
                <p className="text-xs text-rose-500 font-bold">
                  {depositMutation.error instanceof ApiRequestError ? depositMutation.error.message : 'Error submitting deposit.'}
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="w-full py-3 bg-[#32353b] hover:bg-[#40434b] text-white font-bold text-xs uppercase rounded-lg transition-all"
                >
                  ফিরে যান (Back)
                </button>
                <Button
                  type="submit"
                  disabled={!canSubmitDeposit || depositMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-extrabold text-xs uppercase rounded-lg shadow-lg active:scale-95 transition-all border-none"
                >
                  {depositMutation.isPending ? 'জমা হচ্ছে…' : 'সাবমিট করুন'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Side Info Column (Countdown & Illustration) */}
          <div className="md:col-span-5 space-y-6">
            {/* Time remaining countdown banner */}
            <div className="bg-rose-950/40 border border-rose-500/20 rounded-2xl p-5 text-center space-y-1 shadow-md">
              <span className="block text-2xl font-mono font-extrabold text-rose-500 tracking-wider">
                {formatTimer(verificationTimeRemaining)}
              </span>
              <span className="block text-xs font-bold text-gray-400">Time Remaining</span>
              <span className="block text-[10px] text-rose-400 font-bold">(এই সময়ের মধ্যে সম্পন্ন করুন)</span>
            </div>

            {/* Explanatory illustration graphic */}
            <div className="bg-[#1a1b1e] border border-[#2d3035] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-full max-w-[200px] aspect-[9/16] bg-gradient-to-b from-pink-600 to-pink-800 rounded-3xl border-4 border-zinc-800 shadow-xl overflow-hidden flex flex-col items-center p-4">
                <div className="w-12 h-4 bg-zinc-800 rounded-b-xl absolute top-0" />
                <div className="mt-8 flex flex-col items-center space-y-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-700 font-black text-xl">৳</div>
                  <span className="text-white font-extrabold text-xs">Send Money</span>
                  <div className="w-full bg-white/10 rounded-lg p-2 text-center text-[8px] text-white/80 font-bold border border-white/10">
                    Enter Name or Number
                  </div>
                  <div className="w-full bg-white/20 rounded-lg py-2.5 text-center text-[9px] text-white font-black animate-pulse">
                    Tap & Hold to Send
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase">{selectedMethod?.name || 'Mobile'} অ্যাপ দিয়ে টাকা পাঠান</h4>
                <p className="text-[10px] text-gray-500 font-medium">আপনার পেমেন্ট অ্যাপ ব্যবহার করে উপরের পার্সোনাল নম্বরে টাকা পাঠান এবং লেনদেনের শেষে প্রাপ্ত ট্রানজেকশন আইডিটি ফর্মে লিখুন।</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ─── STAGE 2: STANDARD TRANSACTION VERIFICATION SCREEN (Bank/Crypto/Other) ─── */
        <div className="max-w-2xl mx-auto bg-[#1a1b1e] border border-[#2d3035] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#2d3035]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Payment Details</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--brand)]/20 text-[var(--brand)] capitalize">
                {selectedMethod?.name}
              </span>
            </h2>
            {selectedMethod?.iconUrl && (
              <img src={selectedMethod.iconUrl} alt={selectedMethod.name} className="h-6 w-auto object-contain" />
            )}
          </div>

          <p className="text-sm text-gray-400">
            Please make your transfer to the destination account below, then input your transaction reference/ID to complete the deposit.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-gray-500 uppercase">Amount</span>
              <div className="bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="font-mono text-base font-extrabold text-white">
                  {parseFloat(amount).toLocaleString()} {currency}
                </span>
                <CopyButton value={amount} label="Copy" className="border-none bg-[#32353b] hover:bg-[#40434b] text-gray-300" />
              </div>
            </div>

            {/* Target Address/Account */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-gray-500 uppercase">
                {selectedMethod?.name.toLowerCase().includes('usdt') ? 'Wallet Address' : 'Account Number'}
              </span>
              <div className="bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-white break-all pr-2">
                  {selectedAccount?.accountNumberMasked}
                </span>
                <CopyButton value={selectedAccount?.accountNumberMasked || ''} label="Copy" className="border-none bg-[#32353b] hover:bg-[#40434b] text-gray-300" />
              </div>
            </div>

            {/* Account Holder Name */}
            {selectedAccount?.accountHolderName && (
              <div className="space-y-1">
                <span className="block text-[11px] font-bold text-gray-500 uppercase">Account Holder</span>
                <div className="bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5">
                  <span className="text-sm font-semibold text-white">{selectedAccount.accountHolderName}</span>
                </div>
              </div>
            )}

            {/* Account Display Name / Type */}
            {selectedAccount?.displayName && (
              <div className="space-y-1">
                <span className="block text-[11px] font-bold text-gray-500 uppercase">Account Label</span>
                <div className="bg-black/40 border border-[#2d3035] rounded-lg px-4 py-2.5">
                  <span className="text-sm font-semibold text-white">{selectedAccount.displayName}</span>
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          {selectedAccount?.qrCodeUrl && (
            <div className="flex flex-col items-center justify-center border border-[#2d3035] bg-black/20 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-gray-400">Scan QR Code to Pay</span>
              <img src={selectedAccount.qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-lg border border-white/10 bg-white p-2" />
            </div>
          )}

          {/* Instructions */}
          {selectedAccount?.instructions && (
            <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4">
              <span className="block text-xs font-bold text-amber-400 mb-1">Instructions:</span>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedAccount.instructions}</p>
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="space-y-4 pt-2 border-t border-[#2d3035]">
            {/* Transaction ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Transaction ID / Hash / Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter transaction reference"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full rounded-lg border border-[#2d3035] bg-black/40 py-3 px-4 text-sm font-semibold text-white focus:border-[var(--brand)] focus:outline-none"
                required
              />
            </div>

            {/* Upload Proof */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">Upload Receipt / Proof (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-gray-400 file:mr-3 file:rounded-md file:border-none file:bg-[#32353b] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#40434b]"
              />
              {proofUploading && <p className="text-[10px] text-amber-500 animate-pulse">Uploading proof image...</p>}
              {uploadErr && <p className="text-[10px] text-rose-500">{uploadErr}</p>}
            </div>

            {depositMutation.isError && (
              <p className="text-xs text-rose-500 font-bold">
                {depositMutation.error instanceof ApiRequestError ? depositMutation.error.message : 'Error submitting deposit.'}
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="w-full py-3 bg-[#32353b] hover:bg-[#40434b] text-white font-bold text-xs uppercase rounded-lg transition-all"
              >
                Back
              </button>
              <Button
                type="submit"
                disabled={!canSubmitDeposit || depositMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-xs uppercase rounded-lg shadow-lg active:scale-95 transition-all border-none"
              >
                {depositMutation.isPending ? 'Submitting…' : 'Submit Deposit'}
              </Button>
            </div>
          </form>
        </div>
      )}
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

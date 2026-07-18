/**
 * Deposit page — player initiates a deposit request.
 * Uses real backend API: payment-methods, payment-accounts, deposits.
 *
 * DESIGN: "My wallet" card layout (gold header + Deposit/Withdrawal tabs,
 * Promotions, Payment Method grid, Deposit Channel, Deposit Amount presets,
 * Gentle reminder). COLOURS follow each brand's theme tokens (brand / gold-soft /
 * surface / elevated / border / muted) so the same structure wears every site's
 * own colours. All data wiring (methods, accounts, limits, createDeposit,
 * transaction reference, status tracker) is unchanged from the previous version.
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, X, ChevronDown } from 'lucide-react';
import {
  usePaymentMethods,
  usePaymentAccounts,
  useCreateDeposit,
  usePlayerDeposits,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState } from '@/components/shared';
import { RequestSuccess, CopyButton } from '@/components/shared/payment-components';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/api';
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

// Preset deposit amounts (clamped to the selected method/account limits below).
const AMOUNT_PRESETS = [200, 500, 1000, 5000, 10000, 15000, 20000, 25000, 30000];

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
  const [transactionReference, setTransactionReference] = useState('');
  const [successResponse, setSuccessResponse] = useState<DepositRequestResponse | null>(null);

  // Load accounts for the selected method
  const { data: accounts } = usePaymentAccounts({
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

  // Group accounts into Deposit Channels by TYPE — agent = Cash Out, everything
  // else = Send Money. Only ONE chip per channel type is shown. When a type has
  // several account numbers, one is picked AT RANDOM per page load, so traffic
  // rotates across them; the pick is stable for the session and re-rolls on reload.
  const channels = useMemo(() => {
    type Acct = NonNullable<typeof accounts>[number];
    const groups: Record<'cashout' | 'sendmoney', Acct[]> = { cashout: [], sendmoney: [] };
    for (const a of accounts ?? []) {
      (a.accountType === 'agent' ? groups.cashout : groups.sendmoney).push(a);
    }
    const out: Array<{ type: 'cashout' | 'sendmoney'; label: string; account: Acct }> = [];
    (['cashout', 'sendmoney'] as const).forEach((k) => {
      if (groups[k].length > 0) {
        const account = groups[k][Math.floor(Math.random() * groups[k].length)];
        out.push({ type: k, label: k === 'cashout' ? 'ক্যাশ আউট' : 'সেন্ড মানি', account });
      }
    });
    return out;
  }, [accounts]);

  // Auto-select the first channel's (randomly-picked) account when it changes.
  useEffect(() => {
    if (channels.length > 0) {
      setSelectedAccountId(channels[0].account.id);
    }
  }, [channels]);

  const minMinor = selectedAccount?.minLimitMinor ?? selectedMethod?.minDepositMinor ?? 10000;
  const maxMinor = selectedAccount?.maxLimitMinor ?? 5000000;

  // Validation
  const amountError = useMemo(() => {
    if (!amount) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 'একটি বৈধ পরিমাণ লিখুন';
    const minor = Math.round(parsed * 100);
    if (minMinor > 0 && minor < minMinor) return `সর্বনিম্ন ৳${(minMinor / 100).toLocaleString()}`;
    if (maxMinor > 0 && minor > maxMinor) return `সর্বোচ্চ ৳${(maxMinor / 100).toLocaleString()}`;
    return null;
  }, [amount, minMinor, maxMinor]);

  const canSubmitDeposit = useMemo(() => {
    return (
      selectedMethodId &&
      selectedAccountId &&
      amount &&
      !amountError &&
      transactionReference.trim() &&
      !depositMutation.isPending
    );
  }, [selectedMethodId, selectedAccountId, amount, amountError, transactionReference, depositMutation.isPending]);

  function selectMethod(id: string) {
    setSelectedMethodId(id);
    setSelectedAccountId(null);
    setAmount('');
    setTransactionReference('');
  }

  async function handleVerificationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitDeposit || !selectedMethod) return;

    const minor = Math.round(parseFloat(amount) * 100);
    depositMutation.mutate(
      {
        input: {
          paymentMethodId: selectedMethodId!,
          paymentAccountId: selectedAccountId!,
          amount: minor,
          currency: selectedMethod.currency,
          transactionReference: transactionReference.trim(),
          senderAccountNumber: '',
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
        <WalletCard active="deposit" onClose={() => router.push('/player/wallet')} onWithdraw={() => router.push('/player/withdraw')}>
          <div className="p-4">
            <RequestSuccess
              title="ডিপোজিট সফলভাবে জমা হয়েছে!"
              response={successResponse}
              type="deposit"
              onDone={() => router.push('/player/wallet')}
            />
          </div>
        </WalletCard>
      </PageContainer>
    );
  }

  // Loading state
  if (methodsLoading) {
    return (
      <PageContainer>
        <WalletCard active="deposit" onClose={() => router.push('/player/wallet')} onWithdraw={() => router.push('/player/withdraw')}>
          <div className="p-6"><LoadingState message="ডিপোজিট পদ্ধতি লোড হচ্ছে…" /></div>
        </WalletCard>
      </PageContainer>
    );
  }

  // Error state
  if (methodsError || !methods) {
    return (
      <PageContainer>
        <WalletCard active="deposit" onClose={() => router.push('/player/wallet')} onWithdraw={() => router.push('/player/withdraw')}>
          <div className="p-6">
            <ErrorState message="পেমেন্ট পদ্ধতি লোড করা যায়নি।" />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => refetchMethods()}>{t('deposit.retry')}</Button>
            </div>
          </div>
        </WalletCard>
      </PageContainer>
    );
  }

  // Empty state
  if (methods.length === 0) {
    return (
      <PageContainer>
        <WalletCard active="deposit" onClose={() => router.push('/player/wallet')} onWithdraw={() => router.push('/player/withdraw')}>
          <div className="p-6"><EmptyState message="বর্তমানে কোনো ডিপোজিট পদ্ধতি উপলব্ধ নেই। অনুগ্রহ করে পরে আবার দেখুন।" /></div>
        </WalletCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <WalletCard active="deposit" onClose={() => router.push('/player/wallet')} onWithdraw={() => router.push('/player/withdraw')}>
        <div className="space-y-4 p-3 sm:p-4">
          <DepositStatusTracker />

          {/* Promotions */}
          <Panel title="Promotions">
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-border bg-base px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                defaultValue="regular"
              >
                <option value="regular">Regular Deposit</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </Panel>

          {/* Payment Method */}
          <Panel title="Payment Method">
            <div className="grid grid-cols-3 gap-2.5">
              {methods.map((method) => {
                const active = selectedMethodId === method.id;
                const name = method.name.toLowerCase();
                const logo =
                  method.iconUrl ||
                  (name.includes('bkash') ? '/assets/logo-bkash.png'
                    : name.includes('nagad') ? '/assets/nagad_logo.png'
                    : name.includes('rocket') ? '/assets/rocket_logo.png'
                    : name.includes('upay') ? '/assets/upay.webp'
                    : null);
                const bonus = (method as { bonusPercent?: number; depositBonusPercent?: number }).bonusPercent
                  ?? (method as { depositBonusPercent?: number }).depositBonusPercent ?? 0;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => selectMethod(method.id)}
                    className={cn(
                      'relative flex h-[78px] flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all',
                      active
                        ? 'border-[var(--brand)] bg-elevated shadow-md'
                        : 'border-border bg-base hover:border-[var(--brand)]/60',
                    )}
                  >
                    {bonus > 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black leading-none text-[var(--text-primary)]">
                        +{bonus}%
                      </span>
                    )}
                    {logo ? (
                      <img src={logo} alt={method.name} className="max-h-7 w-auto object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--text-primary)]">{method.name}</span>
                    )}
                    <span className="text-[10px] font-bold text-muted">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Deposit Channel — one chip per TYPE (Cash Out / Send Money) */}
          {selectedMethodId && channels.length > 0 && (
            <Panel title="Deposit Channel">
              <div className="grid grid-cols-2 gap-2.5">
                {channels.map((ch) => {
                  const active = selectedAccountId === ch.account.id;
                  return (
                    <button
                      key={ch.type}
                      type="button"
                      onClick={() => setSelectedAccountId(ch.account.id)}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-sm font-bold transition-all',
                        active
                          ? 'border-[var(--brand)] bg-elevated text-[var(--brand)] shadow-md'
                          : 'border-border bg-base text-[var(--text-primary)] hover:border-[var(--brand)]/60',
                      )}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>

              {/* Selected channel's number to send money to */}
              {selectedAccount && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-base px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      {selectedAccount.accountType === 'agent' ? 'ক্যাশ আউট নম্বর' : 'সেন্ড মানি নম্বর'}
                    </div>
                    <div className="truncate font-mono text-base font-extrabold text-[var(--text-primary)]">
                      {selectedAccount.accountNumberMasked}
                    </div>
                  </div>
                  <CopyButton
                    value={selectedAccount.accountNumberMasked}
                    label="Copy"
                    className="flex items-center gap-1 rounded-md border-none bg-elevated px-3 py-1.5 text-[10px] font-bold uppercase text-[var(--text-primary)] transition-all hover:opacity-90"
                  />
                </div>
              )}
            </Panel>
          )}

          {/* Deposit Amount + Transaction + Submit */}
          {selectedAccountId && (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <Panel
                title="Deposit Amount"
                right={
                  <span className="font-mono text-xs text-muted">
                    ৳{(minMinor / 100).toLocaleString()} - ৳{(maxMinor / 100).toLocaleString()}
                  </span>
                }
              >
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNT_PRESETS.filter((v) => v * 100 >= minMinor && v * 100 <= maxMinor).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-bold transition-all',
                        amount === String(val)
                          ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                          : 'border-border bg-base text-[var(--text-primary)] hover:border-[var(--brand)]/60',
                      )}
                    >
                      {val.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="relative mt-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">৳</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-border bg-base py-3 pl-8 pr-12 text-sm font-bold text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">BDT</span>
                </div>
                {amountError && <p className="mt-1.5 text-xs font-bold text-rose-500">{amountError}</p>}
              </Panel>

              {amount && !amountError && (
                <Panel title="Transaction ID (ট্রানজেকশন আইডি)">
                  <input
                    type="text"
                    placeholder="উদাহরণ: ODM2JXXXXX"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full rounded-lg border border-border bg-base px-4 py-3 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                    required
                  />
                  {!transactionReference.trim() && (
                    <p className="mt-1.5 text-[11px] font-bold text-rose-500">ট্রানজেকশন আইডি আবশ্যক</p>
                  )}
                  {depositMutation.isError && (
                    <p className="mt-1.5 text-xs font-bold text-rose-500">
                      {depositMutation.error instanceof ApiRequestError ? depositMutation.error.message : 'ডিপোজিট জমা দিতে সমস্যা হয়েছে।'}
                    </p>
                  )}
                </Panel>
              )}

              {/* Gentle reminder */}
              <GentleReminder />

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmitDeposit || depositMutation.isPending}
                className="w-full rounded-xl py-3.5 text-base font-extrabold text-[#141414] shadow-lg transition-all hover:opacity-90 active:scale-[.99] disabled:opacity-50"
                style={{ background: 'linear-gradient(180deg, var(--gold-soft), var(--brand))' }}
              >
                {depositMutation.isPending ? 'জমা হচ্ছে…' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </WalletCard>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

/** "My wallet" card shell — gold header + Deposit/Withdrawal tabs. */
function WalletCard({
  active,
  onClose,
  onWithdraw,
  children,
}: {
  active: 'deposit' | 'withdraw';
  onClose: () => void;
  onWithdraw: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Gold header */}
      <div
        className="relative flex items-center justify-center px-4 py-3"
        style={{ background: 'linear-gradient(180deg, var(--gold-soft), var(--brand))' }}
      >
        <h1 className="text-base font-extrabold text-[#141414]">My wallet</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/80 transition-colors hover:text-[#141414]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 bg-elevated p-1.5">
        <TabButton activeTab={active === 'deposit'} onClick={active === 'deposit' ? undefined : onWithdraw}>
          Deposit
        </TabButton>
        <TabButton activeTab={active === 'withdraw'} onClick={active === 'withdraw' ? undefined : onWithdraw}>
          Withdrawal
        </TabButton>
      </div>

      {children}
    </div>
  );
}

function TabButton({ activeTab, onClick, children }: { activeTab: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-lg py-2.5 text-sm font-extrabold transition-all', activeTab ? 'text-[#141414]' : 'text-muted hover:text-[var(--text-primary)]')}
      style={activeTab ? { background: 'linear-gradient(180deg, var(--gold-soft), var(--brand))' } : undefined}
    >
      {children}
    </button>
  );
}

/** Section panel with a left accent bar and an optional right-aligned node. */
function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <span className="h-3.5 w-1 rounded-full bg-[var(--brand)]" />
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Collapsible "Gentle reminder" (deposit instructions). */
function GentleReminder() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <span aria-hidden>ⓘ</span> Gentle reminder
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted">
          <p className="mb-1.5 font-semibold text-[var(--text-primary)]">“SSP (Cashout) শুধুমাত্র ক্যাশ-আউটের জন্য।</p>
          <p className="mb-1.5">ডিপোজিটে দেরি এড়াতে অনুগ্রহ করে নিচের নির্দেশনাগুলো অনুসরণ করুন:</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>সঠিক ওয়ালেটে ক্যাশ-আউট করুন (যেমন bKash হলে শুধু bKash-এ)।</li>
            <li>ট্রান্জেকশন নম্বর দিন এবং সাবমিট করুন—ক্যাশ-আউট স্লিপের স্ক্রিনশট আপলোডের দরকার নেই।</li>
            <li>প্রথমবার ডিপোজিট ব্যর্থ হলে, ৩০ মিনিটের মধ্যে পুনরায় সাবমিট করলে স্বয়ংক্রিয়ভাবে অ্যাপ্রুভ হবে।</li>
          </ol>
          <p className="mt-2">
            নোট: লেনদেনের আগে সর্বশেষ এজেন্ট নম্বর অফিসিয়াল ওয়েবসাইট থেকে যাচাই করুন। পুরানো নম্বরে ডিপোজিট করলে দেরি বা অর্থহানি হতে পারে।
          </p>
          <p className="mt-1.5">ধন্যবাদ!”</p>
        </div>
      )}
    </div>
  );
}

/** Approved confirmation is transient; rejected stays much longer. */
const APPROVED_VISIBLE_MS = 3 * 60 * 1000;
const REJECTED_VISIBLE_MS = 24 * 60 * 60 * 1000;
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
    <section className="flex flex-col gap-3">
      {visible.map((d) => (
        <DepositStatusCard
          key={d.id}
          deposit={d}
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
          title: <p className="font-semibold text-success">ডিপোজিট অনুমোদিত 🎉</p>,
          message: `${amount} আপনার ওয়ালেটে যোগ হয়েছে।`,
        }
      : deposit.status === 'REJECTED'
        ? {
            wrap: 'border-danger/30 bg-danger/10',
            icon: <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />,
            title: <p className="font-semibold text-danger">ডিপোজিট বাতিল হয়েছে</p>,
            message: `${amount}${deposit.rejectedReason ? ` — ${deposit.rejectedReason}` : ''}. ভুল মনে হলে অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।`,
          }
        : {
            wrap: 'border-warning/30 bg-warning/10',
            icon: <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 animate-pulse text-warning" />,
            title: <p className="font-semibold text-warning">ডিপোজিট যাচাই করা হচ্ছে</p>,
            message: `${amount} — আমরা আপনার পেমেন্ট যাচাই করছি এবং শীঘ্রই ওয়ালেটে যোগ করব। এই পেজ স্বয়ংক্রিয়ভাবে আপডেট হয়।`,
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
          className="flex-shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

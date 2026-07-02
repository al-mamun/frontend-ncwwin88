/**
 * Reusable payment-related UI components for deposit/withdraw flows.
 * Mobile-first, premium casino styling, design-token driven.
 */
'use client';

import { useState } from 'react';
import { CheckCircle2, CreditCard, QrCode, Wallet, AlertTriangle, Clock, Copy, Check, ShieldCheck, Infinity as InfinityIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card-badge-label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import type {
  PaymentMethod,
  PaymentAccount,
  DepositRequestResponse,
  WithdrawalRequestResponse,
} from '../../types';

// Brand logos bundled in /public/assets — matched by method name/slug so well-known
// methods show their real logo even when no icon was uploaded in the dashboard.
const LOCAL_METHOD_LOGOS: Record<string, string> = {
  bkash: '/assets/logo-bkash.png',
  nagad: '/assets/nagad_logo.png',
  rocket: '/assets/rocket_logo.png',
  upay: '/assets/upay.webp',
};

function methodLogo(method: PaymentMethod): string | null {
  if (method.iconUrl) return method.iconUrl;
  const key = `${method.slug ?? ''} ${method.name ?? ''}`.toLowerCase();
  for (const brand of Object.keys(LOCAL_METHOD_LOGOS)) {
    if (key.includes(brand)) return LOCAL_METHOD_LOGOS[brand];
  }
  return null;
}

// ─── PaymentMethodCard ────────────────────────────────────────
export function PaymentMethodCard({
  method,
  selected,
  onSelect,
  flow,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  flow: 'deposit' | 'withdrawal';
}) {
  const min = flow === 'deposit' ? method.minDepositMinor : method.minWithdrawalMinor;
  const max = flow === 'deposit' ? method.maxDepositMinor : method.maxWithdrawalMinor;
  const logo = methodLogo(method);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
        selected
          ? 'border-brand/60 bg-brand/5'
          : 'border-border hover:border-brand/40 hover:bg-elevated/50',
      )}
    >
      {logo ? (
        <span className="flex h-14 w-[6rem] flex-shrink-0 items-center justify-center px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={method.name} className="max-h-12 w-auto max-w-full object-contain" />
        </span>
      ) : (
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-elevated">
          <CreditCard className="h-6 w-6 text-brand" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{method.name}</p>
        {method.description && (
          <p className="truncate text-xs text-muted">{method.description}</p>
        )}
        {/* Deposit limits are per-DESTINATION-ACCOUNT (shown under each number), not per
            method — so the method card omits them. Withdrawals still use method limits. */}
        {flow === 'withdrawal' && (
          <p className="mt-1 text-xs text-muted">
            {formatCurrency(min, method.currency)} – {formatCurrency(max, method.currency)}
          </p>
        )}
      </div>
      {selected && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-brand" />}
    </button>
  );
}

// ─── CopyButton ───────────────────────────────────────────────
/** Copies text to the clipboard with a mobile-safe fallback + brief "copied" state. */
export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    // Stop the click from selecting/deselecting the surrounding account card.
    e.stopPropagation();
    e.preventDefault();
    const text = value ?? '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older / non-secure-context mobile browsers.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op — clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : `${label} account number`}
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors',
        copied
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-border bg-elevated text-base hover:border-brand/50 hover:text-brand',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

// ─── AccountTypeBadge ─────────────────────────────────────────
/** Personal / Agent (or any free-form type) pill shown beside an account. */
export function AccountTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const isAgent = type.toLowerCase() === 'agent';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        isAgent ? 'bg-gold-soft/15 text-gold-soft' : 'bg-brand/10 text-brand',
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      {type} Account
    </span>
  );
}

/** Human-readable per-account deposit range. Max 0 = unlimited; min 0 = no minimum. */
function accountLimitText(
  minLimitMinor: number,
  maxLimitMinor: number,
  currency: string,
): { unlimited: boolean; text: string } {
  const hasMin = minLimitMinor > 0;
  const hasMax = maxLimitMinor > 0;
  const minText = formatCurrency(minLimitMinor, currency);
  const maxText = formatCurrency(maxLimitMinor, currency);
  if (hasMin && hasMax) return { unlimited: false, text: `Min ${minText} – Max ${maxText}` };
  if (hasMin && !hasMax) return { unlimited: true, text: `Min ${minText} – Unlimited` };
  if (!hasMin && hasMax) return { unlimited: false, text: `Up to ${maxText} per deposit` };
  return { unlimited: true, text: 'Unlimited' };
}

// ─── PaymentAccountCard ───────────────────────────────────────
export function PaymentAccountCard({
  account,
  selected,
  onSelect,
  currency = 'BDT',
}: {
  account: PaymentAccount;
  selected: boolean;
  onSelect: () => void;
  currency?: string;
}) {
  const limit = accountLimitText(account.minLimitMinor, account.maxLimitMinor, currency);
  const number = account.accountNumberMasked;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={cn(
        'flex w-full cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-brand/60 bg-brand/5'
          : 'border-border hover:border-brand/40 hover:bg-elevated/50',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-elevated">
          {account.qrCodeUrl ? <QrCode className="h-5 w-5 text-brand" /> : <Wallet className="h-5 w-5 text-brand" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {account.displayName || account.accountHolderName ? (
              <p className="font-semibold text-base">{account.displayName || account.accountHolderName}</p>
            ) : !account.accountType ? (
              <p className="font-semibold text-base">Account</p>
            ) : null}
            <AccountTypeBadge type={account.accountType} />
          </div>
          {account.accountHolderName && account.displayName && (
            <p className="text-xs text-muted">{account.accountHolderName}</p>
          )}
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-brand" />}
      </div>

      {/* Destination number + copy */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated/60 px-3 py-2">
        <span className="min-w-0 flex-1 break-all font-mono text-sm font-semibold tracking-wider">{number}</span>
        {number && <CopyButton value={number} />}
      </div>

      {/* Per-account limit (driven by THIS number's configured max) */}
      <div className="flex items-center gap-1.5 text-xs">
        {limit.unlimited ? (
          <InfinityIcon className="h-3.5 w-3.5 text-success" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 text-muted" />
        )}
        <span className={cn('font-medium', limit.unlimited ? 'text-success' : 'text-muted')}>{limit.text}</span>
      </div>

      {account.instructions && <p className="text-xs text-muted">{account.instructions}</p>}
    </div>
  );
}

// ─── AmountInput ──────────────────────────────────────────────
export function AmountInput({
  label = 'Amount',
  value,
  onChange,
  currency = 'BDT',
  min,
  max,
  error,
  disabled,
  placeholder = '0.00',
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  currency?: string;
  min?: number;
  max?: number;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-muted">{label}</label>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min={min ? min / 100 : undefined}
          max={max ? max / 100 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn('pr-16 text-lg font-semibold', error && 'border-danger')}
          aria-invalid={!!error}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
          {currency}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {value && !error && (
        <p className="mt-1 text-xs text-muted">
          You will {label.includes('withdraw') ? 'withdraw' : 'deposit'}{' '}
          <span className="font-semibold text-brand">
            {formatCurrency(Math.round(parseFloat(value) * 100), currency)}
          </span>
        </p>
      )}
    </div>
  );
}

// ─── LimitInfo ────────────────────────────────────────────────
export function LimitInfo({
  min,
  max,
  currency = 'BDT',
  available,
  flow,
}: {
  min: number;
  max: number;
  currency?: string;
  available?: number;
  flow: 'deposit' | 'withdraw';
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <span className="text-muted">Min: </span>
          <span className="font-semibold">{formatCurrency(min, currency)}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted">Max: </span>
          <span className="font-semibold">{formatCurrency(max, currency)}</span>
        </div>
        {flow === 'withdraw' && available !== undefined && (
          <div className="text-sm">
            <span className="text-muted">Available: </span>
            <span className="font-semibold text-brand">{formatCurrency(available, currency)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── RequestSuccess ───────────────────────────────────────────
export function RequestSuccess({
  title,
  response,
  onDone,
  doneLabel = 'Back to Wallet',
  type,
}: {
  title: string;
  response: DepositRequestResponse | WithdrawalRequestResponse;
  onDone: () => void;
  doneLabel?: string;
  type: 'deposit' | 'withdrawal';
}) {
  const isWithdrawal = type === 'withdrawal';
  const maskedAccount = isWithdrawal
    ? (response as WithdrawalRequestResponse).maskedAccountNumber
    : null;

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
        <CheckCircle2 className="h-10 w-10 text-brand" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-muted">Your request has been submitted successfully.</p>

      <Card className="mt-6 w-full max-w-md text-left">
        <CardContent className="flex flex-col gap-3 p-6">
          <Row label="Request ID" value={response.id} mono />
          <Row label="Amount" value={formatCurrency(response.amount, response.currency)} />
          <Row label="Status" value={response.status} />
          <Row label="Submitted" value={new Date(response.createdAt).toLocaleString()} />
          {maskedAccount && <Row label="To Account" value={maskedAccount} mono />}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-elevated p-4 text-left">
        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
        <p className="text-sm text-muted">
          {isWithdrawal
            ? 'Your withdrawal is pending review. Funds have been held in escrow until approval. You will see the status update in your wallet.'
            : 'Your deposit is pending review. Please allow time for our team to verify your payment. You will see the funds in your wallet once approved.'}
        </p>
      </div>

      <Button onClick={onDone} className="mt-6 w-full max-w-md">
        {doneLabel}
      </Button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={cn('text-sm font-semibold', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

// ─── PendingStatusCard ────────────────────────────────────────
export function PendingStatusCard({
  count,
  type,
  amountMinor,
  currency = 'BDT',
}: {
  count: number;
  type: 'deposit' | 'withdrawal';
  amountMinor?: number;
  currency?: string;
}) {
  if (count === 0) return null;
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-warning">
            {count} pending {type === 'deposit' ? 'deposit' : 'withdrawal'}
            {count > 1 ? 's' : ''}
          </p>
          {amountMinor !== undefined && (
            <p className="text-xs text-muted">
              Total: {formatCurrency(amountMinor, currency)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ActionButton (Deposit/Withdraw CTA) ──────────────────────
export function ActionButton({
  href,
  label,
  icon: Icon,
  variant = 'primary',
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <a
      href={href}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
        variant === 'primary'
          ? 'bg-brand text-brand-fg hover:opacity-90'
          : 'border border-border bg-surface text-base hover:bg-elevated',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </a>
  );
}
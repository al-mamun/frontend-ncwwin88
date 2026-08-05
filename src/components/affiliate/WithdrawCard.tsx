/**
 * Withdraw — the partner's own control over their money.
 *
 * The portal had no way to ask for a payout at all. A partner watched a balance
 * accumulate and had to contact support to touch any of it, which is a strange
 * thing to ask of someone you are paying commission to.
 *
 * The card leads with the split, because it is the thing most likely to be
 * misread: PENDING is last week's commission, credited at Monday's settlement
 * and deliberately not spendable yet; AVAILABLE is what matured on Tuesday and
 * is the only figure a withdrawal can draw on. Showing one number would invite a
 * partner to plan around money that is not withdrawable today.
 *
 * Only one withdrawal may be in flight at a time (the server enforces it), so
 * when one is open the form is replaced by its status rather than left enabled
 * to produce an error the partner cannot act on.
 */
'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { affiliateApi, type AffiliateBalance } from '@/services/affiliate.service';
import {
  BTN_PRIMARY,
  Badge,
  INPUT,
  LABEL,
  ProgressBar,
  SectionCard,
  Skeleton,
  formatDate,
  formatMoney,
} from '@/components/affiliate/portal-ui';

function statusTone(status: string): 'success' | 'neutral' | 'danger' | 'gold' | 'warning' {
  if (status === 'paid') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'approved') return 'gold';
  return 'neutral';
}

function statusLabel(status: string): string {
  if (status === 'requested') return 'Awaiting review';
  if (status === 'approved') return 'Approved — payment on the way';
  if (status === 'paid') return 'Paid';
  if (status === 'rejected') return 'Declined';
  return status;
}

/** Minor units from a typed major-unit amount. Returns null when unparseable. */
function toMinor(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Round rather than floor: a partner typing 100.005 means 100.01, and the
  // server bounds it anyway.
  return Math.round(n * 100);
}

export function WithdrawCard({ currency }: { currency?: string }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const balanceQ = useQuery({
    queryKey: ['affiliate', 'balance'],
    queryFn: () => affiliateApi.balance(),
    staleTime: 30_000,
    retry: false,
  });

  const historyQ = useQuery({
    queryKey: ['affiliate', 'payouts'],
    queryFn: () => affiliateApi.payoutHistory(1, 10),
    staleTime: 60_000,
    retry: false,
  });

  const bal: AffiliateBalance | undefined = balanceQ.data;
  const ccy = bal?.currency || currency || '';

  /*
   * The field starts EMPTY on purpose.
   *
   * It used to arrive prefilled with the whole balance, which quietly makes
   * "withdraw everything" the default action on a money form — one stray click
   * and the entire balance is committed. The partner types the amount they
   * actually want.
   */

  const mutation = useMutation({
    mutationFn: (minor: number) => affiliateApi.requestPayout(minor),
    onSuccess: () => {
      setError(null);
      setDone(true);
      void qc.invalidateQueries({ queryKey: ['affiliate', 'balance'] });
      void qc.invalidateQueries({ queryKey: ['affiliate', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['affiliate', 'status'] });
    },
    onError: (e: unknown) => {
      setDone(false);
      setError(e instanceof Error ? e.message : 'Could not raise the withdrawal. Please try again.');
    },
  });

  if (balanceQ.isLoading) return <Skeleton className="h-[260px] w-full rounded-2xl" />;
  // No balance endpoint (older backend) — draw nothing rather than an error box.
  if (!bal) return null;

  const open = bal.openPayout;
  const minor = toMinor(amount);
  const belowMin = bal.minPayoutMinor > 0 && (minor ?? 0) < bal.minPayoutMinor;
  const overBalance = (minor ?? 0) > bal.availableMinor;
  const submitDisabled =
    mutation.isPending || !!open || !minor || belowMin || overBalance || bal.availableMinor <= 0;

  const submit = () => {
    setError(null);
    if (!minor) { setError('Enter an amount to withdraw.'); return; }
    if (overBalance) { setError('That is more than your available balance.'); return; }
    if (belowMin) { setError(`The minimum withdrawal is ${formatMoney(bal.minPayoutMinor, ccy)}.`); return; }
    mutation.mutate(minor);
  };

  return (
    <SectionCard
      title="Withdraw"
      hint="Commission settles on Monday and becomes available on Tuesday"
      actions={open ? <Badge tone={statusTone(open.status)}>{statusLabel(open.status)}</Badge> : null}
    >
      {/* ── the split, first ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={LABEL}>Available</p>
          <p className="mt-1 text-2xl font-bold tabular-nums aff-gold-text">
            {formatMoney(bal.availableMinor, ccy)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">Ready to withdraw now</p>
        </div>
        <div>
          <p className={LABEL}>Pending</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatMoney(bal.pendingMinor, ccy)}
          </p>
          {/*
            Pending is everything the partner cannot draw on today — commission
            maturing from Monday AND anything already committed to a withdrawal.
            The sub-line names whichever applies, because "pending" alone does
            not tell them whether to wait for Tuesday or for your payment run.
          */}
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {(bal.reservedMinor ?? 0) > 0 && (bal.maturingMinor ?? 0) > 0
              ? `${formatMoney(bal.reservedMinor, ccy)} withdrawing · ${formatMoney(bal.maturingMinor, ccy)} available Tuesday`
              : (bal.reservedMinor ?? 0) > 0
                ? 'Withdrawal in progress'
                : bal.pendingMinor > 0
                  ? 'Becomes available on Tuesday'
                  : 'Nothing settling right now'}
          </p>
        </div>
      </div>


      {bal.debtMinor > 0 ? (
        <p className="mt-3 border-l-2 border-[var(--text-muted)] pl-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {formatMoney(bal.debtMinor, ccy)} of previously overpaid commission is being recovered from future
          earnings. Your balance is not reduced — future commission is.
        </p>
      ) : null}

      {bal.minPayoutMinor > 0 && bal.availableMinor < bal.minPayoutMinor ? (
        <>
          <ProgressBar
            pct={Math.min(100, (bal.availableMinor / bal.minPayoutMinor) * 100)}
            tone="gold"
            className="mt-4"
          />
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {formatMoney(bal.minPayoutMinor - bal.availableMinor, ccy)}
            </span>{' '}
            more to reach the {formatMoney(bal.minPayoutMinor, ccy)} minimum withdrawal.
          </p>
        </>
      ) : null}

      {/* ── an open request replaces the form ── */}
      {open ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--text-primary)]">
            You have a withdrawal of{' '}
            <span className="font-bold tabular-nums">{formatMoney(open.amountMinor, ccy)}</span> in progress.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            Raised {formatDate(open.createdAt)}. That amount has already been taken out of your available
            balance. You can raise the next one once this has been settled.
          </p>
        </div>
      ) : (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <label className={LABEL} htmlFor="withdraw-amount">
            Amount
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="withdraw-amount"
              className={INPUT}
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              aria-describedby="withdraw-rules"
              disabled={bal.availableMinor <= 0 || mutation.isPending}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
                setDone(false);
              }}
            />
            <button type="button" className={BTN_PRIMARY} disabled={submitDisabled} onClick={submit}>
              {mutation.isPending ? 'Sending…' : 'Withdraw'}
            </button>
          </div>

          {/*
            State the rule while they type, not after they press.
            The button is disabled below the minimum, and a disabled button with
            no explanation reads as broken — the partner cannot tell whether the
            amount is wrong, the account is wrong, or the page is.
          */}
          <div id="withdraw-rules" className="mt-2 space-y-1">
            {bal.availableMinor <= 0 ? (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Nothing is available to withdraw yet. Commission earned this week settles on Monday and becomes
                available on Tuesday.
              </p>
            ) : (
              <>
                {bal.minPayoutMinor > 0 ? (
                  <p
                    className={
                      minor && belowMin
                        ? 'text-xs font-semibold leading-relaxed text-danger'
                        : 'text-xs leading-relaxed text-[var(--text-secondary)]'
                    }
                  >
                    Minimum withdrawal {formatMoney(bal.minPayoutMinor, ccy)}
                    {minor && belowMin ? ' — enter this amount or more.' : '.'}
                  </p>
                ) : null}
                {minor && overBalance ? (
                  <p className="text-xs font-semibold leading-relaxed text-danger">
                    That is more than your available balance of {formatMoney(bal.availableMinor, ccy)}.
                  </p>
                ) : null}
              </>
            )}
          </div>

          {error ? <p className="mt-2 text-xs font-semibold text-danger">{error}</p> : null}
          {done && !open ? (
            <p className="mt-2 text-xs font-semibold text-success">
              Withdrawal raised. It will be reviewed and paid to your saved payout details.
            </p>
          ) : null}
        </div>
      )}

      {/* ── recent withdrawals ── */}
      {historyQ.data && historyQ.data.items.length > 0 ? (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className={LABEL}>Recent withdrawals</p>
          <ul className="mt-2 space-y-2">
            {historyQ.data.items.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                  {formatMoney(p.amountMinor, p.currency || ccy)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {formatDate(p.paidAt || p.createdAt)}
                  </span>
                  <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default WithdrawCard;

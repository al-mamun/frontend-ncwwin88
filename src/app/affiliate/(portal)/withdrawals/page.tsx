/**
 * Withdrawals — every payout this partner has ever raised.
 *
 * The Withdraw card on the earnings page lists the last five, which answers
 * "did my request go through" and nothing else. A partner reconciling their own
 * books, or asking why something was declined months ago, needs the whole list
 * with dates, rails, destinations and references — and they were being asked to
 * take that on trust or open a support ticket.
 *
 * Read-only on purpose. Raising a withdrawal happens on the earnings page, next
 * to the balance it draws from; putting a second entry point here would let a
 * partner start one without seeing what they have available.
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliateApi, type AffiliatePayoutRow } from '@/services/affiliate.service';
import {
  Badge,
  EmptyState,
  ErrorNote,
  LABEL,
  SectionCard,
  Skeleton,
  formatDate,
  formatMoney,
} from '@/components/affiliate/portal-ui';

const PAGE_SIZE = 20;

/** The rails, named the way the partner chose them — never a raw enum. */
const RAIL_LABELS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank transfer',
  usdt: 'USDT',
  skrill: 'Skrill',
  neteller: 'Neteller',
};

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

/** The date that matters for this row: when it was paid, else when it was raised. */
function rowDate(p: AffiliatePayoutRow): string {
  return p.status === 'paid' && p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt);
}

export default function AffiliateWithdrawalsPage() {
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['affiliate', 'payouts', 'history', page],
    queryFn: () => affiliateApi.payoutHistory(page, PAGE_SIZE),
    staleTime: 60_000,
    retry: false,
  });

  const items = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Only settled money counts as paid — a requested row is not yet anything.
  const paidMinor = items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amountMinor, 0);
  const currency = items[0]?.currency ?? '';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Withdrawals</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Every withdrawal you have raised, what it was paid on, and where it went.
        </p>
      </div>

      <ErrorNote error={q.error} paused={q.isPaused} />

      <SectionCard
        title="History"
        hint={total > 0 ? `${total} withdrawal${total === 1 ? '' : 's'}` : undefined}
        actions={
          paidMinor > 0 ? (
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {formatMoney(paidMinor, currency)} paid on this page
            </span>
          ) : null
        }
      >
        {q.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No withdrawals yet"
            hint="Commission settles on Monday and becomes available to withdraw on Tuesday. Raise your first withdrawal from the My earnings page."
          />
        ) : (
          <>
            {/* Desktop: a table. Mobile: stacked rows — a partner checking a
                payment on a phone should not have to scroll sideways. */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className={`${LABEL} py-2 text-left`}>Date</th>
                    <th className={`${LABEL} py-2 text-left`}>Amount</th>
                    <th className={`${LABEL} py-2 text-left`}>Paid by</th>
                    <th className={`${LABEL} py-2 text-left`}>Destination</th>
                    <th className={`${LABEL} py-2 text-left`}>Reference</th>
                    <th className={`${LABEL} py-2 text-right`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3 text-[var(--text-secondary)]">{rowDate(p)}</td>
                      <td className="py-3 font-semibold tabular-nums text-[var(--text-primary)]">
                        {formatMoney(p.amountMinor, p.currency)}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {RAIL_LABELS[String(p.method || '').toLowerCase()] ?? '—'}
                      </td>
                      <td className="py-3 font-mono text-xs text-[var(--text-secondary)]">
                        {/* Server-side field; may be absent on older rows. */}
                        {(p as AffiliatePayoutRow & { payoutDetails?: string | null }).payoutDetails ?? '—'}
                      </td>
                      <td className="py-3 text-xs text-[var(--text-secondary)]">{p.reference ?? '—'}</td>
                      <td className="py-3 text-right">
                        <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 sm:hidden">
              {items.map((p) => (
                <li key={p.id} className="border-b border-[var(--border)] pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                      {formatMoney(p.amountMinor, p.currency)}
                    </span>
                    <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {rowDate(p)}
                    {RAIL_LABELS[String(p.method || '').toLowerCase()]
                      ? ` · ${RAIL_LABELS[String(p.method).toLowerCase()]}`
                      : ''}
                    {(p as AffiliatePayoutRow & { payoutDetails?: string | null }).payoutDetails
                      ? ` · ${(p as AffiliatePayoutRow & { payoutDetails?: string | null }).payoutDetails}`
                      : ''}
                  </p>
                  {p.reference ? (
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Ref {p.reference}</p>
                  ) : null}
                  {/* A decline without a reason is the one that generates a ticket. */}
                  {p.status === 'rejected' && p.note ? (
                    <p className="mt-1 text-[11px] leading-relaxed text-danger">{p.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            {pages > 1 ? (
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-xs text-[var(--text-secondary)]">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40"
                    disabled={page <= 1 || q.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40"
                    disabled={page >= pages || q.isFetching}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>
    </div>
  );
}

/**
 * Currency / money formatting helpers.
 *
 * The backend stores all amounts as integer minor units (`balanceMinor`,
 * `amountMinor`). These helpers convert to human-readable major-unit strings.
 */

/**
 * Format a minor-unit amount as a currency string using the ISO CODE prefix
 * (e.g. "BDT 1,015.00") instead of a local symbol like ৳. Latin digits + grouping.
 */
export function formatCurrency(minor: number, currency = 'BDT'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

/** Format a minor-unit amount WITHOUT the currency symbol (number only). */
export function formatAmount(minor: number): string {
  return (minor / 100).toFixed(2);
}

/**
 * The year to print in a copyright line.
 *
 * Deliberately UTC. Every footer that shows a year sits in a `'use client'`
 * component, and Next still renders those on the server first — where the clock
 * is UTC while the visitor's is UTC+6. For the six hours between midnight in
 * Dhaka and midnight in London the two disagree, the markup React was given
 * stops matching the markup it builds, and hydration fails over a copyright
 * line. `getUTCFullYear` is the same number on both sides, so there is nothing
 * to disagree about. The cost is that the footer keeps last year's number for
 * those few hours, which nobody has ever noticed in a copyright notice.
 */
export function copyrightYear(): number {
  return new Date().getUTCFullYear();
}

/** Compact date formatter for ledger tables. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
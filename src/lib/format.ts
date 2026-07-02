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
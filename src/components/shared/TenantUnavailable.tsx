/**
 * TenantUnavailable — shown when a tenant is SUSPENDED or DISABLED.
 *
 * UX-only safety net. The backend is the real enforcement boundary; this just
 * presents a friendly "site unavailable" page instead of a broken UI. Token-
 * driven styling only.
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import type { TenantStatus } from '../../types/tenant';

const MESSAGES: Record<Exclude<TenantStatus, 'ACTIVE'>, string> = {
  SUSPENDED: 'This site is temporarily unavailable. Please check back later.',
  DISABLED: 'This site is no longer available.',
};

export function TenantUnavailable({
  status,
  name,
}: {
  status: TenantStatus;
  name?: string;
}) {
  const message =
    status === 'ACTIVE'
      ? 'This site is currently unavailable.'
      : MESSAGES[status];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
        <AlertTriangle className="h-8 w-8 text-[var(--warning)]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
        {name ? `${name} is unavailable` : 'Site unavailable'}
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}

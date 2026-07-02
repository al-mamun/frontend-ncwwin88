/**
 * BrandLockup — the tenant's brand mark, used everywhere a logo is shown
 * (header, login, register, affiliate site).
 *
 * When the tenant has uploaded a logo (set from the dashboard Profile), it is
 * shown. Otherwise we render a branded fallback: a gold "initials" box + the
 * two-line name (e.g. "MEGA CASINO / WORLD"), matching the site header — so a
 * tenant without an uploaded logo still looks branded, never a generic image.
 */
'use client';

import { useTenant } from '@/core/tenant/TenantProvider';
import { cn } from '@/lib/utils';

export default function BrandLockup({
  className,
  boxClassName,
}: {
  /** Applied to the <img> when a tenant logo exists (controls its height). */
  className?: string;
  /** Applied to the fallback initials box. */
  boxClassName?: string;
}) {
  const { tenant } = useTenant();

  if (tenant.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tenant.logoUrl} alt={tenant.name} className={cn('h-10 w-auto object-contain', className)} />;
  }

  const initials = (tenant.name || 'MCW').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'MCW';
  const parts = (tenant.name || 'Mega Casino World').split(/\s+/);
  const top = parts.slice(0, Math.max(1, parts.length - 1)).join(' ').toUpperCase() || 'MEGA CASINO';
  const bottom = (parts.length > 1 ? parts[parts.length - 1] : 'WORLD').toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-[5px] bg-gradient-to-br from-gold-soft to-brand text-xs font-extrabold leading-none text-brand-fg',
          boxClassName,
        )}
      >
        {initials}
      </div>
      <div className="leading-none">
        <div className="text-sm font-extrabold tracking-wide text-gold-soft">{top}</div>
        <div className="text-[10px] font-semibold tracking-[0.25em] text-muted">{bottom}</div>
      </div>
    </div>
  );
}

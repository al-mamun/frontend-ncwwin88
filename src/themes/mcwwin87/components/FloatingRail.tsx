/**
 * bdbet21 — floating right-side button rail (desktop), reference style.
 *
 * Labeled gold-icon cards: Home, Top, Download APP, plus a static 18+ badge.
 * Real behaviour only:
 *  - Home -> navigates to the site home (/) from any page.
 *  - Top  -> scrolls to the top of the current page.
 *  - Download APP -> opens NEXT_PUBLIC_APP_DOWNLOAD_URL if configured; otherwise
 *    it is shown but inert (no fabricated link).
 *  - 18+  -> static responsible-gaming badge (non-interactive).
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowUp, Download } from 'lucide-react';
import { useTenant } from '../../../core/tenant/TenantProvider';

const ENV_APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || '';

function RailCard({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-gold-soft shadow">
        {icon}
      </span>
      <span className="text-[10px] font-medium leading-tight text-muted">{label}</span>
    </>
  );
  const cardClass =
    'flex w-[68px] flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/90 px-2 py-2.5 text-center shadow-lg backdrop-blur transition-colors hover:border-gold-soft/50';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass} aria-label={label}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cardClass} aria-label={label}>
      {inner}
    </button>
  );
}

export default function FloatingRail() {
  const { tenant } = useTenant();
  const appUrl = (tenant.appDownloadUrl || ENV_APP_DOWNLOAD_URL || '').trim();
  const router = useRouter();
  const scrollTop = useCallback(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const goHome = useCallback(() => router.push('/'), [router]);

  return (
    <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
      <RailCard icon={<Home className="h-5 w-5" aria-hidden />} label="Home" onClick={goHome} />
      <RailCard icon={<ArrowUp className="h-5 w-5" aria-hidden />} label="Top" onClick={scrollTop} />
      {appUrl ? (
        <RailCard
          icon={<Download className="h-5 w-5" aria-hidden />}
          label="Download APP"
          href={appUrl}
        />
      ) : null}
      {/* Static responsible-gaming badge (non-interactive). */}
      <span
        aria-hidden
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-2 bg-surface text-xs font-bold text-white shadow-lg"
      >
        18+
      </span>
    </div>
  );
}

/**
 * mcwwin87 (NCW) — scrolling announcement bar.
 *
 * Shown under the hero banner when the tenant enables it from the dashboard
 * (Profile → Announcement bar). Content + on/off are tenant-configurable; the
 * colours come from the per-tenant theme tokens (gold bar, dark text). Hidden
 * entirely when disabled or empty.
 */
'use client';

import { useTenant } from '../../../core/tenant/TenantProvider';

export default function AnnouncementBar() {
  const { tenant } = useTenant();
  const text = (tenant.announcementText ?? '').trim();
  if (tenant.announcementEnabled !== true || !text) return null;

  return (
    <div className="relative overflow-hidden rounded-md bg-[var(--brand)] text-brand-fg shadow-sm">
      <div className="mcw-announce flex w-max whitespace-nowrap py-1.5 text-sm font-semibold">
        <span className="px-10">📢 {text}</span>
        <span className="px-10" aria-hidden>📢 {text}</span>
      </div>
      <style>{`
        @keyframes mcwAnnounce { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .mcw-announce { animation: mcwAnnounce 30s linear infinite; }
        .mcw-announce:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

/**
 * Affiliate PORTAL shell — sidebar + topbar + the single auth/onboarding gate.
 *
 * This is a route GROUP: `(portal)` does not appear in the URL, so
 * /affiliate/(portal)/dashboard is still served at /affiliate/dashboard. Login,
 * register, onboarding and the marketing landing deliberately live OUTSIDE the
 * group so they keep their own full-bleed layouts and are reachable while signed
 * out.
 *
 * The redirect gate lives here rather than in each page: previously every screen
 * repeated the same "no session -> /affiliate/login, incomplete onboarding ->
 * /affiliate/onboarding" effect, which is exactly the kind of thing that drifts
 * out of sync as pages are added.
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import BrandLockup from '@/components/shared/brand-lockup';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { formatMoney } from '@/components/affiliate/portal-ui';
import { portalFeatures } from '@/services/affiliate.service';

/* ── inline icons (no icon dependency) ─────────────────────────────────── */
type IconProps = { className?: string };
// `width`/`height` are intrinsic attributes, not CSS, so any Tailwind h-*/w-*
// class still wins — but if one is missing or misspelled the icon falls back to
// text size instead of the SVG default 300x150.
const stroke = { width: '1em', height: '1em', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const Icon = {
  grid: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /></svg>),
  userPlus: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M18 8v6M15 11h6" /></svg>),
  chart: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="M3 3v18h18" /><path d="M7 15l3-4 3 2 4-6" /></svg>),
  coins: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>),
  wallet: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a2 2 0 0 1 2 2v1" /><path d="M3 7.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2" /><path d="M20 10h-4a2.5 2.5 0 0 0 0 5h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1Z" /></svg>),
  receipt: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6" /></svg>),
  search: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>),
  network: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><circle cx="12" cy="4.5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7v5M5 16.5V13a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3.5" /></svg>),
  user: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>),
  logout: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>),
  menu: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  close: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><path d="m6 6 12 12M18 6 6 18" /></svg>),
  copy: (p: IconProps) => (<svg viewBox="0 0 24 24" {...stroke} className={p.className}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>),
};

interface NavItem {
  href: string;
  label: string;
  icon: (p: IconProps) => ReactNode;
  /** Only drawn when the tenant has this switch on. Omitted = always drawn. */
  feature?: keyof ReturnType<typeof portalFeatures>;
}
interface NavGroup { title: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ href: '/affiliate/dashboard', label: 'Dashboard', icon: Icon.grid }],
  },
  {
    // Its own group rather than a fourth line under Reports: this is the page a
    // partner opens to see what they are owed, and it should not be something
    // they have to hunt for among the analytics.
    title: 'Earnings',
    items: [
      { href: '/affiliate/earnings', label: 'My earnings', icon: Icon.wallet },
      // Beside earnings, not buried under Reports: "where is my money" and
      // "where did my money go" are the same question asked a week apart.
      { href: '/affiliate/withdrawals', label: 'Withdrawals', icon: Icon.receipt },
    ],
  },
  {
    title: 'Reports',
    items: [
      { href: '/affiliate/reports/registrations', label: 'Registrations', icon: Icon.userPlus },
      { href: '/affiliate/reports/performance', label: 'Player performance', icon: Icon.chart },
      { href: '/affiliate/reports/commission', label: 'Commission', icon: Icon.coins },
      { href: '/affiliate/activity', label: 'Activity', icon: Icon.receipt },
    ],
  },
  {
    title: 'Members',
    items: [
      { href: '/affiliate/members', label: 'Member search', icon: Icon.search },
      { href: '/affiliate/network', label: 'Sub-affiliates', icon: Icon.network, feature: 'subAffiliates' },
    ],
  },
  {
    title: 'Account',
    items: [{ href: '/affiliate/account', label: 'My account', icon: Icon.user }],
  },
];

/**
 * The navigation this tenant actually gets.
 *
 * A group whose every item was filtered out is dropped too — an empty "Members"
 * heading with nothing under it looks like a page that failed to load.
 */
function visibleNav(features: ReturnType<typeof portalFeatures>): NavGroup[] {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.feature || features[i.feature]) })).filter(
    (g) => g.items.length > 0,
  );
}

export default function AffiliatePortalLayout({ children }: { children: ReactNode }) {
  const { me, loading, error, retry, logout } = useAffiliateAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Single gate for the whole portal.
  useEffect(() => {
    if (loading) return;
    // A transport failure is not a signed-out session. Bouncing to /login here
    // would tell the user a lie and throw away the page they were on, so hold
    // position and let the panel below offer a retry.
    if (error) return;
    if (!me) { router.replace('/affiliate/login'); return; }
    if (!me.verification.onboardingComplete) router.replace('/affiliate/onboarding');
  }, [loading, error, me, router]);

  // Close the drawer on navigation — otherwise it stays open over the new page.
  useEffect(() => { setNavOpen(false); }, [pathname]);

  // While the drawer is open it owns the screen: Escape must dismiss it (it is the
  // only way out for a keyboard user, since the backdrop is a mouse target), and
  // the page underneath must stop scrolling - otherwise a touch drag over the
  // backdrop scrolls the report behind it and the drawer appears frozen.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [navOpen]);

  if (!loading && error && !me) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <AffiliateBackground />
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6 text-center">
          <p className="text-base font-semibold text-white">We couldn&apos;t load your portal</p>
          <p className="mt-2 text-sm text-muted">{error.message}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={retry}
              className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/affiliate/login"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              Sign in again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !me || !me.verification.onboardingComplete) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <AffiliateBackground />
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[var(--gold-soft)]" />
          <p className="text-sm text-muted">Loading your portal…</p>
        </div>
      </div>
    );
  }

  const aff = me.affiliate;
  // Derived below the loading gate, so `me` is known-present and the nav never
  // renders once with the defaults and again with the tenant's real switches.
  const features = portalFeatures(me);
  // The portal may be served from affiliate.<domain>; the referral link must point
  // at the player site, so strip the subdomain rather than linking users to a
  // partner login page.
  const siteHost = (tenant.domain || (typeof window !== 'undefined' ? window.location.host : '')).replace(/^affiliate\./i, '');
  // A configured tenant domain is always served over https. The window fallback is
  // only hit in local dev, where hard-coding https produces an unusable
  // `https://localhost:3000` link, so mirror whatever scheme the page is on.
  const scheme = !tenant.domain && typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : 'https';
  const referralLink = siteHost ? `${scheme}://${siteHost}/?ref=${aff.code}` : `?ref=${aff.code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard denied (insecure origin / permission). The link stays visible
         and selectable, so the user can still copy it manually. */
    }
  };

  const Sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="hidden lg:block">
        <Link href="/affiliate/dashboard" className="flex flex-col items-start gap-1.5">
          <BrandLockup className="h-8 w-auto object-contain" />
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--gold-soft)]">PARTNERS</span>
        </Link>
      </div>

      {visibleNav(features).map((group) => (
        <div key={group.title}>
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">{group.title}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const ItemIcon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[linear-gradient(90deg,rgba(255,193,7,0.18),transparent)] text-[var(--gold-soft)] shadow-[inset_2px_0_0_0_var(--gold-soft)]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ItemIcon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted">Referral link</p>
          <p className="mt-1 break-all text-[11px] leading-snug text-white/80">{referralLink}</p>
          <button onClick={copyLink} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10">
            <Icon.copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button
          onClick={async () => { await logout(); router.replace('/affiliate/login'); }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Icon.logout className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="relative min-h-screen">
      <AffiliateBackground />

      <div className="relative flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[var(--scrim-sidebar)] backdrop-blur lg:block">
          {Sidebar}
        </aside>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button aria-label="Close menu" onClick={() => setNavOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[var(--bg-surface)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <BrandLockup className="h-7 w-auto object-contain" />
                <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
                  <Icon.close className="h-5 w-5" />
                </button>
              </div>
              <div className="h-[calc(100%-52px)]">{Sidebar}</div>
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-[var(--aff-topbar-h)] items-center gap-3 border-b border-white/10 bg-[var(--scrim-topbar)] px-4 backdrop-blur md:px-6">
            <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 lg:hidden">
              <Icon.menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden"><BrandLockup className="h-7 w-auto object-contain" /></div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] uppercase tracking-widest text-muted">Available</p>
                <p className="text-sm font-bold tabular-nums text-[var(--gold-soft)]">
                  {formatMoney(aff.availableCommissionMinor, aff.currency)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[10px] uppercase tracking-widest text-muted">Pending</p>
                <p className="text-sm font-bold tabular-nums text-white/80">
                  {formatMoney(aff.pendingCommissionMinor, aff.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] text-xs font-extrabold text-[var(--bg-base)]">
                  {(aff.displayName || aff.code || '?').slice(0, 1).toUpperCase()}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-semibold text-white">{aff.displayName || aff.code}</p>
                  <p className="text-[10px] text-muted">{aff.code}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}

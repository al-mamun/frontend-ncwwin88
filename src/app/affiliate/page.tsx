/**
 * Affiliate program marketing landing (affiliate.<tenant> / /affiliate).
 * Premium, industry-standard iGaming affiliate landing: layered gradient hero
 * with an earnings-dashboard mockup, stats band, commission tiers, benefits,
 * how-it-works, social proof, FAQ and CTA. Tenant-branded via useTenant.
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/core/tenant/TenantProvider';
import { apiFetch } from '@/lib/api';

interface PublicProgram {
  id: string; name: string; description: string | null; model: string;
  revenueSharePercent: number; cpaAmountMinor: number; qualifyingDepositMinor: number; minPayoutMinor: number; currency: string;
}
function money(minor: number, currency: string): string {
  return `${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}
/** Map a real program to the marketing-card shape used by the commission section. */
function programToPlan(p: PublicProgram) {
  const headline = p.model === 'cpa' ? `${money(p.cpaAmountMinor, p.currency)} CPA`
    : p.model === 'hybrid' ? `${p.revenueSharePercent}% + CPA`
    : `Up to ${p.revenueSharePercent}%`;
  const sub = p.model === 'cpa' ? 'per qualifying player' : p.model === 'hybrid' ? 'revenue share + CPA' : 'of net gaming revenue';
  const points = [
    p.revenueSharePercent > 0 ? `${p.revenueSharePercent}% revenue share` : null,
    p.cpaAmountMinor > 0 ? `${money(p.cpaAmountMinor, p.currency)} CPA per FTD` : null,
    p.qualifyingDepositMinor > 0 ? `Qualifies at ${money(p.qualifyingDepositMinor, p.currency)} deposit` : null,
    p.minPayoutMinor > 0 ? `Min payout ${money(p.minPayoutMinor, p.currency)}` : null,
  ].filter(Boolean) as string[];
  return { name: p.name, tag: '', featured: false, headline, sub, points: points.length ? points : [p.description || 'Competitive commissions'] };
}

/* ── tiny inline icons (no deps) ──────────────────────────────────────── */
type IconProps = { className?: string };
const I = {
  cash: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></svg>),
  chart: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 3v18h18" /><path d="M7 15l3-4 3 2 4-6" /></svg>),
  bolt: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>),
  shield: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3z" /><path d="m9 12 2 2 4-4" /></svg>),
  headset: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="2.5" y="13" width="4" height="6" rx="1.5" /><rect x="17.5" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 4h-2" /></svg>),
  users: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></svg>),
  star: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" className={p.className}><path d="M12 2l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.8 6.1 20l1.3-6.6L2.5 8.9l6.6-.8L12 2z" /></svg>),
  check: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m5 12 5 5 9-11" /></svg>),
};

const STATS = [
  { value: 'Up to 50%', label: 'Revenue share' },
  { value: 'BDT 120M+', label: 'Paid to partners' },
  { value: 'Weekly', label: 'On-time payouts' },
  { value: '24/7', label: 'Partner support' },
];

const BENEFITS = [
  { icon: I.cash, title: 'Lifetime revenue share', body: 'Earn a recurring cut of every referred player’s net revenue — for as long as they play, not just once.' },
  { icon: I.chart, title: 'Real-time analytics', body: 'Track clicks, sign-ups, first deposits and earnings live, with full transparency down to each transaction.' },
  { icon: I.bolt, title: 'Fast weekly payouts', body: 'Reliable, on-schedule payments via your preferred method once you reach the minimum threshold.' },
  { icon: I.shield, title: 'Trusted & compliant', body: 'A licensed, fair platform your audience can trust — backed by responsible-gaming standards.' },
  { icon: I.users, title: 'Sub-affiliate income', body: 'Refer other marketers and earn an extra commission on top of their performance.' },
  { icon: I.headset, title: 'Dedicated manager', body: 'Get a personal affiliate manager plus ready-to-use banners, links and marketing assets.' },
];

const STEPS = [
  { n: '01', title: 'Sign up free', body: 'Create your partner account and verify your email and phone in minutes.' },
  { n: '02', title: 'Get verified', body: 'Upload your ID for a quick KYC check, then get approved by our team.' },
  { n: '03', title: 'Share your link', body: 'Promote your unique tracking link across your site, social and channels.' },
  { n: '04', title: 'Earn & withdraw', body: 'Collect commission on player activity and request payouts whenever you like.' },
];

const PLANS = [
  { name: 'Revenue Share', tag: 'Most popular', featured: true, headline: 'Up to 50%', sub: 'of net gaming revenue', points: ['Recurring lifetime income', 'No negative carryover', 'Scales with performance'] },
  { name: 'CPA', tag: '', featured: false, headline: 'Fixed payout', sub: 'per qualifying player', points: ['One-off reward per FTD', 'Great for high traffic', 'Predictable earnings'] },
  { name: 'Hybrid', tag: '', featured: false, headline: 'CPA + Rev Share', sub: 'best of both', points: ['Upfront CPA on signup', 'Plus ongoing revenue', 'Tailored to you'] },
];

const FAQS = [
  { q: 'How much does it cost to join?', a: 'Nothing. Joining the partner program is completely free — you only ever earn.' },
  { q: 'When and how do I get paid?', a: 'Payouts are processed on a weekly cycle once you reach the minimum threshold, via your chosen payout method.' },
  { q: 'How are commissions tracked?', a: 'Every visitor who arrives through your unique link is tracked automatically, from first click through to deposits and ongoing play.' },
  { q: 'Do I need a website?', a: 'No. You can promote through social media, messaging channels, communities or a website — whatever works for your audience.' },
];

export default function AffiliateLandingPage() {
  const { tenant } = useTenant();
  const brandName = tenant.name && tenant.name.toLowerCase() !== 'casino' ? tenant.name : 'our brand';

  // Real tenant programs power the commission tiers (fallback to the generic set).
  const { data: programs } = useQuery({
    queryKey: ['affiliate', 'public-programs', tenant.slug],
    queryFn: () => apiFetch<PublicProgram[]>(`/public/affiliate/programs?tenant=${encodeURIComponent(tenant.slug || '')}`),
    staleTime: 60_000,
  });
  const plans = programs && programs.length > 0 ? programs.map(programToPlan) : PLANS;

  return (
    <div className="relative min-h-screen overflow-hidden bg-base text-[#f5f7fa]">
      {/* layered background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--bg-base)_0%,var(--bg-base)_40%,var(--bg-base)_100%)]" />
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,193,7,0.18),transparent_60%)] blur-2xl" />
        <div className="absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(230,57,70,0.16),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-0 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.08),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative">
        {/* ── Header ── */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex flex-col items-start gap-1.5">
                        <BrandLockup className="h-9 w-auto object-contain" />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--gold-soft)]">PARTNERS</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#plans" className="transition-colors hover:text-white">Commissions</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-4 py-2 text-sm font-bold text-[var(--bg-base)] shadow-[0_8px_24px_-8px_rgba(255,193,7,0.6)] transition-transform hover:-translate-y-0.5">Join now</Link>
          </div>
        </header>

        {/* ── Optional tenant hero banner (shown right after the header when set + enabled) ── */}
        {tenant.affiliateBanner?.imageUrl && tenant.affiliateBannerEnabled !== false && (
          <div className="mx-auto max-w-7xl px-5 pt-2 md:px-8">
            {tenant.affiliateBanner.link ? (
              <a href={tenant.affiliateBanner.link} className="block overflow-hidden rounded-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tenant.affiliateBanner.imageUrl} alt="" className="h-auto w-full object-cover" />
              </a>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tenant.affiliateBanner.imageUrl} alt="" className="h-auto w-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ── Hero (text-based; tenant can hide it) ── */}
        {tenant.affiliateHeroEnabled !== false && (
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-10 pt-10 md:px-8 md:pb-20 md:pt-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--gold-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-soft)]" /> Official Affiliate Program
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Turn your traffic into
              <span className="block bg-[linear-gradient(90deg,var(--gold-soft),var(--brand-2-dark),var(--danger))] bg-clip-text text-transparent">recurring revenue.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Partner with {brandName} and earn industry-leading commissions on every player you refer —
              with transparent real-time tracking and fast, reliable weekly payouts.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-7 py-3.5 text-[1rem] font-bold !text-[var(--bg-base)] shadow-[0_12px_30px_-10px_rgba(255,193,7,0.7)] transition-transform hover:-translate-y-0.5">
                Become a partner
              </Link>
              <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10">
                Partner login
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-3 text-sm text-muted">
              <div className="flex text-[var(--gold-soft)]">
                {[0, 1, 2, 3, 4].map((i) => <I.star key={i} className="h-4 w-4" />)}
              </div>
              <span>Trusted by <span className="font-semibold text-white">2,000+</span> active partners</span>
            </div>
          </div>

          {/* earnings dashboard mockup */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_70%_20%,rgba(255,193,7,0.25),transparent_60%)] blur-2xl" />
            <div className="rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-5 shadow-2xl backdrop-blur md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Available balance</p>
                  <p className="mt-1 text-3xl font-extrabold text-white">BDT 84,250<span className="text-base font-semibold text-muted">.00</span></p>
                </div>
                <span className="rounded-full bg-[var(--danger)]/15 px-3 py-1 text-xs font-bold text-[#ff6b75]">+18.4%</span>
              </div>
              {/* bar chart */}
              <div className="mt-6 flex h-32 items-end gap-2">
                {[40, 55, 35, 70, 50, 85, 65, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))]" style={{ height: `${h}%`, opacity: 0.55 + (h / 250) }} />
                ))}
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  { k: 'Revenue share', v: 'BDT 52,400' },
                  { k: 'CPA bonuses', v: 'BDT 24,000' },
                  { k: 'Sub-affiliates', v: 'BDT 7,850' },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3.5 py-2.5 text-sm">
                    <span className="text-muted">{r.k}</span>
                    <span className="font-semibold text-white">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ── Stats band ── */}
        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 md:px-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="bg-[linear-gradient(90deg,var(--gold-soft),var(--brand-2-dark))] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Commission plans ── */}
        <section id="plans" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Commission models that reward you</h2>
            <p className="mt-3 text-muted">Choose the structure that fits your traffic. Not sure? Your manager will help you pick the most profitable plan.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-7 ${p.featured ? 'border-[var(--brand)]/50 bg-[linear-gradient(180deg,rgba(255,193,7,0.10),rgba(18,24,41,0.6))] shadow-[0_20px_50px_-20px_rgba(255,193,7,0.5)]' : 'border-white/10 bg-[var(--bg-elevated)]'}`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-3 py-1 text-xs font-bold text-[var(--bg-base)]">{p.tag}</span>
                )}
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <p className="mt-4 text-3xl font-extrabold text-[var(--gold-soft)]">{p.headline}</p>
                <p className="text-sm text-muted">{p.sub}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-white/90">
                      <I.check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-soft)]" /> {pt}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-7 block rounded-xl px-5 py-3 text-center text-sm font-bold transition-transform hover:-translate-y-0.5 ${p.featured ? 'bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] text-[var(--bg-base)]' : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Why partners choose us</h2>
            <p className="mt-3 text-muted">Everything you need to promote with confidence and get paid on time.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="group rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--brand)]/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand)]/12 text-[var(--gold-soft)]">
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Start earning in 4 steps</h2>
            <p className="mt-3 text-muted">From sign-up to your first payout — the whole process is fast and free.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6">
                <span className="bg-[linear-gradient(90deg,var(--gold-soft),var(--brand-2-dark))] bg-clip-text text-4xl font-extrabold text-transparent">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="mx-auto max-w-7xl px-5 pb-8 md:px-8 md:pb-16">
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,193,7,0.08),rgba(230,57,70,0.06))] p-8 md:p-12">
            <div className="flex text-[var(--gold-soft)]">{[0, 1, 2, 3, 4].map((i) => <I.star key={i} className="h-5 w-5" />)}</div>
            <p className="mt-5 max-w-3xl text-xl font-medium leading-relaxed text-white md:text-2xl">
              &ldquo;Switching to this program doubled my monthly income within a quarter. Payouts are always on time
              and the dashboard makes tracking effortless.&rdquo;
            </p>
            <p className="mt-5 text-sm text-muted">— Affiliate partner, iGaming marketer</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/10 bg-[var(--bg-elevated)] p-5 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between text-base font-semibold text-white marker:content-none">
                  {f.q}
                  <span className="ml-4 text-[var(--gold-soft)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
          <div className="overflow-hidden rounded-3xl border border-[var(--brand)]/30 bg-[linear-gradient(135deg,var(--bg-surface),var(--bg-elevated))] p-10 text-center md:p-16">
            <h2 className="text-3xl font-extrabold md:text-5xl">Ready to start earning?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">Join thousands of partners growing their income with {brandName}. It&apos;s free, fast and built to pay you on time.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-8 py-4 text-[1rem] font-bold !text-[var(--bg-base)] shadow-[0_12px_30px_-10px_rgba(255,193,7,0.7)] transition-transform hover:-translate-y-0.5">
                Create your partner account
              </Link>
              <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-center text-xs text-muted md:flex-row md:px-8 md:text-left">
            <div className="flex items-center gap-3">
                            <BrandLockup className="h-7 w-auto object-contain opacity-90" />
              <span>Affiliate Program</span>
            </div>
            <p>© {new Date().getFullYear()} {tenant.name}. Partners must be 18+. Play and promote responsibly. Terms apply.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

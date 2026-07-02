/**
 * Affiliate portal registration. Attractive two-column layout with a country
 * dropdown and an international phone (dial-code selector + number). Creates an
 * affiliate-role account, then routes into onboarding (email + phone + KYC).
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { ApiRequestError } from '@/lib/api';
import { COUNTRIES, flagEmoji } from '@/lib/countries';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/card-badge-label';

const PERKS = [
  'Up to 50% lifetime revenue share',
  'Real-time tracking & transparent stats',
  'Fast, reliable weekly payouts',
  'Dedicated affiliate manager',
];

export default function AffiliateRegisterPage() {
  const { register } = useAffiliateAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', username: '', email: '',
    country: 'BD', dialCode: '+880', phoneNumber: '',
    password: '', confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedCountries = useMemo(() => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []);
  const dialOptions = useMemo(
    () => [...COUNTRIES].sort((a, b) => Number(a.dial.slice(1)) - Number(b.dial.slice(1))),
    [],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Picking a country auto-fills its dial code (still editable).
  const onCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = e.target.value;
    const c = COUNTRIES.find((x) => x.iso === iso);
    setForm((f) => ({ ...f, country: iso, dialCode: c ? c.dial : f.dialCode }));
  };

  const field = 'h-11 border-white/10 bg-[var(--bg-base)]';
  const selectCls = 'h-11 rounded-md border border-white/10 bg-[var(--bg-base)] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.phoneNumber.trim()) { setError('Please enter your phone number.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const phone = `${form.dialCode}${form.phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '')}`;
      await register({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        phone,
        fullName: form.fullName.trim() || undefined,
        country: form.country || undefined,
        tenantSlug: tenant.slug || undefined,
      });
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="mx-auto grid min-h-screen max-w-6xl items-stretch gap-0 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden rounded-r-3xl border-r border-white/10 bg-[linear-gradient(160deg,rgba(255,193,7,0.12),rgba(230,57,70,0.08)_55%,transparent)] p-10 lg:flex">
          <Link href="/" className="flex flex-col items-start gap-1.5">
                        <BrandLockup className="h-10 w-auto object-contain" />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--gold-soft)]">PARTNERS</span>
          </Link>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">
              Join the {tenant.name} <span className="bg-[linear-gradient(90deg,var(--gold-soft),var(--brand-2-dark))] bg-clip-text text-transparent">Partner Program</span>
            </h2>
            <p className="mt-3 max-w-sm text-muted">Turn your audience into recurring income with industry-leading commissions and on-time payouts.</p>
            <ul className="mt-7 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)]/15 text-[var(--gold-soft)]">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="text-[var(--gold-soft)]">★★★★★</span> Trusted by <span className="font-semibold text-white">2,000+</span> partners
          </div>
        </div>

        {/* Right form */}
        <div className="flex items-center justify-center px-4 py-10 md:px-8">
          <div className="w-full max-w-md">
            <div className="mb-5 flex flex-col items-center text-center lg:hidden">
              <Link href="/">
                                <BrandLockup className="h-11 w-auto object-contain" />
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-7 shadow-2xl backdrop-blur md:p-8">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="mt-1 text-sm text-muted">It&apos;s free — start earning in minutes.</p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName" className="text-white/80">Full name</Label>
                  <Input id="fullName" value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="Jane Partner" className={field} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username" className="text-white/80">Username</Label>
                  <Input id="username" value={form.username} onChange={set('username')} required autoComplete="username" placeholder="janepartner" className={field} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" placeholder="jane@example.com" className={field} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="country" className="text-white/80">Country</Label>
                  <select id="country" value={form.country} onChange={onCountry} className={selectCls}>
                    <option value="" className="bg-[var(--bg-elevated)]">Select your country</option>
                    {sortedCountries.map((c) => (
                      <option key={c.iso} value={c.iso} className="bg-[var(--bg-elevated)]">{flagEmoji(c.iso)} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phoneNumber" className="text-white/80">Phone number</Label>
                  <div className="flex gap-2">
                    <select aria-label="Dial code" value={form.dialCode} onChange={set('dialCode')} className={`${selectCls} w-32 shrink-0`}>
                      {dialOptions.map((c) => (
                        <option key={`${c.iso}${c.dial}`} value={c.dial} className="bg-[var(--bg-elevated)]">{flagEmoji(c.iso)} {c.dial}</option>
                      ))}
                    </select>
                    <Input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} required inputMode="numeric" autoComplete="tel-national" placeholder="1XXXXXXXXX" className={`${field} flex-1`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password" className="text-white/80">Password</Label>
                    <Input id="password" type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" placeholder="••••••••" className={field} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm" className="text-white/80">Confirm</Label>
                    <Input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" placeholder="••••••••" className={field} />
                  </div>
                </div>
                {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
                <button type="submit" disabled={loading} className="mt-2 h-11 rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] font-bold text-[var(--bg-base)] shadow-[0_10px_24px_-10px_rgba(255,193,7,0.7)] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                  {loading ? 'Creating account…' : 'Create affiliate account'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted">
                Already a partner?{' '}
                <Link href="/login" className="font-semibold text-[var(--gold-soft)] hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

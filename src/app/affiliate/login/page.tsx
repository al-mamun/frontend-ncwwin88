/**
 * Affiliate portal sign-in. Affiliate-surface session (separate from players).
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { ApiRequestError } from '@/lib/api';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/card-badge-label';

export default function AffiliateLoginPage() {
  const { login } = useAffiliateAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/">
                        <BrandLockup className="h-12 w-auto object-contain" />
          </Link>
          <span className="mt-3 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--gold-soft)]">PARTNER PORTAL</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-7 shadow-2xl backdrop-blur md:p-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your affiliate dashboard.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier" className="text-white/80">Username or Email</Label>
              <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" placeholder="you@example.com" className="h-11 border-white/10 bg-[var(--bg-base)]" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className="h-11 border-white/10 bg-[var(--bg-base)]" />
            </div>
            {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
            <button type="submit" disabled={loading} className="mt-2 h-11 rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] font-bold text-[var(--bg-base)] shadow-[0_10px_24px_-10px_rgba(255,193,7,0.7)] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            New partner?{' '}
            <Link href="/register" className="font-semibold text-[var(--gold-soft)] hover:underline">Become an affiliate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

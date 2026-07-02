/**
 * Forgot / reset password page (public).
 *
 * Step 1: enter username/email/phone -> requests a 6-digit code (sent to the
 *         account's email or phone). Response is always generic (no account
 *         enumeration).
 * Step 2: enter the code + a new password -> resets it, then redirects to login.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLockup from '@/components/shared/brand-lockup';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { authApi } from '@/services/auth.service';
import { ApiRequestError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-badge-label';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { user, loading: authLoading } = useAuth();

  // Already signed in? No need to reset.
  useEffect(() => { if (!authLoading && user) router.replace('/'); }, [authLoading, user, router]);

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      await authApi.forgotPassword(identifier.trim());
      setStep('reset');
      setInfo('If an account exists for that username, we sent a 6-digit code to its email or phone. Enter it below with your new password.');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null);
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 6 characters and include a letter and a number.'); return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({ identifier: identifier.trim(), code: code.trim(), newPassword: password });
      router.replace('/login?reset=1');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not reset the password. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" aria-label={`${tenant.name} home`} className="mx-auto mb-4 inline-block">
            <BrandLockup className="h-10 w-auto object-contain" />
          </Link>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {step === 'request'
              ? 'Enter your username, email, or phone to receive a reset code.'
              : 'Enter the code we sent and choose a new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {info && (
            <p className="mb-4 rounded-md border border-gold-soft/30 bg-gold-soft/5 px-3 py-2 text-xs font-medium text-gold-soft">{info}</p>
          )}
          {error && (
            <p className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          {step === 'request' ? (
            <form onSubmit={requestCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="identifier">Username / Email / Phone</Label>
                <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
              </div>
              <Button type="submit" disabled={busy || !identifier.trim()}>{busy ? 'Sending…' : 'Send reset code'}</Button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Reset code</Label>
                <Input id="code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
              </div>
              <Button type="submit" disabled={busy || !code.trim() || !password}>{busy ? 'Resetting…' : 'Reset password'}</Button>
              <button type="button" onClick={() => { setStep('request'); setError(null); setInfo(null); }} className="text-xs text-muted hover:text-gold-soft">
                ← Use a different account
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Remembered it? <Link href="/login" className="font-semibold text-gold-soft hover:underline">Back to login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

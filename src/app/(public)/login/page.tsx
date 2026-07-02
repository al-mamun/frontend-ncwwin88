/**
 * Login — page version of the login popup (same fields + look).
 * Username/Email + Password. Redirects home on success; already-signed-in users
 * are redirected away.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLockup from '@/components/shared/brand-lockup';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { ApiRequestError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && user) router.replace('/'); }, [authLoading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) { setError('Please enter your username and password.'); return; }
    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const wrap: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-base, #0f1419)' };
  const card: React.CSSProperties = { width: '100%', maxWidth: '420px', background: 'var(--bg-surface, #1a2744)', border: '1px solid var(--border, #2a3552)', borderRadius: '14px', overflow: 'hidden' };
  const submitBtn: React.CSSProperties = { width: '100%', marginTop: '8px', padding: '13px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '15px', color: 'var(--brand-fg, #0d0d0d)', background: 'linear-gradient(180deg, var(--accent, #f4d03f), var(--brand, #d4af37))' };

  return (
    <div style={wrap}>
      <div style={card}>
        <div className="auth-modal__header">
          <span className="auth-modal__title">Login</span>
          <Link href="/" className="auth-modal__close" aria-label="Close">&times;</Link>
        </div>
        <div className="auth-modal__body">
          <div className="auth-modal__logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BrandLockup className="h-10 w-auto object-contain" />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="auth-panel">
              <div className="auth-field">
                <label>Username</label>
                <div className="auth-input">
                  <input type="text" placeholder="Username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
                </div>
              </div>
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>&#128065;</button>
                </div>
              </div>
            </div>
            <button type="submit" style={submitBtn} disabled={submitting}>{submitting ? 'Signing in…' : 'Login'}</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '13px' }}>
              <Link href="/forgot-password" style={{ color: 'var(--text-muted, #8b92a8)' }}>Forgot password?</Link>
              <Link href="/register" style={{ color: 'var(--gold-soft, #f4d03f)', fontWeight: 700 }}>Create account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

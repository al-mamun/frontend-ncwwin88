/**
 * Player registration — page version of the signup popup (same fields + look).
 * Username · Phone (+880) · Password · Confirm · Referral · Captcha (when the
 * tenant enables it). Auto-logs-in on success and redirects home.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLockup from '@/components/shared/brand-lockup';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { ApiRequestError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const captchaOn = tenant.signupCaptchaEnabled !== false;

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genCaptcha = () => setGeneratedCaptcha(Math.floor(1000 + Math.random() * 9000).toString());
  useEffect(() => { genCaptcha(); }, []);
  useEffect(() => { if (!authLoading && user) router.replace('/'); }, [authLoading, user, router]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    let c = (p.get('ref') || p.get('aff') || '').trim();
    if (!c) {
      c = (localStorage.getItem(`sp_aff_ref_${tenant.slug}`) || '').trim();
    }
    if (c) setReferralCode(c.toUpperCase());
  }, [tenant.slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = username.trim();
    if (!u || !password || !confirmPassword || !phone.trim()) { setError('Please fill in all required fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be 6–20 characters and include a letter and a number.'); return;
    }
    if (captchaOn && captcha.trim() !== generatedCaptcha) { setError('Incorrect verification code.'); genCaptcha(); setCaptcha(''); return; }
    let cp = phone.trim(); if (cp.startsWith('0')) cp = cp.substring(1);
    const fullPhone = cp ? `+880${cp}` : undefined;
    setSubmitting(true);
    try {
      await register({ username: u, password, phone: fullPhone, referralCode: referralCode.trim() || undefined, tenantSlug: tenant.slug || undefined });
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed. Please try again.');
      if (captchaOn) { genCaptcha(); setCaptcha(''); }
    } finally { setSubmitting(false); }
  };

  const wrap: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-base, #0f1419)' };
  const card: React.CSSProperties = { width: '100%', maxWidth: '460px', background: 'var(--bg-surface, #1a2744)', border: '1px solid var(--border, #2a3552)', borderRadius: '14px', overflow: 'hidden' };
  const submitBtn: React.CSSProperties = { width: '100%', marginTop: '8px', padding: '13px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '15px', color: 'var(--brand-fg, #0d0d0d)', background: 'linear-gradient(180deg, var(--accent, #f4d03f), var(--brand, #d4af37))' };

  return (
    <div style={wrap}>
      <div style={card}>
        <div className="auth-modal__header">
          <span className="auth-modal__title">Sign up</span>
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
                  <input type="text" placeholder="4-16 Characters or Number" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" />
                </div>
              </div>
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input">
                  <input type={showPassword ? 'text' : 'password'} placeholder="6-20 characters and numbers" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>&#128065;</button>
                </div>
              </div>
              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="auth-input">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <div className="auth-field">
                <label>Referral Code (Optional)</label>
                <div className="auth-input">
                  <input type="text" placeholder="Optional referral code" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} autoComplete="off" />
                </div>
              </div>
              <ul className="auth-hints">
                <li><span className="auth-hints__check">&#10003;</span> Between 6~20 characters.</li>
                <li><span className="auth-hints__check">&#10003;</span> At least one alphabet.</li>
                <li><span className="auth-hints__check">&#10003;</span> At least one number.</li>
              </ul>
            </div>

            <div className="auth-panel">
              <div className="auth-field">
                <label>Phone Number</label>
                <div className="auth-phone">
                  <div className="auth-phone__code"><span className="cur-flag fi fi-bd"></span> +880</div>
                  <div className="auth-input">
                    <input type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </div>
              </div>
              {captchaOn && (
                <div className="auth-field">
                  <label>Verification Code</label>
                  <div className="auth-captcha">
                    <div className="auth-input">
                      <input type="text" maxLength={4} placeholder="Enter 4 Digit Code" value={captcha} onChange={(e) => setCaptcha(e.target.value)} required />
                    </div>
                    <div className="auth-captcha__code">{generatedCaptcha}</div>
                    <button type="button" className="auth-captcha__refresh" onClick={genCaptcha}>&#8635;</button>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" style={submitBtn} disabled={submitting}>{submitting ? 'Creating…' : 'Sign up'}</button>
            <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--text-muted, #8b92a8)' }}>
              Already have an account? <Link href="/login" style={{ color: 'var(--gold-soft, #f4d03f)', fontWeight: 700 }}>Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

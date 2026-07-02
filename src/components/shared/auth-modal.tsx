'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { ApiRequestError } from '@/lib/api';

export function AuthModal() {
  const { login, register, user } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mode = searchParams.get('auth'); // 'login' | 'register'
  const isOpen = (mode === 'login' || mode === 'register') && !user;

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Sync tab state with URL mode
  useEffect(() => {
    if (mode === 'login' || mode === 'register') {
      setTab(mode);
    }
  }, [mode]);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [username, setUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [phone, setPhone] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate captcha code
  const generateCaptchaCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCaptcha(code);
  };

  // Generate captcha when registration tab is shown
  useEffect(() => {
    if (isOpen && tab === 'register') {
      generateCaptchaCode();
    }
  }, [isOpen, tab]);

  // Prefill referral code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = (params.get('ref') || params.get('aff') || '').trim();
      if (code) setReferralCode(code.toUpperCase());
    }
  }, []);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('auth');
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`${pathname}${query}`, { scroll: false });
    setError(null);
  };

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', newTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ identifier, password: loginPassword });
      handleClose();
      // Clean form
      setIdentifier('');
      setLoginPassword('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !registerPassword || !confirmPassword || !phone.trim() || (tenant.signupCaptchaEnabled !== false && !captcha.trim())) {
      setError('Please fill in all required fields.');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (tenant.signupCaptchaEnabled !== false && captcha.trim() !== generatedCaptcha) {
      setError('Verification code is incorrect. Please try again.');
      generateCaptchaCode();
      setCaptcha('');
      return;
    }

    let cleanPhone = phone.trim();
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    const fullPhone = cleanPhone ? `+880${cleanPhone}` : undefined;

    setLoading(true);
    try {
      await register({
        username: trimmedUsername,
        password: registerPassword,
        phone: fullPhone,
        referralCode: referralCode.trim() || undefined,
        tenantSlug: tenant.slug || undefined,
      });
      handleClose();
      // Clean form
      setUsername('');
      setRegisterPassword('');
      setConfirmPassword('');
      setPhone('');
      setCaptcha('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Registration failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = tenant.logoUrl || '/assets/images/logo/logo.webp';

  return (
    <>
      {/* Modal overlay */}
      <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose} />

      {/* Register Modal */}
      <div className={`auth-modal ${isOpen && tab === 'register' ? 'open' : ''}`} id="registerModal" role="dialog" aria-label="Sign up">
        <div className="auth-modal__header">
          <span className="auth-modal__title">Sign up</span>
          <button type="button" className="auth-modal__close" onClick={handleClose} aria-label="Close">&times;</button>
        </div>
        <div className="auth-modal__body">
          <div className="auth-modal__logo">
            <img className="brand-logo" src={logoSrc} alt="Logo" />
          </div>

          {error && tab === 'register' && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <div className="auth-panel">
              <div className="auth-field">
                <label>Username</label>
                <div className="auth-input">
                  <input
                    type="text"
                    placeholder="4-16 Characters or Number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  {username && (
                    <button type="button" className="auth-input__clear" onClick={() => setUsername('')}>
                      &#10006;
                    </button>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6-20 characters and numbers"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                  {registerPassword && (
                    <button type="button" className="auth-input__clear" onClick={() => setRegisterPassword('')}>
                      &#10006;
                    </button>
                  )}
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>
                    &#128065;
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="auth-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && (
                    <button type="button" className="auth-input__clear" onClick={() => setConfirmPassword('')}>
                      &#10006;
                    </button>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <label>Referral Code (Optional)</label>
                <div className="auth-input">
                  <input
                    type="text"
                    placeholder="Optional referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    autoComplete="off"
                  />
                  {referralCode && (
                    <button type="button" className="auth-input__clear" onClick={() => setReferralCode('')}>
                      &#10006;
                    </button>
                  )}
                </div>
              </div>

              <ul className="auth-hints">
                <li><span className="auth-hints__check">&#10003;</span> Between 6~20 characters.</li>
                <li><span className="auth-hints__check">&#10003;</span> At least one alphabet.</li>
                <li><span className="auth-hints__check">&#10003;</span> At least one number. (Special character, symbols are allowed)</li>
              </ul>
            </div>

            <div className="auth-panel">
              <div className="auth-field">
                <label>Phone Number</label>
                <div className="auth-phone">
                  <div className="auth-phone__code">
                    <span className="cur-flag fi fi-bd"></span> +880
                  </div>
                  <div className="auth-input">
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    {phone && (
                      <button type="button" className="auth-input__clear" onClick={() => setPhone('')}>
                        &#10006;
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {tenant.signupCaptchaEnabled !== false && (
              <div className="auth-field">
                <label>Verification Code</label>
                <div className="auth-captcha">
                  <div className="auth-input">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Enter 4 Digit Code"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-captcha__code">{generatedCaptcha}</div>
                  <button type="button" className="auth-captcha__refresh" onClick={generateCaptchaCode}>
                    &#8635;
                  </button>
                </div>
              </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={`btn full auth-submit ${loading ? 'auth-submit--disabled' : ''}`}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>

          <p className="auth-foot">
            Already a member ?{' '}
            <a href="#" className="js-switch-login" onClick={(e) => { e.preventDefault(); handleTabChange('login'); }}>
              Log in
            </a>
          </p>
          <p className="auth-terms">
            I certify that I am at least 18 years old and that I agree to the{' '}
            <a href="/pages/terms">Terms &amp; Conditions</a>
          </p>
        </div>
      </div>

      {/* Login Modal */}
      <div className={`auth-modal ${isOpen && tab === 'login' ? 'open' : ''}`} id="loginModal" role="dialog" aria-label="Login">
        <div className="auth-modal__header">
          <span className="auth-modal__title">Login</span>
          <button type="button" className="auth-modal__close" onClick={handleClose} aria-label="Close">&times;</button>
        </div>
        <div className="auth-modal__body">
          <div className="auth-modal__logo">
            <img className="brand-logo" src={logoSrc} alt="Logo" />
          </div>

          {error && tab === 'login' && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="auth-panel">
              <div className="auth-field">
                <label>Username</label>
                <div className="auth-input">
                  <input
                    type="text"
                    placeholder="4-16 Characters or Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                  {identifier && (
                    <button type="button" className="auth-input__clear" onClick={() => setIdentifier('')}>
                      &#10006;
                    </button>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6-20 characters and numbers"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  {loginPassword && (
                    <button type="button" className="auth-input__clear" onClick={() => setLoginPassword('')}>
                      &#10006;
                    </button>
                  )}
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>
                    &#128065;
                  </button>
                </div>
              </div>

              <div className="auth-forgot">
                <a href="/forgot-password">Forgot password?</a>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`btn btn--primary full auth-submit ${loading ? 'auth-submit--disabled' : ''}`}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-foot">
            Do not have an account?{' '}
            <a href="#" className="js-switch-register" onClick={(e) => { e.preventDefault(); handleTabChange('register'); }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default AuthModal;

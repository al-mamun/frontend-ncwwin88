/**
 * PWA — registers the service worker and shows a small "Install app" prompt.
 *
 * Two independent switches:
 *   1. NEXT_PUBLIC_PWA=on (deploy-gated) — registers the service worker. Off by
 *      default because a bad SW can serve stale HTML, so it must be tested per site.
 *   2. tenant.pwaInstallEnabled (dashboard-controlled) — shows/hides the "Install
 *      app" banner. Defaults to true; a tenant can turn the banner off from their
 *      dashboard without a redeploy. The SW still registers when env is on.
 *
 * The manifest (src/app/manifest.ts) is always served regardless.
 *
 * Drop <PWA/> once in the root layout. It renders nothing unless the browser fires
 * `beforeinstallprompt` (Android/desktop Chrome), the tenant allows the banner, and
 * the user hasn't dismissed it.
 */
'use client';

import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const ENABLED = process.env.NEXT_PUBLIC_PWA !== 'off';
const DISMISS_KEY = 'pwa_install_dismissed';

/**
 * @param installBanner  Tenant's `pwaInstallEnabled` (default true). Passed from the
 *   server layout (which already has the tenant) so this component needs no context
 *   and can live outside the providers tree. Controls the banner only — the service
 *   worker registers by default on every site (set NEXT_PUBLIC_PWA=off to disable).
 */
export function PWA({ installBanner = true }: { installBanner?: boolean }) {
  // Banner is on unless the tenant explicitly disabled it in their dashboard.
  const bannerAllowed = installBanner !== false;

  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ENABLED || typeof window === 'undefined') return;

    // Register the SW (deploy-gated only — independent of the banner toggle).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture the install prompt (only surfaced when the tenant allows the banner).
    const onBIP = (e: Event) => {
      e.preventDefault();
      if (!bannerAllowed) return;
      if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, [bannerAllowed]);

  if (!ENABLED || !bannerAllowed || !show || !deferred) return null;

  const install = async () => {
    setShow(false);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch { /* ignore */ }
    setDeferred(null);
  };

  const dismiss = () => {
    setShow(false);
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div
      role="dialog"
      aria-label="Install app"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 130,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-2, #1a1a1a)', color: 'var(--text, #fff)',
        border: '1px solid var(--line, rgba(255,255,255,.12))', borderRadius: 12,
        padding: '10px 12px', boxShadow: '0 8px 26px rgba(0,0,0,.4)', maxWidth: 460, margin: '0 auto',
      }}
    >
      <span style={{ flex: 1, fontSize: 13 }}>Install the app for a faster, full-screen experience.</span>
      <button onClick={dismiss} style={{ fontSize: 13, color: 'var(--text-dim, #9aa)', background: 'none', border: 'none', padding: '6px 8px' }}>Not now</button>
      <button
        onClick={install}
        style={{ fontSize: 13, fontWeight: 700, color: '#2a1e00', background: 'var(--lux, var(--gold, #d4af37))', border: 'none', borderRadius: 8, padding: '7px 14px' }}
      >
        Install
      </button>
    </div>
  );
}

export default PWA;

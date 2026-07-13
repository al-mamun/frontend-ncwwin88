/**
 * AppInstall — renders the tenant's chosen app-install presentations (banner and/or
 * popup). The persistent BUTTON presentation is rendered by each theme via useGetApp()
 * (e.g. the FloatingRail "Install APP" card), gated on appInstallModes().includes('button').
 *
 * This component owns the BANNER + POPUP presentations. All three call the same
 * useGetApp() engine, so the action (APK link → PWA install → iOS "Add to Home Screen"
 * hint) is identical regardless of how it is presented.
 *
 * Rendered inside the providers tree (see src/app/providers.tsx) so it has tenant +
 * react context. Renders nothing when the relevant mode isn't set or there's nothing
 * to install (useGetApp().available === false).
 */
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useGetApp } from '../../core/pwa/useGetApp';
import { appInstallModes } from '../../core/pwa/appInstallModes';
import { IosInstallHint } from './ios-install-hint';

const BANNER_DISMISS_KEY = 'app_install_banner_dismissed';
const POPUP_DISMISS_KEY = 'app_install_popup_dismissed';

export function AppInstall() {
  const { tenant } = useTenant();
  const app = useGetApp();
  const modes = appInstallModes(tenant);

  const wantBanner = modes.includes('banner');
  const wantPopup = modes.includes('popup');

  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  // Read dismissal flags on mount (client only, so SSR renders nothing).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setBannerDismissed(window.localStorage.getItem(BANNER_DISMISS_KEY) === '1');
    } catch {
      setBannerDismissed(false);
    }
  }, []);

  // Popup: show once, ~2s after mount, unless previously dismissed this browser.
  useEffect(() => {
    if (!wantPopup || !app.available) return;
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(POPUP_DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setPopupOpen(true), 2000);
    return () => window.clearTimeout(t);
  }, [wantPopup, app.available]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const dismissPopup = () => {
    setPopupOpen(false);
    try {
      window.localStorage.setItem(POPUP_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const showBanner = wantBanner && app.available && !bannerDismissed;

  return (
    <>
      {showBanner ? (
        <div
          role="dialog"
          aria-label="Install app"
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-2, var(--surface, #1a1a1a))',
            color: 'var(--text, #fff)',
            border: '1px solid var(--line, rgba(255,255,255,.12))',
            borderRadius: 12,
            padding: '10px 12px',
            boxShadow: '0 8px 26px rgba(0,0,0,.4)',
            maxWidth: 460,
            margin: '0 auto',
          }}
        >
          <span style={{ flex: 1, fontSize: 13 }}>
            {app.label} for a faster, full-screen experience.
          </span>
          <button
            onClick={dismissBanner}
            style={{ fontSize: 13, color: 'var(--text-dim, #9aa)', background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer' }}
          >
            Not now
          </button>
          <button
            onClick={app.trigger}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--brand-fg, #2a1e00)',
              background: 'var(--lux, var(--gold, #d4af37))',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            {app.label}
          </button>
        </div>
      ) : null}

      {popupOpen && app.available ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Get the app"
          onClick={dismissPopup}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,.55)',
            padding: 'env(safe-area-inset-top) 12px calc(16px + env(safe-area-inset-bottom))',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--surface, #16181d)',
              color: 'var(--text, #fff)',
              border: '1px solid var(--line, rgba(255,255,255,.12))',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 12px 40px rgba(0,0,0,.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <strong style={{ fontSize: 16 }}>Get the {tenant.name} app</strong>
              <button
                onClick={dismissPopup}
                aria-label="Close"
                style={{ background: 'none', border: 'none', color: 'var(--text-dim, #9aa)', cursor: 'pointer', padding: 4 }}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim, #cbd)', marginBottom: 16 }}>
              Install {tenant.name} for a faster, full-screen experience with quick access from your home screen.
            </p>
            <button
              onClick={() => {
                dismissPopup();
                app.trigger();
              }}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--brand-fg, #2a1e00)',
                background: 'var(--lux, var(--gold, #d4af37))',
              }}
            >
              {app.label}
            </button>
            <button
              onClick={dismissPopup}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-dim, #9aa)',
                background: 'none',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      ) : null}

      {/* iOS "Add to Home Screen" hint — shown by any banner/popup/button trigger on iOS. */}
      <IosInstallHint open={app.iosHintOpen} onClose={app.closeIosHint} appName={tenant.name} />
    </>
  );
}

export default AppInstall;

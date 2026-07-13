/**
 * AppInstall — optional POPUP presentation only (tenant appInstallModes includes
 * 'popup'; off by default). The persistent install UI is the footer banner
 * (FooterAppInstall) + theme buttons — all via the same useGetApp() engine.
 * No fixed/sticky banner is rendered here.
 */
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useGetApp } from '../../core/pwa/useGetApp';
import { appInstallModes } from '../../core/pwa/appInstallModes';
import { IosInstallHint } from './ios-install-hint';

const POPUP_DISMISS_KEY = 'app_install_popup_dismissed';

export function AppInstall() {
  const { tenant } = useTenant();
  const app = useGetApp();
  const wantPopup = appInstallModes(tenant).includes('popup');
  const [popupOpen, setPopupOpen] = useState(false);

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

  const dismissPopup = () => {
    setPopupOpen(false);
    try {
      window.localStorage.setItem(POPUP_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {popupOpen && app.available ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Get the app"
          onClick={dismissPopup}
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', padding: 'env(safe-area-inset-top) 12px calc(16px + env(safe-area-inset-bottom))' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: 'var(--surface, #16181d)', color: 'var(--text, #fff)', border: '1px solid var(--line, rgba(255,255,255,.12))', borderRadius: 16, padding: 20, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <strong style={{ fontSize: 16 }}>Get the {tenant.name} app</strong>
              <button onClick={dismissPopup} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-dim, #9aa)', cursor: 'pointer', padding: 4 }}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim, #cbd)', marginBottom: 16 }}>
              Install {tenant.name} for a faster, full-screen experience with quick access from your home screen.
            </p>
            <button
              onClick={() => { dismissPopup(); app.trigger(); }}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--brand-fg, #2a1e00)', background: 'var(--lux, var(--gold, #d4af37))' }}
            >
              {app.label}
            </button>
            <button
              onClick={dismissPopup}
              style={{ marginTop: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-dim, #9aa)', background: 'none' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      ) : null}

      <IosInstallHint open={app.iosHintOpen} onClose={app.closeIosHint} appName={tenant.name} />
    </>
  );
}

export default AppInstall;

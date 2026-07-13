/**
 * FooterAppInstall — a full-width "install our app" banner section that sits at the
 * top of the site footer (not a popup). Uses the shared useGetApp engine: an
 * APK/store link if the tenant set one, else the browser PWA install prompt, else
 * an iOS "Add to Home Screen" hint. Renders nothing when there is nothing to
 * install. This is the footer's PWA install entry point.
 */
'use client';

import { Smartphone, Download } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useGetApp } from '../../core/pwa/useGetApp';
import { IosInstallHint } from './ios-install-hint';

export default function FooterAppInstall() {
  const { tenant } = useTenant();
  const app = useGetApp();
  if (!app.available) return null;
  const label = app.mode === 'download' ? 'Download App' : 'Install App';
  const btnClass =
    'inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition hover:opacity-90';
  return (
    <>
      <section className="w-full border-t border-border bg-elevated/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-2/15 text-brand-2">
              <Smartphone className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-base font-extrabold text-[var(--text-primary,#fff)]">Get the {tenant.name} App</p>
              <p className="mt-0.5 text-xs text-muted sm:text-sm">Install for a faster, full-screen experience with one-tap access from your home screen.</p>
            </div>
          </div>
          {app.mode === 'download' && app.href ? (
            <a href={app.href} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label={label}>
              <Download className="h-4 w-4" aria-hidden /> {label}
            </a>
          ) : (
            <button type="button" onClick={app.trigger} className={btnClass} aria-label={label}>
              <Download className="h-4 w-4" aria-hidden /> {label}
            </button>
          )}
        </div>
      </section>
      <IosInstallHint open={app.iosHintOpen} onClose={app.closeIosHint} appName={tenant.name} />
    </>
  );
}

/**
 * FooterAppInstall — an install-app banner shown at the top of the footer (not a
 * popup, not sticky). Constrained to the site content container width (max-w-7xl),
 * centered — NOT full screen width. Uses useGetApp (APK/store link, PWA install
 * prompt, or iOS hint) and renders only when something is installable. If the
 * tenant set a PWA banner image (profile → Install app), it is the card background.
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
  const bannerImg = tenant.pwaBannerUrl || null;
  const btnClass =
    'inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition hover:opacity-90';
  const titleCls = bannerImg ? 'text-base font-extrabold text-white' : 'text-base font-extrabold text-[var(--text-primary,#fff)]';
  const subCls = bannerImg ? 'mt-0.5 text-xs text-white/80 sm:text-sm' : 'mt-0.5 text-xs text-muted sm:text-sm';
  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4">
        <section
          className="relative overflow-hidden rounded-2xl border border-border bg-elevated/70 shadow-sm"
          style={bannerImg ? { backgroundImage: `url(${bannerImg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {bannerImg ? <div className="absolute inset-0 bg-black/55" aria-hidden /> : null}
          <div className="relative flex flex-col items-center gap-4 px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-2/15 text-brand-2">
                <Smartphone className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className={titleCls}>Get the {tenant.name} App</p>
                <p className={subCls}>Install for a faster, full-screen experience with one-tap access from your home screen.</p>
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
      </div>
      <IosInstallHint open={app.iosHintOpen} onClose={app.closeIosHint} appName={tenant.name} />
    </>
  );
}

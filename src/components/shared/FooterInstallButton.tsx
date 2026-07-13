/**
 * FooterInstallButton — compact PWA install button that replaces static
 * "Download for Android" style app-download badges in the footer. Uses useGetApp
 * (APK/store link, PWA install prompt, or iOS hint); hidden when nothing installable.
 */
'use client';

import { Download } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useGetApp } from '../../core/pwa/useGetApp';
import { IosInstallHint } from './ios-install-hint';

export default function FooterInstallButton() {
  const { tenant } = useTenant();
  const app = useGetApp();
  if (!app.available) return null;
  const label = app.mode === 'download' ? 'Download App' : 'Install App';
  const cls = 'inline-flex items-center gap-2 rounded-lg bg-brand-2 px-4 py-2.5 text-sm font-bold text-white shadow ring-1 ring-white/10 transition hover:opacity-90';
  return (
    <>
      {app.mode === 'download' && app.href ? (
        <a href={app.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label}>
          <Download className="h-4 w-4" aria-hidden /> {label}
        </a>
      ) : (
        <button type="button" onClick={app.trigger} className={cls} aria-label={label}>
          <Download className="h-4 w-4" aria-hidden /> {label}
        </button>
      )}
      <IosInstallHint open={app.iosHintOpen} onClose={app.closeIosHint} appName={tenant.name} />
    </>
  );
}

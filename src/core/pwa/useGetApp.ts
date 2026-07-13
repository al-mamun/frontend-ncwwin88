/**
 * useGetApp — one smart "Get the app" decision for the whole site, so themes render
 * a SINGLE app button instead of competing "Download APK" + "Install PWA" affordances.
 *
 * Priority:
 *   1. download  — the tenant configured a real APK / store link (tenant.appDownloadUrl,
 *      env NEXT_PUBLIC_APP_DOWNLOAD_URL fallback). Rendered as an external link.
 *   2. install   — no APK link, but the browser can install the PWA (beforeinstallprompt
 *      fired). trigger() shows the native install prompt.
 *   3. ios       — iOS Safari (no beforeinstallprompt) and not already installed.
 *      trigger() opens the "Add to Home Screen" hint (see <IosInstallHint/>).
 *   4. none      — nothing to offer (desktop, not installable, no link) → hide the button.
 *
 * The PWA install/ios paths respect tenant.pwaInstallEnabled (owner/tenant can turn the
 * app-install UX off); the APK link is independent and always offered when set.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../tenant/TenantProvider';

const ENV_APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || '';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export type GetAppMode = 'download' | 'install' | 'ios' | 'none';

export interface GetApp {
  mode: GetAppMode;
  /** True when there is something to offer (mode !== 'none'). */
  available: boolean;
  /** Suggested button label for the current mode. */
  label: string;
  /** Set for mode 'download' — the external APK/store URL to link to. */
  href?: string;
  /** For mode 'install' / 'ios' — run the install prompt or open the iOS hint. */
  trigger: () => void;
  iosHintOpen: boolean;
  closeIosHint: () => void;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
  return iOS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useGetApp(): GetApp {
  const { tenant } = useTenant();
  const appUrl = (tenant.appDownloadUrl || ENV_APP_DOWNLOAD_URL || '').trim();
  const pwaAllowed = tenant.pwaInstallEnabled !== false;

  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [iosHintOpen, setIosHintOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIos(isIosSafari() && !isStandalone());
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  const mode: GetAppMode = appUrl
    ? 'download'
    : pwaAllowed && deferred
      ? 'install'
      : pwaAllowed && ios
        ? 'ios'
        : 'none';

  const trigger = useCallback(() => {
    if (appUrl) {
      if (typeof window !== 'undefined') window.open(appUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (deferred) {
      void deferred.prompt().catch(() => undefined);
      setDeferred(null);
      return;
    }
    if (ios) setIosHintOpen(true);
  }, [appUrl, deferred, ios]);

  return {
    mode,
    available: mode !== 'none',
    label: mode === 'download' ? 'Download App' : 'Install App',
    href: mode === 'download' ? appUrl : undefined,
    trigger,
    iosHintOpen,
    closeIosHint: () => setIosHintOpen(false),
  };
}

/**
 * useGetApp — one smart "Get the app" decision for the whole site, so themes render
 * a SINGLE app affordance instead of competing "Download APK" + "Install PWA" buttons.
 *
 * The installer is ALWAYS offered when the tenant allows it (pwaInstallEnabled !== false)
 * or an APK/store link is set. It is NOT hidden just because the browser has not fired
 * beforeinstallprompt yet, or because the app is already installed. Each site is its own
 * origin, so installing one brand's app never affects another brand's button.
 *
 * mode:
 *   download — tenant configured a real APK / store link (tenant.appDownloadUrl or env
 *              NEXT_PUBLIC_APP_DOWNLOAD_URL). Rendered as an external link.
 *   install  — PWA install path. trigger() fires the native prompt when the browser
 *              offered one (beforeinstallprompt); otherwise it opens a short how-to hint
 *              so the affordance still works after install / before the event fires.
 *   ios      — iOS Safari. trigger() opens the "Add to Home Screen" hint.
 *   none     — only when the tenant turned PWA off AND no APK link is set.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../tenant/TenantProvider';

const ENV_APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || '';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export type GetAppMode = 'download' | 'install' | 'ios' | 'none';

export interface GetApp {
  mode: GetAppMode;
  /** True when there is an installer to show (mode !== 'none'). */
  available: boolean;
  /** Suggested button label for the current mode. */
  label: string;
  /** Set for mode 'download' — the external APK/store URL to link to. */
  href?: string;
  /** Run the install prompt, open the store link, or show the how-to hint. */
  trigger: () => void;
  iosHintOpen: boolean;
  closeIosHint: () => void;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
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
    setIos(isIos());
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  // Installer stays available whether or not beforeinstallprompt has fired and whether
  // or not the app is already installed — we never hide it on that basis.
  const mode: GetAppMode = appUrl
    ? 'download'
    : !pwaAllowed
      ? 'none'
      : ios
        ? 'ios'
        : 'install';

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
    // No native prompt to fire (already installed, not yet fired, or unsupported
    // browser) — show the short how-to-install hint instead of doing nothing.
    setIosHintOpen(true);
  }, [appUrl, deferred]);

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

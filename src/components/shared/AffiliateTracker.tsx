'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useAuth } from '../../providers/auth-provider';
import {
  captureAffiliateRef,
  getAffiliateRef,
  clearAffiliateRef,
  trackAffiliateClick,
  trackAffiliateAttribution,
} from '../../lib/affiliate';

/**
 * Invisible affiliate attribution tracker. Mounted once inside the tenant + auth
 * providers. On load it captures a `?ref=CODE` landing param and records a click;
 * when a referred visitor becomes authenticated it attributes a single signup,
 * then clears the stored code so it can't double-count.
 *
 * Redirect behaviour: only redirects to /register when the referral code is
 * present in the CURRENT page URL (?ref= or ?aff=). A code that is only stored
 * in localStorage from a previous visit will NOT trigger a redirect — this
 * prevents the infinite "stuck on register" redirect loop.
 */
export function AffiliateTracker() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const router = useRouter();
  const clickFired = useRef(false);
  const signupFired = useRef(false);

  useEffect(() => {
    // Check the CURRENT URL for a referral code BEFORE calling captureAffiliateRef.
    // captureAffiliateRef falls back to localStorage, so `code` would always be
    // truthy for any page visited while a ref is stored — causing an infinite
    // redirect loop. urlCode is only set on the actual referral landing page.
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get('ref') || params.get('aff') || '').trim().toUpperCase();

    const code = captureAffiliateRef(tenant.slug);

    if (code && !clickFired.current) {
      clickFired.current = true;
      void trackAffiliateClick(code, tenant.slug);
    }

    // Only redirect when the code came from the URL right now (fresh referral
    // click). Do NOT use `code` here — it includes the localStorage fallback
    // and would redirect on every page navigation until the user registers.
    if (urlCode && !user) {
      const path = window.location.pathname;
      if (
        !path.startsWith('/register') &&
        !path.startsWith('/affiliate') &&
        !path.startsWith('/login')
      ) {
        router.replace(`/register?ref=${urlCode}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.slug]);
  // ↑ Intentionally excludes pathname/router/user from deps.
  //   This effect runs ONCE on mount (per tenant). Adding pathname would
  //   re-run it on every navigation, bringing back the redirect loop.

  useEffect(() => {
    if (user && !signupFired.current) {
      const code = getAffiliateRef(tenant.slug);
      if (code) {
        signupFired.current = true;
        // Authenticated attribution links the player to the affiliate (enables
        // commission accrual on future deposits) AND counts the signup.
        void trackAffiliateAttribution(code).finally(() => clearAffiliateRef(tenant.slug));
      }
    }
  }, [user, tenant.slug]);

  return null;
}

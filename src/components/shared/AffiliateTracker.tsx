'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
 */
export function AffiliateTracker() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const clickFired = useRef(false);
  const signupFired = useRef(false);

    const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const code = captureAffiliateRef();
    if (code) {
      if (!clickFired.current) {
        clickFired.current = true;
        void trackAffiliateClick(code, tenant.slug);
      }
      if (
        !user &&
        pathname !== '/register' &&
        !pathname.startsWith('/affiliate') &&
        typeof window !== 'undefined'
      ) {
        router.replace(`/register?ref=${code}`);
      }
    }
  }, [tenant.slug, user, pathname, router]);

  useEffect(() => {
    if (user && !signupFired.current) {
      const code = getAffiliateRef();
      if (code) {
        signupFired.current = true;
        // Authenticated attribution links the player to the affiliate (enables
        // commission accrual on future deposits) AND counts the signup.
        void trackAffiliateAttribution(code).finally(() => clearAffiliateRef());
      }
    }
  }, [user, tenant.slug]);

  return null;
}

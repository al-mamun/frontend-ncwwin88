'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const code = captureAffiliateRef();
    if (code && !clickFired.current) {
      clickFired.current = true;
      void trackAffiliateClick(code, tenant.slug);
    }
  }, [tenant.slug]);

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

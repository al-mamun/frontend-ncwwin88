/**
 * Affiliate referral attribution (player site).
 *
 * Captures `?ref=CODE` (or `?aff=CODE`) from the landing URL, persists it, and
 * reports a click + an attributed signup to the public affiliate endpoints. The
 * tenant is resolved server-side from the forwarded slug we pass (API calls hit
 * the shared API host, so host-based resolution there would be wrong).
 */
import { apiSend } from './api';

const getKey = (slug?: string) => slug ? `sp_aff_ref_${slug}` : 'sp_aff_ref';

/** Read ?ref/?aff from the URL (persisting it), else return the stored code. */
export function captureAffiliateRef(tenantSlug?: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getKey(tenantSlug);
    const p = new URLSearchParams(window.location.search);
    const code = (p.get('ref') || p.get('aff') || '').trim().toUpperCase();
    if (code) {
      localStorage.setItem(key, code);
      return code;
    }
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAffiliateRef(tenantSlug?: string): string | null {
  try {
    return localStorage.getItem(getKey(tenantSlug));
  } catch {
    return null;
  }
}

export function clearAffiliateRef(tenantSlug?: string): void {
  try {
    localStorage.removeItem(getKey(tenantSlug));
  } catch {
    /* ignore */
  }
}

export function trackAffiliateClick(code: string, tenantSlug: string): Promise<void> {
  return apiSend('/public/affiliate/click', { method: 'POST', body: JSON.stringify({ code, tenantSlug }) });
}

export function trackAffiliateSignup(code: string, tenantSlug: string): Promise<void> {
  return apiSend('/public/affiliate/signup', { method: 'POST', body: JSON.stringify({ code, tenantSlug }) });
}

/**
 * Authenticated first-touch attribution: links the logged-in player to the
 * referring affiliate (server reads the player from the session cookie). This is
 * what actually enables commission accrual on the player's future deposits. It
 * also counts the signup, so it REPLACES the anonymous signup call for logged-in
 * users (avoids double-counting).
 */
export function trackAffiliateAttribution(code: string): Promise<void> {
  return apiSend('/player/affiliate/track', { method: 'POST', body: JSON.stringify({ code }) });
}

/**
 * External affiliate-portal URL for the current tenant (affiliate.<domain>).
 * Pass the tenant domain (preferred, SSR-safe); falls back to the browser host.
 */
export function affiliateSiteUrl(domain?: string | null): string {
  let host = (domain || '').trim();
  if (!host && typeof window !== 'undefined') host = window.location.host;
  host = host.replace(/^https?:\/\//i, '').replace(/^(www\.|affiliate\.)/i, '');
  return host ? `https://affiliate.${host}` : '#';
}

import { AffiliateAuthProvider } from '@/providers/affiliate-auth-provider';

/**
 * Affiliate portal layout. Wraps every /affiliate route in the affiliate-surface
 * session provider. Tenant + theme come from the root layout (shared), so the
 * portal is automatically branded per tenant. Served at /affiliate, and at the
 * affiliate.<tenant> subdomain via the host rewrite in middleware.ts.
 */
export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return <AffiliateAuthProvider>{children}</AffiliateAuthProvider>;
}

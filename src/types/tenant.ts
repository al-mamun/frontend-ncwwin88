/**
 * Tenant types — public, non-secret tenant configuration.
 *
 * This is the shape returned by the backend public tenant resolve endpoint
 * (see BACKEND CONTRACT note in src/core/tenant/resolveTenant.ts). It contains
 * ONLY public, white-label-safe configuration. No secrets, no internal IDs that
 * grant access, no auth material. The backend resolves the *real* tenant from
 * the request host/session — the client never sends a tenantId.
 */

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

/** Per-tenant brand colour overrides (hex/CSS colour strings). All optional. */
export interface TenantTheme {
  /** Primary brand / call-to-action colour. Maps to --brand-2. */
  primary?: string;
  /** Secondary / highlight colour. Maps to --accent + --gold-soft. */
  secondary?: string;
  /** Page background. Maps to --bg-base. */
  background?: string;
  /** Surface / card background. Maps to --bg-surface. */
  surface?: string;
  /** Primary text colour. Maps to --text-primary. */
  text?: string;
}

export interface TenantSeo {
  title?: string;
  description?: string;
  ogImage?: string;
}

/**
 * Public tenant configuration. Safe to ship to the browser.
 */
export interface TenantPublicConfig {
  tenantId: string;
  name: string;
  slug: string;
  domain: string;
  status: TenantStatus;
  logoUrl: string | null;
  faviconUrl: string | null;
  /** Homepage hero slider images (clickable only when `link` is set). */
  sliderImages?: { imageUrl: string; link: string | null }[];
  /** Show the homepage hero slider (default true when undefined). */
  sliderEnabled?: boolean;
  /** Scrolling announcement bar text + on/off (tenant-configurable). */
  announcementText?: string | null;
  announcementEnabled?: boolean;
  /** Tenant mobile app download link; shows a Download button when set. */
  appDownloadUrl?: string | null;
  /** PWA install UX enabled for this tenant (default true). */
  pwaInstallEnabled?: boolean;
  /** App-install presentations: any of 'button' | 'banner' | 'popup' (default ['button']). */
  appInstallModes?: string[];
  /** Tenant social/community links: platform -> URL. */
  social?: Record<string, string>;
  /** Live-chat widget enabled for this tenant (backend flag). */
  chatEnabled?: boolean;
  /** Show the signup captcha (tenant-controlled). */
  signupCaptchaEnabled?: boolean;
  /** Optional affiliate-site hero banner. */
  affiliateBanner?: { imageUrl: string; link: string | null } | null;
  /** Show the affiliate banner image on the affiliate site (default true). */
  affiliateBannerEnabled?: boolean;
  /** Show the default text-based hero section on the affiliate site (default true). */
  affiliateHeroEnabled?: boolean;
  /** Owner-global payment-method logos shown in the footer. */
  paymentMethodLogos?: { imageUrl: string; name: string | null; link: string | null }[];
  /** Key into the theme registry (src/themes/registry.ts). */
  themeKey: string;
  /** Optional per-tenant colour overrides applied on top of the theme preset. */
  theme?: TenantTheme;
  currency: string;
  locale: string;
  /** Enabled feature modules (e.g. 'casino', 'sports', 'promotions'). */
  enabledModules: string[];
  seo?: TenantSeo;
}

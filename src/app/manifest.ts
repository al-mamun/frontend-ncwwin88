import type { MetadataRoute } from 'next';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';

/**
 * Per-tenant installable PWA manifest.
 *
 * Chrome only offers its native one-tap "Install app" when the manifest declares a
 * SQUARE icon of at least 192x192 with purpose 'any'. Tenants upload brand logos of
 * ANY shape (wide banners, short marks), so declaring the raw logo as sizes:'any'
 * silently fails Chrome's installability check on those brands — the install button
 * then falls back to a manual "add to home screen" hint instead of the real prompt.
 * (Confirmed live: a working brand had a 447x447 square logo; broken brands had a
 * 321x319 and a 367x121 logo declared 'any', and never fired beforeinstallprompt.)
 *
 * Fix: when the brand image is Cloudinary-hosted (all dashboard uploads are), pad it
 * to a real square PNG at 192 and 512 via an on-the-fly transform, so the icon is
 * BOTH branded AND a valid installable icon regardless of the logo's shape. Non-
 * Cloudinary images keep the brand icon plus a local square-PNG fallback so the site
 * still installs. With no brand image at all, the local PNGs are used.
 *
 * App icon source, in priority order:
 *   1. Dashboard "App logo (home-screen icon)" -> tenant.pwaIconUrl
 *   2. Tenant branding Logo                     -> tenant.logoUrl
 *   3. Favicon                                  -> tenant.faviconUrl
 *
 * NOTE: Next 14's manifest type only accepts a SINGLE purpose per entry, so the
 * `any` and `maskable` variants are listed as separate entries (never 'any maskable').
 */

/**
 * Pad a Cloudinary upload URL into a square PNG of `size` px, or null when the URL
 * is not a Cloudinary upload we can transform. `c_pad` keeps the WHOLE logo (never
 * crops) and fills the remainder; `b_auto` samples an edge colour for the padding.
 */
function cloudinarySquare(url: string, size: number): string | null {
  const m = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!m) return null;
  return `${m[1]}c_pad,b_auto,w_${size},h_${size},f_png/${m[2]}`;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenantFromRequest();
  const brandIcon = tenant.pwaIconUrl || tenant.logoUrl || tenant.faviconUrl || null;

  const LOCAL: MetadataRoute.Manifest['icons'] = [
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
  ];

  const sq512 = brandIcon ? cloudinarySquare(brandIcon, 512) : null;
  const sq192 = brandIcon ? cloudinarySquare(brandIcon, 192) : null;

  let icons: MetadataRoute.Manifest['icons'];
  if (sq512 && sq192) {
    // Branded logo padded to guaranteed-square PNGs — installable AND on-brand.
    icons = [
      { src: sq192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: sq512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: sq512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];
  } else if (brandIcon) {
    // Non-Cloudinary brand image: offer it, plus local squares so install still works.
    icons = [{ src: brandIcon, sizes: 'any', purpose: 'any' }, ...LOCAL];
  } else {
    icons = LOCAL;
  }

  return {
    name: tenant.name,
    short_name: tenant.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1015',
    theme_color: '#0f1015',
    icons,
  };
}

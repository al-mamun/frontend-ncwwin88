import { NextRequest, NextResponse } from 'next/server';

/**
 * Host-based routing for the affiliate portal.
 *
 * When the request host is the affiliate subdomain (affiliate.<tenant>), the
 * portal is served at the ROOT of that subdomain with CLEAN URLs:
 *   affiliate.<tenant>/            → app/affiliate/page.tsx
 *   affiliate.<tenant>/register    → app/affiliate/register/page.tsx
 *   affiliate.<tenant>/login|dashboard|onboarding → likewise
 * Clean paths are rewritten INTERNALLY into the `/affiliate` route group; the
 * user-facing URL never shows `/affiliate`. The normal player site (its own
 * host) is left completely untouched.
 *
 * Legacy `/affiliate*` URLs on the subdomain are 308-redirected to their clean
 * equivalent so old links/bookmarks (e.g. affiliate.<tenant>/affiliate) land on
 * affiliate.<tenant>/. The matcher excludes _next, api and any file-like path so
 * static assets are never rewritten.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0];
  const isAffiliateHost = host.startsWith('affiliate.');
  if (!isAffiliateHost) return NextResponse.next();

  const url = req.nextUrl;

  // Legacy /affiliate* on the subdomain → redirect to the clean path.
  if (url.pathname === '/affiliate' || url.pathname.startsWith('/affiliate/')) {
    const dest = url.clone();
    dest.pathname = url.pathname.slice('/affiliate'.length) || '/';
    return NextResponse.redirect(dest, 308);
  }

  // Serve the /affiliate route group internally for clean subdomain paths.
  url.pathname = url.pathname === '/' ? '/affiliate' : `/affiliate${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/|api/|assets/|favicon.ico|.*\\..*).*)'],
};

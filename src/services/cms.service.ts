/**
 * Public CMS client for the tenant website. Talks to the unauthenticated
 * /public/cms surface, scoping every read to the current tenant SLUG. All reads
 * are resilient — a missing endpoint or unknown slug degrades to empty/null so
 * the public site never crashes on CMS content.
 */

import { apiFetch } from '../lib/api';
import type { CmsBanner, CmsPageDetail, CmsPageLink } from '../types';

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && v.trim()) sp.set(k, v.trim());
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const cmsApi = {
  /** Published pages (slug + title) for footer / nav link lists. */
  async getPages(tenant: string, locale?: string): Promise<CmsPageLink[]> {
    try {
      return await apiFetch<CmsPageLink[]>(`/public/cms/pages${qs({ tenant, locale })}`);
    } catch {
      return [];
    }
  },
  /** A single published page by slug. Returns null when not found. */
  async getPage(slug: string, tenant: string, locale?: string): Promise<CmsPageDetail | null> {
    try {
      return await apiFetch<CmsPageDetail>(`/public/cms/pages/${encodeURIComponent(slug)}${qs({ tenant, locale })}`);
    } catch {
      return null;
    }
  },
  /** Active banners for a placement (e.g. 'home'). */
  async getBanners(tenant: string, placement?: string): Promise<CmsBanner[]> {
    try {
      return await apiFetch<CmsBanner[]>(`/public/cms/banners${qs({ tenant, placement })}`);
    } catch {
      return [];
    }
  },
};

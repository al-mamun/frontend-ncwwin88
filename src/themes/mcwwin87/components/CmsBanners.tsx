/**
 * CmsBanners — renders the tenant's active CMS banners for a placement (default
 * 'home'). Data comes from the public /public/cms/banners surface, scoped to the
 * current tenant slug. Renders nothing when there are no banners (so the home
 * layout is unchanged for tenants without CMS banners).
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '../../../services/cms.service';
import { useTenant } from '../../../core/tenant/TenantProvider';

export default function CmsBanners({ placement = 'home' }: { placement?: string }) {
  const { tenant } = useTenant();
  const { data } = useQuery({
    queryKey: ['cms', 'banners', tenant.slug, placement],
    queryFn: () => cmsApi.getBanners(tenant.slug, placement),
    staleTime: 60_000,
  });

  const banners = data ?? [];
  if (banners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {banners.map((b) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.imageUrl}
            alt={b.title}
            className="h-full w-full rounded-xl object-cover"
            onError={(e) => { (e.currentTarget.closest('[data-cms-banner]') as HTMLElement | null)?.style.setProperty('display', 'none'); }}
          />
        );
        return (
          <div key={b.id} data-cms-banner className="overflow-hidden rounded-xl border border-border bg-surface">
            {b.link ? (
              <a href={b.link} target="_blank" rel="noopener noreferrer" className="block aspect-[16/7]">{img}</a>
            ) : (
              <div className="aspect-[16/7]">{img}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * bdbet21 — hero banner slider.
 *
 * A premium auto-playing carousel over the tenant's hero banners
 * (public/assets/banners/*): a smooth opacity CROSSFADE between slides plus a
 * subtle slow "Ken Burns" zoom on the active image. Prev/next arrows, dot
 * indicators, and pause-on-hover. Each slide links to the promotions surface
 * (authed) or login (visitor). Purely presentational chrome — no fabricated data.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { useTenant } from '../../../core/tenant/TenantProvider';

/** Hero banners shipped in public/assets/banners. */
const BANNERS = [
  '/assets/banners/banner1.jpeg',
  '/assets/banners/banner2.jpeg',
  '/assets/banners/banner3.jpeg',
  '/assets/banners/banner4.jpeg',
  '/assets/banners/banner5.jpeg',
  '/assets/banners/banner1.jpeg',
  '/assets/banners/banner6.jpeg',
];

const AUTOPLAY_MS = 5000;

export default function BannerSlider({ isAuthed }: { isAuthed: boolean }) {
  const { tenant } = useTenant();
  // Tenant-managed slides take priority; fall back to the bundled banners.
  // Tenant can turn the hero slider off entirely from the dashboard.
  const sliderOff = tenant.sliderEnabled === false;
  const tenantSlides = (tenant.sliderImages ?? []).filter((s) => s?.imageUrl);
  const usingFallback = tenantSlides.length === 0;
  const slides: { src: string; link: string | null }[] = usingFallback
    ? BANNERS.map((src) => ({ src, link: null }))
    : tenantSlides.map((s) => ({ src: s.imageUrl, link: s.link || null }));

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const href = isAuthed ? '/player/promotions' : '/login';

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  // Auto-advance (paused on hover / when only one slide).
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count]);

  // Hidden entirely when the tenant disables the hero slider.
  if (sliderOff) return null;

  return (
    <section className="top-banner-wrapper" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="carousel-frame">
        <div className="carousel-frame__shell relative aspect-[16/6] w-full sm:aspect-[16/5]" id="bannerShell">
          {slides.map((slide, i) => {
            const active = i === index;
            const cls = cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              active ? 'z-[1] opacity-100' : 'pointer-events-none z-0 opacity-0',
              active ? 'casino-kenburns' : ''
            );
            const img = <img src={slide.src} alt="" draggable={false} className="h-full w-full object-cover" />;
            if (slide.link) {
              return (
                <a key={i} href={slide.link} aria-label={`Banner ${i + 1}`} aria-hidden={!active} tabIndex={active ? 0 : -1} className={cls}>
                  {img}
                </a>
              );
            }
            if (usingFallback) {
              return (
                <Link key={i} href={href} aria-label={`Banner ${i + 1}`} aria-hidden={!active} tabIndex={active ? 0 : -1} className={cls}>
                  {img}
                </Link>
              );
            }
            return (
              <div key={i} aria-hidden={!active} className={cls}>
                {img}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button className="carousel-frame__arrow carousel-frame__arrow--prev" id="bannerPrev" aria-label="Previous" onClick={() => go(-1)}>&#10094;</button>
            <button className="carousel-frame__arrow carousel-frame__arrow--next" id="bannerNext" aria-label="Next" onClick={() => go(1)}>&#10095;</button>
            <div className="carousel-frame__pagination" id="bannerDots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to banner ${i + 1}`}
                  className={cn("carousel-frame__dot", i === index && "active")}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

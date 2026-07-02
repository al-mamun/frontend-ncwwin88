/**
 * PlayerPageHeader — the shared reference-style inner-page header.
 * Back button (defaults to the My Account hub) + gold section icon + title/
 * subtitle + a support (Headphones) glyph on the right. Token-themed (bdbet21).
 */
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Headphones, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlayerPageHeader({
  title,
  subtitle,
  icon: Icon,
  backHref = '/player/account',
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  backHref?: string;
}) {
  const router = useRouter();
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button onClick={() => router.push(backHref)} variant="outline" size="icon" className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Icon className="h-5 w-5 text-gold-soft" aria-hidden />
            {title}
          </h1>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      <Headphones className="h-5 w-5 shrink-0 text-gold-soft" aria-hidden />
    </div>
  );
}

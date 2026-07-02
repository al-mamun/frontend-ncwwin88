/**
 * bdbet21 — compact mobile category rail (shown below lg).
 *
 * A narrow vertical column of game categories sitting to the LEFT of the game
 * grid on mobile (mirrors the desktop sidebar). Replaces the horizontal category
 * tabs on small screens. Selecting a category filters the on-page grid.
 */
'use client';

import { cn } from '../../../lib/utils';
import { useGameCategories } from '../../../core/games/useGameCatalog';

export default function MobileCategoryRail({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const categories = useGameCategories();
  return (
    <nav
      aria-label="Game categories"
      className="sticky top-16 flex h-fit w-[68px] shrink-0 flex-col gap-1 self-start lg:hidden"
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const active = cat.slug === activeSlug;
        return (
          <button
            key={cat.slug}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(cat.slug)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-medium leading-tight transition-colors',
              active
                ? 'bg-brand-2/15 text-brand-2 ring-1 ring-brand-2/40'
                : 'text-muted hover:bg-elevated hover:text-brand-2',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-center">{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

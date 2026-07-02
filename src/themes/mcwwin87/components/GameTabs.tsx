/**
 * bdbet21 — game tab bar + search box.
 *
 * Tabs map to category slugs (controlled by the parent); search is a controlled
 * input. Both are pure UI — filtering is done against real useGames() data in
 * the parent. No fake logic.
 */

'use client';

import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Input } from '../../../components/ui/input';
import { useGameCategories } from '../../../core/games/useGameCatalog';

export default function GameTabs({
  activeSlug,
  onSelect,
  search,
  onSearch,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const categories = useGameCategories();
  return (
    <div className="flex flex-col gap-3 border-b border-border md:flex-row md:items-end md:justify-between">
      <div
        className="-mb-px flex gap-5 overflow-x-auto pb-0"
        role="tablist"
        aria-label="Game categories"
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = cat.slug === activeSlug;
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(cat.slug)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-gold-soft text-gold-soft'
                  : 'border-transparent text-muted hover:text-brand',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Inline search is hidden on mobile — the mobile ActionBar's Search icon
          opens a full-screen search overlay instead. Shown from md up. */}
      <div className="relative hidden w-full pb-2 md:block md:w-60">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-[calc(50%+4px)] text-muted" aria-hidden />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search games…"
          aria-label="Search games"
          className="rounded-full pl-9"
        />
      </div>
    </div>
  );
}

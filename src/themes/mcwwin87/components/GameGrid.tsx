/**
 * mcwwin87 (NCW) — game grid + provider strip + card.
 *
 * Renders REAL games from the shared catalog:
 *   - loading        -> skeletons
 *   - games present  -> provider strip + the responsive grid
 *   - empty / visitor -> a graceful empty/login CTA, never fake games.
 *
 * Cards follow the NCW design: rounded thumb, a coloured NEW/HOT tag, a play
 * overlay on hover, and the game name in white below. Imageless games fall back
 * to a token poster via <GamePoster>, so a card is never a plain black box.
 */

'use client';

import { Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/shared';
import { cn } from '../../../lib/utils';
import { GamePoster } from '../../../core/games/GamePoster';
import type { Game } from '../../../types';

/** Colour the NEW/HOT tag like the design (green NEW, amber HOT, red otherwise). */
function badgeClass(badge?: string): string {
  const b = (badge || '').trim().toUpperCase();
  if (b === 'NEW') return 'bg-emerald-500 text-white';
  if (b === 'HOT') return 'bg-amber-500 text-[#0d0d0d]';
  return 'bg-brand-2 text-white';
}

function GameCard({
  game,
  onPlay,
}: {
  game: Game;
  onPlay?: (game: Game) => void;
}) {
  const inner = (
    <>
      <div className="game-card__media">
        <GamePoster game={game} />
        {game.badge && (
          <span className={cn('game-card__badge', badgeClass(game.badge))}>
            {game.badge}
          </span>
        )}
        <div className="game-card__hover">
          <span className="game-card__play"></span>
        </div>
      </div>
      <div className="game-card__info">
        <span className="game-card__title notranslate">{game.name}</span>
      </div>
    </>
  );

  if (onPlay) {
    return (
      <button
        type="button"
        onClick={() => onPlay(game)}
        aria-label={`Play ${game.name}`}
        className="game-card"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="game-card group cursor-pointer">
      {inner}
    </div>
  );
}

export default function GameGrid({
  games,
  isLoading,
  onPlay,
  hasMore = false,
  onLoadMore,
  isFetchingMore = false,
}: {
  games: Game[];
  isLoading: boolean;
  isDemo?: boolean;
  onPlay?: (game: Game) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
}) {
  if (isLoading && games.length === 0) {
    return (
      <div className="games-box games-box--7">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="game-card"><Skeleton className="aspect-[5/6] w-full" /></div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 py-14 text-center">
        <Lock className="h-10 w-10 text-muted" aria-hidden />
        <p className="text-sm text-muted">No games available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="games-box games-box--7">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={onPlay}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="w-full sm:w-auto border-gold-soft/60 text-gold-soft hover:bg-gold-soft hover:text-brand-fg font-semibold"
          >
            {isFetchingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </>
  );
}

/**
 * GamePoster — the visual for a game thumbnail. NEVER blank.
 *
 * Renders the first image that loads, falling through on missing/broken sources:
 *   1. game.imageUrl        (cover art, object-cover)
 *   2. game.providerLogoUrl (brand logo, object-contain on a tint)
 *   3. a generated POSTER    (deterministic vibrant gradient + game title)
 *
 * The poster is computed from the game name, so every imageless game still gets a
 * distinct, branded, "real-looking" tile rather than a generic empty box.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import type { Game } from '../../types';

interface Candidate {
  url: string;
  /** 'cover' for full art, 'contain' for a logo (padded on a tinted surface). */
  fit: 'cover' | 'contain';
}

/** Curated vibrant palette (adapted from the legacy GAME_COLORS) for generated posters. */
const POSTER_COLORS = [
  '#c8a84b', '#1a472a', '#4a0080', '#0d3b66', '#2d0a00', '#003300',
  '#8b0000', '#003366', '#4b0082', '#663300', '#1f6f54', '#2c1654',
  '#7a1f2b', '#1b3a5b', '#5a3e00', '#33134f',
];

/** Stable index into the palette from a string (so a game always gets the same colour). */
function hashIndex(s: string, n: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function GamePoster({ game, className }: { game: Game; className?: string }) {
  // Ordered image candidates: real cover first, then the provider logo.
  const candidates: Candidate[] = [];
  if (game.imageUrl) candidates.push({ url: game.imageUrl, fit: 'cover' });
  if (game.providerLogoUrl) candidates.push({ url: game.providerLogoUrl, fit: 'contain' });

  // Index of the candidate currently being attempted; advances on load error.
  const [idx, setIdx] = useState(0);
  const current = candidates[idx];

  if (current) {
    const isLogo = current.fit === 'contain';
    return (
      <div
        className={cn(
          'relative h-full w-full',
          isLogo && 'flex items-center justify-center bg-gradient-to-br from-elevated via-surface to-base',
          className,
        )}
      >
        <Image
          src={current.url}
          alt={game.name}
          fill
          sizes="(max-width: 768px) 33vw, 12vw"
          onError={() => setIdx((i) => i + 1)}
          className={isLogo ? 'object-contain p-3' : 'object-cover'}
        />
      </div>
    );
  }

  // Final fallback — a generated, deterministic, vibrant poster (never blank).
  const base = game.color || POSTER_COLORS[hashIndex(game.name || game.id, POSTER_COLORS.length)];
  const alt = POSTER_COLORS[hashIndex((game.provider || '') + game.name, POSTER_COLORS.length)];
  return (
    <div
      className={cn('relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-2 text-center', className)}
      style={{ background: `linear-gradient(135deg, ${base} 0%, ${alt} 100%)` }}
    >
      {/* soft sheen so the tile reads like artwork, not a flat block */}
      <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/15 blur-xl" aria-hidden />
      <span className="line-clamp-3 text-sm font-extrabold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        {game.name}
      </span>
      <span className="mt-1 line-clamp-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
        {game.provider}
      </span>
    </div>
  );
}

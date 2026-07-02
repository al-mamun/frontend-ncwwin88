/**
 * GuestGamePreview — the "game-play page" shown to a VISITOR (not logged in).
 *
 * Flow:
 *  - Ask the backend for a NO-LOGIN demo launch.
 *  - If a playable demo URL comes back → embed the real game iframe (branded loader
 *    until the frame loads). The sign-up prompt only auto-appears AFTER the game has
 *    actually loaded and the player has had time to play (never mid-load). A small
 *    "Sign up" button in the header lets them convert whenever they want.
 *  - If there's no demo → a short branded "sign up to play" screen, then the prompt.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { GamePoster } from '../../core/games/GamePoster';
import { useTenant } from '../../core/tenant/TenantProvider';
import { playerApi } from '../../services/player.service';
import type { Game } from '../../types';

type Phase = 'loading' | 'playing' | 'preview';

export function GuestGamePreview({
  game,
  onClose,
  onSignup,
  previewDelayMs = 6000,
  playDelayMs = 45000,
}: {
  game: Game;
  onClose: () => void;
  onSignup: () => void;
  previewDelayMs?: number;
  playDelayMs?: number;
}) {
  const { tenant } = useTenant();
  const [phase, setPhase] = useState<Phase>('loading');
  const [demoUrl, setDemoUrl] = useState<string>('');
  const [frameLoaded, setFrameLoaded] = useState(false);
  const fired = useRef(false);

  const trigger = () => {
    if (fired.current) return;
    fired.current = true;
    onSignup();
  };

  // Resolve the demo launch once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await playerApi.launchGameDemo(game.id, tenant.slug);
      if (!alive) return;
      if (res.mode === 'demo' && res.launchUrl) {
        setDemoUrl(res.launchUrl);
        setPhase('playing');
      } else {
        setPhase('preview');
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No-demo preview: prompt after a short look.
  useEffect(() => {
    if (phase !== 'preview') return;
    const t = setTimeout(trigger, previewDelayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Real demo: only start the sign-up countdown AFTER the game has loaded, so the
  // prompt never interrupts a still-loading game.
  useEffect(() => {
    if (phase !== 'playing' || !frameLoaded) return;
    const t = setTimeout(trigger, playDelayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, frameLoaded]);

  return (
    <div className="fixed inset-0 z-[115] flex flex-col bg-base">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{game.name}</p>
          <p className="truncate text-xs text-muted">{game.provider}{phase === 'playing' ? ' · Demo' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={trigger}
            className="rounded-full bg-gradient-to-b from-gold-soft to-[#d4a017] px-3 py-1.5 text-xs font-bold text-[#0d0d0d]"
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="relative min-h-0 flex-1">
          <iframe
            src={demoUrl}
            title={`${game.name} (demo)`}
            onLoad={() => setFrameLoaded(true)}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
          />
          {!frameLoaded && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-base">
              <div className="absolute inset-0 scale-110 opacity-30 blur-sm">
                <GamePoster game={game} />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gold-soft/30 border-t-gold-soft" />
                <p className="text-sm font-semibold text-gold-soft">Loading game…</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={trigger}
          aria-label={`Play ${game.name}`}
          className="relative flex flex-1 items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 scale-110 opacity-30 blur-sm">
            <GamePoster game={game} />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            {phase === 'loading' ? (
              <>
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gold-soft/30 border-t-gold-soft" />
                <p className="text-sm font-semibold text-gold-soft">Loading game…</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-white">{game.name}</p>
                <p className="max-w-xs text-sm text-muted">Sign up to play this game for real and claim your welcome bonus.</p>
                <span className="rounded-full bg-gradient-to-b from-gold-soft to-[#d4a017] px-5 py-2 text-sm font-bold text-[#0d0d0d]">
                  Sign up to play
                </span>
              </>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

export default GuestGamePreview;

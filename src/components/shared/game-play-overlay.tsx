/**
 * GamePlayOverlay — A premium full-screen game launcher overlay.
 * Handles iframe scaling, sandbox controls, and active balance polling.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Gamepad, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Game, GameSession } from '@/types';

interface GamePlayOverlayProps {
  game: Game;
  session: GameSession;
  balanceMinor: number;
  currency: string;
  onClose: () => void;
  onRefreshBalance: () => void;
}

export function GamePlayOverlay({
  game,
  session,
  balanceMinor,
  currency,
  onClose,
  onRefreshBalance,
}: GamePlayOverlayProps) {
  const router = useRouter();
  const isLive = session.mode === 'live' && !!session.launchUrl;
  const launchUrl = session.launchUrl;

  // Deposit prompt: only AFTER the game has loaded (never block the launch), and
  // only when the balance is insufficient. Dismissible so the player can still
  // watch/preview the game.
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [depositDismissed, setDepositDismissed] = useState(false);
  const showDeposit = isLive && iframeLoaded && balanceMinor <= 0 && !depositDismissed;

  // Poll player balance every 5 seconds while in-game to reflect bet/win outcomes
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      onRefreshBalance();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, onRefreshBalance]);

  // Handle closing on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Hide floating page widgets (support button, scroll-to-top) while a game is open
  // so they don't overlap the game window (CSS in globals.css targets the body class).
  useEffect(() => {
    document.body.classList.add('game-overlay-open');
    return () => document.body.classList.remove('game-overlay-open');
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-primary">
      {/* Full-bleed game area — no top bar; the game fills 100% of the screen. */}
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* Floating close button — pinned to the top-right corner OVER the game.
            High-contrast (dark disc + white icon + white ring + drop shadow) so it
            stays clearly visible on any game background, light or dark. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close game"
          className="absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-[0_2px_10px_rgba(0,0,0,0.6)] ring-2 ring-white/85 backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
        >
          <X className="h-6 w-6" strokeWidth={2.5} />
        </button>
        {isLive ? (
          <>
            <iframe
              src={launchUrl}
              title={game.name}
              onLoad={() => setIframeLoaded(true)}
              className="block h-full w-full border-none"
              allow="autoplay; fullscreen; encrypted-media; microphone; clipboard-read; clipboard-write"
              allowFullScreen
            />

            {/* Insufficient-balance deposit prompt — appears OVER the loaded game
                (never blocks the launch) and is dismissible. */}
            {showDeposit && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl border border-gold-soft/30 bg-surface p-6 text-center shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft/15">
                    <Coins className="h-7 w-7 text-gold-soft" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold">Insufficient Balance</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                    You need funds to play {game.name}. Make a deposit to start spinning.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Button
                      onClick={() => router.push('/player/deposit')}
                      className="w-full bg-gold-soft font-bold text-[#0d0d0d] hover:opacity-90"
                    >
                      Deposit Now
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDepositDismissed(true)}
                      className="text-xs font-medium text-muted transition-colors hover:text-gold-soft"
                    >
                      Continue watching
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Demo Fallback State */
          <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color || 'from-brand/20 to-surface'} p-4 shadow-2xl shadow-brand/10`}
            >
              <Gamepad className="h-10 w-10 text-brand" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">{game.name}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
                {session.message || 'The live provider connection is simulated. Admin integrations are required for real money slots.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="rounded-md border border-warning/20 bg-warning/5 px-4 py-2 text-xs font-medium text-warning">
                Demo Play Session
              </div>
              <Button onClick={onClose} variant="default" className="font-bold">
                Back to Lobby
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

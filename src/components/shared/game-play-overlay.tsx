/**
 * GamePlayOverlay — A premium full-screen game launcher overlay.
 * Handles iframe scaling, sandbox controls, and active balance polling.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Wallet, Gamepad, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-base text-primary">
      {/* Dynamic Header Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        {/* Left: Close button and Title */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted hover:text-primary"
            aria-label="Back to Lobby"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-sm font-bold leading-tight">{game.name}</h2>
            <p className="text-xxs font-semibold uppercase tracking-wider text-muted">{game.provider}</p>
          </div>
        </div>

        {/* Right: Wallet Balance display and Exit Icon */}
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-2 rounded-md border border-gold-soft/30 bg-gold-soft/10 px-3 py-1.5 text-xs font-bold text-gold-soft">
              <Wallet className="h-3.5 w-3.5" />
              <span>{formatCurrency(balanceMinor, currency)}</span>
            </div>
          )}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-danger hover:bg-danger/10"
            aria-label="Close Game"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Game Screen area */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {isLive ? (
          <>
            <iframe
              src={launchUrl}
              title={game.name}
              onLoad={() => setIframeLoaded(true)}
              className="h-full w-full border-none display-block"
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

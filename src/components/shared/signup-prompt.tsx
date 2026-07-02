/**
 * SignupPrompt — lightweight, dependency-free modal shown when a VISITOR tries to
 * play a game. Visitors can browse the catalog freely, but placing a bet/spin
 * needs an account + balance, so this prompts them to sign up (or log in). The
 * game name is shown for context. Self-contained overlay (no dialog lib).
 */

'use client';

import Link from 'next/link';
import { X, Gift } from 'lucide-react';
import { Button } from '../ui/button';

export function SignupPrompt({
  open,
  onClose,
  gameName,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  gameName?: string;
  onLogin?: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gold-soft/30 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-muted transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-soft to-[#d4a017] text-[#0d0d0d]">
            <Gift className="h-7 w-7" />
          </span>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Sign up to play{gameName ? '' : ''}</h2>
            <p className="text-sm text-muted">
              {gameName ? <>You need an account and balance to play <span className="font-semibold text-gold-soft">{gameName}</span>. </> : 'You need an account and balance to start playing. '}
              Create one in seconds and claim your welcome bonus.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Link href="?auth=register" scroll={false} className="w-full" onClick={onClose}>
              <Button className="w-full bg-gradient-to-b from-gold-soft to-[#d4a017] font-bold text-[#0d0d0d] hover:opacity-90">
                Sign up &amp; play
              </Button>
            </Link>
            {onLogin ? (
              <Button variant="outline" className="w-full border-border font-semibold" onClick={onLogin}>
                I already have an account
              </Button>
            ) : (
              <Link href="?auth=login" scroll={false} className="w-full" onClick={onClose}>
                <Button variant="outline" className="w-full border-border font-semibold">
                  I already have an account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPrompt;

/**
 * Player area layout.
 * Wraps all /player/* routes in the shared NCW shell (header / left sidebar /
 * footer / right floating rail) so inner pages match the public site.
 *
 * Auth: the GAME BROWSING pages (/player/games/*) are PUBLIC so visitors can
 * explore the lobby without an account — launching a game prompts login. All
 * other /player/* pages (account, deposit, withdraw, etc.) still require a session.
 */
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import PlayerShell from '@/themes/mcwwin87/PlayerShell';
import { LoadingState } from '@/components/shared';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  // Game lobby / category / provider pages are browsable by guests.
  const isPublicBrowse = pathname.startsWith('/player/games');

  useEffect(() => {
    if (!loading && !user && !isPublicBrowse) router.replace('/login');
  }, [loading, user, router, isPublicBrowse]);

  if (loading) return <LoadingState message="Authenticating…" />;
  if (!user && !isPublicBrowse) return null;

  // Inner pages share the public chrome for a consistent experience.
  return <PlayerShell>{children}</PlayerShell>;
}

/**
 * mcwwin87 (MCW) theme — authenticated (player) shell.
 *
 * Full-width MCW chrome for every /player/* inner page: MCW header (desktop) +
 * MobileHeader, the slide-in mobile menu (Sidebar), the account top-tab bar (on
 * non-lobby pages), the footer, and the sticky bottom nav.
 */
'use client';

import { usePathname } from 'next/navigation';
import ScrollTop from '../../components/shared/scroll-top';
import TopHeader from './components/TopHeader';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import AccountNav from './components/AccountNav';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { AuthModal } from '../../components/shared/auth-modal';

export default function Mcwwin87PlayerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Account-area pages get the top tab bar; the games lobby does not.
  const showAccountNav = !pathname?.startsWith('/player/games');

  return (
    <div className="flex min-h-screen flex-col bg-base pb-20 lg:pb-0">
      <MobileHeader />
      <TopHeader />

      {/* Slide-in mobile menu + overlay (toggled by the hamburger) */}
      <Sidebar />

      {/* Login / register popup (opened via ?auth=login|register) */}
      <AuthModal />

      {showAccountNav && (
        <div className="border-b border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <AccountNav />
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <Footer />

      <ScrollTop />
      <MobileBottomNav />
    </div>
  );
}

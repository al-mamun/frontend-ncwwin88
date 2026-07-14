/**
 * Turnover — wagering view. Shows the player's WITHDRAWAL rollover requirement
 * (WageringStatus) on top, then total historical wagered from the BET ledger.
 */
'use client';

import { BarChart3 } from 'lucide-react';
import RecordsView from '@/components/player/RecordsView';
import { WageringStatus } from '@/components/shared/WageringStatus';

export default function TurnoverPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <WageringStatus />
      </div>
      <RecordsView
        title="Turnover"
        subtitle="Total amount wagered"
        icon={BarChart3}
        scopeTypes={['BET']}
        typeOptions={[{ value: 'BET', label: 'Bets' }]}
        showTurnover
      />
    </>
  );
}

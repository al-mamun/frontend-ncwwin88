/**
 * Betting Records — bet & win history (reference "Records" look).
 * Real data via GET /player/ledger (RecordsView), scoped to BET/WIN types.
 */
'use client';

import { ClipboardList } from 'lucide-react';
import RecordsView from '@/components/player/RecordsView';

export default function BettingRecordsPage() {
  return (
    <RecordsView
      title="Betting Records"
      subtitle="Your bets and winnings"
      icon={ClipboardList}
      scopeTypes={['BET', 'WIN']}
      typeOptions={[
        { value: '', label: 'All' },
        { value: 'BET', label: 'Bets' },
        { value: 'WIN', label: 'Wins' },
      ]}
    />
  );
}

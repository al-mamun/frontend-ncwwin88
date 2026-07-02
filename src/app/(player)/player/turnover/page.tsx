/**
 * Turnover — wagering view (reference "Records" look).
 * Real data via GET /player/ledger (RecordsView), scoped to BET; shows a
 * summed "Total Wagered" over the loaded records.
 */
'use client';

import { BarChart3 } from 'lucide-react';
import RecordsView from '@/components/player/RecordsView';

export default function TurnoverPage() {
  return (
    <RecordsView
      title="Turnover"
      subtitle="Total amount wagered"
      icon={BarChart3}
      scopeTypes={['BET']}
      typeOptions={[{ value: 'BET', label: 'Bets' }]}
      showTurnover
    />
  );
}

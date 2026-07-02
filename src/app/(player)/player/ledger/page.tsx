/**
 * Transaction Records — money-movement history (reference "Records" look).
 * Real data via GET /player/ledger (RecordsView), scoped to funds types.
 */
'use client';

import { ReceiptText } from 'lucide-react';
import RecordsView from '@/components/player/RecordsView';

export default function TransactionRecordsPage() {
  return (
    <RecordsView
      title="Transaction Records"
      subtitle="Deposits, withdrawals, bonuses & adjustments"
      icon={ReceiptText}
      scopeTypes={['DEPOSIT', 'WITHDRAWAL', 'BONUS', 'FEE', 'ADJUSTMENT', 'REFUND', 'TRANSFER']}
      typeOptions={[
        { value: '', label: 'All Types' },
        { value: 'DEPOSIT', label: 'Deposit' },
        { value: 'WITHDRAWAL', label: 'Withdrawal' },
        { value: 'BONUS', label: 'Bonus' },
        { value: 'ADJUSTMENT', label: 'Adjustment' },
        { value: 'REFUND', label: 'Refund' },
        { value: 'TRANSFER', label: 'Transfer' },
      ]}
    />
  );
}

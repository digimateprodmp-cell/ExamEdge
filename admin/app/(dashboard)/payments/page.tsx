'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { paymentsService } from '@/services/ops.service';
import { ApiError } from '@/lib/api';
import type { Payment } from '@/types';

const STATUS_VARIANT: Record<Payment['status'], 'success' | 'destructive' | 'secondary' | 'warning'> = {
  PAID: 'success',
  FAILED: 'destructive',
  CREATED: 'secondary',
  REFUNDED: 'warning',
};

export default function PaymentsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    paymentsService
      .listAll(accessToken)
      .then(setRows)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Could not load payments'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const columns: Column<Payment>[] = [
    { header: 'User', cell: (r) => r.user?.email ?? r.userId },
    { header: 'Item', cell: (r) => <span className="text-xs">{r.itemType.replace('_', ' ')}</span> },
    { header: 'Amount', cell: (r) => `₹${r.amount}` },
    { header: 'Status', cell: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
    { header: 'Order ID', cell: (r) => <code className="text-xs">{r.razorpayOrderId}</code> },
    { header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="Order and transaction history (read-only)." />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No payments yet" />
    </div>
  );
}

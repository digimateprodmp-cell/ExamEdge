'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { CouponFormDialog } from '@/components/shared/coupon-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { couponsService } from '@/services/ops.service';
import { ApiError } from '@/lib/api';
import type { Coupon } from '@/types';

export default function CouponsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await couponsService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<Coupon>[] = [
    { header: 'Code', cell: (r) => <code className="font-semibold">{r.code}</code> },
    { header: 'Discount', cell: (r) => (r.type === 'PERCENT' ? `${r.value}%` : `₹${r.value}`) },
    { header: 'Valid till', cell: (r) => new Date(r.validTo).toLocaleDateString() },
    { header: 'Status', cell: (r) => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <CouponFormDialog
            existing={r}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await couponsService.update(accessToken, r.id, input); toast.success('Coupon updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await couponsService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes for checkout."
        action={accessToken && <CouponFormDialog onSubmit={async (input) => { await couponsService.create(accessToken, input); toast.success('Coupon created'); load(); }} />}
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No coupons yet" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PublishableFormDialog, type PublishableFormValues } from '@/components/shared/publishable-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { batchesService, type BatchInput } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { Batch } from '@/types';

function toInput(v: PublishableFormValues): BatchInput {
  return {
    titleEn: v.titleEn,
    titleHi: v.titleHi || undefined,
    descriptionEn: v.descriptionEn || undefined,
    descriptionHi: v.descriptionHi || undefined,
    isFree: v.isFree,
    price: v.isFree ? 0 : Number(v.price) || 0,
    isPublished: v.isPublished,
  };
}

export default function BatchesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows((await batchesService.list(accessToken)).items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<Batch>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Price', cell: (r) => (r.isFree ? <Badge variant="success">Free</Badge> : `₹${r.price}`) },
    { header: 'Status', cell: (r) => <Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Published' : 'Draft'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          <PublishableFormDialog
            title="Edit batch"
            initial={{ titleEn: r.titleEn, titleHi: r.titleHi ?? '', descriptionEn: r.descriptionEn ?? '', descriptionHi: r.descriptionHi ?? '', isFree: r.isFree, price: r.price, isPublished: r.isPublished }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (v) => { if (accessToken) { await batchesService.update(accessToken, r.id, toInput(v)); toast.success('Batch updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await batchesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Batches"
        description="Live batches bundling videos and content."
        action={accessToken && <PublishableFormDialog title="New batch" onSubmit={async (v) => { await batchesService.create(accessToken, toInput(v)); toast.success('Batch created'); load(); }} />}
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No batches yet" />
    </div>
  );
}

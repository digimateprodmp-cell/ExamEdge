'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowRight, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { TestSeriesFormDialog } from '@/components/shared/test-series-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { testSeriesService } from '@/services/test-series.service';
import { ApiError } from '@/lib/api';
import type { TestSeries } from '@/types';

export default function TestSeriesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows((await testSeriesService.list(accessToken)).items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load test series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<TestSeries>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Price', cell: (r) => (r.isFree ? <Badge variant="success">Free</Badge> : `₹${r.price}`) },
    { header: 'Validity', cell: (r) => `${r.validityDays}d` },
    { header: 'Status', cell: (r) => <Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Published' : 'Draft'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/test-series/${r.id}`}>Volumes <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <TestSeriesFormDialog
            title="Edit test series"
            initial={{
              titleEn: r.titleEn,
              titleHi: r.titleHi ?? '',
              descriptionEn: r.descriptionEn ?? '',
              descriptionHi: r.descriptionHi ?? '',
              isFree: r.isFree,
              price: r.price,
              validityDays: String(r.validityDays),
              isPublished: r.isPublished,
            }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await testSeriesService.update(accessToken, r.id, input); toast.success('Test series updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await testSeriesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-56',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Test Series"
        description="Bundles of test volumes students purchase."
        action={
          accessToken && (
            <TestSeriesFormDialog
              title="New test series"
              onSubmit={async (input) => { await testSeriesService.create(accessToken, input); toast.success('Test series created'); load(); }}
            />
          )
        }
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No test series yet" />
    </div>
  );
}

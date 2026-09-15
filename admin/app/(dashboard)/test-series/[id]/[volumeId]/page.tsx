'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { TestFormDialog } from '@/components/shared/test-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { testsService } from '@/services/test-series.service';
import { ApiError } from '@/lib/api';
import type { Test } from '@/types';

export default function VolumeTestsPage({ params }: { params: Promise<{ id: string; volumeId: string }> }) {
  const { id, volumeId } = use(params);
  const { accessToken } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setTests(await testsService.listByVolume(accessToken, volumeId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, volumeId]);

  const columns: Column<Test>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Type', cell: (r) => <Badge variant="secondary">{r.type}</Badge> },
    {
      header: 'Status',
      cell: (r) => <Badge variant={r.status === 'PUBLISHED' ? 'success' : r.status === 'DRAFT' ? 'secondary' : 'outline'}>{r.status}</Badge>,
    },
    { header: 'Duration', cell: (r) => `${r.durationMinutes}m` },
    { header: 'Marks', cell: (r) => `+${r.marksPerQuestion} / -${r.negativeMarks}` },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/tests/${r.id}`}>Questions <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <TestFormDialog
            testVolumeId={volumeId}
            initial={{
              titleEn: r.titleEn,
              titleHi: r.titleHi ?? '',
              instructionsEn: r.instructionsEn ?? '',
              instructionsHi: r.instructionsHi ?? '',
              type: r.type,
              status: r.status,
              durationMinutes: String(r.durationMinutes),
              marksPerQuestion: r.marksPerQuestion,
              negativeMarks: r.negativeMarks,
              isFree: r.isFree,
              price: r.price,
            }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await testsService.update(accessToken, r.id, input); toast.success('Test updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await testsService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-64',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Tests within this volume. Open a test to build its question set."
        action={accessToken && <TestFormDialog testVolumeId={volumeId} onSubmit={async (input) => { await testsService.create(accessToken, input); toast.success('Test created'); load(); }} />}
      />
      <Link href={`/test-series/${id}`} className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to volumes
      </Link>
      <DataTable columns={columns} rows={tests} rowKey={(r) => r.id} loading={loading} emptyTitle="No tests yet" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowRight, Ban, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { LiveTestFormDialog } from '@/components/shared/live-test-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { liveTestsService } from '@/services/live-tests.service';
import { ApiError } from '@/lib/api';
import type { LiveTest, LiveTestStatusValue } from '@/types';

const STATUS_VARIANT: Record<LiveTestStatusValue, 'secondary' | 'destructive' | 'success' | 'outline'> = {
  UPCOMING: 'outline',
  COUNTDOWN: 'secondary',
  LIVE: 'destructive',
  ENDED: 'outline',
  RESULTS_AVAILABLE: 'success',
  CANCELLED: 'outline',
};

export default function LiveTestsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<LiveTest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await liveTestsService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load live tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<LiveTest>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
    { header: 'Test Paper', cell: (r) => r.test?.titleEn ?? '—' },
    { header: 'Start', cell: (r) => new Date(r.startAt).toLocaleString() },
    { header: 'Duration', cell: (r) => `${r.durationMinutes} min` },
    { header: 'Status', cell: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/live-tests/${r.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {r.status === 'UPCOMING' && (
            <Button
              variant="ghost"
              size="icon"
              title="Publish"
              onClick={async () => {
                if (!accessToken) return;
                try {
                  await liveTestsService.publish(accessToken, r.id);
                  toast.success('Live test published');
                  load();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : 'Could not publish');
                }
              }}
            >
              <Megaphone className="h-4 w-4" />
            </Button>
          )}
          {r.status !== 'CANCELLED' && r.status !== 'ENDED' && r.status !== 'RESULTS_AVAILABLE' && (
            <Button
              variant="ghost"
              size="icon"
              title="Cancel"
              className="text-destructive"
              onClick={async () => {
                if (!accessToken) return;
                if (!confirm('Cancel this live test?')) return;
                try {
                  await liveTestsService.cancel(accessToken, r.id);
                  toast.success('Live test cancelled');
                  load();
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : 'Could not cancel');
                }
              }}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Live Tests"
        description="Server-scheduled, proctored exams with a fixed start and end time."
        action={
          accessToken && (
            <LiveTestFormDialog
              onSubmit={async (v) => {
                await liveTestsService.create(accessToken, v);
                toast.success('Live test scheduled');
                load();
              }}
            />
          )
        }
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No live tests scheduled yet" />
    </div>
  );
}

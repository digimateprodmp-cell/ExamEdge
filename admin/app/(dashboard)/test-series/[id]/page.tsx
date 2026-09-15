'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Pencil, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { testSeriesService, testVolumesService, type TestVolumeInput } from '@/services/test-series.service';
import { ApiError } from '@/lib/api';
import type { TestSeries, TestVolume } from '@/types';

function VolumeFormDialog({
  testSeriesId,
  initial,
  trigger,
  onSubmit,
}: {
  testSeriesId: string;
  initial?: { titleEn: string; titleHi?: string; order: number };
  trigger?: React.ReactNode;
  onSubmit: (input: TestVolumeInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? '');
  const [titleHi, setTitleHi] = useState(initial?.titleHi ?? '');
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitleEn(initial?.titleEn ?? '');
      setTitleHi(initial?.titleHi ?? '');
      setOrder(String(initial?.order ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New volume</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Test volume</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title (English)</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Title (Hindi)</Label>
            <Input value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Order</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !titleEn}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({ testSeriesId, titleEn, titleHi: titleHi || undefined, order: Number(order) || 0 });
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TestSeriesVolumesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const [series, setSeries] = useState<TestSeries | null>(null);
  const [volumes, setVolumes] = useState<TestVolume[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [s, v] = await Promise.all([
        testSeriesService.get(accessToken, id),
        testVolumesService.list(accessToken, id),
      ]);
      setSeries(s);
      setVolumes(v);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const columns: Column<TestVolume>[] = [
    { header: 'Order', cell: (r) => r.order, className: 'w-16' },
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Title (HI)', cell: (r) => r.titleHi ?? '-' },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/test-series/${id}/${r.id}`}>Tests <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <VolumeFormDialog
            testSeriesId={id}
            initial={{ titleEn: r.titleEn, titleHi: r.titleHi ?? undefined, order: r.order }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await testVolumesService.update(accessToken, r.id, input); toast.success('Volume updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await testVolumesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-56',
    },
  ];

  return (
    <div>
      <PageHeader
        title={series?.titleEn ?? 'Test volumes'}
        description="Volumes group tests within this series."
        action={accessToken && <VolumeFormDialog testSeriesId={id} onSubmit={async (input) => { await testVolumesService.create(accessToken, input); toast.success('Volume created'); load(); }} />}
      />
      <DataTable columns={columns} rows={volumes} rowKey={(r) => r.id} loading={loading} emptyTitle="No volumes yet" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { VideoFormDialog } from '@/components/shared/video-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { videosService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { VideoRow } from '@/types';

export default function VideosPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await videosService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<VideoRow>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Access', cell: (r) => <Badge variant={r.isFree ? 'success' : 'secondary'}>{r.isFree ? 'Free preview' : 'Locked'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <VideoFormDialog
            initial={{ titleEn: r.titleEn, titleHi: r.titleHi ?? '', videoUrl: r.videoUrl, isFree: r.isFree }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await videosService.update(accessToken, r.id, input); toast.success('Video updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await videosService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Videos"
        description="Lecture videos, optionally tied to a course or batch."
        action={accessToken && <VideoFormDialog onSubmit={async (input) => { await videosService.create(accessToken, input); toast.success('Video added'); load(); }} />}
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No videos yet" />
    </div>
  );
}

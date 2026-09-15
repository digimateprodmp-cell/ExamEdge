'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { NoteFormDialog } from '@/components/shared/note-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { noteVolumesService, notesService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { NoteRow, NoteVolume } from '@/types';

export default function NoteVolumeFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const [volume, setVolume] = useState<NoteVolume | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setVolume(await noteVolumesService.get(accessToken, id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const columns: Column<NoteRow>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Access', cell: (r) => <Badge variant={r.isFree ? 'success' : 'secondary'}>{r.isFree ? 'Free' : 'Locked'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <NoteFormDialog
            noteVolumeId={id}
            initial={{ titleEn: r.titleEn, titleHi: r.titleHi ?? '', fileUrl: r.fileUrl, isFree: r.isFree }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await notesService.update(accessToken, r.id, input); toast.success('Note updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await notesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div>
      <PageHeader
        title={volume?.titleEn ?? 'Notes'}
        action={accessToken && <NoteFormDialog noteVolumeId={id} onSubmit={async (input) => { await notesService.create(accessToken, input); toast.success('Note added'); load(); }} />}
      />
      <Link href="/content/notes" className="mb-4 inline-block text-sm text-primary hover:underline">← Back to volumes</Link>
      <DataTable columns={columns} rows={volume?.notes ?? []} rowKey={(r) => r.id} loading={loading} emptyTitle="No notes yet" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { NoteVolumeFormDialog } from '@/components/shared/note-volume-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { noteVolumesService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { NoteVolume } from '@/types';

export default function NoteVolumesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<NoteVolume[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await noteVolumesService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load note volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<NoteVolume>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Access', cell: (r) => <Badge variant={r.isFree ? 'success' : 'secondary'}>{r.isFree ? 'Free' : `₹${r.price}`}</Badge> },
    { header: 'Notes', cell: (r) => r.notes?.length ?? 0 },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/content/notes/${r.id}`}>Files <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <NoteVolumeFormDialog
            title="Edit note volume"
            initial={{ titleEn: r.titleEn, titleHi: r.titleHi ?? '', isFree: r.isFree, price: r.price }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await noteVolumesService.update(accessToken, r.id, input); toast.success('Updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await noteVolumesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-40',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Note volumes"
        description="Grouped PDF study notes."
        action={accessToken && <NoteVolumeFormDialog title="New note volume" onSubmit={async (input) => { await noteVolumesService.create(accessToken, input); toast.success('Note volume created'); load(); }} />}
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No note volumes yet" />
    </div>
  );
}

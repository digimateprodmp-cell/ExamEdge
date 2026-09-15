'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { noteVolumesService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { Note } from '@/types';

export function NoteDownloadButton({ note }: { note: Note }) {
  const t = useTranslations('notes');
  const { accessToken, status } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const download = async () => {
    if (note.fileUrl) {
      window.open(note.fileUrl, '_blank');
      return;
    }
    if (status !== 'authenticated' || !accessToken) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await noteVolumesService.download(accessToken, note.id);
      if (res.fileUrl) window.open(res.fileUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Purchase this note volume to download');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant={note.isFree ? 'default' : 'outline'} disabled={loading} onClick={download}>
      {note.isFree ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {t('downloadPdf')}
    </Button>
  );
}

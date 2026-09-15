import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { noteVolumesService } from '@/services/content.service';
import { pickLocalized } from '@/lib/i18n-content';
import { EmptyState } from '@/components/shared/empty-state';
import { NoteDownloadButton } from '@/components/shared/note-download-button';

export default async function NoteVolumeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('notes');
  const volume = await noteVolumesService.get(id).catch(() => null);
  if (!volume) notFound();

  const title = pickLocalized(volume.titleEn, volume.titleHi, locale);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>

      {volume.notes && volume.notes.length > 0 ? (
        <div className="space-y-3">
          {volume.notes.map((note) => {
            const noteTitle = pickLocalized(note.titleEn, note.titleHi, locale);
            return (
              <div
                key={note.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <p className="font-medium">{noteTitle}</p>
                </div>
                <NoteDownloadButton note={note} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title={t('title')} description="No notes here yet." />
      )}
    </div>
  );
}

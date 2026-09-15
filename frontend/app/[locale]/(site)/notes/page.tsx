import { getTranslations } from 'next-intl/server';
import { noteVolumesService } from '@/services/content.service';
import { NoteVolumeCard } from '@/components/cards/note-volume-card';
import { EmptyState } from '@/components/shared/empty-state';

export default async function NotesPage() {
  const t = await getTranslations('notes');
  const volumes = await noteVolumesService.list().catch(() => null);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('volumes')}</h1>
      {volumes && volumes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volumes.map((volume) => (
            <NoteVolumeCard key={volume.id} volume={volume} />
          ))}
        </div>
      ) : (
        <EmptyState title="No notes published yet" />
      )}
    </div>
  );
}

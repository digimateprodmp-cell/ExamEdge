import { getTranslations } from 'next-intl/server';
import { PlayCircle } from 'lucide-react';
import { videosService } from '@/services/content.service';
import { EmptyState } from '@/components/shared/empty-state';
import { VideoPlayButton } from '@/components/shared/video-play-button';
import { pickLocalized } from '@/lib/i18n-content';

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('videos');
  const videos = await videosService.list().catch(() => null);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      {videos && videos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div key={video.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-primary/10">
                <PlayCircle className="h-9 w-9 text-primary" />
              </div>
              <p className="mb-3 font-medium leading-snug">{pickLocalized(video.titleEn, video.titleHi, locale)}</p>
              <VideoPlayButton video={video} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No videos published yet" />
      )}
    </div>
  );
}

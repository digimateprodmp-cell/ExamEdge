import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Layers } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { testSeriesService } from '@/services/test-series.service';
import { pickLocalized, formatInr } from '@/lib/i18n-content';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { PurchaseButton } from '@/components/shared/purchase-button';
import { ApiError } from '@/lib/api';

export default async function TestSeriesDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('testSeries');
  const common = await getTranslations('common');

  const series = await testSeriesService.get(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    return null;
  });

  if (!series) notFound();

  const title = pickLocalized(series.titleEn, series.titleHi, locale);
  const description = pickLocalized(series.descriptionEn, series.descriptionHi, locale);

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        <Badge className="w-fit text-base" variant={series.isFree ? 'success' : 'default'}>
          {series.isFree ? common('free') : formatInr(series.price)}
        </Badge>
      </div>

      {!series.isFree && (
        <div className="mb-8 max-w-sm">
          <PurchaseButton itemType="TEST_SERIES" itemId={series.id} price={series.price} isFree={series.isFree} />
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold">{t('listOfVolumes')}</h2>

      {series.volumes && series.volumes.length > 0 ? (
        <div className="space-y-3">
          {series.volumes.map((volume) => {
            const volumeTitle = pickLocalized(volume.titleEn, volume.titleHi, locale);
            return (
              <Link
                key={volume.id}
                href={`/test-series/${series.id}/${volume.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <span className="flex items-center gap-3 font-semibold">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  {volumeTitle}
                </span>
                <span className="text-sm font-semibold text-primary">{t('continue')} →</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No test volumes yet" />
      )}
    </div>
  );
}

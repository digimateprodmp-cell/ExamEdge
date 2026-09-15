import { getTranslations } from 'next-intl/server';
import { testSeriesService } from '@/services/test-series.service';
import { TestSeriesCard } from '@/components/cards/test-series-card';
import { EmptyState } from '@/components/shared/empty-state';

export default async function TestSeriesListPage() {
  const t = await getTranslations('testSeries');
  const result = await testSeriesService.list(1, 24).catch(() => null);

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {result && result.items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((series) => (
            <TestSeriesCard key={series.id} series={series} />
          ))}
        </div>
      ) : (
        <EmptyState title="No test series available yet" description="Please check back soon." />
      )}
    </div>
  );
}

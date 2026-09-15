import { getTranslations } from 'next-intl/server';
import { batchesService } from '@/services/content.service';
import { BatchCard } from '@/components/cards/batch-card';
import { EmptyState } from '@/components/shared/empty-state';

export default async function BatchesPage() {
  const t = await getTranslations('batches');
  const result = await batchesService.list(1, 24).catch(() => null);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      {result && result.items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      ) : (
        <EmptyState title="No batches published yet" />
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import { batchesService } from '@/services/content.service';
import { pickLocalized } from '@/lib/i18n-content';
import { Card, CardContent } from '@/components/ui/card';
import { PurchaseButton } from '@/components/shared/purchase-button';

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const batch = await batchesService.get(id).catch(() => null);
  if (!batch) notFound();

  const title = pickLocalized(batch.titleEn, batch.titleHi, locale);
  const description = pickLocalized(batch.descriptionEn, batch.descriptionHi, locale);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}

      {batch.videos && batch.videos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Free preview</h2>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {batch.videos.map((v) => (
              <li key={v.id}>{pickLocalized(v.titleEn, v.titleHi, locale)}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="pt-6">
          <PurchaseButton itemType="BATCH" itemId={batch.id} price={batch.price} isFree={batch.isFree} />
        </CardContent>
      </Card>
    </div>
  );
}

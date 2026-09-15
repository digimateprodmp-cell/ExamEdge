import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { testSeriesService } from '@/services/test-series.service';
import { pickLocalized } from '@/lib/i18n-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';

const TYPE_VARIANT = {
  LIVE: 'destructive',
  PRACTICE: 'success',
  PDF: 'default',
} as const;

const TYPE_LABEL_KEY = {
  LIVE: 'live',
  PRACTICE: 'practice',
  PDF: 'pdfTest',
} as const;

export default async function TestVolumeSetsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; volumeId: string }>;
}) {
  const { locale, volumeId } = await params;
  const t = await getTranslations('testSeries');

  const tests = await testSeriesService.testsInVolume(volumeId).catch(() => null);
  if (!tests) notFound();

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('listOfTestSets')}</h1>

      {tests.length > 0 ? (
        <div className="space-y-3">
          {tests.map((test) => {
            const title = pickLocalized(test.titleEn, test.titleHi, locale);
            return (
              <div
                key={test.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileQuestion className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.durationMinutes} {t('minutes')} · {test.isFree ? 'Free' : `₹${test.price}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[test.type]}>{t(TYPE_LABEL_KEY[test.type])}</Badge>
                  <Button asChild size="sm">
                    <Link href={`/test/${test.id}`}>{t('continue')}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No tests published in this volume yet" />
      )}
    </div>
  );
}

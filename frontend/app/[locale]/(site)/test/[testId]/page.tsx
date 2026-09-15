import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, ListChecks, Minus, Plus } from 'lucide-react';
import { testSeriesService } from '@/services/test-series.service';
import { pickLocalized } from '@/lib/i18n-content';
import { Card, CardContent } from '@/components/ui/card';
import { StartTestPanel } from '@/components/test-engine/start-test-panel';

export default async function TestInstructionsPage({
  params,
}: {
  params: Promise<{ locale: string; testId: string }>;
}) {
  const { locale, testId } = await params;
  const t = await getTranslations('testSeries');

  const test = await testSeriesService.test(testId).catch(() => null);
  if (!test) notFound();

  const title = pickLocalized(test.titleEn, test.titleHi, locale);
  const instructions = pickLocalized(test.instructionsEn, test.instructionsHi, locale);

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardContent className="space-y-6 pt-8">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat icon={<Clock className="h-4 w-4" />} label={t('duration')} value={`${test.durationMinutes} ${t('minutes')}`} />
            <Stat icon={<ListChecks className="h-4 w-4" />} label={t('totalQuestions')} value={String(test._count?.testQuestions ?? '-')} />
            <Stat icon={<Plus className="h-4 w-4" />} label={t('marksPerQuestion')} value={test.marksPerQuestion} />
            <Stat icon={<Minus className="h-4 w-4" />} label={t('negativeMarking')} value={test.negativeMarks} />
          </div>

          {instructions && (
            <div>
              <h2 className="mb-2 font-semibold">{t('instructions')}</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{instructions}</p>
            </div>
          )}

          <StartTestPanel testId={test.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

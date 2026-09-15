import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pickLocalized, formatInr } from '@/lib/i18n-content';
import type { TestSeries } from '@/types';

export function TestSeriesCard({ series }: { series: TestSeries }) {
  const locale = useLocale();
  const t = useTranslations('testSeries');
  const common = useTranslations('common');
  const title = pickLocalized(series.titleEn, series.titleHi, locale);
  const description = pickLocalized(series.descriptionEn, series.descriptionHi, locale);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <BookOpen className="h-10 w-10 text-primary" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{title}</h3>
          {series.isFree && <Badge variant="success" className="shrink-0">{common('free')}</Badge>}
        </div>
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {series.validityDays} {t('days')}
          </div>
          <span className="font-semibold text-primary">
            {series.isFree ? common('free') : formatInr(series.price)}
          </span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/test-series/${series.id}`}>{t('continue')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

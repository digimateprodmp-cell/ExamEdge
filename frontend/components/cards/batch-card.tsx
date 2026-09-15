import { useLocale, useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pickLocalized, formatInr } from '@/lib/i18n-content';
import type { Batch } from '@/types';

export function BatchCard({ batch }: { batch: Batch }) {
  const locale = useLocale();
  const t = useTranslations('batches');
  const common = useTranslations('common');
  const title = pickLocalized(batch.titleEn, batch.titleHi, locale);
  const description = pickLocalized(batch.descriptionEn, batch.descriptionHi, locale);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <Users className="h-9 w-9 text-primary" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{title}</h3>
          {batch.isFree && <Badge variant="success">{common('free')}</Badge>}
        </div>
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-primary">{batch.isFree ? common('free') : formatInr(batch.price)}</span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/batches/${batch.id}`}>{t('enroll')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

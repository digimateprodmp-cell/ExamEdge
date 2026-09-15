import { useLocale, useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pickLocalized, formatInr } from '@/lib/i18n-content';
import type { NoteVolume } from '@/types';

export function NoteVolumeCard({ volume }: { volume: NoteVolume }) {
  const locale = useLocale();
  const common = useTranslations('common');
  const title = pickLocalized(volume.titleEn, volume.titleHi, locale);

  return (
    <Link href={`/notes/${volume.id}`}>
      <Card className="flex h-full items-center gap-4 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <CardContent className="flex-1 p-0">
          <h3 className="font-semibold leading-snug">{title}</h3>
          <Badge variant={volume.isFree ? 'success' : 'secondary'} className="mt-2">
            {volume.isFree ? common('free') : formatInr(volume.price)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

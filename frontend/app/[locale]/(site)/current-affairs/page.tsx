import { getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { currentAffairsService } from '@/services/content.service';
import { EmptyState } from '@/components/shared/empty-state';

export default async function CurrentAffairsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('currentAffairs');
  const result = await currentAffairsService.list(locale, 1, 30).catch(() => null);

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('dailyUpdates')}</h1>
      {result && result.items.length > 0 ? (
        <div className="space-y-3">
          {result.items.map((item) => (
            <Link
              key={item.id}
              href={`/current-affairs/${item.id}`}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Newspaper className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                <p className="font-medium leading-snug">{item.title}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No current affairs published yet" />
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import { currentAffairsService } from '@/services/content.service';

export default async function CurrentAffairDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const item = await currentAffairsService.get(id, locale).catch(() => null);
  if (!item) notFound();

  return (
    <article className="container max-w-2xl py-10">
      {item.category && <p className="mb-2 text-sm font-semibold text-primary">{item.category.nameEn}</p>}
      <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
      <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{item.title}</h1>
      <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/90">{item.content}</div>
    </article>
  );
}

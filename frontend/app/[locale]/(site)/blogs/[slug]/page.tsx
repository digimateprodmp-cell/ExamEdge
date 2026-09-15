import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { blogsService } from '@/services/content.service';

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('blogs');
  const blog = await blogsService.get(slug, locale).catch(() => null);
  if (!blog) notFound();

  return (
    <article className="container max-w-2xl py-10">
      {blog.category && (
        <p className="mb-2 text-sm font-semibold text-primary">{blog.category.nameEn}</p>
      )}
      <h1 className="text-3xl font-extrabold leading-tight">{blog.title}</h1>
      {blog.publishedAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('publishedOn')} {new Date(blog.publishedAt).toLocaleDateString()}
        </p>
      )}
      <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-foreground/90">
        {blog.content}
      </div>
    </article>
  );
}

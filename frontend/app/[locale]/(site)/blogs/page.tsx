import { getTranslations } from 'next-intl/server';
import { blogsService } from '@/services/content.service';
import { BlogCard } from '@/components/cards/blog-card';
import { EmptyState } from '@/components/shared/empty-state';

export default async function BlogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('blogs');
  const result = await blogsService.list(locale, 1, 24).catch(() => null);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      {result && result.items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <EmptyState title="No blog posts yet" />
      )}
    </div>
  );
}

import { useTranslations } from 'next-intl';
import { Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Blog } from '@/types';

export function BlogCard({ blog }: { blog: Blog }) {
  const t = useTranslations('blogs');

  return (
    <Link href={`/blogs/${blog.slug}`}>
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-accent/10 to-primary/10">
          <Newspaper className="h-9 w-9 text-accent" />
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 pt-5">
          {blog.category && <Badge variant="secondary" className="w-fit">{blog.category.nameEn}</Badge>}
          <h3 className="font-semibold leading-snug line-clamp-2">{blog.title}</h3>
          {blog.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{blog.excerpt}</p>}
          <span className="mt-auto pt-2 text-sm font-semibold text-primary">{t('readMore')} →</span>
        </CardContent>
      </Card>
    </Link>
  );
}

import { getTranslations } from 'next-intl/server';
import { ClipboardCheck, Newspaper, BookMarked, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { TestSeriesCard } from '@/components/cards/test-series-card';
import { BlogCard } from '@/components/cards/blog-card';
import { testSeriesService } from '@/services/test-series.service';
import { blogsService, currentAffairsService } from '@/services/content.service';
import { EmptyState } from '@/components/shared/empty-state';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const common = await getTranslations('common');

  const [testSeries, blogs, currentAffairs] = await Promise.all([
    testSeriesService.list(1, 6).catch(() => null),
    blogsService.list(locale, 1, 3).catch(() => null),
    currentAffairsService.list(locale, 1, 3).catch(() => null),
  ]);

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">{t('heroTitle')}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t('heroSubtitle')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/test-series">{t('heroCtaPrimary')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/current-affairs">{t('heroCtaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-border bg-primary py-2.5 text-primary-foreground">
        <div className="animate-[marquee_28s_linear_infinite] whitespace-nowrap text-sm font-medium">
          {[t('marquee1'), t('marquee2'), t('marquee3'), t('marquee4')].map((item, i) => (
            <span key={i} className="mx-8 inline-block">
              {item}
            </span>
          ))}
          {[t('marquee1'), t('marquee2'), t('marquee3'), t('marquee4')].map((item, i) => (
            <span key={`dup-${i}`} className="mx-8 inline-block">
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="container grid gap-4 py-10 sm:grid-cols-3">
        <QuickNavTile href="/test-series" icon={<ClipboardCheck className="h-5 w-5" />} label={t('quickNavTestSeries')} />
        <QuickNavTile href="/current-affairs" icon={<Newspaper className="h-5 w-5" />} label={t('quickNavCurrentAffairs')} />
        <QuickNavTile href="/notes" icon={<BookMarked className="h-5 w-5" />} label={t('quickNavNotes')} />
      </section>

      <section className="container py-10">
        <SectionHeader title={t('latestTestSeries')} href="/test-series" viewAllLabel={common('viewAll')} />
        {testSeries && testSeries.items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testSeries.items.map((series) => (
              <TestSeriesCard key={series.id} series={series} />
            ))}
          </div>
        ) : (
          <EmptyState title="No test series published yet" />
        )}
      </section>

      {currentAffairs && currentAffairs.items.length > 0 && (
        <section className="container py-10">
          <SectionHeader title={t('latestCurrentAffairs')} href="/current-affairs" viewAllLabel={common('viewAll')} />
          <div className="grid gap-4 sm:grid-cols-3">
            {currentAffairs.items.map((item) => (
              <Link
                key={item.id}
                href={`/current-affairs/${item.id}`}
                className="rounded-2xl border border-border p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                <h3 className="mt-1 font-semibold leading-snug line-clamp-2">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {blogs && blogs.items.length > 0 && (
        <section className="container py-10">
          <SectionHeader title={t('latestBlogs')} href="/blogs" viewAllLabel={common('viewAll')} />
          <div className="grid gap-5 sm:grid-cols-3">
            {blogs.items.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickNavTile({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <span className="flex items-center gap-3 font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function SectionHeader({ title, href, viewAllLabel }: { title: string; href: string; viewAllLabel: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-primary hover:underline">
        {viewAllLabel} →
      </Link>
    </div>
  );
}

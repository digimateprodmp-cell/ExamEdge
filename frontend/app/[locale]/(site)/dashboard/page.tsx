'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Coins, GraduationCap, Ticket } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RequireAuth } from '@/components/shared/require-auth';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();

  const tiles = [
    { href: '/my-coupons', icon: Ticket, title: t('myCoupons'), desc: t('myCouponsDesc') },
    { href: '/coins', icon: Coins, title: t('myCoins'), desc: t('myCoinsDesc') },
    { href: '/my-test-series', icon: GraduationCap, title: t('activeCourses'), desc: t('activeCoursesDesc') },
    { href: '/test-series', icon: BookOpen, title: t('recommendedTests'), desc: '' },
  ];

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {user && <p className="mt-1 text-muted-foreground">{t('welcome', { name: user.name })}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <tile.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{tile.title}</p>
              {tile.desc && <p className="text-sm text-muted-foreground">{tile.desc}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

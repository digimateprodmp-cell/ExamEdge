'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Coins, GraduationCap, Newspaper, Radio, Ticket } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RequireAuth } from '@/components/shared/require-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { studentProfileService } from '@/services/student-profile.service';
import { liveTestsService } from '@/services/live-tests.service';
import { attemptsService } from '@/services/attempts.service';
import type { AttemptSummary, LiveTest, StudentExamProfile } from '@/types';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const t = useTranslations('dashboard');
  const { user, accessToken } = useAuth();

  const [profiles, setProfiles] = React.useState<StudentExamProfile[]>([]);
  const [liveTests, setLiveTests] = React.useState<LiveTest[]>([]);
  const [recentAttempts, setRecentAttempts] = React.useState<AttemptSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      studentProfileService.listMine(accessToken),
      liveTestsService.list(),
      attemptsService.mine(accessToken),
    ])
      .then(([p, lt, attempts]) => {
        setProfiles(p);
        setLiveTests(lt.filter((l) => l.status === 'UPCOMING' || l.status === 'COUNTDOWN' || l.status === 'LIVE'));
        setRecentAttempts(attempts.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const secondaryTiles = [
    { href: '/current-affairs', icon: Newspaper, title: 'Current Affairs', desc: 'Daily updates' },
    { href: '/my-coupons', icon: Ticket, title: t('myCoupons'), desc: t('myCouponsDesc') },
    { href: '/coins', icon: Coins, title: t('myCoins'), desc: t('myCoinsDesc') },
    { href: '/my-test-series', icon: GraduationCap, title: t('activeCourses'), desc: t('activeCoursesDesc') },
    { href: '/test-series', icon: BookOpen, title: t('recommendedTests'), desc: '' },
  ];

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">
        {greeting}{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
      </h1>

      {profiles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold">What are you preparing for?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the competitive exams you&apos;re targeting to unlock a personalized dashboard.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/my-exams">+ Add Competitive Exam</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Exams</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/my-exams">+ Add Competitive Exam</Link>
            </Button>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{p.examCycle.exam?.nameEn}</p>
                  {p.isPrimary && <Badge variant="accent">Primary</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">Cycle {p.examCycle.year}</p>
                <Button asChild size="sm" className="mt-2">
                  <Link href={`/exams/${p.examCycleId}`}>Continue Practice →</Link>
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Upcoming Live Tests</h2>
          {liveTests.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No live tests scheduled right now.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {liveTests.slice(0, 3).map((lt) => (
                <Link
                  key={lt.id}
                  href={`/live-tests/${lt.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Radio className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{lt.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(lt.startAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={lt.status === 'LIVE' ? 'destructive' : 'secondary'}>{lt.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">Recent Results</h2>
          {recentAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No attempts yet — start a practice test to see results here.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {recentAttempts.map((a) => (
                <Link
                  key={a.id}
                  href={`/result/${a.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium">{a.test.titleEn}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'In progress'}
                    </p>
                  </div>
                  {a.score !== null && <Badge variant="success">{a.score} marks</Badge>}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <h2 className="mt-8 text-lg font-semibold">More</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryTiles.map((tile) => (
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

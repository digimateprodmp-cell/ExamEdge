'use client';

import * as React from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, ClipboardList, Radio, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RequireAuth } from '@/components/shared/require-auth';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { examsService } from '@/services/exams.service';
import { liveTestsService } from '@/services/live-tests.service';
import { testSeriesService } from '@/services/test-series.service';
import { attemptsService } from '@/services/attempts.service';
import type { AttemptSummary, ExamCycle, ExamSyllabus, LiveTest, TestSeries } from '@/types';

type Tab = 'overview' | 'syllabus' | 'practice' | 'live' | 'performance';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: ClipboardList },
  { id: 'live', label: 'Live Tests', icon: Radio },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
];

export default function ExamDashboardPage({ params }: { params: Promise<{ examCycleId: string }> }) {
  const { examCycleId } = use(params);
  return (
    <RequireAuth>
      <ExamDashboardContent examCycleId={examCycleId} />
    </RequireAuth>
  );
}

function ExamDashboardContent({ examCycleId }: { examCycleId: string }) {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) ?? 'overview';
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [cycle, setCycle] = React.useState<ExamCycle | null>(null);
  const [syllabus, setSyllabus] = React.useState<ExamSyllabus | null>(null);
  const [testSeries, setTestSeries] = React.useState<TestSeries[]>([]);
  const [liveTests, setLiveTests] = React.useState<LiveTest[]>([]);
  const [attempts, setAttempts] = React.useState<AttemptSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      examsService.cycle(examCycleId),
      examsService.syllabus(examCycleId),
      liveTestsService.list(examCycleId),
      attemptsService.mine(accessToken),
    ])
      .then(async ([c, s, lt, a]) => {
        setCycle(c);
        setSyllabus(s);
        setLiveTests(lt);
        setAttempts(a);
        if (c.courseId) {
          const ts = await testSeriesService.list(1, 20, undefined, c.courseId);
          setTestSeries(ts.items);
        }
      })
      .finally(() => setLoading(false));
  }, [accessToken, examCycleId]);

  if (loading || !cycle) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link href="/my-exams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> My Exams
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{cycle.exam?.nameEn}</h1>
      <p className="mt-1 text-muted-foreground">
        Cycle {cycle.year}
        {syllabus && ` · Syllabus v${syllabus.version}`}
      </p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tb.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tb.icon className="h-4 w-4" />
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Practice Tests Available" value={testSeries.length} />
            <StatCard label="Upcoming Live Tests" value={liveTests.filter((l) => l.status !== 'ENDED' && l.status !== 'CANCELLED').length} />
            <StatCard label="Attempts Completed" value={attempts.filter((a) => a.status !== 'IN_PROGRESS').length} />
          </div>
        )}

        {tab === 'syllabus' && (
          <div>
            {!syllabus || syllabus.subjects.length === 0 ? (
              <EmptyNote text="Syllabus for this exam cycle hasn't been configured yet." />
            ) : (
              <div className="space-y-4">
                {syllabus.subjects.map((s) => (
                  <div key={s.subjectId} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-semibold">{s.nameEn}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.topics.map((t) => (
                        <Badge key={t.id} variant="outline">
                          {t.nameEn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'practice' && (
          <div>
            {testSeries.length === 0 ? (
              <EmptyNote text="No practice test series linked to this exam yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {testSeries.map((ts) => (
                  <Link
                    key={ts.id}
                    href={`/test-series/${ts.id}`}
                    className="rounded-xl border border-border bg-card p-4 hover:shadow-sm"
                  >
                    <p className="font-semibold">{ts.titleEn}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ts.isFree ? 'Free' : `₹${ts.price}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'live' && (
          <div>
            {liveTests.length === 0 ? (
              <EmptyNote text="No live tests scheduled for this exam yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liveTests.map((lt) => (
                  <Link key={lt.id} href={`/live-tests/${lt.id}`} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm">
                    <Badge variant={lt.status === 'LIVE' ? 'destructive' : 'secondary'}>{lt.status}</Badge>
                    <p className="mt-2 font-semibold">{lt.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lt.startAt).toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'performance' && (
          <div>
            {attempts.length === 0 ? (
              <EmptyNote text="No attempts yet for this exam." />
            ) : (
              <div className="space-y-2">
                {attempts.map((a) => (
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
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">{text}</p>;
}

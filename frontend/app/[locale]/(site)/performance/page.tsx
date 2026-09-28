'use client';

import * as React from 'react';
import { RequireAuth } from '@/components/shared/require-auth';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/hooks/use-auth';
import { attemptsService } from '@/services/attempts.service';
import type { AttemptSummary } from '@/types';

export default function PerformancePage() {
  return (
    <RequireAuth>
      <PerformanceContent />
    </RequireAuth>
  );
}

function PerformanceContent() {
  const { accessToken } = useAuth();
  const [attempts, setAttempts] = React.useState<AttemptSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;
    attemptsService.mine(accessToken).then(setAttempts).finally(() => setLoading(false));
  }, [accessToken]);

  const completed = attempts.filter((a) => a.status !== 'IN_PROGRESS');
  const avgScore =
    completed.length > 0
      ? (
          completed.reduce((sum, a) => sum + (a.score ? Number(a.score) : 0), 0) / completed.length
        ).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Performance</h1>
      <p className="mt-1 text-muted-foreground">Your attempt history across every exam and test.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Attempts Completed" value={completed.length} />
        <Stat label="Total Attempts (incl. in progress)" value={attempts.length} />
        <Stat label="Average Score" value={avgScore ?? '—'} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Attempt History</h2>
      {attempts.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No attempts yet. Start a practice test to build your performance history.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {attempts.map((a) => (
            <Link
              key={a.id}
              href={a.status === 'IN_PROGRESS' ? '#' : `/result/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm"
            >
              <div>
                <p className="font-medium">{a.test.titleEn}</p>
                <p className="text-xs text-muted-foreground">
                  {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'In progress'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {a.correctCount !== null && (
                  <span className="text-success">{a.correctCount} correct</span>
                )}
                {a.incorrectCount !== null && (
                  <span className="text-destructive">{a.incorrectCount} incorrect</span>
                )}
                {a.score !== null ? (
                  <Badge variant="success">{a.score} marks</Badge>
                ) : (
                  <Badge variant="secondary">{a.status}</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

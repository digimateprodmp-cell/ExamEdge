'use client';

import * as React from 'react';
import { ClipboardList } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RequireAuth } from '@/components/shared/require-auth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { studentProfileService } from '@/services/student-profile.service';
import type { StudentExamProfile } from '@/types';

export default function PracticeLandingPage() {
  return (
    <RequireAuth>
      <PracticeLandingContent />
    </RequireAuth>
  );
}

function PracticeLandingContent() {
  const { accessToken } = useAuth();
  const [profiles, setProfiles] = React.useState<StudentExamProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;
    studentProfileService.listMine(accessToken).then(setProfiles).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Practice</h1>
      <p className="mt-1 text-muted-foreground">Pick an exam to see its practice tests, or browse all test series.</p>

      {profiles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">Add a competitive exam first to get a personalized practice pool.</p>
          <Button asChild className="mt-4">
            <Link href="/my-exams">+ Add Competitive Exam</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/exams/${p.examCycleId}?tab=practice`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{p.examCycle.exam?.nameEn}</p>
                <p className="text-sm text-muted-foreground">Practice tests →</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/test-series">Browse all test series</Link>
        </Button>
      </div>
    </div>
  );
}

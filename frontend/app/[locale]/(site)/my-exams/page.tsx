'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Star, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RequireAuth } from '@/components/shared/require-auth';
import { ExamPicker } from '@/components/exams/exam-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { studentProfileService } from '@/services/student-profile.service';
import { ApiError } from '@/lib/api';
import type { StudentExamProfile } from '@/types';

export default function MyExamsPage() {
  return (
    <RequireAuth>
      <MyExamsContent />
    </RequireAuth>
  );
}

function MyExamsContent() {
  const { accessToken } = useAuth();
  const [profiles, setProfiles] = React.useState<StudentExamProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPicker, setShowPicker] = React.useState(false);

  const load = React.useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    studentProfileService
      .listMine(accessToken)
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, [accessToken]);

  React.useEffect(load, [load]);

  const setPrimary = async (id: string) => {
    if (!accessToken) return;
    try {
      await studentProfileService.setPrimary(accessToken, id);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not set primary exam');
    }
  };

  const remove = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!confirm(`Remove ${name} from your profile?`)) return;
    try {
      await studentProfileService.remove(accessToken, id);
      toast.success(`${name} removed`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove this exam');
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Exams</h1>
          <p className="mt-1 text-muted-foreground">
            Add every competitive exam you&apos;re preparing for — switch between them anytime.
          </p>
        </div>
        <Button onClick={() => setShowPicker((v) => !v)}>{showPicker ? 'Done' : '+ Add Competitive Exam'}</Button>
      </div>

      {showPicker && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <ExamPicker
            alreadySelectedCycleIds={new Set(profiles.map((p) => p.examCycleId))}
            onChanged={setProfiles}
          />
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            You haven&apos;t added any exams yet. Click &quot;+ Add Competitive Exam&quot; to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.examCycle.exam?.nameEn}</p>
                    <p className="text-sm text-muted-foreground">Cycle {p.examCycle.year}</p>
                  </div>
                  {p.isPrimary && <Badge variant="accent">Primary</Badge>}
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/exams/${p.examCycleId}`}>Open</Link>
                  </Button>
                  {!p.isPrimary && (
                    <Button variant="outline" size="icon" title="Set as primary" onClick={() => setPrimary(p.id)}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    title="Remove"
                    onClick={() => remove(p.id, p.examCycle.exam?.nameEn ?? 'this exam')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

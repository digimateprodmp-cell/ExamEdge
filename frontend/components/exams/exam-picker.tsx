'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { examsService } from '@/services/exams.service';
import { studentProfileService } from '@/services/student-profile.service';
import { ApiError } from '@/lib/api';
import type { Exam, StudentExamProfile } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  UPSC: 'Civil Services',
  SSC: 'SSC',
  BANKING: 'Banking',
  STATE_PSC: 'State PSC',
  RAILWAY: 'Railways',
  DEFENCE: 'Defence',
  OTHER: 'Other',
};

/**
 * Real exam catalogue from the backend (GET /api/exams) — never hardcoded.
 * Each exam's most recent cycle is what actually gets added to the
 * student's profile (StudentExamProfile is keyed on examCycleId).
 */
export function ExamPicker({
  onChanged,
  alreadySelectedCycleIds,
}: {
  onChanged?: (profiles: StudentExamProfile[]) => void;
  alreadySelectedCycleIds: Set<string>;
}) {
  const { accessToken } = useAuth();
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string | null>(null);
  const [addingId, setAddingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    examsService
      .list()
      .then(setExams)
      .catch(() => toast.error('Could not load the exam catalogue'))
      .finally(() => setLoading(false));
  }, []);

  const categories = React.useMemo(
    () => Array.from(new Set(exams.map((e) => e.category))),
    [exams],
  );

  const filtered = exams.filter((e) => {
    if (category && e.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.nameEn.toLowerCase().includes(q) || e.nameHi?.includes(search);
  });

  const addExam = async (exam: Exam) => {
    if (!accessToken) return;
    const cycle = exam.cycles?.[0];
    if (!cycle) {
      toast.error(`${exam.nameEn} has no active cycle configured yet — ask an admin to add one.`);
      return;
    }
    setAddingId(exam.id);
    try {
      await studentProfileService.add(accessToken, cycle.id);
      toast.success(`${exam.nameEn} added to your profile`);
      const profiles = await studentProfileService.listMine(accessToken);
      onChanged?.(profiles);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not add this exam');
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No exams have been configured yet. Please check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exams — e.g. UPSC, SSC CGL, IBPS PO"
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!category ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${category === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((exam) => {
          const cycle = exam.cycles?.[0];
          const alreadyAdded = cycle ? alreadySelectedCycleIds.has(cycle.id) : false;
          return (
            <div
              key={exam.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-semibold">{exam.nameEn}</p>
                {exam.nameHi && <p className="text-sm text-muted-foreground">{exam.nameHi}</p>}
                <Badge variant="outline" className="mt-1">
                  {CATEGORY_LABELS[exam.category] ?? exam.category}
                  {cycle ? ` · ${cycle.year}` : ''}
                </Badge>
              </div>
              {alreadyAdded ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="h-5 w-5" />
                </span>
              ) : (
                <button
                  onClick={() => addExam(exam)}
                  disabled={addingId === exam.id}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {addingId === exam.id ? 'Adding…' : '+ Add'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

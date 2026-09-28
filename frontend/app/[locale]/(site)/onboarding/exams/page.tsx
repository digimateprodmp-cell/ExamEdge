'use client';

import * as React from 'react';
import { RequireAuth } from '@/components/shared/require-auth';
import { ExamPicker } from '@/components/exams/exam-picker';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { studentProfileService } from '@/services/student-profile.service';
import type { StudentExamProfile } from '@/types';

export default function OnboardingExamsPage() {
  return (
    <RequireAuth>
      <OnboardingContent />
    </RequireAuth>
  );
}

function OnboardingContent() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = React.useState<StudentExamProfile[]>([]);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!accessToken) return;
    studentProfileService
      .listMine(accessToken)
      .then((rows) => {
        setProfiles(rows);
        // If the student already has exams selected, this screen has nothing
        // to do — send them straight to the dashboard rather than re-asking.
        if (rows.length > 0) router.replace('/dashboard');
      })
      .finally(() => setChecked(true));
  }, [accessToken, router]);

  if (!checked) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold">
        Welcome{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        What are you preparing for? Select every competitive exam you&apos;re targeting — you can add or remove
        exams anytime from your profile.
      </p>

      <div className="mt-6">
        <ExamPicker alreadySelectedCycleIds={new Set(profiles.map((p) => p.examCycleId))} onChanged={setProfiles} />
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" disabled={profiles.length === 0} onClick={() => router.push('/dashboard')}>
          Continue to Dashboard {profiles.length > 0 ? `(${profiles.length} selected)` : ''}
        </Button>
      </div>
    </div>
  );
}

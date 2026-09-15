'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, Link } from '@/i18n/navigation';
import { attemptsService } from '@/services/attempts.service';
import { ApiError } from '@/lib/api';
import { ResultSummary } from '@/components/test-engine/result-summary';
import { QuestionCard } from '@/components/test-engine/question-card';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import type { Attempt } from '@/types';

export default function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const t = useTranslations('testEngine');
  const { accessToken, status } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'authenticated' || !accessToken) return;

    attemptsService
      .result(accessToken, attemptId)
      .then(setAttempt)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your result'));
  }, [accessToken, status, attemptId, router]);

  if (error) {
    return (
      <div className="container py-10">
        <ErrorState description={error} />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{attempt.title}</h1>

      <ResultSummary attempt={attempt} />

      <div className="mt-8 space-y-8">
        <h2 className="text-lg font-semibold">{t('viewSolutions')}</h2>
        {attempt.questions.map((question, index) => (
          <div key={question.testQuestionId} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <QuestionCard question={question} index={index} reviewMode />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href="/my-test-series">{t('backToTestSeries')}</Link>
        </Button>
      </div>
    </div>
  );
}

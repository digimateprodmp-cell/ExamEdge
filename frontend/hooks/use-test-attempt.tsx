'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { attemptsService } from '@/services/attempts.service';
import { ApiError } from '@/lib/api';
import type { Attempt, Language } from '@/types';

export function useTestAttempt(attemptId: string) {
  const { accessToken, status: authStatus } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const submittingRef = React.useRef(false);

  const load = React.useCallback(
    async (lang?: Language) => {
      if (!accessToken) return;
      try {
        const data = await attemptsService.get(accessToken, attemptId, lang);
        setAttempt(data);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load this test attempt');
      } finally {
        setLoading(false);
      }
    },
    [accessToken, attemptId],
  );

  React.useEffect(() => {
    if (authStatus === 'authenticated') {
      load();
    } else if (authStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authStatus, load, router]);

  const submit = React.useCallback(async () => {
    if (!accessToken || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await attemptsService.submit(accessToken, attemptId);
      router.push(`/result/${result.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not submit the test');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [accessToken, attemptId, router]);

  React.useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !submittingRef.current) {
        toast.message("Time's up! Submitting your test...");
        submit();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt, submit]);

  const selectOption = React.useCallback(
    async (testQuestionId: string, optionId: string) => {
      if (!accessToken || !attempt) return;
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.testQuestionId === testQuestionId ? { ...q, selectedOptionId: optionId } : q,
              ),
            }
          : prev,
      );
      try {
        await attemptsService.saveAnswer(accessToken, attemptId, testQuestionId, { selectedOptionId: optionId });
      } catch {
        toast.error('Could not save your answer — check your connection');
      }
    },
    [accessToken, attempt, attemptId],
  );

  const clearResponse = React.useCallback(
    async (testQuestionId: string) => {
      if (!accessToken) return;
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.testQuestionId === testQuestionId ? { ...q, selectedOptionId: null } : q,
              ),
            }
          : prev,
      );
      try {
        await attemptsService.saveAnswer(accessToken, attemptId, testQuestionId, { selectedOptionId: null });
      } catch {
        toast.error('Could not clear your answer — check your connection');
      }
    },
    [accessToken, attemptId],
  );

  const toggleMarkForReview = React.useCallback(
    async (testQuestionId: string) => {
      if (!accessToken || !attempt) return;
      const question = attempt.questions.find((q) => q.testQuestionId === testQuestionId);
      const next = !question?.isMarkedForReview;
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.testQuestionId === testQuestionId ? { ...q, isMarkedForReview: next } : q,
              ),
            }
          : prev,
      );
      try {
        await attemptsService.saveAnswer(accessToken, attemptId, testQuestionId, { isMarkedForReview: next });
      } catch {
        toast.error('Could not save — check your connection');
      }
    },
    [accessToken, attempt, attemptId],
  );

  const switchLanguage = React.useCallback(
    (lang: Language) => {
      setLoading(true);
      load(lang);
    },
    [load],
  );

  return {
    attempt,
    currentIndex,
    setCurrentIndex,
    loading,
    error,
    submitting,
    secondsLeft,
    selectOption,
    clearResponse,
    toggleMarkForReview,
    switchLanguage,
    submit,
    reload: load,
  };
}

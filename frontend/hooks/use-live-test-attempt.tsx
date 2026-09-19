'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useServerClock } from '@/hooks/use-server-clock';
import { useExamIntegrity } from '@/hooks/use-exam-integrity';
import { useRouter } from '@/i18n/navigation';
import { liveTestsService } from '@/services/live-tests.service';
import { ApiError } from '@/lib/api';
import type { LiveTestAttemptState } from '@/types';

export function useLiveTestAttempt(attemptId: string) {
  const { accessToken, status: authStatus } = useAuth();
  const router = useRouter();
  const { now } = useServerClock();

  const [state, setState] = React.useState<LiveTestAttemptState | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const submittingRef = React.useRef(false);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await liveTestsService.getState(accessToken, attemptId);
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this live test attempt');
    } finally {
      setLoading(false);
    }
  }, [accessToken, attemptId]);

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
      await liveTestsService.submit(accessToken, attemptId);
      router.push(`/result/${state?.attempt.id ?? ''}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not submit the test');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [accessToken, attemptId, router, state]);

  const handleTerminated = React.useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    toast.error('Your attempt was terminated for a second integrity violation.');
    router.push(`/result/${state?.attempt.id ?? ''}`);
  }, [router, state]);

  const integrity = useExamIntegrity(
    accessToken,
    state?.liveTestAttemptId ?? null,
    state?.integrityPolicyConfig ?? null,
    !!state && state.status === 'IN_PROGRESS',
    handleTerminated,
  );

  // Server-synchronized countdown: uses the offset clock, never raw Date.now().
  React.useEffect(() => {
    if (!state || state.status !== 'IN_PROGRESS') return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(state.attempt.expiresAt).getTime() - now().getTime()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining <= 0 && !submittingRef.current) {
        toast.message("Time's up! Submitting your live test...");
        submit();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state, now, submit]);

  const selectOption = React.useCallback(
    async (testQuestionId: string, optionId: string) => {
      if (!accessToken || !state) return;
      setState((prev) =>
        prev
          ? {
              ...prev,
              attempt: {
                ...prev.attempt,
                questions: prev.attempt.questions.map((q) =>
                  q.testQuestionId === testQuestionId ? { ...q, selectedOptionId: optionId } : q,
                ),
              },
            }
          : prev,
      );
      try {
        await liveTestsService.saveAnswer(accessToken, state.liveTestAttemptId, testQuestionId, {
          selectedOptionId: optionId,
        });
      } catch {
        toast.error('Could not save your answer — check your connection');
      }
    },
    [accessToken, state],
  );

  const toggleMarkForReview = React.useCallback(
    async (testQuestionId: string) => {
      if (!accessToken || !state) return;
      const question = state.attempt.questions.find((q) => q.testQuestionId === testQuestionId);
      const next = !question?.isMarkedForReview;
      setState((prev) =>
        prev
          ? {
              ...prev,
              attempt: {
                ...prev.attempt,
                questions: prev.attempt.questions.map((q) =>
                  q.testQuestionId === testQuestionId ? { ...q, isMarkedForReview: next } : q,
                ),
              },
            }
          : prev,
      );
      try {
        await liveTestsService.saveAnswer(accessToken, state.liveTestAttemptId, testQuestionId, {
          isMarkedForReview: next,
        });
      } catch {
        toast.error('Could not save — check your connection');
      }
    },
    [accessToken, state],
  );

  return {
    state,
    attempt: state?.attempt ?? null,
    currentIndex,
    setCurrentIndex,
    loading,
    error,
    submitting,
    secondsLeft,
    warningCount: integrity.warningCount || state?.integrityWarningCount || 0,
    pendingWarning: integrity.pendingWarning,
    acknowledgeWarning: integrity.acknowledgeWarning,
    selectOption,
    toggleMarkForReview,
    submit,
    reload: load,
  };
}

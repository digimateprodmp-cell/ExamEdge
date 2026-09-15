import { apiFetch } from '@/lib/api';
import type { Attempt, AttemptSummary, Language } from '@/types';

export const attemptsService = {
  start: (token: string, testId: string, language: Language) =>
    apiFetch<Attempt>('/attempts/start', { method: 'POST', token, body: { testId, language } }),

  get: (token: string, attemptId: string, lang?: Language) =>
    apiFetch<Attempt>(`/attempts/${attemptId}${lang ? `?lang=${lang}` : ''}`, { token }),

  saveAnswer: (
    token: string,
    attemptId: string,
    testQuestionId: string,
    body: { selectedOptionId?: string | null; isMarkedForReview?: boolean },
  ) =>
    apiFetch<{ saved: boolean }>(`/attempts/${attemptId}/answers/${testQuestionId}`, {
      method: 'PATCH',
      token,
      body,
    }),

  submit: (token: string, attemptId: string) =>
    apiFetch<Attempt>(`/attempts/${attemptId}/submit`, { method: 'POST', token }),

  result: (token: string, attemptId: string, lang?: Language) =>
    apiFetch<Attempt>(`/attempts/${attemptId}/result${lang ? `?lang=${lang}` : ''}`, { token }),

  mine: (token: string, testId?: string) =>
    apiFetch<AttemptSummary[]>(`/attempts/mine${testId ? `?testId=${testId}` : ''}`, { token }),
};

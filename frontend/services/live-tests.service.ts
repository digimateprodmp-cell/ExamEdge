import { apiFetch } from '@/lib/api';
import type { IntegrityEventResult, LiveTest, LiveTestAttemptState } from '@/types';

export const liveTestsService = {
  list: (examCycleId?: string) =>
    apiFetch<LiveTest[]>(`/live-tests${examCycleId ? `?examCycleId=${examCycleId}` : ''}`),

  get: (id: string) => apiFetch<LiveTest>(`/live-tests/${id}`),

  join: (token: string, id: string) =>
    apiFetch<LiveTestAttemptState>(`/live-tests/${id}/join`, { method: 'POST', token }),

  getState: (token: string, attemptId: string) =>
    apiFetch<LiveTestAttemptState>(`/live-tests/attempts/${attemptId}`, { token }),

  saveAnswer: (
    token: string,
    attemptId: string,
    testQuestionId: string,
    body: { selectedOptionId?: string | null; isMarkedForReview?: boolean },
  ) =>
    apiFetch<{ saved: boolean }>(`/live-tests/attempts/${attemptId}/answers/${testQuestionId}`, {
      method: 'PATCH',
      token,
      body,
    }),

  submit: (token: string, attemptId: string) =>
    apiFetch<unknown>(`/live-tests/attempts/${attemptId}/submit`, { method: 'POST', token }),

  recordIntegrityEvent: (
    token: string,
    attemptId: string,
    body: { eventType: string; keyCombination?: string; browserInfo?: string },
  ) =>
    apiFetch<IntegrityEventResult>(`/live-tests/attempts/${attemptId}/integrity-events`, {
      method: 'POST',
      token,
      body,
    }),

  serverTime: () => apiFetch<{ serverTime: string }>('/server-time'),
};

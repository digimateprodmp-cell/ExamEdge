import { apiFetch } from '@/lib/api';
import type { IntegrityPolicy, LiveTest } from '@/types';

export interface LiveTestInput {
  title: string;
  examCycleId?: string;
  testId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  timezone?: string;
  allowLateEntry?: boolean;
  lateEntryCutoffAt?: string;
  isFree?: boolean;
  price?: number;
  instructions?: string;
  integrityPolicyId?: string;
  resultVisibility?: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED';
  randomizeQuestions?: boolean;
}

export const liveTestsService = {
  list: (token: string) => apiFetch<LiveTest[]>('/live-tests/admin', { token }),
  get: (token: string, id: string) => apiFetch<LiveTest>(`/live-tests/admin/${id}`, { token }),
  create: (token: string, data: LiveTestInput) =>
    apiFetch<LiveTest>('/live-tests', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<LiveTestInput>) =>
    apiFetch<LiveTest>(`/live-tests/${id}`, { method: 'PATCH', token, body: data }),
  cancel: (token: string, id: string) =>
    apiFetch<LiveTest>(`/live-tests/${id}/cancel`, { method: 'POST', token }),
  publish: (token: string, id: string) =>
    apiFetch<LiveTest>(`/live-tests/${id}/publish`, { method: 'POST', token }),

  listIntegrityPolicies: (token: string) =>
    apiFetch<IntegrityPolicy[]>('/live-tests/integrity-policies', { token }),
  createIntegrityPolicy: (token: string, data: { name: string; config?: Record<string, unknown>; isActive?: boolean }) =>
    apiFetch<IntegrityPolicy>('/live-tests/integrity-policies', { method: 'POST', token, body: data }),
};

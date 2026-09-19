import { apiFetch } from '@/lib/api';
import type { StudentExamProfile } from '@/types';

export const studentProfileService = {
  listMine: (token: string) => apiFetch<StudentExamProfile[]>('/student/exams', { token }),

  add: (token: string, examCycleId: string) =>
    apiFetch<StudentExamProfile>('/student/exams', { method: 'POST', token, body: { examCycleId } }),

  setPrimary: (token: string, id: string) =>
    apiFetch<StudentExamProfile>(`/student/exams/${id}/primary`, { method: 'PATCH', token }),

  remove: (token: string, id: string) =>
    apiFetch<StudentExamProfile>(`/student/exams/${id}`, { method: 'DELETE', token }),
};

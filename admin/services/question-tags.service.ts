import { apiFetch } from '@/lib/api';
import type { QuestionTag } from '@/types';

export interface QuestionTagInput {
  nameEn: string;
  nameHi?: string;
}

export const questionTagsService = {
  list: (token: string) => apiFetch<QuestionTag[]>('/question-tags', { token }),
  create: (token: string, data: QuestionTagInput) =>
    apiFetch<QuestionTag>('/question-tags', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<QuestionTagInput>) =>
    apiFetch<QuestionTag>(`/question-tags/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) =>
    apiFetch<void>(`/question-tags/${id}`, { method: 'DELETE', token }),
};

import { apiFetch } from '@/lib/api';
import type { Paginated, QuestionFull } from '@/types';

export interface QuestionOptionInput {
  id?: string;
  textEn?: string;
  textHi?: string;
  isCorrect?: boolean;
  order?: number;
}

export interface QuestionInput {
  subjectId?: string;
  topicId?: string;
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  marks?: number;
  negativeMarks?: number;
  textEn?: string;
  textHi?: string;
  explanationEn?: string;
  explanationHi?: string;
  options: QuestionOptionInput[];
}

export const questionsService = {
  list: (token: string, page = 1, limit = 20, subjectId?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (subjectId) params.set('subjectId', subjectId);
    if (search) params.set('search', search);
    return apiFetch<Paginated<QuestionFull>>(`/questions?${params}`, { token });
  },
  get: (token: string, id: string) => apiFetch<QuestionFull>(`/questions/${id}`, { token }),
  create: (token: string, data: QuestionInput) =>
    apiFetch<QuestionFull>('/questions', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<QuestionInput>) =>
    apiFetch<QuestionFull>(`/questions/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/questions/${id}`, { method: 'DELETE', token }),
};

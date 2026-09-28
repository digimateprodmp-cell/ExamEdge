import { apiFetch } from '@/lib/api';
import type { Paginated, TestQuestionRow, TestSection } from '@/types';

export interface TestSectionInput {
  titleEn: string;
  titleHi?: string;
  order?: number;
  questionLimit?: number;
  marksPerQuestion?: number;
  negativeMarks?: number;
}

export interface BulkAddResult {
  added: string[];
  alreadyInTest: { questionId: string; message: string }[];
}

export const testSectionsService = {
  listForTest: (token: string, testId: string) =>
    apiFetch<TestSection[]>(`/tests/${testId}/sections`, { token }),
  create: (token: string, testId: string, data: TestSectionInput) =>
    apiFetch<TestSection>(`/tests/${testId}/sections`, { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<TestSectionInput>) =>
    apiFetch<TestSection>(`/test-sections/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) =>
    apiFetch<void>(`/test-sections/${id}`, { method: 'DELETE', token }),
  questions: (token: string, sectionId: string, page = 1, limit = 100) =>
    apiFetch<Paginated<TestQuestionRow>>(
      `/test-sections/${sectionId}/questions?page=${page}&limit=${limit}`,
      { token },
    ),
  addQuestions: (token: string, sectionId: string, questionIds: string[]) =>
    apiFetch<BulkAddResult>(`/test-sections/${sectionId}/questions`, {
      method: 'POST',
      token,
      body: { questionIds },
    }),
  removeQuestion: (token: string, sectionId: string, questionId: string) =>
    apiFetch<void>(`/test-sections/${sectionId}/questions/${questionId}`, {
      method: 'DELETE',
      token,
    }),
};

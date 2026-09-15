import { apiFetch } from '@/lib/api';
import type { Course, Paginated, Subject, Topic } from '@/types';

export const subjectsService = {
  list: (token: string) => apiFetch<Subject[]>('/subjects', { token }),
  create: (token: string, data: { nameEn: string; nameHi?: string }) =>
    apiFetch<Subject>('/subjects', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: { nameEn?: string; nameHi?: string }) =>
    apiFetch<Subject>(`/subjects/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/subjects/${id}`, { method: 'DELETE', token }),
};

export const topicsService = {
  list: (token: string, subjectId?: string) =>
    apiFetch<Topic[]>(`/topics${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),
  create: (token: string, data: { subjectId: string; nameEn: string; nameHi?: string }) =>
    apiFetch<Topic>('/topics', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: { nameEn?: string; nameHi?: string }) =>
    apiFetch<Topic>(`/topics/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/topics/${id}`, { method: 'DELETE', token }),
};

export interface CourseInput {
  titleEn: string;
  titleHi?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  thumbnailUrl?: string;
  isFree?: boolean;
  price?: number;
  isPublished?: boolean;
}

export const coursesService = {
  list: (token: string, page = 1, limit = 50) =>
    apiFetch<Paginated<Course>>(`/courses/admin?page=${page}&limit=${limit}`, { token }),
  get: (token: string, id: string) => apiFetch<Course>(`/courses/admin/${id}`, { token }),
  create: (token: string, data: CourseInput) => apiFetch<Course>('/courses', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<CourseInput>) =>
    apiFetch<Course>(`/courses/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/courses/${id}`, { method: 'DELETE', token }),
};

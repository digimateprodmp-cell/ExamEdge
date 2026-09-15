import { apiFetch } from '@/lib/api';
import type {
  Batch,
  BlogCategory,
  BlogRow,
  CurrentAffairCategory,
  CurrentAffairRow,
  NoteRow,
  NoteVolume,
  Paginated,
  VideoRow,
} from '@/types';

export interface NoteVolumeInput {
  courseId?: string;
  titleEn: string;
  titleHi?: string;
  isFree?: boolean;
  price?: number;
}
export const noteVolumesService = {
  list: (token: string) => apiFetch<NoteVolume[]>('/note-volumes', { token }),
  get: (token: string, id: string) => apiFetch<NoteVolume>(`/note-volumes/${id}`, { token }),
  create: (token: string, data: NoteVolumeInput) =>
    apiFetch<NoteVolume>('/note-volumes', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<NoteVolumeInput>) =>
    apiFetch<NoteVolume>(`/note-volumes/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/note-volumes/${id}`, { method: 'DELETE', token }),
};

export interface NoteInput {
  noteVolumeId: string;
  titleEn: string;
  titleHi?: string;
  fileUrl: string;
  isFree?: boolean;
}
export const notesService = {
  create: (token: string, data: NoteInput) => apiFetch<NoteRow>('/notes', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<NoteInput>) =>
    apiFetch<NoteRow>(`/notes/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/notes/${id}`, { method: 'DELETE', token }),
};

export interface VideoInput {
  courseId?: string;
  batchId?: string;
  titleEn: string;
  titleHi?: string;
  videoUrl: string;
  isFree?: boolean;
  durationSeconds?: number;
}
export const videosService = {
  list: (token: string) => apiFetch<VideoRow[]>('/videos', { token }),
  create: (token: string, data: VideoInput) => apiFetch<VideoRow>('/videos', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<VideoInput>) =>
    apiFetch<VideoRow>(`/videos/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/videos/${id}`, { method: 'DELETE', token }),
};

export interface BlogInput {
  slug: string;
  coverImageUrl?: string;
  categoryId?: string;
  isPublished?: boolean;
  titleEn?: string;
  titleHi?: string;
  excerptEn?: string;
  excerptHi?: string;
  contentEn?: string;
  contentHi?: string;
}
export const blogsService = {
  list: (token: string, page = 1, limit = 50) =>
    apiFetch<Paginated<BlogRow>>(`/blogs/admin?page=${page}&limit=${limit}`, { token }),
  get: (token: string, id: string) => apiFetch<BlogRow>(`/blogs/admin/${id}`, { token }),
  create: (token: string, data: BlogInput) => apiFetch<BlogRow>('/blogs', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<BlogInput>) =>
    apiFetch<BlogRow>(`/blogs/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/blogs/${id}`, { method: 'DELETE', token }),
};
export const blogCategoriesService = {
  list: (token: string) => apiFetch<BlogCategory[]>('/blog-categories', { token }),
  create: (token: string, data: { nameEn: string; nameHi?: string }) =>
    apiFetch<BlogCategory>('/blog-categories', { method: 'POST', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/blog-categories/${id}`, { method: 'DELETE', token }),
};

export interface CurrentAffairInput {
  date: string;
  categoryId?: string;
  isPublished?: boolean;
  titleEn?: string;
  titleHi?: string;
  contentEn?: string;
  contentHi?: string;
}
export const currentAffairsService = {
  list: (token: string, page = 1, limit = 50) =>
    apiFetch<Paginated<CurrentAffairRow>>(`/current-affairs/admin?page=${page}&limit=${limit}`, { token }),
  create: (token: string, data: CurrentAffairInput) =>
    apiFetch<CurrentAffairRow>('/current-affairs', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<CurrentAffairInput>) =>
    apiFetch<CurrentAffairRow>(`/current-affairs/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/current-affairs/${id}`, { method: 'DELETE', token }),
};
export const currentAffairCategoriesService = {
  list: (token: string) => apiFetch<CurrentAffairCategory[]>('/current-affair-categories', { token }),
  create: (token: string, data: { nameEn: string; nameHi?: string }) =>
    apiFetch<CurrentAffairCategory>('/current-affair-categories', { method: 'POST', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/current-affair-categories/${id}`, { method: 'DELETE', token }),
};

export interface BatchInput {
  titleEn: string;
  titleHi?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  thumbnailUrl?: string;
  isFree?: boolean;
  price?: number;
  isPublished?: boolean;
}
export const batchesService = {
  list: (token: string, page = 1, limit = 50) =>
    apiFetch<Paginated<Batch>>(`/batches/admin?page=${page}&limit=${limit}`, { token }),
  create: (token: string, data: BatchInput) => apiFetch<Batch>('/batches', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<BatchInput>) =>
    apiFetch<Batch>(`/batches/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/batches/${id}`, { method: 'DELETE', token }),
};

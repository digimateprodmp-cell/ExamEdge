import { apiFetch } from '@/lib/api';
import type {
  Batch,
  Blog,
  BlogCategory,
  Course,
  CurrentAffair,
  CurrentAffairCategory,
  NoteVolume,
  Paginated,
  Video,
} from '@/types';

export const coursesService = {
  list: (page = 1, limit = 20) => apiFetch<Paginated<Course>>(`/courses?page=${page}&limit=${limit}`),
  get: (id: string) => apiFetch<Course>(`/courses/${id}`),
};

export const noteVolumesService = {
  list: (courseId?: string) => apiFetch<NoteVolume[]>(`/note-volumes${courseId ? `?courseId=${courseId}` : ''}`),
  get: (id: string) => apiFetch<NoteVolume>(`/note-volumes/${id}`),
  download: (token: string, noteId: string) =>
    apiFetch<{ fileUrl: string | null }>(`/notes/${noteId}/download`, { token }),
};

export const videosService = {
  list: (courseId?: string, batchId?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (batchId) params.set('batchId', batchId);
    const qs = params.toString();
    return apiFetch<Video[]>(`/videos${qs ? `?${qs}` : ''}`);
  },
  streamUrl: (token: string, videoId: string) =>
    apiFetch<{ videoUrl: string }>(`/videos/${videoId}/stream-url`, { token }),
};

export const blogsService = {
  list: (lang: string, page = 1, limit = 12, categoryId?: string) =>
    apiFetch<Paginated<Blog>>(
      `/blogs?page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ''}`,
      { lang },
    ),
  get: (slug: string, lang: string) => apiFetch<Blog>(`/blogs/${slug}`, { lang }),
  categories: () => apiFetch<BlogCategory[]>('/blog-categories'),
};

export const currentAffairsService = {
  list: (lang: string, page = 1, limit = 20, categoryId?: string) =>
    apiFetch<Paginated<CurrentAffair>>(
      `/current-affairs?page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ''}`,
      { lang },
    ),
  get: (id: string, lang: string) => apiFetch<CurrentAffair>(`/current-affairs/${id}`, { lang }),
  categories: () => apiFetch<CurrentAffairCategory[]>('/current-affair-categories'),
};

export const batchesService = {
  list: (page = 1, limit = 20) => apiFetch<Paginated<Batch>>(`/batches?page=${page}&limit=${limit}`),
  get: (id: string) => apiFetch<Batch>(`/batches/${id}`),
};

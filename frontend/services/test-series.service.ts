import { apiFetch } from '@/lib/api';
import type { Paginated, Test, TestSeries, TestVolume } from '@/types';

export const testSeriesService = {
  list: (page = 1, limit = 20, search?: string) =>
    apiFetch<Paginated<TestSeries>>(
      `/test-series?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),

  get: (id: string) => apiFetch<TestSeries>(`/test-series/${id}`),

  volumes: (testSeriesId: string) => apiFetch<TestVolume[]>(`/test-volumes?testSeriesId=${testSeriesId}`),

  volume: (id: string) => apiFetch<TestVolume>(`/test-volumes/${id}`),

  testsInVolume: (testVolumeId: string) => apiFetch<Test[]>(`/tests?testVolumeId=${testVolumeId}`),

  test: (id: string) => apiFetch<Test>(`/tests/${id}`),
};

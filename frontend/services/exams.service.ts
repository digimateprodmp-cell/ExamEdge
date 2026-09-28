import { apiFetch } from '@/lib/api';
import type { Exam, ExamCycle, ExamSyllabus } from '@/types';

export const examsService = {
  list: () => apiFetch<Exam[]>('/exams'),
  cycles: (examId: string) => apiFetch<ExamCycle[]>(`/exams/${examId}/cycles`),
  cycle: (cycleId: string) => apiFetch<ExamCycle>(`/exams/cycles/${cycleId}`),
  syllabus: (cycleId: string) => apiFetch<ExamSyllabus | null>(`/exams/cycles/${cycleId}/syllabus`),
};

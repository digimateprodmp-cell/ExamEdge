import { apiFetch } from '@/lib/api';
import type { NotificationRule } from '@/types';

export const notificationRulesService = {
  list: (token: string) => apiFetch<NotificationRule[]>('/notifications/rules', { token }),
  create: (token: string, data: { name: string; type: string; offsetMinutesBeforeEvent: number; isActive?: boolean }) =>
    apiFetch<NotificationRule>('/notifications/rules', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<{ name: string; offsetMinutesBeforeEvent: number; isActive: boolean }>) =>
    apiFetch<NotificationRule>(`/notifications/rules/${id}`, { method: 'PATCH', token, body: data }),
};

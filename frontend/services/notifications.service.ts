import { apiFetch } from '@/lib/api';
import type { Notification } from '@/types';

export const notificationsService = {
  listMine: (token: string) => apiFetch<Notification[]>('/notifications', { token }),

  unreadCount: (token: string) => apiFetch<number>('/notifications/unread-count', { token }),

  markRead: (token: string, id: string) =>
    apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH', token }),

  markAllRead: (token: string) =>
    apiFetch<{ count: number }>('/notifications/read-all', { method: 'PATCH', token }),
};

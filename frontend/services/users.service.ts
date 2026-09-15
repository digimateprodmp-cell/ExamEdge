import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

export const usersService = {
  updateProfile: (token: string, dto: { name?: string; state?: string; avatarUrl?: string }) =>
    apiFetch<User>('/users/me', { method: 'PATCH', token, body: dto }),
  deleteSelf: (token: string) => apiFetch<void>('/users/me', { method: 'DELETE', token }),
};

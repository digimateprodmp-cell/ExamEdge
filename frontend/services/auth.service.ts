import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  state?: string;
  referralCode?: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: payload }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  refresh: () => apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' }),

  logout: () => apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),

  me: (token: string) => apiFetch<User>('/auth/me', { token }),

  forgotPassword: (email: string) =>
    apiFetch<{ sent: boolean }>('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiFetch<{ reset: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    apiFetch<{ changed: boolean }>('/auth/change-password', {
      method: 'POST',
      token,
      body: { currentPassword, newPassword },
    }),

  sendEmailOtp: (token: string) =>
    apiFetch<{ sent: boolean }>('/auth/email/send-otp', { method: 'POST', token }),

  verifyEmailOtp: (token: string, code: string) =>
    apiFetch<{ verified: boolean }>('/auth/email/verify-otp', { method: 'POST', token, body: { code } }),

  sendPhoneOtp: (token: string, phone: string) =>
    apiFetch<{ sent: boolean }>('/auth/phone/send-otp', { method: 'POST', token, body: { phone } }),

  verifyPhoneOtp: (token: string, code: string) =>
    apiFetch<{ verified: boolean }>('/auth/phone/verify-otp', { method: 'POST', token, body: { code } }),
};

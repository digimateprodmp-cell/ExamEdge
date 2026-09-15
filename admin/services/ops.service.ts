import { apiFetch } from '@/lib/api';
import type { AdminUserRow, CoinTransaction, Coupon, Paginated, Payment } from '@/types';

export const usersService = {
  list: (token: string, page = 1, limit = 50, search?: string) =>
    apiFetch<Paginated<AdminUserRow>>(
      `/users?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      { token },
    ),
  update: (token: string, id: string, data: { role?: 'STUDENT' | 'ADMIN'; isActive?: boolean }) =>
    apiFetch<AdminUserRow>(`/users/${id}`, { method: 'PATCH', token, body: data }),
};

export interface CouponInput {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  maxDiscount?: number;
  minPurchase?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}
export const couponsService = {
  list: (token: string) => apiFetch<Coupon[]>('/coupons/admin', { token }),
  create: (token: string, data: CouponInput) => apiFetch<Coupon>('/coupons', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Partial<CouponInput>) =>
    apiFetch<Coupon>(`/coupons/${id}`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) => apiFetch<void>(`/coupons/${id}`, { method: 'DELETE', token }),
};

export const coinsService = {
  adjust: (token: string, data: { userId: string; type: 'CREDIT' | 'DEBIT'; amount: number; reason: string }) =>
    apiFetch<CoinTransaction>('/coins/admin/adjust', { method: 'POST', token, body: data }),
};

export const paymentsService = {
  listAll: (token: string) => apiFetch<Payment[]>('/payments/admin', { token }),
};

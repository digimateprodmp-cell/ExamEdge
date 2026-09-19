import { apiFetch } from '@/lib/api';
import type { Subscription, SubscriptionPlan } from '@/types';

export const subscriptionsService = {
  listPlans: (token: string) => apiFetch<SubscriptionPlan[]>('/subscriptions/plans/admin', { token }),
  createPlan: (
    token: string,
    data: { name: string; description?: string; priceMonthly: number; priceYearly: number; isActive?: boolean },
  ) => apiFetch<SubscriptionPlan>('/subscriptions/plans', { method: 'POST', token, body: data }),
  updatePlan: (token: string, id: string, data: Partial<{ name: string; priceMonthly: number; priceYearly: number; isActive: boolean }>) =>
    apiFetch<SubscriptionPlan>(`/subscriptions/plans/${id}`, { method: 'PATCH', token, body: data }),
  listSubscriptions: (token: string) => apiFetch<Subscription[]>('/subscriptions/admin', { token }),
  grant: (token: string, userId: string, planId: string, months: number) =>
    apiFetch<Subscription>('/subscriptions/grant', { method: 'POST', token, body: { userId, planId, months } }),
};

import { apiFetch } from '@/lib/api';
import type { CoinTransaction, CoinTxnType, Coupon, CouponUsage, Payment, PaymentItemType } from '@/types';

export const coinsService = {
  balance: (token: string) => apiFetch<{ balance: number }>('/coins/balance', { token }),
  transactions: (token: string, type?: CoinTxnType) =>
    apiFetch<CoinTransaction[]>(`/coins/transactions${type ? `?type=${type}` : ''}`, { token }),
};

export const couponsService = {
  available: (token: string) => apiFetch<Coupon[]>('/coupons/available', { token }),
  myUsage: (token: string) => apiFetch<CouponUsage[]>('/coupons/my-usage', { token }),
  validate: (token: string, code: string, itemType: PaymentItemType, itemId: string) =>
    apiFetch<{ coupon: { id: string; code: string }; discount: number; finalAmount: number }>(
      '/coupons/validate',
      { method: 'POST', token, body: { code, itemType, itemId } },
    ),
};

export const paymentsService = {
  history: (token: string) => apiFetch<Payment[]>('/payments/history', { token }),
  createOrder: (token: string, itemType: PaymentItemType, itemId: string, couponCode?: string) =>
    apiFetch<
      | { free: true; payment: Payment }
      | { free: false; orderId: string; amount: number; currency: string; keyId: string }
    >('/payments/orders', { method: 'POST', token, body: { itemType, itemId, couponCode } }),
  verify: (
    token: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) =>
    apiFetch<Payment>('/payments/verify', {
      method: 'POST',
      token,
      body: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    }),
};

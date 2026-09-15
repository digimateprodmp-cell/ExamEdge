'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { paymentsService } from '@/services/wallet.service';
import { ApiError } from '@/lib/api';
import { formatInr } from '@/lib/i18n-content';
import type { PaymentItemType } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PurchaseButton({
  itemType,
  itemId,
  price,
  isFree,
}: {
  itemType: PaymentItemType;
  itemId: string;
  price: string;
  isFree: boolean;
}) {
  const t = useTranslations('payment');
  const common = useTranslations('common');
  const { accessToken, status, user } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const purchase = async () => {
    if (status !== 'authenticated' || !accessToken) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const order = await paymentsService.createOrder(accessToken, itemType, itemId, couponCode || undefined);

      if (order.free) {
        toast.success(t('paymentSuccess'));
        setEnrolled(true);
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Test Mela',
        description: itemType.replace('_', ' '),
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone ?? undefined },
        theme: { color: '#2F3FA8' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await paymentsService.verify(
              accessToken,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            toast.success(t('paymentSuccess'));
            setEnrolled(true);
          } catch {
            toast.error(t('paymentFailed'));
          }
        },
      });
      razorpay.open();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (enrolled) {
    return <Button className="w-full" disabled>{common('enrolled')} ✓</Button>;
  }

  return (
    <div className="space-y-3">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {!isFree && (
        <div className="flex gap-2">
          <Input
            placeholder={t('haveCoupon')}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          />
        </div>
      )}
      <Button className="w-full" size="lg" disabled={loading} onClick={purchase}>
        {isFree ? common('buyNow') : `${t('payNow')} · ${formatInr(price)}`}
      </Button>
    </div>
  );
}

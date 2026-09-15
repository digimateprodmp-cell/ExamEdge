'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RequireAuth } from '@/components/shared/require-auth';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { couponsService } from '@/services/wallet.service';
import type { CouponUsage } from '@/types';

export default function CouponHistoryPage() {
  return (
    <RequireAuth>
      <CouponHistoryContent />
    </RequireAuth>
  );
}

function CouponHistoryContent() {
  const t = useTranslations('coupons');
  const { accessToken } = useAuth();
  const [usages, setUsages] = useState<CouponUsage[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    couponsService.myUsage(accessToken).then(setUsages).catch(() => setUsages([]));
  }, [accessToken]);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('history')}</h1>

      {usages.length === 0 ? (
        <EmptyState title="You haven't used any coupons yet" />
      ) : (
        <div className="space-y-3">
          {usages.map((usage) => (
            <div key={usage.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-mono font-semibold">{usage.coupon.code}</p>
                <p className="text-xs text-muted-foreground">{new Date(usage.usedAt).toLocaleDateString()}</p>
              </div>
              <span className="font-semibold text-success">-₹{usage.discountApplied}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

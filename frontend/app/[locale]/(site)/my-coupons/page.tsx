'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ticket } from 'lucide-react';
import { RequireAuth } from '@/components/shared/require-auth';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/hooks/use-auth';
import { couponsService } from '@/services/wallet.service';
import type { Coupon } from '@/types';

export default function MyCouponsPage() {
  return (
    <RequireAuth>
      <MyCouponsContent />
    </RequireAuth>
  );
}

function MyCouponsContent() {
  const t = useTranslations('coupons');
  const { accessToken } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    couponsService.available(accessToken).then(setCoupons).catch(() => setCoupons([]));
  }, [accessToken]);

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('myCoupons')}</h1>
        <Link href="/coupon-history" className="text-sm font-semibold text-primary hover:underline">
          {t('history')} →
        </Link>
      </div>

      {coupons.length === 0 ? (
        <EmptyState title="No active coupons right now" />
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-mono text-lg font-bold tracking-wide">{coupon.code}</p>
                <p className="text-xs text-muted-foreground">
                  {t('validTill')} {new Date(coupon.validTo).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="accent">
                {coupon.type === 'PERCENT' ? `${coupon.value}% off` : `₹${coupon.value} off`}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

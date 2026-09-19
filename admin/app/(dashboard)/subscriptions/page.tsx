'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { subscriptionsService } from '@/services/subscriptions.service';
import { ApiError } from '@/lib/api';
import type { Subscription, SubscriptionPlan } from '@/types';

export default function SubscriptionsPage() {
  const { accessToken } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        subscriptionsService.listPlans(accessToken),
        subscriptionsService.listSubscriptions(accessToken),
      ]);
      setPlans(p);
      setSubscriptions(s);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const planColumns: Column<SubscriptionPlan>[] = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: 'Monthly', cell: (r) => `₹${r.priceMonthly}` },
    { header: 'Yearly', cell: (r) => `₹${r.priceYearly}` },
    { header: 'Status', cell: (r) => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const subColumns: Column<Subscription>[] = [
    { header: 'User', cell: (r) => r.user?.name ?? r.userId },
    { header: 'Plan', cell: (r) => r.plan?.name ?? r.planId },
    { header: 'Valid Until', cell: (r) => new Date(r.endAt).toLocaleDateString() },
    { header: 'Status', cell: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'secondary'}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Plans, entitlements and active student subscriptions."
        action={
          accessToken && (
            <NewPlanDialog
              onSubmit={async (v) => {
                await subscriptionsService.createPlan(accessToken, v);
                toast.success('Plan created');
                load();
              }}
            />
          )
        }
      />

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Plans</h2>
      <DataTable columns={planColumns} rows={plans} rowKey={(r) => r.id} loading={loading} emptyTitle="No plans yet" />

      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted-foreground">Active Subscriptions</h2>
      <DataTable columns={subColumns} rows={subscriptions} rowKey={(r) => r.id} loading={loading} emptyTitle="No subscriptions yet" />
    </div>
  );
}

function NewPlanDialog({
  onSubmit,
}: {
  onSubmit: (v: { name: string; priceMonthly: number; priceYearly: number }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('999');
  const [priceYearly, setPriceYearly] = useState('9999');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, priceMonthly: Number(priceMonthly) || 0, priceYearly: Number(priceYearly) || 0 });
      setOpen(false);
      setName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monthly Price (₹)</Label>
              <Input type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Yearly Price (₹)</Label>
              <Input type="number" value={priceYearly} onChange={(e) => setPriceYearly(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving || !name} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

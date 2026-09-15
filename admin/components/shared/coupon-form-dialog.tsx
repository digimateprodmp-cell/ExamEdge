'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { CouponInput } from '@/services/ops.service';
import type { Coupon } from '@/types';

interface FormValues {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  maxDiscount: string;
  minPurchase: string;
  usageLimit: string;
  perUserLimit: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

function fromExisting(c?: Coupon): FormValues {
  return {
    code: c?.code ?? '',
    type: c?.type ?? 'PERCENT',
    value: c?.value ?? '10',
    maxDiscount: c?.maxDiscount ?? '',
    minPurchase: c?.minPurchase ?? '',
    usageLimit: c?.usageLimit != null ? String(c.usageLimit) : '',
    perUserLimit: c ? String(c.perUserLimit) : '1',
    validFrom: c?.validFrom ? c.validFrom.slice(0, 10) : new Date().toISOString().slice(0, 10),
    validTo: c?.validTo ? c.validTo.slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: c?.isActive ?? true,
  };
}

export function CouponFormDialog({
  existing,
  trigger,
  onSubmit,
}: {
  existing?: Coupon;
  trigger?: React.ReactNode;
  onSubmit: (input: CouponInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(fromExisting(existing));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(fromExisting(existing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New coupon</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{existing ? 'Edit coupon' : 'New coupon'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={values.code} onChange={(e) => setValues({ ...values, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(v) => setValues({ ...values, type: v as FormValues['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percent off</SelectItem>
                  <SelectItem value="FIXED">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Value ({values.type === 'PERCENT' ? '%' : '₹'})</Label>
              <Input type="number" value={values.value} onChange={(e) => setValues({ ...values, value: e.target.value })} />
            </div>
            {values.type === 'PERCENT' && (
              <div className="space-y-1.5">
                <Label>Max discount (₹, optional)</Label>
                <Input type="number" value={values.maxDiscount} onChange={(e) => setValues({ ...values, maxDiscount: e.target.value })} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Min purchase (₹)</Label>
              <Input type="number" value={values.minPurchase} onChange={(e) => setValues({ ...values, minPurchase: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Total usage limit</Label>
              <Input type="number" value={values.usageLimit} onChange={(e) => setValues({ ...values, usageLimit: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Per-user limit</Label>
              <Input type="number" value={values.perUserLimit} onChange={(e) => setValues({ ...values, perUserLimit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid from</Label>
              <Input type="date" value={values.validFrom} onChange={(e) => setValues({ ...values, validFrom: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Valid to</Label>
              <Input type="date" value={values.validTo} onChange={(e) => setValues({ ...values, validTo: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={values.isActive} onCheckedChange={(v) => setValues({ ...values, isActive: v })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !values.code || !values.value}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  code: values.code,
                  type: values.type,
                  value: Number(values.value),
                  maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : undefined,
                  minPurchase: values.minPurchase ? Number(values.minPurchase) : undefined,
                  usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
                  perUserLimit: Number(values.perUserLimit) || 1,
                  validFrom: new Date(values.validFrom).toISOString(),
                  validTo: new Date(values.validTo).toISOString(),
                  isActive: values.isActive,
                });
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

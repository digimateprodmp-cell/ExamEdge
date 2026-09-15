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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { TestSeriesInput } from '@/services/test-series.service';

interface FormValues {
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  isFree: boolean;
  price: string;
  validityDays: string;
  isPublished: boolean;
}

const EMPTY: FormValues = {
  titleEn: '',
  titleHi: '',
  descriptionEn: '',
  descriptionHi: '',
  isFree: false,
  price: '0',
  validityDays: '365',
  isPublished: false,
};

export function TestSeriesFormDialog({
  title,
  initial,
  trigger,
  triggerLabel = 'New test series',
  onSubmit,
}: {
  title: string;
  initial?: Partial<FormValues>;
  trigger?: React.ReactNode;
  triggerLabel?: string;
  onSubmit: (input: TestSeriesInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues({ ...EMPTY, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        titleEn: values.titleEn,
        titleHi: values.titleHi || undefined,
        descriptionEn: values.descriptionEn || undefined,
        descriptionHi: values.descriptionHi || undefined,
        isFree: values.isFree,
        price: values.isFree ? 0 : Number(values.price) || 0,
        validityDays: Number(values.validityDays) || 365,
        isPublished: values.isPublished,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title (English)</Label>
              <Input value={values.titleEn} onChange={(e) => setValues({ ...values, titleEn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Title (Hindi)</Label>
              <Input value={values.titleHi} onChange={(e) => setValues({ ...values, titleHi: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Description (English)</Label>
              <Textarea value={values.descriptionEn} onChange={(e) => setValues({ ...values, descriptionEn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description (Hindi)</Label>
              <Textarea value={values.descriptionHi} onChange={(e) => setValues({ ...values, descriptionHi: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-end gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={values.isFree} onCheckedChange={(v) => setValues({ ...values, isFree: v })} />
              <Label>Free</Label>
            </div>
            {!values.isFree && (
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input type="number" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Validity (days)</Label>
              <Input type="number" value={values.validityDays} onChange={(e) => setValues({ ...values, validityDays: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={values.isPublished} onCheckedChange={(v) => setValues({ ...values, isPublished: v })} />
              <Label>Published</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving || !values.titleEn} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TestInput } from '@/services/test-series.service';

interface FormValues {
  titleEn: string;
  titleHi: string;
  instructionsEn: string;
  instructionsHi: string;
  type: 'LIVE' | 'PRACTICE' | 'PDF';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  durationMinutes: string;
  marksPerQuestion: string;
  negativeMarks: string;
  isFree: boolean;
  price: string;
}

const EMPTY: FormValues = {
  titleEn: '',
  titleHi: '',
  instructionsEn: '',
  instructionsHi: '',
  type: 'PRACTICE',
  status: 'DRAFT',
  durationMinutes: '60',
  marksPerQuestion: '1',
  negativeMarks: '0',
  isFree: true,
  price: '0',
};

export function TestFormDialog({
  testVolumeId,
  initial,
  trigger,
  onSubmit,
}: {
  testVolumeId: string;
  initial?: Partial<FormValues>;
  trigger?: React.ReactNode;
  onSubmit: (input: TestInput) => Promise<void>;
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
        testVolumeId,
        titleEn: values.titleEn,
        titleHi: values.titleHi || undefined,
        instructionsEn: values.instructionsEn || undefined,
        instructionsHi: values.instructionsHi || undefined,
        type: values.type,
        status: values.status,
        durationMinutes: Number(values.durationMinutes) || 60,
        marksPerQuestion: Number(values.marksPerQuestion) || 1,
        negativeMarks: Number(values.negativeMarks) || 0,
        isFree: values.isFree,
        price: values.isFree ? 0 : Number(values.price) || 0,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New test</Button>}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Test</DialogTitle></DialogHeader>
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
              <Label>Instructions (English)</Label>
              <Textarea value={values.instructionsEn} onChange={(e) => setValues({ ...values, instructionsEn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions (Hindi)</Label>
              <Textarea value={values.instructionsHi} onChange={(e) => setValues({ ...values, instructionsHi: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(v) => setValues({ ...values, type: v as FormValues['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRACTICE">Practice</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={values.status} onValueChange={(v) => setValues({ ...values, status: v as FormValues['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" value={values.durationMinutes} onChange={(e) => setValues({ ...values, durationMinutes: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Marks / question</Label>
              <Input type="number" value={values.marksPerQuestion} onChange={(e) => setValues({ ...values, marksPerQuestion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Negative marks</Label>
              <Input type="number" value={values.negativeMarks} onChange={(e) => setValues({ ...values, negativeMarks: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={values.isFree} onCheckedChange={(v) => setValues({ ...values, isFree: v })} />
              <Label>Free</Label>
            </div>
            {!values.isFree && (
              <div className="flex-1 space-y-1.5">
                <Label>Price (₹)</Label>
                <Input type="number" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving || !values.titleEn} onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

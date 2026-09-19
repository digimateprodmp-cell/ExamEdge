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
import { useAuth } from '@/hooks/use-auth';
import { testsService } from '@/services/test-series.service';
import { liveTestsService, type LiveTestInput } from '@/services/live-tests.service';
import type { IntegrityPolicy, Test } from '@/types';

interface FormValues {
  title: string;
  testId: string;
  startAt: string;
  endAt: string;
  durationMinutes: string;
  allowLateEntry: boolean;
  lateEntryCutoffAt: string;
  isFree: boolean;
  price: string;
  instructions: string;
  integrityPolicyId: string;
  resultVisibility: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED';
}

const EMPTY: FormValues = {
  title: '',
  testId: '',
  startAt: '',
  endAt: '',
  durationMinutes: '60',
  allowLateEntry: false,
  lateEntryCutoffAt: '',
  isFree: true,
  price: '0',
  instructions: '',
  integrityPolicyId: '',
  resultVisibility: 'IMMEDIATE',
};

function toLocalInputValue(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LiveTestFormDialog({
  initial,
  trigger,
  onSubmit,
}: {
  initial?: Partial<FormValues>;
  trigger?: React.ReactNode;
  onSubmit: (input: LiveTestInput) => Promise<void>;
}) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [policies, setPolicies] = useState<IntegrityPolicy[]>([]);

  useEffect(() => {
    if (open) {
      setValues({
        ...EMPTY,
        ...initial,
        startAt: toLocalInputValue(initial?.startAt) || EMPTY.startAt,
        endAt: toLocalInputValue(initial?.endAt) || EMPTY.endAt,
        lateEntryCutoffAt: toLocalInputValue(initial?.lateEntryCutoffAt) || EMPTY.lateEntryCutoffAt,
      });
      if (accessToken) {
        testsService.listAll(accessToken).then(setTests).catch(() => {});
        liveTestsService.listIntegrityPolicies(accessToken).then(setPolicies).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        testId: values.testId,
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        durationMinutes: Number(values.durationMinutes) || 60,
        allowLateEntry: values.allowLateEntry,
        lateEntryCutoffAt: values.lateEntryCutoffAt
          ? new Date(values.lateEntryCutoffAt).toISOString()
          : undefined,
        isFree: values.isFree,
        price: values.isFree ? 0 : Number(values.price) || 0,
        instructions: values.instructions || undefined,
        integrityPolicyId: values.integrityPolicyId || undefined,
        resultVisibility: values.resultVisibility,
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
            <Plus className="h-4 w-4" /> Schedule Live Test
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Test</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Question Paper (Test)</Label>
            <Select value={values.testId} onValueChange={(v) => setValues({ ...values, testId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a test" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={values.startAt}
                onChange={(e) => setValues({ ...values, startAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={values.endAt}
                onChange={(e) => setValues({ ...values, endAt: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={values.durationMinutes}
                onChange={(e) => setValues({ ...values, durationMinutes: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Result Visibility</Label>
              <Select
                value={values.resultVisibility}
                onValueChange={(v) => setValues({ ...values, resultVisibility: v as FormValues['resultVisibility'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={values.allowLateEntry}
                onCheckedChange={(v) => setValues({ ...values, allowLateEntry: v })}
              />
              <Label>Allow Late Entry</Label>
            </div>
            {values.allowLateEntry && (
              <div className="flex-1 space-y-1.5">
                <Label>Late Entry Cutoff</Label>
                <Input
                  type="datetime-local"
                  value={values.lateEntryCutoffAt}
                  onChange={(e) => setValues({ ...values, lateEntryCutoffAt: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Integrity Policy</Label>
            <Select
              value={values.integrityPolicyId}
              onValueChange={(v) => setValues({ ...values, integrityPolicyId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea value={values.instructions} onChange={(e) => setValues({ ...values, instructions: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving || !values.title || !values.testId || !values.startAt || !values.endAt} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

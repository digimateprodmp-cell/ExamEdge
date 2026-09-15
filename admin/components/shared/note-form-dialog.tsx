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
import { Switch } from '@/components/ui/switch';
import type { NoteInput } from '@/services/content.service';

interface FormValues {
  titleEn: string;
  titleHi: string;
  fileUrl: string;
  isFree: boolean;
}

const EMPTY: FormValues = { titleEn: '', titleHi: '', fileUrl: '', isFree: true };

export function NoteFormDialog({
  noteVolumeId,
  initial,
  trigger,
  onSubmit,
}: {
  noteVolumeId: string;
  initial?: Partial<FormValues>;
  trigger?: React.ReactNode;
  onSubmit: (input: NoteInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues({ ...EMPTY, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New note</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Note file</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title (English)</Label>
            <Input value={values.titleEn} onChange={(e) => setValues({ ...values, titleEn: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Title (Hindi)</Label>
            <Input value={values.titleHi} onChange={(e) => setValues({ ...values, titleHi: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>PDF URL</Label>
            <Input value={values.fileUrl} onChange={(e) => setValues({ ...values, fileUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={values.isFree} onCheckedChange={(v) => setValues({ ...values, isFree: v })} />
            <Label>Free (downloadable without purchase)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !values.titleEn || !values.fileUrl}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({ noteVolumeId, titleEn: values.titleEn, titleHi: values.titleHi || undefined, fileUrl: values.fileUrl, isFree: values.isFree });
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

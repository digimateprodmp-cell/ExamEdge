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
import type { VideoInput } from '@/services/content.service';

interface FormValues {
  titleEn: string;
  titleHi: string;
  videoUrl: string;
  isFree: boolean;
}

const EMPTY: FormValues = { titleEn: '', titleHi: '', videoUrl: '', isFree: false };

export function VideoFormDialog({
  initial,
  trigger,
  onSubmit,
}: {
  initial?: Partial<FormValues>;
  trigger?: React.ReactNode;
  onSubmit: (input: VideoInput) => Promise<void>;
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
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New video</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Video</DialogTitle></DialogHeader>
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
            <Label>Video URL</Label>
            <Input value={values.videoUrl} onChange={(e) => setValues({ ...values, videoUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={values.isFree} onCheckedChange={(v) => setValues({ ...values, isFree: v })} />
            <Label>Free preview</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !values.titleEn || !values.videoUrl}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({ titleEn: values.titleEn, titleHi: values.titleHi || undefined, videoUrl: values.videoUrl, isFree: values.isFree });
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

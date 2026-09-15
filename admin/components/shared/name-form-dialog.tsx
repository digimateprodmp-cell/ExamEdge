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

export function NameFormDialog({
  title,
  triggerLabel = 'Add',
  initial,
  extraFields,
  onSubmit,
}: {
  title: string;
  triggerLabel?: string;
  initial?: { nameEn: string; nameHi?: string };
  extraFields?: React.ReactNode;
  onSubmit: (data: { nameEn: string; nameHi?: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNameEn(initial?.nameEn ?? '');
      setNameHi(initial?.nameHi ?? '');
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {extraFields}
          <div className="space-y-1.5">
            <Label>Name (English)</Label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Name (Hindi)</Label>
            <Input value={nameHi} onChange={(e) => setNameHi(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !nameEn}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({ nameEn, nameHi: nameHi || undefined });
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

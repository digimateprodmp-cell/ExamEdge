'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { questionTagsService } from '@/services/question-tags.service';
import { ApiError } from '@/lib/api';
import type { QuestionTag } from '@/types';

export function QuestionTagManagerDialog({
  tags,
  trigger,
  onChanged,
}: {
  tags: QuestionTag[];
  trigger: React.ReactNode;
  onChanged: () => Promise<void> | void;
}) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!accessToken || !nameEn.trim()) return;
    setSaving(true);
    try {
      await questionTagsService.create(accessToken, { nameEn: nameEn.trim(), nameHi: nameHi.trim() || undefined });
      setNameEn('');
      setNameHi('');
      await onChanged();
      toast.success('Tag created');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create tag');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    try {
      await questionTagsService.remove(accessToken, id);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete tag');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Question Tags</DialogTitle></DialogHeader>

        <div className="flex gap-2">
          <Input placeholder="Tag name (English)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <Input placeholder="हिंदी (optional)" value={nameHi} onChange={(e) => setNameHi(e.target.value)} className="w-40" />
          <Button size="sm" disabled={saving || !nameEn.trim()} onClick={create}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {tags.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            tags.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>
                  {t.nameEn}
                  {t.nameHi && <span className="ml-2 text-muted-foreground">{t.nameHi}</span>}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t._count?.assignments ?? 0} question{(t._count?.assignments ?? 0) === 1 ? '' : 's'}
                  </span>
                </span>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

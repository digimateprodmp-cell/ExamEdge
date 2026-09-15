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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CurrentAffairInput } from '@/services/content.service';
import type { CurrentAffairCategory, CurrentAffairRow } from '@/types';

interface FormValues {
  date: string;
  categoryId: string;
  isPublished: boolean;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
}

function fromExisting(item?: CurrentAffairRow): FormValues {
  const en = item?.translations.find((t) => t.language === 'EN');
  const hi = item?.translations.find((t) => t.language === 'HI');
  return {
    date: item?.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    categoryId: item?.categoryId ?? '',
    isPublished: item?.isPublished ?? false,
    titleEn: en?.title ?? '',
    titleHi: hi?.title ?? '',
    contentEn: en?.content ?? '',
    contentHi: hi?.content ?? '',
  };
}

export function CurrentAffairFormDialog({
  categories,
  existing,
  trigger,
  onSubmit,
}: {
  categories: CurrentAffairCategory[];
  existing?: CurrentAffairRow;
  trigger?: React.ReactNode;
  onSubmit: (input: CurrentAffairInput) => Promise<void>;
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
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New update</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{existing ? 'Edit current affair' : 'New current affair'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={values.date} onChange={(e) => setValues({ ...values, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={values.categoryId} onValueChange={(v) => setValues({ ...values, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="en">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="hi">हिंदी</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={values.titleEn} onChange={(e) => setValues({ ...values, titleEn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Content</Label><Textarea className="min-h-32" value={values.contentEn} onChange={(e) => setValues({ ...values, contentEn: e.target.value })} /></div>
            </TabsContent>
            <TabsContent value="hi" className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={values.titleHi} onChange={(e) => setValues({ ...values, titleHi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Content</Label><Textarea className="min-h-32" value={values.contentHi} onChange={(e) => setValues({ ...values, contentHi: e.target.value })} /></div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2">
            <Switch checked={values.isPublished} onCheckedChange={(v) => setValues({ ...values, isPublished: v })} />
            <Label>Published</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !values.date || (!values.titleEn && !values.titleHi)}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  date: values.date,
                  categoryId: values.categoryId || undefined,
                  isPublished: values.isPublished,
                  titleEn: values.titleEn || undefined,
                  titleHi: values.titleHi || undefined,
                  contentEn: values.contentEn || undefined,
                  contentHi: values.contentHi || undefined,
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

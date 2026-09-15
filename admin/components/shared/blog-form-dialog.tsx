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
import type { BlogInput } from '@/services/content.service';
import type { BlogCategory, BlogRow } from '@/types';

interface FormValues {
  slug: string;
  coverImageUrl: string;
  categoryId: string;
  isPublished: boolean;
  titleEn: string;
  titleHi: string;
  excerptEn: string;
  excerptHi: string;
  contentEn: string;
  contentHi: string;
}

function fromExisting(blog?: BlogRow): FormValues {
  const en = blog?.translations.find((t) => t.language === 'EN');
  const hi = blog?.translations.find((t) => t.language === 'HI');
  return {
    slug: blog?.slug ?? '',
    coverImageUrl: blog?.coverImageUrl ?? '',
    categoryId: blog?.categoryId ?? '',
    isPublished: blog?.isPublished ?? false,
    titleEn: en?.title ?? '',
    titleHi: hi?.title ?? '',
    excerptEn: en?.excerpt ?? '',
    excerptHi: hi?.excerpt ?? '',
    contentEn: en?.content ?? '',
    contentHi: hi?.content ?? '',
  };
}

export function BlogFormDialog({
  categories,
  existing,
  trigger,
  onSubmit,
}: {
  categories: BlogCategory[];
  existing?: BlogRow;
  trigger?: React.ReactNode;
  onSubmit: (input: BlogInput) => Promise<void>;
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
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New blog post</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{existing ? 'Edit blog post' : 'New blog post'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value })} placeholder="how-to-prepare-for-upsc" />
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

          <div className="space-y-1.5">
            <Label>Cover image URL</Label>
            <Input value={values.coverImageUrl} onChange={(e) => setValues({ ...values, coverImageUrl: e.target.value })} />
          </div>

          <Tabs defaultValue="en">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="hi">हिंदी</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={values.titleEn} onChange={(e) => setValues({ ...values, titleEn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Excerpt</Label><Textarea value={values.excerptEn} onChange={(e) => setValues({ ...values, excerptEn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Content</Label><Textarea className="min-h-40" value={values.contentEn} onChange={(e) => setValues({ ...values, contentEn: e.target.value })} /></div>
            </TabsContent>
            <TabsContent value="hi" className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={values.titleHi} onChange={(e) => setValues({ ...values, titleHi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Excerpt</Label><Textarea value={values.excerptHi} onChange={(e) => setValues({ ...values, excerptHi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Content</Label><Textarea className="min-h-40" value={values.contentHi} onChange={(e) => setValues({ ...values, contentHi: e.target.value })} /></div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2">
            <Switch checked={values.isPublished} onCheckedChange={(v) => setValues({ ...values, isPublished: v })} />
            <Label>Published</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !values.slug || (!values.titleEn && !values.titleHi)}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  slug: values.slug,
                  coverImageUrl: values.coverImageUrl || undefined,
                  categoryId: values.categoryId || undefined,
                  isPublished: values.isPublished,
                  titleEn: values.titleEn || undefined,
                  titleHi: values.titleHi || undefined,
                  excerptEn: values.excerptEn || undefined,
                  excerptHi: values.excerptHi || undefined,
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

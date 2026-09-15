'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { BlogFormDialog } from '@/components/shared/blog-form-dialog';
import { NameFormDialog } from '@/components/shared/name-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { blogCategoriesService, blogsService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { BlogCategory, BlogRow } from '@/types';

export default function BlogsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [blogs, cats] = await Promise.all([blogsService.list(accessToken), blogCategoriesService.list(accessToken)]);
      setRows(blogs.items);
      setCategories(cats);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<BlogRow>[] = [
    {
      header: 'Title',
      cell: (r) => <span className="font-medium">{r.translations.find((t) => t.language === 'EN')?.title || r.translations[0]?.title}</span>,
    },
    { header: 'Slug', cell: (r) => <code className="text-xs">{r.slug}</code> },
    { header: 'Status', cell: (r) => <Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Published' : 'Draft'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <BlogFormDialog
            categories={categories}
            existing={r}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await blogsService.update(accessToken, r.id, input); toast.success('Blog updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await blogsService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Blogs"
          description="Bilingual articles and guides."
          action={accessToken && <BlogFormDialog categories={categories} onSubmit={async (input) => { await blogsService.create(accessToken, input); toast.success('Blog created'); load(); }} />}
        />
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No blog posts yet" />
      </div>

      <div>
        <PageHeader
          title="Categories"
          action={accessToken && <NameFormDialog title="New category" onSubmit={async (data) => { await blogCategoriesService.create(accessToken, data); toast.success('Category created'); load(); }} />}
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm">
              {c.nameEn}
              <ConfirmDeleteButton label="Remove" onConfirm={async () => { if (accessToken) { await blogCategoriesService.remove(accessToken, c.id); load(); } }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { CurrentAffairFormDialog } from '@/components/shared/current-affair-form-dialog';
import { NameFormDialog } from '@/components/shared/name-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { currentAffairCategoriesService, currentAffairsService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { CurrentAffairCategory, CurrentAffairRow } from '@/types';

export default function CurrentAffairsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<CurrentAffairRow[]>([]);
  const [categories, setCategories] = useState<CurrentAffairCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [items, cats] = await Promise.all([currentAffairsService.list(accessToken), currentAffairCategoriesService.list(accessToken)]);
      setRows(items.items);
      setCategories(cats);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load current affairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<CurrentAffairRow>[] = [
    { header: 'Date', cell: (r) => new Date(r.date).toLocaleDateString() },
    {
      header: 'Title',
      cell: (r) => <span className="font-medium">{r.translations.find((t) => t.language === 'EN')?.title || r.translations[0]?.title}</span>,
    },
    { header: 'Status', cell: (r) => <Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Published' : 'Draft'}</Badge> },
    {
      header: '',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <CurrentAffairFormDialog
            categories={categories}
            existing={r}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (input) => { if (accessToken) { await currentAffairsService.update(accessToken, r.id, input); toast.success('Updated'); load(); } }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await currentAffairsService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Current Affairs"
          description="Daily bilingual updates."
          action={accessToken && <CurrentAffairFormDialog categories={categories} onSubmit={async (input) => { await currentAffairsService.create(accessToken, input); toast.success('Created'); load(); }} />}
        />
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No current affairs yet" />
      </div>

      <div>
        <PageHeader
          title="Categories"
          action={accessToken && <NameFormDialog title="New category" onSubmit={async (data) => { await currentAffairCategoriesService.create(accessToken, data); toast.success('Category created'); load(); }} />}
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm">
              {c.nameEn}
              <ConfirmDeleteButton label="Remove" onConfirm={async () => { if (accessToken) { await currentAffairCategoriesService.remove(accessToken, c.id); load(); } }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

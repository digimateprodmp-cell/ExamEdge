'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PublishableFormDialog, type PublishableFormValues } from '@/components/shared/publishable-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { coursesService, type CourseInput } from '@/services/catalog.service';
import { ApiError } from '@/lib/api';
import type { Course } from '@/types';

function toInput(v: PublishableFormValues): CourseInput {
  return {
    titleEn: v.titleEn,
    titleHi: v.titleHi || undefined,
    descriptionEn: v.descriptionEn || undefined,
    descriptionHi: v.descriptionHi || undefined,
    isFree: v.isFree,
    price: v.isFree ? 0 : Number(v.price) || 0,
    isPublished: v.isPublished,
  };
}

export default function CoursesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await coursesService.list(accessToken);
      setRows(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<Course>[] = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.titleEn}</span> },
    { header: 'Price', cell: (r) => (r.isFree ? <Badge variant="success">Free</Badge> : `₹${r.price}`) },
    {
      header: 'Status',
      cell: (r) => <Badge variant={r.isPublished ? 'success' : 'secondary'}>{r.isPublished ? 'Published' : 'Draft'}</Badge>,
    },
    {
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          <PublishableFormDialog
            title="Edit course"
            initial={{
              titleEn: r.titleEn,
              titleHi: r.titleHi ?? '',
              descriptionEn: r.descriptionEn ?? '',
              descriptionHi: r.descriptionHi ?? '',
              isFree: r.isFree,
              price: r.price,
              isPublished: r.isPublished,
            }}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            onSubmit={async (v) => {
              if (!accessToken) return;
              await coursesService.update(accessToken, r.id, toInput(v));
              toast.success('Course updated');
              load();
            }}
          />
          <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await coursesService.remove(accessToken, r.id); load(); } }} />
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Top-level course catalog."
        action={
          accessToken && (
            <PublishableFormDialog
              title="New course"
              onSubmit={async (v) => {
                await coursesService.create(accessToken, toInput(v));
                toast.success('Course created');
                load();
              }}
            />
          )
        }
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No courses yet" />
    </div>
  );
}

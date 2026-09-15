'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { NameFormDialog } from '@/components/shared/name-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { subjectsService, topicsService } from '@/services/catalog.service';
import { ApiError } from '@/lib/api';
import type { Subject, Topic } from '@/types';

export default function SubjectsPage() {
  const { accessToken } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setSubjects(await subjectsService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const subjectColumns: Column<Subject>[] = [
    { header: 'Subject (EN)', cell: (r) => <span className="font-medium">{r.nameEn}</span> },
    { header: 'Subject (HI)', cell: (r) => r.nameHi ?? '-' },
    { header: 'Topics', cell: (r) => <Badge variant="secondary">{r.topics?.length ?? 0}</Badge> },
    {
      header: '',
      cell: (r) => (
        <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await subjectsService.remove(accessToken, r.id); load(); } }} />
      ),
      className: 'w-10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Subjects"
          description="Taxonomy used to tag questions."
          action={
            accessToken && (
              <NameFormDialog
                title="New subject"
                onSubmit={async (data) => {
                  await subjectsService.create(accessToken, data);
                  toast.success('Subject created');
                  load();
                }}
              />
            )
          }
        />
        <DataTable columns={subjectColumns} rows={subjects} rowKey={(r) => r.id} loading={loading} emptyTitle="No subjects yet" />
      </div>

      <TopicsSection subjects={subjects} onChanged={load} />
    </div>
  );
}

function TopicsSection({ subjects, onChanged }: { subjects: Subject[]; onChanged: () => void }) {
  const { accessToken } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newSubjectId, setNewSubjectId] = useState<string>('');

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setTopics(await topicsService.list(accessToken, filterSubjectId === 'all' ? undefined : filterSubjectId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filterSubjectId]);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.nameEn ?? '-';

  const columns: Column<Topic>[] = [
    { header: 'Topic (EN)', cell: (r) => <span className="font-medium">{r.nameEn}</span> },
    { header: 'Topic (HI)', cell: (r) => r.nameHi ?? '-' },
    { header: 'Subject', cell: (r) => subjectName(r.subjectId) },
    {
      header: '',
      cell: (r) => (
        <ConfirmDeleteButton onConfirm={async () => { if (accessToken) { await topicsService.remove(accessToken, r.id); load(); } }} />
      ),
      className: 'w-10',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Topics"
        description="Sub-classification within a subject."
        action={
          accessToken &&
          subjects.length > 0 && (
            <NameFormDialog
              title="New topic"
              extraFields={
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nameEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
              onSubmit={async (data) => {
                if (!newSubjectId) {
                  toast.error('Select a subject first');
                  return;
                }
                await topicsService.create(accessToken, { ...data, subjectId: newSubjectId });
                toast.success('Topic created');
                load();
                onChanged();
              }}
            />
          )
        }
      />

      <div className="mb-3 max-w-xs">
        <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nameEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} rows={topics} rowKey={(r) => r.id} loading={loading} emptyTitle="No topics yet" />
    </div>
  );
}

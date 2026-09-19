'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { notificationRulesService } from '@/services/notifications.service';
import { ApiError } from '@/lib/api';
import type { NotificationRule } from '@/types';

const TYPES = ['LIVE_TEST_SCHEDULE', 'LIVE_TEST_REMINDER', 'LIVE_TEST_CANCELLED', 'RESULT_AVAILABLE'];

export default function NotificationRulesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await notificationRulesService.list(accessToken));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load notification rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const columns: Column<NotificationRule>[] = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: 'Type', cell: (r) => r.type },
    { header: 'Offset', cell: (r) => `${r.offsetMinutesBeforeEvent} min before` },
    { header: 'Status', cell: (r) => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Notification Rules"
        description="Admin-configurable reminder timings — never hardcoded."
        action={
          accessToken && (
            <NewRuleDialog
              onSubmit={async (v) => {
                await notificationRulesService.create(accessToken, v);
                toast.success('Rule created');
                load();
              }}
            />
          )
        }
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No notification rules yet" />
    </div>
  );
}

function NewRuleDialog({
  onSubmit,
}: {
  onSubmit: (v: { name: string; type: string; offsetMinutesBeforeEvent: number }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [offset, setOffset] = useState('60');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, type, offsetMinutesBeforeEvent: Number(offset) || 0 });
      setOpen(false);
      setName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New Rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 1 hour reminder" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Offset (minutes before event)</Label>
            <Input type="number" value={offset} onChange={(e) => setOffset(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving || !name} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

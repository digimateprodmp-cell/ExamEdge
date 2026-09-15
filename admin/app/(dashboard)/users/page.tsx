'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { usersService } from '@/services/ops.service';
import { ApiError } from '@/lib/api';
import type { AdminUserRow } from '@/types';

export default function UsersPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await usersService.list(accessToken, 1, 100, search || undefined);
      setRows(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const toggleRole = async (row: AdminUserRow) => {
    if (!accessToken) return;
    const nextRole = row.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    try {
      await usersService.update(accessToken, row.id, { role: nextRole });
      toast.success(`${row.name} is now ${nextRole}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update role');
    }
  };

  const toggleActive = async (row: AdminUserRow) => {
    if (!accessToken) return;
    try {
      await usersService.update(accessToken, row.id, { isActive: !row.isActive });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update status');
    }
  };

  const columns: Column<AdminUserRow>[] = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: 'Email', cell: (r) => r.email },
    { header: 'Phone', cell: (r) => r.phone ?? '-' },
    { header: 'Coins', cell: (r) => r.coinBalance },
    {
      header: 'Role',
      cell: (r) => <Badge variant={r.role === 'ADMIN' ? 'accent' : 'secondary'}>{r.role}</Badge>,
    },
    {
      header: 'Status',
      cell: (r) => <Badge variant={r.isActive ? 'success' : 'destructive'}>{r.isActive ? 'Active' : 'Disabled'}</Badge>,
    },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => toggleRole(r)}>
            Make {r.role === 'ADMIN' ? 'Student' : 'Admin'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
            {r.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Student and admin accounts."
        action={
          <Input
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-64"
          />
        }
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyTitle="No users found" />
    </div>
  );
}

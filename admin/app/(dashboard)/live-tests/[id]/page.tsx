'use client';

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LiveTestFormDialog } from '@/components/shared/live-test-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { liveTestsService } from '@/services/live-tests.service';
import { ApiError } from '@/lib/api';
import type { LiveTest } from '@/types';

export default function LiveTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setLiveTest(await liveTestsService.get(accessToken, id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load this live test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  if (loading || !liveTest) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={liveTest.title}
        description={`${new Date(liveTest.startAt).toLocaleString()} → ${new Date(liveTest.endAt).toLocaleString()}`}
        action={
          accessToken && (
            <LiveTestFormDialog
              initial={{
                title: liveTest.title,
                testId: liveTest.testId,
                startAt: liveTest.startAt,
                endAt: liveTest.endAt,
                durationMinutes: String(liveTest.durationMinutes),
                allowLateEntry: liveTest.allowLateEntry,
                isFree: liveTest.isFree,
                price: liveTest.price,
                instructions: liveTest.instructions ?? '',
                integrityPolicyId: liveTest.integrityPolicyId ?? '',
                resultVisibility: liveTest.resultVisibility,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              }
              onSubmit={async (v) => {
                await liveTestsService.update(accessToken, id, v);
                toast.success('Live test updated');
                load();
              }}
            />
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
          <Badge className="mt-1">{liveTest.status}</Badge>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Duration</p>
          <p className="mt-1 font-semibold">{liveTest.durationMinutes} min</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Late Entry</p>
          <p className="mt-1 font-semibold">{liveTest.allowLateEntry ? 'Allowed' : 'Not allowed'}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Participants</h2>
        {!liveTest.participantCounts || liveTest.participantCounts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No one has joined yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {liveTest.participantCounts.map((p) => (
              <Badge key={p.status} variant="secondary">
                {p.status}: {p.count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Audit Log</h2>
        {!liveTest.auditLogs || liveTest.auditLogs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No actions recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {liveTest.auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { use } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/shared/require-auth';
import { ErrorState } from '@/components/shared/error-state';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { useServerClock } from '@/hooks/use-server-clock';
import { liveTestsService } from '@/services/live-tests.service';
import { ApiError } from '@/lib/api';
import type { LiveTest } from '@/types';

export default function LiveTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <LiveTestDetailContent id={id} />
    </RequireAuth>
  );
}

function LiveTestDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const { now } = useServerClock();

  const [liveTest, setLiveTest] = React.useState<LiveTest | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [countdownText, setCountdownText] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const data = await liveTestsService.get(id);
      setLiveTest(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this live test');
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Poll the live status so UPCOMING -> COUNTDOWN -> LIVE is picked up
  // without a manual refresh; tighten the cadence in the final minute.
  React.useEffect(() => {
    if (!liveTest || liveTest.status === 'ENDED' || liveTest.status === 'RESULTS_AVAILABLE' || liveTest.status === 'CANCELLED') {
      return;
    }
    const msToStart = new Date(liveTest.startAt).getTime() - now().getTime();
    const interval = msToStart < 60_000 ? 1000 : 5000;
    const id2 = setInterval(load, interval);
    return () => clearInterval(id2);
  }, [liveTest, now, load]);

  React.useEffect(() => {
    if (!liveTest) return;
    const tick = () => {
      const diff = new Date(liveTest.startAt).getTime() - now().getTime();
      if (diff <= 0) {
        setCountdownText('Starting…');
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setCountdownText(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
    };
    tick();
    const id2 = setInterval(tick, 1000);
    return () => clearInterval(id2);
  }, [liveTest, now]);

  const join = async () => {
    if (!accessToken) return;
    setJoining(true);
    try {
      const state = await liveTestsService.join(accessToken, id);
      router.push(`/exam/live/${state.liveTestAttemptId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not join this live test');
      setJoining(false);
    }
  };

  if (error) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <ErrorState description={error} />
      </div>
    );
  }

  if (!liveTest) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const canJoin = liveTest.status === 'COUNTDOWN' || liveTest.status === 'LIVE';

  return (
    <div className="container max-w-2xl py-10">
      <Badge variant={liveTest.status === 'LIVE' ? 'destructive' : 'secondary'}>{liveTest.status}</Badge>
      <h1 className="mt-3 text-2xl font-bold">{liveTest.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {new Date(liveTest.startAt).toLocaleString()} · {liveTest.durationMinutes} min
      </p>

      {liveTest.instructions && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Instructions</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{liveTest.instructions}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
        {liveTest.status === 'UPCOMING' && (
          <p className="text-sm text-muted-foreground">
            The waiting room opens 1 hour before the test starts.
          </p>
        )}
        {(liveTest.status === 'COUNTDOWN' || liveTest.status === 'UPCOMING') && (
          <p className="mt-2 text-3xl font-bold tabular-nums">{countdownText}</p>
        )}
        {liveTest.status === 'ENDED' && <p className="text-sm text-muted-foreground">This live test has ended.</p>}
        {liveTest.status === 'CANCELLED' && (
          <p className="text-sm text-destructive">This live test was cancelled.</p>
        )}

        {canJoin && (
          <Button className="mt-4" size="lg" disabled={joining} onClick={join}>
            {liveTest.status === 'LIVE' ? 'Join Now' : 'Enter Waiting Room'}
          </Button>
        )}
      </div>
    </div>
  );
}

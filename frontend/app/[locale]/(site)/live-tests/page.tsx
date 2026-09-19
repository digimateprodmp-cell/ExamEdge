'use client';

import * as React from 'react';
import { CalendarClock, Radio, Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { RequireAuth } from '@/components/shared/require-auth';
import { liveTestsService } from '@/services/live-tests.service';
import type { LiveTest, LiveTestStatusValue } from '@/types';

const STATUS_BADGE: Record<LiveTestStatusValue, { label: string; variant: 'secondary' | 'destructive' | 'success' | 'outline' }> = {
  UPCOMING: { label: 'Upcoming', variant: 'outline' },
  COUNTDOWN: { label: 'Starting Soon', variant: 'secondary' },
  LIVE: { label: 'Live Now', variant: 'destructive' },
  ENDED: { label: 'Ended', variant: 'outline' },
  RESULTS_AVAILABLE: { label: 'Results Available', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

export default function LiveTestsPage() {
  return (
    <RequireAuth>
      <LiveTestsContent />
    </RequireAuth>
  );
}

function LiveTestsContent() {
  const [liveTests, setLiveTests] = React.useState<LiveTest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    liveTestsService
      .list()
      .then((data) => !cancelled && setLiveTests(data))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = liveTests.filter((lt) => lt.status === 'UPCOMING' || lt.status === 'COUNTDOWN');
  const live = liveTests.filter((lt) => lt.status === 'LIVE');
  const completed = liveTests.filter((lt) => lt.status === 'ENDED' || lt.status === 'RESULTS_AVAILABLE');

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Live Tests</h1>
      <p className="mt-1 text-muted-foreground">Scheduled, proctored tests with a fixed start and end time.</p>

      <Section icon={Radio} title="Live Now" items={live} emptyText="No live tests right now." />
      <Section icon={CalendarClock} title="Upcoming" items={upcoming} emptyText="No upcoming live tests scheduled." />
      <Section icon={Trophy} title="Completed" items={completed} emptyText="No completed live tests yet." />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  emptyText,
}: {
  icon: React.ElementType;
  title: string;
  items: LiveTest[];
  emptyText: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((lt) => (
            <Link
              key={lt.id}
              href={`/live-tests/${lt.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Badge variant={STATUS_BADGE[lt.status].variant}>{STATUS_BADGE[lt.status].label}</Badge>
              </div>
              <p className="font-semibold">{lt.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(lt.startAt).toLocaleString()} · {lt.durationMinutes} min
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

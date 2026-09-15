'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RequireAuth } from '@/components/shared/require-auth';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/hooks/use-auth';
import { attemptsService } from '@/services/attempts.service';
import { ApiError } from '@/lib/api';
import type { AttemptSummary } from '@/types';

export default function MyTestSeriesPage() {
  return (
    <RequireAuth>
      <MyTestSeriesContent />
    </RequireAuth>
  );
}

function MyTestSeriesContent() {
  const t = useTranslations('testSeries');
  const { accessToken } = useAuth();
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    attemptsService
      .mine(accessToken)
      .then(setAttempts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your attempts'));
  }, [accessToken]);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('myTestSeries')}</h1>

      {error && <ErrorState description={error} />}

      {!error && attempts && attempts.length === 0 && (
        <EmptyState title={t('noAttemptsYet')} />
      )}

      {attempts && attempts.length > 0 && (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <Link
              key={attempt.id}
              href={attempt.status === 'IN_PROGRESS' ? `/exam/${attempt.id}` : `/result/${attempt.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-semibold">{attempt.test.titleEn}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(attempt.createdAt).toLocaleDateString()}
                  {attempt.score !== null && ` · Score: ${attempt.score}`}
                </p>
              </div>
              <Badge variant={attempt.status === 'IN_PROGRESS' ? 'warning' : 'success'}>
                {attempt.status.replace('_', ' ')}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

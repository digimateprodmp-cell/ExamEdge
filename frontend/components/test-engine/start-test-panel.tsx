'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { attemptsService } from '@/services/attempts.service';
import { ApiError } from '@/lib/api';
import type { Language } from '@/types';

export function StartTestPanel({ testId }: { testId: string }) {
  const t = useTranslations('testSeries');
  const { accessToken, status } = useAuth();
  const router = useRouter();
  const [starting, setStarting] = useState<Language | null>(null);

  const start = async (language: Language) => {
    if (status !== 'authenticated' || !accessToken) {
      router.push('/login');
      return;
    }
    setStarting(language);
    try {
      const attempt = await attemptsService.start(accessToken, testId, language);
      router.push(`/exam/${attempt.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start the test');
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" className="flex-1" disabled={!!starting} onClick={() => start('EN')}>
        {starting === 'EN' ? '...' : `${t('startTest')} — English`}
      </Button>
      <Button size="lg" variant="outline" className="flex-1 font-devanagari-active" disabled={!!starting} onClick={() => start('HI')}>
        {starting === 'HI' ? '...' : `${t('startTest')} — हिंदी`}
      </Button>
      {status === 'unauthenticated' && (
        <p className="text-xs text-muted-foreground sm:hidden">You&apos;ll be asked to sign in first.</p>
      )}
    </div>
  );
}

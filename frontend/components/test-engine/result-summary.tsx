import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';
import type { Attempt } from '@/types';

export function ResultSummary({ attempt }: { attempt: Attempt }) {
  const t = useTranslations('testEngine');

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold text-muted-foreground">{t('yourScore')}</p>
      <p className="mt-1 text-4xl font-extrabold text-primary">{Number(attempt.score ?? 0).toFixed(2)}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<CheckCircle2 className="h-4 w-4 text-success" />} label={t('correct')} value={attempt.correctCount ?? 0} />
        <Stat icon={<XCircle className="h-4 w-4 text-destructive" />} label={t('incorrect')} value={attempt.incorrectCount ?? 0} />
        <Stat icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />} label={t('unattempted')} value={attempt.unattemptedCount ?? 0} />
        <Stat
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          label={t('timeTaken')}
          value={`${Math.floor((attempt.timeTakenSeconds ?? 0) / 60)}m`}
        />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <div className="flex items-center justify-center gap-1.5">{icon}</div>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

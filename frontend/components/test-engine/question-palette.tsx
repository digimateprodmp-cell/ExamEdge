'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AttemptQuestion } from '@/types';

function statusOf(q: AttemptQuestion, isCurrent: boolean) {
  if (isCurrent) return 'current';
  if (q.isMarkedForReview) return 'marked';
  if (q.selectedOptionId) return 'answered';
  return 'unanswered';
}

const STATUS_CLASSES: Record<string, string> = {
  current: 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
  marked: 'bg-purple-600 text-white',
  answered: 'bg-success text-success-foreground',
  unanswered: 'bg-secondary text-foreground border border-border',
};

export function QuestionPalette({
  questions,
  currentIndex,
  onSelect,
}: {
  questions: AttemptQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations('testEngine');

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-muted-foreground">{t('questionPalette')}</p>
      <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
        {questions.map((q, index) => (
          <button
            key={q.testQuestionId}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-transform hover:scale-105',
              STATUS_CLASSES[statusOf(q, index === currentIndex)],
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2 text-xs">
        <Legend colorClass="bg-success" label={t('answered')} />
        <Legend colorClass="bg-secondary border border-border" label={t('notAnswered')} />
        <Legend colorClass="bg-purple-600" label={t('markedForReview')} />
      </div>
    </div>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-3.5 w-3.5 rounded', colorClass)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

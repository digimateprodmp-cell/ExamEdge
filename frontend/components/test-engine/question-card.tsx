'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttemptQuestion } from '@/types';

export function QuestionCard({
  question,
  index,
  reviewMode = false,
  onSelectOption,
}: {
  question: AttemptQuestion;
  index: number;
  reviewMode?: boolean;
  onSelectOption?: (optionId: string) => void;
}) {
  const t = useTranslations('testEngine');

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t('question')} {index + 1}
        </h2>
        <span className="text-xs text-muted-foreground">
          +{question.marks} {question.negativeMarks !== '0' && `/ -${question.negativeMarks}`}
        </span>
      </div>

      <p className="text-base font-medium leading-relaxed">{question.text}</p>

      <div className="mt-5 space-y-2.5">
        {question.options.map((option) => {
          const isSelected = question.selectedOptionId === option.id;
          const showCorrectness = reviewMode && option.isCorrect !== undefined;

          return (
            <button
              key={option.id}
              type="button"
              disabled={reviewMode}
              onClick={() => onSelectOption?.(option.id)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                !reviewMode && 'hover:border-primary/50 hover:bg-primary/5',
                isSelected && !reviewMode && 'border-primary bg-primary/10 font-medium',
                !isSelected && !reviewMode && 'border-border',
                showCorrectness && option.isCorrect && 'border-success bg-success/10',
                showCorrectness && isSelected && !option.isCorrect && 'border-destructive bg-destructive/10',
                showCorrectness && !isSelected && !option.isCorrect && 'border-border opacity-70',
              )}
            >
              <span>{option.text}</span>
              {showCorrectness && option.isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
              {showCorrectness && isSelected && !option.isCorrect && (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {reviewMode && question.explanation && (
        <div className="mt-5 rounded-xl bg-secondary p-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{t('explanation')}</p>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/test-engine/timer';
import { QuestionCard } from '@/components/test-engine/question-card';
import { QuestionPalette } from '@/components/test-engine/question-palette';
import { SubmitConfirmDialog } from '@/components/test-engine/submit-confirm-dialog';
import { ErrorState } from '@/components/shared/error-state';
import { useTestAttempt } from '@/hooks/use-test-attempt';
import type { Language } from '@/types';

export default function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const t = useTranslations('testEngine');

  const {
    attempt,
    currentIndex,
    setCurrentIndex,
    loading,
    error,
    submitting,
    secondsLeft,
    selectOption,
    clearResponse,
    toggleMarkForReview,
    switchLanguage,
    submit,
  } = useTestAttempt(attemptId);

  if (error) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <ErrorState description={error} />
      </div>
    );
  }

  if (loading || !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const question = attempt.questions[currentIndex];
  const answeredCount = attempt.questions.filter((q) => q.selectedOptionId).length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <Logo iconOnly className="sm:hidden" />
        <Logo className="hidden sm:inline-flex" />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <button
              onClick={() => switchLanguage((attempt.language === 'EN' ? 'HI' : 'EN') as Language)}
              className="mr-1"
            >
              <LanguageOverride current={attempt.language} />
            </button>
          </div>
          <Timer secondsLeft={secondsLeft} />
        </div>
      </header>

      <div className="container flex flex-1 flex-col gap-6 py-6 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <QuestionCard
            question={question}
            index={currentIndex}
            onSelectOption={(optionId) => selectOption(question.testQuestionId, optionId)}
          />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMarkForReview(question.testQuestionId)}
              >
                {t('markForReview')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!question.selectedOptionId}
                onClick={() => clearResponse(question.testQuestionId)}
              >
                {t('clearResponse')}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                ← Prev
              </Button>
              {currentIndex < attempt.questions.length - 1 ? (
                <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
                  {t('saveAndNext')}
                </Button>
              ) : (
                <SubmitConfirmDialog
                  answered={answeredCount}
                  total={attempt.questions.length}
                  submitting={submitting}
                  onConfirm={submit}
                  trigger={<Button size="sm">{t('submitTest')}</Button>}
                />
              )}
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 rounded-2xl border border-border bg-card p-5 lg:w-72">
          <QuestionPalette questions={attempt.questions} currentIndex={currentIndex} onSelect={setCurrentIndex} />
          <SubmitConfirmDialog
            answered={answeredCount}
            total={attempt.questions.length}
            submitting={submitting}
            onConfirm={submit}
            trigger={
              <Button className="mt-5 w-full" variant="accent">
                {t('submitTest')}
              </Button>
            }
          />
        </aside>
      </div>
    </div>
  );
}

function LanguageOverride({ current }: { current: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-input px-3 py-1.5 text-xs font-semibold">
      {current === 'HI' ? 'हिंदी → EN' : 'EN → हिंदी'}
    </span>
  );
}

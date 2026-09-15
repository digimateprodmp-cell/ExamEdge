'use client';

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { QuestionFormDialog } from '@/components/shared/question-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { testsService } from '@/services/test-series.service';
import { questionsService } from '@/services/questions.service';
import { subjectsService } from '@/services/catalog.service';
import { ApiError } from '@/lib/api';
import type { Subject, Test } from '@/types';

export default function TestQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [t, s] = await Promise.all([testsService.get(accessToken, id), subjectsService.list(accessToken)]);
      setTest(t);
      setSubjects(s);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  if (loading || !test) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  const questions = test.testQuestions ?? [];

  return (
    <div>
      <PageHeader
        title={test.titleEn}
        description={`${questions.length} question${questions.length === 1 ? '' : 's'} · ${test.durationMinutes} min · +${test.marksPerQuestion}/-${test.negativeMarks}`}
        action={
          accessToken && (
            <QuestionFormDialog
              subjects={subjects}
              onSubmit={async (input) => {
                const created = await questionsService.create(accessToken, input);
                await testsService.addQuestion(accessToken, id, created.id);
                toast.success('Question added');
                load();
              }}
            />
          )
        }
      />

      {questions.length === 0 ? (
        <EmptyState title="No questions yet" description="Add your first question to this test." />
      ) : (
        <div className="space-y-3">
          {questions
            .sort((a, b) => a.order - b.order)
            .map((tq, index) => {
              const en = tq.question.translations.find((t) => t.language === 'EN');
              const hi = tq.question.translations.find((t) => t.language === 'HI');
              return (
                <Card key={tq.id}>
                  <CardContent className="flex items-start justify-between gap-4 pt-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">Q{index + 1}</p>
                      <p className="mt-1 font-medium">{en?.text || hi?.text}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tq.question.options.map((o) => (
                          <Badge key={o.id} variant={o.isCorrect ? 'success' : 'outline'}>
                            {o.translations.find((t) => t.language === 'EN')?.text ||
                              o.translations.find((t) => t.language === 'HI')?.text}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <QuestionFormDialog
                        subjects={subjects}
                        existing={tq.question}
                        trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
                        onSubmit={async (input) => {
                          if (!accessToken) return;
                          await questionsService.update(accessToken, tq.question.id, input);
                          toast.success('Question updated');
                          load();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (!accessToken) return;
                          await testsService.removeQuestion(accessToken, id, tq.question.id);
                          toast.success('Question removed from test');
                          load();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

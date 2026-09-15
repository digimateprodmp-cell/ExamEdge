'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QuestionInput, QuestionOptionInput } from '@/services/questions.service';
import type { QuestionFull, Subject } from '@/types';

interface FormValues {
  subjectId: string;
  topicId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: string;
  negativeMarks: string;
  textEn: string;
  textHi: string;
  explanationEn: string;
  explanationHi: string;
  options: QuestionOptionInput[];
}

const EMPTY_OPTIONS = (): QuestionOptionInput[] => [
  { textEn: '', textHi: '', isCorrect: true },
  { textEn: '', textHi: '', isCorrect: false },
  { textEn: '', textHi: '', isCorrect: false },
  { textEn: '', textHi: '', isCorrect: false },
];

function fromExisting(question?: QuestionFull): FormValues {
  if (!question) {
    return {
      subjectId: '',
      topicId: '',
      difficulty: 'MEDIUM',
      marks: '1',
      negativeMarks: '0',
      textEn: '',
      textHi: '',
      explanationEn: '',
      explanationHi: '',
      options: EMPTY_OPTIONS(),
    };
  }
  const en = question.translations.find((t) => t.language === 'EN');
  const hi = question.translations.find((t) => t.language === 'HI');
  return {
    subjectId: question.subjectId ?? '',
    topicId: question.topicId ?? '',
    difficulty: question.difficulty,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    textEn: en?.text ?? '',
    textHi: hi?.text ?? '',
    explanationEn: en?.explanation ?? '',
    explanationHi: hi?.explanation ?? '',
    options: question.options
      .sort((a, b) => a.order - b.order)
      .map((o) => ({
        id: o.id,
        isCorrect: o.isCorrect,
        textEn: o.translations.find((t) => t.language === 'EN')?.text ?? '',
        textHi: o.translations.find((t) => t.language === 'HI')?.text ?? '',
      })),
  };
}

export function QuestionFormDialog({
  subjects,
  existing,
  trigger,
  onSubmit,
}: {
  subjects: Subject[];
  existing?: QuestionFull;
  trigger?: React.ReactNode;
  onSubmit: (input: QuestionInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(fromExisting(existing));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(fromExisting(existing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const topics = subjects.find((s) => s.id === values.subjectId)?.topics ?? [];

  const setOption = (index: number, patch: Partial<QuestionOptionInput>) => {
    setValues((v) => ({
      ...v,
      options: v.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        subjectId: values.subjectId || undefined,
        topicId: values.topicId || undefined,
        difficulty: values.difficulty,
        marks: Number(values.marks) || 1,
        negativeMarks: Number(values.negativeMarks) || 0,
        textEn: values.textEn || undefined,
        textHi: values.textHi || undefined,
        explanationEn: values.explanationEn || undefined,
        explanationHi: values.explanationHi || undefined,
        options: values.options,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const valid = (values.textEn || values.textHi) && values.options.filter((o) => o.textEn || o.textHi).length >= 2 && values.options.some((o) => o.isCorrect);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New question</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{existing ? 'Edit question' : 'New question'}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Subject</Label>
              <Select value={values.subjectId} onValueChange={(v) => setValues({ ...values, subjectId: v, topicId: '' })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.nameEn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Topic</Label>
              <Select value={values.topicId} onValueChange={(v) => setValues({ ...values, topicId: v })} disabled={!topics.length}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.nameEn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={values.difficulty} onValueChange={(v) => setValues({ ...values, difficulty: v as FormValues['difficulty'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marks</Label>
              <Input type="number" value={values.marks} onChange={(e) => setValues({ ...values, marks: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Negative marks</Label>
              <Input type="number" value={values.negativeMarks} onChange={(e) => setValues({ ...values, negativeMarks: e.target.value })} />
            </div>
          </div>

          <Tabs defaultValue="en">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="hi">हिंदी</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3">
              <div className="space-y-1.5">
                <Label>Question text</Label>
                <Textarea value={values.textEn} onChange={(e) => setValues({ ...values, textEn: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Explanation</Label>
                <Textarea value={values.explanationEn} onChange={(e) => setValues({ ...values, explanationEn: e.target.value })} />
              </div>
              <OptionsEditor options={values.options} lang="En" onChange={setOption} />
            </TabsContent>
            <TabsContent value="hi" className="space-y-3">
              <div className="space-y-1.5">
                <Label>Question text</Label>
                <Textarea value={values.textHi} onChange={(e) => setValues({ ...values, textHi: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Explanation</Label>
                <Textarea value={values.explanationHi} onChange={(e) => setValues({ ...values, explanationHi: e.target.value })} />
              </div>
              <OptionsEditor options={values.options} lang="Hi" onChange={setOption} />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button disabled={saving || !valid} onClick={submit}>Save question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionsEditor({
  options,
  lang,
  onChange,
}: {
  options: QuestionOptionInput[];
  lang: 'En' | 'Hi';
  onChange: (index: number, patch: Partial<QuestionOptionInput>) => void;
}) {
  const key = lang === 'En' ? 'textEn' : 'textHi';

  return (
    <div className="space-y-2">
      <Label>Options — mark the correct one</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name="correct-option"
            checked={!!opt.isCorrect}
            onChange={() => options.forEach((_, j) => onChange(j, { isCorrect: j === i }))}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <Input
            value={opt[key] ?? ''}
            onChange={(e) => onChange(i, { [key]: e.target.value } as Partial<QuestionOptionInput>)}
            placeholder={`Option ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

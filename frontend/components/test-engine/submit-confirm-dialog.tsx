'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SubmitConfirmDialog({
  answered,
  total,
  submitting,
  onConfirm,
  trigger,
}: {
  answered: number;
  total: number;
  submitting: boolean;
  onConfirm: () => void;
  trigger: React.ReactNode;
}) {
  const t = useTranslations('testEngine');

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('submitConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('submitConfirmBody')}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {answered} / {total} {t('answered').toLowerCase()}
        </p>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={submitting} className="w-full sm:w-auto">
            {t('submitTest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

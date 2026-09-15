'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      toast.success('If that email exists, a reset code has been sent.');
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email, code, newPassword);
      toast.success('Password reset. Please sign in.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" size="lg" disabled={loading || !email} onClick={requestCode}>
          {t('sendResetCode')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="code">{t('otpCode')}</Label>
        <Input id="code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" size="lg" disabled={loading || code.length !== 6 || newPassword.length < 8} onClick={resetPassword}>
        {t('verifyAndReset')}
      </Button>
    </div>
  );
}

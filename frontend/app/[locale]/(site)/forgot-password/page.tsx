import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form';
import { Logo } from '@/components/layout/logo';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-8">
          <div className="mb-6 flex justify-center"><Logo /></div>
          <h1 className="text-center text-2xl font-bold">{t('resetPassword')}</h1>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

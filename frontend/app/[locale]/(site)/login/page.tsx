import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';
import { Logo } from '@/components/layout/logo';

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-8">
          <div className="mb-6 flex justify-center"><Logo /></div>
          <h1 className="text-center text-2xl font-bold">{t('welcomeBack')}</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">{t('loginSubtitle')}</p>
          <LoginForm />
          <div className="mt-5 space-y-2 text-center text-sm">
            <p>
              {t('noAccount')}{' '}
              <Link href="/signup" className="font-semibold text-primary">
                {t('createAccount')}
              </Link>
            </p>
            <Link href="/forgot-password" className="text-primary">
              {t('forgotPassword')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

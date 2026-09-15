import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { SignupForm } from '@/components/forms/signup-form';
import { Logo } from '@/components/layout/logo';

export default async function SignupPage() {
  const t = await getTranslations('auth');

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <div className="mb-6 flex justify-center"><Logo /></div>
          <h1 className="text-center text-2xl font-bold">{t('createAccount')}</h1>
          <div className="mt-6">
            <SignupForm />
          </div>
          <p className="mt-5 text-center text-sm">
            {t('haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-primary">
              {t('signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

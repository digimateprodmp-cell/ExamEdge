'use client';

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { useAuth } from '@/hooks/use-auth';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: readonly { href: string; key: string }[];
}

export function MobileNav({ open, onOpenChange, links }: MobileNavProps) {
  const t = useTranslations('nav');
  const { user, status, logout } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 h-full max-h-none w-full max-w-none translate-y-0 rounded-none border-0 p-6 sm:max-w-sm sm:rounded-r-2xl sm:border-r">
        <DialogTitle className="sr-only">{t('menu')}</DialogTitle>
        <div className="flex flex-col gap-1 pt-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary"
            >
              {t(link.key)}
            </Link>
          ))}

          {status === 'authenticated' && user ? (
            <>
              <Link href="/dashboard" onClick={() => onOpenChange(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary">
                {t('dashboard')}
              </Link>
              <Link href="/profile" onClick={() => onOpenChange(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary">
                {t('profile')}
              </Link>
              <Link href="/my-test-series" onClick={() => onOpenChange(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary">
                {t('myTestSeries')}
              </Link>
              <Button variant="outline" className="mt-3" onClick={() => { logout(); onOpenChange(false); }}>
                {t('logout')}
              </Button>
            </>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild>
                <Link href="/login" onClick={() => onOpenChange(false)}>{t('login')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup" onClick={() => onOpenChange(false)}>{t('signup')}</Link>
              </Button>
            </div>
          )}

          <div className="mt-6">
            <LanguageSwitcher />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

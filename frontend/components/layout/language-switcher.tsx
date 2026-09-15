'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const setLocale = (next: 'en' | 'hi') => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-input bg-background p-0.5 text-xs font-semibold',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={cn(
          'rounded-full px-2.5 py-1 transition-colors',
          locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('hi')}
        aria-pressed={locale === 'hi'}
        className={cn(
          'rounded-full px-2.5 py-1 font-devanagari-active transition-colors',
          locale === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        हिंदी
      </button>
    </div>
  );
}

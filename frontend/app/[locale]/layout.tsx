import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/hooks/use-auth';
import '../globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: { default: 'Test Mela — UPSC & Competitive Exam Preparation', template: '%s | Test Mela' },
  description:
    'Test series, notes, current affairs and video lectures for UPSC, BPSC and competitive exam aspirants — in English and Hindi.',
  icons: { icon: '/favicon.svg' },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontSans.variable} ${fontDevanagari.variable}`}>
      <body className={locale === 'hi' ? 'font-devanagari-active' : 'font-sans'}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

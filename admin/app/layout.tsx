import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Test Mela Admin', template: '%s | Test Mela Admin' },
  description: 'Content and operations console for Test Mela.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}

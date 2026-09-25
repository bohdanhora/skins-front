import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AppShell } from '@/components/layout/app-shell';

import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: { default: 'SkinScout', template: '%s · SkinScout' },
  description: 'Сравнение цен на скины CS2 между white.market и DMarket.',
  applicationName: 'SkinScout',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f11' },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="ru" suppressHydrationWarning className={inter.variable}>
    <body>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </body>
  </html>
);

export default RootLayout;

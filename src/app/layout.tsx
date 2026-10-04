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

const description = 'Сравнение цен на скины CS2 на white.market, DMarket, CSFloat и lis-skins.';

export const metadata: Metadata = {
  metadataBase: new URL('https://skins-front-production.up.railway.app'),
  title: { default: 'SkinScout', template: '%s · SkinScout' },
  description,
  applicationName: 'SkinScout',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'SkinScout',
    title: 'SkinScout',
    description,
  },
  twitter: { card: 'summary_large_image', title: 'SkinScout', description },
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

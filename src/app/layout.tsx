import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Martian_Mono, Unbounded } from 'next/font/google';

import { AppShell } from '@/components/layout/app-shell';

import { Providers } from './providers';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex',
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-unbounded',
});

const martian = Martian_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-martian',
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
    { media: '(prefers-color-scheme: light)', color: '#f0f1ee' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d0f' },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="ru"
    suppressHydrationWarning
    className={`${plex.variable} ${unbounded.variable} ${martian.variable}`}
  >
    <body>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </body>
  </html>
);

export default RootLayout;

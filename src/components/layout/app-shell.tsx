'use client';

import {
  BookOpen,
  Flame,
  FlaskConical,
  Gauge,
  Search,
  Sparkles,
  Sticker,
  Swords,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType, type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import { SettingsDialog } from './settings-dialog';
import { StatusPill } from './status-pill';

interface NavItem {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const MAIN_NAV: NavItem[] = [
  { href: '/', label: 'Выгодно', icon: Sparkles },
  { href: '/top', label: 'Топ', icon: Flame },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/library' as Route, label: 'Библиотека', icon: BookOpen },
  { href: '/float', label: 'Флоат', icon: Gauge },
  { href: '/stickers', label: 'Наклейки', icon: Sticker },
  { href: '/craft' as Route, label: 'Крафт', icon: FlaskConical },
  { href: '/betting' as Route, label: 'Ставки', icon: Swords },
];

const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <header className="bg-background/85 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Разделы" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      title={label}
                      className={cn(
                        'press flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap',
                        active
                          ? 'bg-surface text-foreground shadow-[var(--shadow-soft)]'
                          : 'text-foreground-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className={active ? undefined : 'sr-only xl:not-sr-only'}>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <StatusPill className="hidden sm:inline-flex" />
            <AccountMenu onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
      </header>

      <main
        key={pathname}
        className="animate-rise mx-auto w-full max-w-7xl px-4 pt-4 pb-28 sm:px-6 lg:pt-8 lg:pb-16"
      >
        <StatusPill className="mb-4 sm:hidden" />
        {children}
      </main>

      <nav
        aria-label="Разделы"
        className="bg-surface/90 border-border fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="flex overflow-x-auto">
          {MAIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <li key={href} className="min-w-16 flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium',
                    active ? 'text-foreground' : 'text-foreground-subtle',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

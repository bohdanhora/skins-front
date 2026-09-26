'use client';

import * as Popover from '@radix-ui/react-popover';
import { Backpack, Heart, LogIn, LogOut, ReceiptText, Settings, UserRound } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { steamLoginUrl, useAccount, useLogout } from '@/lib/api/account';
import { cn } from '@/lib/utils/cn';

export const PERSONAL_NAV: {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { href: '/purchases' as Route, label: 'Покупки', icon: ReceiptText },
  { href: '/inventory' as Route, label: 'Инвентарь', icon: Backpack },
  { href: '/favorites', label: 'Избранное', icon: Heart },
];

export const SteamLoginButton = ({ next, className }: { next?: string; className?: string }) => {
  const pathname = usePathname();

  return (
    <Button asChild className={className}>
      <a href={steamLoginUrl(next ?? pathname)}>
        <LogIn className="size-4" aria-hidden />
        Войти через Steam
      </a>
    </Button>
  );
};

const itemStyles =
  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors duration-150';

const MenuButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(itemStyles, 'hover:bg-surface-muted text-foreground')}
  >
    {children}
  </button>
);

export const AccountMenu = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { signedIn, account } = useAccount();
  const logout = useLogout();
  const onPersonalPage = PERSONAL_NAV.some(({ href }) => pathname.startsWith(href));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Мой раздел"
          title={account?.name ?? 'Мой раздел'}
          className={cn(
            'press bg-surface text-foreground-muted hover:text-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[var(--shadow-soft)]',
            onPersonalPage ? 'ring-accent ring-2' : '',
          )}
        >
          {account?.avatar ? (
            <img src={account.avatar} alt="" className="size-full object-cover" />
          ) : (
            <UserRound className="size-[1.125rem]" aria-hidden />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="bg-surface border-border z-50 w-64 rounded-2xl border p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
        >
          {signedIn ? (
            <div className="flex items-center gap-3 px-2.5 py-2">
              {account?.avatar ? (
                <img src={account.avatar} alt="" className="size-9 rounded-full" />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{account?.name ?? 'Steam'}</p>
                <p className="text-foreground-subtle numeric truncate text-xs">
                  {account?.steamId}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-1.5">
              <SteamLoginButton className="w-full" />
            </div>
          )}

          <div className="border-border my-1.5 border-t" />

          <nav aria-label="Мой раздел">
            {PERSONAL_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    itemStyles,
                    active
                      ? 'bg-accent-soft text-accent'
                      : 'hover:bg-surface-muted text-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-border my-1.5 border-t" />

          <MenuButton
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <Settings className="size-4" aria-hidden />
            Настройки
          </MenuButton>
          {signedIn ? (
            <MenuButton
              onClick={() => {
                setOpen(false);
                void logout();
              }}
            >
              <LogOut className="size-4" aria-hidden />
              Выйти
            </MenuButton>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

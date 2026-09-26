'use client';

import * as Popover from '@radix-ui/react-popover';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { steamLoginUrl, useAccount, useLogout } from '@/lib/api/account';
import { cn } from '@/lib/utils/cn';

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

export const AccountMenu = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const { signedIn, account } = useAccount();
  const logout = useLogout();

  if (!signedIn) {
    return (
      <a
        href={steamLoginUrl(pathname)}
        title="Войти через Steam"
        className={cn(
          'press bg-surface text-foreground-muted hover:text-foreground flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium shadow-[var(--shadow-soft)]',
          className,
        )}
      >
        <LogIn className="size-4" aria-hidden />
        Войти
      </a>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Аккаунт"
          title={account?.name ?? 'Аккаунт'}
          className={cn(
            'press bg-surface text-foreground-muted hover:text-foreground flex size-9 items-center justify-center overflow-hidden rounded-full shadow-[var(--shadow-soft)]',
            className,
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
          <div className="flex items-center gap-3 px-2.5 py-2">
            {account?.avatar ? (
              <img src={account.avatar} alt="" className="size-9 rounded-full" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{account?.name ?? 'Steam'}</p>
              <p className="text-foreground-subtle numeric truncate text-xs">{account?.steamId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="hover:bg-surface-muted text-foreground flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm"
          >
            <LogOut className="size-4" aria-hidden />
            Выйти
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SteamLoginButton } from '@/components/layout/account-menu';
import { EmptyState } from '@/components/states/empty-state';
import { writeSession } from '@/lib/api/client';

const safeNext = (next: string | null): string =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

const AuthPage = () => {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');

    window.history.replaceState(null, '', window.location.pathname);

    if (!token) {
      setFailed(true);
      return;
    }

    writeSession(token);
    router.replace(safeNext(params.get('next')) as Route);
  }, [router]);

  if (failed) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-6" aria-hidden />}
        title="Не получилось войти"
        description="Steam не подтвердил вход. Попробуй ещё раз."
        action={<SteamLoginButton next="/" />}
      />
    );
  }

  return (
    <div className="text-foreground-muted flex items-center justify-center gap-2 py-16 text-sm">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Входим через Steam
    </div>
  );
};

export default AuthPage;

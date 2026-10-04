'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ACCESS_KEY, ApiError, apiGet, apiSend, writeAccess } from '@/lib/api/client';
import { useLocalStore } from '@/lib/storage/local-store';

const UNAUTHORIZED = 401;
const TOO_MANY = 429;

const errorText = (error: unknown): string | null => {
  if (!(error instanceof ApiError)) {
    return error ? 'Сервер недоступен' : null;
  }

  if (error.status === UNAUTHORIZED) {
    return 'Неверный пароль';
  }

  if (error.status === TOO_MANY) {
    return 'Слишком много попыток, подождите минуту';
  }

  return error.message;
};

const PasswordScreen = () => {
  const client = useQueryClient();
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: (value: string) =>
      apiSend<{ token: string }>('POST', '/access', { password: value }),
    onSuccess: ({ token }) => {
      writeAccess(token);
      void client.invalidateQueries();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (password) {
      login.mutate(password);
    }
  };

  const message = errorText(login.error);

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="border-foreground text-2xs flex justify-between border-y py-2.5 font-mono uppercase">
          <span>SkinScout</span>
          <span className="text-foreground-subtle">Доступ по паролю</span>
        </div>

        <h1 className="font-display mt-8 text-4xl font-semibold tracking-tight uppercase">
          Skin
          <br />
          Scout
          <span aria-hidden className="caret caret-blink" />
        </h1>

        <label htmlFor="access-password" className="text-2xs mt-10 block font-mono uppercase">
          Пароль
        </label>
        <Input
          id="access-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2"
        />
        {message ? <p className="text-loss mt-3 text-sm">{message}</p> : null}

        <Button type="submit" className="mt-6 w-full" disabled={!password || login.isPending}>
          {login.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Войти
        </Button>
      </form>
    </div>
  );
};

export const AccessGate = ({ children }: { children: ReactNode }) => {
  const [token] = useLocalStore<string | null>(ACCESS_KEY, null);
  const status = useQuery({
    queryKey: ['access'],
    queryFn: ({ signal }) => apiGet<{ required: boolean }>('/access', undefined, signal),
    staleTime: Infinity,
    retry: 1,
  });

  if (status.isPending) {
    return null;
  }

  if (status.data?.required && !token) {
    return <PasswordScreen />;
  }

  return children;
};

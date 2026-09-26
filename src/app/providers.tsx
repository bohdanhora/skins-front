'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { ItemDialogProvider } from '@/components/items/item-dialog-provider';
import { AccountSync } from '@/components/layout/account-sync';
import { PurchaseFormProvider } from '@/components/purchases/purchase-form';
import { ApiError } from '@/lib/api/client';

const STALE_TIME_MS = 60_000;
const CLIENT_ERROR_FLOOR = 400;
const CLIENT_ERROR_CEILING = 500;

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (
    error instanceof ApiError &&
    error.status >= CLIENT_ERROR_FLOOR &&
    error.status < CLIENT_ERROR_CEILING
  ) {
    return false;
  }

  return failureCount < 2;
};

export const Providers = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: STALE_TIME_MS, refetchOnWindowFocus: false, retry: shouldRetry },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <AccountSync />
        <PurchaseFormProvider>
          <ItemDialogProvider>{children}</ItemDialogProvider>
        </PurchaseFormProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

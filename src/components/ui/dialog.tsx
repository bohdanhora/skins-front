'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideHeader = false,
}: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-[overlay-in_180ms_ease-out] bg-black/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        {...(description && !hideHeader ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'bg-surface-raised fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] animate-[sheet-in_200ms_ease-out] flex-col rounded-t-3xl',
          'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[88dvh] sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:animate-[dialog-in_180ms_ease-out] sm:rounded-3xl',
          className,
        )}
      >
        {hideHeader ? (
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        ) : (
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-foreground-muted text-sm">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
          </header>
        )}

        <DialogPrimitive.Close
          aria-label="Закрыть"
          className="text-foreground-subtle hover:bg-surface-muted hover:text-foreground absolute top-3.5 right-3.5 z-10 rounded-full p-2 transition-colors duration-150"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

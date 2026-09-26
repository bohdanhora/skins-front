'use client';

import { ImageUp, Link2, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssistantReady, usePurchaseDraft } from '@/lib/api/assistant';
import type { PurchaseDraft } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const CSFLOAT_LINK = /csfloat\.com\/item\/\d+/;

const shrink = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не получилось открыть картинку'));
    };
    image.src = url;
  });

export const DraftFiller = ({ onDraft }: { onDraft: (draft: PurchaseDraft) => void }) => {
  const ready = useAssistantReady();
  const draft = usePurchaseDraft();
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const send = (input: { image?: string; url?: string }) => {
    setError(null);
    setNotice(null);
    draft.mutate(input, {
      onSuccess: (result) => {
        onDraft(result);
        setLink('');
        setNotice(
          result.name && !result.known
            ? `Не нашли «${result.name}» в каталоге, выбери предмет вручную`
            : 'Заполнено, проверь поля',
        );
      },
      onError: (failure) => setError(failure.message),
    });
  };

  const sendImage = async (file: Blob) => {
    if (!ready) {
      setError('Для скриншотов подключи ассистента в настройках');
      return;
    }

    try {
      send({ image: await shrink(file) });
    } catch (failure) {
      setError((failure as Error).message);
    }
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.items ?? [])]
        .find((entry) => entry.type.startsWith('image/'))
        ?.getAsFile();

      if (file) {
        event.preventDefault();
        void sendImage(file);
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const submitLink = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = link.trim();

    if (!url) return;
    if (!ready && !CSFLOAT_LINK.test(url)) {
      setError('Без ассистента работают только ссылки CSFloat');
      return;
    }

    send({ url });
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';
    if (file) void sendImage(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);

        const file = event.dataTransfer.files?.[0];

        if (file?.type.startsWith('image/')) void sendImage(file);
      }}
      className={cn(
        'space-y-2 rounded-2xl border border-dashed p-3 transition-colors',
        dragging ? 'border-accent bg-accent-soft' : 'border-border-strong',
      )}
    >
      <p className="text-foreground-muted flex items-center gap-1.5 text-[0.8125rem]">
        <Sparkles className="size-3.5" aria-hidden />
        Заполнить по ссылке на лот или скриншоту: вставь Ctrl+V или перетащи
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2
            className="text-foreground-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitLink(event as unknown as FormEvent);
            }}
            placeholder="https://csfloat.com/item/..."
            aria-label="Ссылка на лот"
            className="pl-9"
          />
        </div>
        <Button
          variant="secondary"
          disabled={draft.isPending || !link.trim()}
          onClick={(event) => submitLink(event as unknown as FormEvent)}
        >
          Заполнить
        </Button>
        <Button
          variant="ghost"
          aria-label="Загрузить скриншот"
          title="Загрузить скриншот"
          disabled={draft.isPending}
          onClick={() => fileInput.current?.click()}
        >
          <ImageUp className="size-4" aria-hidden />
        </Button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
      {draft.isPending ? (
        <p className="text-foreground-muted flex items-center gap-1.5 text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Читаем лот
        </p>
      ) : null}
      {notice ? <p className="text-foreground-muted text-xs">{notice}</p> : null}
      {error ? <p className="text-loss text-xs">{error}</p> : null}
    </div>
  );
};

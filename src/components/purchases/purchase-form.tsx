'use client';

import { ReceiptText } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { ItemImage } from '@/components/items/item-image';
import { ItemPicker } from '@/components/items/item-picker';
import { ItemTitle } from '@/components/items/item-title';
import { SteamLoginButton } from '@/components/layout/account-menu';
import { StickerPicker } from '@/components/stickers/sticker-picker';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, MoneyInput, parseMoney } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAccount, useDeletePurchase, useSavePurchase } from '@/lib/api/account';
import type { PurchaseDraft } from '@/lib/api/types';
import { parseFloatInput } from '@/lib/format/float';
import { formatUsd } from '@/lib/format/money';
import { formatDateTime } from '@/lib/format/time';
import {
  TRADE_LOCK_DAYS,
  fromLocalInput,
  lockDays,
  toInput,
  toLocalInput,
  unlockFrom,
  type Purchase,
  type PurchaseInput,
  type PurchaseMarket,
} from '@/lib/purchases/purchases';

import { DraftFiller } from './draft-filler';
import { PURCHASE_MARKET_OPTIONS } from './purchase-shared';

export type PurchasePrefill = Partial<PurchaseInput>;

interface PurchaseFormApi {
  add: (prefill?: PurchasePrefill) => void;
  edit: (purchase: Purchase) => void;
  sell: (purchase: Purchase, suggestion?: { market: PurchaseMarket; received: number }) => void;
}

const PurchaseFormContext = createContext<PurchaseFormApi>({
  add: () => undefined,
  edit: () => undefined,
  sell: () => undefined,
});

export const usePurchaseForm = () => useContext(PurchaseFormContext);

type FormState =
  | { mode: 'edit'; purchase: Purchase | null; prefill: PurchasePrefill }
  | { mode: 'sell'; purchase: Purchase; suggestion?: { market: PurchaseMarket; received: number } };

const LOCK_OPTIONS = Array.from({ length: TRADE_LOCK_DAYS + 1 }, (_, days) => ({
  value: String(days),
  label: days === 0 ? 'Без трейдбана' : `${days} дн.`,
}));

const centsToField = (cents: number | null | undefined): string =>
  cents === null || cents === undefined ? '' : (cents / 100).toFixed(2);

const toCents = (value: string): number | null => {
  const parsed = parseMoney(value);

  return parsed === undefined || parsed < 0 ? null : Math.round(parsed * 100);
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-foreground-muted text-[0.8125rem]">{label}</span>
    {children}
  </label>
);

const ErrorLine = ({ message }: { message: string | null }) =>
  message ? <p className="text-loss text-sm">{message}</p> : null;

interface EditFormProps {
  purchase: Purchase | null;
  prefill: PurchasePrefill;
  onDone: () => void;
}

const EditForm = ({ purchase, prefill, onDone }: EditFormProps) => {
  const base = purchase ? toInput(purchase) : prefill;
  const [item, setItem] = useState(
    base.name
      ? { name: base.name, image: base.image ?? null, rarityColor: base.rarityColor ?? null }
      : null,
  );
  const [price, setPrice] = useState(centsToField(base.price));
  const [amount, setAmount] = useState(String(base.amount ?? 1));
  const [market, setMarket] = useState<PurchaseMarket>(base.market ?? 'csfloat');
  const [boughtAt, setBoughtAt] = useState(toLocalInput(base.boughtAt ?? new Date().toISOString()));
  const [lock, setLock] = useState(
    String(
      base.boughtAt && base.unlockAt
        ? Math.min(TRADE_LOCK_DAYS, lockDays({ boughtAt: base.boughtAt, unlockAt: base.unlockAt }))
        : TRADE_LOCK_DAYS,
    ),
  );
  const [float, setFloat] = useState(base.float != null ? String(base.float) : '');
  const [paintSeed, setPaintSeed] = useState(base.paintSeed != null ? String(base.paintSeed) : '');
  const [note, setNote] = useState(base.note ?? '');
  const [stickers, setStickers] = useState<string[]>(base.stickers ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = useSavePurchase();
  const remove = useDeletePurchase();

  const boughtIso = fromLocalInput(boughtAt);
  const unlockAt = boughtIso ? unlockFrom(boughtIso, Number(lock)) : null;

  const applyDraft = (draft: PurchaseDraft) => {
    if (draft.name && draft.known) {
      setItem({ name: draft.name, image: draft.image, rarityColor: draft.rarityColor });
    }
    if (draft.price !== null) setPrice(centsToField(draft.price));
    if (draft.float !== null) setFloat(String(draft.float));
    if (draft.paintSeed !== null) setPaintSeed(String(draft.paintSeed));
    if (draft.stickers.length > 0) setStickers(draft.stickers.slice(0, 5));
    if (draft.market && PURCHASE_MARKET_OPTIONS.some((option) => option.value === draft.market)) {
      setMarket(draft.market as PurchaseMarket);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const cents = toCents(price);
    const count = Number(amount);
    const floatValue = float.trim() === '' ? null : (parseFloatInput(float) ?? NaN);
    const seed = paintSeed.trim() === '' ? null : Number(paintSeed);

    if (!item) return setError('Выбери предмет');
    if (cents === null) return setError('Укажи цену');
    if (!Number.isInteger(count) || count < 1) return setError('Количество должно быть целым');
    if (!boughtIso || !unlockAt) return setError('Проверь дату покупки');
    if (Number.isNaN(floatValue)) return setError('Флоат должен быть от 0 до 1');
    if (seed !== null && (!Number.isInteger(seed) || seed < 0)) {
      return setError('Паттерн должен быть целым числом');
    }

    setError(null);
    save.mutate(
      {
        id: purchase?.id ?? null,
        input: {
          name: item.name,
          image: item.image,
          rarityColor: item.rarityColor,
          price: cents,
          amount: count,
          market,
          boughtAt: boughtIso,
          unlockAt,
          float: floatValue,
          paintSeed: seed,
          note: note.trim(),
          stickers,
          assetId: base.assetId ?? null,
          sale: purchase?.sale ?? null,
        },
      },
      { onSuccess: onDone, onError: (failure) => setError(failure.message) },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      {purchase || base.assetId ? null : <DraftFiller onDraft={applyDraft} />}

      {item ? (
        <div className="bg-surface-muted/60 flex items-center gap-3 rounded-2xl p-2 pr-3">
          <ItemImage
            src={item.image}
            alt={item.name}
            rarityColor={item.rarityColor}
            className="size-14 shrink-0"
            imageClassName="p-1"
          />
          <div className="min-w-0 flex-1">
            <ItemTitle name={item.name} />
          </div>
          {purchase || base.assetId ? null : (
            <Button variant="ghost" size="sm" onClick={() => setItem(null)}>
              Сменить
            </Button>
          )}
        </div>
      ) : (
        <ItemPicker
          placeholder="Что купил"
          autoFocus
          onPick={(picked) =>
            setItem({ name: picked.name, image: picked.image, rarityColor: picked.rarityColor })
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Цена за штуку">
          <MoneyInput value={price} onChange={setPrice} placeholder="0.00" />
        </Field>
        <Field label="Где купил">
          <Select value={market} onChange={setMarket} options={PURCHASE_MARKET_OPTIONS} />
        </Field>
        <Field label="Когда">
          <Input
            type="datetime-local"
            value={boughtAt}
            onChange={(event) => setBoughtAt(event.target.value)}
          />
        </Field>
        <Field label="Трейдбан">
          <Select value={lock} onChange={setLock} options={LOCK_OPTIONS} />
        </Field>
        <Field label="Флоат">
          <Input
            inputMode="decimal"
            value={float}
            onChange={(event) => setFloat(event.target.value)}
            placeholder="0.123456"
            className="numeric"
          />
        </Field>
        <Field label="Паттерн">
          <Input
            inputMode="numeric"
            value={paintSeed}
            onChange={(event) => setPaintSeed(event.target.value.replace(/\D/g, ''))}
            placeholder="661"
            className="numeric"
          />
        </Field>
        <Field label="Количество">
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))}
            className="numeric"
          />
        </Field>
        <div className="text-foreground-subtle flex items-end pb-3 text-xs">
          {unlockAt && lock !== '0' ? `Можно продать с ${formatDateTime(unlockAt)}` : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-foreground-muted text-[0.8125rem]">Наклейки</span>
        <StickerPicker
          selected={stickers}
          onChange={setStickers}
          max={5}
          allowRepeats
          placeholder="Добавь наклейку, если есть"
        />
      </div>

      <Field label="Заметка">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={1000}
          className="border-border-strong bg-surface text-foreground placeholder:text-foreground-subtle focus-visible:border-accent focus-visible:ring-accent/15 w-full rounded-xl border px-3.5 py-2.5 text-sm focus-visible:ring-4 focus-visible:outline-none"
        />
      </Field>

      <ErrorLine message={error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {purchase ? (
          <Button
            variant="ghost"
            className="text-loss"
            disabled={remove.isPending}
            onClick={() =>
              confirmDelete
                ? remove.mutate(purchase.id, {
                    onSuccess: onDone,
                    onError: (failure) => setError(failure.message),
                  })
                : setConfirmDelete(true)
            }
          >
            {confirmDelete ? 'Точно удалить?' : 'Удалить'}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={save.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
};

interface SellFormProps {
  purchase: Purchase;
  suggestion?: { market: PurchaseMarket; received: number };
  onDone: () => void;
}

const SellForm = ({ purchase, suggestion, onDone }: SellFormProps) => {
  const [market, setMarket] = useState<PurchaseMarket>(
    purchase.sale?.market ?? suggestion?.market ?? 'csfloat',
  );
  const [received, setReceived] = useState(
    centsToField(purchase.sale?.received ?? suggestion?.received),
  );
  const [soldAt, setSoldAt] = useState(
    toLocalInput(purchase.sale?.soldAt ?? new Date().toISOString()),
  );
  const [error, setError] = useState<string | null>(null);
  const save = useSavePurchase();
  const cost = purchase.price * purchase.amount;
  const cents = toCents(received);

  const commit = (sale: Purchase['sale']) =>
    save.mutate(
      { id: purchase.id, input: { ...toInput(purchase), sale } },
      { onSuccess: onDone, onError: (failure) => setError(failure.message) },
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const iso = fromLocalInput(soldAt);

    if (cents === null) return setError('Укажи, сколько пришло');
    if (!iso) return setError('Проверь дату продажи');

    setError(null);
    commit({ market, received: cents, soldAt: iso });
  };

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      <div className="bg-surface-muted/60 flex items-center gap-3 rounded-2xl p-2 pr-3">
        <ItemImage
          src={purchase.image}
          alt={purchase.name}
          rarityColor={purchase.rarityColor}
          className="size-14 shrink-0"
          imageClassName="p-1"
        />
        <div className="min-w-0 flex-1">
          <ItemTitle name={purchase.name} />
          <p className="text-foreground-subtle numeric mt-1 text-xs">
            куплено за {formatUsd(cost)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={purchase.amount > 1 ? 'Пришло на руки за все' : 'Пришло на руки'}>
          <MoneyInput value={received} onChange={setReceived} placeholder="0.00" />
        </Field>
        <Field label="Где продал">
          <Select value={market} onChange={setMarket} options={PURCHASE_MARKET_OPTIONS} />
        </Field>
        <Field label="Когда">
          <Input
            type="datetime-local"
            value={soldAt}
            onChange={(event) => setSoldAt(event.target.value)}
          />
        </Field>
        <div className="flex items-end pb-3 text-sm">
          {cents !== null ? (
            <span className={cents - cost >= 0 ? 'text-gain' : 'text-loss'}>
              {cents - cost >= 0 ? 'Прибыль ' : 'Убыток '}
              {formatUsd(Math.abs(cents - cost))}
            </span>
          ) : null}
        </div>
      </div>

      <ErrorLine message={error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {purchase.sale ? (
          <Button variant="ghost" disabled={save.isPending} onClick={() => commit(null)}>
            Ещё не продал
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={save.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
};

export const PurchaseFormProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FormState | null>(null);
  const [open, setOpen] = useState(false);
  const { signedIn } = useAccount();

  const show = useCallback((next: FormState) => {
    setState(next);
    setOpen(true);
  }, []);

  const api = useMemo<PurchaseFormApi>(
    () => ({
      add: (prefill = {}) => show({ mode: 'edit', purchase: null, prefill }),
      edit: (purchase) => show({ mode: 'edit', purchase, prefill: {} }),
      sell: (purchase, suggestion) => show({ mode: 'sell', purchase, suggestion }),
    }),
    [show],
  );

  const close = () => setOpen(false);
  const title =
    state?.mode === 'sell' ? 'Продажа' : state?.purchase ? 'Покупка' : 'Записать покупку';

  return (
    <PurchaseFormContext.Provider value={api}>
      {children}
      <Dialog open={open} onOpenChange={setOpen} title={title}>
        {!signedIn ? (
          <div className="space-y-4 py-4 text-center">
            <div className="bg-surface-muted text-foreground-muted mx-auto flex size-12 items-center justify-center rounded-2xl">
              <ReceiptText className="size-6" aria-hidden />
            </div>
            <p className="text-foreground-muted text-sm">Войди, чтобы записывать покупки.</p>
            <SteamLoginButton />
          </div>
        ) : state?.mode === 'sell' ? (
          <SellForm
            key={`sell-${state.purchase.id}`}
            purchase={state.purchase}
            suggestion={state.suggestion}
            onDone={close}
          />
        ) : state ? (
          <EditForm
            key={state.purchase?.id ?? JSON.stringify(state.prefill)}
            purchase={state.purchase}
            prefill={state.prefill}
            onDone={close}
          />
        ) : null}
      </Dialog>
    </PurchaseFormContext.Provider>
  );
};

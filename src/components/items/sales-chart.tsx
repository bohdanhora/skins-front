'use client';

import { useId, useMemo, useState } from 'react';

import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { useElementWidth } from '@/hooks/use-element-width';
import { useSalesChart } from '@/lib/api/queries';
import type { Item, MarketId, SalesDay } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';
import { MARKETS, MARKET_ORDER } from '@/lib/markets';
import { cn } from '@/lib/utils/cn';

type Period = '14' | '56';
type SalesMarket = 'whiteMarket' | 'dmarket' | 'csfloat';
type LayerId = MarketId | 'bid';

const SALES_MARKETS: SalesMarket[] = ['whiteMarket', 'dmarket', 'csfloat'];
const DAY_MS = 86_400_000;
const PRICE_HEIGHT = 190;
const COUNT_HEIGHT = 44;
const GAP = 26;
const AXIS_LEFT = 56;
const LABEL_GUTTER = 96;
const PAD_TOP = 10;
const BAR_MAX = 24;
const BAR_GAP = 2;
const LABEL_SPACING = 14;
const OUTLIER_RATIO = 1.5;

const STROKE: Record<MarketId, string> = {
  whiteMarket: 'stroke-market-wm',
  dmarket: 'stroke-market-dm',
  csfloat: 'stroke-market-cf',
  lisSkins: 'stroke-market-lis',
};

const FILL: Record<MarketId, string> = {
  whiteMarket: 'fill-market-wm',
  dmarket: 'fill-market-dm',
  csfloat: 'fill-market-cf',
  lisSkins: 'fill-market-lis',
};

interface ChartDay {
  day: string;
  sales: Record<SalesMarket, SalesDay | null>;
}

interface Reference {
  id: LayerId;
  market: MarketId;
  label: string;
  price: number;
}

const dayLabel = (day: string): string => {
  const [, month, date] = day.split('-');

  return `${date}.${month}`;
};

const lastDays = (count: number): string[] => {
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );

  return Array.from({ length: count }, (_, index) =>
    new Date(today - (count - 1 - index) * DAY_MS).toISOString().slice(0, 10),
  );
};

const sold = (day: SalesDay | null | undefined): day is SalesDay =>
  !!day && day.count > 0 && day.average > 0;

const listed = (item: Item, market: MarketId): number | null => {
  const quote = item[market];

  return quote && quote.listings > 0 && quote.price ? quote.price : null;
};

const spreadLabels = (positions: number[], min: number, max: number): number[] => {
  const order = positions
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const placed: number[] = [];

  order.forEach((entry, rank) => {
    placed[rank] = Math.max(entry.value, rank > 0 ? placed[rank - 1] + LABEL_SPACING : min);
  });

  for (let rank = placed.length - 1; rank >= 0; rank -= 1) {
    const limit = rank === placed.length - 1 ? max : placed[rank + 1] - LABEL_SPACING;

    placed[rank] = Math.min(placed[rank], limit);
  }

  const result: number[] = [];

  order.forEach((entry, rank) => {
    result[entry.index] = placed[rank];
  });

  return result;
};

export const SalesChart = ({ item }: { item: Item }) => {
  const chart = useSalesChart(item.name);
  const [period, setPeriod] = useState<Period>('14');
  const [hidden, setHidden] = useState<Set<LayerId>>(() => new Set());

  const days = useMemo<ChartDay[]>(() => {
    const byMarket = {
      dmarket: new Map(
        (chart.data?.markets?.dmarket ?? chart.data?.days ?? []).map((d) => [d.day, d]),
      ),
      csfloat: new Map((chart.data?.markets?.csfloat ?? []).map((d) => [d.day, d])),
      whiteMarket: new Map((chart.data?.markets?.whiteMarket ?? []).map((d) => [d.day, d])),
    };

    return lastDays(Number(period)).map((day) => ({
      day,
      sales: {
        dmarket: byMarket.dmarket.get(day) ?? null,
        csfloat: byMarket.csfloat.get(day) ?? null,
        whiteMarket: byMarket.whiteMarket.get(day) ?? null,
      },
    }));
  }, [chart.data, period]);

  if (chart.isPending) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const references: Reference[] = [
    ...MARKET_ORDER.flatMap((market) => {
      const price = listed(item, market);

      return price ? [{ id: market, market, label: MARKETS[market].short, price }] : [];
    }),
    ...(item.dmarket?.bid
      ? [
          {
            id: 'bid' as const,
            market: 'dmarket' as const,
            label: 'Заявка',
            price: item.dmarket.bid,
          },
        ]
      : []),
  ];
  const salesMarkets = SALES_MARKETS.filter((market) =>
    days.some((day) => sold(day.sales[market])),
  );
  const stats = chart.data?.stats ?? null;

  const toggle = (id: LayerId) =>
    setHidden((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  const legend: {
    id: LayerId;
    market: MarketId;
    label: string;
    detail: string;
    dashed: boolean;
  }[] = [
    ...MARKET_ORDER.filter(
      (market) =>
        references.some((entry) => entry.id === market) ||
        salesMarkets.includes(market as SalesMarket),
    ).map((market) => {
      const price = listed(item, market);

      return {
        id: market,
        market,
        label: MARKETS[market].name,
        detail: price ? `сейчас ${formatUsd(price)}` : 'нет лотов',
        dashed: !salesMarkets.includes(market as SalesMarket),
      };
    }),
    ...(item.dmarket?.bid
      ? [
          {
            id: 'bid' as const,
            market: 'dmarket' as const,
            label: 'Заявка DMarket',
            detail: formatUsd(item.dmarket.bid),
            dashed: true,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-foreground-muted text-sm">
          {stats ? (
            <p>
              На DMarket обычно продают от{' '}
              <span className="text-foreground numeric font-semibold">
                {formatUsd(stats.floor)}
              </span>
              , за неделю продали {stats.weekSales}{' '}
              {plural(stats.weekSales, ['штуку', 'штуки', 'штук'])}
            </p>
          ) : (
            <p>Продаж пока мало, смотри на текущие цены.</p>
          )}
        </div>
        <Segmented
          label="Период"
          value={period}
          onChange={setPeriod}
          options={[
            { value: '14', label: '2 недели' },
            { value: '56', label: '8 недель' },
          ]}
          className="w-auto"
        />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Что показать на графике">
        {legend.map((entry) => {
          const off = hidden.has(entry.id);

          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={!off}
              onClick={() => toggle(entry.id)}
              className={cn(
                'press border-border flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs',
                off ? 'text-foreground-subtle opacity-60' : 'text-foreground',
              )}
            >
              <svg width="18" height="8" aria-hidden>
                <line
                  x1="1"
                  x2="17"
                  y1="4"
                  y2="4"
                  className={STROKE[entry.market]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={entry.id === 'bid' ? '1 3' : entry.dashed ? '4 3' : undefined}
                />
              </svg>
              <span className="font-medium">{entry.label}</span>
              <span className="text-foreground-muted numeric">{entry.detail}</span>
            </button>
          );
        })}
      </div>

      {salesMarkets.length === 0 && references.length === 0 ? (
        <p className="text-foreground-muted py-4 text-sm">
          Этот предмет в последнее время не продавали и сейчас не выставляют.
        </p>
      ) : (
        <Plot
          days={days}
          salesMarkets={salesMarkets.filter((market) => !hidden.has(market))}
          references={references.filter((entry) => !hidden.has(entry.id))}
        />
      )}

      <p className="text-foreground-subtle text-xs leading-relaxed">
        Сплошные линии это средняя цена продаж за день. Пунктир это самый дешёвый лот на площадке
        сейчас. lis-skins не публикует историю продаж, у него видна только текущая цена.
        {salesMarkets.includes('csfloat')
          ? ' В среднюю цену CSFloat входят лоты с дорогими наклейками и редким флоатом, поэтому она бывает выше.'
          : ''}
      </p>

      <details className="text-foreground-muted text-xs">
        <summary className="hover:text-foreground cursor-pointer select-none">
          Показать таблицей
        </summary>
        <table className="numeric mt-2 w-full text-left">
          <thead>
            <tr className="text-foreground-subtle">
              <th className="py-1 font-medium">День</th>
              {salesMarkets.map((market) => (
                <th key={market} className="py-1 font-medium">
                  {MARKETS[market].short}: цена, продаж
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((day) => (
              <tr key={day.day} className="border-border border-t">
                <td className="py-1">{dayLabel(day.day)}</td>
                {salesMarkets.map((market) => {
                  const entry = day.sales[market];

                  return (
                    <td key={market} className="py-1">
                      {sold(entry) ? (
                        <>
                          <span className="text-foreground">{formatUsd(entry.average)}</span>,{' '}
                          {entry.count}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

interface PlotProps {
  days: ChartDay[];
  salesMarkets: SalesMarket[];
  references: Reference[];
}

const Plot = ({ days, salesMarkets, references }: PlotProps) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const salesOf = (markets: SalesMarket[]) =>
      days.flatMap((day) =>
        markets
          .map((market) => day.sales[market])
          .filter(sold)
          .map((entry) => entry.average),
      );
    const anchor = [
      ...salesOf(salesMarkets.filter((market) => market !== 'csfloat')),
      ...references.map((entry) => entry.price),
    ];
    const ceiling = anchor.length > 0 ? Math.max(...anchor) * OUTLIER_RATIO : Infinity;
    const csfloat = salesOf(salesMarkets.filter((market) => market === 'csfloat'));
    const values = [...anchor, ...csfloat.filter((value) => value <= ceiling)];
    const clipped = csfloat.some((value) => value > ceiling);
    const rawLow = values.length > 0 ? Math.min(...values) : 0;
    const rawHigh = values.length > 0 ? Math.max(...values) : 1;
    const padding = Math.max(1, (rawHigh - rawLow) * 0.08);
    const low = Math.max(0, rawLow - padding);
    const high = rawHigh + padding;
    const maxCount = Math.max(
      1,
      ...days.map((day) =>
        salesMarkets.reduce((sum, market) => sum + (day.sales[market]?.count ?? 0), 0),
      ),
    );
    const right = width - LABEL_GUTTER;
    const plotWidth = Math.max(0, right - AXIS_LEFT);
    const step = days.length > 1 ? plotWidth / (days.length - 1) : plotWidth;
    const x = (index: number) => AXIS_LEFT + index * step;
    const y = (value: number) =>
      PAD_TOP + (1 - (value - low) / Math.max(1, high - low)) * (PRICE_HEIGHT - PAD_TOP);

    return { low, high, maxCount, step, right, x, y, clipped };
  }, [days, salesMarkets, references, width]);

  const { low, high, maxCount, step, right, x, y, clipped } = geometry;
  const clipId = `sales-clip-${useId().replace(/:/g, '')}`;
  const countTop = PRICE_HEIGHT + GAP;
  const height = countTop + COUNT_HEIGHT + 22;
  const barWidth = Math.min(BAR_MAX, Math.max(2, step - BAR_GAP));
  const labelEvery = Math.ceil(days.length / 5);
  const hovered = hover === null ? null : days[hover];
  const labelY = spreadLabels(
    references.map((entry) => y(entry.price)),
    PAD_TOP,
    PRICE_HEIGHT,
  );

  const paths = salesMarkets.map((market) => {
    const segments: string[] = [];
    let current = '';

    days.forEach((day, index) => {
      const entry = day.sales[market];

      if (!sold(entry)) {
        if (current) segments.push(current);
        current = '';
        return;
      }

      current += `${current ? 'L' : 'M'}${x(index)},${y(entry.average)}`;
    });

    if (current) segments.push(current);

    return { market, segments };
  });

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Средняя цена продаж по дням на площадках и текущие цены"
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const index = Math.round((event.clientX - box.left - AXIS_LEFT) / (step || 1));

            setHover(Math.min(days.length - 1, Math.max(0, index)));
          }}
          onPointerLeave={() => setHover(null)}
          className="overflow-visible"
        >
          {[low, (low + high) / 2, high].map((tick) => (
            <g key={tick}>
              <line
                x1={AXIS_LEFT}
                x2={right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={AXIS_LEFT - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-foreground-subtle numeric text-[0.6875rem]"
              >
                {formatUsd(tick)}
              </text>
            </g>
          ))}

          {references.map((entry, index) => (
            <g key={entry.id}>
              <line
                x1={AXIS_LEFT}
                x2={right}
                y1={y(entry.price)}
                y2={y(entry.price)}
                className={STROKE[entry.market]}
                strokeWidth={1.5}
                strokeDasharray={entry.id === 'bid' ? '1 3' : '4 3'}
                strokeLinecap="round"
              />
              <line
                x1={right}
                x2={right + 6}
                y1={y(entry.price)}
                y2={labelY[index]}
                className={STROKE[entry.market]}
                strokeWidth={1}
              />
              <circle cx={right + 10} cy={labelY[index]} r={3} className={FILL[entry.market]} />
              <text
                x={right + 16}
                y={labelY[index]}
                dy="0.32em"
                className="fill-foreground-muted numeric text-[0.6875rem]"
              >
                {formatUsd(entry.price)}
              </text>
            </g>
          ))}

          {clipped ? (
            <text
              x={right}
              y={PAD_TOP - 2}
              textAnchor="end"
              className="fill-foreground-subtle text-[0.6875rem]"
            >
              CSFloat выше шкалы
            </text>
          ) : null}
          <defs>
            <clipPath id={clipId}>
              <rect
                x={AXIS_LEFT - 6}
                y={0}
                width={Math.max(0, right - AXIS_LEFT + 12)}
                height={PRICE_HEIGHT + 6}
              />
            </clipPath>
          </defs>
          {paths.map(({ market, segments }) =>
            segments.map((path) => (
              <path
                key={`${market}-${path}`}
                clipPath={`url(#${clipId})`}
                d={path}
                fill="none"
                className={STROKE[market]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )),
          )}

          {days.map((day, index) => {
            let base = countTop + COUNT_HEIGHT;

            return salesMarkets.map((market) => {
              const count = day.sales[market]?.count ?? 0;

              if (count === 0) return null;

              const barHeight = Math.max(1, (count / maxCount) * COUNT_HEIGHT);
              const bar = (
                <path
                  key={`${day.day}-${market}`}
                  d={roundedTop(x(index) - barWidth / 2, base, barWidth, barHeight - 1)}
                  className={cn(FILL[market], hover === index ? 'opacity-100' : 'opacity-45')}
                />
              );

              base -= barHeight + 1;

              return bar;
            });
          })}
          <line
            x1={AXIS_LEFT}
            x2={right}
            y1={countTop + COUNT_HEIGHT}
            y2={countTop + COUNT_HEIGHT}
            className="stroke-border"
            strokeWidth={1}
          />
          <text
            x={AXIS_LEFT - 8}
            y={countTop + COUNT_HEIGHT / 2}
            dy="0.32em"
            textAnchor="end"
            className="fill-foreground-subtle text-[0.6875rem]"
          >
            продаж
          </text>

          {days.map((day, index) =>
            (index % labelEvery === 0 && days.length - 1 - index >= labelEvery / 2) ||
            index === days.length - 1 ? (
              <text
                key={day.day}
                x={x(index)}
                y={height - 4}
                textAnchor={index === 0 ? 'start' : index === days.length - 1 ? 'end' : 'middle'}
                className="fill-foreground-subtle numeric text-[0.6875rem]"
              >
                {dayLabel(day.day)}
              </text>
            ) : null,
          )}

          {hovered && hover !== null ? (
            <g pointerEvents="none">
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD_TOP}
                y2={countTop + COUNT_HEIGHT}
                className="stroke-foreground-subtle"
                strokeWidth={1}
              />
              {salesMarkets.map((market) => {
                const entry = hovered.sales[market];

                return sold(entry) ? (
                  <circle
                    key={market}
                    clipPath={`url(#${clipId})`}
                    cx={x(hover)}
                    cy={y(entry.average)}
                    r={4.5}
                    className={cn(FILL[market], 'stroke-surface-raised')}
                    strokeWidth={2}
                  />
                ) : null;
              })}
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {hovered && hover !== null ? (
        <div
          className="bg-surface-raised border-border pointer-events-none absolute top-0 z-10 min-w-40 rounded-xl border px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 80, 0), Math.max(0, width - 170)) }}
        >
          <p className="text-foreground-subtle">{dayLabel(hovered.day)}</p>
          {salesMarkets.length === 0 ? (
            <p className="text-foreground-muted">Продажи скрыты</p>
          ) : (
            salesMarkets.map((market) => {
              const entry = hovered.sales[market];

              return (
                <p key={market} className="mt-1 flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', MARKETS[market].dot)} aria-hidden />
                  <span className="text-foreground-muted">{MARKETS[market].short}</span>
                  <span className="numeric text-foreground ml-auto font-semibold">
                    {sold(entry) ? formatUsd(entry.average) : 'нет продаж'}
                  </span>
                  {sold(entry) ? (
                    <span className="text-foreground-subtle numeric">× {entry.count}</span>
                  ) : null}
                </p>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};

const roundedTop = (left: number, base: number, width: number, height: number): string => {
  const radius = Math.min(4, width / 2, Math.max(0, height));
  const top = base - Math.max(0, height);

  return [
    `M${left},${base}`,
    `V${top + radius}`,
    `Q${left},${top} ${left + radius},${top}`,
    `H${left + width - radius}`,
    `Q${left + width},${top} ${left + width},${top + radius}`,
    `V${base}`,
    'Z',
  ].join('');
};

'use client';

import { useMemo, useState } from 'react';

import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { useElementWidth } from '@/hooks/use-element-width';
import { useSalesChart } from '@/lib/api/queries';
import type { SalesDay } from '@/lib/api/types';
import { formatUsd } from '@/lib/format/money';
import { plural } from '@/lib/format/time';

type Period = '14' | '56';

const PRICE_HEIGHT = 150;
const COUNT_HEIGHT = 44;
const GAP = 26;
const AXIS_LEFT = 52;
const AXIS_RIGHT = 8;
const PAD_TOP = 8;
const BAR_MAX = 24;
const BAR_GAP = 2;

const dayLabel = (day: string): string => {
  const [, month, date] = day.split('-');

  return `${date}.${month}`;
};

const niceTicks = (min: number, max: number): number[] => {
  const middle = (min + max) / 2;

  return [min, middle, max];
};

interface SalesChartProps {
  name: string;
  /** Cheapest price right now, cents: drawn as a reference line. */
  currentPrice: number | null;
}

export const SalesChart = ({ name, currentPrice }: SalesChartProps) => {
  const chart = useSalesChart(name);
  const [period, setPeriod] = useState<Period>('14');

  if (chart.isPending) {
    return <Skeleton className="h-56 rounded-2xl" />;
  }

  if (chart.isError || chart.data.days.every((day) => day.count === 0)) {
    return (
      <p className="text-foreground-muted py-4 text-sm">
        На DMarket этот предмет в последнее время не продавали.
      </p>
    );
  }

  const days = chart.data.days.slice(-Number(period));
  const stats = chart.data.stats;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-foreground-muted space-y-0.5 text-sm">
          {stats ? (
            <p>
              Обычно продают от{' '}
              <span className="text-foreground numeric font-semibold">
                {formatUsd(stats.floor)}
              </span>
              , за неделю продали {stats.weekSales}{' '}
              {plural(stats.weekSales, ['штуку', 'штуки', 'штук'])}
            </p>
          ) : null}
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
      <Plot days={days} currentPrice={currentPrice} />
      <details className="text-foreground-muted text-xs">
        <summary className="hover:text-foreground cursor-pointer select-none">
          Показать таблицей
        </summary>
        <table className="numeric mt-2 w-full text-left">
          <thead>
            <tr className="text-foreground-subtle">
              <th className="py-1 font-medium">День</th>
              <th className="py-1 font-medium">Средняя цена</th>
              <th className="py-1 font-medium">Продаж</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((day) => (
              <tr key={day.day} className="border-border border-t">
                <td className="py-1">{dayLabel(day.day)}</td>
                <td className="text-foreground py-1">{day.count ? formatUsd(day.average) : '-'}</td>
                <td className="py-1">{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

const Plot = ({ days, currentPrice }: { days: SalesDay[]; currentPrice: number | null }) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const sold = days.filter((day) => day.count > 0).map((day) => day.average);
    const values = currentPrice ? [...sold, currentPrice] : sold;
    const low = Math.min(...values) * 0.95;
    const high = Math.max(...values) * 1.05;
    const maxCount = Math.max(1, ...days.map((day) => day.count));
    const plotWidth = Math.max(0, width - AXIS_LEFT - AXIS_RIGHT);
    const step = days.length > 1 ? plotWidth / (days.length - 1) : plotWidth;
    const x = (index: number) => AXIS_LEFT + index * step;
    const y = (value: number) =>
      PAD_TOP + (1 - (value - low) / Math.max(1, high - low)) * (PRICE_HEIGHT - PAD_TOP);

    return { low, high, maxCount, step, x, y };
  }, [days, currentPrice, width]);

  const { low, high, maxCount, step, x, y } = geometry;
  const countTop = PRICE_HEIGHT + GAP;
  const height = countTop + COUNT_HEIGHT + 22;
  const barWidth = Math.min(BAR_MAX, Math.max(2, step - BAR_GAP));

  // Days without sales break the line instead of pretending the price stayed put.
  const segments: string[] = [];
  let current = '';

  days.forEach((day, index) => {
    if (day.count === 0) {
      if (current) segments.push(current);
      current = '';
      return;
    }

    current += `${current ? 'L' : 'M'}${x(index)},${y(day.average)}`;
  });

  if (current) segments.push(current);

  const labelEvery = Math.ceil(days.length / 4);
  const hovered = hover === null ? null : days[hover];

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Средняя цена продаж по дням и количество продаж"
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const index = Math.round((event.clientX - box.left - AXIS_LEFT) / (step || 1));

            setHover(Math.min(days.length - 1, Math.max(0, index)));
          }}
          onPointerLeave={() => setHover(null)}
          className="overflow-visible"
        >
          {niceTicks(low, high).map((tick) => (
            <g key={tick}>
              <line
                x1={AXIS_LEFT}
                x2={width - AXIS_RIGHT}
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

          {segments.map((path) => (
            <path
              key={path}
              d={path}
              fill="none"
              className="stroke-accent"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {currentPrice ? (
            <g>
              <line
                x1={AXIS_LEFT}
                x2={width - AXIS_RIGHT}
                y1={y(currentPrice)}
                y2={y(currentPrice)}
                className="stroke-gain"
                strokeWidth={1.5}
              />
              <text
                x={width - AXIS_RIGHT}
                y={y(currentPrice) - 6}
                textAnchor="end"
                className="fill-foreground numeric text-[0.6875rem] font-semibold"
              >
                сейчас {formatUsd(currentPrice)}
              </text>
            </g>
          ) : null}

          {days.map((day, index) => {
            const barHeight = (day.count / maxCount) * COUNT_HEIGHT;

            return day.count > 0 ? (
              <path
                key={day.day}
                d={roundedTop(
                  x(index) - barWidth / 2,
                  countTop + COUNT_HEIGHT,
                  barWidth,
                  barHeight,
                )}
                className={hover === index ? 'fill-accent' : 'fill-accent/35'}
              />
            ) : null;
          })}
          <line
            x1={AXIS_LEFT}
            x2={width - AXIS_RIGHT}
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
              {hovered.count > 0 ? (
                <circle
                  cx={x(hover)}
                  cy={y(hovered.average)}
                  r={4.5}
                  className="fill-accent stroke-surface-raised"
                  strokeWidth={2}
                />
              ) : null}
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {hovered && hover !== null ? (
        <div
          className="bg-surface-raised border-border pointer-events-none absolute top-0 z-10 rounded-xl border px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover) - 70, 0), Math.max(0, width - 140)),
          }}
        >
          <p className="text-foreground-subtle">{dayLabel(hovered.day)}</p>
          <p className="numeric text-foreground text-sm font-semibold">
            {hovered.count > 0 ? formatUsd(hovered.average) : 'не продавали'}
          </p>
          <p className="text-foreground-muted">
            {hovered.count} {plural(hovered.count, ['продажа', 'продажи', 'продаж'])}
          </p>
        </div>
      ) : null}
    </div>
  );
};

/** A column with a 4px rounded top and a square base. */
const roundedTop = (left: number, base: number, width: number, height: number): string => {
  const radius = Math.min(4, width / 2, height);
  const top = base - height;

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

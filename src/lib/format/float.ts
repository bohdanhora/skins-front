import type { Wear } from './item-name';

export type FloatRange = [number, number];

/** Where each exterior starts and ends on the 0..1 float scale. */
export const WEAR_RANGES: Record<Wear, FloatRange> = {
  FN: [0, 0.07],
  MW: [0.07, 0.15],
  FT: [0.15, 0.38],
  WW: [0.38, 0.45],
  BS: [0.45, 1],
};

/** DMarket float buckets, the same ones its buy orders use. */
const BUCKETS: Record<Wear, FloatRange[]> = {
  FN: [
    [0, 0.01],
    [0.01, 0.02],
    [0.02, 0.03],
    [0.03, 0.04],
    [0.04, 0.05],
    [0.05, 0.06],
    [0.06, 0.07],
  ],
  MW: [
    [0.07, 0.08],
    [0.08, 0.09],
    [0.09, 0.1],
    [0.1, 0.11],
    [0.11, 0.15],
  ],
  FT: [
    [0.15, 0.18],
    [0.18, 0.21],
    [0.21, 0.24],
    [0.24, 0.27],
    [0.27, 0.38],
  ],
  WW: [
    [0.38, 0.39],
    [0.39, 0.4],
    [0.4, 0.41],
    [0.41, 0.42],
    [0.42, 0.45],
  ],
  BS: [
    [0.45, 0.5],
    [0.5, 0.63],
    [0.63, 0.76],
    [0.76, 0.9],
    [0.9, 1],
  ],
};

export const floatPresets = (wear: Wear | null): FloatRange[] => (wear ? BUCKETS[wear] : []);

export const formatFloat = (value: number, digits = 4): string => value.toFixed(digits);

export const formatRange = ([from, to]: FloatRange): string =>
  `${formatFloat(from, 2)}-${formatFloat(to, 2)}`;

/** "0,15" and "0.15" both work while typing. */
export const parseFloatInput = (value: string): number | undefined => {
  const parsed = Number(value.replace(',', '.'));

  return value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : undefined;
};

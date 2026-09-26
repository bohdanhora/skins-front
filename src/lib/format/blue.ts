import type { BlueShare } from '@/lib/api/types';

const percent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

export const formatBlue = (blue: BlueShare): string =>
  `синий ${percent(blue.playside)} / ${percent(blue.backside)}`;

export const blueSidesLabel = (name: string): string =>
  name.includes('AK-47') ? 'верх / магазин' : 'лицевая / обратная сторона';

const CASE_HARDENED = /\| Case Hardened( \(|$)/;

export const isCaseHardened = (name: string): boolean => CASE_HARDENED.test(name);

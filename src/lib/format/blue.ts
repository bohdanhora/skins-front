import type { BlueShare } from '@/lib/api/types';

const percent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

export type BlueSource = 'calculator' | 'csfloat';

const sides = (name: string, source: BlueSource): [string, string] =>
  source === 'calculator' && name.includes('AK-47') ? ['верх', 'магазин'] : ['лицо', 'зад'];

export const formatBlue = (
  name: string,
  blue: BlueShare,
  source: BlueSource = 'calculator',
): string => {
  const [front, back] = sides(name, source);

  return `${front} ${percent(blue.playside)} · ${back} ${percent(blue.backside)}`;
};

export const blueSourceLabel = (source: BlueSource): string =>
  source === 'csfloat' ? 'CSFloat, по модели в игре' : 'по текстуре, как csgoskins.gg и Skinport';

const CASE_HARDENED = /\| Case Hardened( \(|$)/;

export const isCaseHardened = (name: string): boolean => CASE_HARDENED.test(name);

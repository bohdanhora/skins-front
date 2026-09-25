export type Wear = 'FN' | 'MW' | 'FT' | 'WW' | 'BS';

export interface ItemName {
  base: string;
  detail: string;
  wear: Wear | null;
  statTrak: boolean;
  souvenir: boolean;
  phase: string | null;
}

const WEARS: Record<string, Wear> = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS',
};

export const WEAR_LABELS: Record<Wear, string> = {
  FN: 'Прямо с завода',
  MW: 'Немного поношенное',
  FT: 'После полевых испытаний',
  WW: 'Поношенное',
  BS: 'Закалённое в боях',
};

const WEAR_SUFFIX = / \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/;
const PHASE_SUFFIX = / \[([^\]]+)\]$/;

export const parseItemName = (name: string): ItemName => {
  let rest = name;
  let wear: Wear | null = null;
  const phaseMatch = rest.match(PHASE_SUFFIX);
  const phase = phaseMatch?.[1] ?? null;

  if (phaseMatch?.index !== undefined) {
    rest = rest.slice(0, phaseMatch.index);
  }

  const statTrak = rest.includes('StatTrak™');
  const souvenir = rest.startsWith('Souvenir ') && rest.includes(' | ');

  const wearMatch = rest.match(WEAR_SUFFIX);

  if (wearMatch) {
    wear = WEARS[wearMatch[1]];
    rest = rest.slice(0, wearMatch.index);
  }

  rest = rest
    .replace('StatTrak™ ', '')
    .replace(/^Souvenir (?=.* \| )/, '')
    .replace(/^★ /, '');

  const separator = rest.indexOf(' | ');

  if (separator === -1) {
    return { base: rest, detail: '', wear, statTrak, souvenir, phase };
  }

  return {
    base: rest.slice(0, separator),
    detail: rest.slice(separator + 3),
    wear,
    statTrak,
    souvenir,
    phase,
  };
};

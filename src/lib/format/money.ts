const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Cents to "$1,234.56". */
export const formatUsd = (cents: number | null | undefined): string =>
  cents === null || cents === undefined ? '-' : usd.format(cents / 100);

/** Cents to "+$1.20" or "-$0.40". */
export const formatSignedUsd = (cents: number): string =>
  `${cents > 0 ? '+' : cents < 0 ? '-' : ''}${usd.format(Math.abs(cents) / 100)}`;

export const formatPercent = (value: number, signed = false): string => {
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  const sign = signed && rounded > 0 ? '+' : '';

  return `${sign}${rounded.toString().replace('.', ',')}%`;
};

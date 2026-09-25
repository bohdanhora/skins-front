const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Russian plural: plural(5, ['минута', 'минуты', 'минут']). */
export const plural = (count: number, forms: [string, string, string]): string => {
  const tens = Math.abs(count) % 100;
  const units = tens % 10;

  if (tens > 10 && tens < 20) {
    return forms[2];
  }

  if (units === 1) {
    return forms[0];
  }

  return units >= 2 && units <= 4 ? forms[1] : forms[2];
};

export const timeAgo = (iso: string | null, now = Date.now()): string => {
  if (!iso) {
    return 'ещё не обновлялось';
  }

  const elapsed = Math.max(0, now - new Date(iso).getTime());

  if (elapsed < MINUTE_MS) {
    return 'только что';
  }

  if (elapsed < HOUR_MS) {
    const minutes = Math.floor(elapsed / MINUTE_MS);

    return `${minutes} ${plural(minutes, ['минуту', 'минуты', 'минут'])} назад`;
  }

  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);

    return `${hours} ${plural(hours, ['час', 'часа', 'часов'])} назад`;
  }

  const days = Math.floor(elapsed / DAY_MS);

  return `${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
};

export interface FloatPoint {
  float: number;
  price: number;
}

const MIN_POINTS = 8;

const nonIncreasing = (values: number[]): number[] => {
  const blocks: { sum: number; size: number }[] = [];

  for (const value of values) {
    blocks.push({ sum: value, size: 1 });

    while (blocks.length > 1) {
      const last = blocks[blocks.length - 1]!;
      const previous = blocks[blocks.length - 2]!;

      if (previous.sum / previous.size >= last.sum / last.size) break;

      previous.sum += last.sum;
      previous.size += last.size;
      blocks.pop();
    }
  }

  return blocks.flatMap((block) => Array<number>(block.size).fill(block.sum / block.size));
};

export const typicalPrices = <T extends FloatPoint>(points: T[]): Map<T, number> => {
  const ordered = points
    .filter((point) => point.price > 0)
    .sort((left, right) => left.float - right.float || right.price - left.price);

  if (ordered.length < MIN_POINTS) return new Map();

  const fitted = nonIncreasing(ordered.map((point) => Math.log(point.price)));

  return new Map(ordered.map((point, index) => [point, Math.round(Math.exp(fitted[index]!))]));
};

export interface ValuedListing<T> {
  listing: T;
  typical: number | null;
  discount: number;
}

export const rankByValue = <T extends { float: number | null; price: number }>(
  listings: T[],
): ValuedListing<T>[] => {
  const typical = typicalPrices(
    listings.flatMap((listing) =>
      listing.float !== null ? [{ listing, float: listing.float, price: listing.price }] : [],
    ),
  );
  const typicalOf = new Map([...typical].map(([point, price]) => [point.listing, price]));

  return listings
    .map((listing) => {
      const usual = typicalOf.get(listing) ?? null;

      return {
        listing,
        typical: usual,
        discount: usual ? (usual - listing.price) / usual : -Infinity,
      };
    })
    .sort(
      (left, right) => right.discount - left.discount || left.listing.price - right.listing.price,
    );
};

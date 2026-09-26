'use client';

import { useCallback, useState, type SetStateAction } from 'react';

const memory = new Map<string, unknown>();

export const rememberValue = <T>(key: string, value: T): void => {
  memory.set(key, value);
};

export const recallValue = <T>(key: string): T | undefined => memory.get(key) as T | undefined;

export const useRememberedState = <T>(
  key: string,
  initial: T | (() => T),
): [T, (next: SetStateAction<T>) => void] => {
  const [value, setValue] = useState<T>(() => {
    if (memory.has(key)) {
      return memory.get(key) as T;
    }

    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  const update = useCallback(
    (next: SetStateAction<T>) =>
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (previous: T) => T)(current) : next;

        memory.set(key, resolved);

        return resolved;
      }),
    [key],
  );

  return [value, update];
};

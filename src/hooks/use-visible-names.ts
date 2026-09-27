'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Observe = (element: HTMLElement | null) => () => void;

export const useVisibleNames = () => {
  const [visible, setVisible] = useState<string[]>([]);
  const shown = useRef(new Map<string, string>());
  const owners = useRef(new WeakMap<Element, { key: string; name: string }>());
  const observers = useRef(new Map<string, Observe>());
  const observer = useRef<IntersectionObserver | null>(null);

  const publish = useCallback(() => {
    const next = [...new Set(shown.current.values())].sort();

    setVisible((current) => (current.join('\n') === next.join('\n') ? current : next));
  }, []);

  const watcher = useCallback(() => {
    observer.current ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const owner = owners.current.get(entry.target);

          if (!owner) continue;
          if (entry.isIntersecting) shown.current.set(owner.key, owner.name);
          else shown.current.delete(owner.key);
        }

        publish();
      },
      { rootMargin: '150px 0px' },
    );

    return observer.current;
  }, [publish]);

  useEffect(() => () => observer.current?.disconnect(), []);

  const observe = useCallback(
    (name: string, key: string = name): Observe => {
      const existing = observers.current.get(key);

      if (existing) return existing;

      const callback: Observe = (element) => {
        if (!element) return () => undefined;

        owners.current.set(element, { key, name });
        watcher().observe(element);

        return () => {
          watcher().unobserve(element);
          shown.current.delete(key);
          publish();
        };
      };

      observers.current.set(key, callback);

      return callback;
    },
    [publish, watcher],
  );

  return { observe, visible };
};

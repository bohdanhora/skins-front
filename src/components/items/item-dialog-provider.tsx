'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

import { ItemDialog } from './item-dialog';

const OpenItemContext = createContext<(name: string) => void>(() => undefined);

export const useOpenItem = () => useContext(OpenItemContext);

export const ItemDialogProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openItem = useCallback((next: string) => {
    setName(next);
    setOpen(true);
  }, []);

  return (
    <OpenItemContext.Provider value={openItem}>
      {children}
      <ItemDialog name={name} open={open} onOpenChange={setOpen} />
    </OpenItemContext.Provider>
  );
};

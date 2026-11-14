import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface EmergencyModalValue {
  visible: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<EmergencyModalValue | null>(null);

export function EmergencyModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ visible, open, close }), [visible, open, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEmergencyModal(): EmergencyModalValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEmergencyModal must be used inside <EmergencyModalProvider>');
  return ctx;
}

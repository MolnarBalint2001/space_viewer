/* eslint-disable react-refresh/only-export-components */
// src/contexts/SidebarContext.tsx
import React from "react";

type SidebarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
  openSidebar: () => void;
  close: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  persistKey?: string; // localStorage kulcs (opcionális)
};

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultOpen = false,
  persistKey = "sidebar-open",
}) => {
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(persistKey);
      if (saved === "true" || saved === "false") return saved === "true";
    }
    return defaultOpen;
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(persistKey, String(open));
    } catch {
      /* noop */
    }
  }, [open, persistKey]);

  const toggle = React.useCallback(() => setOpen((v) => !v), []);
  const openSidebar = React.useCallback(() => setOpen(true), []);
  const close = React.useCallback(() => setOpen(false), []);

  const value = React.useMemo(
    () => ({ open, setOpen, toggle, openSidebar, close }),
    [open, toggle, openSidebar, close]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar csak SidebarProvider-en belül használható");
  return ctx;
};

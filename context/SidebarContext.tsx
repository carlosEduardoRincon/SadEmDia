import React, { createContext, useContext, useState, useCallback } from 'react';

type SidebarContextType = {
  expanded: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((e) => !e), []);
  return (
    <SidebarContext.Provider value={{ expanded, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

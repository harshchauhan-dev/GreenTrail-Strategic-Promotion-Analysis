"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  aiDrawerOpen: boolean;
  setAiDrawerOpen: (open: boolean) => void;
  toggleAiDrawer: () => void;
  activeAiPrompt?: string;
  triggerAiPrompt: (prompt: string) => void;
}

const AppContext = createContext<AppContextType>({
  aiDrawerOpen: false,
  setAiDrawerOpen: () => {},
  toggleAiDrawer: () => {},
  activeAiPrompt: undefined,
  triggerAiPrompt: () => {},
});

export const useApp = () => useContext(AppContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [activeAiPrompt, setActiveAiPrompt] = useState<string | undefined>();

  const toggleAiDrawer = () => setAiDrawerOpen((prev) => !prev);
  const triggerAiPrompt = (prompt: string) => {
    setActiveAiPrompt(prompt);
    setAiDrawerOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        aiDrawerOpen,
        setAiDrawerOpen,
        toggleAiDrawer,
        activeAiPrompt,
        triggerAiPrompt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

import React, { createContext, useContext } from "react";

const ThemeContext = createContext({ theme: "light" as const, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

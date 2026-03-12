/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "auto" | "day" | "night";
type EffectiveTheme = "day" | "night";

type ThemeContextType = {
  mode: ThemeMode;
  theme: EffectiveTheme;
  cycleMode: () => void;
  setMode: (next: ThemeMode) => void;
};

const STORAGE_KEY = "library.theme.mode";
const ThemeContext = createContext<ThemeContextType | null>(null);

function resolveTheme(mode: ThemeMode, now: Date): EffectiveTheme {
  if (mode === "day") return "day";
  if (mode === "night") return "night";
  const hour = now.getHours();
  return hour >= 18 || hour <= 6 ? "night" : "day";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "day" || saved === "night" || saved === "auto") return saved;
    return "auto";
  });
  const [now, setNow] = useState(() => new Date());

  const theme = useMemo(() => resolveTheme(mode, now), [mode, now]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const cycleMode = () => {
    setMode((prev) => {
      if (prev === "auto") return "night";
      if (prev === "night") return "day";
      return "auto";
    });
  };

  const value = useMemo(() => ({ mode, theme, cycleMode, setMode }), [mode, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}


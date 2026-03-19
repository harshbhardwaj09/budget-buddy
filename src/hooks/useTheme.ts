"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "budgetBuddy:theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  const setThemeAndStore = useCallback(
    (next: Theme | ((prev: Theme) => Theme)) => {
      setTheme((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        applyTheme(resolved);
        window.localStorage.setItem(STORAGE_KEY, resolved);
        return resolved;
      });
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setThemeAndStore((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setThemeAndStore]);

  const isDark = theme === "dark";

  return useMemo(
    () => ({ theme, isDark, setTheme: setThemeAndStore, toggleTheme }),
    [theme, isDark, setThemeAndStore, toggleTheme]
  );
}

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";
type Ctx = { theme: Theme; resolved: Resolved; setTheme: (t: Theme) => void; toggle: () => void };

const ThemeCtx = createContext<Ctx | null>(null);

function getSystem(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(resolved: Resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("uniin-theme") as Theme)) || "light";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const r: Resolved = theme === "system" ? getSystem() : theme;
    setResolved(r);
    apply(r);
    try { localStorage.setItem("uniin-theme", theme); } catch {}

    if (theme === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => { const next = getSystem(); setResolved(next); apply(next); };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState(t => (t === "dark" ? "light" : t === "light" ? "system" : "dark"));

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) return { theme: "light" as Theme, resolved: "light" as Resolved, setTheme: () => {}, toggle: () => {} };
  return c;
}

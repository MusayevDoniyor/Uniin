import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center size-9 rounded-lg border border-border bg-surface hover:bg-surface-2 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun className="size-4 text-gold" /> : <Moon className="size-4 text-info" />}
    </button>
  );
}

import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const DISMISS_KEY = "uniin:dismiss-completion";

function computeCompletion(p: any): number {
  if (!p) return 0;
  const checks = [
    !!p.full_name, !!p.avatar_url, !!p.bio, !!p.city, !!p.intended_major,
    !!(p.target_countries?.length), !!(p.extracurriculars?.length),
    !!p.grade, !!p.username, !!p.country,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function ProfileCompletionBanner() {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const pct = computeCompletion(profile);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!profile || pct >= 80 || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="surface-card p-3 border-primary/30 bg-primary/5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="text-xs font-semibold">
            Profilingiz {pct}% to'ldirilgan — yaxshiroq tavsiyalar uchun yakunlang
          </div>
          <Link to="/onboarding" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
            Finish profile →
          </Link>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  );
}

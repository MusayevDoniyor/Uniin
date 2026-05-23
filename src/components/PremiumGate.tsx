import { Link } from "@tanstack/react-router";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function PremiumGate({ feature, children }: { feature: string; children?: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.is_premium) return <>{children}</>;
  return (
    <div className="surface-card p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 0%, var(--gold), transparent 60%)" }} />
      <div className="relative">
        <div className="size-14 mx-auto rounded-full bg-gold/15 text-gold flex items-center justify-center mb-3">
          <Crown className="size-7" />
        </div>
        <h3 className="text-lg font-bold">Premium feature</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          {feature} is part of Uniin Premium. Upgrade to unlock advanced tools, deeper insights and unlimited access.
        </p>
        <Link to="/premium">
          <Button className="mt-4 bg-gold text-gold-foreground hover:bg-gold/90">
            <Crown className="size-4 mr-1.5" /> Upgrade to Premium
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function PremiumLock({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.is_premium) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none blur-sm select-none opacity-60">{children}</div>
      <Link to="/premium" className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-lg">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-gold-foreground text-sm font-semibold shadow-lg">
          <Lock className="size-4" /> Upgrade to view
        </div>
      </Link>
    </div>
  );
}

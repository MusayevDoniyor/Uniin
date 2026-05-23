import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Eye, BarChart3, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/premium")({
  component: () => <RequireAuth><AppShell><Premium /></AppShell></RequireAuth>,
});

const FREE = [
  "Up to 3 AI conversations / day",
  "Basic profile",
  "Browse marketplace & feed",
  "Join up to 5 groups",
];
const PRO = [
  "Unlimited AI Advisor (all 3 modes incl. Essay Coach)",
  "See who viewed your profile (last 90 days)",
  "Profile analytics & rank insights",
  "Premium badge on your profile",
  "Priority support",
  "Early access to new features",
];

function Premium() {
  const { user, profile, refresh } = useAuth() as any;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const activate = async () => {
    if (!user) return;
    setBusy(true);
    const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
    await supabase.from("subscriptions").upsert({
      user_id: user.id, plan: "premium" as any, status: "active" as any,
      current_period_end: periodEnd.toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" } as any);
    await supabase.from("profiles").update({ is_premium: true }).eq("user_id", user.id);
    setBusy(false);
    toast.success("Welcome to Uniin Premium! 🎉");
    if (refresh) await refresh();
    navigate({ to: "/feed" });
  };

  const isPremium = !!profile?.is_premium;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="size-16 mx-auto rounded-2xl bg-gold/15 text-gold flex items-center justify-center mb-4">
          <Crown className="size-8" />
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tight">Uniin Premium</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Unlock the full Uniin experience — built for serious applicants targeting top universities.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="surface-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Free</div>
          <div className="text-3xl font-bold mt-1">$0<span className="text-base font-normal text-muted-foreground">/month</span></div>
          <ul className="space-y-2.5 mt-5">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2 text-sm"><Check className="size-4 text-muted-foreground shrink-0 mt-0.5" /> {f}</li>
            ))}
          </ul>
          <Button variant="outline" disabled className="w-full mt-6">Current plan</Button>
        </div>

        <div className="surface-card p-6 relative border-gold/40 gu-accent-border" style={{ background: "linear-gradient(180deg, oklch(var(--card)) 0%, color-mix(in oklab, var(--gold) 6%, oklch(var(--card))) 100%)" }}>
          <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gold text-gold-foreground text-[10px] font-bold uppercase tracking-wider">Most popular</div>
          <div className="text-xs uppercase tracking-wide text-gold flex items-center gap-1.5"><Crown className="size-3.5" /> Premium</div>
          <div className="text-3xl font-bold mt-1">$9<span className="text-base font-normal text-muted-foreground">/month</span></div>
          <ul className="space-y-2.5 mt-5">
            {PRO.map((f) => (
              <li key={f} className="flex gap-2 text-sm"><Check className="size-4 text-gold shrink-0 mt-0.5" /> {f}</li>
            ))}
          </ul>
          {isPremium ? (
            <Button disabled className="w-full mt-6 bg-gold text-gold-foreground"><Crown className="size-4 mr-1.5" /> You're Premium</Button>
          ) : (
            <Button onClick={activate} disabled={busy} className="w-full mt-6 bg-gold text-gold-foreground hover:bg-gold/90">
              {busy ? "Activating..." : "Start free trial"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        {[
          { i: Sparkles, t: "Essay Coach AI", d: "Unlimited rewrites & feedback" },
          { i: Eye, t: "Who viewed you", d: "Track profile visitors" },
          { i: BarChart3, t: "Analytics", d: "Rank & engagement insights" },
          { i: Shield, t: "Verified badge", d: "Premium gold badge" },
        ].map((x) => (
          <div key={x.t} className="surface-card p-4">
            <x.i className="size-5 text-gold mb-2" />
            <div className="font-semibold text-sm">{x.t}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{x.d}</div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">Note: Billing is in test mode. You can cancel anytime in settings.</p>
    </div>
  );
}

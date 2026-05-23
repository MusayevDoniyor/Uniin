import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const handleTelegram = async () => {
    toast.info("Telegram login coming soon — use email for now.");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at top, oklch(0.30 0.10 265 / 0.4), oklch(0.18 0.03 260) 70%)" }}>
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle at 25% 30%, oklch(0.55 0.18 27 / 0.4), transparent 50%)" }} />

      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="surface-card p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to continue your journey.</p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1.5" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="mt-1.5" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-accent" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <><Mail className="size-4 mr-2" /> Sign in with Email</>}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
          </div>

          <Button onClick={handleTelegram} variant="outline" className="w-full border-info/40 hover:bg-info/10">
            <svg viewBox="0 0 24 24" className="size-4 mr-2 fill-info"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005-.001l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.643.135-.953l11.566-4.458c.538-.196 1.006.128.832.939z"/></svg>
              Continue with Telegram
          </Button>

          <p className="text-center text-sm mt-6 text-muted-foreground">
            New to Uniin? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

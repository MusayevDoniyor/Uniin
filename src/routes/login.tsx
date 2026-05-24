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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
    // On success, browser will redirect — no need to setGoogleLoading(false)
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

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-border hover:bg-surface-2 gap-3 h-11 mb-6"
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-5 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
          </div>

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

          <p className="text-center text-sm mt-6 text-muted-foreground">
            New to Uniin? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<"gu" | "prep" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return toast.error("Pick a user type");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Update profile with type (profile auto-created by trigger)
    if (data.user) {
      await supabase.from("profiles").update({ user_type: userType, full_name: fullName }).eq("user_id", data.user.id);
    }
    setLoading(false);
    toast.success("Account created!");
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at top, oklch(0.30 0.10 265 / 0.4), oklch(0.18 0.03 260) 70%)" }}>
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>

        <div className="surface-card p-8">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold mb-1">Join Uniin</h1>
              <p className="text-sm text-muted-foreground mb-6">First — what describes you?</p>

              <div className="space-y-3">
                <button onClick={() => setUserType("gu")} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${userType === "gu" ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"}`}>
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="size-5 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">G.U. Student <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Got into University</span></div>
                      <div className="text-sm text-muted-foreground mt-1">You've been accepted into a university abroad. Mentor others, sell resources.</div>
                    </div>
                  </div>
                </button>

                <button onClick={() => setUserType("prep")} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${userType === "prep" ? "border-info bg-info/10" : "border-border hover:border-info/50"}`}>
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                      <BookOpen className="size-5 text-info" />
                    </div>
                    <div>
                      <div className="font-semibold">Prep Student</div>
                      <div className="text-sm text-muted-foreground mt-1">You're preparing to apply. Connect with mentors, use the AI advisor.</div>
                    </div>
                  </div>
                </button>
              </div>

              <Button onClick={() => userType && setStep(2)} disabled={!userType} className="w-full mt-6 bg-primary hover:bg-accent">Continue</Button>

              <p className="text-center text-sm mt-6 text-muted-foreground">
                Have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground mb-6">As a <span className={userType === "gu" ? "text-gold font-semibold" : "text-info font-semibold"}>{userType === "gu" ? "G.U. Student" : "Prep Student"}</span></p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" placeholder="At least 6 characters" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-accent" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

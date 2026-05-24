import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength } from "@/components/PasswordStrength";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen, Mail, CheckCircle2 } from "lucide-react";
import { isPasswordStrong } from "@/lib/password";


export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<"gu" | "prep" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return toast.error("Pick a user type");
    if (!isPasswordStrong(password)) return toast.error("Parol yetarli kuchli emas");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({ user_type: userType, full_name: fullName })
        .eq("user_id", data.user.id);
    }
    setLoading(false);

    // If session is null, email confirmation is required
    if (!data.session) {
      setNeedsEmailConfirm(true);
      setStep(3);
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/onboarding" });
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse at top, oklch(0.30 0.10 265 / 0.4), oklch(0.18 0.03 260) 70%)",
      }}
    >
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="surface-card p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Join Uniin</h1>
              <p className="text-sm text-muted-foreground mb-6">First — what describes you?</p>

              <div className="space-y-3">
                <button
                  onClick={() => setUserType("gu")}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${userType === "gu" ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="size-5 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        G.U. Student{" "}
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                          Got into University
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        You've been accepted into a university abroad. Mentor others, sell
                        resources.
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserType("prep")}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${userType === "prep" ? "border-info bg-info/10" : "border-border hover:border-info/50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                      <BookOpen className="size-5 text-info" />
                    </div>
                    <div>
                      <div className="font-semibold">Prep Student</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        You're preparing to apply. Connect with mentors, use the AI advisor.
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                onClick={() => userType && setStep(2)}
                disabled={!userType}
                className="w-full mt-6 bg-primary hover:bg-accent"
              >
                Continue
              </Button>


              <p className="text-center text-sm mt-4 text-muted-foreground">
                Have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground mb-6">
                As a{" "}
                <span
                  className={
                    userType === "gu" ? "text-gold font-semibold" : "text-info font-semibold"
                  }
                >
                  {userType === "gu" ? "G.U. Student" : "Prep Student"}
                </span>
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    placeholder="8+ ta belgi, katta/kichik harf, raqam, maxsus belgi"
                  />
                  <PasswordStrength password={password} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-accent"
                    disabled={loading || !isPasswordStrong(password)}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 3 && needsEmailConfirm && (
            <div className="text-center space-y-4 py-4">
              <div className="size-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Mail className="size-8" />
              </div>
              <h1 className="text-2xl font-bold">Pochtangizni tekshiring</h1>
              <p className="text-sm text-muted-foreground">
                Biz <span className="font-semibold text-foreground">{email}</span> manziliga
                tasdiqlash xati yubordik. Spam papkasini ham tekshirib chiqing.
              </p>
              <div className="bg-info/10 border border-info/30 rounded-lg p-3 text-left text-xs text-info flex gap-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>
                  Xatdagi havolani bosing — keyin tizimga kirib onboarding'ni davom ettiring.
                </span>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Email almashtirish
                </Button>
                <Button asChild className="bg-primary hover:bg-accent">
                  <Link to="/login">Login sahifasi</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

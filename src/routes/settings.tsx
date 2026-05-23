import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { PhoneInput, isValidUzPhone } from "@/components/PhoneInput";
import { ScoreInput } from "@/components/ScoreInput";
import { WordCountTextarea } from "@/components/WordCountTextarea";
import { CertificateEditor, type Certification } from "@/components/CertificateEditor";
import { UZ_CITIES } from "@/lib/data/uzbekistan";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Upload, User, GraduationCap, Award, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => <RequireAuth><Settings /></RequireAuth>,
});

function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setF({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        city: profile.city || "",
        phone: profile.phone || "",
        school_name: profile.school_name || "",
        bio: profile.bio || "",
        gpa: profile.gpa?.toString() || "",
        gpa_scale: profile.gpa_scale || 4,
        gpa_na: profile.gpa == null,
        sat: profile.sat?.toString() || "",
        sat_na: profile.sat == null,
        ielts: profile.ielts?.toString() || "",
        ielts_na: profile.ielts == null,
        toefl: profile.toefl?.toString() || "",
        toefl_na: profile.toefl == null,
        intended_major: profile.intended_major || "",
        certifications: (profile.certifications as Certification[]) || [],
      });
    }
  }, [profile]);

  if (!profile || !f) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;

  const update = (patch: any) => setF((p: any) => ({ ...p, ...patch }));

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    update({ avatar_url: publicUrl });
  };

  const save = async () => {
    if (f.phone && !isValidUzPhone(f.phone)) return toast.error("Invalid phone");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, avatar_url: f.avatar_url || null,
      city: f.city, phone: f.phone, school_name: f.school_name, bio: f.bio,
      gpa: f.gpa_na || !f.gpa ? null : parseFloat(f.gpa),
      gpa_scale: f.gpa_scale,
      sat: f.sat_na || !f.sat ? null : parseInt(f.sat),
      ielts: f.ielts_na || !f.ielts ? null : parseFloat(f.ielts),
      toefl: f.toefl_na || !f.toefl ? null : parseInt(f.toefl),
      intended_major: f.intended_major || null,
      certifications: f.certifications as any,
      theme_preference: theme,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Settings saved");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="size-5" /> Settings</h1>
        <Button onClick={save} disabled={saving} className="bg-primary hover:bg-accent">
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile"><User className="size-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="academic"><GraduationCap className="size-4 mr-1.5" />Academic</TabsTrigger>
          <TabsTrigger value="certs"><Award className="size-4 mr-1.5" />Certifications</TabsTrigger>
          <TabsTrigger value="appearance"><Sun className="size-4 mr-1.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Section title="Photo">
            <div className="flex items-center gap-4">
              <Avatar className="size-20"><AvatarImage src={f.avatar_url} /><AvatarFallback>{f.full_name?.[0]}</AvatarFallback></Avatar>
              <Label className="cursor-pointer">
                <span className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-sm hover:bg-surface"><Upload className="size-4 mr-1.5" />Change photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </Label>
            </div>
          </Section>

          <Section title="Basic info">
            <div className="space-y-3">
              <div><Label>Full name</Label><Input maxLength={80} value={f.full_name} onChange={e => update({ full_name: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Select value={f.city} onValueChange={v => update({ city: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick" /></SelectTrigger>
                    <SelectContent className="max-h-72">{UZ_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Phone</Label><PhoneInput value={f.phone} onChange={v => update({ phone: v })} className="mt-1.5" /></div>
              </div>
              <div><Label>School</Label><Input maxLength={100} value={f.school_name} onChange={e => update({ school_name: e.target.value })} className="mt-1.5" /></div>
              <WordCountTextarea label="Bio" value={f.bio} onChange={v => update({ bio: v })} maxWords={80} rows={4} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4 mt-4">
          <Section title="Test scores">
            <p className="text-xs text-muted-foreground mb-3">Toggle "Don't have" for anything you haven't taken yet — you can add it later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <ScoreInput label="GPA" value={f.gpa} onChange={v => update({ gpa: v })}
                    min={0} max={f.gpa_scale} step={0.01} placeholder={`max ${f.gpa_scale}`}
                    notTaken={f.gpa_na} onToggleNotTaken={v => update({ gpa_na: v })} suffix={`/${f.gpa_scale}`} />
                </div>
                <Select value={String(f.gpa_scale)} onValueChange={v => update({ gpa_scale: parseFloat(v) })}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="4">/4.0</SelectItem><SelectItem value="5">/5.0</SelectItem></SelectContent>
                </Select>
              </div>
              <ScoreInput label="SAT" value={f.sat} onChange={v => update({ sat: v })}
                min={400} max={1600} placeholder="1500" notTaken={f.sat_na} onToggleNotTaken={v => update({ sat_na: v })} />
              <ScoreInput label="IELTS" value={f.ielts} onChange={v => update({ ielts: v })}
                min={0} max={9} step={0.5} placeholder="7.5" suffix="/9" notTaken={f.ielts_na} onToggleNotTaken={v => update({ ielts_na: v })} />
              <ScoreInput label="TOEFL" value={f.toefl} onChange={v => update({ toefl: v })}
                min={0} max={120} placeholder="105" suffix="/120" notTaken={f.toefl_na} onToggleNotTaken={v => update({ toefl_na: v })} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="certs" className="space-y-4 mt-4">
          <Section title="Certifications">
            <p className="text-xs text-muted-foreground mb-3">LinkedIn-style. Add credentials with name, issuer, and date.</p>
            <CertificateEditor value={f.certifications} onChange={v => update({ certifications: v })} />
          </Section>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Section title="Theme">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTheme("light")} className={`p-4 rounded-lg border-2 text-left transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <Sun className="size-5 text-gold mb-2" />
                <div className="font-semibold">Light</div>
                <div className="text-xs text-muted-foreground">Crisp & bright</div>
              </button>
              <button onClick={() => setTheme("dark")} className={`p-4 rounded-lg border-2 text-left transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <Moon className="size-5 text-info mb-2" />
                <div className="font-semibold">Dark</div>
                <div className="text-xs text-muted-foreground">Default, easy on eyes</div>
              </button>
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      <div className="mt-8 surface-card p-5 border-destructive/30">
        <h3 className="font-semibold text-destructive">Sign out</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">You'll be returned to the login screen.</p>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="surface-card p-5">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

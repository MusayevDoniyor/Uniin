import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { PhoneInput, isValidUzPhone } from "@/components/PhoneInput";
import { ScoreInput } from "@/components/ScoreInput";
import { WordCountTextarea } from "@/components/WordCountTextarea";
import { CertificateEditor, type Certification } from "@/components/CertificateEditor";
import { AvatarPicker } from "@/components/AvatarPicker";
import { CustomStatsEditor, type CustomStat } from "@/components/CustomStatsEditor";
import { ExtracurricularUploader, type ECItem } from "@/components/ExtracurricularUploader";
import { UZ_CITIES } from "@/lib/data/uzbekistan";
import { toast } from "sonner";
import {
  Loader2, Sun, Moon, Monitor, Upload, User, GraduationCap, Award,
  Settings as SettingsIcon, ImageIcon, Trash2, Pencil, Activity,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => <RequireAuth><Settings /></RequireAuth>,
});

function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setF({
        full_name: profile.full_name || "",
        username: (profile as any).username || "",
        avatar_url: profile.avatar_url || "",
        cover_image_url: (profile as any).cover_image_url || "",
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
        custom_stats: ((profile as any).custom_stats as CustomStat[]) || [],
        extracurricular_items: ((profile as any).extracurricular_items as ECItem[]) || [],
      });
    }
  }, [profile]);

  if (!profile || !f) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;

  const update = (patch: any) => setF((p: any) => ({ ...p, ...patch }));

  const uploadFile = async (bucket: "avatars" | "covers", file: File) => {
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFile("avatars", file);
      update({ avatar_url: url });
      toast.success("Photo updated — don't forget to save");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile("covers", file);
      update({ cover_image_url: url });
      toast.success("Cover updated — don't forget to save");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    if (f.phone && !isValidUzPhone(f.phone)) return toast.error("Invalid phone");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name,
      avatar_url: f.avatar_url || null,
      cover_image_url: f.cover_image_url || null,
      city: f.city, phone: f.phone, school_name: f.school_name, bio: f.bio,
      gpa: f.gpa_na || !f.gpa ? null : parseFloat(f.gpa),
      gpa_scale: f.gpa_scale,
      sat: f.sat_na || !f.sat ? null : parseInt(f.sat),
      ielts: f.ielts_na || !f.ielts ? null : parseFloat(f.ielts),
      toefl: f.toefl_na || !f.toefl ? null : parseInt(f.toefl),
      intended_major: f.intended_major || null,
      certifications: f.certifications as any,
      custom_stats: f.custom_stats as any,
      extracurricular_items: f.extracurricular_items as any,
      extracurriculars: (f.extracurricular_items as ECItem[]).map((e: ECItem) => e.title),
      theme_preference: theme,
    } as any).eq("user_id", user.id);
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
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="profile"><User className="size-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="academic"><GraduationCap className="size-4 mr-1.5" />Academic</TabsTrigger>
          <TabsTrigger value="extras"><Activity className="size-4 mr-1.5" />Activities</TabsTrigger>
          <TabsTrigger value="certs"><Award className="size-4 mr-1.5" />Certifications</TabsTrigger>
          <TabsTrigger value="appearance"><Sun className="size-4 mr-1.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Section title="Cover photo">
            <div className="relative h-40 rounded-lg overflow-hidden border border-border bg-surface-2"
              style={f.cover_image_url ? { backgroundImage: `url(${f.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.40 0.15 27))" }}>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Label className="cursor-pointer">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-background/80 backdrop-blur text-xs font-medium hover:bg-background">
                    {uploadingCover ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Pencil className="size-3.5 mr-1.5" />}
                    {f.cover_image_url ? "Change" : "Upload cover"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
                </Label>
                {f.cover_image_url && (
                  <button type="button" onClick={() => update({ cover_image_url: "" })}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-background/80 backdrop-blur text-xs font-medium hover:bg-destructive/20 text-destructive">
                    <Trash2 className="size-3.5 mr-1.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </Section>

          <Section title="Profile photo">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-24 border-2 border-border">
                <AvatarImage src={f.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{f.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <Label className="cursor-pointer">
                  <span className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-sm hover:bg-surface">
                    {uploadingAvatar ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
                    {f.avatar_url ? "Change photo" : "Upload photo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                </Label>
                <AvatarPicker onPick={(url) => { update({ avatar_url: url }); toast.success("Avatar selected"); }} />
                {f.avatar_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => update({ avatar_url: "" })}
                    className="text-destructive border-destructive/40 hover:bg-destructive/10">
                    <Trash2 className="size-4 mr-1.5" /> Delete
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">JPG or PNG, up to ~5MB. Or pick one from our default collection.</p>
          </Section>

          <Section title="Basic info">
            <div className="space-y-3">
              <div><Label>Full name</Label><Input maxLength={80} value={f.full_name} onChange={e => update({ full_name: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Region</Label>
                  <Select value={f.city} onValueChange={v => update({ city: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick a region" /></SelectTrigger>
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
            <p className="text-xs text-muted-foreground mb-4">Toggle "Don't have" for anything you haven't taken yet — you can always add it later.</p>

            {/* GPA — full row */}
            <div className="surface-card bg-surface-2/40 p-4 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <ScoreInput label="GPA" value={f.gpa} onChange={v => update({ gpa: v })}
                    min={0} max={f.gpa_scale} step={0.01} placeholder={`max ${f.gpa_scale}`}
                    notTaken={f.gpa_na} onToggleNotTaken={v => update({ gpa_na: v })} suffix={`/${f.gpa_scale}`} />
                </div>
                <div className="sm:w-32">
                  <Label className="text-xs">Scale</Label>
                  <Select value={String(f.gpa_scale)} onValueChange={v => update({ gpa_scale: parseFloat(v) })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="4">/4.0</SelectItem><SelectItem value="5">/5.0</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SAT, IELTS, TOEFL — one per row on mobile, 3 per row on desktop with spacing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="surface-card bg-surface-2/40 p-4">
                <ScoreInput label="SAT" value={f.sat} onChange={v => update({ sat: v })}
                  min={400} max={1600} placeholder="1500" notTaken={f.sat_na} onToggleNotTaken={v => update({ sat_na: v })} suffix="/1600" />
              </div>
              <div className="surface-card bg-surface-2/40 p-4">
                <ScoreInput label="IELTS" value={f.ielts} onChange={v => update({ ielts: v })}
                  min={0} max={9} step={0.5} placeholder="7.5" suffix="/9" notTaken={f.ielts_na} onToggleNotTaken={v => update({ ielts_na: v })} />
              </div>
              <div className="surface-card bg-surface-2/40 p-4">
                <ScoreInput label="TOEFL" value={f.toefl} onChange={v => update({ toefl: v })}
                  min={0} max={120} placeholder="105" suffix="/120" notTaken={f.toefl_na} onToggleNotTaken={v => update({ toefl_na: v })} />
              </div>
            </div>
          </Section>

          <Section title="Boshqa imtihonlar / ballar">
            <CustomStatsEditor value={f.custom_stats} onChange={(v) => update({ custom_stats: v })} />
          </Section>
        </TabsContent>

        <TabsContent value="extras" className="space-y-4 mt-4">
          <Section title="Faoliyatlar (Extracurriculars)">
            <p className="text-xs text-muted-foreground mb-3">O'zingiz qilgan ishlarni kategoriya bo'yicha yuklang. Fayllar (rasm/PDF) va havolalar qo'shsa bo'ladi.</p>
            <ExtracurricularUploader value={f.extracurricular_items} onChange={(v) => update({ extracurricular_items: v })} />
          </Section>
        </TabsContent>

        <TabsContent value="certs" className="space-y-4 mt-4">
          <Section title="Certifications">
            <p className="text-xs text-muted-foreground mb-3">LinkedIn-style. Add credentials with name, issuer, date, link, and (optional) certificate image.</p>
            <CertificateEditor value={f.certifications} onChange={v => update({ certifications: v })} />
          </Section>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Section title="Theme">
            <div className="grid grid-cols-3 gap-3">
              <ThemeCard active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="size-5 text-gold" />} label="Light" sub="Crisp & bright" />
              <ThemeCard active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="size-5 text-info" />} label="Dark" sub="Easy on eyes" />
              <ThemeCard active={theme === "system"} onClick={() => setTheme("system")} icon={<Monitor className="size-5 text-primary" />} label="System" sub="Match OS" />
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

function ThemeCard({ active, onClick, icon, label, sub }: any) {
  return (
    <button onClick={onClick} type="button"
      className={`p-4 rounded-lg border-2 text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <div className="mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}

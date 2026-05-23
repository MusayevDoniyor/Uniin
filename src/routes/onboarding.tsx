import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Search } from "lucide-react";
import { CITIES, COUNTRIES, MAJORS, EXTRACURRICULARS, UNIVERSITIES } from "@/lib/data/universities";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Form = {
  full_name: string; avatar_url: string; city: string; phone: string;
  grade: string; target_year: number | null;
  gpa: string; gpa_scale: number; sat: string; ielts: string; toefl: string; school_name: string;
  extracurriculars: string[]; interests: string[]; bio: string; certificates: string[];
  target_countries: string[]; dream_universities: string[]; intended_major: string;
  gu_unis: { university_name: string; country: string; qs_rank: number; year_admitted: number | null; degree_type: string; major: string }[];
};

function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    full_name: profile?.full_name || "", avatar_url: "", city: "", phone: "",
    grade: "", target_year: null, gpa: "", gpa_scale: 4.0, sat: "", ielts: "", toefl: "", school_name: "",
    extracurriculars: [], interests: [], bio: "", certificates: [],
    target_countries: [], dream_universities: [], intended_major: "",
    gu_unis: [],
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (profile?.onboarding_complete) return <Navigate to="/feed" />;
  if (!profile?.user_type) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Logo size="lg" />
        <p className="mt-6 text-muted-foreground">Pick your user type first.</p>
        <PickType onPicked={refreshProfile} userId={user.id} />
      </div>
    );
  }

  const isGU = profile.user_type === "gu";
  const totalSteps = isGU ? 4 : 5;
  const update = (patch: Partial<Form>) => setForm(f => ({ ...f, ...patch }));

  const toggleArr = (key: keyof Form, val: string) => {
    const arr = form[key] as string[];
    update({ [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] } as Partial<Form>);
  };

  const uploadFile = async (file: File, bucket: string) => {
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { toast.error(error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return bucket === "certificates" ? path : publicUrl;
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "avatars");
    if (url) update({ avatar_url: url });
  };

  const onCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadFile(f, "certificates");
      if (u) urls.push(u);
    }
    update({ certificates: [...form.certificates, ...urls] });
  };

  const finish = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, avatar_url: form.avatar_url || null, city: form.city, phone: form.phone,
      grade: form.grade || null, target_year: form.target_year,
      gpa: form.gpa ? parseFloat(form.gpa) : null, gpa_scale: form.gpa_scale,
      sat: form.sat ? parseInt(form.sat) : null,
      ielts: form.ielts ? parseFloat(form.ielts) : null,
      toefl: form.toefl ? parseInt(form.toefl) : null,
      school_name: form.school_name, extracurriculars: form.extracurriculars,
      interests: form.interests, bio: form.bio, certificates: form.certificates,
      target_countries: form.target_countries, dream_universities: form.dream_universities,
      intended_major: form.intended_major || null,
      is_verified_gu: isGU, onboarding_complete: true,
      rank_score: computeRank(form, isGU),
    }).eq("user_id", user.id);

    if (error) { setSubmitting(false); return toast.error(error.message); }

    if (isGU && form.gu_unis.length && profile.id) {
      await supabase.from("gu_universities").insert(form.gu_unis.map((u, i) => ({
        profile_id: profile.id, ...u, is_primary: i === 0,
      })));
    }
    await refreshProfile();
    toast.success("Welcome to Uniin!");
    navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "radial-gradient(ellipse at top, oklch(0.30 0.10 265 / 0.3), oklch(0.18 0.03 260) 70%)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6"><Logo size="md" /></div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span><span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>

        <div className="surface-card p-8">
          {isGU ? <GUSteps step={step} form={form} update={update} toggleArr={toggleArr} onAvatarChange={onAvatarChange} onCertUpload={onCertUpload} />
                : <PrepSteps step={step} form={form} update={update} toggleArr={toggleArr} onAvatarChange={onAvatarChange} onCertUpload={onCertUpload} />}

          <div className="flex gap-2 mt-8">
            {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1 bg-primary hover:bg-accent">Continue</Button>
            ) : (
              <Button onClick={finish} disabled={submitting} className="flex-1 bg-primary hover:bg-accent">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Complete profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickType({ onPicked, userId }: { onPicked: () => void; userId: string }) {
  const pick = async (t: "gu" | "prep") => {
    await supabase.from("profiles").update({ user_type: t }).eq("user_id", userId);
    onPicked();
  };
  return (
    <div className="mt-6 flex gap-3">
      <Button onClick={() => pick("gu")} className="bg-gold text-gold-foreground hover:bg-gold/90">I'm G.U.</Button>
      <Button onClick={() => pick("prep")} className="bg-info hover:bg-info/90">I'm Prep</Button>
    </div>
  );
}

function computeRank(f: Form, isGU: boolean): number {
  let score = 0;
  if (isGU && f.gu_unis[0]?.qs_rank) score += Math.max(0, 200 - f.gu_unis[0].qs_rank);
  if (f.gpa) score += parseFloat(f.gpa) / f.gpa_scale * 30;
  if (f.sat) score += (parseInt(f.sat) / 1600) * 30;
  if (f.ielts) score += (parseFloat(f.ielts) / 9) * 20;
  score += f.extracurriculars.length * 3;
  return Math.round(score);
}

// ---------- G.U. steps ----------
function GUSteps(props: any) {
  const { step } = props;
  if (step === 1) return <PersonalInfo {...props} showGradeYear={false} />;
  if (step === 2) return <UniversityPicker {...props} />;
  if (step === 3) return <AcademicStats {...props} />;
  if (step === 4) return <SkillsExtras {...props} bioPrompt="Describe yourself and what you can help others with" />;
  return null;
}

// ---------- Prep steps ----------
function PrepSteps(props: any) {
  const { step } = props;
  if (step === 1) return <PersonalInfo {...props} showGradeYear />;
  if (step === 2) return <AcademicStats {...props} prep />;
  if (step === 3) return <SkillsExtras {...props} bioPrompt="Describe your goal" skipCerts />;
  if (step === 4) return <TargetUnis {...props} />;
  if (step === 5) return <CertsOnly {...props} />;
  return null;
}

function PersonalInfo({ form, update, onAvatarChange, showGradeYear }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Personal info</h2>
      <p className="text-sm text-muted-foreground">Tell us about yourself.</p>

      <div className="flex items-center gap-4">
        <div className="size-20 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden border-2 border-border">
          {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="size-full object-cover" />
            : <Upload className="size-6 text-muted-foreground" />}
        </div>
        <Label className="cursor-pointer">
          <span className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-sm hover:bg-surface">Upload photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </Label>
      </div>

      <div>
        <Label>Full name</Label>
        <Input value={form.full_name} onChange={e => update({ full_name: e.target.value })} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>City</Label>
          <Select value={form.city} onValueChange={v => update({ city: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={e => update({ phone: e.target.value })} className="mt-1.5" placeholder="+998..." />
        </div>
      </div>
      {showGradeYear && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Current grade</Label>
            <Select value={form.grade} onValueChange={v => update({ grade: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>{["9th","10th","11th","12th","Gap Year"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target application year</Label>
            <Input type="number" value={form.target_year || ""} onChange={e => update({ target_year: e.target.value ? parseInt(e.target.value) : null })} className="mt-1.5" placeholder="2026" />
          </div>
        </div>
      )}
    </div>
  );
}

function UniversityPicker({ form, update }: any) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<{ university_name: string; country: string; qs_rank: number } | null>(null);
  const [year, setYear] = useState("");
  const [degree, setDegree] = useState("Bachelor");
  const [major, setMajor] = useState("");

  const results = query ? UNIVERSITIES.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  const addUni = () => {
    if (!adding) return;
    update({ gu_unis: [...form.gu_unis, { ...adding, year_admitted: year ? parseInt(year) : null, degree_type: degree, major }] });
    setAdding(null); setYear(""); setMajor(""); setQuery("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Which university did you get into?</h2>
      <p className="text-sm text-muted-foreground">This becomes your verified badge across Uniin.</p>

      {form.gu_unis.length > 0 && (
        <div className="space-y-2">
          {form.gu_unis.map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg surface-card border-gold/30">
              <div>
                <div className="font-semibold flex items-center gap-2"><span className="text-gold">🎓</span> {u.university_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.country} · {u.degree_type} {u.major && `in ${u.major}`} {u.year_admitted && `· ${u.year_admitted}`}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => update({ gu_unis: form.gu_unis.filter((_: any, j: number) => j !== i) })}><X className="size-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <div>
          <Label>Search universities</Label>
          <div className="relative mt-1.5">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} className="pl-9" placeholder="e.g. MIT, Harvard, Oxford..." />
          </div>
          {results.length > 0 && (
            <div className="mt-2 surface-card divide-y divide-border max-h-64 overflow-auto">
              {results.map(u => (
                <button key={u.name} onClick={() => setAdding({ university_name: u.name, country: u.country, qs_rank: u.qsRank })} className="w-full text-left p-3 hover:bg-surface-2 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{u.flag} {u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.country}</div>
                  </div>
                  <span className="text-xs text-gold font-semibold">QS #{u.qsRank}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="surface-card p-4 space-y-3">
          <div className="font-semibold">{adding.university_name}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Year admitted</Label>
              <Input type="number" value={year} onChange={e => setYear(e.target.value)} className="mt-1.5" placeholder="2024" />
            </div>
            <div>
              <Label>Degree</Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["Bachelor","Master","PhD"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Major / faculty</Label>
            <Input value={major} onChange={e => setMajor(e.target.value)} className="mt-1.5" placeholder="e.g. Computer Science" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAdding(null)}>Cancel</Button>
            <Button className="flex-1 bg-primary" onClick={addUni}>Add university</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AcademicStats({ form, update, prep }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Academic stats</h2>
      <p className="text-sm text-muted-foreground">{prep ? "Where do you stand today?" : "Your record speaks for you."}</p>

      <div>
        <Label>School name (in Uzbekistan)</Label>
        <Input value={form.school_name} onChange={e => update({ school_name: e.target.value })} className="mt-1.5" />
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="col-span-2">
          <Label>GPA</Label>
          <Input value={form.gpa} onChange={e => update({ gpa: e.target.value })} className="mt-1.5" placeholder="e.g. 3.8 or 4.7" />
        </div>
        <div>
          <Label>Scale</Label>
          <Select value={String(form.gpa_scale)} onValueChange={v => update({ gpa_scale: parseFloat(v) })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">/4.0</SelectItem><SelectItem value="5">/5.0</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>SAT</Label>
          <Input value={form.sat} onChange={e => update({ sat: e.target.value })} className="mt-1.5" placeholder="1500" />
        </div>
        <div>
          <Label>IELTS</Label>
          <Input value={form.ielts} onChange={e => update({ ielts: e.target.value })} className="mt-1.5" placeholder="7.5" />
        </div>
        <div>
          <Label>TOEFL</Label>
          <Input value={form.toefl} onChange={e => update({ toefl: e.target.value })} className="mt-1.5" placeholder="105" />
        </div>
      </div>
    </div>
  );
}

function SkillsExtras({ form, update, toggleArr, onCertUpload, bioPrompt, skipCerts }: any) {
  const [interest, setInterest] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Skills & extras</h2>
      <p className="text-sm text-muted-foreground">What makes you, you.</p>

      <div>
        <Label>Extracurriculars</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {EXTRACURRICULARS.map(ec => (
            <button key={ec} onClick={() => toggleArr("extracurriculars", ec)} type="button"
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${form.extracurriculars.includes(ec) ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>{ec}</button>
          ))}
        </div>
      </div>

      <div>
        <Label>Interests & skills (press Enter to add)</Label>
        <div className="flex gap-2 mt-1.5">
          <Input value={interest} onChange={e => setInterest(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (interest.trim()) { update({ interests: [...form.interests, interest.trim()] }); setInterest(""); } } }}
            placeholder="e.g. Machine learning" />
          <Button type="button" variant="outline" onClick={() => { if (interest.trim()) { update({ interests: [...form.interests, interest.trim()] }); setInterest(""); } }}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {form.interests.map((i: string, idx: number) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-info/10 text-info text-xs">
              {i} <button onClick={() => update({ interests: form.interests.filter((_: any, j: number) => j !== idx) })}><X className="size-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <Label>Short bio ({form.bio.length}/300)</Label>
        <Textarea maxLength={300} value={form.bio} onChange={e => update({ bio: e.target.value })} className="mt-1.5" placeholder={bioPrompt} rows={3} />
      </div>

      {!skipCerts && (
        <div>
          <Label>Certificates (optional)</Label>
          <Label className="mt-1.5 cursor-pointer block">
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground hover:border-primary/50">
              <Upload className="size-5 mx-auto mb-1" /> Upload files (PDF/image)
            </div>
            <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={onCertUpload} />
          </Label>
          {form.certificates.length > 0 && <p className="text-xs text-muted-foreground mt-2">{form.certificates.length} file(s) uploaded</p>}
        </div>
      )}
    </div>
  );
}

function TargetUnis({ form, update, toggleArr }: any) {
  const [uni, setUni] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Target universities & major</h2>
      <p className="text-sm text-muted-foreground">Aim high.</p>

      <div>
        <Label>Target countries</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {COUNTRIES.map(c => (
            <button key={c.code} type="button" onClick={() => toggleArr("target_countries", c.code)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.target_countries.includes(c.code) ? "bg-info border-info text-white" : "border-border hover:border-info/50"}`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Dream universities (type and add)</Label>
        <div className="flex gap-2 mt-1.5">
          <Input value={uni} onChange={e => setUni(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (uni.trim()) { update({ dream_universities: [...form.dream_universities, uni.trim()] }); setUni(""); } } }}
            placeholder="e.g. MIT" />
          <Button type="button" variant="outline" onClick={() => { if (uni.trim()) { update({ dream_universities: [...form.dream_universities, uni.trim()] }); setUni(""); } }}><Plus className="size-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {form.dream_universities.map((u: string, idx: number) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
              {u} <button onClick={() => update({ dream_universities: form.dream_universities.filter((_: any, j: number) => j !== idx) })}><X className="size-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <Label>Intended major</Label>
        <Select value={form.intended_major} onValueChange={v => update({ intended_major: v })}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick a major" /></SelectTrigger>
          <SelectContent>{MAJORS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CertsOnly({ form, onCertUpload }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Certificates</h2>
      <p className="text-sm text-muted-foreground">Show your achievements. Optional but encouraged.</p>
      <Label className="cursor-pointer block">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground hover:border-primary/50">
          <Upload className="size-8 mx-auto mb-2 text-primary" />
          <div className="font-medium text-foreground">Click to upload</div>
          <div className="text-xs mt-1">PDF or image files, multiple allowed</div>
        </div>
        <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={onCertUpload} />
      </Label>
      {form.certificates.length > 0 && (
        <div className="text-sm text-success">✓ {form.certificates.length} file(s) uploaded</div>
      )}
    </div>
  );
}

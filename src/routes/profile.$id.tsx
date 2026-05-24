import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "@/components/UserBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, MapPin, MessageSquare, Video, UserPlus, UserCheck, FileText, Loader2, Eye, Award, ThumbsUp, Crown, Plus } from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";
import { PremiumLock } from "@/components/PremiumGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/profile/$id")({
  component: () => <RequireAuth><ProfilePage /></RequireAuth>,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [unis, setUnis] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<{ count: number; recent: any[] }>({ count: 0, recent: [] });
  const [endorsements, setEndorsements] = useState<{ skill: string; count: number; mine: boolean }[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [endorseOpen, setEndorseOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const isMe = myProfile?.id === id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      setProfile(p);
      if (p?.user_type === "gu") {
        const { data: u } = await supabase.from("gu_universities").select("*").eq("profile_id", id);
        setUnis(u || []);
      }
      const { data: ps } = await supabase.from("posts")
        .select(`id, content, media_urls, post_type, likes_count, comments_count, created_at, author_id,
          profiles!posts_author_id_fkey(id, full_name, avatar_url, user_type, intended_major)`)
        .eq("author_id", id).order("created_at", { ascending: false });
      setPosts(ps || []);

      if (user && p) {
        const { data: f } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", id).maybeSingle();
        setFollowing(!!f);
        // Record profile view (don't self-view)
        if (user.id !== p.user_id) {
          await supabase.from("profile_views").insert({ viewer_id: user.id, viewed_id: id });
        }
      }

      // Endorsements
      const { data: endo } = await supabase.from("skill_endorsements").select("skill, endorser_id").eq("endorsed_id", id);
      const grouped: Record<string, { count: number; mine: boolean }> = {};
      (endo || []).forEach((e: any) => {
        if (!grouped[e.skill]) grouped[e.skill] = { count: 0, mine: false };
        grouped[e.skill].count++;
        if (user && e.endorser_id === user.id) grouped[e.skill].mine = true;
      });
      setEndorsements(Object.entries(grouped).map(([skill, v]) => ({ skill, ...v })).sort((a, b) => b.count - a.count));

      // Badges
      const { data: bd } = await supabase.from("badges").select("*").eq("user_id", p?.user_id || "").order("earned_at", { ascending: false });
      setBadges(bd || []);

      // Views (self only)
      if (user && p && user.id === p.user_id) {
        const since = new Date(); since.setDate(since.getDate() - 90);
        const { data: vw, count } = await supabase.from("profile_views")
          .select("viewer_id, created_at, profiles!profile_views_viewer_id_fkey(id, full_name, avatar_url, user_type)", { count: "exact" })
          .eq("viewed_id", id).gte("created_at", since.toISOString())
          .order("created_at", { ascending: false }).limit(10);
        setViews({ count: count || 0, recent: vw || [] });
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user || isMe) return;
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
      setFollowing(true);
      toast.success(`Following ${profile.full_name}`);
    }
  };

  const startDM = async () => {
    if (!user || !profile || isMe) return;
    const { data: existing } = await supabase.from("conversations").select("id").contains("participant_ids", [user.id, profile.user_id]).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from("conversations").insert({ participant_ids: [user.id, profile.user_id] }).select("id").single();
      convId = data?.id;
    }
    window.location.href = `/messages?c=${convId}`;
  };
  const addEndorsement = async (skillRaw: string) => {
    if (!user || !profile || isMe) return;
    const skill = skillRaw.trim().slice(0, 40);
    if (!skill) return;
    const existing = endorsements.find((e) => e.skill === skill && e.mine);
    if (existing) {
      await supabase.from("skill_endorsements").delete().eq("endorser_id", user.id).eq("endorsed_id", id).eq("skill", skill);
      setEndorsements((prev) => prev.map((e) => e.skill === skill ? { ...e, count: Math.max(0, e.count - 1), mine: false } : e).filter((e) => e.count > 0));
    } else {
      const { error } = await supabase.from("skill_endorsements").insert({ endorser_id: user.id, endorsed_id: id, skill });
      if (error) return toast.error(error.message);
      setEndorsements((prev) => {
        const idx = prev.findIndex((e) => e.skill === skill);
        if (idx >= 0) return prev.map((e) => e.skill === skill ? { ...e, count: e.count + 1, mine: true } : e);
        return [...prev, { skill, count: 1, mine: true }];
      });
      toast.success(`Endorsed for ${skill}`);
    }
    setSkillInput("");
    setEndorseOpen(false);
  };


  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20">Profile not found</div>;

  const isGU = profile.user_type === "gu";
  const primaryUni = unis[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="surface-card overflow-hidden relative">
        {/* Cover image / gradient */}
        <div className="h-44 md:h-72 bg-cover bg-center relative"
          style={profile.cover_image_url
            ? { backgroundImage: `url(${profile.cover_image_url})` }
            : { background: isGU
                ? "linear-gradient(135deg, oklch(0.15 0.08 265) 0%, oklch(0.25 0.12 255) 40%, oklch(1 0.05 75) 100%)"
                : "linear-gradient(135deg, oklch(0.12 0.06 265) 0%, oklch(0.22 0.10 265) 40%, oklch(0.42 0.18 27) 100%)" }}>
          {/* Bottom fade overlay for readability */}
          <div className="absolute inset-1" style={{ background: "linear-gradient(to bottom, transparent 40%, oklch(0.08 0.03 260 / 0.85) 100%)" }} />
          {/* Subtle pattern overlay */}
          {!profile.cover_image_url && (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, oklch(1 0 0 / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, oklch(1 0 0 /  0.2) 0%, transparent 50%)" }} />
          )}
        </div>

        <div className="px-5 md:px-8 pb-6 relative">
          <div className="flex flex-col md:flex-row md:items-start gap-4 -mt-12 md:-mt-14">
            {/* Avatar — sits over the cover */}
            <div className="relative shrink-0">
              <Avatar className="size-24 md:size-28 border-[5px] border-card shadow-xl ring-1 ring-white/10">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl md:text-3xl font-display bg-navy-deep text-gold">{profile.full_name?.[0]}</AvatarFallback>
              </Avatar>
              {isGU && (
                <div className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-gold text-gold-foreground flex items-center justify-center border-[3px] border-card shadow-md">
                  <GraduationCap className="size-4" />
                </div>
              )}
            </div>

            {/* Name & Info — sits BELOW the cover for readability */}
            <div className="flex-1 min-w-0 md:pt-16">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{profile.full_name}</h1>
                <UserBadge type={profile.user_type} />
              </div>
              {isGU && primaryUni && (
                <div className="mt-1.5 inline-flex items-center gap-2 text-sm md:text-base font-medium text-gold">
                  <GraduationCap className="size-4 shrink-0" /> {primaryUni.university_name} · {primaryUni.major || primaryUni.degree_type}
                </div>
              )}
              {!isGU && profile.intended_major && (
                <div className="mt-1.5 text-sm md:text-base text-info">Targeting {profile.intended_major} {profile.target_countries?.length ? `· ${profile.target_countries.join(", ")}` : ""}</div>
              )}
              {profile.city && (
                <div className="text-xs md:text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" /> {profile.city}
                </div>
              )}
            </div>

            {/* Actions */}
            {!isMe && (
              <div className="flex gap-2 mt-2 md:mt-16">
                <Button onClick={toggleFollow} variant={following ? "outline" : "default"} className={following ? "" : "bg-primary hover:bg-accent shadow-lg"}>
                  {following ? <><UserCheck className="size-4 mr-1.5" /> Following</> : <><UserPlus className="size-4 mr-1.5" /> Follow</>}
                </Button>
                <Button onClick={startDM} variant="outline" className="shadow-lg"><MessageSquare className="size-4 mr-1.5" /> Message</Button>
                {isGU && <Button variant="outline" className="shadow-lg"><Video className="size-4 mr-1.5" /> Book session</Button>}
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          {isMe && (
            <Section title={<><Eye className="inline size-3.5 mr-1" /> Profile views (last 90 days)</>}>
              {profile.is_premium ? (
                <>
                  <div className="text-3xl font-bold mb-3">{views.count}</div>
                  {views.recent.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No views yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {views.recent.map((v: any, i: number) => (
                        <Link key={i} to="/profile/$id" params={{ id: v.profiles?.id || "" }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors">
                          <Avatar className="size-9"><AvatarImage src={v.profiles?.avatar_url} /><AvatarFallback>{v.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate flex items-center gap-1.5">{v.profiles?.full_name} <UserBadge type={v.profiles?.user_type} className="!text-[9px]" /></div>
                            <div className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <PremiumLock>
                  <div className="text-3xl font-bold mb-3">{views.count || 12}</div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="size-9 rounded-full bg-surface-2" />
                        <div className="flex-1"><div className="h-3 w-32 bg-surface-2 rounded" /><div className="h-2 w-20 bg-surface-2 rounded mt-1" /></div>
                      </div>
                    ))}
                  </div>
                </PremiumLock>
              )}
            </Section>
          )}

          {(badges.length > 0 || profile.is_premium) && (
            <Section title={<><Award className="inline size-3.5 mr-1" /> Badges</>}>
              <div className="flex flex-wrap gap-2">
                {profile.is_premium && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-semibold">
                    <Crown className="size-3.5" /> Premium
                  </span>
                )}
                {badges.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-semibold capitalize">
                    <Award className="size-3.5" /> {b.badge_type.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title={<span className="flex items-center justify-between w-full"><span><ThumbsUp className="inline size-3.5 mr-1" /> Endorsements</span>
            {!isMe && (
              <Dialog open={endorseOpen} onOpenChange={setEndorseOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs text-primary hover:underline normal-case font-normal tracking-normal"><Plus className="inline size-3" /> Endorse</button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Endorse a skill</DialogTitle></DialogHeader>
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g. Essay writing, Math, Leadership" maxLength={40}
                    onKeyDown={(e) => { if (e.key === "Enter") addEndorsement(skillInput); }} />
                  <div className="text-xs text-muted-foreground">Add or remove an endorsement. Click an existing skill to add your vote.</div>
                  <Button onClick={() => addEndorsement(skillInput)} className="bg-primary hover:bg-accent">Endorse</Button>
                </DialogContent>
              </Dialog>
            )}
          </span>}>
            {endorsements.length === 0 ? (
              <div className="text-xs text-muted-foreground">No endorsements yet. {!isMe && "Be the first to endorse a skill."}</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {endorsements.map((e) => (
                  <button
                    key={e.skill}
                    disabled={isMe}
                    onClick={() => addEndorsement(e.skill)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${e.mine ? "bg-primary/20 border-primary text-primary" : "bg-surface-2 border-border hover:border-primary/50"} ${isMe ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {e.skill} <span className="text-[10px] font-bold opacity-70">·{e.count}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {profile.bio && (
            <Section title="About"><p className="text-sm leading-relaxed">{profile.bio}</p></Section>
          )}

          <Section title="Academic stats">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="GPA" value={profile.gpa ? `${profile.gpa}/${profile.gpa_scale}` : "—"} />
              <Stat label="SAT" value={profile.sat || "—"} />
              <Stat label="IELTS" value={profile.ielts || "—"} />
              <Stat label="TOEFL" value={profile.toefl || "—"} />
              {(profile.custom_stats as any[])?.map((s: any, i: number) => (
                <Stat key={i} label={s.label} value={s.value} />
              ))}
            </div>
          </Section>

          {isGU && unis.length > 0 && (
            <Section title="Universities">
              <div className="space-y-2">
                {unis.map(u => (
                  <div key={u.id} className="p-4 surface-card border-gold/30 gu-accent-border">
                    <div className="font-semibold flex items-center gap-2"><GraduationCap className="size-4 text-gold" /> {u.university_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{u.country} · {u.degree_type} {u.major && `in ${u.major}`} {u.year_admitted && `· ${u.year_admitted}`} {u.qs_rank && `· QS #${u.qs_rank}`}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {!isGU && (profile.target_countries?.length > 0 || profile.dream_universities?.length > 0) && (
            <Section title="Targets">
              {profile.target_countries?.length > 0 && (
                <div><div className="text-xs text-muted-foreground mb-1.5">Target countries</div>
                  <div className="flex flex-wrap gap-1.5">{profile.target_countries.map((c: string) => <span key={c} className="px-2 py-1 text-xs rounded-md bg-info/15 text-info">{c}</span>)}</div></div>
              )}
              {profile.dream_universities?.length > 0 && (
                <div className="mt-3"><div className="text-xs text-muted-foreground mb-1.5">Dream universities</div>
                  <div className="flex flex-wrap gap-1.5">{profile.dream_universities.map((u: string) => <span key={u} className="px-2 py-1 text-xs rounded-md bg-primary/15 text-primary">{u}</span>)}</div></div>
              )}
            </Section>
          )}

          {(profile.extracurricular_items as any[])?.length > 0 ? (
            <Section title="Extracurriculars">
              <div className="space-y-3">
                {Object.entries(((profile.extracurricular_items as any[]) || []).reduce((acc: any, it: any) => {
                  (acc[it.category || "Other"] ||= []).push(it); return acc;
                }, {})).map(([cat, items]: any) => (
                  <div key={cat}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((it: any, i: number) => (
                        <div key={i} className="surface-card p-3 bg-surface-2/40">
                          <div className="text-sm font-semibold">{it.title}</div>
                          {it.role && <div className="text-xs text-muted-foreground">{it.role}</div>}
                          {it.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{it.description}</div>}
                          <div className="flex gap-2 mt-1.5">
                            {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="text-[11px] text-info hover:underline">Havola</a>}
                            {it.file_url && <a href={it.file_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">Fayl</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : profile.extracurriculars?.length > 0 && (
            <Section title="Extracurriculars">
              <div className="flex flex-wrap gap-1.5">{profile.extracurriculars.map((e: string) => <span key={e} className="px-3 py-1 text-xs rounded-full bg-surface-2 border border-border">{e}</span>)}</div>
            </Section>
          )}

          {profile.interests?.length > 0 && (
            <Section title="Interests & skills">
              <div className="flex flex-wrap gap-1.5">{profile.interests.map((i: string) => <span key={i} className="px-3 py-1 text-xs rounded-full bg-info/10 text-info">{i}</span>)}</div>
            </Section>
          )}

          {(profile.certifications as any[])?.length > 0 && (
            <Section title="Certifications">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(profile.certifications as any[]).map((c: any, i: number) => (
                  <div key={i} className="p-3 surface-card flex items-start gap-3">
                    <div className="size-10 rounded-md bg-gold/15 text-gold flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.issuer}</div>
                      {c.issue_date && <div className="text-[11px] text-muted-foreground mt-0.5">{c.issue_date}</div>}
                      {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-[11px] text-info hover:underline">View credential →</a>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4 mt-4">
          {posts.length === 0 ? <div className="text-center py-12 text-muted-foreground">No posts yet</div>
            : posts.map(p => <PostCard key={p.id} post={{ ...p, gu_uni: primaryUni }} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: any) {
  return <div className="surface-card p-5"><h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>{children}</div>;
}

function Stat({ label, value }: any) {
  return (
    <div className="p-3 surface-card bg-surface-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}

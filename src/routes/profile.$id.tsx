import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "@/components/UserBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, MapPin, MessageSquare, Video, UserPlus, UserCheck, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";

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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20">Profile not found</div>;

  const isGU = profile.user_type === "gu";
  const primaryUni = unis[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="surface-card overflow-hidden">
        <div className="h-32 md:h-56 bg-cover bg-center"
          style={profile.cover_image_url
            ? { backgroundImage: `url(${profile.cover_image_url})` }
            : { background: isGU ? "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.55 0.15 75))" : "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.40 0.15 27))" }} />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="size-24 border-4 border-card">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{profile.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <UserBadge type={profile.user_type} />
              </div>
              {isGU && primaryUni && (
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-gold">
                  <GraduationCap className="size-4" /> {primaryUni.university_name} · {primaryUni.major || primaryUni.degree_type}
                </div>
              )}
              {!isGU && profile.intended_major && (
                <div className="mt-1 text-sm text-info">Targeting {profile.intended_major} {profile.target_countries?.length ? `· ${profile.target_countries.join(", ")}` : ""}</div>
              )}
              {profile.city && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="size-3" /> {profile.city}</div>}
            </div>
            {!isMe && (
              <div className="flex gap-2">
                <Button onClick={toggleFollow} variant={following ? "outline" : "default"} className={following ? "" : "bg-primary hover:bg-accent"}>
                  {following ? <><UserCheck className="size-4 mr-1.5" /> Following</> : <><UserPlus className="size-4 mr-1.5" /> Follow</>}
                </Button>
                <Button onClick={startDM} variant="outline"><MessageSquare className="size-4 mr-1.5" /> Message</Button>
                {isGU && <Button variant="outline"><Video className="size-4 mr-1.5" /> Book session</Button>}
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
          {profile.bio && (
            <Section title="About"><p className="text-sm leading-relaxed">{profile.bio}</p></Section>
          )}

          <Section title="Academic stats">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="GPA" value={profile.gpa ? `${profile.gpa}/${profile.gpa_scale}` : "—"} />
              <Stat label="SAT" value={profile.sat || "—"} />
              <Stat label="IELTS" value={profile.ielts || "—"} />
              <Stat label="TOEFL" value={profile.toefl || "—"} />
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

          {profile.extracurriculars?.length > 0 && (
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

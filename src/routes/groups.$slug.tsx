import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check, ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/groups/$slug")({
  component: () => <RequireAuth><GroupDetail /></RequireAuth>,
});

function GroupDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const isUuid = UUID_RE.test(slug);
      const q = supabase.from("groups").select("*");
      const { data: g } = await (isUuid ? q.eq("id", slug) : q.eq("slug", slug)).maybeSingle();
      setGroup(g);
      if (!g) { setLoading(false); return; }

      const [{ data: mems }, { data: ps }] = await Promise.all([
        supabase.from("group_members")
          .select("user_id, role, joined_at, profiles!inner(id, username, full_name, avatar_url, user_type)")
          // members table joins by user_id; we need to fetch profiles separately
          .eq("group_id", g.id).limit(50),
        supabase.from("posts")
          .select(`id, content, title, media_urls, post_type, poll_options, likes_count, comments_count, created_at, author_id,
            profiles!posts_author_id_fkey(id, username, full_name, avatar_url, user_type, intended_major, grade, target_countries)`)
          .eq("group_id", g.id).order("created_at", { ascending: false }),
      ]);
      // membership join may fail since FK isn't set; fallback by user_id
      let memberList: any[] = mems || [];
      if (!mems || mems.length === 0) {
        const { data: raw } = await supabase.from("group_members").select("user_id, role, joined_at").eq("group_id", g.id).limit(50);
        if (raw && raw.length > 0) {
          const ids = raw.map((r: any) => r.user_id);
          const { data: profs } = await supabase.from("profiles").select("id, user_id, username, full_name, avatar_url, user_type").in("user_id", ids);
          const map: Record<string, any> = {};
          (profs || []).forEach((p: any) => { map[p.user_id] = p; });
          memberList = raw.map((r: any) => ({ ...r, profiles: map[r.user_id] }));
        }
      }
      setMembers(memberList);
      setPosts(ps || []);

      if (user) {
        const { data: m } = await supabase.from("group_members").select("id").eq("group_id", g.id).eq("user_id", user.id).maybeSingle();
        setJoined(!!m);
      }
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const toggleJoin = async () => {
    if (!user || !group) return;
    setBusy(true);
    if (joined) {
      const { error } = await supabase.from("group_members").delete().eq("group_id", group.id).eq("user_id", user.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      setJoined(false);
      setGroup((g: any) => ({ ...g, member_count: Math.max(0, (g.member_count || 1) - 1) }));
    } else {
      const { error } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
      setBusy(false);
      if (error && error.code !== "23505") return toast.error(error.message);
      setJoined(true);
      setGroup((g: any) => ({ ...g, member_count: (g.member_count || 0) + 1 }));
      toast.success("Guruhga qo'shildingiz");
    }
  };

  const createPost = async () => {
    const text = composer.trim();
    if (!text || !user || !group) return;
    setPosting(true);
    const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!prof) { setPosting(false); return; }
    const { data, error } = await supabase.from("posts").insert({
      author_id: prof.id, content: text, group_id: group.id, post_type: "update",
    }).select(`id, content, title, media_urls, post_type, poll_options, likes_count, comments_count, created_at, author_id,
      profiles!posts_author_id_fkey(id, username, full_name, avatar_url, user_type, intended_major, grade, target_countries)`).single();
    setPosting(false);
    if (error) return toast.error(error.message);
    setComposer("");
    if (data) setPosts((p) => [data, ...p]);
    toast.success("Post yuborildi");
  };

  if (loading) return <div className="max-w-3xl mx-auto p-8 text-center text-muted-foreground"><Loader2 className="size-6 mx-auto animate-spin" /></div>;
  if (!group) return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <div className="surface-card p-8">
        <p className="text-muted-foreground">Guruh topilmadi.</p>
        <Link to="/groups" className="text-primary hover:underline text-sm mt-2 inline-block">← Barcha guruhlar</Link>
      </div>
    </div>
  );

  const isCreator = group.creator_id === user?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Barcha guruhlar
      </Link>

      {/* Header */}
      <div className="surface-card overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/30 via-accent/20 to-surface-2"
          style={group.cover_image_url ? { backgroundImage: `url(${group.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold">{group.name}</h1>
              <div className="text-xs font-mono text-muted-foreground mt-0.5">/{group.slug}</div>
              {group.category && <div className="text-xs text-info mt-1">{group.category}</div>}
            </div>
            {isCreator ? (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gold/15 text-gold uppercase">Owner</span>
            ) : joined ? (
              <Button size="sm" variant="outline" onClick={toggleJoin} disabled={busy}>
                <Check className="size-3.5 mr-1" /> Joined
              </Button>
            ) : (
              <Button size="sm" onClick={toggleJoin} disabled={busy} className="bg-primary hover:bg-accent">Join</Button>
            )}
          </div>
          {group.description && <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">{group.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {group.member_count} a'zo</span>
            <span>·</span>
            <span>{posts.length} post</span>
          </div>
        </div>
      </div>

      {/* Composer */}
      {(joined || isCreator) && user && (
        <div className="surface-card p-4">
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Guruhga nimadir yozing..."
            rows={3}
            className="w-full bg-surface-2 rounded-lg p-3 text-sm border border-border focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button onClick={createPost} disabled={!composer.trim() || posting} className="bg-primary hover:bg-accent">
              <Send className="size-4 mr-1.5" /> {posting ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
          </div>
        </div>
      )}

      {/* Members preview */}
      {members.length > 0 && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">A'zolar ({group.member_count})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.slice(0, 12).map((m) => m.profiles && (
              <Link key={m.user_id} to="/profile/$id" params={{ id: m.profiles.username || m.profiles.id }} className="flex items-center gap-2 px-2 py-1 rounded-full bg-surface-2 hover:bg-surface text-xs">
                <Avatar className="size-5"><AvatarImage src={m.profiles.avatar_url} /><AvatarFallback className="text-[9px]">{m.profiles.full_name?.[0]}</AvatarFallback></Avatar>
                <span className="truncate max-w-[120px]">{m.profiles.full_name}</span>
                {m.role === "admin" && <span className="text-[9px] text-gold font-semibold">ADMIN</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-muted-foreground">
            Hali postlar yo'q. {(joined || isCreator) ? "Birinchi bo'ling 👆" : "Qo'shilib, birinchi bo'lib yozing."}
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p as any} onDeleted={(id) => setPosts((arr) => arr.filter((x) => x.id !== id))} />)
        )}
      </div>
    </div>
  );
}

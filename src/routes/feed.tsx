import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UserBadge } from "@/components/UserBadge";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/feed")({
  component: () => <RequireAuth rightSidebar={<RightSidebar />}><FeedPage /></RequireAuth>,
});

function FeedPage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<"update" | "question" | "resource" | "win" | "essay_tip" | "poll">("update");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("posts")
      .select(`id, content, title, media_urls, post_type, poll_options, likes_count, comments_count, created_at, author_id,
        profiles!posts_author_id_fkey(id, full_name, avatar_url, user_type, intended_major, grade, target_countries)`)
      .order("created_at", { ascending: false }).limit(50);

    // Enrich GU users with primary university
    const guIds = (data || []).filter((p: any) => p.profiles?.user_type === "gu").map((p: any) => p.profiles.id);
    let unisMap: Record<string, any> = {};
    if (guIds.length) {
      const { data: unis } = await supabase.from("gu_universities").select("profile_id, university_name, country").in("profile_id", guIds);
      (unis || []).forEach((u: any) => { if (!unisMap[u.profile_id]) unisMap[u.profile_id] = u; });
    }
    const enriched = (data || []).map((p: any) => ({ ...p, gu_uni: unisMap[p.profiles?.id] || null }));
    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submitPost = async () => {
    if (!profile) return;
    const isPoll = postType === "poll";
    const cleanOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (isPoll) {
      if (!title.trim()) return toast.error("So'rovnoma uchun savol kerak");
      if (cleanOpts.length < 2) return toast.error("Kamida 2 ta variant kerak");
    } else if (!content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({
      author_id: profile.id,
      content: isPoll ? (content.trim() || title.trim()) : content.trim(),
      title: title.trim() || null,
      post_type: postType,
      poll_options: isPoll ? cleanOpts : null,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setContent(""); setTitle(""); setPostType("update"); setPollOptions(["", ""]);
    toast.success("Posted!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Composer */}
      <div className="surface-card p-4">
        <div className="flex gap-3">
          <Avatar className="size-10"><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback>{profile?.full_name?.[0]}</AvatarFallback></Avatar>
          <div className="flex-1">
            {postType === "poll" && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="So'rovnoma savoli..."
                className="w-full bg-transparent border-0 focus:outline-none p-2 font-semibold text-base"
              />
            )}
            <Textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={postType === "poll" ? "Qo'shimcha tafsilot (ixtiyoriy)..." : "Share an update, tip, or question..."} rows={2}
              className="bg-transparent border-0 resize-none focus-visible:ring-0 p-2" />

            {postType === "poll" && (
              <div className="space-y-2 mt-2 pt-2 border-t border-border">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next);
                      }}
                      placeholder={`Variant ${i + 1}`}
                      className="flex-1 bg-surface-2 rounded-md px-3 py-2 text-sm border border-border focus:outline-none focus:border-primary"
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-xs text-muted-foreground hover:text-destructive px-2">✕</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-primary hover:underline">+ Variant qo'shish</button>
                )}
              </div>
            )}

            {(content || postType === "poll") && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <Select value={postType} onValueChange={v => setPostType(v as any)}>
                  <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">📝 Update</SelectItem>
                    <SelectItem value="question">❓ Question</SelectItem>
                    <SelectItem value="resource">📚 Resource</SelectItem>
                    <SelectItem value="win">🎉 Application Win</SelectItem>
                    <SelectItem value="essay_tip">✍️ Essay Tip</SelectItem>
                    <SelectItem value="poll">📊 So'rovnoma</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm"><ImageIcon className="size-4" /></Button>
                <Button onClick={submitPost} disabled={posting} className="ml-auto bg-primary hover:bg-accent" size="sm">
                  {posting ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4 mr-1.5" /> Post</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
        : posts.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <Sparkles className="size-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Be the first to post</h3>
            <p className="text-sm text-muted-foreground">Share your journey, ask a question, or drop a tip.</p>
          </div>
        ) : posts.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  );
}

function RightSidebar() {
  const { profile, user } = useAuth();
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      let q = supabase.from("profiles").select("id, full_name, avatar_url, user_type, city, intended_major, target_countries").eq("onboarding_complete", true).limit(5);
      if (user) q = q.neq("user_id", user.id);
      const { data } = await q;
      setPeople(data || []);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="surface-card p-4">
        <h3 className="font-semibold text-sm mb-3">People you might know</h3>
        <div className="space-y-3">
          {people.map(p => (
            <Link key={p.id} to="/profile/$id" params={{ id: p.id }} className="flex items-center gap-3 hover:bg-surface-2 -mx-2 px-2 py-1.5 rounded">
              <Avatar className="size-9"><AvatarImage src={p.avatar_url} /><AvatarFallback>{p.full_name?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">{p.full_name} <UserBadge type={p.user_type} className="!text-[10px]" /></div>
                <div className="text-xs text-muted-foreground truncate">{p.city} · {p.intended_major || ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

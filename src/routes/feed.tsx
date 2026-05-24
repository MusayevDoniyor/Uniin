import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Send, Loader2, Sparkles, X, Trophy, HelpCircle, BookOpen, FileEdit, BarChart3, Pencil } from "lucide-react";
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("posts")
      .select(`id, content, title, media_urls, post_type, poll_options, likes_count, comments_count, created_at, author_id,
        profiles!posts_author_id_fkey(id, username, full_name, avatar_url, user_type, intended_major, grade, target_countries)`)
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

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4 - mediaFiles.length);
    setMediaFiles((m) => [...m, ...arr]);
  };

  const submitPost = async () => {
    if (!profile || !user) return;
    const isPoll = postType === "poll";
    const cleanOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (isPoll) {
      if (!title.trim()) return toast.error("So'rovnoma uchun savol kerak");
      if (cleanOpts.length < 2) return toast.error("Kamida 2 ta variant kerak");
    } else if (!content.trim() && mediaFiles.length === 0) return;
    setPosting(true);

    // Upload media first
    const media_urls: string[] = [];
    if (mediaFiles.length) {
      setUploadingMedia(true);
      for (const file of mediaFiles) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, { upsert: false, cacheControl: "3600" });
        if (upErr) { toast.error(upErr.message); setUploadingMedia(false); setPosting(false); return; }
        const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);
        media_urls.push(publicUrl);
      }
      setUploadingMedia(false);
    }

    const { error } = await supabase.from("posts").insert({
      author_id: profile.id,
      content: isPoll ? (content.trim() || title.trim()) : content.trim(),
      title: title.trim() || null,
      post_type: postType,
      poll_options: isPoll ? cleanOpts : null,
      media_urls,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setContent(""); setTitle(""); setPostType("update"); setPollOptions(["", ""]); setMediaFiles([]);
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

            {/* Media previews */}
            {mediaFiles.length > 0 && (
              <div className={`mt-3 grid gap-2 ${mediaFiles.length > 1 ? "grid-cols-2" : ""}`}>
                {mediaFiles.map((f, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full max-h-64 object-cover" />
                    <button type="button" onClick={() => setMediaFiles(m => m.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 size-6 rounded-full bg-background/90 text-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(content || postType === "poll" || mediaFiles.length > 0) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <Select value={postType} onValueChange={v => setPostType(v as any)}>
                  <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update"><span className="inline-flex items-center gap-1.5"><Pencil className="size-3.5" /> Update</span></SelectItem>
                    <SelectItem value="question"><span className="inline-flex items-center gap-1.5"><HelpCircle className="size-3.5" /> Savol</span></SelectItem>
                    <SelectItem value="resource"><span className="inline-flex items-center gap-1.5"><BookOpen className="size-3.5" /> Resurs</span></SelectItem>
                    <SelectItem value="win"><span className="inline-flex items-center gap-1.5"><Trophy className="size-3.5" /> Win</span></SelectItem>
                    <SelectItem value="essay_tip"><span className="inline-flex items-center gap-1.5"><FileEdit className="size-3.5" /> Essay tip</span></SelectItem>
                    <SelectItem value="poll"><span className="inline-flex items-center gap-1.5"><BarChart3 className="size-3.5" /> So'rovnoma</span></SelectItem>
                  </SelectContent>
                </Select>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }} />
                <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={mediaFiles.length >= 4}>
                  <ImageIcon className="size-4 mr-1" /> <span className="hidden sm:inline">Rasm</span>
                </Button>
                <Button onClick={submitPost} disabled={posting || uploadingMedia} className="ml-auto bg-primary hover:bg-accent" size="sm">
                  {posting || uploadingMedia ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4 mr-1.5" /> Post</>}
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
      let q = supabase.from("profiles").select("id, username, full_name, avatar_url, user_type, city, intended_major, target_countries").eq("onboarding_complete", true).limit(5);
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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "./UserBadge";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Share2, Send, Smile, MoreHorizontal, Sparkles, Link2, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { countriesToFlags } from "@/lib/country-flags";
import { ReactionBar, REACTIONS } from "./ReactionBar";
import { PollBlock } from "./PollBlock";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


type PostWithAuthor = {
  id: string; content: string; title?: string | null; media_urls: string[]; post_type: string;
  poll_options?: string[] | null;
  likes_count: number; comments_count: number; created_at: string; author_id: string;
  profiles: {
    id: string; full_name: string; avatar_url: string | null;
    user_type: "gu" | "prep";
    intended_major: string | null;
    grade?: string | null;
    target_countries?: string[] | null;
  };
  gu_uni?: { university_name: string; country: string } | null;
};

const POST_TYPE_LABEL: Record<string, { label: string; tone: string }> = {
  win:       { label: "🏆 Win",         tone: "bg-gold/15 text-gold border-gold/30" },
  question:  { label: "❓ Savol",       tone: "bg-info/15 text-info border-info/30" },
  resource:  { label: "📚 Resurs",      tone: "bg-primary/15 text-primary border-primary/30" },
  essay_tip: { label: "✍️ Essay tip",   tone: "bg-accent/15 text-accent-foreground border-accent/30" },
  poll:      { label: "📊 So'rovnoma", tone: "bg-info/15 text-info border-info/30" },
  article:   { label: "📰 Maqola",      tone: "bg-surface-2 text-foreground border-border" },
  update:    { label: "",                tone: "" },
};

/** Pull test-score chips like "IELTS: 7.0" / "SAT: 1390" / "GPA: 3.9" from content. */
function extractScoreChips(content: string): string[] {
  const out: string[] = [];
  const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bIELTS[^\d]{0,4}(\d(?:\.\d)?)/i, (m) => `IELTS: ${m[1]}`],
    [/\bTOEFL[^\d]{0,4}(\d{2,3})/i,     (m) => `TOEFL: ${m[1]}`],
    [/\bSAT[^\d]{0,4}(\d{3,4})/i,       (m) => `SAT: ${m[1]}`],
    [/\bGPA[^\d]{0,4}(\d(?:\.\d{1,2})?)/i, (m) => `GPA: ${m[1]}`],
    [/\bACT[^\d]{0,4}(\d{2})/i,         (m) => `ACT: ${m[1]}`],
  ];
  for (const [rx, fmt] of patterns) {
    const m = content.match(rx);
    if (m) out.push(fmt(m));
  }
  return out;
}

export function PostCard({ post, onDeleted }: { post: PostWithAuthor; onDeleted?: (id: string) => void }) {
  const { user } = useAuth();
  const isGU = post.profiles.user_type === "gu";
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ownership: post.author_id is a profile id. Resolve current user's profile id.
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setMyProfileId(null); return; }
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setMyProfileId(data?.id ?? null));
  }, [user]);
  const isOwner = !!myProfileId && myProfileId === post.author_id;

  // Edit + delete state
  const [content, setContent] = useState(post.content);
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    const shareData = { title: post.title || "Uniin post", text: post.content?.slice(0, 120) || "", url };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* user cancelled */ }
    }
    copyLink();
  };

  const saveEdit = async () => {
    const text = editValue.trim();
    if (!text) return;
    setSavingEdit(true);
    const { error } = await supabase.from("posts").update({ content: text }).eq("id", post.id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    setContent(text);
    setEditOpen(false);
    toast.success("Post yangilandi");
  };

  const deletePost = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    setConfirmDelete(false);
    setDeleted(true);
    toast.success("Post o'chirildi");
    onDeleted?.(post.id);
  };


  // Reaction counts summary
  const [reactCounts, setReactCounts] = useState<Record<string, number>>({});
  const reactTotal = Object.values(reactCounts).reduce((a, b) => a + b, 0);
  const topReacts = Object.entries(reactCounts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(1, 3);

  useEffect(() => {
    supabase.from("post_reactions").select("reaction").eq("post_id", post.id).then(({ data }) => {
      const next: Record<string, number> = {};
      (data || []).forEach((r: any) => { next[r.reaction] = (next[r.reaction] || 0) + 1; });
      setReactCounts(next);
    });
  }, [post.id]);

  const toggleCommentLike = (id: string) =>
    setLikedComments((s) => ({ ...s, [id]: !s[id] }));

  const replyToComment = (name?: string) => {
    if (name) setNewComment((v) => (v.startsWith(`@${name}`) ? v : `@${name} ${v}`));
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  // Realtime comment subscription whenever comments are open
  useEffect(() => {
    if (!showComments) return;
    const ch = supabase.channel(`post-${post.id}-comments`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${post.id}` },
        async (payload: any) => {
          // Fetch profile for the new comment
          const { data: p } = await supabase.from("profiles")
            .select("id, full_name, avatar_url, user_type")
            .eq("id", payload.new.author_id).maybeSingle();
          setComments((cs) => {
            if (cs.some((c) => c.id === payload.new.id)) return cs;
            return [...cs, { ...payload.new, profiles: p }];
          });
          setCommentCount((n) => n + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showComments, post.id]);


  const loadComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setCommentsLoading(true);
      const { data } = await supabase.from("post_comments")
        .select("id, content, created_at, author_id, profiles!post_comments_author_id_fkey(id, full_name, avatar_url, user_type)")
        .eq("post_id", post.id).order("created_at", { ascending: true });
      setComments(data || []);
      setCommentsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const postComment = async () => {
    const text = newComment.trim();
    if (!text || !user || posting) return;
    setPosting(true);
    const { data: profile } = await supabase.from("profiles").select("id, full_name, avatar_url, user_type").eq("user_id", user.id).single();
    if (!profile) { setPosting(false); return; }
    const { data } = await supabase.from("post_comments")
      .insert({ post_id: post.id, author_id: profile.id, content: text })
      .select("id, content, created_at, author_id, profiles!post_comments_author_id_fkey(id, full_name, avatar_url, user_type)").single();
    if (data) {
      setComments((c) => c.some((x) => x.id === data.id) ? c : [...c, data]);
      setCommentCount((n) => n + 1);
    }
    setNewComment("");
    setPosting(false);
    inputRef.current?.focus();
  };

  const chips = useMemo(() => extractScoreChips(post.content), [post.content]);
  const targetFlags = !isGU ? countriesToFlags(post.profiles.target_countries) : "";
  const postTypeMeta = POST_TYPE_LABEL[post.post_type] || POST_TYPE_LABEL.update;

  if (deleted) return null;

  return (
    <article id={`post-${post.id}`} className={`surface-card p-5 transition-colors ${isGU ? "gu-accent-border" : ""}`}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/profile/$id" params={{ id: post.profiles.id }} className="shrink-0">
          <Avatar className={`size-11 ${isGU ? "ring-2 ring-gold/40" : ""}`}>
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-surface-2">{post.profiles.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/profile/$id"
              params={{ id: post.profiles.id }}
              className="font-semibold hover:underline truncate max-w-[180px]"
            >
              {post.profiles.full_name}
            </Link>
            <UserBadge
              type={post.profiles.user_type}
              university={post.gu_uni?.university_name}
              country={post.gu_uni?.country}
              grade={!isGU ? post.profiles.grade : null}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            {isGU && post.gu_uni?.university_name && (
              <span className="truncate max-w-[260px]">{post.gu_uni.university_name}</span>
            )}
            {isGU && post.gu_uni?.university_name && <span>·</span>}
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-surface-2" aria-label="More">
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={copyLink}>
              <Link2 size={14} className="mr-2" /> Havoladan nusxa olish
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setEditValue(content); setEditOpen(true); }}>
                  <Pencil size={14} className="mr-2" /> Tahrirlash
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" /> O'chirish
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Meta chip row — post type, major, target countries, score */}
      {(postTypeMeta.label || post.profiles.intended_major || targetFlags || chips.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {postTypeMeta.label && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${postTypeMeta.tone}`}>
              {postTypeMeta.label}
            </span>
          )}
          {post.profiles.intended_major && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 border border-border">
              🎯 {post.profiles.intended_major}
            </span>
          )}
          {targetFlags && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 border border-border">
              {targetFlags}
            </span>
          )}
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold"
            >
              <Sparkles size={10} /> {c}
            </span>
          ))}
        </div>
      )}

      {/* Title (for poll/article) */}
      {post.title && <h2 className="mt-3 text-lg font-display font-semibold">{post.title}</h2>}

      {/* Body */}
      {content && (
        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed break-words">
          {content}
        </div>
      )}


      {/* Poll */}
      {post.post_type === "poll" && Array.isArray(post.poll_options) && post.poll_options.length > 0 && (
        <PollBlock postId={post.id} options={post.poll_options as string[]} />
      )}

      {post.media_urls?.length > 0 && (
        <div className={`mt-3 grid gap-2 rounded-lg overflow-hidden ${post.media_urls.length > 1 ? "grid-cols-2" : ""}`}>
          {post.media_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-[420px]" />
          ))}
        </div>
      )}

      {/* Counts strip — LinkedIn style: reactions left, comments right */}
      {(reactTotal > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          {reactTotal > 1 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {topReacts.map(([t]) => (
                  <span key={t} className="size-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[11px]">
                    {REACTIONS.find((r) => r.type === t)?.emoji}
                  </span>
                ))}
              </div>
              <span>{reactTotal}</span>
            </div>
          )}
          {commentCount > 0 && (
            <button onClick={loadComments} className="hover:underline ml-auto">
              {commentCount} ta izoh
            </button>
          )}
        </div>
      )}

      {/* Action bar — LinkedIn style: equally spaced, breathing room */}
      <div className="mt-2 pt-1 border-t border-border">
        <div className="flex items-stretch justify-between gap-1 sm:gap-2 text-sm text-muted-foreground">
          <div className="flex-1 min-w-0"><ReactionBar postId={post.id} /></div>
          <button
            onClick={loadComments}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg hover:bg-surface-2 transition-colors ${showComments ? "text-foreground font-semibold" : ""}`}
          >
            <MessageCircle className="size-[18px]" />
            <span className="hidden sm:inline">Izoh</span>
          </button>
          <button onClick={sharePost} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg hover:bg-surface-2 transition-colors">
            <Share2 className="size-[18px]" />
            <span className="hidden sm:inline">Ulashish</span>
          </button>

        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {commentsLoading && (
            <div className="text-xs text-muted-foreground text-center py-2">Yuklanmoqda…</div>
          )}
          {!commentsLoading && comments.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Hali izoh yo'q. Birinchi bo'lib yozing 👇
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Link to="/profile/$id" params={{ id: c.profiles?.id }} className="shrink-0">
                <Avatar className="size-8">
                  <AvatarImage src={c.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">{c.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-surface-2 rounded-2xl px-3 py-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      to="/profile/$id"
                      params={{ id: c.profiles?.id }}
                      className="text-xs font-semibold hover:underline"
                    >
                      {c.profiles?.full_name}
                    </Link>
                    {c.profiles?.user_type === "gu" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
                        G.U.
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-0.5 break-words whitespace-pre-wrap">{c.content}</div>
                </div>
                <div className="flex items-center gap-3 mt-1 px-3 text-[11px] text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  <button
                    onClick={() => toggleCommentLike(c.id)}
                    className={`hover:text-foreground font-medium ${likedComments[c.id] ? "text-primary" : ""}`}
                  >
                    Like
                  </button>
                  <button
                    onClick={() => replyToComment(c.profiles?.full_name?.split(" ")[0])}
                    className="hover:text-foreground font-medium"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Composer */}
          {user && (
            <div className="flex gap-2 items-end pt-1">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      postComment();
                    }
                  }}
                  rows={1}
                  placeholder="Izoh yozing..."
                  className="w-full bg-surface-2 rounded-2xl pl-3 pr-10 py-2 text-sm border border-border focus:outline-none focus:border-primary resize-none max-h-32"
                />
                <button
                  type="button"
                  className="absolute right-2 bottom-2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label="Emoji"
                >
                  <Smile size={16} />
                </button>
              </div>
              <button
                onClick={postComment}
                disabled={!newComment.trim() || posting}
                className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

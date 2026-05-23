import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "./UserBadge";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";

type PostWithAuthor = {
  id: string; content: string; media_urls: string[]; post_type: string;
  likes_count: number; comments_count: number; created_at: string; author_id: string;
  profiles: { id: string; full_name: string; avatar_url: string | null; user_type: "gu" | "prep"; intended_major: string | null };
  gu_uni?: { university_name: string; country: string } | null;
};

export function PostCard({ post }: { post: PostWithAuthor }) {
  const { user } = useAuth();
  const isGU = post.profiles.user_type === "gu";
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, post.id]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLiked(false); setLikes(l => l - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      setLiked(true); setLikes(l => l + 1);
    }
  };

  const loadComments = async () => {
    setShowComments(s => !s);
    if (!showComments) {
      const { data } = await supabase.from("post_comments")
        .select("id, content, created_at, author_id, profiles!post_comments_author_id_fkey(id, full_name, avatar_url, user_type)")
        .eq("post_id", post.id).order("created_at", { ascending: true });
      setComments(data || []);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) return;
    const { data } = await supabase.from("post_comments").insert({ post_id: post.id, author_id: profile.id, content: newComment.trim() })
      .select("id, content, created_at, author_id, profiles!post_comments_author_id_fkey(id, full_name, avatar_url, user_type)").single();
    if (data) setComments(c => [...c, data]);
    setNewComment("");
  };

  return (
    <article className={`surface-card p-5 ${isGU ? "gu-accent-border" : ""}`}>
      <div className="flex items-start gap-3">
        <Link to="/profile/$id" params={{ id: post.profiles.id }}>
          <Avatar className="size-11">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback>{post.profiles.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/profile/$id" params={{ id: post.profiles.id }} className="font-semibold hover:underline">{post.profiles.full_name}</Link>
            <UserBadge type={post.profiles.user_type} />
            <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isGU && post.gu_uni ? `${post.gu_uni.university_name}` : post.profiles.intended_major ? `Targeting ${post.profiles.intended_major}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</div>

      {post.media_urls?.length > 0 && (
        <div className="mt-3 grid gap-2 rounded-lg overflow-hidden">
          {post.media_urls.map((url, i) => <img key={i} src={url} alt="" className="w-full rounded-lg" />)}
        </div>
      )}

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors ${liked ? "text-primary" : ""}`}>
          <Heart className={`size-4 ${liked ? "fill-primary" : ""}`} /> <span>{likes}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors">
          <MessageCircle className="size-4" /> <span>{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors ml-auto">
          <Share2 className="size-4" />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="size-7"><AvatarImage src={c.profiles?.avatar_url} /><AvatarFallback>{c.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 bg-surface-2 rounded-lg px-3 py-2">
                <div className="text-xs font-semibold">{c.profiles?.full_name}</div>
                <div className="text-sm">{c.content}</div>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && postComment()}
              placeholder="Write a comment..."
              className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-primary" />
            <button onClick={postComment} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Send</button>
          </div>
        </div>
      )}
    </article>
  );
}

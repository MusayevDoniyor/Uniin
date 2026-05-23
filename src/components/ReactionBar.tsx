import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ReactionType = "like" | "insightful" | "congrats" | "support" | "curious";

export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "like",       emoji: "👍", label: "Like",       color: "text-info" },
  { type: "insightful", emoji: "💡", label: "Insightful", color: "text-gold" },
  { type: "congrats",   emoji: "🎉", label: "Congrats",   color: "text-success" },
  { type: "support",    emoji: "❤️", label: "Support",    color: "text-primary" },
  { type: "curious",    emoji: "🤔", label: "Curious",    color: "text-accent" },
];

export function ReactionBar({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [mine, setMine] = useState<ReactionType | null>(null);
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    like: 0, insightful: 0, congrats: 0, support: 0, curious: 0,
  });
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("post_reactions").select("user_id, reaction").eq("post_id", postId);
    const next: Record<ReactionType, number> = { like: 0, insightful: 0, congrats: 0, support: 0, curious: 0 };
    let userPick: ReactionType | null = null;
    (data || []).forEach((r: any) => {
      next[r.reaction as ReactionType] = (next[r.reaction as ReactionType] || 0) + 1;
      if (user && r.user_id === user.id) userPick = r.reaction;
    });
    setCounts(next);
    setMine(userPick);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [postId, user?.id]);

  const pick = async (r: ReactionType) => {
    if (!user) return;
    setOpen(false);
    if (mine === r) {
      setMine(null);
      setCounts((c) => ({ ...c, [r]: Math.max(0, c[r] - 1) }));
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      return;
    }
    const prev = mine;
    setMine(r);
    setCounts((c) => ({
      ...c,
      [r]: c[r] + 1,
      ...(prev ? { [prev]: Math.max(0, c[prev] - 1) } : {}),
    }));
    if (prev) await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, reaction: r });
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = (Object.entries(counts) as [ReactionType, number][])
    .filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const current = REACTIONS.find((x) => x.type === mine);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => pick(mine || "like")}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-surface-2 transition-colors w-full ${mine ? `${current?.color} font-semibold` : "text-muted-foreground"}`}
      >
        <span className="text-base leading-none">{current?.emoji || "👍"}</span>
        <span className="text-sm">{current?.label || "Like"}</span>
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 p-1.5 rounded-full bg-popover border border-border shadow-xl animate-in fade-in slide-in-from-bottom-1 z-10"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => pick(r.type)}
              title={r.label}
              className={`size-10 rounded-full hover:bg-surface-2 flex items-center justify-center text-2xl transition-transform hover:scale-125 ${mine === r.type ? "bg-surface-2" : ""}`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

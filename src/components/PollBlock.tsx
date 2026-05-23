import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Check } from "lucide-react";

export function PollBlock({ postId, options }: { postId: string; options: string[] }) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<number[]>(options.map(() => 0));
  const [myVote, setMyVote] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("poll_votes").select("option_index, user_id").eq("post_id", postId);
    const next = options.map(() => 0);
    let mine: number | null = null;
    (data || []).forEach((v: any) => {
      if (next[v.option_index] !== undefined) next[v.option_index]++;
      if (user && v.user_id === user.id) mine = v.option_index;
    });
    setVotes(next);
    setMyVote(mine);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [postId, user?.id]);

  const vote = async (idx: number) => {
    if (!user || voting) return;
    setVoting(true);
    if (myVote === idx) {
      await supabase.from("poll_votes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else if (myVote !== null) {
      await supabase.from("poll_votes").update({ option_index: idx }).eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("poll_votes").insert({ post_id: postId, user_id: user.id, option_index: idx });
    }
    await load();
    setVoting(false);
  };

  const total = votes.reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, i) => {
        const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
        const picked = myVote === i;
        return (
          <button
            key={i}
            onClick={() => vote(i)}
            disabled={voting}
            className={`relative w-full text-left rounded-lg border overflow-hidden transition-colors ${picked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <div
              className={`absolute inset-y-0 left-0 ${picked ? "bg-primary/15" : "bg-surface-2"} transition-all`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 truncate font-medium">
                {picked && <Check className="size-4 text-primary shrink-0" />}
                {opt}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{pct}% · {votes[i]}</span>
            </div>
          </button>
        );
      })}
      <div className="text-xs text-muted-foreground">{total} ta ovoz · {myVote !== null ? "Tanlovingizni o'zgartirish uchun bosing" : "Ovoz berish uchun bosing"}</div>
    </div>
  );
}

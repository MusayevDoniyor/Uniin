import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "@/components/UserBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: () => <RequireAuth><ExplorePage /></RequireAuth>,
});

function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Explore people</h1>
      <Tabs defaultValue="gu">
        <TabsList>
          <TabsTrigger value="gu">🎓 Find Mentors (G.U.)</TabsTrigger>
          <TabsTrigger value="prep">📚 Find Peers (Prep)</TabsTrigger>
        </TabsList>
        <TabsContent value="gu" className="mt-4"><PeopleGrid type="gu" /></TabsContent>
        <TabsContent value="prep" className="mt-4"><PeopleGrid type="prep" /></TabsContent>
      </Tabs>
    </div>
  );
}

function PeopleGrid({ type }: { type: "gu" | "prep" }) {
  const [people, setPeople] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*").eq("user_type", type).eq("onboarding_complete", true)
      .order("rank_score", { ascending: false }).limit(60)
      .then(({ data }) => setPeople(data || []));
  }, [type]);

  const filtered = q ? people.filter(p => p.full_name?.toLowerCase().includes(q.toLowerCase()) || p.intended_major?.toLowerCase().includes(q.toLowerCase())) : people;
  const maxRank = Math.max(...people.map(p => p.rank_score || 0), 1);

  return (
    <>
      <div className="relative mb-4">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or major..." className="pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <Link key={p.id} to="/profile/$id" params={{ id: p.id }} className="surface-card p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <Avatar className="size-12"><AvatarImage src={p.avatar_url} /><AvatarFallback>{p.full_name?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1.5">{p.full_name} <UserBadge type={p.user_type} className="!text-[10px]" /></div>
                <div className="text-xs text-muted-foreground truncate">{p.city || ""} · {p.intended_major || ""}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(p.extracurriculars || []).slice(0, 3).map((e: string) => <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2">{e}</span>)}
                </div>
                <div className="mt-2">
                  <div className="text-[10px] text-muted-foreground mb-1">Profile strength</div>
                  <div className="h-1 bg-surface-2 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-gold" style={{ width: `${Math.min(100, ((p.rank_score || 0) / maxRank) * 100)}%` }} /></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No people yet — invite some.</div>}
      </div>
    </>
  );
}

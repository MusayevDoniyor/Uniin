import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { UNIVERSITIES, SCHOLARSHIPS } from "@/lib/data/universities";
import { Search, ExternalLink, GraduationCap, Award } from "lucide-react";

export const Route = createFileRoute("/universities")({
  component: () => <RequireAuth><UniPage /></RequireAuth>,
});

function UniPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Universities & Scholarships</h1>
      <Tabs defaultValue="unis">
        <TabsList>
          <TabsTrigger value="unis"><GraduationCap className="size-4 mr-1.5" />World Universities</TabsTrigger>
          <TabsTrigger value="schols"><Award className="size-4 mr-1.5" />Scholarships</TabsTrigger>
        </TabsList>
        <TabsContent value="unis" className="mt-4"><Unis /></TabsContent>
        <TabsContent value="schols" className="mt-4"><Schols /></TabsContent>
      </Tabs>
    </div>
  );
}

function Unis() {
  const [q, setQ] = useState("");
  const list = q ? UNIVERSITIES.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.country.toLowerCase().includes(q.toLowerCase())) : UNIVERSITIES;
  return (
    <>
      <div className="relative mb-3"><Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="pl-9" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.slice(0, 60).map(u => (
          <div key={u.name} className="surface-card p-4">
            <div className="flex items-start justify-between">
              <div><div className="font-semibold">{u.flag} {u.name}</div><div className="text-xs text-muted-foreground mt-0.5">{u.country}</div></div>
              <span className="text-xs font-bold text-gold">QS #{u.qsRank}</span>
            </div>
            {u.acceptance && <div className="text-xs text-muted-foreground mt-2">Acceptance rate: <span className="text-foreground font-semibold">{u.acceptance}%</span></div>}
          </div>
        ))}
      </div>
    </>
  );
}

function Schols() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {SCHOLARSHIPS.map(s => (
        <div key={s.name} className="surface-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1"><div className="font-semibold">{s.flag} {s.name}</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded bg-success/15 text-success">{s.funding}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-info/15 text-info">{s.level}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{s.desc}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">📅 {s.deadline}</span>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Learn more <ExternalLink className="size-3" /></a>
          </div>
        </div>
      ))}
    </div>
  );
}

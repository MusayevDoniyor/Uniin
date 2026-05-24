import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { Users, Plus, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/groups/")({
  component: () => <RequireAuth><Groups /></RequireAuth>,
});

function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set());
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("groups").select("*").order("member_count", { ascending: false });
    setGroups(data || []);
    if (user) {
      const { data: mems } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
      setMyMemberships(new Set((mems || []).map((m: any) => m.group_id)));
    }
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!name.trim() || !user) return;
    const { data, error } = await supabase.from("groups").insert({
      name: name.trim(), description: desc.trim(), category: cat.trim(), creator_id: user.id,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Group created!");
    setOpen(false); setName(""); setDesc(""); setCat("");
    // Creator is auto-added as admin by DB trigger — just reload
    load();
  };

  const join = async (gid: string) => {
    if (!user) return;
    if (myMemberships.has(gid)) return;
    setBusy(gid);
    const { error } = await supabase.from("group_members").insert({ group_id: gid, user_id: user.id });
    setBusy(null);
    if (error) {
      if (error.code === "23505") {
        // already a member — sync state silently
        setMyMemberships(prev => new Set(prev).add(gid));
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Joined!");
    setMyMemberships(prev => new Set(prev).add(gid));
    load();
  };

  const leave = async (gid: string) => {
    if (!user) return;
    setBusy(gid);
    const { error } = await supabase.from("group_members").delete().eq("group_id", gid).eq("user_id", user.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setMyMemberships(prev => { const n = new Set(prev); n.delete(gid); return n; });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Guruhlar</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-accent rounded-full"><Plus className="size-4 mr-1.5" />Guruh yaratish</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-5 py-4 border-b border-border">
              <DialogTitle className="text-base flex items-center gap-2"><Users className="size-4 text-primary" /> Yangi guruh yaratish</DialogTitle>
            </DialogHeader>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="size-14 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xl font-bold text-primary">
                  {name.trim()?.[0]?.toUpperCase() || "G"}
                </div>
                <div className="text-xs text-muted-foreground">Guruh kompaniya, fan klubi yoki yo'nalishga oid bo'lishi mumkin.</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Guruh nomi *</label>
                <Input placeholder="masalan: MIT Application 2026" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
                <div className="text-[10px] text-muted-foreground text-right">{name.length}/60</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tavsif</label>
                <Textarea placeholder="Bu guruh nima haqida? Kim qo'shilishi kerak?" value={desc} onChange={e => setDesc(e.target.value)} maxLength={400} rows={3} />
                <div className="text-[10px] text-muted-foreground text-right">{desc.length}/400</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategoriya</label>
                <Input placeholder="USA · CS · IELTS · Scholarships..." value={cat} onChange={e => setCat(e.target.value)} maxLength={40} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-surface-2/30">
              <Button variant="ghost" onClick={() => setOpen(false)}>Bekor qilish</Button>
              <Button onClick={create} disabled={!name.trim()} className="bg-primary hover:bg-accent rounded-full px-5">Yaratish</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12"><Users className="size-10 mx-auto mb-2 opacity-50" />No groups yet — be the first.</div>}
        {groups.map(g => {
          const joined = myMemberships.has(g.id);
          const isCreator = g.creator_id === user?.id;
          const groupHref = g.slug || g.id;
          return (
            <div key={g.id} className="surface-card p-4">
              <Link to="/groups/$slug" params={{ slug: groupHref }} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold hover:underline">{g.name}</div>
                  {isCreator && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold/15 text-gold uppercase">Owner</span>}
                </div>
                {g.category && <div className="text-xs text-info mt-0.5">{g.category}</div>}
                {g.slug && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">/{g.slug}</div>}
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{g.description}</p>
              </Link>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3" />{g.member_count} members</span>
                {isCreator ? (
                  <span className="text-xs text-muted-foreground">You manage this</span>
                ) : joined ? (
                  <Button size="sm" variant="outline" onClick={() => leave(g.id)} disabled={busy === g.id}>
                    <Check className="size-3.5 mr-1" /> Joined
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => join(g.id)} disabled={busy === g.id} className="bg-primary hover:bg-accent">Join</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { Users, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/groups")({
  component: () => <RequireAuth><Groups /></RequireAuth>,
});

function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("groups").select("*").order("member_count", { ascending: false });
    setGroups(data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name || !user) return;
    const { data, error } = await supabase.from("groups").insert({ name, description: desc, category: cat, creator_id: user.id }).select().single();
    if (error) return toast.error(error.message);
    if (data) await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
    toast.success("Group created!"); setOpen(false); setName(""); setDesc(""); setCat(""); load();
  };

  const join = async (gid: string) => {
    if (!user) return;
    const { error } = await supabase.from("group_members").insert({ group_id: gid, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Joined!"); load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-accent"><Plus className="size-4 mr-1.5" />Create group</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create a group</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
              <Textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
              <Input placeholder="Category (e.g. USA, CS, IELTS)" value={cat} onChange={e => setCat(e.target.value)} />
              <Button onClick={create} className="w-full bg-primary">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12"><Users className="size-10 mx-auto mb-2 opacity-50" />No groups yet — be the first.</div>}
        {groups.map(g => (
          <div key={g.id} className="surface-card p-4">
            <div className="font-semibold">{g.name}</div>
            {g.category && <div className="text-xs text-info mt-0.5">{g.category}</div>}
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{g.description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{g.member_count} members</span>
              <Button size="sm" variant="outline" onClick={() => join(g.id)}>Join</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Video, Plus, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions")({
  component: () => <RequireAuth><Sessions /></RequireAuth>,
});

function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", guest_user_id: "", scheduled_at: "", duration_minutes: 60, session_type: "video" as const, notes: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("sessions").select("*").or(`host_id.eq.${user.id},guest_id.eq.${user.id}`).order("scheduled_at").then(({ data }) => setSessions(data || []));
    supabase.from("profiles").select("id, user_id, full_name").eq("onboarding_complete", true).limit(50).then(({ data }) => setPeople((data || []).filter(p => p.user_id !== user.id)));
  }, [user]);

  const schedule = async () => {
    if (!user || !form.guest_user_id || !form.title || !form.scheduled_at) return toast.error("Fill all fields");
    const { error } = await supabase.from("sessions").insert({
      host_id: user.id, guest_id: form.guest_user_id, title: form.title,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes, session_type: form.session_type, notes: form.notes,
    });
    if (error) return toast.error(error.message);
    toast.success("Session scheduled!"); setOpen(false);
    supabase.from("sessions").select("*").or(`host_id.eq.${user.id},guest_id.eq.${user.id}`).order("scheduled_at").then(({ data }) => setSessions(data || []));
  };

  const upcoming = sessions.filter(s => new Date(s.scheduled_at) > new Date() && s.status !== "cancelled");
  const past = sessions.filter(s => new Date(s.scheduled_at) <= new Date());

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-sm text-muted-foreground">Book 1:1 mentor calls or join events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/events" className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-surface">Events</Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-primary hover:bg-accent"><Plus className="size-4 mr-1.5" />Schedule</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Schedule session</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Select value={form.guest_user_id} onValueChange={v => setForm(f => ({ ...f, guest_user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                  <SelectContent>{people.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
                <Select value={String(form.duration_minutes)} onValueChange={v => setForm(f => ({ ...f, duration_minutes: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="30">30 min</SelectItem><SelectItem value="60">60 min</SelectItem><SelectItem value="90">90 min</SelectItem></SelectContent>
                </Select>
                <Select value={form.session_type} onValueChange={v => setForm(f => ({ ...f, session_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="chat">Chat</SelectItem></SelectContent>
                </Select>
                <Textarea placeholder="Notes / agenda" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <Button onClick={schedule} className="w-full bg-primary">Schedule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <Video className="size-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No upcoming sessions</h3>
              <p className="text-sm text-muted-foreground mb-4">Book your first session with a mentor.</p>
              <Link to="/explore" className="inline-flex px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-accent">Find a mentor →</Link>
            </div>
          ) : <div className="space-y-2">{upcoming.map(s => <SessionCard key={s.id} s={s} />)}</div>}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? <div className="surface-card p-6 text-sm text-muted-foreground text-center">No past sessions.</div>
            : <div className="space-y-2">{past.map(s => <SessionCard key={s.id} s={s} past />)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionCard({ s, past }: any) {
  const isLive = !past && Math.abs(new Date(s.scheduled_at).getTime() - Date.now()) < 1000 * 60 * 15;
  return (
    <div className={`surface-card p-4 flex items-center gap-4 ${isLive ? "border-success/50" : ""}`}>
      <div className={`size-10 rounded-full flex items-center justify-center ${isLive ? "bg-success/20 text-success" : past ? "bg-surface-2 text-muted-foreground" : "bg-info/20 text-info"}`}>
        <Video className="size-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">{s.title}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <Calendar className="size-3" /> {format(new Date(s.scheduled_at), "PPp")}
          <Clock className="size-3 ml-2" /> {s.duration_minutes}min
        </div>
      </div>
      {isLive && <Button size="sm" className="bg-success hover:bg-success/90">Join Now</Button>}
    </div>
  );
}

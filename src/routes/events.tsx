import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Users, Loader2, Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/events")({
  component: () => <RequireAuth><EventsPage /></RequireAuth>,
});

function EventsPage() {
  const { profile, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const isGU = profile?.user_type === "gu";

  const load = async () => {
    const { data } = await supabase.from("events")
      .select("*, host:profiles!events_host_id_fkey(id, full_name, avatar_url, user_type)")
      .order("scheduled_at", { ascending: true });
    setEvents(data || []);
    if (user) {
      const { data: r } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id);
      setRsvps(new Set((r || []).map((x: any) => x.event_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const toggleRsvp = async (eventId: string) => {
    if (!user) return;
    if (rsvps.has(eventId)) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      const next = new Set(rsvps); next.delete(eventId); setRsvps(next);
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
      setRsvps(new Set(rsvps).add(eventId));
      toast.success("RSVP qabul qilindi");
    }
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Tadbirlar</h1>
          <p className="text-sm text-muted-foreground">G.U. talabalari tomonidan o'tkaziladigan AMA va seminarlar</p>
        </div>
        {isGU && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> Yangi tadbir</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yangi tadbir yaratish</DialogTitle></DialogHeader>
              <CreateEventForm onDone={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        : events.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <Calendar className="size-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Hozircha tadbir yo'q</h3>
            <p className="text-sm text-muted-foreground">G.U. talabalari yaqinda AMA va seminarlar o'tkazadi.</p>
          </div>
        ) : events.map((ev) => {
          const going = rsvps.has(ev.id);
          const when = new Date(ev.scheduled_at);
          const isPast = when < new Date();
          return (
            <div key={ev.id} className="surface-card p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-24 shrink-0 rounded-lg bg-primary/10 text-primary p-3 text-center">
                  <div className="text-xs font-medium uppercase">{format(when, "MMM")}</div>
                  <div className="text-2xl font-bold">{format(when, "d")}</div>
                  <div className="text-xs">{format(when, "HH:mm")}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{ev.title}</h3>
                    {ev.host?.user_type === "gu" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">G.U.</span>}
                  </div>
                  {ev.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ev.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {ev.attendee_count} ishtirokchi</span>
                    <span>{ev.duration_minutes} daqiqa</span>
                    {ev.host && <span>Host: {ev.host.full_name}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 sm:items-end">
                  {!isPast && (
                    <Button onClick={() => toggleRsvp(ev.id)} variant={going ? "outline" : "default"} size="sm">
                      {going ? <><CheckCircle2 className="size-4 mr-1.5" /> Going</> : "RSVP"}
                    </Button>
                  )}
                  {ev.room_url && going && (
                    <Button asChild size="sm" variant="ghost"><a href={ev.room_url} target="_blank" rel="noreferrer"><Video className="size-4 mr-1.5" /> Join</a></Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function CreateEventForm({ onDone }: { onDone: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [roomUrl, setRoomUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile || !title || !scheduledAt) return toast.error("Sarlavha va sana majburiy");
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      host_id: profile.id, title, description, scheduled_at: scheduledAt,
      duration_minutes: duration, room_url: roomUrl || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Tadbir yaratildi");
    onDone();
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Tadbir nomi" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Tavsif" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <Input type="number" min="15" step="15" value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Daqiqa" />
      </div>
      <Input placeholder="Meet/Zoom havola (ixtiyoriy)" value={roomUrl} onChange={(e) => setRoomUrl(e.target.value)} />
      <Button onClick={submit} disabled={busy} className="w-full">{busy ? <Loader2 className="size-4 animate-spin" /> : "Yaratish"}</Button>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: () => <RequireAuth><Notifications /></RequireAuth>,
});

type Notif = { id: string; content: string; read: boolean; created_at: string; type: string };

function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      setNotifs((data as Notif[]) || []);
    };
    load();
    const ch = supabase.channel("notifs-page").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAll = async () => {
    if (!user) return;
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    toast.success("Hammasi o'qildi deb belgilandi");
  };

  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const remove = async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} ta o'qilmagan</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll}>
            <CheckCheck className="size-4 mr-1" /> Hammasini o'qish
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {notifs.length === 0 ? (
          <div className="surface-card p-12 text-center text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-50" />No notifications yet
          </div>
        ) : notifs.map(n => (
          <SwipeRow key={n.id} notif={n} onRead={() => markRead(n.id)} onDelete={() => remove(n.id)} />
        ))}
      </div>
    </div>
  );
}

function SwipeRow({ notif, onRead, onDelete }: { notif: Notif; onRead: () => void; onDelete: () => void }) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const triggered = useRef(false);

  const onStart = (x: number) => { startX.current = x; triggered.current = false; };
  const onMove = (x: number) => {
    if (startX.current === null) return;
    const delta = x - startX.current;
    // clamp: swipe right (read) up to 120, left (delete) up to -120
    setDx(Math.max(-140, Math.min(140, delta)));
  };
  const onEnd = () => {
    if (startX.current === null) return;
    if (dx > 80 && !notif.read) { triggered.current = true; onRead(); }
    else if (dx < -80) { triggered.current = true; onDelete(); }
    setDx(0);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div className={`flex items-center gap-2 text-success transition-opacity ${dx > 20 ? "opacity-100" : "opacity-0"}`}>
          <Check className="size-5" /><span className="text-sm font-medium">O'qildi</span>
        </div>
        <div className={`flex items-center gap-2 text-destructive transition-opacity ${dx < -20 ? "opacity-100" : "opacity-0"}`}>
          <span className="text-sm font-medium">O'chirish</span><Trash2 className="size-5" />
        </div>
      </div>

      <div
        className={`surface-card p-4 select-none touch-pan-y ${!notif.read ? "border-primary/40 bg-primary/5" : ""}`}
        style={{ transform: `translateX(${dx}px)`, transition: startX.current === null ? "transform 0.2s ease" : "none" }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => { if (startX.current !== null) onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={() => { if (startX.current !== null) onEnd(); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!notif.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
              <div className="text-sm">{notif.content}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!notif.read && (
              <Button variant="ghost" size="icon" className="size-8" onClick={onRead} title="O'qildi deb belgilash">
                <Check className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onDelete} title="O'chirish">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifications")({
  component: () => <RequireAuth><Notifications /></RequireAuth>,
});

function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      setNotifs(data || []);
    };
    load();
    const ch = supabase.channel("notifs-page").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={markAll}><Check className="size-4 mr-1" /> Mark all read</Button>
      </div>
      <div className="space-y-2">
        {notifs.length === 0 ? (
          <div className="surface-card p-12 text-center text-muted-foreground"><Bell className="size-8 mx-auto mb-2 opacity-50" />No notifications yet</div>
        ) : notifs.map(n => (
          <div key={n.id} className={`surface-card p-4 ${!n.read ? "border-primary/30" : ""}`}>
            <div className="text-sm">{n.content}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

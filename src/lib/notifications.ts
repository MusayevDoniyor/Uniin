// Browser notifications + realtime listener for in-app events.
import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

export function showBrowserNotification(title: string, body: string, link?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico", tag: link || title });
    if (link) n.onclick = () => { window.focus(); window.location.href = link; };
  } catch { /* ignore */ }
}

const TITLES: Record<string, string> = {
  like: "Yangi reaksiya",
  reaction: "Yangi reaksiya",
  comment: "Yangi izoh",
  follow: "Yangi obunachi",
  message: "Yangi xabar",
  purchase: "Sotuv!",
  endorsement: "Yangi tasdiq",
};

const LINKS: Record<string, (id: string | null) => string | undefined> = {
  message: (id) => id ? `/messages?c=${id}` : undefined,
  comment: () => "/feed",
  like:    () => "/feed",
  reaction:() => "/feed",
  follow:  (id) => id ? `/profile/${id}` : undefined,
};

/** Subscribe to incoming notifications for a user and trigger browser notifications. */
export function subscribeNotifications(userId: string, onIncoming?: (n: AppNotification) => void) {
  const channel = supabase
    .channel(`notif-${userId}`)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const n = payload.new as AppNotification;
        const title = TITLES[n.type] || "Uniin";
        const link = LINKS[n.type]?.(n.related_id);
        showBrowserNotification(title, n.content, link);
        onIncoming?.(n);
      })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

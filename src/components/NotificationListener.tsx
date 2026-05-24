import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ensureNotificationPermission, subscribeNotifications } from "@/lib/notifications";

/** Mounts a single subscription per session that triggers browser notifications. */
export function NotificationListener() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    ensureNotificationPermission();
    const unsub = subscribeNotifications(user.id);
    return unsub;
  }, [user?.id]);
  return null;
}

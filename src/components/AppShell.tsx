import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Compass, Users, ShoppingBag, Video, Sparkles, GraduationCap, MessageSquare, User, Bell, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { UserBadge } from "@/components/UserBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/sessions", label: "Sessions", icon: Video },
  { to: "/ai", label: "AI Advisor", icon: Sparkles },
  { to: "/universities", label: "Universities", icon: GraduationCap },
  { to: "/messages", label: "Messages", icon: MessageSquare },
];

export function AppShell({ children, rightSidebar }: { children: React.ReactNode; rightSidebar?: React.ReactNode }) {
  const { profile, user, signOut } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setUnread(count || 0);
    };
    load();
    const ch = supabase.channel("notif-count").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border p-4 sticky top-0 h-screen">
        <Link to="/feed" className="mb-8 px-2"><Logo size="md" /></Link>
        <nav className="flex-1 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}>
                <Icon className="size-5" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <button onClick={() => navigate({ to: "/profile/$id", params: { id: profile?.id || "" } })}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors mt-2">
          <Avatar className="size-9">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-sm font-semibold truncate">{profile?.full_name || "You"}</div>
            <div className="text-xs"><UserBadge type={profile?.user_type} /></div>
          </div>
          <LogOut onClick={e => { e.stopPropagation(); signOut(); }} className="size-4 text-muted-foreground hover:text-foreground" />
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex min-w-0">
        <main className="flex-1 min-w-0">
          {/* Top bar mobile */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur z-20">
            <Logo size="sm" />
            <Link to="/notifications" className="relative">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-xs flex items-center justify-center">{unread}</span>}
            </Link>
          </header>
          {/* Top bar desktop */}
          <header className="hidden md:flex items-center justify-end gap-3 p-4 sticky top-0 bg-background/80 backdrop-blur z-20 border-b border-border">
            <Link to="/notifications" className="relative p-2 hover:bg-surface rounded-lg">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-1 right-1 size-4 rounded-full bg-primary text-[10px] flex items-center justify-center font-semibold">{unread}</span>}
            </Link>
          </header>
          <div className="pb-20 md:pb-0">{children}</div>
        </main>

        {rightSidebar && <aside className="hidden lg:block w-80 shrink-0 border-l border-border p-4 sticky top-0 h-screen overflow-y-auto">{rightSidebar}</aside>}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur z-30 flex justify-around py-2">
        {[NAV[0], NAV[1], NAV[2], NAV[7]].map(item => {
          const Icon = item.icon;
          const active = loc.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="size-5" /><span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <Link to="/profile/$id" params={{ id: profile?.id || "" }} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${loc.pathname.startsWith("/profile") ? "text-primary" : "text-muted-foreground"}`}>
          <User className="size-5" /><span className="text-[10px]">Me</span>
        </Link>
      </nav>
    </div>
  );
}

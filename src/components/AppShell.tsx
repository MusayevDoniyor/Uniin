import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Compass,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  User,
  Bell,
  LogOut,
  Settings,
  Wallet,
  Crown,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { UserBadge } from "@/components/UserBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationListener } from "@/components/NotificationListener";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIMARY = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/ai", label: "AI Advisor", icon: Sparkles },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/sessions", label: "Sessions", icon: Video },
] as const;

function openComposer() {
  window.dispatchEvent(new CustomEvent("uniin:open-composer"));
}

export function AppShell({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  const { profile, user, signOut } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [wallet, setWallet] = useState<number | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!user) return;
    const loadN = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnread(count || 0);
    };
    const loadW = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance_usd")
        .eq("user_id", user.id)
        .maybeSingle();
      setWallet(data ? Number(data.balance_usd) : 0);
    };
    loadN();
    loadW();
    mounted.current = false;
    const ch = supabase
      .channel(`shell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          loadN();
          if (!mounted.current) {
            mounted.current = true;
            return;
          }
          const msg = payload?.new?.content as string | undefined;
          if (msg)
            toast(msg, {
              description: "New notification",
              action: { label: "View", onClick: () => navigate({ to: "/notifications" }) },
            });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        loadN,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
        loadW,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, navigate]);

  const profileHref = (profile as any)?.username || profile?.id || "";
  const isActive = (to: string) => loc.pathname === to || loc.pathname.startsWith(to + "/");

  const UserMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-surface p-1 pr-2 transition-colors">
          <Avatar className="size-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-9">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{profile?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{profile?.full_name || "You"}</div>
            <div className="text-xs">
              <UserBadge type={profile?.user_type} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate({ to: "/profile/$id", params: { id: profileHref } })}
        >
          <User className="size-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/sessions" })}>Sessions</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/groups" })}>Groups</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/wallet" })}>
          <Wallet className="size-4 mr-2" /> Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/premium" })}>
          <Crown className="size-4 mr-2" /> Premium
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <Settings className="size-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="size-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const WalletChip = (
    <Link
      to="/wallet"
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface text-xs font-semibold border border-border"
    >
      <Wallet className="size-3.5 text-success" />
      <span className="tabular-nums">${(wallet ?? 0).toFixed(2)}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] bg-background">
        {/* Desktop / tablet sidebar */}
        <aside
          className={`hidden md:flex ${sidebarCollapsed ? "md:w-16" : "md:w-16 lg:w-60"} shrink-0 flex-col border-r border-border p-2 lg:p-3 sticky top-0 h-screen transition-[width] duration-200`}
        >
          <div className="mb-6 flex items-center gap-2 px-2 py-1">
            <Link
              to="/feed"
              className={`flex min-w-0 flex-1 items-center ${sidebarCollapsed ? "justify-center" : "justify-center lg:justify-start"}`}
            >
              <Logo size={sidebarCollapsed ? "xs" : "lg"} />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden lg:flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground active:scale-95 transition"
              title={sidebarCollapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {PRIMARY.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const showBadge = item.to === "/messages" && unreadMsgs > 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className={`hidden ${sidebarCollapsed ? "" : "lg:inline"}`}>
                    {item.label}
                  </span>
                  {showBadge && !sidebarCollapsed && (
                    <span className="ml-auto hidden lg:inline-flex size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold items-center justify-center">
                      {unreadMsgs}
                    </span>
                  )}
                  {/* Tablet tooltip */}
                  <span
                    className={`${sidebarCollapsed ? "lg:block" : "lg:hidden"} absolute left-full ml-2 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Compact user row */}
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
            <Link
              to="/profile/$id"
              params={{ id: profileHref }}
              className="flex items-center gap-2 flex-1 min-w-0 hover:bg-surface rounded-lg p-1.5 -m-1.5 transition-colors"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className={`hidden ${sidebarCollapsed ? "" : "lg:block"} flex-1 min-w-0`}>
                <div className="text-xs font-semibold truncate leading-tight">
                  {profile?.full_name || "You"}
                </div>
                <div className="text-[10px]">
                  <UserBadge type={profile?.user_type} />
                </div>
              </div>
            </Link>
            <Link
              to="/settings"
              title="Settings"
              className={`${sidebarCollapsed ? "hidden" : "hidden lg:flex"} p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground`}
            >
              <Settings className="size-4" />
            </Link>
          </div>
        </aside>

        <div className="flex-1 flex min-w-0">
          <main className="flex-1 min-w-0">
            {/* Mobile top bar */}
            <header className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-border sticky top-0 bg-background/90 backdrop-blur z-20">
              <Link to="/feed">
                <Logo size="md" />
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  className="p-2 rounded-lg hover:bg-surface"
                >
                  <Search className="size-5" />
                </button>
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-surface">
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                      {unread}
                    </span>
                  )}
                </Link>
                <Link
                  to="/wallet"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-2 text-[11px] font-semibold border border-border"
                >
                  <Wallet className="size-3 text-success" />
                  <span className="tabular-nums">${(wallet ?? 0).toFixed(0)}</span>
                </Link>
              </div>
            </header>
            {mobileSearchOpen && (
              <div className="md:hidden p-3 border-b border-border bg-background sticky top-[57px] z-20">
                <GlobalSearch />
              </div>
            )}

            {/* Desktop top bar */}
            <header className="hidden md:flex items-center gap-3 p-3 sticky top-0 bg-background/90 backdrop-blur z-20 border-b border-border">
              <div className="flex-1 max-w-md">
                <GlobalSearch />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {WalletChip}
                <ThemeToggle />
                <Link to="/notifications" className="relative p-2 hover:bg-surface rounded-lg">
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                      {unread}
                    </span>
                  )}
                </Link>
                {UserMenu}
              </div>
            </header>

            <div className="pb-24 md:pb-0">{children}</div>
          </main>

          {rightSidebar && (
            <aside className="hidden xl:block w-72 shrink-0 border-l border-border p-4 sticky top-0 h-screen overflow-y-auto">
              {rightSidebar}
            </aside>
          )}
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur z-30 flex items-end justify-around px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <TabLink to="/feed" label="Home" icon={Home} active={isActive("/feed")} />
          <TabLink
            to="/marketplace"
            label="Market"
            icon={ShoppingBag}
            active={isActive("/marketplace")}
          />
          <button
            onClick={openComposer}
            aria-label="New post"
            className="-mt-6 size-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
          <TabLink to="/sessions" label="Sessions" icon={Video} active={isActive("/sessions")} />
          <TabLink
            to="/profile/$id"
            params={{ id: profileHref }}
            label="Profile"
            icon={User}
            active={loc.pathname.startsWith("/profile")}
          />
        </nav>

        <NotificationListener />
      </div>
    </div>
  );
}

function TabLink({
  to,
  params,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  params?: any;
  label: string;
  icon: any;
  active: boolean;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] leading-none">{label}</span>
    </Link>
  );
}

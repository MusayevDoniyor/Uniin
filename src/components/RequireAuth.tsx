import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { AppShell } from "./AppShell";
import { ReactNode } from "react";

export function RequireAuth({ children, rightSidebar }: { children: ReactNode; rightSidebar?: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" />;
  return <AppShell rightSidebar={rightSidebar}>{children}</AppShell>;
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

const SITE_URL = "https://uniin-pathways.lovable.app";
const OG_IMG = `${SITE_URL}/og-image.png`;

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 size-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.20 27), transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.18 230), transparent 70%)" }} />
      </div>
      <div className="relative z-10 max-w-lg text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <span className="text-[140px] font-black leading-none tracking-tighter bg-gradient-to-br from-primary via-foreground to-info bg-clip-text text-transparent select-none">
            404
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          Looks like this page got lost on the way to university. Let's get you back on track.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="/" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Go home
          </a>
          <a href="/feed" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors">
            Explore feed
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0F172A" },
      { title: "Uniin — College prep for ambitious Uzbek students" },
      { name: "description", content: "Uniin is the community platform where Uzbek students preparing for top universities abroad connect with G.U. mentors who've already gotten in. AI advisor, marketplace, sessions, and verified alumni." },
      { name: "keywords", content: "Uniin, Uzbekistan students, university abroad, college prep, SAT, IELTS, TOEFL, scholarships, El-Yurt Umidi, Chevening, study abroad" },
      { name: "author", content: "Uniin" },
      { property: "og:site_name", content: "Uniin" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:title", content: "Uniin — College prep for ambitious Uzbek students" },
      { property: "og:description", content: "Connect with verified Uzbek students at top universities abroad. AI advisor, mentor marketplace, 1:1 sessions." },
      { property: "og:image", content: OG_IMG },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Uniin — College prep for ambitious Uzbek students" },
      { name: "twitter:description", content: "Connect with verified Uzbek students at top universities abroad." },
      { name: "twitter:image", content: OG_IMG },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "canonical", href: SITE_URL },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('uniin-theme')||'light';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r;}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

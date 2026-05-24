import { useEffect, useRef, useState } from "react";
import { Search, X, User, FileText, ShoppingBag, Users, Calendar, GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Category = "all" | "people" | "posts" | "marketplace" | "groups" | "events" | "universities";

const CATEGORIES: { id: Category; label: string; icon: any }[] = [
  { id: "all",          label: "All",          icon: Search },
  { id: "people",       label: "People",       icon: User },
  { id: "posts",        label: "Posts",        icon: FileText },
  { id: "marketplace",  label: "Marketplace",  icon: ShoppingBag },
  { id: "groups",       label: "Groups",       icon: Users },
  { id: "events",       label: "Events",       icon: Calendar },
  { id: "universities", label: "Universities", icon: GraduationCap },
];

type Result = {
  id: string;
  type: Exclude<Category, "all">;
  title: string;
  subtitle?: string;
  avatar?: string | null;
  to: string;
  params?: Record<string, string>;
};

const UNIS = [
  "Harvard University", "MIT", "Stanford University", "Yale University", "Princeton University",
  "Columbia University", "University of Pennsylvania", "Cornell University", "Brown University",
  "Dartmouth College", "University of Chicago", "Caltech", "Duke University", "Johns Hopkins University",
  "NYU", "UC Berkeley", "UCLA", "University of Michigan", "Carnegie Mellon", "Georgia Tech",
  "Oxford", "Cambridge", "Imperial College London", "LSE", "ETH Zurich", "NUS", "Tsinghua University",
];

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category>("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(() => { void runSearch(q, cat); }, 250);
  }, [q, cat]);

  const runSearch = async (term: string, c: Category) => {
    const t = term.trim();
    if (!t) return;
    const like = `%${t}%`;
    const out: Result[] = [];

    const tasks: Promise<void>[] = [];

    if (c === "all" || c === "people") {
      tasks.push((async () => {
        const { data } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, user_type, school_name, intended_major")
          .or(`full_name.ilike.${like},username.ilike.${like},school_name.ilike.${like},intended_major.ilike.${like}`)
          .limit(c === "people" ? 20 : 5);
        (data || []).forEach((p: any) => out.push({
          id: p.id, type: "people", title: p.full_name || "User",
          subtitle: [p.username ? `@${p.username}` : null, p.user_type?.toUpperCase(), p.school_name, p.intended_major].filter(Boolean).join(" · "),
          avatar: p.avatar_url, to: "/profile/$id", params: { id: p.username || p.id },
        }));
      })());
    }

    if (c === "all" || c === "posts") {
      tasks.push((async () => {
        const { data } = await supabase.from("posts")
          .select("id, content, title")
          .or(`content.ilike.${like},title.ilike.${like}`)
          .limit(c === "posts" ? 20 : 5);
        (data || []).forEach((p: any) => out.push({
          id: p.id, type: "posts", title: p.title || p.content?.slice(0, 80) || "Post",
          subtitle: p.title ? p.content?.slice(0, 80) : undefined,
          to: "/feed",
        }));
      })());
    }

    if (c === "all" || c === "marketplace") {
      tasks.push((async () => {
        const { data } = await supabase.from("marketplace_listings")
          .select("id, title, description, price_usd, is_free, listing_type")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(c === "marketplace" ? 20 : 5);
        (data || []).forEach((l: any) => out.push({
          id: l.id, type: "marketplace", title: l.title,
          subtitle: `${l.is_free ? "Free" : `$${l.price_usd}`} · ${l.listing_type}`,
          to: "/marketplace",
        }));
      })());
    }

    if (c === "all" || c === "groups") {
      tasks.push((async () => {
        const { data } = await supabase.from("groups")
          .select("id, slug, name, description, member_count, category")
          .or(`name.ilike.${like},description.ilike.${like},category.ilike.${like}`)
          .limit(c === "groups" ? 20 : 5);
        (data || []).forEach((g: any) => out.push({
          id: g.id, type: "groups", title: g.name,
          subtitle: `${g.member_count || 0} members · ${g.category || "General"}`,
          to: "/groups/$slug", params: { slug: g.slug || g.id },
        }));
      })());
    }

    if (c === "all" || c === "events") {
      tasks.push((async () => {
        const { data } = await supabase.from("events")
          .select("id, title, description, scheduled_at")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(c === "events" ? 20 : 5);
        (data || []).forEach((e: any) => out.push({
          id: e.id, type: "events", title: e.title,
          subtitle: new Date(e.scheduled_at).toLocaleDateString(),
          to: "/events",
        }));
      })());
    }

    if (c === "all" || c === "universities") {
      const matches = UNIS.filter((u) => u.toLowerCase().includes(t.toLowerCase()))
        .slice(0, c === "universities" ? 20 : 5);
      matches.forEach((name) => out.push({
        id: name, type: "universities", title: name,
        subtitle: "University", to: "/universities",
      }));
    }

    await Promise.all(tasks);

    // simple ranking: prioritize startsWith matches
    out.sort((a, b) => {
      const aStart = a.title.toLowerCase().startsWith(t.toLowerCase()) ? 0 : 1;
      const bStart = b.title.toLowerCase().startsWith(t.toLowerCase()) ? 0 : 1;
      return aStart - bStart;
    });

    setResults(out);
    setLoading(false);
  };

  const onPick = (r: Result) => {
    setOpen(false);
    setQ("");
    if (r.params) navigate({ to: r.to as any, params: r.params as any });
    else navigate({ to: r.to as any });
  };

  const iconFor = (t: Result["type"]) => CATEGORIES.find((c) => c.id === t)?.icon || Search;

  return (
    <div ref={rootRef} className="relative flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, posts, listings, groups, events, universities…"
          className="w-full h-12 pl-12 pr-10 rounded-full bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
        />
        {q && (
          <button onClick={() => { setQ(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-2">
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"}`}
                >
                  <Icon className="size-3.5" /> {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            {!loading && q && results.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No results for "{q}"</div>
            )}
            {!loading && !q && (
              <div className="py-10 text-center text-sm text-muted-foreground">Type to search across Uniin</div>
            )}
            {!loading && results.length > 0 && (
              <div className="py-1">
                {results.map((r, i) => {
                  const Icon = iconFor(r.type);
                  return (
                    <button
                      key={`${r.type}-${r.id}-${i}`}
                      onClick={() => onPick(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors text-left"
                    >
                      {r.type === "people" ? (
                        <Avatar className="size-9">
                          <AvatarImage src={r.avatar || undefined} />
                          <AvatarFallback>{r.title[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="size-9 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{r.type}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

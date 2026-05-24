import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, PanelLeftClose, PanelLeftOpen, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/messages")({
  component: () => <RequireAuth><MessagesPage /></RequireAuth>,
  validateSearch: (s: Record<string, unknown>) => ({ c: typeof s.c === "string" ? s.c : undefined }),
});

function MessagesPage() {
  const { user } = useAuth();
  const { c } = Route.useSearch();
  const [convs, setConvs] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(c || null);
  const [listCollapsed, setListCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("conversations").select("*")
        .contains("participant_ids", [user.id]).order("last_message_at", { ascending: false });
      // load other participants
      const enriched = await Promise.all((data || []).map(async (conv: any) => {
        const otherUid = conv.participant_ids.find((id: string) => id !== user.id);
        const { data: p } = await supabase.from("profiles").select("id, full_name, avatar_url, user_type").eq("user_id", otherUid).maybeSingle();
        return { ...conv, other: p };
      }));
      setConvs(enriched);
      if (!activeId && enriched[0] && window.innerWidth >= 768) setActiveId(enriched[0].id);
    };
    load();
  }, [user]);

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-[1200px] overflow-hidden border-x border-border/40">
      <aside className={`${activeId ? "hidden md:flex" : "flex"} ${listCollapsed ? "md:w-16" : "md:w-80"} w-full shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200`}>
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          {!listCollapsed && <h2 className="font-bold">Messages</h2>}
          <button
            type="button"
            onClick={() => setListCollapsed((v) => !v)}
            className="hidden md:flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground active:scale-95 transition"
            title={listCollapsed ? "Chat ro'yxatini ochish" : "Chat ro'yxatini yopish"}
          >
            {listCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        {convs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground"><MessageSquare className="size-8 mx-auto mb-2 opacity-50" />No conversations yet</div>}
        {convs.map(c => (
          <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left p-3 flex gap-3 hover:bg-surface active:scale-[0.99] transition ${activeId === c.id ? "bg-surface" : ""}`}>
            <Avatar className="size-10"><AvatarImage src={c.other?.avatar_url} /><AvatarFallback>{c.other?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
            <div className={`${listCollapsed ? "md:hidden" : ""} flex-1 min-w-0`}>
              <div className="font-medium text-sm truncate">{c.other?.full_name || "Unknown"}</div>
              <div className="text-xs text-muted-foreground truncate">{c.last_message || "—"}</div>
            </div>
          </button>
        ))}
      </aside>
      <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
        {activeId ? <Conversation id={activeId} conv={convs.find(c => c.id === activeId)} onBack={() => setActiveId(null)} /> : <div className="h-full flex items-center justify-center text-muted-foreground">Pick a conversation</div>}
      </div>
    </div>
  );
}

function Conversation({ id, conv, onBack }: { id: string; conv: any; onBack: () => void }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at");
      setMsgs(data || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    load();
    const ch = supabase.channel(`msgs-${id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
      (payload) => { setMsgs(m => [...m, payload.new]); setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const send = async () => {
    if (!text.trim() || !user) return;
    const t = text.trim(); setText("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, content: t });
    await supabase.from("conversations").update({ last_message: t, last_message_at: new Date().toISOString() }).eq("id", id);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-3 md:p-4 border-b border-border flex items-center gap-3">
        <button type="button" onClick={onBack} className="md:hidden size-9 rounded-md flex items-center justify-center hover:bg-surface active:scale-95 transition" aria-label="Back to chats">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar className="size-9"><AvatarImage src={conv?.other?.avatar_url} /><AvatarFallback>{conv?.other?.full_name?.[0]}</AvatarFallback></Avatar>
        <div className="font-semibold truncate">{conv?.other?.full_name || "—"}</div>
      </header>
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
        {msgs.map(m => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[84%] md:max-w-[70%] break-words rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-surface"}`}>
                {m.content}
                <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2 bg-background">
        <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." />
        <Button onClick={send} className="bg-primary hover:bg-accent"><Send className="size-4" /></Button>
      </div>
    </div>
  );
}

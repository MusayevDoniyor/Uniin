import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadge } from "@/components/UserBadge";
import { ShoppingBag, Plus, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace")({
  component: () => <RequireAuth><Marketplace /></RequireAuth>,
});

function Marketplace() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", listing_type: "essay", price_usd: "", is_free: false, preview_content: "" });

  const load = async () => {
    const { data } = await supabase.from("marketplace_listings")
      .select("*, profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url, user_type)")
      .eq("status", "active").order("created_at", { ascending: false });
    setListings(data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!profile || profile.user_type !== "gu") return toast.error("Only G.U. students can create listings.");
    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: profile.id, title: form.title, description: form.description,
      listing_type: form.listing_type as any, price_usd: form.is_free ? null : parseFloat(form.price_usd),
      is_free: form.is_free, preview_content: form.preview_content,
    });
    if (error) return toast.error(error.message);
    toast.success("Listing live!"); setOpen(false); load();
  };

  const buy = async (l: any) => {
    if (!user) return;
    await supabase.from("listing_purchases").insert({ listing_id: l.id, buyer_id: user.id, amount_usd: l.price_usd });
    toast.info("Payment coming soon — purchase request created. Seller will be notified.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        {profile?.user_type === "gu" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-primary hover:bg-accent"><Plus className="size-4 mr-1.5" />New listing</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Create a listing</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <Select value={form.listing_type} onValueChange={v => setForm(f => ({ ...f, listing_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_package">Full Package</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="chat_call">Chat & Call</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Price USD (leave blank for free)" type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: e.target.value, is_free: !e.target.value }))} />
                <Textarea placeholder="Preview (10% — what buyers see)" value={form.preview_content} onChange={e => setForm(f => ({ ...f, preview_content: e.target.value }))} />
                <Button onClick={create} className="w-full bg-primary">Submit listing</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {listings.length === 0 && <div className="text-center text-muted-foreground py-12"><ShoppingBag className="size-10 mx-auto mb-2 opacity-50" />Marketplace is empty.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map(l => (
          <button key={l.id} onClick={() => setActive(l)} className="surface-card p-4 text-left hover:border-primary/40">
            <div className="flex items-center gap-2">
              <Avatar className="size-7"><AvatarImage src={l.profiles?.avatar_url} /><AvatarFallback>{l.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
              <span className="text-sm font-medium">{l.profiles?.full_name}</span>
              <UserBadge type={l.profiles?.user_type} className="!text-[9px]" />
            </div>
            <div className="font-semibold mt-2">{l.title}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description}</div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs px-2 py-0.5 rounded bg-surface-2">{l.listing_type.replace("_"," ")}</span>
              <span className="font-bold text-primary">{l.is_free ? "Free" : `$${l.price_usd}`}</span>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={v => !v && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active && <>
            <DialogHeader><DialogTitle>{active.title}</DialogTitle></DialogHeader>
            <div className="text-sm text-muted-foreground">by {active.profiles?.full_name}</div>
            <p className="text-sm mt-2">{active.description}</p>
            <div className="relative mt-4 surface-card p-4 no-screenshot" style={{ userSelect: "none" }} onContextMenu={e => e.preventDefault()}>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><ShieldCheck className="size-3 text-success" /> Screenshot protection enabled · Preview (10%)</div>
              <div className="relative max-h-48 overflow-hidden">
                <p className="text-sm whitespace-pre-wrap">{active.preview_content || "Preview content not provided."}</p>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent flex items-end justify-center">
                  <Lock className="size-5 text-muted-foreground mb-1" />
                </div>
              </div>
              <div className="text-center mt-3 text-xs text-muted-foreground">Purchase to unlock full content</div>
            </div>
            <Button onClick={() => buy(active)} className="w-full mt-4 bg-primary hover:bg-accent">{active.is_free ? "Get free" : `Buy for $${active.price_usd}`}</Button>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

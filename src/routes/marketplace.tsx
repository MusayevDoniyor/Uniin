import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { UserBadge } from "@/components/UserBadge";
import { ShoppingBag, Plus, Lock, ShieldCheck, X, Upload, Image as ImageIcon, Tag, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace")({
  component: () => <RequireAuth><Marketplace /></RequireAuth>,
});

const TYPES = [
  { v: "full_package", l: "Full Application Package" },
  { v: "essay", l: "Essay / Personal Statement" },
  { v: "portfolio", l: "Portfolio" },
  { v: "chat_call", l: "1:1 Chat & Call" },
];

type Form = {
  title: string;
  description: string;
  listing_type: string;
  price_usd: string;
  is_free: boolean;
  preview_content: string;
  cover_image_url: string;
  tags: string[];
  what_included: string;
  delivery_time: string;
};

const EMPTY_FORM: Form = {
  title: "", description: "", listing_type: "essay", price_usd: "",
  is_free: false, preview_content: "", cover_image_url: "",
  tags: [], what_included: "", delivery_time: "3 days",
};

function Marketplace() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("marketplace_listings")
      .select("*, profiles!marketplace_listings_seller_id_fkey(id, full_name, avatar_url, user_type)")
      .eq("status", "active").order("created_at", { ascending: false });
    setListings(data || []);
  };
  useEffect(() => { load(); }, []);

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (!v || form.tags.includes(v) || form.tags.length >= 6) return;
    setForm(f => ({ ...f, tags: [...f.tags, v] }));
    setTagInput("");
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("listing-content").upload(path, file);
    if (error) return toast.error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("listing-content").getPublicUrl(path);
    setForm(f => ({ ...f, cover_image_url: publicUrl }));
  };

  const create = async () => {
    if (!profile || profile.user_type !== "gu") return toast.error("Only G.U. students can create listings.");
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (!form.is_free && (!form.price_usd || Number(form.price_usd) <= 0)) return toast.error("Set a price or mark as free");

    setSubmitting(true);
    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: profile.id,
      title: form.title.trim(),
      description: form.description.trim(),
      listing_type: form.listing_type as any,
      price_usd: form.is_free ? null : parseFloat(form.price_usd),
      is_free: form.is_free,
      preview_content: form.preview_content,
      cover_image_url: form.cover_image_url || null,
      tags: form.tags,
      what_included: form.what_included || null,
      delivery_time: form.delivery_time || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Listing live!");
    setForm(EMPTY_FORM); setOpen(false); load();
  };

  const buy = async (l: any) => {
    if (!user) return;
    if (l.is_free) {
      await supabase.from("listing_purchases").insert({ listing_id: l.id, buyer_id: user.id, amount_usd: 0, status: "completed" as any });
      toast.success("Unlocked! Check Wallet for receipt.");
      setActive(null);
      return;
    }
    const amount = Number(l.price_usd);
    // Ensure wallet exists
    let { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
    if (!wallet) {
      const { data: w } = await supabase.from("wallets").insert({ user_id: user.id }).select().single();
      wallet = w;
    }
    if (!wallet || Number(wallet.balance_usd) < amount) {
      toast.error("Insufficient balance. Top up your wallet first.");
      window.location.href = "/wallet";
      return;
    }
    const platformFee = +(amount * 0.1).toFixed(2);
    const sellerPayout = +(amount - platformFee).toFixed(2);
    // Deduct from buyer balance, create escrow holding seller payout
    const { error: e1 } = await supabase.from("wallets").update({ balance_usd: Number(wallet.balance_usd) - amount }).eq("user_id", user.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from("escrow_transactions").insert({
      buyer_id: user.id, seller_id: l.seller_id, listing_id: l.id,
      amount_usd: amount, platform_fee_usd: platformFee, seller_payout_usd: sellerPayout,
    });
    if (e2) return toast.error(e2.message);
    await supabase.from("listing_purchases").insert({ listing_id: l.id, buyer_id: user.id, amount_usd: amount, status: "completed" as any });
    await supabase.from("notifications").insert({ user_id: user.id, type: "purchase", content: `Escrow opened for "${l.title}". Funds release in 7 days.` });
    toast.success("Purchase complete — funds held in escrow for 7 days.");
    setActive(null);
  };

  const filtered = filter === "all" ? listings : listings.filter(l => l.listing_type === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Resources, mentorship, and packages from verified G.U. students.</p>
        </div>
        {profile?.user_type === "gu" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent"><Plus className="size-4 mr-1.5" />New listing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create a listing</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* Cover */}
                <div>
                  <Label>Cover image (optional)</Label>
                  <label className="mt-1.5 cursor-pointer block">
                    {form.cover_image_url ? (
                      <div className="relative h-40 rounded-lg overflow-hidden border border-border">
                        <img src={form.cover_image_url} alt="cover" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))} className="absolute top-2 right-2 size-7 rounded-full bg-background/80 flex items-center justify-center"><X className="size-4" /></button>
                      </div>
                    ) : (
                      <div className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50">
                        <Upload className="size-5 mb-1" />
                        <span className="text-xs">Upload cover (max 5MB)</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} maxLength={80} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5" placeholder="MIT Common App essay — admitted 2024" />
                    <span className="text-[10px] text-muted-foreground">{form.title.length}/80</span>
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.listing_type} onValueChange={v => setForm(f => ({ ...f, listing_type: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea value={form.description} maxLength={500} rows={3} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" placeholder="What makes this valuable for prep students?" />
                  <span className="text-[10px] text-muted-foreground">{form.description.length}/500</span>
                </div>

                <div>
                  <Label>What's included</Label>
                  <Textarea value={form.what_included} maxLength={300} rows={2} onChange={e => setForm(f => ({ ...f, what_included: e.target.value }))} className="mt-1.5" placeholder="• Full essay&#10;• Brainstorm notes&#10;• 30-min call" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 flex items-end gap-3">
                    <div className="flex-1">
                      <Label>Price (USD)</Label>
                      <Input type="number" min="0" max="9999" step="0.01" disabled={form.is_free} value={form.is_free ? "" : form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: e.target.value }))} className="mt-1.5" placeholder="29.99" />
                    </div>
                    <label className="flex items-center gap-2 text-xs pb-2.5">
                      <Switch checked={form.is_free} onCheckedChange={v => setForm(f => ({ ...f, is_free: v }))} />
                      Free
                    </label>
                  </div>
                  <div>
                    <Label>Delivery</Label>
                    <Select value={form.delivery_time} onValueChange={v => setForm(f => ({ ...f, delivery_time: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{["Instant","1 day","3 days","1 week","2 weeks"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags (up to 6)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input value={tagInput} maxLength={20} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="e.g. ivy-league" />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 text-xs">
                        #{t}
                        <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}><X className="size-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Preview (10% — what buyers see before purchase)</Label>
                  <Textarea value={form.preview_content} rows={3} onChange={e => setForm(f => ({ ...f, preview_content: e.target.value }))} className="mt-1.5" placeholder="The opening paragraph or sample chunk..." />
                </div>

                <Button onClick={create} disabled={submitting} className="w-full bg-primary hover:bg-accent">
                  {submitting ? "Publishing..." : "Publish listing"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 -mx-1 px-1 pb-1">
        {[{ v: "all", l: "All" }, ...TYPES].map(t => (
          <button key={t.v} onClick={() => setFilter(t.v)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${filter === t.v ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50 text-muted-foreground"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16 surface-card">
          <ShoppingBag className="size-10 mx-auto mb-2 opacity-50" />
          <p>No listings here yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <button key={l.id} onClick={() => setActive(l)} className="surface-card overflow-hidden text-left hover:border-primary/40 transition-colors group">
            {l.cover_image_url ? (
              <div className="h-32 overflow-hidden bg-surface-2">
                <img src={l.cover_image_url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ) : (
              <div className="h-32 bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="size-6"><AvatarImage src={l.profiles?.avatar_url} /><AvatarFallback>{l.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                <span className="text-xs font-medium truncate">{l.profiles?.full_name}</span>
                <UserBadge type={l.profiles?.user_type} className="!text-[9px]" />
              </div>
              <div className="font-semibold leading-snug line-clamp-2">{l.title}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description}</div>
              {l.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">{l.tags.slice(0,3).map((t: string) => <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>)}</div>
              )}
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 capitalize">{l.listing_type.replace("_"," ")}</span>
                <span className="font-bold text-primary">{l.is_free ? "Free" : `$${l.price_usd}`}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={v => !v && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {active && <>
            {active.cover_image_url && <div className="h-40 -m-6 mb-2 overflow-hidden"><img src={active.cover_image_url} alt={active.title} className="w-full h-full object-cover" /></div>}
            <DialogHeader><DialogTitle>{active.title}</DialogTitle></DialogHeader>
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="size-7"><AvatarImage src={active.profiles?.avatar_url} /><AvatarFallback>{active.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
              <span>by {active.profiles?.full_name}</span>
              <UserBadge type={active.profiles?.user_type} className="!text-[9px]" />
            </div>
            <p className="text-sm mt-2">{active.description}</p>

            {active.what_included && (
              <div className="surface-card p-3 mt-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">What's included</div>
                <p className="text-sm whitespace-pre-wrap">{active.what_included}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              {active.delivery_time && <span className="flex items-center gap-1"><Clock className="size-3" /> {active.delivery_time}</span>}
              {active.tags?.length > 0 && active.tags.map((t: string) => <span key={t} className="flex items-center gap-0.5"><Tag className="size-3" />{t}</span>)}
            </div>

            <div className="relative mt-4 surface-card p-4 no-screenshot" onContextMenu={e => e.preventDefault()}>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><ShieldCheck className="size-3 text-success" /> Screenshot protection · Preview (10%)</div>
              <div className="relative max-h-48 overflow-hidden">
                <p className="text-sm whitespace-pre-wrap">{active.preview_content || "No preview provided."}</p>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent flex items-end justify-center">
                  <Lock className="size-5 text-muted-foreground mb-1" />
                </div>
              </div>
              <div className="text-center mt-3 text-xs text-muted-foreground">Purchase to unlock full content</div>
            </div>
            {!active.is_free && active.escrow_enabled !== false && (
              <div className="surface-card p-3 mt-4 bg-success/5 border-success/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-success mb-1.5"><ShieldCheck className="size-3.5" /> Escrow protected</div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between"><span>Price</span><span>${Number(active.price_usd).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Platform fee (10%)</span><span>−${(Number(active.price_usd) * 0.1).toFixed(2)}</span></div>
                  <div className="flex justify-between text-foreground font-semibold pt-1 border-t border-border/50"><span>Seller receives in 7 days</span><span>${(Number(active.price_usd) * 0.9).toFixed(2)}</span></div>
                </div>
              </div>
            )}
            <Button onClick={() => buy(active)} className="w-full mt-4 bg-primary hover:bg-accent">
              {active.is_free ? "Get for free" : `Buy for $${active.price_usd} · Escrow`}
            </Button>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

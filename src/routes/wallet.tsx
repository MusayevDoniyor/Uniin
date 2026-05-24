import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/wallet")({
  component: () => <RequireAuth><WalletPage /></RequireAuth>,
});

function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [topups, setTopups] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: w }, { data: t }, { data: wd }] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_topups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (!w) {
      const { data: created } = await supabase.from("wallets").insert({ user_id: user.id }).select().single();
      setWallet(created);
    } else setWallet(w);
    setTopups(t || []);
    setWithdrawals(wd || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Balance card */}
      <div className="surface-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 100% 0%, var(--primary), transparent 60%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><WalletIcon className="size-4" /> Hamyon</div>
          <div className="mt-2 text-4xl font-display font-bold">${Number(wallet?.balance_usd || 0).toFixed(2)}</div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-3 surface-card bg-surface-2">
              <div className="text-xs text-muted-foreground">Kutilayotgan</div>
              <div className="text-lg font-bold">${Number(wallet?.pending_usd || 0).toFixed(2)}</div>
            </div>
            <div className="p-3 surface-card bg-surface-2">
              <div className="text-xs text-muted-foreground">Jami daromad</div>
              <div className="text-lg font-bold">${Number(wallet?.total_earned_usd || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <TopupForm onDone={load} />
        <WithdrawForm balance={Number(wallet?.balance_usd || 0)} onDone={load} />
      </div>

      <TxList title="To'ldirishlar" items={topups} kind="topup" />
      <TxList title="Yechib olishlar" items={withdrawals} kind="withdraw" />
    </div>
  );
}

function TopupForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("10");
  const [provider, setProvider] = useState<"uzum" | "stripe">("uzum");
  const [busy, setBusy] = useState(false);
  const quickAmounts = [5, 10, 25, 50];

  const submit = async () => {
    const a = Number(amount);
    if (!user || !a || a < 1) return toast.error("Minimum $1");
    setBusy(true);
    const { error } = await supabase.from("wallet_topups").insert({ user_id: user.id, amount_usd: a, provider, status: "completed" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Hamyon qo'lda to'ldirildi");
    onDone();
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-1"><ArrowDownToLine className="size-4 text-success" /><h3 className="font-semibold">Hamyonni qo'lda to'ldirish</h3></div>
      <p className="text-xs text-muted-foreground mb-3">Payment ulanmaguncha summa darhol balansga qo'shiladi.</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Miqdor (USD)</label>
          <Input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className={`rounded-md border border-border px-2 py-1.5 text-xs font-semibold transition active:scale-95 ${amount === String(value) ? "bg-primary text-primary-foreground" : "bg-surface-2 hover:bg-surface"}`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Yo'l</label>
          <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uzum">Manual demo top-up</SelectItem>
              <SelectItem value="stripe">Manual international</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={submit} disabled={busy} className="w-full active:scale-[0.99] transition">{busy ? <Loader2 className="size-4 animate-spin" /> : "Balansga qo'shish"}</Button>
      </div>
    </div>
  );
}

function WithdrawForm({ balance, onDone }: { balance: number; onDone: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("10");
  const [provider, setProvider] = useState<"uzum" | "stripe">("uzum");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const a = Number(amount);
    if (!user || !a) return;
    if (a < 10) return toast.error("Minimum $10");
    if (a > balance) return toast.error("Balans yetarli emas");
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({ user_id: user.id, amount_usd: a, provider });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Yechib olish so'rovi qabul qilindi");
    onDone();
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-3"><ArrowUpFromLine className="size-4 text-primary" /><h3 className="font-semibold">Pulni yechib olish</h3></div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Miqdor (USD, min $10)</label>
          <Input type="number" min="10" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Provayder</label>
          <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uzum">Uzum</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={submit} disabled={busy} variant="outline" className="w-full">{busy ? <Loader2 className="size-4 animate-spin" /> : "Yechib olish"}</Button>
      </div>
    </div>
  );
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="size-3.5 text-muted-foreground" />,
  completed: <CheckCircle2 className="size-3.5 text-success" />,
  approved: <CheckCircle2 className="size-3.5 text-success" />,
  failed: <XCircle className="size-3.5 text-destructive" />,
  rejected: <XCircle className="size-3.5 text-destructive" />,
};

function TxList({ title, items, kind }: { title: string; items: any[]; kind: "topup" | "withdraw" }) {
  if (!items.length) return null;
  return (
    <div className="surface-card p-5">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
            <div>
              <div className="font-semibold text-sm">{kind === "topup" ? "+" : "−"}${Number(tx.amount_usd).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground capitalize">{tx.provider} · {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs capitalize">
              {STATUS_ICON[tx.status] || <Clock className="size-3.5" />} {tx.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

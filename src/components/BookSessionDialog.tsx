import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video } from "lucide-react";
import { toast } from "sonner";

interface Mentor {
  /** profile.id (UUID) */
  id: string;
  /** auth user_id */
  user_id: string;
  full_name: string;
  booking_rate_usd?: number | string | null;
}

interface Props {
  /** The mentor profile to pre-select. */
  mentor: Mentor;
  /** Custom trigger element. Defaults to the "Book session" button. */
  trigger?: React.ReactNode;
  onBooked?: () => void;
}

export function BookSessionDialog({ mentor, trigger, onBooked }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    scheduled_at: "",
    duration_minutes: 60,
    session_type: "video" as "video" | "audio" | "chat",
    notes: "",
  });

  const bookingFee = Number(mentor.booking_rate_usd || 0);

  const schedule = async () => {
    try {
      if (!user) return toast.error("Tizimga kiring.");
      if (!form.title || !form.scheduled_at) return toast.error("Sarlavha va vaqtni kiriting.");
      if (mentor.user_id === user.id) return toast.error("O'zingiz bilan session yarata olmaysiz.");

      if (bookingFee > 0) {
        let { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!wallet) {
          const { data: w } = await supabase
            .from("wallets")
            .insert({ user_id: user.id })
            .select()
            .single();
          wallet = w;
        }

        if (!wallet || Number(wallet.balance_usd) < bookingFee) {
          toast.error("Yetarli balans yo'q. Avval hamyonni to'ldiring.");
          window.location.href = "/wallet";
          return;
        }

        const platformFee = +(bookingFee * 0.2).toFixed(2);
        const sellerPayout = +(bookingFee - platformFee).toFixed(2);

        const { error: escrowErr } = await supabase.from("escrow_transactions").insert({
          buyer_id: user.id,
          seller_id: mentor.id,
          listing_id: "00000000-0000-0000-0000-000000000000",
          amount_usd: bookingFee,
          platform_fee_usd: platformFee,
          seller_payout_usd: sellerPayout,
        } as any);

        if (escrowErr) return toast.error(escrowErr.message);
      }

      let formattedDate: string;
      try {
        formattedDate = new Date(form.scheduled_at).toISOString();
      } catch {
        return toast.error("Yaroqli sana va vaqt kiriting.");
      }

      const { error } = await supabase.from("sessions").insert({
        host_id: user.id,
        guest_id: mentor.user_id,
        title: form.title,
        scheduled_at: formattedDate,
        duration_minutes: form.duration_minutes,
        session_type: form.session_type,
        notes: form.notes,
      });

      if (error) return toast.error(error.message);

      toast.success(
        bookingFee > 0
          ? `Session bron qilindi · $${bookingFee.toFixed(2)} escrow'ga olindi`
          : "Session scheduled!",
      );

      setOpen(false);
      setForm({
        title: "",
        scheduled_at: "",
        duration_minutes: 60,
        session_type: "video",
        notes: "",
      });
      onBooked?.();
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err?.message || "Kutilmagan xatolik yuz berdi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="shadow-lg">
            <Video className="size-4 mr-1.5" /> Book session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a session with {mentor.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Session title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
          />
          <Select
            value={String(form.duration_minutes)}
            onValueChange={(v) => setForm((f) => ({ ...f, duration_minutes: parseInt(v) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="60">60 min</SelectItem>
              <SelectItem value="90">90 min</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={form.session_type}
            onValueChange={(v) => setForm((f) => ({ ...f, session_type: v as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Notes / agenda (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {bookingFee > 0 && (
            <div className="rounded-md border border-gold/30 bg-gold/5 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Booking fee</span>
                <span>${bookingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform (20%)</span>
                <span>−${(bookingFee * 0.2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-border/50">
                <span>Mentor receives in 7 days</span>
                <span>${(bookingFee * 0.8).toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button onClick={schedule} className="w-full bg-primary hover:bg-accent">
            {bookingFee > 0 ? `Pay $${bookingFee.toFixed(2)} & schedule` : "Schedule session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

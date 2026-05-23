import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DEFAULT_AVATARS } from "@/lib/data/avatars";
import { Sparkles } from "lucide-react";

export function AvatarPicker({ onPick, trigger }: { onPick: (url: string) => void; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button type="button" className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-sm hover:bg-surface">
            <Sparkles className="size-4 mr-1.5" /> Pick default
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Pick a default avatar</DialogTitle></DialogHeader>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {DEFAULT_AVATARS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => { onPick(url); setOpen(false); }}
              className="size-16 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors bg-surface-2"
            >
              <img src={url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

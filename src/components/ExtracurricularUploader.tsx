import { useState } from "react";
import { Plus, X, Pencil, Upload, Link as LinkIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { EC_CATEGORIES, type ECCategory } from "@/lib/data/presets";

export type ECItem = {
  title: string;
  category: ECCategory;
  description?: string;
  role?: string;
  link?: string;
  file_url?: string;
};

type Props = { value: ECItem[]; onChange: (v: ECItem[]) => void };

export function ExtracurricularUploader({ value, onChange }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<ECItem>({ title: "", category: "Academic", description: "", role: "", link: "", file_url: "" });
  const [uploading, setUploading] = useState(false);

  const openNew  = () => { setDraft({ title:"", category:"Academic", description:"", role:"", link:"", file_url:"" }); setEditIdx(null); setOpen(true); };
  const openEdit = (i: number) => { setDraft(value[i]); setEditIdx(i); setOpen(true); };
  const save = () => {
    if (!draft.title.trim()) return toast.error("Sarlavha kerak");
    const next = [...value];
    if (editIdx === null) next.push(draft); else next[editIdx] = draft;
    onChange(next);
    setOpen(false);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/ec-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("post-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);
    setDraft(d => ({ ...d, file_url: publicUrl }));
    setUploading(false);
  };

  // Group by category
  const grouped: Record<string, { item: ECItem; idx: number }[]> = {};
  value.forEach((it, idx) => {
    const k = it.category || "Other";
    (grouped[k] ||= []).push({ item: it, idx });
  });

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FolderOpen className="size-3" /> {cat}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map(({ item, idx }) => (
              <div key={idx} className="surface-card p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.title}</div>
                  {item.role && <div className="text-xs text-muted-foreground truncate">{item.role}</div>}
                  {item.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</div>}
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-info hover:underline inline-flex items-center gap-0.5"><LinkIcon className="size-3" /> Link</a>}
                    {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">Fayl</a>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => openEdit(idx)} className="p-1 rounded hover:bg-surface-2 text-muted-foreground"><Pencil className="size-3.5" /></button>
                  <button type="button" onClick={() => remove(idx)} className="p-1 rounded hover:bg-surface-2 text-muted-foreground"><X className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" onClick={openNew} className="w-full border-dashed">
            <Plus className="size-4 mr-1.5" /> Faoliyat qo'shish
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editIdx === null ? "Faoliyat qo'shish" : "Faoliyatni tahrirlash"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Sarlavha *</Label>
              <Input value={draft.title} maxLength={80} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Masalan: Robotics jamoasi kapitani" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Kategoriya</Label>
              <Select value={draft.category} onValueChange={v => setDraft(d => ({ ...d, category: v as ECCategory }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Roli (ixtiyoriy)</Label>
              <Input value={draft.role || ""} maxLength={60} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))} placeholder="Kapitan / a'zo / asoschisi" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tafsilot</Label>
              <Textarea value={draft.description || ""} maxLength={400} rows={3} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Nima qildingiz va qanday natijaga erishdingiz" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><LinkIcon className="size-3" /> Havola (ixtiyoriy)</Label>
              <Input value={draft.link || ""} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Fayl (PDF / rasm — ixtiyoriy)</Label>
              <div className="mt-1 flex items-center gap-3">
                {draft.file_url && <a href={draft.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate max-w-[180px]">Joriy fayl</a>}
                <Label className="cursor-pointer">
                  <span className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-xs hover:bg-surface">
                    <Upload className="size-3.5 mr-1.5" />{uploading ? "Yuklanmoqda…" : draft.file_url ? "Almashtirish" : "Yuklash"}
                  </span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadFile} />
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button onClick={save} className="bg-primary hover:bg-accent">Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

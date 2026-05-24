import { useState } from "react";
import { Plus, X, Award, Calendar, Pencil, Upload, ImageIcon, Link as LinkIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { CERTIFICATE_PRESETS } from "@/lib/data/presets";

export type Certification = {
  name: string;
  issuer: string;
  issue_date: string;
  credential_url?: string;
  image_url?: string;
};

type Props = {
  value: Certification[];
  onChange: (next: Certification[]) => void;
  compact?: boolean;
};

export function CertificateEditor({ value, onChange, compact }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Certification>({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [nameMode, setNameMode] = useState<"preset" | "custom">("preset");

  const openNew = () => { setDraft({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" }); setEditIdx(null); setNameMode("preset"); setOpen(true); };
  const openEdit = (i: number) => { setDraft(value[i]); setEditIdx(i); setNameMode(CERTIFICATE_PRESETS.includes(value[i].name as any) ? "preset" : "custom"); setOpen(true); };
  const save = () => {
    if (!draft.name.trim() || !draft.issuer.trim()) return;
    const next = [...value];
    if (editIdx === null) next.push(draft);
    else next[editIdx] = draft;
    onChange(next); setOpen(false);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/cert-${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setDraft(d => ({ ...d, image_url: publicUrl }));
    setUploading(false);
  };

  const isPdf = (url?: string) => !!url && /\.pdf(\?|$)/i.test(url);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className={compact ? "grid gap-2" : "grid sm:grid-cols-2 gap-2"}>
          {value.map((c, i) => (
            <div key={i} className="surface-card p-3 flex items-start gap-3">
              {c.image_url ? (
                isPdf(c.image_url) ? (
                  <a href={c.image_url} target="_blank" rel="noreferrer" className="size-12 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0" title="PDFni ko'rish">
                    <FileText className="size-5" />
                  </a>
                ) : (
                  <img src={c.image_url} alt={c.name} className="size-12 rounded-md object-cover shrink-0" />
                )
              ) : (
                <div className="size-12 rounded-md bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <Award className="size-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.issuer}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {c.issue_date && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{c.issue_date}</div>}
                  {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-[11px] text-info hover:underline inline-flex items-center gap-0.5"><LinkIcon className="size-3" /> Link</a>}
                </div>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(i)} className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground"><Pencil className="size-3.5" /></button>
                <button type="button" onClick={() => remove(i)} className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground"><X className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" onClick={openNew} className="w-full border-dashed">
            <Plus className="size-4 mr-1.5" /> Add certification
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editIdx === null ? "Add" : "Edit"} certification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              {nameMode === "preset" ? (
                <Select value={draft.name} onValueChange={(v) => { if (v === "__custom__") { setNameMode("custom"); setDraft(d => ({ ...d, name: "" })); } else { setDraft(d => ({ ...d, name: v })); } }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sertifikat turini tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CERTIFICATE_PRESETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    <SelectItem value="__custom__">+ Boshqa (o'zim yozaman)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input value={draft.name} maxLength={80} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Sertifikat nomi" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setNameMode("preset")}>Ro'yxatdan</Button>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Issuing organization *</Label>
              <Input value={draft.issuer} maxLength={80} onChange={e => setDraft(d => ({ ...d, issuer: e.target.value }))} placeholder="British Council" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Issue date</Label>
              <Input type="month" value={draft.issue_date} onChange={e => setDraft(d => ({ ...d, issue_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><LinkIcon className="size-3" /> Credential URL (optional)</Label>
              <Input value={draft.credential_url || ""} onChange={e => setDraft(d => ({ ...d, credential_url: e.target.value }))} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><ImageIcon className="size-3" /> Certificate (rasm yoki PDF — ixtiyoriy)</Label>
              <div className="mt-1 flex items-center gap-3">
                {draft.image_url && (
                  isPdf(draft.image_url) ? (
                    <a href={draft.image_url} target="_blank" rel="noreferrer" className="size-14 rounded-md bg-destructive/10 text-destructive flex items-center justify-center border border-border" title="PDF">
                      <FileText className="size-6" />
                    </a>
                  ) : (
                    <img src={draft.image_url} alt="preview" className="size-14 rounded-md object-cover border border-border" />
                  )
                )}
                <Label className="cursor-pointer">
                  <span className="inline-flex items-center px-3 py-2 rounded-md border border-border bg-surface-2 text-xs hover:bg-surface">
                    <Upload className="size-3.5 mr-1.5" />{uploading ? "Uploading…" : draft.image_url ? "Almashtirish" : "Yuklash (rasm/PDF)"}
                  </span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadImage} />
                </Label>
                {draft.image_url && (
                  <button type="button" onClick={() => setDraft(d => ({ ...d, image_url: "" }))} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                )}
              </div>
            </div>
            <Button onClick={save} className="w-full bg-primary hover:bg-accent">Save certification</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

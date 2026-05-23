import { useState } from "react";
import { Plus, X, Award, Calendar, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type Certification = {
  name: string;
  issuer: string;
  issue_date: string; // YYYY-MM
  credential_url?: string;
};

type Props = {
  value: Certification[];
  onChange: (next: Certification[]) => void;
  compact?: boolean;
};

export function CertificateEditor({ value, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Certification>({ name: "", issuer: "", issue_date: "", credential_url: "" });

  const openNew = () => { setDraft({ name: "", issuer: "", issue_date: "", credential_url: "" }); setEditIdx(null); setOpen(true); };
  const openEdit = (i: number) => { setDraft(value[i]); setEditIdx(i); setOpen(true); };
  const save = () => {
    if (!draft.name.trim() || !draft.issuer.trim()) return;
    const next = [...value];
    if (editIdx === null) next.push(draft);
    else next[editIdx] = draft;
    onChange(next); setOpen(false);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className={compact ? "grid gap-2" : "grid sm:grid-cols-2 gap-2"}>
          {value.map((c, i) => (
            <div key={i} className="surface-card p-3 flex items-start gap-3">
              <div className="size-9 rounded-md bg-gold/15 text-gold flex items-center justify-center shrink-0">
                <Award className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.issuer}</div>
                {c.issue_date && <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar className="size-3" />{c.issue_date}</div>}
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
              <Input value={draft.name} maxLength={80} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="IELTS Academic" className="mt-1" />
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
              <Label className="text-xs">Credential URL (optional)</Label>
              <Input value={draft.credential_url || ""} onChange={e => setDraft(d => ({ ...d, credential_url: e.target.value }))} placeholder="https://..." className="mt-1" />
            </div>
            <Button onClick={save} className="w-full bg-primary hover:bg-accent">Save certification</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

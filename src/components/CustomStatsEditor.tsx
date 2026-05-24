import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export type CustomStat = { label: string; value: string };

const SUGGESTIONS = ["ACT","AP Calculus","AP Physics","AP Chemistry","AP Biology","AP Literature","SAT II","GRE","GMAT","Duolingo","Cambridge CAE","DELF B2","TOPIK","JLPT N2"];

export function CustomStatsEditor({ value, onChange }: { value: CustomStat[]; onChange: (v: CustomStat[]) => void }) {
  const [label, setLabel] = useState("");
  const [val, setVal]   = useState("");

  const add = () => {
    const l = label.trim(); const v = val.trim();
    if (!l || !v) return;
    onChange([...(value || []), { label: l, value: v }]);
    setLabel(""); setVal("");
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      <Label className="text-xs">Boshqa imtihon / ball qo'shish</Label>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(s => (
          <button key={s} type="button" onClick={() => setLabel(s)}
            className="px-2 py-1 text-[11px] rounded-full border border-border hover:border-primary/50 text-muted-foreground">
            + {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-2">
        <Input className="col-span-5" maxLength={30} placeholder="Imtihon nomi (masalan ACT)" value={label} onChange={e => setLabel(e.target.value)} />
        <Input className="col-span-5" maxLength={20} placeholder="Ball (masalan 34)" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" className="col-span-2" onClick={add}><Plus className="size-4" /></Button>
      </div>
      {value?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {value.map((s, i) => (
            <div key={i} className="surface-card bg-surface-2/40 p-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">{s.label}</div>
                <div className="text-sm font-semibold truncate">{s.value}</div>
              </div>
              <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

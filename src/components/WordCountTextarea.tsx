import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useId } from "react";

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxWords: number;
  placeholder?: string;
  rows?: number;
};

export function WordCountTextarea({ label, value, onChange, maxWords, placeholder, rows = 4 }: Props) {
  const id = useId();
  const words = countWords(value);
  const over = words > maxWords;

  const handle = (v: string) => {
    const w = v.trim().split(/\s+/).filter(Boolean);
    if (w.length <= maxWords) onChange(v);
    else onChange(w.slice(0, maxWords).join(" "));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label htmlFor={id}>{label}</Label>
        <span className={`text-[11px] ${over ? "text-destructive" : "text-muted-foreground"}`}>{words}/{maxWords} words</span>
      </div>
      <Textarea id={id} value={value} onChange={e => handle(e.target.value)} placeholder={placeholder} rows={rows} />
    </div>
  );
}

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  placeholder?: string;
  notTaken: boolean;
  onToggleNotTaken: (v: boolean) => void;
  suffix?: string;
};

export function ScoreInput({
  label, value, onChange, min, max, step = 1, placeholder, notTaken, onToggleNotTaken, suffix,
}: Props) {
  const id = useId();
  const num = value === "" ? null : Number(value);
  const invalid = num !== null && (Number.isNaN(num) || num < min || num > max);

  const handleChange = (raw: string) => {
    // allow empty + digits + one dot
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) onChange(raw);
  };

  const handleBlur = () => {
    if (notTaken || value === "") return;
    const n = Number(value);
    if (Number.isNaN(n)) return;
    // Round to nearest step (e.g. 8.05 -> 8.0 for IELTS, 0.5 increments)
    if (step && step !== 1) {
      const rounded = Math.round(n / step) * step;
      // Format: if step is whole, no decimals; if step has decimals, match precision
      const decimals = step.toString().split(".")[1]?.length || 0;
      onChange(rounded.toFixed(decimals));
    }
  };

  return (
    <div className={cn("space-y-1.5", notTaken && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
          <Switch checked={notTaken} onCheckedChange={onToggleNotTaken} className="data-[state=checked]:bg-muted-foreground/40 scale-75" />
          Don't have
        </label>
      </div>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          disabled={notTaken}
          value={notTaken ? "" : value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={notTaken ? "—" : placeholder}
          className={cn(invalid && "border-destructive focus-visible:ring-destructive", suffix && "pr-12")}
        />
        {suffix && !notTaken && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{suffix}</span>
        )}
      </div>
      {invalid && (
        <p className="text-[10px] text-destructive">Must be between {min} and {max}</p>
      )}
    </div>
  );
}

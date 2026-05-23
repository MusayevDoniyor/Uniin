import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Format any input as +998 XX XXX XX XX (Uzbekistan auto-prefix).
export function formatUzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  // Drop accidental leading 0 (e.g. 0938...)
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 9));
  return parts.length ? `+998 ${parts.join(" ")}` : "+998 ";
}

export function isValidUzPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("998");
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
};

export const PhoneInput = forwardRef<HTMLInputElement, Props>(function PhoneInput(
  { value, onChange, className, placeholder = "+998 93 804 30 90", id }, ref
) {
  return (
    <Input
      ref={ref}
      id={id}
      inputMode="tel"
      autoComplete="tel"
      value={value}
      placeholder={placeholder}
      onFocus={e => { if (!value) onChange("+998 "); e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length); }}
      onChange={e => onChange(formatUzPhone(e.target.value))}
      className={cn(className)}
    />
  );
});

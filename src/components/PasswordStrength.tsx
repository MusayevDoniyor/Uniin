import { evaluatePassword } from "@/lib/password";

export function PasswordStrength({ password }: { password: string }) {
  const s = evaluatePassword(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= s.score ? s.color : "bg-muted"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Kuch: <span className="font-semibold text-foreground">{s.label}</span></span>
        {s.issues.length > 0 && <span className="text-muted-foreground truncate ml-2">Kerak: {s.issues.join(", ")}</span>}
      </div>
    </div>
  );
}

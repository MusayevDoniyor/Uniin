// Simple strong-password evaluator.
export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  issues: string[];
};

export function evaluatePassword(pw: string): PasswordStrength {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("Kamida 8 ta belgi");
  if (!/[a-z]/.test(pw)) issues.push("Kichik harf");
  if (!/[A-Z]/.test(pw)) issues.push("Katta harf");
  if (!/\d/.test(pw))    issues.push("Raqam");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("Maxsus belgi (!@#$ ...)");

  const passed = 5 - issues.length;
  let score: PasswordStrength["score"] = 0;
  if (pw.length === 0) score = 0;
  else if (passed <= 1) score = 1;
  else if (passed === 2) score = 2;
  else if (passed === 3 || passed === 4) score = 3;
  else score = 4;

  const meta = [
    { label: "—",       color: "bg-muted" },
    { label: "Juda zaif", color: "bg-destructive" },
    { label: "Zaif",     color: "bg-orange-500" },
    { label: "Yaxshi",   color: "bg-yellow-500" },
    { label: "Kuchli",   color: "bg-emerald-500" },
  ][score];

  return { score, label: meta.label, color: meta.color, issues };
}

export const isPasswordStrong = (pw: string) => evaluatePassword(pw).score >= 3;

import { GraduationCap, BookOpen, Trophy } from "lucide-react";
import { countryToFlag } from "@/lib/country-flags";

type Props = {
  type: "gu" | "prep" | null | undefined;
  className?: string;
  university?: string | null;
  country?: string | null;
  grade?: string | null;
};

/** Compact full-name uni → "MIT", "KAIST", "UCL"-style label. */
function shortUni(name: string): string {
  const paren = name.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim();
  const acronymWords = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w) && !["of", "the", "and", "for"].includes(w.toLowerCase()));
  if (acronymWords.length >= 2) {
    return acronymWords.map((w) => w[0]).join("");
  }
  return name.length > 22 ? name.slice(0, 20) + "…" : name;
}

export function UserBadge({ type, className = "", university, country, grade }: Props) {
  if (type === "gu") {
    const flag = countryToFlag(country);
    const uni = university ? shortUni(university) : null;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 text-gold border border-gold/40 px-2 py-0.5 text-xs font-semibold ${className}`}
        title={university ? `${university}${country ? ` · ${country}` : ""}` : "Graduated Uniin"}
      >
        <Trophy size={11} className="shrink-0" />
        <span>G.U.</span>
        {uni && (
          <>
            <span className="opacity-60">—</span>
            <span>{uni}</span>
          </>
        )}
        {flag && <span className="ml-0.5">{flag}</span>}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-info/15 text-info border border-info/30 px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      <BookOpen size={11} className="shrink-0" />
      <span>Prep Talaba</span>
      {grade && (
        <>
          <span className="opacity-60">·</span>
          <span>{grade}</span>
        </>
      )}
    </span>
  );
}

export function UserMiniBadge({ type }: { type: "gu" | "prep" | null | undefined }) {
  if (type === "gu") {
    return (
      <span className="inline-flex items-center justify-center size-4 rounded-full bg-gold/20 text-gold" title="G.U.">
        <GraduationCap size={10} />
      </span>
    );
  }
  return null;
}

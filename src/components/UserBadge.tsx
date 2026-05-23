import { GraduationCap, BookOpen } from "lucide-react";

export function UserBadge({ type, className = "" }: { type: "gu" | "prep" | null | undefined; className?: string }) {
  if (type === "gu") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 text-xs font-semibold ${className}`}>
        <GraduationCap size={12} /> G.U.
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-info/15 text-info border border-info/30 px-2 py-0.5 text-xs font-semibold ${className}`}>
      <BookOpen size={12} /> Prep
    </span>
  );
}

import { GraduationCap } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-xl", cap: 10 },
    md: { text: "text-3xl", cap: 14 },
    lg: { text: "text-5xl", cap: 22 },
  };
  const s = sizes[size];

  return (
    <div className={`inline-flex items-center font-display font-bold ${s.text} tracking-tight`}>
      <span style={{ color: "#0F1C3F" }} className="dark:text-white">Un</span>
      <span className="relative inline-flex items-end" style={{ color: "#0F1C3F" }}>
        <span className="dark:text-white">i</span>
        <GraduationCap
          size={s.cap}
          className="absolute -top-2 left-1/2 -translate-x-1/2"
          style={{ color: "#0F1C3F" }}
          fill="#0F1C3F"
        />
      </span>
      <span className="relative inline-flex items-end" style={{ color: "#2563EB" }}>
        <span>i</span>
        <GraduationCap
          size={s.cap}
          className="absolute -top-2 left-1/2 -translate-x-1/2"
          style={{ color: "#2563EB" }}
          fill="#2563EB"
        />
      </span>
      <span style={{ color: "#2563EB" }}>n</span>
    </div>
  );
}

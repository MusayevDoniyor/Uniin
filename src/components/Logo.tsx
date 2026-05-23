import logoSrc from "@/assets/uniin-logo.png";

const SIZES = {
  xs: "h-8",
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
} as const;

export function Logo({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <img
      src={logoSrc}
      alt="Uniin"
      className={`${SIZES[size]} w-auto select-none ${className}`}
      draggable={false}
    />
  );
}

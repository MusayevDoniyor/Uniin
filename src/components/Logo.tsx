import logoSrc from "@/assets/uniin-logo.png";

const SIZES = {
  sm: "h-7",
  md: "h-10",
  lg: "h-16",
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

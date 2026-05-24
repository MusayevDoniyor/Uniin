import logoFull from "@/assets/logo-full.png";
import logoText from "@/assets/logo-text.png";
import logoIcon from "@/assets/logo-icon.png";

const SIZES = {
  xs: "h-8",
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
} as const;

export function Logo({
  size = "md",
  variant,
  className = "",
}: {
  size?: keyof typeof SIZES;
  variant?: "full" | "text" | "icon";
  className?: string;
}) {
  const activeVariant = variant || (size === "xs" ? "icon" : "full");

  const src = {
    full: logoFull,
    text: logoText,
    icon: logoIcon,
  }[activeVariant];

  return (
    <img
      src={src}
      alt="Uniin"
      className={`${SIZES[size]} w-auto select-none ${className}`}
      draggable={false}
    />
  );
}

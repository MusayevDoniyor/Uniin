// Default avatar collection — DiceBear shapes/initials, royalty free, no auth required.
// Users can pick one if they don't want to upload their own photo.
const seeds = [
  "Atlas", "Nova", "Orion", "Lyra", "Vega", "Cosmo", "Aria", "Zenith",
  "Echo", "Quasar", "Iris", "Pluto", "Sage", "Aspen", "Rune", "Onyx",
];

const STYLES = ["adventurer", "avataaars", "lorelei", "bottts", "fun-emoji", "thumbs"] as const;

export const DEFAULT_AVATARS: string[] = seeds.flatMap((seed) =>
  STYLES.map((style) => `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`)
);

export const DEFAULT_COVERS: { id: string; gradient: string }[] = [
  { id: "navy-crimson", gradient: "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.40 0.15 27))" },
  { id: "navy-gold", gradient: "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.55 0.15 75))" },
  { id: "ocean", gradient: "linear-gradient(135deg, oklch(0.30 0.10 230), oklch(0.45 0.15 200))" },
  { id: "sunset", gradient: "linear-gradient(135deg, oklch(0.35 0.15 30), oklch(0.55 0.18 60))" },
  { id: "forest", gradient: "linear-gradient(135deg, oklch(0.28 0.08 160), oklch(0.40 0.12 140))" },
  { id: "violet", gradient: "linear-gradient(135deg, oklch(0.28 0.12 290), oklch(0.45 0.18 320))" },
];

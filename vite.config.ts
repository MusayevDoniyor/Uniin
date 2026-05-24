// Vercel-compatible build config
// Uses @tanstack/react-start SPA mode — no Cloudflare Workers runtime needed.
// Server functions (AI) are not available without LOVABLE_API_KEY; everything
// else (auth, feed, marketplace, etc.) runs entirely client-side via Supabase.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      // SPA mode: prerenders a static shell HTML served for all routes.
      // Vercel hosts the dist/client folder as a static site.
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index.html",
        },
      },
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});

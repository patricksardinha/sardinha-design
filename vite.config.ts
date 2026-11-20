// Studio local : `npm run studio`. La route /__tokens (enregistrement) n'existe qu'en développement.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tokensStudioPlugin } from "./scripts/vite-plugin-tokens.mjs";

export default defineConfig({
  base: "./",
  plugins: [react(), tokensStudioPlugin()],
  server: { host: "127.0.0.1", port: 5180, open: true },
  build: {
    // Version statique du studio (aperçu seulement, sans enregistrement) ; non livrée dans le paquet.
    outDir: "dist/studio",
    emptyOutDir: true,
  },
  test: {
    include: ["tests/**/*.test.mjs"],
  },
});

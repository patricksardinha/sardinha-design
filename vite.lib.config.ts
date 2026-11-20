// Construction des composants pour les logiciels : dist/components/index.js (ESM)
// et dist/components/components.css. React reste une dépendance du logiciel (peer).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: "dist/components",
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: "src/components/entry.ts",
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "components",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
    },
  },
});

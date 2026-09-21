import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Resolve `@/*` (and the icons shim) from tsconfig.json "paths". The original
  // Higgsfield config enabled this; the migration dropped it, which left every
  // `@/…` import unresolvable and broke SSR with "Cannot find module".
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    nitro(),
    react(),
    tailwindcss(),
  ],
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Pure SPA build — no SSR, no Nitro, no server.
// All routing is handled client-side by TanStack Router.
// Netlify serves index.html for any path via the _redirects rule.
export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

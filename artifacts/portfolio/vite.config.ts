import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

// Dev proxy keeps /api same-origin so session cookies work whether the
// browser is on localhost or 127.0.0.1 (cross-host breaks SameSite=Lax).
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET?.replace(/\/+$/, "") || "http://127.0.0.1:8080";

const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: true,
  },
} as const;

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Lexar/exFAT cannot symlink workspace packages — resolve source directly
      "@workspace/api-client-react": path.resolve(
        import.meta.dirname,
        "../../lib/api-client-react/src/index.ts",
      ),
    },
    dedupe: ["react", "react-dom", "@react-three/fiber", "@react-three/drei", "three"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: { ...apiProxy },
    fs: {
      strict: true,
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "../../lib"),
        path.resolve(import.meta.dirname, "../../node_modules"),
      ],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: { ...apiProxy },
  },
});

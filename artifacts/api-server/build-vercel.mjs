import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

// Output is committed at vercel-bundle/ and imported by /api/[...path].mjs.
// The Vercel build command stays the Vite portfolio build that already succeeds;
// do not require this script to run on Vercel.
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.resolve(artifactDir, "vercel-bundle");

await rm(outdir, { recursive: true, force: true });

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/vercel.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir,
  entryNames: "index",
  outExtension: { ".js": ".mjs" },
  logLevel: "info",
  sourcemap: false,
  external: [
    "*.node",
    "pg-native",
    "pino",
    "pino-http",
    "pino-pretty",
    "thread-stream",
  ],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
  },
});

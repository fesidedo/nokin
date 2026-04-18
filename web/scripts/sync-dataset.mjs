#!/usr/bin/env node
/**
 * Copy the canonical lens dataset from data/processed/ into web/public/
 * so Vite serves it at /lenses.v1.json. Run manually (`npm run sync-dataset`)
 * or automatically before every build via the `prebuild` npm hook.
 */

import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const src = resolve(repoRoot, "data", "processed", "lenses.v1.json");
const dst = resolve(here, "..", "public", "lenses.v1.json");

try {
  const info = await stat(src);
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
  const kb = (info.size / 1024).toFixed(1);
  console.log(`[sync-dataset] ${src} -> ${dst} (${kb} KiB)`);
} catch (err) {
  console.error("[sync-dataset] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}

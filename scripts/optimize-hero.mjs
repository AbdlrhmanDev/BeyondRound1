#!/usr/bin/env node
/** Generates hero WebP for LCP. Mobile size for faster load. Run: npm run optimize:hero */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "public", "hero-doctors-friendship.jpg");

if (!existsSync(src)) process.exit(0);

try {
  const sharp = await import("sharp");
  const buf = readFileSync(src);
  await sharp.default(buf).webp({ quality: 82 }).toFile(join(root, "public", "hero-doctors-friendship.webp"));
  await sharp.default(buf).resize(480).webp({ quality: 75 }).toFile(join(root, "public", "hero-doctors-friendship-mobile.webp"));
  console.log("Created hero WebP (full + mobile)");
} catch {
  process.exit(0);
}

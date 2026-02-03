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
  // 640w for hero card 1x (displayed ~520px)
  await sharp.default(buf).resize(640).webp({ quality: 80 }).toFile(join(root, "public", "hero-doctors-friendship-card.webp"));
  // 800w for mobile 2x (375×2=750) – avoids loading 1024w, saves ~56 KiB
  await sharp.default(buf).resize(800).webp({ quality: 78 }).toFile(join(root, "public", "hero-doctors-friendship-800.webp"));
  console.log("Created hero WebP (full + mobile + card + 800)");
} catch {
  process.exit(0);
}

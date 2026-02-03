#!/usr/bin/env node
/**
 * Generates PWA icons (192x192, 512x512) from favicon.svg.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp --save-dev
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('Installing sharp... Run: npm install sharp --save-dev');
    process.exit(1);
  }

  const svgPath = join(publicDir, 'favicon.svg');
  const svg = readFileSync(svgPath);

  for (const size of [192, 512]) {
    const png = await sharp(svg)
      .resize(size, size)
      .png()
      .toBuffer();
    writeFileSync(join(publicDir, `icon-${size}.png`), png);
    console.log(`Created icon-${size}.png`);
  }

  console.log('PWA icons generated. Add to manifest: icon-192.png, icon-512.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

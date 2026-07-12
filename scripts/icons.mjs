// Generates the PWA icon set in /public from /public/icon.svg.
// Run after editing the SVG: `node scripts/icons.mjs` (needs devDep `sharp`).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = await readFile(path.join(pub, "icon.svg"), "utf8");

// Maskable variant: Android crops up to a centered circle covering 80% of
// the canvas, so the glyph shrinks into that safe zone; background stays
// full-bleed.
const maskable = svg.replace(
  '<g id="glyph" transform="',
  '<g id="glyph" transform="translate(256 256) scale(0.68) translate(-256 -256) ',
);

async function render(source, size, file) {
  const buf = await sharp(Buffer.from(source), { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(path.join(pub, file), buf);
  console.log(`✓ ${file} (${size}×${size})`);
}

await render(svg, 192, "icon-192.png");
await render(svg, 512, "icon-512.png");
await render(maskable, 192, "icon-maskable-192.png");
await render(maskable, 512, "icon-maskable-512.png");
await render(svg, 180, "apple-touch-icon.png");

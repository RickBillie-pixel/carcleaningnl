// Slice the inspiration reference into readable chunks for visual review.
// Usage: node ref.mjs [image1] [outdir]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const src = path.join(ROOT, "inspiration", (process.argv[2] || "image1") + ".png");
const out = path.join(ROOT, "demo-1e", "screens", "ref");
fs.mkdirSync(out, { recursive: true });

const meta = await sharp(src).metadata();
console.log("source", meta.width, "x", meta.height);

await sharp(src).resize({ width: 1000 }).png().toFile(path.join(out, "ref-full.png"));

// overlapping horizontal bands, upscaled so type detail is readable
const bands = 5;
const h = Math.ceil(meta.height / bands);
for (let i = 0; i < bands; i++) {
  const top = Math.max(0, i * h - (i ? 40 : 0));
  const height = Math.min(meta.height - top, h + (i ? 40 : 0));
  await sharp(src)
    .extract({ left: 0, top, width: meta.width, height })
    .resize({ width: Math.min(1500, meta.width * 2) })
    .png()
    .toFile(path.join(out, `ref-band-${i + 1}.png`));
  console.log(`band ${i + 1}: y ${top}..${top + height}`);
}
console.log("done ->", out);

// Crop an arbitrary region of any image and upscale it for close reading.
// Usage: node crop.mjs <src> <left> <top> <w> <h> <outname> [outWidth]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const [src, left, top, w, h, name, outW] = process.argv.slice(2);
const out = path.join(ROOT, "demo-1e", "screens", "ref");
fs.mkdirSync(out, { recursive: true });
const file = path.isAbsolute(src) ? src : path.join(ROOT, src);
await sharp(file)
  .extract({ left: +left, top: +top, width: +w, height: +h })
  .resize({ width: +(outW || 1400) })
  .png()
  .toFile(path.join(out, name + ".png"));
console.log("->", path.join(out, name + ".png"));

// Measure dark-ink bounding boxes / column profiles in a region of the reference,
// so type metrics can be compared numerically instead of by eye.
// Usage: node measure.mjs <src> <left> <top> <w> <h> [threshold]
import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const [src, left, top, w, h, thr = "120"] = process.argv.slice(2);
const T = +thr;
const file = path.isAbsolute(src) ? src : path.join(ROOT, src);
const { data, info } = await sharp(file)
  .extract({ left: +left, top: +top, width: +w, height: +h })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const dark = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) < T;
};

let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
const colCount = new Array(info.width).fill(0);
const rowCount = new Array(info.height).fill(0);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (dark(x, y)) {
      colCount[x]++; rowCount[y]++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
console.log(`bbox (region-local): x ${minX}..${maxX} (w ${maxX - minX + 1})  y ${minY}..${maxY} (h ${maxY - minY + 1})`);
console.log(`bbox (absolute):     x ${+left + minX}..${+left + maxX}  y ${+top + minY}..${+top + maxY}`);
// gaps between letters (columns with no ink) to locate letter boundaries
const gaps = [];
let run = null;
for (let x = 0; x < info.width; x++) {
  if (colCount[x] === 0) { if (!run) run = { s: x, e: x }; else run.e = x; }
  else if (run) { gaps.push(run); run = null; }
}
if (run) gaps.push(run);
console.log("ink gaps (>=2px):", gaps.filter((g) => g.e - g.s >= 1).map((g) => `${+left + g.s}-${+left + g.e}`).join(" "));
console.log("row ink profile (every 4px):", rowCount.filter((_, i) => i % 4 === 0).map((v, i) => `${+top + i * 4}:${v}`).join(" "));

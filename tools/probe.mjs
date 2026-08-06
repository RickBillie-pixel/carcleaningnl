// Report contiguous non-background runs along a row or column of the reference.
// Usage: node probe.mjs row <y> <x0> <x1> [tol]
//        node probe.mjs col <x> <y0> <y1> [tol]
// Background = white-ish. Prints runs of "ink" (anything darker/saturated).
import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const file = path.join(ROOT, "inspiration", process.env.REF || "image1", ).replace(/\\$/, "") + ".png";
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, C = info.channels;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const hex = (x, y) => "#" + px(x, y).map((v) => v.toString(16).padStart(2, "0")).join("");

const [mode, a, b, c, tolArg] = process.argv.slice(2);
const tol = +(tolArg || 8);
const ink = (x, y) => { const [r, g, b2] = px(x, y); return !(r > 255 - tol && g > 255 - tol && b2 > 255 - tol); };

const runs = [];
let run = null;
if (mode === "row") {
  const y = +a;
  for (let x = +b; x <= +c; x++) {
    if (ink(x, y)) { if (!run) run = { s: x, e: x }; else run.e = x; }
    else if (run) { runs.push(run); run = null; }
  }
  if (run) runs.push(run);
  console.log(`row y=${y}:`);
  for (const r of runs) console.log(`  ${r.s}..${r.e} (w ${r.e - r.s + 1}) mid=${hex(Math.round((r.s + r.e) / 2), y)}`);
} else {
  const x = +a;
  for (let y = +b; y <= +c; y++) {
    if (ink(x, y)) { if (!run) run = { s: y, e: y }; else run.e = y; }
    else if (run) { runs.push(run); run = null; }
  }
  if (run) runs.push(run);
  console.log(`col x=${x}:`);
  for (const r of runs) console.log(`  ${r.s}..${r.e} (h ${r.e - r.s + 1}) mid=${hex(x, Math.round((r.s + r.e) / 2))}`);
}

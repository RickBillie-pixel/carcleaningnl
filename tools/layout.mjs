// Probe the reference board for structural edges: page card bounds, title box,
// hero photo box, card rows. Prints absolute pixel coordinates.
import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const file = path.join(ROOT, "inspiration", (process.argv[2] || "image1") + ".png");
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const hex = (x, y) => "#" + px(x, y).map((v) => v.toString(16).padStart(2, "0")).join("");
const isBoard = (x, y) => { const [r, g, b] = px(x, y); return Math.abs(r - 0x84) < 14 && Math.abs(g - 0xda) < 14 && Math.abs(b - 0xf5) < 14; };
const isWhite = (x, y) => { const [r, g, b] = px(x, y); return r > 246 && g > 246 && b > 246; };

console.log("=== page card (scan row y=600) ===");
let l = 0; while (l < W && isBoard(l, 600)) l++;
let r = W - 1; while (r > 0 && !isWhite(r, 600)) r--;
console.log("left edge", l, "-> right edge of left panel:");
let rr = l; while (rr < W && !isBoard(rr, 600)) rr++;
console.log(`  page card x ${l}..${rr - 1} (w ${rr - l})`);
console.log("=== page card top (scan col x=400) ===");
let t = 0; while (t < H && isBoard(400, t)) t++;
console.log("  page card top y", t, hex(400, t + 2));

console.log("=== right thumbnail panel (scan row y=600) ===");
let x = rr; while (x < W && isBoard(x, 600)) x++;
console.log("  thumb panel starts x", x);

const cmd = process.argv[3];
if (cmd === "probe") {
  const [ax, ay, bx, by] = process.argv.slice(4).map(Number);
  console.log(`row scan y=${ay} from ${ax} to ${bx}:`);
  let prev = null;
  for (let i = ax; i <= bx; i++) {
    const h = hex(i, ay);
    if (h !== prev) { console.log(`  x=${i} ${h}`); prev = h; }
  }
}
if (cmd === "col") {
  const [cx, y0, y1] = process.argv.slice(4).map(Number);
  let prev = null;
  for (let y = y0; y <= y1; y++) {
    const h = hex(cx, y);
    if (h !== prev) { console.log(`  y=${y} ${h}`); prev = h; }
  }
}

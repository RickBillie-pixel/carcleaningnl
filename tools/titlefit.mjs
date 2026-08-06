// Render "CAR DETAILING" in a candidate face at a target cap height, then report
// the same mid-cap run signature measured from the reference, so tracking and
// width can be tuned until the two signatures line up.
// Usage: FONT=Antonio W=700 CAP=128 LS=-0.02em node titlefit.mjs
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const FONT = process.env.FONT || "Antonio";
const W = +(process.env.W || 700);
const CAP = +(process.env.CAP || 128);
const LS = process.env.LS || "0";
const TEXT = process.env.TEXT || "CAR DETAILING";
const CAP_EM = { Antonio: 0.859, Anton: 0.859, "Archivo Black": 0.688, Archivo: 0.688 };
const size = CAP / (CAP_EM[FONT] || 0.7);

fs.writeFileSync(path.join(DIR, "tf.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css>
<style>html,body{margin:0;background:#fff}
#t{font-family:"${FONT}";font-weight:${W};font-size:${size.toFixed(2)}px;line-height:1.4;letter-spacing:${LS};color:#000;white-space:nowrap;padding:20px 0 0 20px}</style>
<div id=t>${TEXT}</div>`);
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "tf.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 400 } });
await page.goto("http://localhost:4899/tf.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
const out = path.join(DIR, "tf.png");
await page.locator("#t").screenshot({ path: out });
await browser.close(); server.close();

const { data, info } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const dark = (x, y) => { const i = (y * info.width + x) * info.channels; return data[i] < 110; };
let top = -1, bot = -1;
for (let y = 0; y < info.height; y++) { let any = false; for (let x = 0; x < info.width; x++) if (dark(x, y)) { any = true; break; } if (any) { if (top < 0) top = y; bot = y; } }
const cap = bot - top + 1;
let minX = 1e9, maxX = -1;
for (let y = top; y <= bot; y++) for (let x = 0; x < info.width; x++) if (dark(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
const mid = top + Math.round(cap * 0.3);
const runs = []; let run = null;
for (let x = 0; x < info.width; x++) {
  if (dark(x, mid)) { if (!run) run = { s: x, e: x }; else run.e = x; } else if (run) { runs.push(run); run = null; }
}
if (run) runs.push(run);
console.log(`${FONT} ${W} ls=${LS} size=${size.toFixed(1)}px`);
console.log(`  cap=${cap}  ink width=${maxX - minX + 1}  width/cap=${((maxX - minX + 1) / cap).toFixed(3)}`);
console.log(`  runs @${((mid - top) / cap * 100).toFixed(0)}% cap: ${runs.map((r) => `${r.s - minX}..${r.e - minX}`).join(" ")}`);

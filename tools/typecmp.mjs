// Stack a reference crop directly above the same string rendered in each
// candidate font at matched cap height, so letterforms can be compared 1:1.
// Usage: TEXT="..." CAP=25.2 CROP="x,y,w,h" node typecmp.mjs
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const OUTDIR = path.join(ROOT, "demo-1e", "screens", "ref");
const TEXT = process.env.TEXT || "Expert Car Detailing";
const WEIGHT = +(process.env.WEIGHT || 600);
const SCALE = +(process.env.SCALE || 4);
const CAP = +(process.env.CAP || 25.2) * SCALE;
const [cx, cy, cw, ch] = (process.env.CROP || "78,736,300,42").split(",").map(Number);
const FONTS = (process.env.FONTS || "Poppins,Jost,Outfit,Urbanist,Figtree,Hanken Grotesk").split(",");
const CAP_EM = { Poppins: 0.7, Jost: 0.7, Outfit: 0.695, Urbanist: 0.7, Figtree: 0.7, "Hanken Grotesk": 0.7, Anton: 0.86, "Archivo Black": 0.69, "Bebas Neue": 0.7, "Big Shoulders Display": 0.8, "Barlow Condensed": 0.705, "Fjalla One": 0.835, Oswald: 0.81 };

// 1. reference strip, upscaled
const refPath = path.join(OUTDIR, "_tc-ref.png");
await sharp(path.join(ROOT, "inspiration", "image1.png"))
  .extract({ left: cx, top: cy, width: cw, height: ch })
  .resize({ width: cw * SCALE, kernel: "lanczos3" })
  .png().toFile(refPath);

// 2. candidates
fs.writeFileSync(path.join(DIR, "tc.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css>
<style>body{margin:0;background:#fff}
.row{padding:0 0 4px}
.lab{font:11px/1.6 monospace;color:#c00}
.s{line-height:1.0;white-space:nowrap;color:#111;letter-spacing:${process.env.LS || "0"}}
</style>
${FONTS.map((f) => `<div class=row><div class=lab>${f} ${WEIGHT}</div><div class="s" style='font-family:"${f}";font-weight:${WEIGHT};font-size:${(CAP / (CAP_EM[f] || 0.7)).toFixed(1)}px'>${TEXT}</div></div>`).join("")}`);

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "tc.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.max(900, cw * SCALE), height: 900 } });
await page.goto("http://localhost:4899/tc.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const candPath = path.join(OUTDIR, "_tc-cand.png");
await page.screenshot({ path: candPath, fullPage: true });
await browser.close(); server.close();

// 3. stack
const a = await sharp(refPath).metadata();
const b = await sharp(candPath).metadata();
const W = Math.max(a.width, b.width);
const out = path.join(OUTDIR, (process.env.OUT || "cmp-type") + ".png");
await sharp({ create: { width: W, height: a.height + b.height + 12, channels: 3, background: "#fff" } })
  .composite([{ input: refPath, top: 0, left: 0 }, { input: candPath, top: a.height + 12, left: 0 }])
  .png().toFile(out);
fs.unlinkSync(refPath); fs.unlinkSync(candPath);
console.log("->", out);

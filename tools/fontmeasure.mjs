// Measure the already-downloaded candidate fonts in a real browser (DOM + canvas
// after document.fonts.load), and render a visual specimen sheet for eyeballing.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");

const DISPLAY = [
  ["Anton", 400], ["Archivo Black", 400], ["Archivo", 900], ["Big Shoulders Display", 900],
  ["Oswald", 700], ["Bebas Neue", 400], ["Fjalla One", 400], ["Saira Condensed", 900],
  ["Barlow Condensed", 900], ["Archivo Narrow", 700], ["League Spartan", 900], ["Chivo", 900],
];
const BODY = ["Poppins", "Jost", "Outfit", "Figtree", "Plus Jakarta Sans", "Urbanist", "DM Sans", "Manrope", "Red Hat Display", "Hanken Grotesk"];

const html = `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css>
<style>body{margin:0;background:#fff;font-size:0}
.row{padding:6px 10px}
.lab{font:12px/1 monospace;color:#888}
.d{font-size:120px;line-height:1;white-space:nowrap;letter-spacing:-0.02em}
.b{font-size:56px;line-height:1.1;white-space:nowrap}
</style>
<div id=display>${DISPLAY.map(([f, w]) => `<div class=row><div class=lab>${f} ${w}</div><div class="d" style='font-family:"${f}";font-weight:${w}'>CAR DETAILING</div></div>`).join("")}</div>
<div id=body>${BODY.map((f) => `<div class=row><div class=lab>${f}</div><div class="b" style='font-family:"${f}";font-weight:600'>Expert Car Detailing: Luxury</div></div>`).join("")}</div>`;
fs.writeFileSync(path.join(DIR, "specimen.html"), html);

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "specimen.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1200 } });
await page.goto("http://localhost:4899/specimen.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const out = await page.evaluate(async ({ display, body }) => {
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const load = async (f, w) => { try { await document.fonts.load(`${w} 200px "${f}"`); } catch {} };
  const res = { display: [], body: [] };
  for (const [f, w] of display) {
    await load(f, w);
    ctx.font = `${w} 200px "${f}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const width = ctx.measureText("CAR DETAILING").width;
    res.display.push({ f, w, cap: +cap.toFixed(1), ratio: +(width / cap).toFixed(3) });
  }
  for (const f of body) {
    await load(f, 400);
    ctx.font = `400 200px "${f}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const xh = ctx.measureText("x").actualBoundingBoxAscent;
    const w = ctx.measureText("Expert Car Detailing").width;
    res.body.push({ f, cap: +cap.toFixed(1), xRatio: +(xh / cap).toFixed(3), wRatio: +(w / cap).toFixed(3) });
  }
  return res;
}, { display: DISPLAY, body: BODY });

const TARGET_D = +(process.env.TD || 5.385);
console.log(`\n=== DISPLAY  target width/cap = ${TARGET_D} (at letter-spacing 0) ===`);
for (const d of [...out.display].sort((a, b) => Math.abs(a.ratio - TARGET_D) - Math.abs(b.ratio - TARGET_D)))
  console.log(`  ${d.f.padEnd(24)} ${String(d.w).padEnd(4)} cap/em=${(d.cap / 200).toFixed(3)}  ratio=${String(d.ratio).padEnd(7)} needs tracking ${(((TARGET_D - d.ratio) * d.cap) / 200 / 12).toFixed(4)}em/char`);

console.log(`\n=== BODY  target xHeight/cap ~= 0.73 ===`);
for (const b of [...out.body].sort((a, b2) => Math.abs(a.xRatio - 0.73) - Math.abs(b2.xRatio - 0.73)))
  console.log(`  ${b.f.padEnd(22)} cap/em=${(b.cap / 200).toFixed(3)} xRatio=${b.xRatio}  wRatio=${b.wRatio}`);

await page.locator("#display").screenshot({ path: path.join(ROOT, "demo-1e", "screens", "ref", "spec-display.png") });
await page.locator("#body").screenshot({ path: path.join(ROOT, "demo-1e", "screens", "ref", "spec-body.png") });
await browser.close();
server.close();
console.log("\nspecimens -> demo-1e/screens/ref/spec-display.png, spec-body.png");

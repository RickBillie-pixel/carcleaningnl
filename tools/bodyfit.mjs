// Match the reference body face by per-word ink-width / cap-height ratios.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const FONTS = (process.env.FONTS || "Poppins,Jost,Outfit,Urbanist,Figtree,Hanken Grotesk,Plus Jakarta Sans,DM Sans,Manrope,Red Hat Display").split(",");
const WEIGHTS = (process.env.WEIGHTS || "500,600,700").split(",").map(Number);
// reference: cap 25 board px
const TARGET = { Expert: 3.92, Car: 2.24, "Detailing:": 5.76, From: 3.0, Luxury: 3.96 };

fs.writeFileSync(path.join(DIR, "bf.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css><link rel=stylesheet href=./probe2.css><body>x`);
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "bf.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4899/bf.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const rows = await page.evaluate(async ({ FONTS, WEIGHTS, TARGET }) => {
  const ctx = document.createElement("canvas").getContext("2d");
  const out = [];
  for (const f of FONTS) for (const w of WEIGHTS) {
    await document.fonts.load(`${w} 400px "${f}"`);
    ctx.font = `${w} 400px "${f}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const stem = ctx.measureText("I").actualBoundingBoxRight + ctx.measureText("I").actualBoundingBoxLeft;
    const r = {}; let err = 0, n = 0;
    for (const word of Object.keys(TARGET)) {
      const m = ctx.measureText(word);
      const ink = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) / cap;
      r[word] = +ink.toFixed(2);
      err += Math.abs(ink - TARGET[word]) / TARGET[word]; n++;
    }
    out.push({ f, w, stem: +(stem / cap).toFixed(3), xr: +(ctx.measureText("x").actualBoundingBoxAscent / cap).toFixed(3), r, err: +((err / n) * 100).toFixed(2) });
  }
  return out;
}, { FONTS, WEIGHTS, TARGET });
console.log("target ink/cap:", TARGET, " ref stem/cap ~0.156 (h2), x/cap ~0.70");
for (const r of rows.sort((a, b) => a.err - b.err).slice(0, 14))
  console.log(`  ${(r.f + " " + r.w).padEnd(26)} err=${String(r.err).padStart(5)}%  stem=${r.stem} x/cap=${r.xr}  ${Object.entries(r.r).map(([k, v]) => k + "=" + v).join(" ")}`);
await browser.close(); server.close();

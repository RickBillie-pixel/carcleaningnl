// Compare candidate fonts by advance-width / cap-height ratio for a given string.
// Usage: TEXT="Brands To Your" TARGET=10.68 WEIGHT=600 node widthfit.mjs
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const FONTS = (process.env.FONTS || "Poppins,Jost,Outfit,Urbanist,Figtree,Hanken Grotesk,Plus Jakarta Sans,DM Sans,Manrope,Red Hat Display").split(",");
const TEXT = process.env.TEXT || "Brands To Your";
const WEIGHT = +(process.env.WEIGHT || 600);
const TARGET = +(process.env.TARGET || 0);

fs.writeFileSync(path.join(DIR, "wf.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css><body>${FONTS.map((f) => `<span style='font-family:"${f}";font-weight:${WEIGHT};font-size:200px'>${TEXT}</span>`).join("")}`);
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "wf.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4899/wf.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const rows = await page.evaluate(async ({ FONTS, TEXT, WEIGHT }) => {
  const ctx = document.createElement("canvas").getContext("2d");
  const out = [];
  for (const f of FONTS) {
    await document.fonts.load(`${WEIGHT} 200px "${f}"`);
    ctx.font = `${WEIGHT} 200px "${f}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const xh = ctx.measureText("x").actualBoundingBoxAscent;
    const w = ctx.measureText(TEXT).width;
    out.push({ f, cap: +(cap / 200).toFixed(3), xr: +(xh / cap).toFixed(3), ratio: +(w / cap).toFixed(3) });
  }
  return out;
}, { FONTS, TEXT, WEIGHT });
console.log(`"${TEXT}" @${WEIGHT} — width/cap ratio${TARGET ? ` (target ${TARGET})` : ""}`);
for (const r of rows.sort((a, b) => Math.abs(a.ratio - TARGET) - Math.abs(b.ratio - TARGET)))
  console.log(`  ${r.f.padEnd(20)} cap/em=${r.cap} x/cap=${r.xr} ratio=${r.ratio}${TARGET ? `  off ${(((r.ratio - TARGET) / TARGET) * 100).toFixed(1)}%` : ""}`);
await browser.close(); server.close();

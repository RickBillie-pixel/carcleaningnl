// Fingerprint candidate display fonts by per-glyph ink-width / cap-height ratios,
// which are independent of tracking — the reference's own ratios are the target.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const FONTS = [["Anton", 400], ["Archivo Black", 400], ["Big Shoulders Display", 900], ["Barlow Condensed", 900], ["Saira Condensed", 900], ["Oswald", 700], ["Fjalla One", 400], ["Bebas Neue", 400], ["Archivo", 900]];
// reference ink widths / cap height (cap = 129 board px)
const TARGET = { D: 0.419, E: 0.357, I: 0.124, N: 0.388, C: 0.419, A: 0.442, R: 0.426 };

fs.writeFileSync(path.join(DIR, "gf.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css><body>${FONTS.map(([f, w]) => `<span style='font-family:"${f}";font-weight:${w};font-size:100px'>CDEINAR</span>`).join("")}`);
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "gf.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4899/gf.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const rows = await page.evaluate(async ({ FONTS, TARGET }) => {
  const ctx = document.createElement("canvas").getContext("2d");
  const out = [];
  for (const [f, w] of FONTS) {
    await document.fonts.load(`${w} 300px "${f}"`);
    ctx.font = `${w} 300px "${f}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const g = {};
    let err = 0, n = 0;
    for (const ch of Object.keys(TARGET)) {
      const m = ctx.measureText(ch);
      const ink = m.actualBoundingBoxRight + m.actualBoundingBoxLeft;
      g[ch] = +(ink / cap).toFixed(3);
      err += Math.abs(g[ch] - TARGET[ch]); n++;
    }
    out.push({ f, w, cap: +(cap / 300).toFixed(3), g, err: +(err / n).toFixed(4) });
  }
  return out;
}, { FONTS, TARGET });
console.log("target ink/cap:", TARGET);
for (const r of rows.sort((a, b) => a.err - b.err))
  console.log(`  ${r.f.padEnd(23)} ${String(r.w).padEnd(4)} cap/em=${r.cap} err=${r.err}  ${Object.entries(r.g).map(([k, v]) => k + ":" + v).join(" ")}`);
await browser.close(); server.close();

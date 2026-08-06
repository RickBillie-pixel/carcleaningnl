// Test ultra-condensed heavy display candidates against the reference's
// glyph fingerprint: D/cap 0.406, I/cap 0.156, "CAR DETAILING" width/cap 5.47.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");

const SPECS = [
  "Antonio:wght@400..700",
  "Saira+Extra+Condensed:wght@900",
  "Saira+Semi+Condensed:wght@900",
  "Anybody:wdth,wght@50..150,100..900",
  "Archivo:wdth,wght@62..125,100..900",
  "Encode+Sans+Condensed:wght@900",
  "Pathway+Extreme:opsz,wdth,wght@8..144,75..125,100..900",
];
let css = fs.existsSync(path.join(DIR, "probe2.css")) ? fs.readFileSync(path.join(DIR, "probe2.css"), "utf8") : "";
if (!css) {
  for (const spec of SPECS) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${spec}&display=block`, { headers: { "User-Agent": UA } });
    if (!res.ok) { console.log("FAIL", spec, res.status); continue; }
    const text = await res.text();
    const blocks = text.split("@font-face").slice(1).map((b) => "@font-face" + b.slice(0, b.indexOf("}") + 1));
    const before = text.split("@font-face");
    for (let i = 0; i < blocks.length; i++) {
      const c = before[i].match(/\/\*\s*([\w-]+)\s*\*\/\s*$/);
      if ((c ? c[1] : "all") !== "latin") continue;
      const u = blocks[i].match(/url\((https:[^)]+\.woff2)\)/);
      if (!u) continue;
      const fname = path.basename(u[1].split("?")[0]);
      if (!fs.existsSync(path.join(DIR, fname))) {
        const r = await fetch(u[1], { headers: { "User-Agent": UA } });
        fs.writeFileSync(path.join(DIR, fname), Buffer.from(await r.arrayBuffer()));
      }
      css += blocks[i].replace(u[1], `./${fname}`) + "\n";
    }
    console.log("ok", spec);
  }
  fs.writeFileSync(path.join(DIR, "probe2.css"), css);
}

const CANDS = [
  { f: "Anton", w: 400, s: "" },
  { f: "Antonio", w: 700, s: "" },
  { f: "Saira Extra Condensed", w: 900, s: "" },
  { f: "Saira Semi Condensed", w: 900, s: "" },
  { f: "Anybody", w: 900, s: "font-variation-settings:'wdth' 50;" },
  { f: "Anybody", w: 900, s: "font-variation-settings:'wdth' 62;" },
  { f: "Archivo", w: 900, s: "font-variation-settings:'wdth' 62;" },
  { f: "Archivo", w: 900, s: "font-variation-settings:'wdth' 75;" },
  { f: "Encode Sans Condensed", w: 900, s: "" },
];
fs.writeFileSync(path.join(DIR, "cf.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css><link rel=stylesheet href=./probe2.css><body>
${CANDS.map((c, i) => `<div id=c${i} style='font-family:"${c.f}";font-weight:${c.w};${c.s}font-size:300px;line-height:1;white-space:nowrap'>CAR DETAILING</div>`).join("")}`);

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "cf.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3000, height: 900 } });
await page.goto("http://localhost:4899/cf.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const rows = await page.evaluate(async (CANDS) => {
  const ctx = document.createElement("canvas").getContext("2d");
  const out = [];
  for (let i = 0; i < CANDS.length; i++) {
    const el = document.getElementById("c" + i);
    const cs = getComputedStyle(el);
    const font = `${cs.fontWeight} 300px "${CANDS[i].f}"`;
    await document.fonts.load(font);
    ctx.font = font;
    // variation settings can't go through canvas; use DOM measurement for width
    const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const mD = ctx.measureText("D"), mI = ctx.measureText("I");
    const domW = el.getBoundingClientRect().width;
    out.push({
      f: CANDS[i].f + " " + CANDS[i].w + " " + CANDS[i].s.replace(/font-variation-settings:|;/g, ""),
      capEm: +(cap / 300).toFixed(3),
      D: +((mD.actualBoundingBoxRight + mD.actualBoundingBoxLeft) / cap).toFixed(3),
      I: +((mI.actualBoundingBoxRight + mI.actualBoundingBoxLeft) / cap).toFixed(3),
      titleRatio: +(domW / cap).toFixed(3),
    });
  }
  return out;
}, CANDS);

console.log("target: D/cap 0.406  I/cap 0.156  title/cap 5.47  D/I 2.60");
for (const r of rows) console.log(`  ${r.f.padEnd(34)} cap/em=${r.capEm} D=${r.D} I=${r.I} D/I=${(r.D / r.I).toFixed(2)} title=${r.titleRatio}`);
await page.screenshot({ path: path.join(ROOT, "demo-1e", "screens", "ref", "spec-cond.png"), fullPage: true });
await browser.close(); server.close();

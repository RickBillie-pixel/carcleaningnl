// Download candidate Google fonts into a scratch dir, render specimens, and
// report metrics (width/cap-height ratio, x-height/cap ratio) so the reference
// typography can be matched numerically rather than guessed.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
fs.mkdirSync(DIR, { recursive: true });

const DISPLAY = [
  ["Anton", "Anton"],
  ["Archivo+Black", "Archivo Black"],
  ["Archivo:wght@900", "Archivo"],
  ["Big+Shoulders+Display:wght@900", "Big Shoulders Display"],
  ["Oswald:wght@700", "Oswald"],
  ["Bebas+Neue", "Bebas Neue"],
  ["Fjalla+One", "Fjalla One"],
  ["Saira+Condensed:wght@900", "Saira Condensed"],
  ["Barlow+Condensed:wght@900", "Barlow Condensed"],
  ["Archivo+Narrow:wght@700", "Archivo Narrow"],
  ["League+Spartan:wght@900", "League Spartan"],
  ["Chivo:wght@900", "Chivo"],
];
const BODY = [
  ["Poppins:wght@400;500;600;700", "Poppins"],
  ["Jost:wght@400..700", "Jost"],
  ["Outfit:wght@400..700", "Outfit"],
  ["Figtree:wght@400..700", "Figtree"],
  ["Plus+Jakarta+Sans:wght@400..700", "Plus Jakarta Sans"],
  ["Urbanist:wght@400..700", "Urbanist"],
  ["DM+Sans:wght@400..700", "DM Sans"],
  ["Manrope:wght@400..700", "Manrope"],
  ["Red+Hat+Display:wght@400..700", "Red Hat Display"],
  ["Hanken+Grotesk:wght@400..700", "Hanken Grotesk"],
];

let css = "";
for (const [spec] of [...DISPLAY, ...BODY]) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=block`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) { console.log("FAIL", spec, res.status); continue; }
  const text = await res.text();
  const blocks = text.split("@font-face").slice(1).map((b) => "@font-face" + b.slice(0, b.indexOf("}") + 1));
  const before = text.split("@font-face");
  for (let i = 0; i < blocks.length; i++) {
    const c = before[i].match(/\/\*\s*([\w-]+)\s*\*\/\s*$/);
    const subset = c ? c[1] : "all";
    if (subset !== "latin") continue;
    const u = blocks[i].match(/url\((https:[^)]+\.woff2)\)/);
    if (!u) continue;
    const fname = path.basename(u[1].split("?")[0]);
    const dest = path.join(DIR, fname);
    if (!fs.existsSync(dest)) {
      const r = await fetch(u[1], { headers: { "User-Agent": UA } });
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    }
    css += blocks[i].replace(u[1], `./${fname}`) + "\n";
  }
  console.log("ok", spec);
}
fs.writeFileSync(path.join(DIR, "probe.css"), css);

// --- measure in a browser -------------------------------------------------
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "index.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
fs.writeFileSync(path.join(DIR, "index.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css><style>body{margin:0}</style>`);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4899/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const result = await page.evaluate(({ display, body }) => {
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const measure = (family, weight, text, size = 200) => {
    ctx.font = `${weight} ${size}px "${family}"`;
    const m = ctx.measureText(text);
    return { w: m.width, cap: m.actualBoundingBoxAscent };
  };
  const out = { display: [], body: [] };
  for (const [, fam] of display) {
    const weight = fam === "Archivo" || fam === "Big Shoulders Display" || fam === "Oswald" || fam === "Saira Condensed" || fam === "Barlow Condensed" || fam === "Archivo Narrow" || fam === "League Spartan" || fam === "Chivo" ? (fam === "Oswald" || fam === "Archivo Narrow" ? 700 : 900) : 400;
    ctx.font = `${weight} 200px "${fam}"`;
    const H = ctx.measureText("H");
    const t = ctx.measureText("CAR DETAILING");
    out.display.push({ fam, weight, capH: H.actualBoundingBoxAscent, width: t.width, ratio: +(t.width / H.actualBoundingBoxAscent).toFixed(3) });
  }
  for (const [, fam] of body) {
    ctx.font = `400 200px "${fam}"`;
    const H = ctx.measureText("H").actualBoundingBoxAscent;
    const x = ctx.measureText("x").actualBoundingBoxAscent;
    const w = ctx.measureText("Expert Car Detailing").width;
    out.body.push({ fam, capH: H, xH: x, xRatio: +(x / H).toFixed(3), wRatio: +(w / H).toFixed(3) });
  }
  return out;
}, { display: DISPLAY, body: BODY });

console.log("\n=== DISPLAY: target width/capHeight for 'CAR DETAILING' = 5.385 ===");
for (const d of result.display.sort((a, b) => Math.abs(a.ratio - 5.385) - Math.abs(b.ratio - 5.385)))
  console.log(`  ${d.fam.padEnd(24)} w${d.weight} cap=${d.capH.toFixed(1)} ratio=${d.ratio}  (scale needed ${(5.385 / d.ratio).toFixed(3)})`);

console.log("\n=== BODY: target xHeight/capHeight ~0.73 ===");
for (const b of result.body.sort((a, b2) => Math.abs(a.xRatio - 0.73) - Math.abs(b2.xRatio - 0.73)))
  console.log(`  ${b.fam.padEnd(24)} xRatio=${b.xRatio} widthRatio('Expert Car Detailing')=${b.wRatio}`);

await browser.close();
server.close();

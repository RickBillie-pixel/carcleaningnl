// Side-by-side: renders demo-1e's fold at 1440 scaled to the reference's own
// scale (744 board px wide) and pastes it next to inspiration/image1's left
// panel, so the two can be judged as the same design at the same size.
// Usage: node sbs.mjs <round>
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const round = process.argv[2] || "r1";
const OUT = path.join(ROOT, "demo-1e", "screens");
fs.mkdirSync(OUT, { recursive: true });
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4897, r));

// Reference left panel: x 57..800, y 57..1080 (page card, 744 wide)
const REF_W = 744;
const refPath = path.join(OUT, "_sbs-ref.png");
await sharp(path.join(ROOT, "inspiration", "image1.png"))
  .extract({ left: 57, top: 57, width: REF_W, height: 1023 })
  .png().toFile(refPath);

// Our page at 1440 wide, same visible height ratio (1023/744 of the width)
const shotH = Math.round((1023 / REF_W) * 1440);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: shotH }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://localhost:4897/demo-1e/index.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// reveals on
await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
await page.waitForTimeout(700);
const ourRaw = path.join(OUT, "_sbs-our.png");
await page.screenshot({ path: ourRaw, clip: { x: 0, y: 0, width: 1440, height: shotH } });
await ctx.close();
await browser.close();
server.close();

const ourScaled = await sharp(ourRaw).resize({ width: REF_W, kernel: "lanczos3" }).png().toBuffer();
const ourMeta = await sharp(ourScaled).metadata();
const H = Math.max(1023, ourMeta.height);
const out = path.join(OUT, `sbs-${round}.png`);
await sharp({ create: { width: REF_W * 2 + 24, height: H + 30, channels: 3, background: "#e9eef2" } })
  .composite([
    { input: refPath, top: 30, left: 0 },
    { input: ourScaled, top: 30, left: REF_W + 24 },
  ])
  .png().toFile(out);
fs.unlinkSync(refPath); fs.unlinkSync(ourRaw);
console.log("->", out, `(left = image1, right = demo-1e @1440 scaled to ${REF_W})`);

// Zoomed side-by-side of one horizontal band: reference band on top, our render
// of the same band below, both normalised to the same width.
// Usage: node sbs-zoom.mjs <name> <refTop> <refHeight> <ourTop> <ourHeight> [vw]
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const [name, refTop, refH, ourTop, ourH, vwArg] = process.argv.slice(2);
const VW = +(vwArg || 1440);
const OUT = path.join(ROOT, "demo-1e", "screens");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4894, r));

const W = 1400;
const refBuf = await sharp(path.join(ROOT, "inspiration", "image1.png"))
  .extract({ left: 57, top: +refTop, width: 744, height: +refH })
  .resize({ width: W, kernel: "lanczos3" }).png().toBuffer();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://localhost:4894/demo-1e/index.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
await page.waitForTimeout(600);
const raw = path.join(OUT, "_z.png");
await page.screenshot({ path: raw, fullPage: true, clip: { x: 0, y: +ourTop, width: VW, height: +ourH } });
await ctx.close(); await browser.close(); server.close();

const ourBuf = await sharp(raw).resize({ width: W, kernel: "lanczos3" }).png().toBuffer();
const a = await sharp(refBuf).metadata();
const b = await sharp(ourBuf).metadata();
const out = path.join(OUT, `zoom-${name}.png`);
await sharp({ create: { width: W, height: a.height + b.height + 14, channels: 3, background: "#c8d2da" } })
  .composite([{ input: refBuf, top: 0, left: 0 }, { input: ourBuf, top: a.height + 14, left: 0 }])
  .png().toFile(out);
fs.unlinkSync(raw);
console.log("->", out);

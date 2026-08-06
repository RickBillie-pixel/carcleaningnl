import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
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
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:4897/demo-1/index.html", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const img = document.querySelector(".hero__media img");
  const cs = getComputedStyle(img);
  const r = img.getBoundingClientRect();
  return { currentSrc: img.currentSrc.split("/").pop(), aspectRatio: cs.aspectRatio, w: r.width, h: r.height, natural: img.naturalWidth + "x" + img.naturalHeight };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
server.close();

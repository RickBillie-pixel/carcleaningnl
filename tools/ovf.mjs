// Report elements that stick out past the viewport, per demo/page/viewport.
// Usage: node ovf.mjs demo-1e [index] [390,1440,2560]
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const demo = process.argv[2] || "demo-1e";
const pg = process.argv[3] || "index";
const widths = (process.argv[4] || "390,1440,2560").split(",").map(Number);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4896, r));
const browser = await chromium.launch();
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:4896/${demo}/${pg}.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const res = await page.evaluate((vw) => {
    const out = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right > vw + 0.6 || r.left < -0.6) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().slice(0, 60),
          left: Math.round(r.left), right: Math.round(r.right),
        });
      }
    });
    return { sw: document.documentElement.scrollWidth, out: out.slice(0, 14) };
  }, w);
  console.log(`\n== ${w}px  scrollWidth=${res.sw} ==`);
  for (const o of res.out) console.log(`  ${o.tag}.${o.cls}  ${o.left}..${o.right}`);
  await ctx.close();
}
await browser.close();
server.close();

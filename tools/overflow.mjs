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
await new Promise((r) => server.listen(4894, r));
const browser = await chromium.launch();
for (const [demo, vw] of [["demo-2", 390], ["demo-2", 1440]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:4894/${demo}/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const bad = await page.evaluate(() => {
    const out = [];
    const vw = document.documentElement.clientWidth;
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2 && r.width > 10) {
        out.push(`${el.tagName}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
      }
    });
    return out.slice(0, 20);
  });
  console.log(`=== ${demo} @ ${vw}:`);
  bad.forEach((b) => console.log("  ", b));
  await ctx.close();
}
await browser.close();
server.close();

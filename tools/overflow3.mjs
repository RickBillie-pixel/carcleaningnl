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
await new Promise((r) => server.listen(4896, r));
const browser = await chromium.launch();
for (const page_ of ["index", "afspraak"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:4896/demo-2/${page_}.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const res = await page.evaluate(() => {
    const vw = 390;
    const out = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      let clipped = false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        const st = getComputedStyle(a);
        if (/(hidden|clip|auto|scroll)/.test(st.overflowX)) { clipped = true; break; }
      }
      if (r.right > vw + 2 && !clipped) out.push(`${el.tagName}.${String(el.className).slice(0, 44)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    });
    return { sw: document.documentElement.scrollWidth, out: out.slice(0, 10) };
  });
  console.log(`demo-2/${page_} @390 scrollWidth=${res.sw}`);
  res.out.forEach((b) => console.log("  ", b));
  await ctx.close();
}
await browser.close();
server.close();

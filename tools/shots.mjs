// Screenshot harness: serves the repo, drives Chromium through each demo at
// three viewports, scrolls through to trigger reveals, saves full-page shots.
// Usage: node shots.mjs <round> [demo...] [--page=afspraak]
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const round = process.argv[2] || "1";
const only = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const pageArg = (process.argv.find((a) => a.startsWith("--page=")) || "--page=index").split("=")[1];
const DEMOS = only.length ? only : ["demo-1", "demo-2", "demo-3"];

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".jpeg": "image/jpeg", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("nope"); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const PORT = 4893;
await new Promise((r) => server.listen(PORT, r));

const VIEWPORTS = [
  { name: "iphone12", width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "laptop", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "large", width: 2560, height: 1440, deviceScaleFactor: 1 },
];

const browser = await chromium.launch();
for (const demo of DEMOS) {
  const dir = path.join(ROOT, demo, "screens");
  fs.mkdirSync(dir, { recursive: true });
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: !!vp.isMobile,
      hasTouch: !!vp.hasTouch,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`http://localhost:${PORT}/${demo}/${pageArg}.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    // scroll through to trigger reveals / lazy images / scrolltriggers
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 140));
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 500));
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 500));
    });
    await page.waitForTimeout(500);
    const out = path.join(dir, `round-${round}-${vp.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    // Also an above-the-fold shot
    const fold = path.join(dir, `round-${round}-${vp.name}-fold.png`);
    await page.screenshot({ path: fold, fullPage: false });
    const dims = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight, window.innerWidth]);
    console.log(`${demo} ${vp.name}: page ${dims[0]}x${dims[1]} (viewport ${vp.width}) ${errors.length ? "ERRORS: " + errors.join(" | ") : "ok"}`);
    // horizontal overflow check
    if (dims[0] > vp.width + 1) console.log(`  !! HORIZONTAL OVERFLOW: scrollWidth ${dims[0]} > viewport ${vp.width}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log("shots done");

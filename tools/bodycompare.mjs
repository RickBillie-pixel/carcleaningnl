// Render the four single-storey-'a' geometric candidates at matched cap height
// next to each other so letterform details can be compared with the reference.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets-gen", "fontprobe");
const FONTS = ["Poppins", "Jost", "Outfit", "Urbanist", "Figtree", "Hanken Grotesk"];
const TEXT = process.env.TEXT || "Expert Car Detailing: Sydney gy";

fs.writeFileSync(path.join(DIR, "cmp.html"), `<!doctype html><meta charset=utf-8><link rel=stylesheet href=./probe.css>
<style>body{margin:0;background:#fff;padding:8px}
.lab{font:11px/1 monospace;color:#c00;margin:10px 0 2px}
.s{font-size:96px;line-height:1.05;white-space:nowrap;font-weight:600;color:#111}
</style>
${FONTS.map((f) => `<div class=lab>${f} 600</div><div class="s" style='font-family:"${f}"'>${TEXT}</div>`).join("")}`);

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIR, p === "/" ? "cmp.html" : p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": ext === ".css" ? "text/css" : ext === ".woff2" ? "font/woff2" : "text/html" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4899, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
await page.goto("http://localhost:4899/cmp.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(ROOT, "demo-1e", "screens", "ref", (process.env.OUT || "spec-body-cmp") + ".png"), fullPage: true });
await browser.close();
server.close();
console.log("ok");

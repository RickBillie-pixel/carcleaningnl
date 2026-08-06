// Technical audit pass: text contrast, touch targets, focus visibility,
// heading order, alt text, and lazy-loading, across three viewports.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const demo = process.argv[2] || "demo-1e";
const pages = (process.argv[3] || "index,afspraak").split(",");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4891, r));

const browser = await chromium.launch();
for (const pg of pages) {
  for (const vw of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:4891/${demo}/${pg}.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
    await page.waitForTimeout(400);
    const out = await page.evaluate(() => {
      const lum = (c) => {
        const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const parse = (s) => {
        const n = (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
        // Chromium serialiseert color-mix als color(srgb 1 1 1 / .9): kanalen zijn 0-1.
        if (s.startsWith("color(")) return [n[0] * 255, n[1] * 255, n[2] * 255, n.length > 3 ? n[3] : 1];
        return n;
      };
      const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
      const bgOf = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c.length === 4 && c[3] === 0) continue;
          if (c.length >= 3) return c.slice(0, 3);
        }
        return [255, 255, 255];
      };
      const contrast = [], touch = [], headings = [], alts = [];
      document.querySelectorAll("p,span,a,li,h1,h2,h3,h4,strong,em,small,label,button,td,th,figcaption").forEach((el) => {
        if (!el.textContent.trim() || el.children.length > 0 && !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") return;
        const fg = parse(cs.color).slice(0, 3);
        const bg = bgOf(el);
        const cr = ratio(fg, bg);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
        const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
        if (cr < need) contrast.push({ t: el.textContent.trim().slice(0, 42), cr: +cr.toFixed(2), need, size, cls: (el.className || "").toString().slice(0, 32) });
      });
      document.querySelectorAll("a,button,input,select,[role=slider]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (getComputedStyle(el).position === "absolute" && r.left < 0) return;
        if (r.height < 40 || r.width < 40) touch.push({ t: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 34), w: Math.round(r.width), h: Math.round(r.height) });
      });
      let last = 0;
      document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
        const lvl = +h.tagName[1];
        if (last && lvl > last + 1) headings.push(`${h.tagName} na H${last}: ${h.textContent.trim().slice(0, 40)}`);
        last = lvl;
      });
      document.querySelectorAll("img").forEach((img) => {
        if (img.alt === null || img.alt === undefined) alts.push(img.src.split("/").pop() + " (geen alt)");
        if (!img.loading && !img.getAttribute("fetchpriority")) alts.push(img.src.split("/").pop() + " (geen loading-hint)");
      });
      return { contrast, touch, headings, alts, h1: document.querySelectorAll("h1").length };
    });
    console.log(`\n=== ${pg}.html @${vw} ===`);
    console.log(`  contrast onder AA: ${out.contrast.length}`);
    out.contrast.slice(0, 8).forEach((c) => console.log(`    ${c.cr} (nodig ${c.need}) ${c.size}px .${c.cls} — "${c.t}"`));
    console.log(`  raakvlakken < 40px: ${out.touch.length}`);
    out.touch.slice(0, 8).forEach((t) => console.log(`    ${t.w}x${t.h} — "${t.t}"`));
    if (out.headings.length) console.log(`  kopvolgorde: ${out.headings.join(" | ")}`);
    if (out.alts.length) console.log(`  images: ${out.alts.join(" | ")}`);
    console.log(`  aantal h1: ${out.h1}`);
    await ctx.close();
  }
}
await browser.close();
server.close();

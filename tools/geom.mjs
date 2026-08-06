// Report demo-1e's rendered geometry as ratios of the content width, next to the
// same ratios measured from inspiration/image1.png. Anything off by >2% is a
// concrete, fixable difference.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VW = +(process.argv[2] || 1440);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4895, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: 1000 } });
const page = await ctx.newPage();
await page.goto("http://localhost:4895/demo-1e/index.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
await page.waitForTimeout(400);

const g = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
  const cw = r(".hero .container").width - 2 * parseFloat(getComputedStyle(document.querySelector(".hero .container")).paddingLeft);
  const cx = r(".hero .container").left + parseFloat(getComputedStyle(document.querySelector(".hero .container")).paddingLeft);
  // ink box of the h1 via a range
  const h1 = document.querySelector(".hero__title");
  const range = document.createRange(); range.selectNodeContents(h1);
  const tb = range.getBoundingClientRect();
  const cs = getComputedStyle(h1);
  const out = {
    contentWidth: cw, contentLeft: cx,
    titleBox: [tb.left - cx, tb.right - cx, tb.width],
    titleFontSize: parseFloat(cs.fontSize),
    navPill: r(".nav__pill") && [r(".nav__pill").width, r(".nav__pill").height, r(".nav__pill").top],
    lockup: r(".nav__lockup") && [r(".nav__lockup").width, r(".nav__lockup").height],
    heroPillTop: r(".hero__pill") && r(".hero__pill").top,
    badge: r(".hero__pilldot") && [r(".hero__pilldot").width, r(".hero__pilldot").height],
    pilltext: r(".hero__pilltext") && [r(".hero__pilltext").width, r(".hero__pilltext").height],
    titleWrap: r(".hero__titlewrap") && [r(".hero__titlewrap").top, r(".hero__titlewrap").height],
    photo: r(".hero__photo") && [r(".hero__photo").top, r(".hero__photo").height, r(".hero__photo").width],
    cardsBox: r(".herocards") && [r(".herocards").top, r(".herocards").height, r(".herocards").left - cx, r(".herocards").width],
    leftCard: r(".herocard--left") && r(".herocard--left").width,
    rateCard: r(".herocard--rating") && r(".herocard--rating").width,
    chipA: r(".chip--a") && [r(".chip--a").left - cx, r(".chip--a").top, r(".chip--a").height],
    h2: r(".section h2") && [r(".section h2").top, r(".section h2").width, parseFloat(getComputedStyle(document.querySelector(".section h2")).fontSize)],
    card1: r(".card") && [r(".card").top, r(".card").width, r(".card").height],
  };
  return out;
});

const CW = g.contentWidth;
const pct = (v) => ((v / CW) * 100).toFixed(1) + "%";
// reference ratios, content width = 700 board px, page top = board y 57
const R = (v) => ((v / 700) * 100).toFixed(1) + "%";
console.log(`viewport ${VW}  content width ${CW.toFixed(0)}px\n`);
const rows = [
  ["title ink width", pct(g.titleBox[2]), "100.0% (vult de contentbreedte)"],
  ["title left offset", pct(g.titleBox[0]), "0.0%"],
  ["title font-size", g.titleFontSize.toFixed(1) + "px", `≈ ${(0.1984 * CW).toFixed(0)}px`],
  ["title cap top (y)", (g.titleWrap[0] + window_ph()).toFixed?.(0) ?? "-", "-"],
  ["nav pill w/h", `${g.navPill[0].toFixed(0)} / ${g.navPill[1].toFixed(0)}`, `${R(310)} → ${(CW * 310 / 700).toFixed(0)} / ${(CW * 31 / 700).toFixed(0)}`],
  ["nav pill top", g.navPill[2].toFixed(0), (32 * 1.9355).toFixed(0) + " (ref 66)"],
  ["lockup w/h", `${g.lockup[0].toFixed(0)} / ${g.lockup[1].toFixed(0)}`, `ref wordmark ${(CW * 92 / 700).toFixed(0)} / ${(CW * 26 / 700).toFixed(0)}`],
  ["hero pill top", g.heroPillTop.toFixed(0), ((160 - 57) * 1.9355).toFixed(0)],
  ["badge w/h", `${g.badge[0].toFixed(0)} / ${g.badge[1].toFixed(0)}`, `${(CW * 46 / 700).toFixed(0)} / ${(CW * 29 / 700).toFixed(0)}`],
  ["pilltext w/h", `${g.pilltext[0].toFixed(0)} / ${g.pilltext[1].toFixed(0)}`, `${(CW * 262 / 700).toFixed(0)} / ${(CW * 24 / 700).toFixed(0)}`],
  ["title wrap top/h", `${g.titleWrap[0].toFixed(0)} / ${g.titleWrap[1].toFixed(0)}`, `${((212 - 57) * 1.9355).toFixed(0)} / ${(CW * 129 / 700).toFixed(0)}`],
  ["photo top/h", `${g.photo[0].toFixed(0)} / ${g.photo[1].toFixed(0)}`, `${((356 - 57) * 1.9355).toFixed(0)} / ${(CW * 344 / 700).toFixed(0)}`],
  ["cards top/h", `${g.cardsBox[0].toFixed(0)} / ${g.cardsBox[1].toFixed(0)}`, `${((513 - 57) * 1.9355).toFixed(0)} / ${(CW * 170 / 700).toFixed(0)}`],
  ["left/rate card w", `${g.leftCard.toFixed(0)} / ${g.rateCard.toFixed(0)}`, `${(CW * 420 / 700).toFixed(0)} / ${(CW * 225 / 700).toFixed(0)}`],
  ["chip A left/h", `${pct(g.chipA[0])} / ${g.chipA[2].toFixed(0)}`, `2.4% / ${(CW * 18 / 700).toFixed(0)}`],
  ["h2 top/width/size", `${g.h2[0].toFixed(0)} / ${g.h2[1].toFixed(0)} / ${g.h2[2].toFixed(0)}`, `${((744 - 57) * 1.9355).toFixed(0)} / ${(CW * 510 / 700).toFixed(0)} / ${(CW * 35.7 / 700).toFixed(0)}`],
  ["svc card top/w/h", `${g.card1[0].toFixed(0)} / ${g.card1[1].toFixed(0)} / ${g.card1[2].toFixed(0)}`, `${((891 - 57) * 1.9355).toFixed(0)} / ${(CW * 169 / 700).toFixed(0)} / -`],
];
function window_ph() { return 0; }
for (const [k, a, b] of rows) console.log(`  ${k.padEnd(20)} ours: ${String(a).padEnd(20)} ref: ${b}`);

await ctx.close(); await browser.close(); server.close();

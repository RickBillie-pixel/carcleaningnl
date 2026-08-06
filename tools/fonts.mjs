// Download self-hosted fonts for the three demos + emit @font-face CSS.
import fs from "node:fs";
import path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ROOT = path.resolve(import.meta.dirname, "..");

const TARGETS = [
  {
    demo: "demo-1",
    css: [
      { url: "https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap", source: "fontshare" },
    ],
  },
  {
    demo: "demo-2",
    css: [
      { url: "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap", source: "google" },
      { url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=swap", source: "google" },
    ],
  },
  {
    demo: "demo-3",
    css: [
      { url: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&display=swap", source: "google" },
      { url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap", source: "google" },
    ],
  },
];

for (const t of TARGETS) {
  const dir = path.join(ROOT, t.demo, "assets", "fonts");
  fs.mkdirSync(dir, { recursive: true });
  let outCss = "";
  for (const c of t.css) {
    const res = await fetch(c.url, { headers: { "User-Agent": UA } });
    const css = await res.text();
    // split into @font-face blocks with preceding comment (google marks subsets)
    const blocks = css.split("@font-face").slice(1).map((b) => "@font-face" + b.slice(0, b.indexOf("}") + 1));
    const before = css.split("@font-face");
    for (let i = 0; i < blocks.length; i++) {
      const comment = before[i].match(/\/\*\s*([\w-]+)\s*\*\/\s*$/);
      const subset = comment ? comment[1] : "all";
      if (c.source === "google" && subset !== "latin" && subset !== "latin-ext") continue;
      const urlMatch = blocks[i].match(/url\((https:[^)]+\.woff2)\)/);
      if (!urlMatch) continue;
      const fname = `${subset}-${path.basename(urlMatch[1].split("?")[0])}`;
      const dest = path.join(dir, fname);
      if (!fs.existsSync(dest)) {
        const r = await fetch(urlMatch[1], { headers: { "User-Agent": UA } });
        fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      }
      outCss += blocks[i].replace(urlMatch[1], `./fonts/${fname}`) + "\n";
    }
  }
  fs.writeFileSync(path.join(ROOT, t.demo, "assets", "fonts.css"), outCss);
  const files = fs.readdirSync(dir);
  console.log(t.demo, files.length, "font files:", files.map(f => `${f} ${(fs.statSync(path.join(dir,f)).size/1024).toFixed(0)}kb`).join(", "));
}

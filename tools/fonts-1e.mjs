// Self-host demo-1e's typefaces: Antonio (condensed ultra-display, matches the
// reference title's glyph signature) + Urbanist (geometric UI/body face).
// Latin subset only, variable woff2.
import fs from "node:fs";
import path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ROOT = path.resolve(import.meta.dirname, "..");
const dir = path.join(ROOT, "demo-1e", "assets", "fonts");
fs.mkdirSync(dir, { recursive: true });

const FAMILIES = [
  "Antonio:wght@100..700",
  "Urbanist:wght@100..900",
];

let out = "";
for (const spec of FAMILIES) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${spec}: ${res.status}`);
  const css = await res.text();
  const blocks = css.split("@font-face").slice(1).map((b) => "@font-face" + b.slice(0, b.indexOf("}") + 1));
  const before = css.split("@font-face");
  for (let i = 0; i < blocks.length; i++) {
    const c = before[i].match(/\/\*\s*([\w-]+)\s*\*\/\s*$/);
    const subset = c ? c[1] : "all";
    if (subset !== "latin") continue; // nl text needs no latin-ext
    const u = blocks[i].match(/url\((https:[^)]+\.woff2)\)/);
    if (!u) continue;
    const fname = `${spec.split(":")[0].toLowerCase()}-${subset}-${path.basename(u[1].split("?")[0])}`;
    const dest = path.join(dir, fname);
    if (!fs.existsSync(dest)) {
      const r = await fetch(u[1], { headers: { "User-Agent": UA } });
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    }
    out += blocks[i].replace(u[1], `./fonts/${fname}`) + "\n";
  }
  console.log("ok", spec);
}
// drop the stale Archivo / JetBrains files
for (const f of fs.readdirSync(dir)) {
  if (!f.startsWith("antonio-") && !f.startsWith("urbanist-")) { fs.unlinkSync(path.join(dir, f)); console.log("removed", f); }
}
fs.writeFileSync(path.join(ROOT, "demo-1e", "assets", "fonts.css"), out);
console.log(fs.readdirSync(dir).map((f) => `${f} ${(fs.statSync(path.join(dir, f)).size / 1024).toFixed(0)}kb`).join("\n"));

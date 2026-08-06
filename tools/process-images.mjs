// Convert generated PNGs to sized WebP and distribute to demo folders.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const GEN = path.join(ROOT, "assets-gen");

const WIDTHS = { hero: 1920, tall: 1080, wide: 1600, square: 1200 };
function widthFor(id) {
  if (id.endsWith("-tall")) return WIDTHS.tall;
  if (id.endsWith("-hero")) return WIDTHS.hero;
  return /^(p|a|t)-(foam|polish|wash|gallery-1|halen)$/.test(id) || id.startsWith("ba-ext") ? WIDTHS.wide : WIDTHS.square;
}
const DEMOS = {
  "demo-1": (id) => id.startsWith("p-") || id.startsWith("ba-"),
  "demo-2": (id) => id.startsWith("a-") || id.startsWith("ba-"),
  "demo-3": (id) => id.startsWith("t-") || id.startsWith("ba-"),
};

const files = fs.readdirSync(GEN).filter((f) => f.endsWith(".png") && !f.includes("preview") && !f.startsWith("dbg"));
for (const f of files) {
  const id = f.replace(".png", "");
  const src = path.join(GEN, f);
  const buf = await sharp(src).resize(widthFor(id), null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  for (const [demo, match] of Object.entries(DEMOS)) {
    if (!match(id)) continue;
    const dest = path.join(ROOT, demo, "assets", "img", `${id}.webp`);
    fs.writeFileSync(dest, buf);
  }
  console.log(id, (buf.length / 1024).toFixed(0) + "kb");
}
console.log("done", files.length, "images");

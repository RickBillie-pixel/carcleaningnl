// Extract the CarCleaningNL mark from logo.jpeg as clean recolorable SVGs.
import sharp from "sharp";
import potrace from "potrace";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..", "logo.jpeg");
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
fs.mkdirSync(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log("source", meta.width, "x", meta.height);

// Upscale 4x, grayscale, hard threshold: the white mark becomes black on white
// (potrace traces dark shapes), so threshold then negate.
async function prepared(crop) {
  let img = sharp(SRC).resize(meta.width * 4, meta.height * 4, { kernel: "lanczos3" });
  if (crop) img = img.extract(crop);
  return img.grayscale().threshold(150).negate().png().toBuffer();
}

function trace(buf, opts = {}) {
  return new Promise((res, rej) =>
    potrace.trace(buf, { turdSize: 12, optTolerance: 0.35, threshold: 128, ...opts }, (err, svg) =>
      err ? rej(err) : res(svg)
    )
  );
}

const W = meta.width * 4, H = meta.height * 4;
const jobs = [
  { name: "logo-full", crop: null },
  { name: "logo-car", crop: { left: 0, top: 0, width: W, height: Math.round(H * 0.56) } },
  { name: "logo-word", crop: { left: 0, top: Math.round(H * 0.56), width: W, height: H - Math.round(H * 0.56) } },
];

for (const j of jobs) {
  const buf = await prepared(j.crop);
  let svg = await trace(buf);
  // Make fill controllable: replace the fill with currentColor
  svg = svg.replace(/fill="[^"]*"/g, 'fill="currentColor"').replace(/stroke="[^"]*"/g, "");
  fs.writeFileSync(path.join(OUT, `${j.name}.svg`), svg);
  // Render a preview PNG (white mark on dark grey) to inspect
  const preview = await sharp(Buffer.from(svg.replace(/currentColor/g, "#ffffff")))
    .resize(600, null)
    .flatten({ background: "#333333" })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, `${j.name}-preview.png`), preview);
  console.log(j.name, "done, svg bytes:", svg.length);
}

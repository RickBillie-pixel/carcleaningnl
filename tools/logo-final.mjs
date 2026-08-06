import sharp from "sharp";
import potrace from "potrace";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..", "logo.jpeg");
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const meta = await sharp(SRC).metadata();
const W = meta.width * 4, H = meta.height * 4;

const buf = await sharp(SRC)
  .resize(W, H, { kernel: "lanczos3" })
  .extract({ left: 0, top: 0, width: W, height: Math.round(H * 0.56) })
  .grayscale().threshold(24).png().toBuffer();
const svg = await new Promise((res, rej) =>
  potrace.trace(buf, { turdSize: 6, optTolerance: 0.3 }, (e, s) => (e ? rej(e) : res(s))));
const clean = svg.replace(/fill="[^"]*"/g, 'fill="currentColor"');
fs.writeFileSync(path.join(OUT, "logo-car.svg"), clean);
const preview = await sharp(Buffer.from(clean.replace(/currentColor/g, "#ffffff")))
  .resize(600, null).flatten({ background: "#333333" }).png().toBuffer();
fs.writeFileSync(path.join(OUT, "logo-car-preview.png"), preview);
console.log("car bytes", clean.length);
// report viewBox / dims of both svgs
for (const f of ["logo-car.svg", "logo-word.svg"]) {
  const s = fs.readFileSync(path.join(OUT, f), "utf8");
  console.log(f, s.match(/<svg[^>]*>/)[0]);
}

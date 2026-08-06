import sharp from "sharp";
import path from "node:path";
const SRC = path.resolve(import.meta.dirname, "..", "logo.jpeg");
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const meta = await sharp(SRC).metadata();
const W = meta.width * 4, H = meta.height * 4;
const buf = await sharp(SRC)
  .resize(W, H, { kernel: "lanczos3" })
  .extract({ left: 0, top: 0, width: W, height: Math.round(H * 0.60) })
  .grayscale().threshold(60).negate().png().toBuffer();
await sharp(buf).toFile(path.join(OUT, "dbg-car-thresh.png"));
console.log("saved");

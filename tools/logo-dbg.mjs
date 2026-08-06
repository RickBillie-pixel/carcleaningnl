import sharp from "sharp";
import path from "node:path";
const SRC = path.resolve(import.meta.dirname, "..", "logo.jpeg");
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const meta = await sharp(SRC).metadata();
const W = meta.width * 4, H = meta.height * 4;
// full upscaled grayscale, no threshold
await sharp(SRC).resize(W, H).grayscale().png().toFile(path.join(OUT, "dbg-gray.png"));
// stats of top region
const stats = await sharp(SRC).extract({ left: 0, top: 0, width: meta.width, height: 80 }).grayscale().stats();
console.log("top region stats", JSON.stringify(stats.channels[0]));

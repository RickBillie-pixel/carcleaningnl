// Slice tall full-page screenshots into readable chunks for review.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
const round = process.argv[2] || "1";
const demos = process.argv[3] ? [process.argv[3]] : ["demo-1","demo-2","demo-3"];
for (const demo of demos) {
  const dir = path.join(ROOT, demo, "screens");
  const outdir = path.join(dir, `review-${round}`);
  fs.mkdirSync(outdir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith(`round-${round}-`) || f.includes("fold") || !f.endsWith(".png")) continue;
    const name = f.replace(".png","").replace(`round-${round}-`,"");
    const img = sharp(path.join(dir, f));
    const meta = await img.metadata();
    // scale to 760px wide, then slice into chunks of ~1100px
    const targetW = 760;
    const scale = targetW / meta.width;
    const scaledH = Math.round(meta.height * scale);
    const buf = await img.resize(targetW, null).png().toBuffer();
    const chunkH = 1150;
    const n = Math.ceil(scaledH / chunkH);
    for (let i = 0; i < n; i++) {
      const top = i * chunkH;
      const h = Math.min(chunkH, scaledH - top);
      if (h < 40) continue;
      await sharp(buf).extract({ left: 0, top, width: targetW, height: h })
        .jpeg({ quality: 80 }).toFile(path.join(outdir, `${name}-${String(i).padStart(2,"0")}.jpg`));
    }
    console.log(demo, name, `${n} chunks (scaled ${targetW}x${scaledH})`);
  }
}

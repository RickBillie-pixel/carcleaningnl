import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
const PH = path.join(import.meta.dirname, "node_modules", "@phosphor-icons", "core", "assets");
const ICONS = {
  regular: ["phone","whatsapp-logo","instagram-logo","tiktok-logo","map-pin","clock","check","arrow-right","arrow-up-right","arrow-left","car","drop","shield-check","sparkle","star","caret-down","caret-right","caret-left","steering-wheel","spray-bottle","armchair","sun","calendar-check","truck","key","x","list","paint-brush-broad","lightbulb","gauge","wind","quotes","plus","minus","wrench","hand-soap","seat","car-profile","road-horizon","circle-notch"],
  fill: ["star","check-circle","whatsapp-logo","phone","map-pin","sparkle","drop","shield-check"],
  bold: ["arrow-right","check","x","list","caret-down","phone","whatsapp-logo"]
};
for (const demo of ["demo-1","demo-2","demo-3"]) {
  const dir = path.join(ROOT, demo, "assets", "icons");
  fs.mkdirSync(dir, { recursive: true });
  for (const [weight, names] of Object.entries(ICONS)) {
    for (const n of names) {
      const suffix = weight === "regular" ? "" : `-${weight}`;
      const src = path.join(PH, weight, `${n}${suffix}.svg`);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, `${n}${suffix}.svg`));
      else console.log("MISSING", weight, n);
    }
  }
  const jsdir = path.join(ROOT, demo, "assets", "js");
  fs.mkdirSync(jsdir, { recursive: true });
  fs.mkdirSync(path.join(ROOT, demo, "assets", "img"), { recursive: true });
}
// GSAP for demo-2 and demo-3
for (const demo of ["demo-2","demo-3"]) {
  for (const f of ["gsap.min.js","ScrollTrigger.min.js"]) {
    fs.copyFileSync(path.join(import.meta.dirname,"node_modules","gsap","dist",f), path.join(ROOT, demo, "assets", "js", f));
  }
}
// logo svgs to each demo
for (const demo of ["demo-1","demo-2","demo-3"]) {
  for (const f of ["logo-car.svg","logo-word.svg"]) {
    fs.copyFileSync(path.join(ROOT,"assets-gen",f), path.join(ROOT, demo, "assets", f));
  }
}
console.log("prep done");

// Extra Porselein-world images for the demo-1 variants (type-over-image comps).
import fs from "node:fs";
import path from "node:path";
const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const API = "https://api.kie.ai/api/v1";
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ITEMS = [
  { id: "p2-hero-wide", size: "landscape_16_9", prompt: "A silver luxury sports car positioned small in the lower third of a vast bright white photo studio, huge amounts of empty white space above the car, soft diffused high-key light, glossy reflections on seamless porcelain floor, ultra minimalist automotive photography, no text, blank license plate" },
  { id: "p2-rear", size: "landscape_16_9", prompt: "Rear three-quarter view of a silver luxury sports car in a bright seamless white studio, deep glossy paint with elegant reflections, soft high-key lighting, generous negative space on the left side of the frame, minimalist cinematic automotive photography, no text, blank license plate" },
  { id: "p2-texture", size: "landscape_16_9", prompt: "Extreme macro of perfect round water beads on freshly coated polished silver car paint, bright high-key studio light, elegant soft reflections, shallow depth of field, luxurious minimalist, no text" },
  { id: "p2-line", size: "landscape_16_9", prompt: "Abstract close-up along the flowing body line of a silver sports car, one long sweeping white highlight reflection across the metal, bright white studio background, elegant minimal automotive detail photography, no text" },
];

async function create(item) {
  const r = await fetch(`${API}/jobs/createTask`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-image-2-text-to-image", input: { prompt: item.prompt, image_size: item.size } }) });
  const j = await r.json();
  if (j?.code !== 200) throw new Error(JSON.stringify(j));
  return j.data.taskId;
}
const tasks = {};
for (const it of ITEMS) { tasks[it.id] = await create(it); console.log(it.id, "created", tasks[it.id]); await sleep(600); }
let pending = Object.keys(tasks);
for (let c = 0; c < 50 && pending.length; c++) {
  await sleep(10000);
  for (const id of [...pending]) {
    const r = await fetch(`${API}/jobs/recordInfo?taskId=${tasks[id]}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const j = await r.json();
    if (j?.data?.state === "success") {
      const url = JSON.parse(j.data.resultJson).resultUrls[0];
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      fs.writeFileSync(path.join(OUT, id + ".png"), buf);
      console.log(id, "downloaded", (buf.length / 1024).toFixed(0) + "kb");
      pending = pending.filter((p) => p !== id);
    } else if (j?.data?.state === "fail" || j?.data?.state === "failed") {
      console.log(id, "FAILED", j.data?.failMsg);
      pending = pending.filter((p) => p !== id);
    }
  }
}
console.log("VARIANT IMAGES DONE");

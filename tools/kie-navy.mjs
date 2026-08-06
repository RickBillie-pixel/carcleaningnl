// Navy-commercial image set for the demo-1b rebuild (Aqua-reference style).
import fs from "node:fs";
import path from "node:path";
const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const API = "https://api.kie.ai/api/v1";
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ITEMS = [
  { id: "n-hero", size: "landscape_16_9", prompt: "A glossy black luxury sports car covered in fine glistening water droplets, deep navy blue studio environment, electric blue rim lighting tracing the body lines, glowing headlights, dramatic dark commercial automotive photography, subtle mist, space on the left side of the frame, no text, blank license plate" },
  { id: "n-int", size: "square_1_1", prompt: "Professional detailer steam cleaning a black leather car interior seat, visible steam, moody dark workshop with deep blue tinted task lighting, premium commercial photography, no text" },
  { id: "n-ext", size: "square_1_1", prompt: "A black car being hand washed, covered in thick white snow foam, dramatic dark studio with deep blue lighting, backlit water spray, premium commercial photography, no text" },
  { id: "n-polish", size: "square_1_1", prompt: "Detailer machine polishing glossy black car paint with an orbital polisher, dark workshop with deep electric blue accent lighting, cinematic commercial photography, no text" },
  { id: "n-coating", size: "square_1_1", prompt: "Extreme macro of perfect water beads on jet black ceramic coated car paint, electric blue light reflections sparkling in each droplet, dark navy background, premium product photography, no text" },
  { id: "n-halen", size: "landscape_16_9", prompt: "A gleaming black car parked in front of a modern Dutch brick house at dusk, deep blue evening light, warm porch light glow, quiet residential street, premium commercial photography, no people, no text, blank license plate" },
];
async function create(item) {
  const r = await fetch(`${API}/jobs/createTask`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-image-2-text-to-image", input: { prompt: item.prompt, image_size: item.size } }) });
  const j = await r.json();
  if (j?.code !== 200) throw new Error(JSON.stringify(j));
  return j.data.taskId;
}
const tasks = {};
for (const it of ITEMS) { tasks[it.id] = await create(it); console.log(it.id, "created"); await sleep(600); }
let pending = Object.keys(tasks);
for (let c = 0; c < 50 && pending.length; c++) {
  await sleep(10000);
  for (const id of [...pending]) {
    const r = await fetch(`${API}/jobs/recordInfo?taskId=${tasks[id]}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const j = await r.json();
    if (j?.data?.state === "success") {
      const url = JSON.parse(j.data.resultJson).resultUrls[0];
      fs.writeFileSync(path.join(OUT, id + ".png"), Buffer.from(await (await fetch(url)).arrayBuffer()));
      console.log(id, "downloaded");
      pending = pending.filter((p) => p !== id);
    } else if (/fail/.test(j?.data?.state || "")) { console.log(id, "FAILED"); pending = pending.filter((p) => p !== id); }
  }
}
console.log("NAVY SET DONE");

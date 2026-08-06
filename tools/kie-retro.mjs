import fs from "node:fs";
import path from "node:path";
const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const API = "https://api.kie.ai/api/v1";
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ITEMS = [
  { id: "r-topdown", size: "portrait_9_16", prompt: "Top-down aerial view of a glossy dark blue sports car photographed directly from above, centered, on a warm cream-beige studio background, soft even lighting, clean minimal composition, the full car visible with space around it, high-end advertising photography, no text, no license plate visible" },
  { id: "r-detail", size: "square_1_1", prompt: "Close-up of a glossy burnt-orange classic sports car fender and chrome detail, warm cream studio background, soft warm light, bold advertising photography with rich saturated color, no text" },
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
  await sleep(9000);
  for (const id of [...pending]) {
    const r = await fetch(`${API}/jobs/recordInfo?taskId=${tasks[id]}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const j = await r.json();
    if (j?.data?.state === "success") {
      fs.writeFileSync(path.join(OUT, id + ".png"), Buffer.from(await (await fetch(JSON.parse(j.data.resultJson).resultUrls[0])).arrayBuffer()));
      console.log(id, "downloaded"); pending = pending.filter((p) => p !== id);
    } else if (/fail/.test(j?.data?.state || "")) { console.log(id, "FAILED"); pending = pending.filter((p) => p !== id); }
  }
}
console.log("RETRO SET DONE");

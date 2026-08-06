// Regenerate before/after pairs with correct image-to-image params (input_urls).
import fs from "node:fs";
import path from "node:path";
const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const API = "https://api.kie.ai/api/v1";
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function create(body) {
  const r = await fetch(`${API}/jobs/createTask`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j?.code !== 200) throw new Error("create failed: " + JSON.stringify(j));
  return j.data.taskId;
}
async function wait(taskId, label) {
  for (let i = 0; i < 50; i++) {
    await sleep(9000);
    const r = await fetch(`${API}/jobs/recordInfo?taskId=${taskId}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const j = await r.json();
    const st = j?.data?.state;
    if (st === "success") return JSON.parse(j.data.resultJson).resultUrls[0];
    if (st === "fail" || st === "failed") throw new Error(label + " failed: " + (j.data?.failMsg || ""));
  }
  throw new Error(label + " timeout");
}
async function dl(url, name) {
  const r = await fetch(url);
  fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(await r.arrayBuffer()));
  console.log(name, "downloaded");
}

const PAIRS = [
  {
    before: "ba-ext-before", after: "ba-ext-after", size: "landscape_16_9",
    beforePrompt: "Wide horizontal photo, documentary phone-camera style: the hood and front fender of a dark grey car seen from the front three-quarter, paint dull with visible swirl marks, water spots and light scratches, dusty, parked on a Dutch brick driveway, overcast light, realistic snapshot, landscape orientation, no text, blank license plate",
    afterPrompt: "Edit this exact photo: keep the same car, same camera angle, same framing, same background and lighting, but make the paint freshly professionally polished: deep glossy mirror-like reflections, zero swirl marks, no water spots, no dust, showroom finish. Change nothing else."
  },
  {
    before: "ba-int-before", after: "ba-int-after", size: "square_1_1",
    beforePrompt: "Documentary phone photo, square: dirty car interior, fabric driver seat with coffee stains and crumbs, dusty dashboard and steering wheel, footwell carpet with sand and dried mud, daylight through windows, realistic messy family car, no text",
    afterPrompt: "Edit this exact photo: keep the same interior, same camera angle, same framing and lighting, but make everything professionally deep cleaned: spotless stain-free fabric seat, dust-free dashboard, perfectly clean carpet. Change nothing else."
  }
];

for (const p of PAIRS) {
  const t1 = await create({ model: "gpt-image-2-text-to-image", input: { prompt: p.beforePrompt, image_size: p.size } });
  console.log(p.before, "task", t1);
  const beforeUrl = await wait(t1, p.before);
  await dl(beforeUrl, p.before);
  const t2 = await create({ model: "gpt-image-2-image-to-image", input: { prompt: p.afterPrompt, input_urls: [beforeUrl], aspect_ratio: "auto" } });
  console.log(p.after, "task", t2);
  const afterUrl = await wait(t2, p.after);
  await dl(afterUrl, p.after);
}
console.log("PAIRS DONE");

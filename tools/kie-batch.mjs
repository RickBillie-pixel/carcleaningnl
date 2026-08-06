// Batch runner for kie.ai gpt-image-2. Creates all text-to-image tasks,
// polls them, downloads results, then runs image-to-image edits that
// depend on parent results (before the temp URLs expire).
import { MANIFEST } from "./manifest.mjs";
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const API = "https://api.kie.ai/api/v1";
const OUT = path.resolve(import.meta.dirname, "..", "assets-gen");
fs.mkdirSync(OUT, { recursive: true });

const stateFile = path.join(OUT, "_state.json");
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : {};
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

async function api(url, opts) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, opts);
      const j = await r.json();
      return j;
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(4000);
    }
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createTask(item, imageUrl) {
  const model = imageUrl ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image";
  const paramCandidates = imageUrl
    ? [{ image_urls: [imageUrl] }, { image_url: imageUrl }, { images: [imageUrl] }]
    : [{}];
  for (const extra of paramCandidates) {
    const body = { model, input: { prompt: item.prompt, image_size: item.size, ...extra } };
    const j = await api(`${API}/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (j?.code === 200 && j?.data?.taskId) return j.data.taskId;
    console.log(`[${item.id}] create failed with ${JSON.stringify(Object.keys(extra))}: ${j?.msg || JSON.stringify(j)}`);
  }
  return null;
}

async function checkTask(taskId) {
  const j = await api(`${API}/jobs/recordInfo?taskId=${taskId}`, { headers: { Authorization: `Bearer ${KEY}` } });
  const st = j?.data?.state;
  if (st === "success") {
    try { return { done: true, url: JSON.parse(j.data.resultJson).resultUrls[0] }; }
    catch { return { done: true, fail: true, raw: j.data.resultJson }; }
  }
  if (st === "fail" || st === "failed") return { done: true, fail: true, raw: j.data?.failMsg || JSON.stringify(j.data) };
  return { done: false };
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

// Pre-seeded results (e.g. the p-hero test task already generated)
const preseed = process.env.PRESEED ? JSON.parse(process.env.PRESEED) : {};
for (const [id, url] of Object.entries(preseed)) {
  state[id] = state[id] || { url, status: "success" };
}

const base = MANIFEST.filter((m) => !m.editOf);
const edits = MANIFEST.filter((m) => m.editOf);

// Phase 1: create all base tasks
for (const item of base) {
  if (state[item.id]?.status === "success" || state[item.id]?.taskId) continue;
  const taskId = await createTask(item);
  state[item.id] = taskId ? { taskId, status: "pending" } : { status: "create-failed" };
  save();
  console.log(`[${item.id}] created ${taskId}`);
  await sleep(700);
}

// Phase 2: poll base tasks; as parents finish, launch edits
async function pollAll(items, label) {
  let pending = items.filter((i) => state[i.id]?.status === "pending");
  let cycles = 0;
  while (pending.length && cycles < 60) {
    await sleep(12000);
    cycles++;
    for (const item of pending) {
      const s = state[item.id];
      const res = await checkTask(s.taskId);
      if (!res.done) continue;
      if (res.fail) {
        if ((s.retries || 0) < 1) {
          console.log(`[${item.id}] FAILED (${String(res.raw).slice(0, 120)}), retrying`);
          const parent = item.editOf ? state[item.editOf]?.url : null;
          const taskId = await createTask(item, parent);
          state[item.id] = { taskId, status: taskId ? "pending" : "create-failed", retries: (s.retries || 0) + 1 };
        } else {
          s.status = "failed"; s.error = String(res.raw).slice(0, 200);
          console.log(`[${item.id}] FAILED permanently`);
        }
      } else {
        s.status = "success"; s.url = res.url;
        console.log(`[${item.id}] success`);
      }
      save();
    }
    pending = items.filter((i) => state[i.id]?.status === "pending");
    console.log(`${label}: ${items.length - pending.length}/${items.length} settled (cycle ${cycles})`);
  }
}

await pollAll(base, "base");

// Phase 3: edits (parents must be success, use parent URL before expiry)
for (const item of edits) {
  if (state[item.id]?.status === "success") continue;
  const parent = state[item.editOf];
  if (parent?.status !== "success") { state[item.id] = { status: "skipped-no-parent" }; save(); continue; }
  const taskId = await createTask(item, parent.url);
  state[item.id] = taskId ? { taskId, status: "pending" } : { status: "create-failed" };
  save();
  console.log(`[${item.id}] edit created ${taskId}`);
  await sleep(700);
}
await pollAll(edits, "edits");

// Phase 4: download everything
for (const item of MANIFEST) {
  const s = state[item.id];
  if (s?.status !== "success" || !s.url) continue;
  const dest = path.join(OUT, `${item.id}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) { s.file = dest; continue; }
  try {
    const bytes = await download(s.url, dest);
    s.file = dest;
    console.log(`[${item.id}] downloaded ${(bytes / 1024).toFixed(0)}kb`);
  } catch (e) {
    console.log(`[${item.id}] download error: ${e.message}`);
  }
  save();
}

const summary = Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v.status]));
console.log("SUMMARY", JSON.stringify(summary, null, 2));

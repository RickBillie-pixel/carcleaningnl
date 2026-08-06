const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const id = process.argv[2];
for (let i = 0; i < 40; i++) {
  const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`, { headers: { Authorization: `Bearer ${KEY}` } });
  const j = await r.json();
  const st = j?.data?.state;
  if (st === "success") { console.log(JSON.stringify(JSON.parse(j.data.resultJson).resultUrls)); process.exit(0); }
  if (st === "fail" || st === "failed") { console.log("FAILED", JSON.stringify(j.data)); process.exit(1); }
  await new Promise(r => setTimeout(r, 8000));
}
console.log("TIMEOUT"); process.exit(2);

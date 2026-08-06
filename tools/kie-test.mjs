const KEY = process.env.KIE_KEY;
if (!KEY) throw new Error("Zet KIE_KEY in de omgeving voordat je dit script draait.");
const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
  method: "POST",
  headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-image-2-text-to-image",
    input: { prompt: "Professional automotive photography: a silver sports car in a bright white photo studio, soft diffused light, glossy paint reflections on a seamless porcelain-white floor, minimalist, high-end car detailing showcase, no text", image_size: "landscape_16_9" }
  })
});
const j = await res.json();
console.log(JSON.stringify(j, null, 2));

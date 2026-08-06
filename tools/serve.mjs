// Tiny static dev server for the whole repo (all three demos).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".json": "application/json",
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>CarCleaningNL demos</title>
      <body style="font-family:system-ui;padding:3rem;line-height:2">
      <h1>CarCleaningNL demo's</h1>
      <p><a href="/demo-1/">demo-1 Porselein</a> (licht, chroom, galerie)</p>
      <p><a href="/demo-1b/">demo-1b Porselein Editorial</a> (variant: type over beeld, marine-blauw)</p>
      <p><a href="/demo-1c/">demo-1c Porselein Cinema</a> (variant: full-screen banden, sticky boekknop, marine-blauw)</p>
      <p><a href="/demo-1d/">demo-1d Showcase</a> (cinematische hero, scroll-choreografie, navy + azuur)</p>
      <p><a href="/demo-1e/">demo-1e Pill Studio</a> (naar inspiration/image1: pill-nav, giant title + chips, ratingcard)</p>
      <p><a href="/demo-2/">demo-2 Acid Werkplaats</a> (donker, zuurgroen, luid)</p>
      <p><a href="/demo-3/">demo-3 Terracotta Avondlicht</a> (warm, editorial, poster)</p>`);
    return;
  }
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

// Probe each candidate port with a throwaway exclusive bind first, so we
// never silently share a port with another app (Windows allows that).
import net from "node:net";
const PORTS = [8123, 8124, 8125, 8126];
function probe(port) {
  return new Promise((resolve) => {
    const t = net.createServer();
    t.once("error", () => resolve(false));
    t.listen({ port, exclusive: true }, () => t.close(() => resolve(true)));
  });
}
let chosen = null;
for (const p of PORTS) {
  if (await probe(p)) { chosen = p; break; }
}
if (!chosen) { console.error("no free port in " + PORTS.join(",")); process.exit(1); }
server.listen({ port: chosen, exclusive: true }, () => console.log(`SERVING http://localhost:${chosen}/`));

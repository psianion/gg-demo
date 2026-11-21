// Fetch Poly Haven assets (CC0) into blender/vendor/polyhaven. Vendor files are not in git; this restores them.
//
//   node blender/fetch_polyhaven.mjs tex:<id>[:<res>] hdri:<id>[:<res>] ...
//
// Textures land in vendor/polyhaven/textures/<id>/<id>_<map>.jpg (diff, nor, rough, disp, ao), HDRIs beside the others.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "vendor", "polyhaven");
const MAPS = { Diffuse: "diff", nor_gl: "nor", Rough: "rough", Displacement: "disp", AO: "ao" };
const headers = { "User-Agent": "asset-fetch" };

async function save(url, file) {
  if (fs.existsSync(file)) return "have";
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return "got";
}

for (const arg of process.argv.slice(2)) {
  const [kind, id, res = kind === "hdri" ? "2k" : "1k"] = arg.split(":");
  try {
    const r = await fetch(`https://api.polyhaven.com/files/${id}`, { headers });
    const files = await r.json();
    if (kind === "hdri") {
      const state = await save(files.hdri[res].hdr.url, path.join(ROOT, `${id}_${res}.hdr`));
      console.log(`${id} hdri ${res} ${state}`);
      continue;
    }
    const done = [];
    for (const [key, short] of Object.entries(MAPS)) {
      const entry = files[key]?.[res]?.jpg;
      if (!entry) continue;
      await save(entry.url, path.join(ROOT, "textures", id, `${id}_${short}.jpg`));
      done.push(short);
    }
    console.log(`${id} ${res} ${done.join(",") || "MISSING"}`);
  } catch (e) {
    console.log(`${id} FAILED ${e.message}`);
  }
}

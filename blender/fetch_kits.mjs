// Fetch the model packs the build scripts read (world_assets.py, goblin_lp.py, party_lp.py) into blender/vendor/.
// Vendor files are not in git; this restores them, pinned to what was there when the kit was built: a commit for
// the packs cloned from GitHub, a URL and its byte size for the zip. All four are CC0.
//
//   node blender/fetch_kits.mjs [pack ...]                fetch the named packs, or all of them; a pack already there is left alone
//   node blender/fetch_kits.mjs --check [pack ...]        ask every source whether it still answers, without downloading a pack
//   node blender/fetch_kits.mjs --into <dir> [pack ...]   fetch into another folder instead of vendor/
//
// The KayKit packs are cloned, not taken as GitHub archives: their .gitattributes leave most of each pack out of an
// archive. Poly Haven textures and skies are fetched by fetch_polyhaven.mjs.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KAYKIT = "https://github.com/KayKit-Game-Assets";
const PACKS = {
  adventurers: { dir: "KayKit-Character-Pack-Adventures-1.0", repo: `${KAYKIT}/KayKit-Character-Pack-Adventures-1.0`, commit: "672074b73ba276876a19e8816ecdc5241817ab47" },
  dungeon: { dir: "KayKit-Dungeon-Remastered-1.0", repo: `${KAYKIT}/KayKit-Dungeon-Remastered-1.0`, commit: "b0ca9bd96a8072ab36a3a5464f00ed1e06a16d07" },
  hexagon: { dir: "KayKit-Medieval-Hexagon-Pack-1.0", repo: `${KAYKIT}/KayKit-Medieval-Hexagon-Pack-1.0`, commit: "84fa4e91af6a88989be7c99e0891cede11f2ca38" },
  nature: {
    dir: "quaternius/stylized_nature_megakitstandard",
    zip: "https://opengameart.org/sites/default/files/stylized_nature_megakitstandard.zip",
    bytes: 104088529,
  },
};
const headers = { "User-Agent": "asset-fetch" };

const args = process.argv.slice(2);
const check = args.includes("--check");
const into = args.includes("--into") ? args[args.indexOf("--into") + 1] : null;
const root = into ? path.resolve(into) : path.join(path.dirname(fileURLToPath(import.meta.url)), "vendor");
const names = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--into");
const unknown = names.filter((n) => !PACKS[n]);
if (unknown.length) {
  console.log(`unknown pack: ${unknown.join(", ")} (packs: ${Object.keys(PACKS).join(", ")})`);
  process.exit(1);
}

function git(...a) {
  const r = spawnSync("git", a, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr.trim()}`);
}

// Every file of a zip, as [path inside the zip, contents]. Stored and deflated entries only, which is all it uses.
function unzip(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let at = buf.readUInt32LE(end + 16);
  const files = [];
  for (let n = buf.readUInt16LE(end + 10); n > 0; n--) {
    const method = buf.readUInt16LE(at + 10);
    const size = buf.readUInt32LE(at + 20);
    const name = buf.toString("utf8", at + 46, at + 46 + buf.readUInt16LE(at + 28));
    const local = buf.readUInt32LE(at + 42);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    if (!name.endsWith("/")) {
      const raw = buf.subarray(start, start + size);
      files.push([name, method === 0 ? raw : zlib.inflateRawSync(raw)]);
    }
    at += 46 + buf.readUInt16LE(at + 28) + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
  }
  return files;
}

async function fetchPack(pack) {
  const target = path.join(root, pack.dir);
  if (fs.existsSync(target)) return "have";
  const part = `${target}.part`;
  fs.rmSync(part, { recursive: true, force: true });
  if (pack.repo) {                                           // the commit alone, without history, and no .git left behind
    git("init", "-q", part);
    git("-C", part, "fetch", "-q", "--depth", "1", `${pack.repo}.git`, pack.commit);
    git("-C", part, "checkout", "-q", "FETCH_HEAD");
    fs.rmSync(path.join(part, ".git"), { recursive: true, force: true });
  } else {
    const r = await fetch(pack.zip, { headers });
    if (!r.ok) throw new Error(`${r.status} ${pack.zip}`);
    for (const [name, data] of unzip(Buffer.from(await r.arrayBuffer()))) {
      fs.mkdirSync(path.dirname(path.join(part, name)), { recursive: true });
      fs.writeFileSync(path.join(part, name), data);
    }
  }
  fs.renameSync(part, target);                               // only a whole pack lands under its own name
  return "got";
}

async function answer(pack) {
  const url = pack.repo ? `${pack.repo}/commit/${pack.commit}` : pack.zip;
  const r = await fetch(url, { method: "HEAD", headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const size = Number(r.headers.get("content-length"));
  if (pack.bytes && size !== pack.bytes) throw new Error(`${size} bytes, pinned ${pack.bytes}: the zip has changed`);
  return "answers";
}

let failed = 0;
for (const name of names.length ? names : Object.keys(PACKS)) {
  try {
    console.log(`${name} ${await (check ? answer : fetchPack)(PACKS[name])}`);
  } catch (e) {
    console.log(`${name} FAILED ${e.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);

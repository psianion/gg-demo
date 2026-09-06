import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildHero, heroFraming, parkHeroRig, HERO_FOV } from './film/stages/hero';
import { rig } from './film/stages/trilayer';
import { curtain } from './film/curtain';
import { setPencilResolution, STROKE_LAYER } from './film/pencil';
import { FILM_RIG } from './film/stages/rigs';
import { keyDay, keyNight, keyWarm } from './film/palette';

// ?mock=<class> — the surface-class mockup route (DEV only; main.tsx's gate
// constant-folds it out of production exactly like ?sandbox=island and ?gobstudy).
//
// WHY IT EXISTS: a mockup judged alone is how the old world got built. Every row of
// art bible §11.2 is proven against a piece of the ACTUAL HERO ISLAND in the same
// frame, under the shipped hero camera solve, in both rigs — or it is not proven.
//
//   ?mock=rock                 one class, beside the hero
//   ?mock=rock&rig=prep        the drawn half (curtain = 1)
//   ?mock=rock&zoom=4          1..6, tightening on the boundary between the two
//   ?mock=sheet                every BUILT class, tiled in one frame
//   ?mock=sheet&classes=rock,strata,ground
//
// Each class is one file, src/film/mock/<class>.ts, exporting buildMock(). One author
// per file, so twenty-two of them cannot collide. A file that is missing, still a
// stub, or throwing shows a message on the page instead of taking the route down.

// The class list is art bible §11.2's own, minus row 10 (leather stays unused
// film-wide) — id, label, and the author group that owns the file (§11.8).
const CLASSES = [
  { id: 'ground', label: 'Ground card', group: 'A' },
  { id: 'incident', label: 'Incident card', group: 'A' },
  { id: 'rock', label: 'Rock (mass)', group: 'A' },
  { id: 'strata', label: 'Cliff / strata', group: 'A' },
  { id: 'field', label: 'Field wash', group: 'A' },
  { id: 'foliage', label: 'Foliage', group: 'B' },
  { id: 'bark', label: 'Bark / trunk', group: 'B' },
  { id: 'timber', label: 'Timber (mass)', group: 'B' },
  { id: 'plank', label: 'Plank / carpentry', group: 'B' },
  { id: 'metal', label: 'Metal', group: 'B' },
  { id: 'paperprop', label: 'Paper props', group: 'B' },
  { id: 'sky', label: 'Standing sheet — painted', group: 'C' },
  { id: 'snow', label: 'Snow', group: 'C' },
  { id: 'water', label: 'Water', group: 'C' },
  { id: 'fire', label: 'Fire', group: 'C' },
  { id: 'glass', label: 'Glass', group: 'C' },
  { id: 'cloth', label: 'Cloth', group: 'D' },
  { id: 'hide', label: 'Creature hide', group: 'D' },
  { id: 'marks', label: 'Transient mark', group: 'D' },
  { id: 'machinery', label: 'Machinery', group: 'D' },
  { id: 'drawnsheet', label: 'Standing sheet — drawn', group: 'D' },
  { id: 'board', label: 'Painted map / board', group: 'D' },
  // not a class — the §4.7 colour-transfer probe (src/film/mock/transfer.ts)
  { id: 'transfer', label: 'Colour transfer probe (§4.7)', group: '-' },
] as const;

// Lazy glob, NOT eager: one author's broken module must not take down the other
// twenty-one. A rejected import lands in the catch below as a page message.
const MODULES = import.meta.glob('./film/mock/*.ts') as Record<
  string,
  () => Promise<unknown>
>;

type Loaded = { obj: THREE.Object3D | null; note: string };

async function loadMock(id: string): Promise<Loaded> {
  const load = MODULES[`./film/mock/${id}.ts`];
  if (!load) return { obj: null, note: 'no module at src/film/mock/' + id + '.ts' };
  try {
    const m = (await load()) as { buildMock?: () => THREE.Object3D; STUB?: boolean };
    if (m.STUB) return { obj: null, note: 'still a stub — nothing built yet' };
    if (typeof m.buildMock !== 'function') return { obj: null, note: 'exports no buildMock()' };
    const obj = m.buildMock();
    if (!(obj instanceof THREE.Object3D)) return { obj: null, note: 'buildMock() returned no Object3D' };
    return { obj, note: '' };
  } catch (e) {
    return { obj: null, note: 'threw: ' + (e instanceof Error ? e.message : String(e)) };
  }
}

// The hero island is ~5.2 x 3.6 units at the origin; the first mock slot clears its
// rim and its dressing. Three per row, so a full sheet stays roughly square.
const FIRST_X = 6.4;
const GAP = 5.6;
const COLS = 3;

const DEG = Math.PI / 180;

// T-MOCKREADY: &hold=1 pins the route's world clock. rigs.update(t) drives the hero
// campfire's glow through flicker(t), so a Performance capture otherwise depends on how
// many rAFs happened to elapse before the screenshot — measured: two ?mock=sky captures
// differing in 250 bytes at max delta 1. frame.mjs sets hold on every mock capture; an
// interactive tab never has it, so the fire still flickers for a human.
const HOLD = new URLSearchParams(window.location.search).has('hold');
const HOLD_T = 1;

// The four rigs a surface in this project can be lit by (art bible §4.7.2). Declared here
// rather than imported from `mock/transfer.ts`, which measures the same four: a static
// import of a mock module defeats the lazy glob above, and the whole point of that glob is
// that one author's broken module cannot take the route down. Three key tokens, by name.
export type Family = 'cover' | 'extDay' | 'extNight' | 'interior';
const FAMILIES: Record<Family, { key: number; film: boolean }> = {
  cover: { key: keyWarm, film: false }, //    stages/rigs.ts — the hero, and the route's default
  extDay: { key: keyDay, film: true }, //     S3, S4, S6, S7
  extNight: { key: keyNight, film: true }, // S1, S2
  interior: { key: keyWarm, film: true }, //  S5 — a hearth SHOULD be warm
};

// &family=extDay|extNight|interior — JUDGE A SURFACE UNDER THE LIGHT IT SHIPS UNDER.
// The route's default is `cover` and that is correct for a cover-tier surface, but the
// film is not lit by `stages/rigs.ts` (art bible §4.7.2: four rigs ship, and the ext-day
// gain is a scalar where the cover's is 1.22 warm). An S4 massif judged under the cover's
// key is judged under a light it will never stand in — which is how the last two snow
// rounds were graded. Same restage `mock/transfer.ts` measures through, so the image and
// the numbers can never disagree; `rigs.update()` re-writes hemi.intensity every frame,
// so it is re-applied per frame rather than once.
function restageFamily(rigs: ReturnType<typeof buildHero>['rigs'], family: Family) {
  const fam = FAMILIES[family];
  rigs.key.color.setHex(fam.key);
  if (!fam.film) return;
  rigs.hemi.color.setHex(FILM_RIG.sky);
  rigs.hemi.groundColor.setHex(FILM_RIG.ground);
  rigs.hemi.intensity = FILM_RIG.hemiI * (1 - Math.min(1, Math.max(0, rig.curtain.value)));
  rigs.key.intensity = FILM_RIG.keyI;
}

// &aim=x,y,z&dist=d — RE-CENTRE THE SOLVE ON ONE THING. The route frames the union of
// the hero island and the mock, which is the comparison it exists for; but past zoom 3 a
// tall mock leaves that frame, and "the previous verifier never got a clean zoom-4 Prep
// crop of the cap" is a note that has now been written twice. This keeps the shipped
// elevation and azimuth (§6.2 — the authored angles are the whole point) and moves only
// the target and the distance, so a tight crop is still the film's own lens on the thing.
// In the URL, so a walk survives a reload and a frame can be re-taken exactly.
function parseAim(q: URLSearchParams): { at: THREE.Vector3; dist: number } | null {
  const a = (q.get('aim') ?? '').split(',').map(Number);
  if (a.length !== 3 || a.some((n) => !Number.isFinite(n))) return null;
  const d = Number(q.get('dist'));
  return { at: new THREE.Vector3(a[0], a[1], a[2]), dist: Number.isFinite(d) && d > 0 ? d : 6 };
}

function MockScene({
  ids,
  zoom,
  family,
  aim,
  onNotes,
}: {
  ids: string[];
  zoom: number;
  family: Family;
  aim: { at: THREE.Vector3; dist: number } | null;
  onNotes: (n: string[], built: string[]) => void;
}) {
  const { camera, size } = useThree();
  // the real cover: island, dressing, goblin, pencil AND the rigs, all as shipped
  const hero = useMemo(() => buildHero(), []);
  const mocks = useMemo(() => new THREE.Group(), []);
  const [loaded, setLoaded] = useState(0);
  const clock = useRef(0);
  // T-MOCKREADY: mock modules load async (loadMock awaits an import per class), so a
  // capture that only counts rAFs can shoot a route whose classes are not in the scene
  // yet — that is what made wsb-sky-mock-perf-z1.png come back blank. The load effect
  // arms this counter; three useFrame ticks later (enough for the camera re-solve keyed
  // on `loaded` to have run AND rendered) dataset.mockReady flips to '1'.
  const readyTicks = useRef(-1);

  // buildHero() stages the hero rig uniforms. The SEAM is then parked: on this route
  // the curtain alone decides the state, so ?rig=perf and ?rig=prep are like-for-like
  // and the hero half is not permanently drawn beside a fully painted mock.
  useEffect(() => {
    document.documentElement.dataset.mockReady = '';
    rig.seamX.value = 1e6;
    return () => {
      parkHeroRig();
      curtain.value = 0;
    };
  }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      const notes: string[] = [];
      const built: string[] = [];
      mocks.clear();
      let slot = 0;
      for (const id of ids) {
        const known = CLASSES.some((c) => c.id === id);
        if (!known) {
          notes.push(id + ': unknown class');
          continue;
        }
        const m = await loadMock(id);
        if (dead) return;
        if (!m.obj) {
          notes.push(id + ': ' + m.note);
          continue;
        }
        m.obj.position.set(FIRST_X + (slot % COLS) * GAP, 0, Math.floor(slot / COLS) * GAP);
        mocks.add(m.obj);
        built.push(id);
        slot += 1;
      }
      if (dead) return;
      onNotes(notes, built);
      setLoaded((n) => n + 1);
      // armed even when every id produced a note: a blank route WITH its note in the DOM
      // is a valid capture, and a flag that never raises is an indistinguishable timeout.
      readyTicks.current = 3;
    })();
    return () => {
      dead = true;
    };
  }, [ids, mocks, onNotes]);

  // The shipped hero camera solve gives the film's authored elevation and azimuth;
  // the DISTANCE is then re-solved to hold the hero island and the mocks in one
  // frame, and &zoom divides it — so zooming tightens on the boundary between them,
  // which is the comparison this route exists for.
  useEffect(() => {
    const f = heroFraming(size.width, size.height);
    const dir = f.position.clone().sub(f.look).normalize();
    const box = new THREE.Box3().setFromObject(hero.island.root);
    if (mocks.children.length) box.expandByObject(mocks);
    const sph = box.getBoundingSphere(new THREE.Sphere());
    const aspect = size.width / Math.max(1, size.height);
    const vfov = HERO_FOV * DEG;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const d = aim
      ? aim.dist
      : ((sph.radius * 1.06) / Math.sin(Math.min(vfov, hfov) / 2)) / zoom;
    const at = aim ? aim.at : sph.center;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = HERO_FOV;
    cam.position.copy(at).addScaledVector(dir, d);
    cam.lookAt(at);
    cam.updateProjectionMatrix();
    // without the stroke layer the graphite marks do not draw at all on a flat path
    cam.layers.enable(STROKE_LAYER);
    // both depth languages ride the solved distance, as Hero.tsx does
    rig.depthNear.value = d * 0.95;
    rig.depthFar.value = d * 2.4;
    setPencilResolution(size.width, size.height);
  }, [camera, size.width, size.height, zoom, aim, loaded, hero, mocks]);

  useFrame((_, delta) => {
    if (readyTicks.current > 0 && --readyTicks.current === 0)
      document.documentElement.dataset.mockReady = '1';
    clock.current = HOLD ? HOLD_T : clock.current + Math.min(delta, 0.1);
    hero.rigs.update(clock.current);
    if (family !== 'cover') restageFamily(hero.rigs, family);
  });

  return (
    <>
      <primitive object={hero.root} />
      <primitive object={mocks} />
    </>
  );
}

export default function MockSheet() {
  const q = new URLSearchParams(window.location.search);
  const want = q.get('mock') ?? '';
  const zoom = Math.min(6, Math.max(1, Math.round(Number(q.get('zoom')) || 1)));
  const picked = (q.get('classes') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const ids = useMemo(
    () =>
      want === 'sheet'
        ? picked.length
          ? picked
          : CLASSES.map((c) => c.id)
        : [want],
    // the query string does not change without a reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [want],
  );

  const family = ((q.get('family') ?? 'cover') in FAMILIES
    ? q.get('family') ?? 'cover'
    : 'cover') as Family;

  const aim = useMemo(() => parseAim(q), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [prep, setPrep] = useState(q.get('rig') === 'prep');
  const [notes, setNotes] = useState<string[]>([]);
  const [built, setBuilt] = useState<string[]>([]);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const readout = useRef<HTMLDivElement>(null);

  useEffect(() => {
    curtain.value = prep ? 1 : 0;
  }, [prep]);

  const onNotes = useMemo(
    () => (n: string[], b: string[]) => {
      setNotes(n);
      setBuilt(b);
    },
    [],
  );

  // draw calls, live — the ≤120-per-stage budget is the number this route is for
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const info = glRef.current?.info.render;
      if (readout.current && info) {
        readout.current.textContent =
          'draws ' + info.calls + '  tris ' + info.triangles +
          '  curtain ' + curtain.value.toFixed(2) + '  zoom ' + zoom +
          '  family ' + family;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [zoom, family]);

  const btn: CSSProperties = {
    font: '12px ui-monospace, Consolas, monospace',
    padding: '3px 8px',
    background: '#f7f5f0',
    color: '#222',
    border: '1px solid #222',
    cursor: 'pointer',
  };
  const link: CSSProperties = { ...btn, textDecoration: 'none', display: 'inline-block' };
  const q0 =
    '?mock=' + want + (prep ? '&rig=prep' : '') + (family === 'cover' ? '' : '&family=' + family);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f7f5f0' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        // flat = NoToneMapping: render-pipeline parity with the film. Judging a
        // surface under ACES here is art bible §1.2 by name.
        flat
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ fov: HERO_FOV, near: 0.1, far: 200, position: [0, 5, -9] }}
        onCreated={(state) => {
          glRef.current = state.gl;
          (window as unknown as Record<string, unknown>).__mock = state;
        }}
      >
        <MockScene ids={ids} zoom={zoom} family={family} aim={aim} onNotes={onNotes} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          font: '12px ui-monospace, Consolas, monospace',
          color: '#222',
          background: 'rgba(247,245,240,.92)',
          border: '1px solid #222',
          padding: 10,
          maxWidth: 440,
          maxHeight: 'calc(100vh - 20px)',
          overflow: 'auto',
        }}
      >
        <div>
          <b>?mock={want || '(none)'}</b> — art bible §11.2, judged beside the hero island
        </div>
        <div ref={readout} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={btn} onClick={() => setPrep(false)}>rig A · performance</button>
          <button style={btn} onClick={() => setPrep(true)}>rig B · prep</button>
          {[1, 2, 3, 4, 5, 6].map((z) => (
            <a key={z} style={link} href={q0 + '&zoom=' + z}>
              ×{z}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(FAMILIES) as Family[]).map((f) => (
            <a
              key={f}
              style={{ ...link, fontWeight: f === family ? 700 : 400 }}
              href={
                '?mock=' + want + (prep ? '&rig=prep' : '') + '&zoom=' + zoom +
                (f === 'cover' ? '' : '&family=' + f)
              }
            >
              {f}
            </a>
          ))}
        </div>
        {built.length > 0 && (
          <div>
            built, in placement order (left→right, back→front): {built.join(' · ')}
          </div>
        )}
        {notes.length > 0 && (
          <div style={{ borderTop: '1px solid #222', paddingTop: 6 }}>
            <b>not on screen</b>
            {notes.map((n) => (
              <div key={n}>· {n}</div>
            ))}
          </div>
        )}
        <details>
          <summary style={{ cursor: 'pointer' }}>the class list</summary>
          {CLASSES.map((c) => (
            <div key={c.id}>
              <a href={'?mock=' + c.id} style={{ color: '#222' }}>
                {c.id}
              </a>{' '}
              — {c.label} <span style={{ opacity: 0.6 }}>(group {c.group})</span>
            </div>
          ))}
          <div style={{ marginTop: 4 }}>
            <a href="?mock=sheet" style={{ color: '#222' }}>?mock=sheet</a> — every built class
          </div>
        </details>
      </div>
    </div>
  );
}

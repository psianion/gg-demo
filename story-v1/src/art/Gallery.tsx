import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { setPencilResolution, STROKE_LAYER, numeral, PAPER } from '../hero/film/pencil.ts';
import * as A from './index.ts';

// ?art=1 — every prop laid out on paper, one global reveal slider plus each prop's own
// setters, so the drawings can be inspected at any p. Not part of the site.

type Ctl = { label: string; min: number; max: number; step: number; init: number; set: (v: number) => void };
type Item = { name: string; art: A.Art; scale: number; ctl?: Ctl[]; time?: (t: number) => void };

function items(): Item[] {
  const rope = A.buildRope();
  const ropeSag = { a: new THREE.Vector3(-0.7, 0.5, 0), b: new THREE.Vector3(0.7, 0.2, 0.1), sag: 0.25 };
  rope.set(ropeSag.a, ropeSag.b, ropeSag.sag);
  const taper = A.buildTaper();
  const cloud = A.buildCloud();
  const rain = A.buildRain(1.6, 1.2, 1.4);
  const snow = A.buildSnow(1.6, 1.2, 1.4);
  const cap = A.buildSnowCap(0.8);
  const ring = A.buildThreatRing(0.7);
  const sack = A.buildSack();
  const fog = A.buildFogSheet(1.8, 1.4);
  const d20 = A.buildD20(0.35);
  const laptop = A.buildLaptop();
  const players = [0, 1, 2, 3].map((i) => A.buildPlayerToken(i));
  const monsters = A.MONSTER_SETS.flat().map((k) => A.buildMonsterToken(k));
  const row = (arts: A.Token[], dx: number) => {
    const g = new THREE.Group();
    arts.forEach((a, i) => {
      a.root.position.x = (i - (arts.length - 1) / 2) * dx;
      g.add(a.root);
    });
    return {
      root: g,
      reveal: (p: number) => arts.forEach((a) => a.reveal(p)),
      dispose: () => arts.forEach((a) => a.dispose()),
      setFacing: (r: number) => arts.forEach((a) => a.setFacing(r)),
    };
  };
  const pRow = row(players, 0.42);
  const mRow = row(monsters, 0.46);
  const facing = (t: { setFacing: (r: number) => void }): Ctl[] => [
    { label: 'facing', min: -3.14, max: 3.14, step: 0.01, init: 0, set: t.setFacing },
  ];

  return [
    { name: 'grid', art: A.buildGrid(2, 1.6, 0.2), scale: 1 },
    {
      name: 'rope',
      art: rope,
      scale: 1,
      ctl: [{ label: 'sag', min: 0, max: 0.8, step: 0.01, init: ropeSag.sag, set: (v) => rope.set(ropeSag.a, ropeSag.b, v) }],
    },
    { name: 'taper', art: taper, scale: 2.5, ctl: [{ label: 'lit', min: 0, max: 1, step: 0.01, init: 1, set: taper.setLit }] },
    { name: 'cloud', art: cloud, scale: 0.6, ctl: [{ label: 'squash', min: 0, max: 1, step: 0.01, init: 0, set: cloud.setSquash }] },
    { name: 'rain', art: rain, scale: 1, time: rain.setTime, ctl: [{ label: 'rain amount', min: 0, max: 1, step: 0.01, init: 1, set: rain.setAmount }] },
    { name: 'snow', art: snow, scale: 1, time: snow.setTime, ctl: [{ label: 'snow amount', min: 0, max: 1, step: 0.01, init: 1, set: snow.setAmount }] },
    { name: 'snow cap', art: cap, scale: 1.5, ctl: [{ label: 'cap amount', min: 0, max: 1, step: 0.01, init: 1, set: cap.setAmount }] },
    { name: 'players', art: pRow, scale: 1.3, ctl: facing(pRow) },
    { name: 'monsters', art: mRow, scale: 0.85, ctl: facing(mRow) },
    { name: 'threat ring', art: ring, scale: 1, time: ring.setPulse },
    { name: 'sack', art: sack, scale: 2.4, ctl: [{ label: 'tip', min: 0, max: 1, step: 0.01, init: 0, set: sack.setTip }] },
    { name: 'fog', art: fog, scale: 1, ctl: [{ label: 'peel', min: 0, max: 1, step: 0.01, init: 0, set: fog.setPeel }] },
    {
      name: 'd20',
      art: d20,
      scale: 1.6,
      ctl: [{ label: 'd20 tip (1→20)', min: 0, max: 1, step: 0.01, init: 0, set: d20.setTip }],
    },
    { name: 'table', art: A.buildTable(), scale: 0.14 },
    { name: 'laptop', art: laptop, scale: 0.5, ctl: [{ label: 'bezel', min: 0, max: 1, step: 0.01, init: 1, set: laptop.setBezel }] },
    { name: 'lamp', art: A.buildLamp(), scale: 0.45 },
    { name: 'clutter', art: A.buildTableClutter(), scale: 0.17 },
  ];
}

const COLS = 6;
const CELL = 2.4;

function Scene({ list, p, t }: { list: Item[]; p: number; t: number }) {
  const { camera, size } = useThree();
  const group = useMemo(() => {
    const g = new THREE.Group();
    const rows = Math.ceil(list.length / COLS);
    list.forEach((it, i) => {
      const cell = new THREE.Group();
      cell.position.set(((i % COLS) - (COLS - 1) / 2) * CELL, 0, (Math.floor(i / COLS) - (rows - 1) / 2) * CELL * 1.1);
      it.art.root.scale.setScalar(it.scale);
      cell.add(it.art.root);
      const n = numeral(i + 1, 0.16, 'faint');
      n.rotation.set(-Math.PI / 2, 0, Math.PI); // reads upright from -z
      n.position.set(CELL * 0.42, 0.01, -CELL * 0.42);
      cell.add(n);
      g.add(cell);
    });
    return g;
  }, [list]);

  useEffect(() => {
    camera.layers.enable(STROKE_LAYER);
    // builder's beat 2-3 lens: on -z, 52° up (screen-right = -x)
    camera.position.set(0, 13, -10.2);
    camera.lookAt(0, 0, -0.4);
    setPencilResolution(size.width, size.height);
  }, [camera, size.width, size.height]);

  useEffect(() => {
    for (const it of list) it.art.reveal(p);
  }, [list, p]);
  useEffect(() => {
    for (const it of list) it.time?.(t);
  }, [list, t]);

  return (
    <>
      <color attach="background" args={[PAPER]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 8, 5]} intensity={0.5} />
      <primitive object={group} />
    </>
  );
}

function Clock({ play, onT }: { play: boolean; onT: (f: (t: number) => number) => void }) {
  useFrame((_, dt) => {
    if (play) onT((t) => t + Math.min(dt, 0.1));
  });
  return null;
}

export default function Gallery() {
  const list = useMemo(items, []);
  // ?p=0.5&set=sack/tip:0.6,fog/peel:0.5&t=2 — for screenshots of a given state
  const q = new URLSearchParams(location.search);
  const [p, setP] = useState(q.has('p') ? +q.get('p')! : 1);
  const [t, setT] = useState(q.has('t') ? +q.get('t')! : 0);
  const [play, setPlay] = useState(!q.has('t'));
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    for (const it of list) for (const c of it.ctl ?? []) v[`${it.name}/${c.label}`] = c.init;
    for (const kv of (q.get('set') ?? '').split(',').filter(Boolean)) {
      const [k, val] = kv.split(':');
      v[k] = +val;
    }
    return v;
  });
  useEffect(() => {
    for (const it of list) for (const c of it.ctl ?? []) c.set(vals[`${it.name}/${c.label}`]);
  }, [list, vals]);
  useEffect(() => () => list.forEach((it) => it.art.dispose()), [list]);

  const slider = (key: string, label: string, v: number, min: number, max: number, step: number, on: (v: number) => void) => (
    <label key={key} style={{ display: 'grid', gridTemplateColumns: '9em 1fr 3em', gap: 6, alignItems: 'center' }}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} />
      <span>{v.toFixed(2)}</span>
    </label>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f7f5f0', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      <Canvas flat dpr={[1, 2]} camera={{ fov: 32, near: 0.1, far: 200 }} style={{ position: 'absolute', inset: 0 }}>
        <Clock play={play} onT={setT} />
        <Scene list={list} p={p} t={t} />
      </Canvas>
      <div
        style={{
          position: 'absolute', top: 8, right: 8, width: 330, maxHeight: 'calc(100% - 16px)', overflow: 'auto',
          background: 'rgba(247,245,240,0.92)', border: '1px solid #222', padding: 8, display: 'grid', gap: 4,
        }}
      >
        <strong>art gallery — {list.map((it, i) => `${i + 1} ${it.name}`).join(' · ')}</strong>
        {slider('reveal', 'REVEAL p', p, 0, 1, 0.001, setP)}
        <label>
          <input type="checkbox" checked={play} onChange={(e) => setPlay(e.target.checked)} /> play time ({t.toFixed(1)}s)
        </label>
        {list.flatMap((it) =>
          (it.ctl ?? []).map((c) => {
            const k = `${it.name}/${c.label}`;
            return slider(k, c.label, vals[k], c.min, c.max, c.step, (v) => setVals((s) => ({ ...s, [k]: v })));
          }),
        )}
      </div>
    </div>
  );
}

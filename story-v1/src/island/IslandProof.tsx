import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { build, PLAY, PROOF, STAIN, type Built } from './kit';

// ?island=1 — the kit island on its own. Without &proof=1 it is a plain hero view (afloat, turning to the
// pointer); with it, step 1's match view: the Blender tabletop camera, nothing moving, and "B" lays the
// Blender frame over it.

// the Blender camera: at (0.4, -14.0, 21.5) looking at (0.2, 0.3, -0.6), 52 mm on a 36 mm sensor
const CAM_POS = new THREE.Vector3(0.4, 21.5, 14.0);
const CAM_AIM = new THREE.Vector3(0.2, -0.6, -0.3);
const H_FOV = 2 * Math.atan(18 / 52);
// the Blender key lamp stands 43 m from (0, 1, 0) along (-0.52, -0.42, 0.74); the fill at (27, -23, 18)
const KEY_AIM = new THREE.Vector3(0, 0, -1);
const KEY_POS = KEY_AIM.clone().add(new THREE.Vector3(-0.52, 0.74, 0.42).multiplyScalar(43));
const FILL_POS = new THREE.Vector3(27, 18, 23);
// the hero's own camera: lower and closer, the whole island held in frame at any window shape
const HERO_POS = new THREE.Vector3(0, 7.5, 17);
const HERO_AIM = new THREE.Vector3(0, 0.9, 0);
const HERO_HALF = 6.4; // metres to keep in view either side of the island's middle

function Scene({ onStats, hover }: { onStats: (text: string) => void; hover: { current: boolean } }) {
  const { camera, gl, size } = useThree();
  const [island, setIsland] = useState<Built | null>(null);
  const float = useRef<THREE.Group>(null);
  const [wood, setWood] = useState<THREE.Texture | null>(null);
  const mixers = useRef<THREE.AnimationMixer[]>([]);
  const key = useRef<THREE.DirectionalLight>(null);
  const meter = useRef({ t: 0, n: 0 });

  useEffect(() => {
    let live = true;
    const made: THREE.AnimationMixer[] = [];
    void build(made).then((built) => {
      if (!live) return;
      mixers.current = made;
      setIsland(built);
    });
    new THREE.TextureLoader().load('/models/table_wood.jpg', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set((PROOF ? 80 : 400) / 41, (PROOF ? 56 : 400) / 41);
      t.rotation = THREE.MathUtils.degToRad(8);
      t.anisotropy = 8;
      if (live) setWood(t);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    if (PROOF) {
      // hold the Blender frame's horizontal field of view whatever the box's shape
      cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(H_FOV / 2) / aspect));
      cam.position.copy(CAM_POS);
      cam.lookAt(CAM_AIM);
    } else {
      // 30 degrees tall on a wide screen; on a narrow one, as tall as it takes to keep the island's width
      const wide = HERO_HALF / HERO_POS.distanceTo(HERO_AIM);
      cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.max(Math.tan(Math.PI / 12), wide / aspect)));
      cam.position.copy(HERO_POS);
      cam.lookAt(HERO_AIM);
    }
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => {
    const light = key.current;
    if (!light) return;
    light.target.position.copy(KEY_AIM);
    light.target.updateMatrixWorld();
  }, [island]);

  useFrame((state, dt) => {
    for (const m of mixers.current) m.update(dt);
    const g = float.current;
    if (g && !PROOF) {
      // afloat: a slow bob and a slower turn; hovered, it turns to face the pointer and eases back after
      const t = state.clock.elapsedTime;
      const yaw = hover.current ? state.pointer.x * 0.55 : Math.sin(t * 0.27) * 0.12;
      const tilt = hover.current ? -state.pointer.y * 0.06 : 0;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 2.5, dt);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tilt, 2.5, dt);
      g.rotation.z = Math.sin(t * 0.5) * 0.012;
      g.position.y = Math.sin(t * 0.9) * 0.13 + Math.sin(t * 0.37) * 0.05;
    }
    const s = meter.current;
    s.t += dt;
    s.n += 1;
    if (s.t >= 1) {
      const fps = s.n / s.t;
      const text = `${fps.toFixed(0)} fps · ${gl.info.render.calls} draws · ${(gl.info.render.triangles / 1000).toFixed(0)}k tris${PLAY ? ' · clips playing' : ''}`;
      onStats(text);
      (window as unknown as Record<string, unknown>).__islandStats = { fps, calls: gl.info.render.calls, triangles: gl.info.render.triangles };
      s.t = 0;
      s.n = 0;
    }
  });

  return (
    <>
      <color attach="background" args={['#1a110b']} />
      {!PROOF && <fog attach="fog" args={['#1a110b', 28, 95]} />}
      <hemisphereLight args={['#fff0dc', '#6b5a48', 1.5]} />
      <directionalLight
        ref={key}
        position={KEY_POS}
        color="#ffebcc"
        intensity={2.1}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={10}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={14}
        shadow-blurSamples={16}
      />
      <directionalLight position={FILL_POS} color="#ccdeff" intensity={1.1} />
      {wood && island && (
        <mesh rotation-x={-Math.PI / 2} position={[0, island.tableY, -2]}>
          <planeGeometry args={PROOF ? [80, 56] : [400, 400]} />
          <meshStandardMaterial map={wood} color="#948a7c" roughness={0.75} />
        </mesh>
      )}
      {island && (
        <mesh rotation-x={-Math.PI / 2} position={[2.6, island.tableY + 0.02, -1.6]}>
          <circleGeometry args={[10.5, 48]} />
          <meshBasicMaterial map={STAIN} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {island && PROOF && <primitive object={island.loose} />}
      {island && (
        <group ref={float}>
          <primitive object={island.root} />
        </group>
      )}
    </>
  );
}

export default function IslandProof() {
  const [stats, setStats] = useState('loading the kit');
  const [blender, setBlender] = useState(false);
  const hover = useRef(false);

  useEffect(() => {
    if (!PROOF) return;
    const onKey = (e: KeyboardEvent) => e.key.toLowerCase() === 'b' && setBlender((v) => !v);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const note: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    font: '13px/1.4 system-ui, sans-serif',
    color: '#efe9de',
    background: 'rgba(13, 9, 7, 0.72)',
    padding: '6px 10px',
    borderRadius: 4,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d0907', display: 'grid', placeItems: 'center' }}>
      {/* the match view is 16:10 like the Blender frame, so the two can be laid over each other; the hero fills the window */}
      <div
        style={PROOF ? { position: 'relative', aspectRatio: '16 / 10', width: 'min(100vw, 160vh)' } : { position: 'absolute', inset: 0 }}
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
      >
        <Canvas
          shadows={{ type: THREE.VSMShadowMap }}
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
          camera={{ near: 1, far: 260 }}
        >
          <Scene onStats={setStats} hover={hover} />
        </Canvas>
        {blender && (
          <img
            src="/models/blender_tabletop.jpg"
            alt="The same frame rendered in Blender"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        )}
        {PROOF ? (
          <div style={{ ...note, top: 10 }}>
            <b>{blender ? 'Blender frame' : 'three.js, live'}</b> · {stats} · press B to switch
          </div>
        ) : (
          <div style={{ ...note, bottom: 10, opacity: 0.6 }}>{stats}</div>
        )}
      </div>
    </div>
  );
}

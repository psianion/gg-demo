// W1a-fix3 step 1: node geometry test — does the per-tier skirt arc dip inside a
// (smooth, un-roughened) tier cone after the VIEW_CAM push?
//
// Hero tiers verbatim from hero.ts (`tiers` array above `contourArc(0, cy - h / 2 ...)`):
//   [cy, r, h] = [0.55,0.44,0.56], [0.93,0.34,0.50], [1.26,0.23,0.46]
// Kit tiers from foliageKit.ts PINE_TIERS (ratios of h and rWide), evaluated at the
// SAME hero dims (rWide 0.44, h 1.49) via pineProfile(rWide, h) = PINE_TIERS.map(
//   ([cy,r,ch]) => [cy*h, r*rWide, ch*h]).
//
// HERO_AZ = 18deg, HERO_ELEV = 33deg (heroView.ts). VIEW_R/VIEW_CAM per foliageKit.ts
// setView()/hero.ts's own VIEW_CAM literal (both formulas are identical).
//
// contourArc/arcPts: for i in 0..n (n=16), a = a0 + (a1-a0)*i/n; h = cos(a)*rx (jitter
// dropped, j=1, to isolate the geometric cause from per-point PRNG noise — noted in the
// report); point = (VIEW_R.x*h, cy_arc + sin(a)*ry, VIEW_R.z*h) + VIEW_CAM*push.
// arc's own cy is the TIER'S BASE height (cy_tier - ch_tier/2), per both hero.ts:1029 and
// foliageKit.ts pineCrown.

const DEG = Math.PI / 180;
const HERO_AZ = 18 * DEG;
const HERO_ELEV = 33 * DEG;
const VIEW_R = { x: Math.cos(HERO_AZ), z: Math.sin(HERO_AZ) };
const VIEW_CAM = {
  x: Math.sin(HERO_AZ) * Math.cos(HERO_ELEV),
  y: Math.sin(HERO_ELEV),
  z: -Math.cos(HERO_AZ) * Math.cos(HERO_ELEV),
};

const HERO_TIERS = [
  [0.55, 0.44, 0.56],
  [0.93, 0.34, 0.5],
  [1.26, 0.23, 0.46],
];

const PINE_TIERS = [
  [0.369, 1.0, 0.376],
  [0.624, 0.773, 0.336],
  [0.846, 0.523, 0.308],
];
function pineProfile(rWide, h) {
  return PINE_TIERS.map(([cy, r, ch]) => [cy * h, r * rWide, ch * h]);
}
const KIT_TIERS = pineProfile(0.44, 1.49);

const ARC_PUSH_RATIO = 0.3 / 0.44;

// arc sample points for one tier, AFTER push. rx = r*1.01 (paint register), ry = r*0.3,
// span 1.1pi..1.9pi (both hero and kit — identical), n=16.
function arcPoints(tier, push) {
  const [cy, r, ch] = tier;
  const cyArc = cy - ch / 2;
  const rx = r * 1.01;
  const ry = r * 0.3;
  const a0 = 1.1 * Math.PI;
  const a1 = 1.9 * Math.PI;
  const n = 16;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const h = Math.cos(a) * rx;
    const x = VIEW_R.x * h + VIEW_CAM.x * push;
    const y = cyArc + Math.sin(a) * ry + VIEW_CAM.y * push;
    const z = VIEW_R.z * h + VIEW_CAM.z * push;
    pts.push({ x, y, z });
  }
  return pts;
}

// smooth (un-roughened) cone radius at height y, or -1 if y outside the cone's span.
function coneRadiusAt(tier, y) {
  const [cy, r, ch] = tier;
  const top = cy + ch / 2;
  const bot = cy - ch / 2;
  if (y < bot || y > top) return -1;
  return (r * (top - y)) / ch;
}

function testTree(name, tiers, push) {
  const rows = [];
  for (let ti = 0; ti < tiers.length; ti++) {
    const pts = arcPoints(tiers[ti], push);
    let insideCount = 0;
    const insideWhich = new Set();
    for (const p of pts) {
      const d = Math.hypot(p.x, p.z);
      for (let tj = 0; tj < tiers.length; tj++) {
        const rad = coneRadiusAt(tiers[tj], p.y);
        if (rad >= 0 && d < rad) {
          insideCount++;
          insideWhich.add(tj);
          break; // count the point once even if inside multiple cones
        }
      }
    }
    rows.push({
      tree: name,
      arcTier: ti,
      points: pts.length,
      insidePct: (100 * insideCount) / pts.length,
      insideCones: [...insideWhich],
    });
  }
  return rows;
}

console.log('=== push = 0.3*rWide (ARC_PUSH_RATIO * rWide, matches hero literal 0.3 at rWide 0.44) ===');
const heroPush = testTree('hero', HERO_TIERS, 0.3);
const kitPush = testTree('kit', KIT_TIERS, 0.44 * ARC_PUSH_RATIO);
for (const r of [...heroPush, ...kitPush]) console.log(JSON.stringify(r));

console.log('\n=== push = 0 (no camera push) ===');
const heroNoPush = testTree('hero', HERO_TIERS, 0);
const kitNoPush = testTree('kit', KIT_TIERS, 0);
for (const r of [...heroNoPush, ...kitNoPush]) console.log(JSON.stringify(r));

console.log('\nTIER RATIO CHECK (kit PINE_TIERS vs hero tiers / rWide,h):');
for (let i = 0; i < 3; i++) {
  const [cy, r, h] = HERO_TIERS[i];
  console.log(
    `tier${i}: hero-ratio cy=${(cy / 1.49).toFixed(4)} r=${(r / 0.44).toFixed(4)} h=${(h / 1.49).toFixed(4)}` +
      `  kit PINE_TIERS=${JSON.stringify(PINE_TIERS[i])}`,
  );
}

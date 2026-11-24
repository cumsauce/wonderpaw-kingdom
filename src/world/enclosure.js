import * as THREE from 'three';
import { lam, lamT, basic, box, cyl, sph, mesh, group, flatPlane } from '../util.js';
import { T } from '../textures.js';
import { plaqueTexture, muralTexture } from '../signs.js';

export const ENC = { W: 8, D: 6, hw: 4, hd: 3, floorY: 0.12, barTop: 3.4 };

// One cage, built in its own frame: floor centred on the origin,
// visitors stand on the +z side. Options:
//  wall, stripeA, stripeB : colours
//  floor   : texture for the inside floor
//  mural   : 'savanna' | 'lagoon' | 'jungle' | 'ice' | null
//  plaque  : { title, latin, lines } | { blank: true }
//  doorAjar, gate (leave a gap in the front bars with a swinging leaf)
//  light   : colour of the bulb under the canopy (null for none)
export function buildEnclosure(parent, o) {
  const { W, D, hw, hd } = ENC;
  const g = group(parent);
  const rust = lamT(T.rust(1, 4));
  const concrete = lamT(T.concrete(4, 1));
  const out = { group: g };

  box(W + 0.6, 0.12, D + 0.6, lamT(T.concrete(4, 3)), 0, 0.06, 0, g);
  flatPlane(W - 0.1, D - 0.1, lamT(o.floor), 0, 0.125, 0, g);
  out.interior = group(g, 0, ENC.floorY, 0);

  // back wall with a painted backdrop and the keeper's door
  const wallH = 4.0;
  box(W + 0.6, wallH, 0.3, lamT(T.plaster(o.wall, 2, 1)), 0, wallH / 2, -hd - 0.05, g);
  box(W + 0.9, 0.18, 0.5, concrete, 0, wallH + 0.09, -hd - 0.05, g);
  if (o.mural) {
    const mu = mesh(new THREE.PlaneGeometry(5.4, 2.7), lamT(muralTexture(o.mural)), -1.0, 1.95, -hd + 0.11, g);
    mu.castShadow = false;
  }
  const dx = 2.95, dz = -hd + 0.11;
  box(1.1, 2.2, 0.06, lam(0x2a2420), dx, 1.2, dz, g);
  if (o.doorAjar) {
    box(0.96, 2.06, 0.02, basic(0x000000), dx, 1.2, dz + 0.035, g);
    const hinge = group(g, dx - 0.48, 0.17, dz + 0.05);
    hinge.rotation.y = 1.05;
    box(0.96, 2.06, 0.05, lamT(T.plaster('#5a6a5c', 1, 1)), 0.48, 1.03, 0, hinge);
    sph(0.04, lam(0x8a7a3a), 0.86, 1.0, 0.05, hinge, 6, 4);
    out.door = hinge;
  } else {
    box(0.96, 2.06, 0.05, lamT(T.plaster('#5a6a5c', 1, 1)), dx, 1.2, dz + 0.04, g);
    sph(0.04, lam(0x8a7a3a), dx + 0.36, 1.15, dz + 0.09, g, 6, 4);
    box(0.5, 0.12, 0.02, lam(0x1a1a1a), dx, 1.75, dz + 0.07, g); // letterbox slot, at eye height
  }

  // plinth and bars
  const gap = o.gate ? 0.75 : 0;
  const seg = (x0, x1, z) => box(Math.abs(x1 - x0), 0.5, 0.3, concrete, (x0 + x1) / 2, 0.25, z, g);
  if (gap) { seg(-hw - 0.15, -gap, hd); seg(gap, hw + 0.15, hd); } else seg(-hw - 0.15, hw + 0.15, hd);
  for (const sx of [-1, 1]) box(0.3, 0.5, D, concrete, sx * hw, 0.25, 0, g);

  const barPts = [];
  const line = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.25);
    for (let i = 0; i <= n; i++) barPts.push([x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n]);
  };
  if (gap) { line(-hw, hd, -gap, hd); line(gap, hd, hw, hd); } else line(-hw, hd, hw, hd);
  line(-hw, hd, -hw, -hd + 0.2);
  line(hw, hd, hw, -hd + 0.2);
  const barH = ENC.barTop - 0.5;
  const barGeo = new THREE.CylinderGeometry(0.024, 0.024, barH, 5);
  const bars = new THREE.InstancedMesh(barGeo, rust, barPts.length);
  const m = new THREE.Matrix4();
  barPts.forEach(([x, z], i) => { m.makeTranslation(x, 0.5 + barH / 2, z); bars.setMatrixAt(i, m); });
  bars.castShadow = true;
  g.add(bars);
  const rail = (x0, x1, z, y, t = 0.07) => box(Math.abs(x1 - x0), t, t, rust, (x0 + x1) / 2, y, z, g);
  for (const y of [ENC.barTop, 2.6, 0.62]) {
    if (gap) { rail(-hw, -gap, hd, y); rail(gap, hw, hd, y); } else rail(-hw, hw, hd, y);
    for (const sx of [-1, 1]) box(0.07, 0.07, D - 0.1, rust, sx * hw, y, 0.05, g);
  }
  if (gap) rail(-gap, gap, hd, ENC.barTop, 0.09);
  // corner posts with what were once gold finials
  for (const sx of [-1, 1]) {
    cyl(0.09, 0.1, 3.65, rust, sx * hw, 1.83, hd, g, 8);
    sph(0.15, lam(0x8a7430), sx * hw, 3.78, hd, g, 8, 6);
  }
  // spear tips along the front
  const tipGeo = new THREE.ConeGeometry(0.045, 0.2, 4);
  const frontN = barPts.filter(([, z]) => z === hd).length;
  const tips = new THREE.InstancedMesh(tipGeo, lam(0x7a6428), frontN);
  let ti = 0;
  for (const [x, z] of barPts) if (z === hd) { m.makeTranslation(x, ENC.barTop + 0.13, z); tips.setMatrixAt(ti++, m); }
  g.add(tips);

  if (o.gate) {
    const leaf = group(g, -gap, 0, hd);
    const n = 6;
    for (let i = 1; i <= n; i++) cyl(0.026, 0.026, barH + 0.4, rust, (i / n) * gap * 2 - 0.03, 0.12 + (barH + 0.4) / 2, 0, leaf, 5);
    for (const y of [0.14, 2.6, ENC.barTop - 0.05]) box(gap * 2, 0.07, 0.07, rust, gap, y, 0, leaf);
    box(0.16, 0.22, 0.1, lam(0x2a2420), gap * 2 - 0.12, 1.3, 0, leaf); // lock
    leaf.rotation.y = -1.75; // stands open, outward
    out.gate = leaf;
    out.gap = gap;
  }

  // striped canopy that has taken on water
  const cw = W + 1.4, cd = D + 1.9, cz = 0.55;
  const geo = new THREE.PlaneGeometry(cw, cd, 14, 8);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, cz);
  const pa = geo.attributes.position;
  const sag = o.sag ?? 0.3;
  for (let i = 0; i < pa.count; i++) {
    const u = pa.getX(i) / cw + 0.5, v = (pa.getZ(i) - cz) / cd + 0.5;
    pa.setY(i, 4.35 - v * 0.6 - sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) - 0.08 * Math.sin(u * 19) * Math.sin(Math.PI * v));
  }
  geo.computeVertexNormals();
  const canopy = new THREE.Mesh(geo, lamT(T.stripes(o.stripeA, o.stripeB, 9, 1), { side: THREE.DoubleSide }));
  canopy.receiveShadow = true;
  g.add(canopy);
  const frontZ = cz + cd / 2, frontY = 3.75;
  const nScallop = 11, sw = cw / nScallop;
  for (let i = 0; i < nScallop; i++) {
    const sc = mesh(new THREE.CircleGeometry(sw / 2, 8, Math.PI, Math.PI),
      lam(i % 2 ? 0x8f8468 : 0x6e2a24, { side: THREE.DoubleSide }), -cw / 2 + sw * (i + 0.5), frontY, frontZ, g);
    sc.castShadow = false;
  }
  for (const sx of [-1, 1]) cyl(0.04, 0.04, 3.8, rust, sx * (cw / 2 - 0.1), 1.9, frontZ - 0.1, g, 5);

  // bulb under the canopy
  if (o.light) {
    cyl(0.01, 0.01, 0.6, lam(0x111111), 0, 3.55, 1.2, g, 3);
    const bulb = sph(0.07, basic(o.light), 0, 3.22, 1.2, g, 6, 5);
    bulb.castShadow = false;
    const pl = new THREE.PointLight(o.light, o.lightPower ?? 20, 12, 1.5);
    pl.position.set(0, 3.1, 1.2);
    g.add(pl);
    out.light = pl;
    out.bulb = bulb;
  }

  // species plaque on a stand out front
  const st = group(g, -2.7, 0, hd + 1.0);
  cyl(0.04, 0.05, 1.0, rust, 0, 0.5, 0, st, 6);
  const board = box(1.2, 0.82, 0.05, lamT(plaqueTexture(o.plaque, o.seed || 1)), 0, 1.2, 0, st);
  board.rotation.x = -0.45;
  out.plaque = board;

  return out;
}

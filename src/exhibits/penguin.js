import * as THREE from 'three';
import { rng, lam, lamT, box, cyl, sph, mesh, group, updaters } from '../util.js';
import { T } from '../textures.js';
import { makeFigure, makePerformer, resetPose, barsSpot, yawTo, L } from '../performers.js';

const FLOE_Y = 0.34;

export function buildPenguin(enc) {
  const g = enc.interior;
  const r = rng(404);

  // fibreglass ice floe
  const s = new THREE.Shape();
  const outline = [[-3.7, -2.7], [0.6, -2.7], [1.2, -1.8], [0.9, -0.6], [1.1, 0.4], [0.2, 1.0], [-1.6, 0.8], [-2.6, 1.1], [-3.7, 0.5]];
  outline.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const floeGeo = new THREE.ExtrudeGeometry(s, { depth: FLOE_Y, bevelEnabled: false });
  floeGeo.rotateX(-Math.PI / 2);
  mesh(floeGeo, lamT(T.ice(0.5, 0.5)), 0, 0, 0, g);
  // a second, higher shelf at the back
  const s2 = new THREE.Shape();
  [[-3.7, -2.7], [-1.2, -2.7], [-0.9, -2.0], [-2.0, -1.5], [-3.7, -1.7]].forEach(([x, z], i) => (i ? s2.lineTo(x, -z) : s2.moveTo(x, -z)));
  const shelfGeo = new THREE.ExtrudeGeometry(s2, { depth: 0.4, bevelEnabled: false });
  shelfGeo.rotateX(-Math.PI / 2);
  mesh(shelfGeo, lamT(T.ice(0.5, 0.5)), 0, FLOE_Y, 0, g);
  for (let i = 0; i < 5; i++) {
    const pk = mesh(new THREE.ConeGeometry(0.3 + r() * 0.3, 0.8 + r() * 0.9, 5), new THREE.MeshLambertMaterial({ map: T.ice(1, 1), flatShading: true }), -3.3 + i * 0.5 + r() * 0.2, FLOE_Y + 0.75, -2.35 + r() * 0.3, g);
    pk.rotation.y = r() * 3;
  }

  // plunge pool: raised rim, black water
  const pool = group(g, 2.5, 0, 0.9);
  const rimM = lamT(T.bluepaint(2, 1));
  box(2.2, 0.3, 0.16, rimM, 0, 0.15, -1.35, pool); box(2.2, 0.3, 0.16, rimM, 0, 0.15, 1.35, pool);
  box(0.16, 0.3, 2.86, rimM, -1.1, 0.15, 0, pool); box(0.16, 0.3, 2.86, rimM, 1.1, 0.15, 0, pool);
  const water = mesh(new THREE.PlaneGeometry(2.05, 2.56), new THREE.MeshPhongMaterial({ map: T.water(2, 2), shininess: 110, specular: 0x6a7a74 }), 0, 0.22, 0, pool);
  water.rotation.x = -Math.PI / 2; water.castShadow = false;
  updaters.push((t) => { water.material.map.offset.set(Math.sin(t * 0.11) * 0.05, t * 0.004); });
  // something pale just under the surface
  const pale = sph(0.16, lam(0x9a9688), 0.4, 0.17, 0.5, pool, 8, 6); pale.scale.set(1, 0.4, 0.8); pale.castShadow = false;

  // yellow slide from the floe into the pool
  const sl = group(g, 1.25, 0, 0.75);
  sl.rotation.y = -Math.PI / 2 + 0.1;
  const chute = box(0.5, 0.04, 1.5, lam(0xc8a020), 0, 0.5, 0, sl); chute.rotation.x = 0.36;
  for (const sx of [-1, 1]) { const rl = box(0.04, 0.14, 1.5, lam(0xb08a18), sx * 0.26, 0.56, 0, sl); rl.rotation.x = 0.36; }
  cyl(0.03, 0.03, 0.75, lam(0x4a4842), -0.2, 0.37, -0.6, sl, 5); cyl(0.03, 0.03, 0.75, lam(0x4a4842), 0.2, 0.37, -0.6, sl, 5);

  // fish bucket
  const bk = group(g, -0.3, FLOE_Y, 0.55);
  mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 10, 1, true), new THREE.MeshPhongMaterial({ color: 0x7a7a76, shininess: 50, side: THREE.DoubleSide }), 0, 0.15, 0, bk);
  cyl(0.15, 0.15, 0.02, lam(0x5a5a56), 0, 0.01, 0, bk, 10);
  const handle = mesh(new THREE.TorusGeometry(0.2, 0.008, 4, 10, Math.PI), lam(0x3a3a3a), 0, 0.3, 0, bk); handle.rotation.x = -0.5;
  const fishM = new THREE.MeshPhongMaterial({ color: 0x8a96a0, shininess: 90 });
  const fish = (parent, x, y, z, rx, ry) => {
    const f = group(parent, x, y, z); f.rotation.set(rx, ry, 0);
    const b = sph(0.045, fishM, 0, 0, 0, f, 6, 5); b.scale.set(0.5, 1, 2.6);
    const tl = mesh(new THREE.ConeGeometry(0.04, 0.07, 3), fishM, 0, 0, -0.14, f); tl.rotation.x = Math.PI / 2; tl.scale.x = 0.3;
  };
  for (let i = 0; i < 5; i++) fish(bk, (r() - 0.5) * 0.16, 0.27, (r() - 0.5) * 0.16, -1.1 - r() * 0.4, r() * 6);
  fish(g, -1.0, FLOE_Y + 0.025, 0.2, 0, 0.6); fish(g, -1.9, FLOE_Y + 0.025, -0.9, 0, 2.1); fish(g, 0.4, FLOE_Y + 0.025, -0.3, 0, 4);

  // snow machine on a tripod, coughing
  const sm = group(g, 3.3, 0, -2.2);
  sm.rotation.y = -0.9;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; const lg = cyl(0.02, 0.02, 1.7, lam(0x2a2a2a), Math.cos(a) * 0.25, 0.82, Math.sin(a) * 0.25, sm, 4); lg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
  box(0.45, 0.35, 0.6, lam(0x3a4a52), 0, 1.75, 0, sm);
  const nz = mesh(new THREE.ConeGeometry(0.14, 0.3, 8, 1, true), lam(0x1a1a1a, { side: THREE.DoubleSide }), 0, 1.78, 0.42, sm); nz.rotation.x = -Math.PI / 2;
  const N = 90, pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) vel.push({ life: r() * 4, vx: 0, vy: 0, vz: 0 });
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xe8ecec, size: 0.05, transparent: true, opacity: 0.85, depthWrite: false }));
  snow.frustumCulled = false; g.add(snow);
  updaters.push((t, dt) => {
    const cough = Math.sin(t * 1.3) > 0.2 && Math.sin(t * 7.7) > -0.3;
    for (let i = 0; i < N; i++) {
      const v = vel[i]; v.life -= dt;
      if (v.life <= 0) {
        if (!cough) { pos[i * 3 + 1] = -5; v.life = 0.2 + r() * 0.5; continue; }
        pos[i * 3] = 2.95; pos[i * 3 + 1] = 1.78; pos[i * 3 + 2] = -1.95;
        v.vx = -1.2 - r() * 1.4; v.vy = 0.4 + r() * 0.8; v.vz = 0.7 + r() * 1.0; v.life = 2.5 + r() * 2;
      }
      v.vy -= 1.3 * dt; v.vx *= 1 - dt * 0.9; v.vz *= 1 - dt * 0.9;
      pos[i * 3] += v.vx * dt; pos[i * 3 + 1] = Math.max(0.03, pos[i * 3 + 1] + v.vy * dt); pos[i * 3 + 2] += v.vz * dt;
    }
    sg.attributes.position.needsUpdate = true;
  });
  // grey slush where it lands
  for (let i = 0; i < 9; i++) { const sl2 = sph(0.18 + r() * 0.2, lam(0x9aa4a4), 0.4 + r() * 2.2, FLOE_Y * (r() < 0.4 ? 1 : 0) + 0.01, -2.3 + r() * 1.4, g, 6, 4); sl2.scale.y = 0.15; sl2.castShadow = false; }

  // ----- the penguin -----
  const f = makeFigure({
    skin: '#d8b49a', face: 'penguin', hair: null,
    c: { torso: 0x101010, arms: 0x101010, legs: 0x141414, hands: 0x0c0c0c, feet: 0xe07a18, pelvis: 0x101010 },
  });
  const whiteM = lam(0xe8e4d8);
  const belly = sph(0.14, whiteM, 0, 0.1, 0.055, f.chest, 8, 6); belly.scale.set(0.95, 1.5, 0.6);
  const belly2 = sph(0.12, whiteM, 0, 0.12, 0.05, f.spine, 8, 6); belly2.scale.set(0.95, 1.3, 0.6);
  for (const sx of [-1, 1]) { const bt = mesh(new THREE.ConeGeometry(0.04, 0.08, 4), lam(0x0a0a0a), sx * 0.04, 0.28, 0.115, f.chest); bt.rotation.z = sx * Math.PI / 2; }
  for (let i = 0; i < 3; i++) sph(0.012, lam(0x0a0a0a), 0, 0.2 - i * 0.08, 0.14, f.chest, 4, 3);
  // coat tails
  for (const sx of [-1, 1]) { const tl = box(0.11, 0.5, 0.015, lam(0x101010), sx * 0.07, -0.2, -0.13, f.hips); tl.rotation.x = 0.12; tl.rotation.z = sx * 0.06; }
  // swim cap pulled down to the brows
  const cap = mesh(new THREE.SphereGeometry(L.headR * 1.07, 12, 8, 0, 6.283, 0, 0.52 * Math.PI), lam(0xd8d4c4), 0, 0.105, -0.006, f.head);
  cap.scale.set(0.94, 1.12, 1.02);
  // orange beak cone tied over the nose
  const beak = mesh(new THREE.ConeGeometry(0.03, 0.09, 5), lam(0xe07a18), 0, 0.095, 0.145, f.head); beak.rotation.x = Math.PI / 2;
  // flipper mitts and swim fins
  for (const n of ['L', 'R']) {
    const fl = box(0.03, 0.26, 0.11, lam(0x0c0c0c), 0, -0.1, 0, f['hand' + n]); fl.rotation.x = 0.1;
    box(0.2, 0.025, 0.44, lam(0xe07a18), 0, -0.048, 0.2, f['foot' + n]);
  }
  g.add(f.root);

  const p = makePerformer(f, enc.group);
  let yaw = Math.PI / 2, hold = null;
  p.onStage = (s) => { hold = s === 2 ? barsSpot(p, 3.2, 2.62) : null; };
  p.update = (t, dt) => {
    resetPose(f);
    f.armL.rotation.z = 0.3; f.armR.rotation.z = -0.3;
    f.footL.rotation.y = 0.5; f.footR.rotation.y = -0.5;
    if (hold) {
      f.root.position.set(hold.x, 0, hold.z);
      f.root.rotation.set(0, yawTo(p, hold.x, hold.z), 0);
      return;
    }
    const onFloor = p.stage === 1;
    const w = 0.42, c = onFloor ? -1.0 : -1.3, amp = onFloor ? 1.5 : 1.6;
    const x = c + amp * Math.sin(t * w), vx = Math.cos(t * w);
    const target = vx > 0 ? Math.PI / 2 : -Math.PI / 2;
    yaw += (target - yaw) * Math.min(1, dt * 2.5);
    const go = Math.min(1, Math.abs(vx) * 1.8), ph = t * 5.2;
    f.root.position.set(x, onFloor ? 0 : FLOE_Y, onFloor ? 1.9 : -0.6);
    f.root.rotation.set(0, yaw, Math.sin(ph) * 0.1 * go);
    f.legL.rotation.x = Math.sin(ph) * 0.16 * go; f.legR.rotation.x = -Math.sin(ph) * 0.16 * go;
    f.armL.rotation.z = 0.3 + Math.sin(ph) * 0.06 * go; f.armR.rotation.z = -0.3 + Math.sin(ph) * 0.06 * go;
  };
  return p;
}

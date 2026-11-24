import * as THREE from 'three';
import { rng, lam, lamT, basic, box, cyl, sph, mesh, group, updaters } from '../util.js';
import { T } from '../textures.js';
import { tallyTexture } from '../signs.js';
import { makeFigure, makePerformer, resetPose, barsSpot, yawTo } from '../performers.js';

export function buildLion(enc) {
  const g = enc.interior;
  const r = rng(101);

  // rock ledge under a heat lamp
  const rock = new THREE.MeshLambertMaterial({ map: T.rock(2, 2), flatShading: true });
  for (const [x, y, z, s, sy] of [[-2.5, 0.28, -1.8, 0.95, 0.55], [-1.7, 0.2, -2.1, 0.7, 0.5], [-3.1, 0.42, -1.2, 0.7, 0.9], [-2.3, 0.55, -2.2, 0.75, 0.7], [-1.5, 0.12, -1.3, 0.5, 0.35]]) {
    const m = mesh(new THREE.DodecahedronGeometry(s, 0), rock, x, y, z, g);
    m.scale.y = sy;
    m.rotation.set(r(), r() * 6, r());
  }
  cyl(0.02, 0.02, 1.1, lam(0x1a1a1a), -2.4, 3.0, -1.8, g, 4);
  const shade = mesh(new THREE.ConeGeometry(0.28, 0.3, 10, 1, true), lam(0x5a2a20, { side: THREE.DoubleSide }), -2.4, 2.4, -1.8, g);
  const hb = sph(0.09, basic(0xff4a20), -2.4, 2.32, -1.8, g, 6, 5);
  hb.castShadow = false; shade.castShadow = false;
  const heat = new THREE.PointLight(0xff3a14, 7, 6.5, 1.7);
  heat.position.set(-2.4, 2.2, -1.8);
  g.add(heat);
  updaters.push((t) => { heat.intensity = 7 + Math.sin(t * 9) * 0.5; });

  // scratching post, gouged down to the core
  const post = group(g, 2.6, 0, -1.4);
  box(0.9, 0.1, 0.9, lamT(T.wood(1, 1)), 0, 0.05, 0, post);
  cyl(0.17, 0.17, 2.1, lamT(T.rope(2, 22)), 0, 1.15, 0, post, 10);
  cyl(0.24, 0.24, 0.06, lamT(T.wood(1, 1)), 0, 2.23, 0, post, 10);
  for (let i = 0; i < 9; i++) {
    const a = -0.6 + r() * 1.9;
    const sc = box(0.025, 0.5 + r() * 0.7, 0.04, lam(0x2a1e12), Math.sin(a) * 0.165, 0.7 + r() * 0.6, Math.cos(a) * 0.165, post);
    sc.rotation.y = a;
    sc.castShadow = false;
  }
  // loose rope fibres on the floor
  for (let i = 0; i < 16; i++) {
    const f = box(0.02, 0.01, 0.12 + r() * 0.15, lam(0x8a7650), 2.6 + (r() - 0.5) * 1.3, 0.01, -1.4 + (r() - 0.3) * 1.3, g);
    f.rotation.y = r() * 6.28; f.castShadow = false;
  }

  // tyre on a chain
  const piv = group(g, 1.1, 3.25, -0.7);
  cyl(0.012, 0.012, 1.9, lam(0x2a2a2a), 0, -0.95, 0, piv, 4);
  const tyre = mesh(new THREE.TorusGeometry(0.34, 0.13, 6, 14), lam(0x141414), 0, -2.2, 0, piv);
  tyre.rotation.y = 0.5;
  updaters.push((t) => { piv.rotation.z = Math.sin(t * 0.9) * 0.1; piv.rotation.x = Math.sin(t * 0.63) * 0.04; });

  // steel bowl with something in it
  const bowl = group(g, 0.6, 0, -2.2);
  cyl(0.3, 0.22, 0.14, new THREE.MeshPhongMaterial({ color: 0x8a8a86, shininess: 60 }), 0, 0.07, 0, bowl, 12);
  cyl(0.26, 0.26, 0.02, lam(0x4a100c), 0, 0.14, 0, bowl, 12);
  sph(0.08, lam(0x6a1a14), 0.06, 0.16, 0.02, bowl, 6, 4);
  // chew toy and a child's ball
  const toy = group(g, -0.6, 0.07, -0.4);
  toy.rotation.y = 0.8;
  cyl(0.045, 0.045, 0.34, lam(0xc86a8a), 0, 0, 0, toy, 6).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { sph(0.07, lam(0xc86a8a), s * 0.19, 0.035, 0, toy, 6, 5); sph(0.07, lam(0xc86a8a), s * 0.19, -0.035, 0, toy, 6, 5); }
  sph(0.16, lamT(T.stripes('#b8463c', '#d8cfae', 3, 1)), 1.9, 0.16, 0.9, g, 10, 8);

  // scraps of gold cloth caught on things
  for (let i = 0; i < 7; i++) {
    const s = mesh(new THREE.PlaneGeometry(0.14 + r() * 0.1, 0.1 + r() * 0.08), new THREE.MeshPhongMaterial({ color: 0xc9a227, shininess: 70, side: THREE.DoubleSide }), (r() - 0.5) * 6, 0.015, (r() - 0.5) * 4, g);
    s.rotation.set(-Math.PI / 2, 0, r() * 6.28); s.castShadow = false;
  }

  // tally marks, low on the back wall, at crawling height
  const tally = mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshLambertMaterial({ map: tallyTexture(), transparent: true }), 0.9, 0.62, -2.885, g);
  tally.castShadow = false;

  // ----- the lion -----
  const gold = (c) => new THREE.MeshPhongMaterial({ color: c, specular: 0xffe9a0, shininess: 55 });
  const f = makeFigure({
    skin: '#c99a78', face: 'lion', hair: null, mat: gold,
    c: { torso: 0xc9a227, arms: 0xc9a227, legs: 0xc9a227, hands: 0xc9a227, feet: 0x8a6a1a },
  });
  // mane: two rings of matted spikes, plus round ears
  const maneCols = [0x6a3a14, 0x8a4a18, 0x4a2a10, 0x9a5a20];
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 13 : 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + ring * 0.2;
      const len = 0.2 + r() * 0.12;
      const sp = mesh(new THREE.ConeGeometry(0.06, len, 5), lam(maneCols[(r() * 4) | 0]), 0, 0, 0, f.head);
      const rad = 0.13 + len / 2 - 0.04;
      sp.position.set(Math.cos(a) * rad, 0.1 + Math.sin(a) * rad * 1.05, -0.02 - ring * 0.09);
      sp.rotation.z = a - Math.PI / 2;
      sp.rotation.x = -0.25 - ring * 0.3;
    }
  }
  for (const s of [-1, 1]) sph(0.045, lam(0x8a4a18), s * 0.08, 0.215, 0.02, f.head, 6, 5);
  // belt and tail
  const belt = mesh(new THREE.TorusGeometry(0.165, 0.022, 5, 12), lam(0x2a1a10), 0, 0.06, 0, f.hips);
  belt.rotation.x = Math.PI / 2; belt.scale.set(1.1, 0.85, 1);
  const tail = [];
  let tp = group(f.hips, 0, 0.05, -0.13);
  tp.rotation.x = -1.9;
  for (let i = 0; i < 7; i++) {
    cyl(0.018, 0.02, 0.13, lam(0xb8922a), 0, 0.065, 0, tp, 5);
    tail.push(tp);
    tp = group(tp, 0, 0.13, 0);
  }
  mesh(new THREE.ConeGeometry(0.06, 0.2, 6), lam(0x6a3a14), 0, 0.08, 0, tp);
  g.add(f.root);

  const p = makePerformer(f, enc.group);
  let yaw = Math.PI / 2, hold = null;
  p.onStage = (s) => {
    if (s === 2) hold = barsSpot(p, 3.1, 2.25);
    else hold = null;
  };
  p.update = (t, dt) => {
    resetPose(f);
    f.hips.position.y = 0.5;
    f.spine.rotation.x = 1.2;
    f.chest.rotation.x = 0.12;
    f.neck.rotation.x = -0.5;
    f.kneeL.rotation.x = 1.45; f.kneeR.rotation.x = 1.45;
    let gait = 0;
    if (hold) {
      f.root.position.set(hold.x, 0, hold.z - 0.55);
      const ty = yawTo(p, hold.x, hold.z);
      yaw = ty;
    } else {
      const lineZ = p.stage === 1 ? 1.75 : 0.5;
      const w = 0.33;
      const x = 2.6 * Math.sin(t * w), vx = Math.cos(t * w);
      f.root.position.set(x, 0, lineZ);
      const target = vx > 0 ? Math.PI / 2 : -Math.PI / 2;
      yaw += (target - yaw) * Math.min(1, dt * 2.2);
      gait = Math.min(1, Math.abs(vx) * 1.6);
    }
    f.root.rotation.y = yaw;
    const s = Math.sin(t * 2.9) * gait;
    f.armL.rotation.x = -1.3 + s * 0.38; f.armR.rotation.x = -1.3 - s * 0.38;
    f.elbowL.rotation.x = -Math.max(0, -s) * 0.4; f.elbowR.rotation.x = -Math.max(0, s) * 0.4;
    f.legL.rotation.x = -0.12 - s * 0.3; f.legR.rotation.x = -0.12 + s * 0.3;
    f.spine.rotation.z = s * 0.05;
    tail.forEach((seg, i) => { seg.rotation.z = Math.sin(t * 1.7 - i * 0.6) * 0.16; if (i > 0) seg.rotation.x = 0.16; });
  };
  return p;
}

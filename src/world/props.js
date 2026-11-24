import * as THREE from 'three';
import { rng, lam, lamT, basic, box, cyl, sph, mesh, group, addCircle, addBox, updaters } from '../util.js';
import { T } from '../textures.js';

const LAMP_H = 4.3;

export function buildProps(scene) {
  const g = group(scene);
  const r = rng(5150);
  const iron = lamT(T.rust(1, 3));

  // lamp posts, each with a tannoy horn
  const lamps = {};
  const lamp = (name, x, z, lit, color = 0xffc070) => {
    const l = group(g, x, 0, z);
    cyl(0.16, 0.2, 0.5, iron, 0, 0.25, 0, l, 8);
    cyl(0.055, 0.07, LAMP_H - 0.4, iron, 0, LAMP_H / 2, 0, l, 6);
    box(0.5, 0.05, 0.5, iron, 0, LAMP_H - 0.05, 0, l);
    const glass = box(0.34, 0.42, 0.34, lit ? basic(color) : lam(0x3a3c38), 0, LAMP_H + 0.2, 0, l);
    glass.castShadow = false;
    const cap = mesh(new THREE.ConeGeometry(0.36, 0.3, 4), iron, 0, LAMP_H + 0.56, 0, l);
    cap.rotation.y = Math.PI / 4;
    // horn
    const h = group(l, 0, LAMP_H - 0.6, 0);
    h.rotation.y = Math.atan2(-x, -z);
    const horn = mesh(new THREE.ConeGeometry(0.2, 0.42, 8, 1, true), lam(0x6a685e, { side: THREE.DoubleSide }), 0, 0, 0.3, h);
    horn.rotation.x = -Math.PI / 2;
    box(0.06, 0.06, 0.2, iron, 0, 0, 0.08, h);
    addCircle(x, z, 0.18);
    lamps[name] = { x, z, group: l };
    if (lit) {
      const p = new THREE.PointLight(color, 9, 13, 1.7);
      p.position.set(0, LAMP_H + 0.1, 0);
      l.add(p);
      const seed = r() * 100;
      const base = glass.material.color.clone();
      updaters.push((t) => {
        const n = Math.sin(t * 13 + seed) + Math.sin(t * 7.3 + seed * 2) + Math.sin(t * 1.1 + seed);
        const k = n > 1.9 ? 0.15 : n < -2.2 ? 0.4 : 1;
        p.intensity = 9 * k;
        glass.material.color.copy(base).multiplyScalar(0.3 + 0.7 * k);
      });
    }
  };
  lamp('ne', 5.1, -4.2, true, 0xb8e89a); // the sick green one
  lamp('nw', -5.1, -4.2, false);
  lamp('se', 5.1, 4.2, false);
  lamp('sw', -5.1, 4.2, true, 0xffb060);
  lamp('e1', 3.7, 16.6, true, 0xffc070);
  lamp('e2', -3.7, 16.6, false);
  lamp('n1', 3.7, -17, false);
  lamp('n2', -3.7, -17, true, 0xff9a50);

  // festoon bulbs: instanced, a handful still alight
  const pts = [];
  const string = (ax, ay, az, bx, by, bz, sag) => {
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    const n = Math.max(4, Math.round(len / 0.55));
    const line = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new THREE.Vector3(ax + (bx - ax) * t, ay + (by - ay) * t - sag * 4 * t * (1 - t), az + (bz - az) * t);
      line.push(p);
      if (i > 0 && i < n) pts.push(p.clone().setY(p.y - 0.07));
    }
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(line), new THREE.LineBasicMaterial({ color: 0x141414 }));
    g.add(wire);
  };
  const top = LAMP_H + 0.1;
  for (const k of ['ne', 'nw', 'se', 'sw']) string(0, 6.3, 0, lamps[k].x, top, lamps[k].z, 0.5);
  string(lamps.se.x, top, lamps.se.z, lamps.e1.x, top, lamps.e1.z, 1.0);
  string(lamps.sw.x, top, lamps.sw.z, lamps.e2.x, top, lamps.e2.z, 1.0);
  string(lamps.e1.x, top, lamps.e1.z, lamps.e2.x, top, lamps.e2.z, 0.7);
  string(lamps.ne.x, top, lamps.ne.z, lamps.n1.x, top, lamps.n1.z, 1.1);
  string(lamps.nw.x, top, lamps.nw.z, lamps.n2.x, top, lamps.n2.z, 1.1);
  string(lamps.n1.x, top, lamps.n1.z, lamps.n2.x, top, lamps.n2.z, 0.7);
  const bulbGeo = new THREE.SphereGeometry(0.06, 5, 4);
  const liveIdx = pts.map((_, i) => i).filter(() => r() < 0.13);
  const dead = new THREE.InstancedMesh(bulbGeo, lam(0x34322c), pts.length);
  const liveMat = basic(0xffcf80);
  const live = new THREE.InstancedMesh(bulbGeo, liveMat, liveIdx.length);
  const m = new THREE.Matrix4();
  pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); dead.setMatrixAt(i, m); });
  liveIdx.forEach((pi, i) => { const p = pts[pi]; m.makeScale(1.25, 1.25, 1.25).setPosition(p.x, p.y, p.z); live.setMatrixAt(i, m); });
  g.add(dead, live);
  updaters.push((t) => {
    const k = Math.sin(t * 17) * Math.sin(t * 3.1) > 0.8 ? 0.35 : 1;
    liveMat.color.setRGB(1.0 * k, 0.81 * k, 0.5 * k);
  });

  // benches, bins, litter
  const bench = (x, z, ry) => {
    const b = group(g, x, 0, z);
    b.rotation.y = ry;
    const wood = lamT(T.wood(3, 1));
    for (let i = 0; i < 3; i++) box(1.7, 0.04, 0.12, wood, 0, 0.46, -0.15 + i * 0.15, b);
    for (let i = 0; i < 2; i++) box(1.7, 0.12, 0.04, wood, 0, 0.7 + i * 0.18, -0.26, b);
    for (const sx of [-1, 1]) {
      box(0.06, 0.46, 0.45, iron, sx * 0.75, 0.23, 0, b);
      box(0.06, 0.5, 0.06, iron, sx * 0.75, 0.7, -0.26, b);
    }
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    addBox(x - (0.85 * c + 0.28 * s), x + (0.85 * c + 0.28 * s), z - (0.85 * s + 0.28 * c), z + (0.85 * s + 0.28 * c));
    return b;
  };
  bench(-3.4, 11, Math.PI / 2);
  bench(3.4, -10.5, -Math.PI / 2);
  const b3 = bench(-3.5, -20.5, Math.PI / 2);
  // a child's shoe, set neatly on the last bench
  box(0.08, 0.06, 0.17, lam(0xb03a48), 0.3, 0.52, 0, b3);

  const bin = (x, z) => {
    cyl(0.28, 0.24, 0.8, lamT(T.stripes('#4a6a5a', '#3a5548', 4, 1)), x, 0.4, z, g, 10);
    cyl(0.3, 0.3, 0.05, iron, x, 0.82, z, g, 10);
    addCircle(x, z, 0.3);
  };
  bin(3.3, 12.4); bin(-3.3, -6.2); bin(7.2, 2.9);

  // leaflets and popcorn boxes
  const paper = lam(0xb8b09a, { side: THREE.DoubleSide });
  for (let i = 0; i < 46; i++) {
    const p = mesh(new THREE.PlaneGeometry(0.16 + r() * 0.14, 0.2 + r() * 0.1), paper, (r() - 0.5) * 12, 0.03 + r() * 0.01, -26 + r() * 50, g);
    p.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.28);
    p.castShadow = false;
  }
  for (let i = 0; i < 7; i++) {
    const p = box(0.1, 0.16, 0.1, lamT(T.stripes('#b8463c', '#d8cfae', 3, 1)), (r() - 0.5) * 9, 0.06, -20 + r() * 38, g);
    p.rotation.set(Math.PI / 2, 0, r() * 6.28);
  }

  // signpost at the hub with arrows that agree with each other too much
  const post = group(g, -2.9, 0, -3.3);
  cyl(0.06, 0.07, 3.2, iron, 0, 1.6, 0, post, 6);
  addCircle(-2.9, -3.3, 0.15);
  return { group: g, lamps, signpost: post };
}

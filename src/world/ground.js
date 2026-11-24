import * as THREE from 'three';
import { rng, lam, lamT, flatPlane, cyl, box, group, addCircle, updaters } from '../util.js';
import { T } from '../textures.js';

export function buildGround(scene) {
  const g = group(scene);
  flatPlane(160, 160, lamT(T.grass(80, 80)), 0, 0, 0, g);

  const asphalt = (w, d, x, z, y = 0.012) => flatPlane(w, d, lamT(T.asphalt(w / 3, d / 3)), x, y, z, g);
  asphalt(6, 63, 0, -3.5); // main avenue, entrance to the far end
  asphalt(40, 5, 0, 0, 0.014); // cross path to the locked side gates
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) asphalt(3.5, 9, sx * 4.7, sz * 9, 0.013);
  asphalt(18, 8, 0, 24.2, 0.011); // forecourt outside the gate

  const hub = new THREE.Mesh(new THREE.CircleGeometry(6.2, 28), lamT(T.cobble(6, 6)));
  hub.rotation.x = -Math.PI / 2;
  hub.position.y = 0.02;
  hub.receiveShadow = true;
  g.add(hub);

  // Weeds through the cracks and along every edge.
  const r = rng(900);
  const weedGeo = new THREE.ConeGeometry(0.05, 0.4, 4);
  weedGeo.translate(0, 0.2, 0);
  const weeds = new THREE.InstancedMesh(weedGeo, lam(0x4a4a2c), 520);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < 520; i++) {
    let x, z;
    if (i < 300) {
      const side = r() < 0.5 ? -1 : 1;
      x = side * (3 + (r() - 0.35) * 1.4);
      z = -34 + r() * 60;
    } else {
      x = (r() - 0.5) * 38;
      z = -30 + r() * 56;
    }
    e.set((r() - 0.5) * 0.7, r() * 6.28, (r() - 0.5) * 0.7);
    q.setFromEuler(e);
    const k = 0.5 + r() * 1.6;
    s.set(k, k * (0.6 + r()), k);
    m.compose(v.set(x, 0, z), q, s);
    weeds.setMatrixAt(i, m);
  }
  g.add(weeds);

  // Bare trees, mostly as shapes in the fog.
  const bark = lam(0x2a241e);
  const branch = (parent, len, rad, depth) => {
    const b = cyl(rad * 0.6, rad, len, bark, 0, len / 2, 0, parent, 5);
    if (depth <= 0) return;
    const n = 2 + ((r() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const j = group(parent, 0, len * (0.6 + r() * 0.4), 0);
      j.rotation.set((r() - 0.5) * 1.6, r() * 6.28, 0.3 + r() * 0.7);
      branch(j, len * (0.55 + r() * 0.2), rad * 0.6, depth - 1);
    }
    return b;
  };
  for (const [x, z] of [[-15, 16], [15.5, 17.5], [-16, -18], [16, -19], [-9, -22], [10, 21.5], [-14.5, 2.8]]) {
    const t = group(g, x, 0, z);
    t.rotation.y = r() * 6.28;
    branch(t, 2.6 + r(), 0.2, 3);
    addCircle(x, z, 0.3);
  }

  // Perimeter chain-link, with tarps cable-tied over stretches of it.
  const linkMat = (len) => new THREE.MeshLambertMaterial({
    map: T.chainlink(len / 0.4, 2.6 / 0.4), alphaTest: 0.5, side: THREE.DoubleSide,
  });
  const fence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.6), linkMat(len));
    p.position.set((x0 + x1) / 2, 1.3, (z0 + z1) / 2);
    p.rotation.y = Math.atan2(-(z1 - z0), x1 - x0);
    g.add(p);
    const n = Math.round(len / 3);
    for (let i = 0; i <= n; i++) {
      cyl(0.04, 0.04, 2.8, lam(0x4a4842), x0 + ((x1 - x0) * i) / n, 1.4, z0 + ((z1 - z0) * i) / n, g, 5);
    }
    return p;
  };
  fence(-20, -32, -20, 27);
  fence(20, -32, 20, 27);
  fence(-20, -32, 20, -32);
  fence(-20, 27, 20, 27);
  fence(-20, 20.2, -4, 20.2);
  fence(4, 20.2, 20, 20.2);
  const tarp = lam(0x3d4a52, { side: THREE.DoubleSide });
  for (const [x, z, ry, w] of [[-19.9, 9, Math.PI / 2, 6], [19.9, -8, Math.PI / 2, 8], [-10, -31.9, 0, 7], [19.9, 11, Math.PI / 2, 5], [12, 20.1, 0, 5]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2, 6, 2), tarp);
    const pa = p.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 2.1) * 0.06 + Math.sin(pa.getY(i) * 3) * 0.04);
    p.geometry.computeVertexNormals();
    p.position.set(x, 1.3, z);
    p.rotation.y = ry;
    g.add(p);
  }
  // locked side gates at the ends of the cross path
  for (const sx of [-1, 1]) {
    box(0.12, 2.8, 4.6, lam(0x2c2622), sx * 19.8, 1.4, 0, g);
    box(0.2, 0.3, 0.3, lam(0x8a7a3a), sx * 19.7, 1.3, 0, g);
  }

  // A wheel beyond the fence that still turns.
  const wheel = group(g, -29, 9.5, -7);
  wheel.rotation.y = Math.PI / 2;
  const dark = lam(0x1c1c1c);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.12, 5, 28), dark);
  wheel.add(rim);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.283;
    const sp = box(0.08, 7.5, 0.08, dark, Math.cos(a) * 3.75, Math.sin(a) * 3.75, 0, wheel);
    sp.rotation.z = a - Math.PI / 2;
    const gon = box(0.9, 0.9, 0.7, lam(0x2a2422), Math.cos(a) * 7.5, Math.sin(a) * 7.5 - 0.6, 0, wheel);
    gon.userData.a = a;
  }
  box(0.4, 10, 0.4, dark, -29, 5, -6.3, g).rotation.x = 0.12;
  box(0.4, 10, 0.4, dark, -29, 5, -7.7, g).rotation.x = -0.12;
  updaters.push((t) => {
    wheel.rotation.z = t * 0.035;
    for (const c of wheel.children) if (c.userData.a !== undefined) c.rotation.z = -wheel.rotation.z;
  });

  return g;
}

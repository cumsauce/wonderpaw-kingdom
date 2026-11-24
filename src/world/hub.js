import * as THREE from 'three';
import { lam, lamT, basic, box, cyl, sph, mesh, group, addCircle, addBox, updaters } from '../util.js';
import { T } from '../textures.js';
import { clockTexture } from '../signs.js';

export function buildHub(scene) {
  const g = group(scene);
  const mint = lamT(T.plaster('#8fb0a0', 1, 2));
  const cream = lamT(T.plaster('#cfc39a', 2, 1));

  // clock tower
  cyl(1.5, 1.7, 0.9, lamT(T.concrete(4, 1)), 0, 0.45, 0, g, 8);
  box(1.5, 5.2, 1.5, mint, 0, 3.5, 0, g);
  box(1.9, 0.25, 1.9, cream, 0, 6.2, 0, g);
  box(1.75, 1.7, 1.75, lamT(T.plaster('#c98a94', 1, 1)), 0, 7.15, 0, g);
  const roof = mesh(new THREE.ConeGeometry(1.6, 2.2, 4), lamT(T.stripes('#2f5a5c', '#3d6c6a', 6, 1)), 0, 9.1, 0, g);
  roof.rotation.y = Math.PI / 4;
  cyl(0.03, 0.03, 0.9, lam(0x8a7a3a), 0, 10.5, 0, g, 5);
  sph(0.14, lam(0x8a7a3a), 0, 11, 0, g);
  // four faces, four different wrong times
  const times = [[3, 0], [11, 42], [7, 17], [3, 1]];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 6.283;
    const f = mesh(new THREE.CircleGeometry(0.66, 20), lamT(clockTexture(times[i][0], times[i][1], 40 + i)), Math.sin(a) * 0.89, 7.15, Math.cos(a) * 0.89, g);
    f.rotation.y = a;
    f.castShadow = false;
  }
  // little arched doorway with nothing behind it
  box(0.7, 1.5, 0.05, basic(0x040404), 0, 1.65, 0.76, g);

  // ring bench
  cyl(2.45, 2.45, 0.1, lamT(T.wood(8, 1)), 0, 0.98, 0, g, 16);
  cyl(2.2, 2.3, 0.14, lam(0x2a221a), 0, 0.88, 0, g, 16);
  addCircle(0, 0, 2.5);

  // balloon cart, one balloon left
  const cart = group(g, 4.1, 0, 3.0);
  cart.rotation.y = -0.5;
  box(1.5, 0.7, 0.9, lamT(T.plaster('#b8463c', 1, 1)), 0, 0.85, 0, cart);
  for (const sx of [-1, 1]) {
    const w = cyl(0.42, 0.42, 0.06, lam(0x2a221a), sx * 0.5, 0.42, 0.5, cart, 12);
    w.rotation.x = Math.PI / 2;
  }
  for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) cyl(0.025, 0.025, 1.5, lam(0x8a7a3a), x, 1.95, z, cart, 5);
  const can = mesh(new THREE.ConeGeometry(1.25, 0.6, 4), lamT(T.stripes('#b8463c', '#cfc39a', 6, 1)), 0, 3.0, 0, cart);
  can.rotation.y = Math.PI / 4;
  const tie = group(cart, 0.55, 1.2, 0.3);
  const str = cyl(0.006, 0.006, 1.9, lam(0xd8d0c0), 0, 0.95, 0, tie, 3);
  str.castShadow = false;
  const balloon = sph(0.24, new THREE.MeshPhongMaterial({ color: 0xc0181c, shininess: 80 }), 0, 2.1, 0, tie, 12, 9);
  balloon.scale.y = 1.2;
  updaters.push((t) => {
    tie.rotation.z = Math.sin(t * 0.7) * 0.07;
    tie.rotation.x = Math.sin(t * 0.53 + 1) * 0.06;
  });
  addBox(4.1 - 0.85, 4.1 + 0.85, 3.0 - 0.75, 3.0 + 0.75);

  // a pram on its side; one wheel has not stopped
  const pram = group(g, -3.3, 0.36, 3.9);
  pram.rotation.set(0.1, 0.9, Math.PI / 2 - 0.12);
  box(0.5, 0.42, 0.85, lam(0x26303a), 0, 0.25, 0, pram);
  const hood = mesh(new THREE.SphereGeometry(0.36, 8, 6, 0, Math.PI), lam(0x1e2830), 0, 0.42, -0.2, pram);
  hood.rotation.y = Math.PI / 2;
  hood.rotation.x = -0.3;
  const wheels = [];
  for (const [x, z] of [[-0.3, -0.32], [0.3, -0.32], [-0.3, 0.32], [0.3, 0.32]]) {
    const w = group(pram, x, -0.06, z);
    const tor = mesh(new THREE.TorusGeometry(0.15, 0.02, 4, 10), lam(0x111111), 0, 0, 0, w);
    tor.rotation.y = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const sp = box(0.01, 0.29, 0.012, lam(0x7a7a72), 0, 0, 0, w);
      sp.rotation.x = (i / 3) * Math.PI;
    }
    wheels.push(w);
  }
  cyl(0.012, 0.012, 0.7, lam(0x7a7a72), 0, 0.75, 0.55, pram, 4).rotation.x = -0.6;
  updaters.push((t) => { wheels[1].rotation.x = t * 1.1; });
  addCircle(-3.3, 3.9, 0.45);

  // dropped ice cream, still not melted
  const ice = group(g, 1.4, 0, 6.6);
  const cone = mesh(new THREE.ConeGeometry(0.045, 0.16, 6), lam(0xa87a3a), 0, 0.045, 0, ice);
  cone.rotation.z = Math.PI / 2 + 0.2;
  sph(0.06, lam(0xe8b8c0), 0.1, 0.045, 0, ice, 6, 5);
  const splat = mesh(new THREE.CircleGeometry(0.16, 9), lam(0xd8a0aa), 0.14, 0.025, 0.02, ice);
  splat.rotation.x = -Math.PI / 2;

  return g;
}

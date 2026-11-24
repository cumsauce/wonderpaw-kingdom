import * as THREE from 'three';
import { rng, lam, lamT, basic, box, cyl, sph, mesh, group, addBox, updaters } from '../util.js';
import { T } from '../textures.js';
import { letterTexture, textTexture } from '../signs.js';

const Z = 20.2;

export function buildEntrance(scene) {
  const g = group(scene, 0, 0, Z);
  const r = rng(31);
  const pink = lamT(T.plaster('#c98a94', 1, 1));
  const cream = lamT(T.plaster('#cfc39a', 2, 1));

  // pillars with stepped caps
  for (const sx of [-1, 1]) {
    box(1.3, 5, 1.3, pink, sx * 3.35, 2.5, 0, g);
    box(1.6, 0.3, 1.6, cream, sx * 3.35, 5.15, 0, g);
    box(1.1, 0.5, 1.1, pink, sx * 3.35, 5.55, 0, g);
    sph(0.42, lam(0x8a7a3a), sx * 3.35, 6.15, 0, g);
    addBox(sx * 3.35 - 0.65, sx * 3.35 + 0.65, Z - 0.65, Z + 0.65);
  }

  // scalloped arch board
  const s = new THREE.Shape();
  s.moveTo(-2.7, 0);
  for (let i = 0; i < 5; i++) {
    const cx = -2.16 + i * 1.08;
    s.absarc(cx, 0, 0.54, Math.PI, 0, true);
  }
  s.lineTo(2.7, 1.9);
  s.lineTo(-2.7, 1.9);
  s.lineTo(-2.7, 0);
  const archGeo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false });
  archGeo.translate(0, 0, -0.25);
  mesh(archGeo, lam(0x9aa88a), 0, 3.5, 0, g);

  // marquee sign: two rows of letter tiles, facing out toward the forecourt
  const sg = group(g, 0, -0.55, 0.32);
  box(7.4, 2.5, 0.25, lam(0x4a2420), 0, 6.75, 0, sg);
  const tiles = group(sg, 0, 6.75, 0.14);
  const rows = [['W', 'O', 'N', 'D', 'E', 'R', 'P', 'A', 'W'], ['K', 'I', 'N', 'G', 'D', 'O', 'M']];
  let seed = 1;
  rows.forEach((row, ri) => {
    const y = ri === 0 ? 0.56 : -0.56;
    row.forEach((ch, i) => {
      const x = (i - (row.length - 1) / 2) * 0.74;
      const t = box(0.64, 0.8, 0.06, lamT(letterTexture(ch, seed++)), x, y, 0, tiles);
      if (ri === 0 && i === 3) { // hangs by one screw
        t.position.set(x + 0.18, y - 0.3, 0.02);
        t.rotation.z = -0.9;
      }
      if (ri === 1 && i === 3) { // fell off years ago
        t.position.set(1.6, -6.16, 1.6);
        t.rotation.set(-Math.PI / 2 + 0.05, 0, 0.6);
      }
    });
  });
  // bulbs round the board, mostly dead
  const live = [];
  const deadMat = lam(0x3a3630), liveMat = basic(0xffd890);
  const bulb = (x, y) => {
    const on = r() < 0.16;
    const b = sph(0.07, on ? liveMat : deadMat, x, y, 0.16, sg, 6, 4);
    b.castShadow = false;
    if (on) live.push(b);
  };
  for (let i = 0; i <= 18; i++) { bulb(-3.6 + i * 0.4, 8.05); bulb(-3.6 + i * 0.4, 5.45); }
  for (let i = 1; i < 6; i++) { bulb(-3.6, 5.45 + i * 0.433); bulb(3.6, 5.45 + i * 0.433); }
  const glow = new THREE.PointLight(0xffc878, 5, 9, 1.8);
  glow.position.set(0, 6.6, 1.2);
  sg.add(glow);
  updaters.push((t) => {
    const f = Math.sin(t * 31) > 0.92 || Math.sin(t * 2.3 + 1) > 0.97 ? 0.15 : 1;
    liveMat.color.setHex(f < 1 ? 0x4a3a20 : 0xffd890);
    glow.intensity = 5 * f;
  });

  // back of the board, seen from inside: just one word
  const back = box(5.2, 1.1, 0.04, lamT(textTexture(['THANK YOU FOR STAYING'], { w: 640, h: 128, font: 'bold 40px Georgia, serif', bg: '#4a2420', fg: '#d8cfae', seed: 8 })), 0, 6.75, -0.15, sg);
  back.rotation.y = Math.PI;

  // turnstiles: side lanes barred, the middle one snapped off
  const steel = lamT(T.rust(1, 1));
  for (const sx of [-1, 1]) {
    const px = sx * 1.35;
    cyl(0.12, 0.14, 1.05, steel, px, 0.52, 0, g, 8);
    box(0.4, 0.14, 0.4, steel, px, 1.1, 0, g);
    for (let i = 0; i < 3; i++) {
      const a = group(g, px, 0.95, 0);
      a.rotation.x = (i / 3) * 6.283 + 0.4;
      const bar = cyl(0.025, 0.025, 1.25, steel, sx * 0.62, 0, 0, a, 5);
      bar.rotation.z = Math.PI / 2;
      a.rotation.z = 0;
      bar.position.y = 0.0;
      a.children[0].position.set(sx * 0.62, 0.22, 0);
    }
    addBox(Math.min(px, sx * 2.7), Math.max(px, sx * 2.7), Z - 0.18, Z + 0.18);
  }
  const arm = cyl(0.025, 0.025, 1.2, steel, 0.4, 0.03, 0.9, g, 5);
  arm.rotation.set(0, 0.5, Math.PI / 2);
  // chain that used to close the middle lane
  for (let i = 0; i < 9; i++) {
    const l = mesh(new THREE.TorusGeometry(0.04, 0.012, 4, 6), steel, -1.2 + i * 0.09, 0.03 + (i < 3 ? (3 - i) * 0.28 : 0), 0.25 + i * 0.03, g);
    l.rotation.x = i % 2 ? 0 : Math.PI / 2;
  }

  // ticket booth, out on the forecourt
  const b = group(scene, -6.4, 0, 23.2);
  b.rotation.y = 0.35;
  box(2.2, 2.5, 2.2, lamT(T.plaster('#8fb0a8', 1, 1)), 0, 1.25, 0, b);
  const roof = mesh(new THREE.ConeGeometry(2.0, 1.1, 4), lamT(T.stripes('#8a2a22', '#cfc39a', 6, 1)), 0, 3.05, 0, b);
  roof.rotation.y = Math.PI / 4;
  box(1.4, 0.9, 0.06, basic(0x050505), 0, 1.55, 1.11, b); // window onto nothing
  box(1.5, 0.5, 0.08, steel, 0, 1.82, 1.14, b); // shutter, half down
  box(1.7, 0.08, 0.3, lam(0x4a3826), 0, 1.06, 1.2, b);
  box(1.6, 0.42, 0.05, lamT(textTexture(['TICKETS'], { w: 256, h: 72, font: 'bold 40px Georgia, serif', seed: 21 })), 0, 2.26, 1.12, b);
  box(1.3, 0.36, 0.04, lamT(textTexture(['ADMIT ONE. ADMIT ONE.', 'ADMIT ONE.'], { w: 320, h: 96, font: '24px Georgia, serif', lh: 30, seed: 22 })), 0, 0.72, 1.12, b);
  addBox(-6.4 - 1.35, -6.4 + 1.35, 23.2 - 1.35, 23.2 + 1.35);

  // notice board just inside
  const n = group(scene, 4.3, 0, 17.6);
  n.rotation.y = -Math.PI / 2 + 0.25;
  cyl(0.05, 0.05, 2.2, lam(0x2c2622), -0.7, 1.1, 0, n, 6);
  cyl(0.05, 0.05, 2.2, lam(0x2c2622), 0.7, 1.1, 0, n, 6);
  box(1.7, 1.3, 0.06, lamT(textTexture(
    ['PARK RULES', 'Smile back.', 'Do not answer the animals.', 'Do not count the cages.', 'Stay for the feeding.'],
    { w: 512, h: 400, font: '34px Georgia, serif', lh: 58, border: '#3a2a16', seed: 23 },
  )), 0, 1.5, 0, n);

  return g;
}

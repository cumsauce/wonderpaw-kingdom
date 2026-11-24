import * as THREE from 'three';
import { rng, lam, lamT, box, cyl, sph, mesh, group, updaters } from '../util.js';
import { T } from '../textures.js';
import { typedTexture } from '../signs.js';
import { makeFigure, makePerformer, resetPose, poseStand, barsSpot, yawTo, SHOULDER_Y, REACH, L } from '../performers.js';

const BAR_Y = 2.62;

export function buildChimp(enc) {
  const g = enc.interior;
  const r = rng(303);
  const wood = lamT(T.wood(1, 4));
  const rope = lamT(T.rope(1, 14));

  // climbing frame with monkey bars
  const fr = group(g, -0.3, 0, -0.8);
  for (const [x, z] of [[-1.7, -0.6], [1.7, -0.6], [-1.7, 0.6], [1.7, 0.6]]) cyl(0.07, 0.08, BAR_Y + 0.1, wood, x, (BAR_Y + 0.1) / 2, z, fr, 7);
  for (const z of [-0.6, 0.6]) { const b = cyl(0.05, 0.05, 3.6, wood, 0, BAR_Y, z, fr, 6); b.rotation.z = Math.PI / 2; }
  for (let i = 0; i < 9; i++) { const rung = cyl(0.022, 0.022, 1.2, lamT(T.rust(1, 2)), -1.4 + i * 0.35, BAR_Y, 0, fr, 5); rung.rotation.x = Math.PI / 2; }
  for (let i = 0; i < 6; i++) { const rung = cyl(0.025, 0.025, 1.2, wood, -1.7, 0.35 + i * 0.38, 0, fr, 5); rung.rotation.x = Math.PI / 2; }
  // platform halfway up one end
  box(0.9, 0.06, 1.3, lamT(T.wood(2, 1)), 1.3, 1.35, 0, fr);

  // rope swing and a knotted climbing rope
  const sw = group(fr, 0.75, BAR_Y, 0.6);
  for (const s of [-1, 1]) cyl(0.014, 0.014, 1.75, rope, s * 0.25, -0.875, 0, sw, 4);
  box(0.62, 0.04, 0.2, lamT(T.wood(1, 1)), 0, -1.76, 0, sw);
  updaters.push((t) => { sw.rotation.x = Math.sin(t * 1.15) * 0.13; });
  const cr = group(fr, -0.9, BAR_Y, -0.6);
  cyl(0.022, 0.022, 2.3, rope, 0, -1.15, 0, cr, 5);
  for (let i = 0; i < 4; i++) sph(0.045, rope, 0, -0.5 - i * 0.5, 0, cr, 6, 4);
  updaters.push((t) => { cr.rotation.z = Math.sin(t * 0.8 + 2) * 0.05; });

  // tyre on the floor
  const tyre = mesh(new THREE.TorusGeometry(0.36, 0.14, 6, 14), lam(0x141414), -2.9, 0.14, 1.5, g);
  tyre.rotation.x = Math.PI / 2;

  // banana crate
  const cr8 = group(g, 2.9, 0, 0.9);
  cr8.rotation.y = 0.3;
  for (const [x, z, w, d] of [[0, -0.3, 0.7, 0.04], [0, 0.3, 0.7, 0.04], [-0.33, 0, 0.04, 0.6], [0.33, 0, 0.04, 0.6]]) box(w, 0.4, d, lamT(T.wood(1, 2)), x, 0.2, z, cr8);
  box(0.66, 0.03, 0.6, lamT(T.wood(2, 1)), 0, 0.02, 0, cr8);
  const banana = (parent, x, y, z, col, rot) => {
    const b = mesh(new THREE.TorusGeometry(0.11, 0.022, 5, 7, 1.7), lam(col), x, y, z, parent);
    b.rotation.set(Math.PI / 2 + (r() - 0.5), rot, r());
    b.castShadow = false;
    return b;
  };
  for (let i = 0; i < 14; i++) banana(cr8, (r() - 0.5) * 0.45, 0.28 + r() * 0.16, (r() - 0.5) * 0.4, r() < 0.4 ? 0x2a2210 : 0xc8a828, r() * 6);
  for (let i = 0; i < 6; i++) banana(g, 1.2 + (r() - 0.5) * 2.4, 0.025, 1.2 + (r() - 0.5) * 1.6, 0x241c0c, r() * 6);

  // typewriter on a stool, and what he has written so far
  const st = group(g, 1.2, 0, 1.75);
  st.rotation.y = -0.25;
  cyl(0.2, 0.2, 0.05, lamT(T.wood(1, 1)), 0, 0.6, 0, st, 10);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; const leg = cyl(0.02, 0.02, 0.62, lam(0x2a221a), Math.cos(a) * 0.14, 0.3, Math.sin(a) * 0.14, st, 4); leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); }
  const tw = group(st, 0, 0.63, 0);
  box(0.34, 0.06, 0.3, lam(0x16181a), 0, 0.03, 0, tw);
  const keys = box(0.3, 0.02, 0.14, lam(0x0c0c0c), 0, 0.08, 0.07, tw); keys.rotation.x = 0.35;
  for (let ky = 0; ky < 3; ky++) for (let kx = 0; kx < 8; kx++) {
    const k = cyl(0.011, 0.011, 0.012, lam(0xc8c2b0), -0.122 + kx * 0.035, 0.085 + ky * 0.014, 0.115 - ky * 0.04, tw, 5);
    k.castShadow = false;
  }
  box(0.34, 0.1, 0.12, lam(0x16181a), 0, 0.11, -0.08, tw);
  const roller = cyl(0.03, 0.03, 0.4, lam(0x0a0a0a), 0, 0.17, -0.1, tw, 8); roller.rotation.z = Math.PI / 2;
  // long sheet: up out of the roller, over the back, across the floor
  const sheetW = 0.22, pts = [[0.81, -0.1], [1.05, -0.12], [1.08, -0.2], [0.7, -0.34], [0.2, -0.42], [0.02, -0.6], [0.022, -1.6], [0.03, -2.4], [0.022, -3.1]];
  const pos = [], uv = [], idx = [];
  let acc = 0;
  pts.forEach(([y, z], i) => {
    if (i) acc += Math.hypot(y - pts[i - 1][0], z - pts[i - 1][1]);
    const wob = i > 5 ? Math.sin(i * 1.7) * 0.12 : 0;
    pos.push(-sheetW / 2 + wob, y, z, sheetW / 2 + wob, y, z);
    uv.push(0, 1 - acc / 4.4, 1, 1 - acc / 4.4);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx); sg.computeVertexNormals();
  const sheet = new THREE.Mesh(sg, lamT(typedTexture(), { side: THREE.DoubleSide }));
  st.add(sheet);

  // ----- the chimpanzee -----
  const f = makeFigure({
    skin: '#8a5a3c', face: 'chimp', hair: 0x1a120c,
    c: { torso: 0xd9641e, arms: 0xd9641e, legs: 0xd9641e, hands: 0x3a2414, feet: 0x3a2414, pelvis: 0xd9641e },
  });
  // tracksuit stripes
  const white = lam(0xe8e2d0);
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    box(0.012, L.upper, 0.03, white, s * 0.052, -L.upper / 2, 0, f['arm' + n]);
    box(0.012, L.fore, 0.03, white, s * 0.044, -L.fore / 2, 0, f['elbow' + n]);
    box(0.012, L.thigh, 0.035, white, s * 0.077, -L.thigh / 2, 0, f['leg' + n]);
    box(0.012, L.shin, 0.035, white, s * 0.057, -L.shin / 2, 0, f['knee' + n]);
    // fur mitts and slippers, several sizes too big
    const mitt = sph(0.085, lam(0x3a2414), 0, -0.07, 0, f['hand' + n], 7, 5); mitt.scale.set(0.9, 1.3, 0.75);
    const slip = sph(0.1, lam(0x3a2414), 0, -0.015, 0.08, f['foot' + n], 7, 5); slip.scale.set(0.8, 0.55, 1.6);
    // stuck-on ears
    const ear = mesh(new THREE.CircleGeometry(0.06, 9), lam(0xc89a7a, { side: THREE.DoubleSide }), s * 0.115, 0.11, -0.01, f.head);
    ear.rotation.y = s * 0.5;
  }
  // zip and bow tie
  box(0.014, 0.42, 0.01, lam(0xc8c2b0), 0, 0.04, 0.127, f.chest);
  for (const s of [-1, 1]) { const bt = mesh(new THREE.ConeGeometry(0.045, 0.09, 4), lam(0xb01820), s * 0.045, 0.27, 0.12, f.chest); bt.rotation.z = s * Math.PI / 2; }
  sph(0.02, lam(0x7a1016), 0, 0.27, 0.125, f.chest, 5, 4);

  // he hangs from a pivot on the bars
  const piv = group(g, 0.4, BAR_Y, -0.8);
  piv.add(f.root);

  const p = makePerformer(f, enc.group);
  let spot = null, yaw = 0;
  p.onStage = (s) => {
    if (s === 2) { spot = barsSpot(p, 3.2, 2.5); yaw = yawTo(p, spot.x, spot.z); }
    else { spot = null; yaw = s === 1 ? yawTo(p, 0.4, -0.8) : 0; }
  };
  p.update = (t) => {
    if (spot) {
      piv.position.set(spot.x, 0, spot.z);
      piv.rotation.set(0, yaw, 0);
      f.root.position.set(0, 0, 0);
      poseStand(f, t);
      // long arms, knuckles nearly at the knees
      f.spine.rotation.x = 0.35; f.neck.rotation.x = -0.3;
      f.armL.rotation.x = -0.3; f.armR.rotation.x = -0.3;
      f.legL.rotation.x = -0.25; f.legR.rotation.x = -0.25;
      f.kneeL.rotation.x = 0.5; f.kneeR.rotation.x = 0.5;
      f.hips.position.y = L.hipY - 0.08;
      return;
    }
    piv.position.set(0.4, BAR_Y, -0.8);
    const swing = p.stage === 0 ? Math.sin(t * 1.25) * 0.26 : 0;
    piv.rotation.set(0, yaw, swing);
    f.root.position.set(-L.shoulderX, -(SHOULDER_Y + REACH - 0.02), 0);
    resetPose(f);
    f.armL.rotation.z = Math.PI - 0.04; // straight up to the rung
    f.armR.rotation.z = -0.15; f.elbowR.rotation.x = -0.25;
    f.legL.rotation.x = -0.55 + swing * 0.5; f.kneeL.rotation.x = 0.95;
    f.legR.rotation.x = -0.25 - swing * 0.5; f.kneeR.rotation.x = 0.6;
    f.spine.rotation.z = -0.06;
  };
  return p;
}

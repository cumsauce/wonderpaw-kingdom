import * as THREE from 'three';
import { rng, lam, lamT, box, cyl, sph, mesh, group } from '../util.js';
import { T } from '../textures.js';
import { makeFigure, makePerformer, resetPose, barsSpot, yawTo } from '../performers.js';

function lawnFlamingo(parent, x, z, ry, faded) {
  const g = group(parent, x, 0, z);
  g.rotation.y = ry;
  const pink = lam(faded ? 0xb88a96 : 0xe0689a);
  cyl(0.008, 0.008, 0.55, lam(0x2a2a2a), 0.03, 0.275, 0, g, 3);
  cyl(0.008, 0.008, 0.55, lam(0x2a2a2a), -0.03, 0.275, 0, g, 3);
  const body = sph(0.14, pink, 0, 0.62, 0, g, 8, 6);
  body.scale.set(0.75, 0.7, 1.25);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.66, 0.14), new THREE.Vector3(0, 0.8, 0.26), new THREE.Vector3(0, 0.98, 0.2), new THREE.Vector3(0, 1.08, 0.26),
  ]);
  mesh(new THREE.TubeGeometry(curve, 8, 0.028, 5), pink, 0, 0, 0, g);
  sph(0.05, pink, 0, 1.09, 0.28, g, 6, 5);
  const beak = mesh(new THREE.ConeGeometry(0.028, 0.12, 5), lam(0x151515), 0, 1.05, 0.36, g);
  beak.rotation.x = 2.2;
  return g;
}

export function buildFlamingo(enc) {
  const g = enc.interior;
  const r = rng(202);

  // drained pond: a rim, a stained basin and one puddle left
  const rim = mesh(new THREE.TorusGeometry(2.0, 0.12, 5, 22), lamT(T.concrete(8, 1)), 0, 0.04, -0.4, g);
  rim.rotation.x = Math.PI / 2;
  const basin = mesh(new THREE.CircleGeometry(1.95, 22), lamT(T.bluepaint(2, 2)), 0, 0.012, -0.4, g);
  basin.rotation.x = -Math.PI / 2;
  const puddle = mesh(new THREE.CircleGeometry(0.75, 14), new THREE.MeshPhongMaterial({ color: 0x0a1210, shininess: 120, specular: 0x8a8a80 }), -0.5, 0.02, -0.9, g);
  puddle.rotation.x = -Math.PI / 2; puddle.scale.y = 0.7; puddle.castShadow = false;
  cyl(0.06, 0.06, 0.03, lam(0x1a1a1a), 0.6, 0.02, 0.2, g, 8); // drain

  // dead reeds
  for (let i = 0; i < 30; i++) {
    const a = 2.2 + r() * 2.4, rad = 2.05 + r() * 0.35;
    const h = 0.7 + r() * 0.9;
    const reed = mesh(new THREE.ConeGeometry(0.02, h, 3), lam([0x5a5a30, 0x6a5a34, 0x3a3a22][(r() * 3) | 0]), Math.cos(a) * rad, h / 2, -0.4 + Math.sin(a) * rad, g);
    reed.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
  }

  // cracked mirror on a stand, turned to face the bird
  const mir = group(g, 2.7, 0, -1.6);
  mir.rotation.y = -0.9;
  cyl(0.03, 0.03, 1.9, lam(0x8a7a3a), -0.42, 0.95, 0, mir, 5);
  cyl(0.03, 0.03, 1.9, lam(0x8a7a3a), 0.42, 0.95, 0, mir, 5);
  box(0.95, 0.06, 0.4, lam(0x8a7a3a), 0, 0.03, 0, mir);
  const glass = box(0.78, 1.25, 0.03, new THREE.MeshPhongMaterial({ color: 0x8a9698, shininess: 140, specular: 0xffffff }), 0, 1.15, 0, mir);
  glass.rotation.x = -0.08;
  for (let i = 0; i < 7; i++) {
    const c = box(0.006, 0.3 + r() * 0.6, 0.002, lam(0x202424), (r() - 0.5) * 0.3, 1.15 + (r() - 0.5) * 0.3, 0.018, mir);
    c.rotation.z = r() * 3.14; c.castShadow = false;
  }

  // pellet feeder
  const fd = group(g, -3.0, 0, 1.6);
  cyl(0.035, 0.035, 1.0, lam(0x4a4842), 0, 0.5, 0, fd, 5);
  box(0.36, 0.4, 0.3, lam(0x8a2a3a), 0, 1.15, 0, fd);
  box(0.42, 0.04, 0.3, lam(0x6a6860), 0, 0.92, 0.12, fd);
  for (let i = 0; i < 26; i++) {
    const pl = sph(0.014, lam(0xc86a7a), -3.0 + (r() - 0.5) * 0.7, 0.012, 1.75 + (r() - 0.2) * 0.6, g, 4, 3);
    pl.castShadow = false;
  }

  // the plastic flock, all facing her
  const flock = [[-1.9, -2.3], [-1.0, -2.55], [0.0, -2.6], [1.0, -2.5], [1.9, -2.2], [-2.9, -0.4]];
  flock.forEach(([x, z], i) => lawnFlamingo(g, x, z, Math.atan2(0 - x, -0.3 - z), i % 2 === 0));
  const fallen = lawnFlamingo(g, 2.2, 0.12, 0.4, true);
  fallen.rotation.z = Math.PI / 2 - 0.1; fallen.position.y = 0.1;

  // feathers on the floor
  for (let i = 0; i < 22; i++) {
    const fe = mesh(new THREE.PlaneGeometry(0.05, 0.16), lam(0xe890b0, { side: THREE.DoubleSide }), (r() - 0.5) * 6.5, 0.02, (r() - 0.5) * 4.6, g);
    fe.rotation.set(-Math.PI / 2, 0, r() * 6.28); fe.castShadow = false;
  }

  // ----- the flamingo -----
  const f = makeFigure({
    skin: '#e3bfa4', face: 'flamingo', hair: 0xf4e2a0,
    c: { torso: 0xe8408a, arms: 0xf070a8, legs: 0xf48ab8, hands: 0xf070a8, feet: 0xd82a78, pelvis: 0xe8408a },
  });
  // tutu: three stiff tiers
  for (let i = 0; i < 3; i++) {
    const tier = mesh(new THREE.CylinderGeometry(0.16, 0.6 - i * 0.07, 0.07, 16, 1, true),
      lam([0xff5aa0, 0xe8408a, 0xff8ac0][i], { side: THREE.DoubleSide }), 0, 0.06 + i * 0.035, 0, f.hips);
    tier.rotation.y = i * 0.3;
  }
  // feather boa
  const boa = lam(0xff9ac8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.283;
    sph(0.05 + (i % 3) * 0.008, boa, Math.cos(a) * 0.13, L_CHEST_TOP + Math.sin(a * 2) * 0.012, Math.sin(a) * 0.11, f.chest, 6, 4);
  }
  for (let i = 0; i < 6; i++) sph(0.045, boa, -0.09, L_CHEST_TOP - 0.06 - i * 0.065, 0.12, f.chest, 6, 4);
  // beak visor, strapped on over the nose
  const bk = group(f.head, 0, 0.09, 0.1);
  bk.rotation.x = 0.35;
  const b1 = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.14, 7), lam(0xf4d8d0), 0, 0, 0.07, bk);
  b1.rotation.x = Math.PI / 2;
  const tip = group(bk, 0, 0, 0.14);
  tip.rotation.x = 0.75;
  const b2 = mesh(new THREE.ConeGeometry(0.031, 0.13, 7), lam(0x121212), 0, 0, 0.06, tip);
  b2.rotation.x = Math.PI / 2;
  const strap = mesh(new THREE.TorusGeometry(0.108, 0.008, 4, 14), lam(0x1a1a1a), 0, 0.09, 0, f.head);
  strap.rotation.x = Math.PI / 2;
  // head plume
  for (let i = 0; i < 5; i++) {
    const pl = mesh(new THREE.ConeGeometry(0.02, 0.2, 4), lam(0xff5aa0), (i - 2) * 0.025, 0.28, -0.03, f.head);
    pl.rotation.set(-0.4, 0, (i - 2) * -0.22);
  }
  // wing feathers along the forearms
  for (const el of [f.elbowL, f.elbowR]) {
    for (let i = 0; i < 4; i++) {
      const fe = box(0.012, 0.2, 0.07, lam(i % 2 ? 0xff8ac0 : 0xe8408a), 0, -0.06 - i * 0.06, -0.07, el);
      fe.rotation.x = 0.7;
    }
  }
  g.add(f.root);

  const p = makePerformer(f, enc.group);
  let leg = 1, spot = { x: 0, z: -0.4 }, yaw = 0;
  p.onStage = (s) => {
    leg = -leg; // she changes legs, but never while you watch
    if (s === 0) { spot = { x: 0, z: -0.4 }; yaw = 0; }
    if (s === 1) { spot = { x: 0.7, z: 1.3 }; yaw = yawTo(p, spot.x, spot.z); }
    if (s === 2) { spot = barsSpot(p, 3.2, 2.5); yaw = yawTo(p, spot.x, spot.z); }
  };
  p.update = () => {
    resetPose(f);
    f.root.position.set(spot.x, 0, spot.z);
    f.root.rotation.y = yaw;
    const up = leg > 0 ? [f.legL, f.kneeL] : [f.legR, f.kneeR];
    up[0].rotation.x = -1.15; up[1].rotation.x = 2.05;
    f.armL.rotation.z = 1.2; f.elbowL.rotation.z = 2.7;
    f.armR.rotation.z = -1.2; f.elbowR.rotation.z = -2.7;
    f.spine.rotation.x = 0.1; f.chest.rotation.x = 0.05; f.neck.rotation.x = -0.12;
    // no sway at all
  };
  return p;
}

const L_CHEST_TOP = 0.27;

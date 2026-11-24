import * as THREE from 'three';
import { toTex } from './textures.js';

// Jointed human figures, built from capsules. Faces +z, stands on y = 0,
// its left side is +x.
export const L = {
  hipY: 0.92, thigh: 0.44, shin: 0.42, abdomen: 0.25, chest: 0.3, neck: 0.08,
  headR: 0.115, shoulderX: 0.2, upper: 0.3, fore: 0.27, hand: 0.09, legX: 0.09,
};
export const REACH = L.upper + L.fore + L.hand; // shoulder to fingertip
export const SHOULDER_Y = L.hipY + 0.02 + L.abdomen + L.chest - 0.05;

function J(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function limb(r, len, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 7), mat);
  m.position.y = -len / 2;
  m.castShadow = true;
  return m;
}
function ball(r, mat, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

// The same smile on every face.
export function faceTexture(skin, kind) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = skin; x.fillRect(0, 0, 512, 256);
  const cx = 128, cy = 128;
  if (kind === 'penguin') { // white greasepaint
    x.fillStyle = '#e8e4d8';
    x.beginPath(); x.ellipse(cx, cy + 4, 62, 78, 0, 0, 6.283); x.fill();
  }
  if (kind === 'chimp') { // painted muzzle
    x.fillStyle = '#d8b890';
    x.beginPath(); x.ellipse(cx, cy + 34, 46, 36, 0, 0, 6.283); x.fill();
  }
  if (kind === 'lion') {
    x.fillStyle = '#d8a83a';
    x.beginPath(); x.ellipse(cx, cy - 8, 58, 40, 0, 0, 6.283); x.fill();
  }
  // cheeks
  x.fillStyle = 'rgba(200,40,50,0.75)';
  for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * 40, cy + 20, 12, 0, 6.283); x.fill(); }
  // eyes: very open, very small pupils
  for (const s of [-1, 1]) {
    const ex = cx + s * 24, ey = cy - 16;
    if (kind === 'flamingo') {
      x.fillStyle = '#e83a8a';
      x.beginPath(); x.ellipse(ex, ey - 4, 19, 17, 0, 0, 6.283); x.fill();
    }
    if (kind === 'penguin') {
      x.fillStyle = '#0c0c0c';
      x.beginPath(); x.ellipse(ex, ey, 18, 20, 0, 0, 6.283); x.fill();
    }
    x.fillStyle = '#f4f0e4';
    x.beginPath(); x.ellipse(ex, ey, 13, 11, 0, 0, 6.283); x.fill();
    x.strokeStyle = '#1a1210'; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = '#0a0808';
    x.beginPath(); x.arc(ex, ey, 3.2, 0, 6.283); x.fill();
    // painted brows, too high
    x.strokeStyle = '#1a1210'; x.lineWidth = 4;
    x.beginPath(); x.arc(ex, ey - 6, 22, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke();
  }
  // nose
  if (kind === 'lion') {
    x.fillStyle = '#1a1210';
    x.beginPath(); x.moveTo(cx - 10, cy + 6); x.lineTo(cx + 10, cy + 6); x.lineTo(cx, cy + 18); x.fill();
    x.strokeStyle = '#1a1210'; x.lineWidth = 2;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      x.beginPath(); x.moveTo(cx + s * 14, cy + 22 + i * 4); x.lineTo(cx + s * 50, cy + 14 + i * 9); x.stroke();
    }
  } else {
    x.fillStyle = 'rgba(60,30,24,0.55)';
    x.beginPath(); x.ellipse(cx, cy + 8, 5, 4, 0, 0, 6.283); x.fill();
  }
  // the smile: painted wider than the mouth under it
  x.fillStyle = '#b01820';
  x.beginPath();
  x.moveTo(cx - 42, cy + 26);
  x.quadraticCurveTo(cx, cy + 78, cx + 42, cy + 26);
  x.quadraticCurveTo(cx, cy + 46, cx - 42, cy + 26);
  x.fill();
  x.fillStyle = '#efe8d4';
  x.beginPath();
  x.moveTo(cx - 31, cy + 36);
  x.quadraticCurveTo(cx, cy + 66, cx + 31, cy + 36);
  x.quadraticCurveTo(cx, cy + 50, cx - 31, cy + 36);
  x.fill();
  x.strokeStyle = 'rgba(40,20,16,0.7)'; x.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx + i * 8, cy + 40); x.lineTo(cx + i * 8, cy + 60); x.stroke(); }
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  return t;
}

// o: { skin, face, hair, c: { torso, arms, legs, pelvis, hands, feet }, mat(color) }
export function makeFigure(o) {
  const mk = o.mat || ((c) => new THREE.MeshLambertMaterial({ color: c }));
  const skin = new THREE.MeshLambertMaterial({ color: o.skin });
  const c = o.c;
  const f = { mats: {} };
  const torsoM = mk(c.torso), armM = mk(c.arms ?? c.torso), legM = mk(c.legs ?? c.torso);
  const handM = c.hands !== undefined ? mk(c.hands) : skin;
  const footM = mk(c.feet ?? 0x1a1a1a);
  f.root = new THREE.Group();

  f.hips = J(f.root, 0, L.hipY, 0);
  const pelvis = ball(0.15, mk(c.pelvis ?? c.legs ?? c.torso), 1.15, 0.8, 0.85);
  f.hips.add(pelvis);

  f.spine = J(f.hips, 0, 0.02, 0);
  const ab = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, L.abdomen, 3, 8), torsoM);
  ab.position.y = L.abdomen / 2; ab.scale.set(1.12, 1, 0.82); ab.castShadow = true;
  f.spine.add(ab);

  f.chest = J(f.spine, 0, L.abdomen, 0);
  const ch = ball(0.15, torsoM, 1.42, 1.25, 0.92);
  ch.position.y = 0.13;
  f.chest.add(ch);

  f.neck = J(f.chest, 0, L.chest, 0);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 7), skin);
  nk.position.y = 0.03;
  f.neck.add(nk);

  f.head = J(f.neck, 0, L.neck, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(L.headR, 18, 14),
    new THREE.MeshLambertMaterial({ map: faceTexture(o.skin, o.face) }));
  head.position.y = 0.1; head.scale.set(0.92, 1.1, 1); head.castShadow = true;
  f.head.add(head);
  f.headMesh = head;
  if (o.hair !== null && o.hair !== undefined) {
    const hm = new THREE.MeshLambertMaterial({ color: o.hair });
    const back = new THREE.Mesh(new THREE.SphereGeometry(L.headR * 1.05, 12, 9, Math.PI, Math.PI), hm);
    back.position.y = 0.1; back.scale.set(0.94, 1.12, 1.02);
    const topc = new THREE.Mesh(new THREE.SphereGeometry(L.headR * 1.05, 12, 5, 0, 6.283, 0, 0.36 * Math.PI), hm);
    topc.position.y = 0.1; topc.scale.set(0.94, 1.12, 1.02);
    f.head.add(back, topc);
  }

  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const sh = J(f.chest, s * L.shoulderX, L.chest - 0.05, 0);
    sh.add(ball(0.065, armM));
    sh.add(limb(0.05, L.upper, armM));
    const el = J(sh, 0, -L.upper, 0);
    el.add(limb(0.042, L.fore, armM));
    const hd = J(el, 0, -L.fore, 0);
    const hm = ball(0.05, handM, 0.8, 1.25, 0.5);
    hm.position.y = -0.05;
    hd.add(hm);
    f['arm' + n] = sh; f['elbow' + n] = el; f['hand' + n] = hd;

    const lg = J(f.hips, s * L.legX, 0, 0);
    lg.add(limb(0.075, L.thigh, legM));
    const kn = J(lg, 0, -L.thigh, 0);
    kn.add(limb(0.055, L.shin, legM));
    const ft = J(kn, 0, -L.shin, 0);
    const fm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.24), footM);
    fm.position.set(0, -0.025, 0.07); fm.castShadow = true;
    ft.add(fm);
    f['leg' + n] = lg; f['knee' + n] = kn; f['foot' + n] = ft;
  }
  f.joints = [f.hips, f.spine, f.chest, f.neck, f.armL, f.armR, f.elbowL, f.elbowR, f.handL, f.handR,
    f.legL, f.legR, f.kneeL, f.kneeR, f.footL, f.footR];
  f.mk = mk;
  return f;
}

export function resetPose(f) {
  for (const j of f.joints) j.rotation.set(0, 0, 0);
  f.hips.position.y = L.hipY;
}

// Standing far too still, arms a little away from the body.
export function poseStand(f, t = 0) {
  resetPose(f);
  f.armL.rotation.z = 0.12; f.armR.rotation.z = -0.12;
  f.elbowL.rotation.x = -0.08; f.elbowR.rotation.x = -0.08;
  f.spine.rotation.x = 0.04 + Math.sin(t * 0.9) * 0.008;
}

const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _id = new THREE.Quaternion();
const _v = new THREE.Vector3(), _dir = new THREE.Vector3(), _fwd = new THREE.Vector3(), _lp = new THREE.Vector3();

// Turn the head to a world point, further than a neck should allow.
export function trackHead(f, target, dt, maxAngle = 1.75, rate = 2.6) {
  const h = f.head;
  _q0.copy(h.quaternion);
  h.lookAt(target);
  _q1.copy(h.quaternion);
  const ang = 2 * Math.acos(Math.min(1, Math.abs(_q1.w)));
  if (ang > maxAngle) _q1.copy(_id).slerp(h.quaternion, maxAngle / ang);
  h.quaternion.copy(_q0).slerp(_q1, 1 - Math.exp(-dt * rate));
}

// A performer wraps a figure with the "moved while you were not looking" logic.
export function makePerformer(fig, enclosureGroup) {
  return { fig, group: enclosureGroup, stage: 0, armed: false, unseenT: 0, dist: 99, local: new THREE.Vector3(), seen: false };
}

export function updateWatch(p, camera, dt) {
  p.fig.head.getWorldPosition(_v);
  const d = _v.distanceTo(camera.position);
  _dir.copy(_v).sub(camera.position).normalize();
  camera.getWorldDirection(_fwd);
  const dot = _dir.dot(_fwd);
  p.dist = d;
  p.seen = dot > 0.74 && d < 19;
  const hidden = dot < 0.42 || d > 26;
  if (p.seen) { p.armed = true; p.unseenT = 0; }
  else if (hidden && p.armed) {
    p.unseenT += dt;
    if (p.unseenT > 3.2 && d < 26 && p.stage < 2) {
      p.stage++; p.unseenT = 0; p.armed = false;
      if (p.onStage) p.onStage(p.stage);
    }
  }
  if (d > 36 && p.stage !== 0) { p.stage = 0; p.armed = false; if (p.onStage) p.onStage(0); }
  p.local.copy(camera.position);
  p.group.worldToLocal(p.local);
}

// Helper for "came to the bars": a spot on the front line nearest the visitor.
export function barsSpot(p, maxX = 3.3, z = 2.5) {
  return { x: Math.max(-maxX, Math.min(maxX, p.local.x)), z };
}
export function yawTo(p, x, z) {
  return Math.atan2(p.local.x - x, p.local.z - z);
}

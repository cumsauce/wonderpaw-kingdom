import * as THREE from 'three';

// Small seeded random generator so the park is the same every visit.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Collision shapes the player is pushed out of (top-down).
export const colliders = { boxes: [], circles: [] };
export function addBox(minX, maxX, minZ, maxZ) {
  const b = { minX, maxX, minZ, maxZ, on: true };
  colliders.boxes.push(b);
  return b;
}
export function addCircle(x, z, r) {
  const c = { x, z, r, on: true };
  colliders.circles.push(c);
  return c;
}

// Per-frame callbacks: fn(t, dt)
export const updaters = [];

export const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
export const lamT = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
export const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export const box = (w, h, d, mat, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
export const cyl = (rt, rb, h, mat, x, y, z, p, seg = 8) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
export const sph = (r, mat, x, y, z, p, ws = 10, hs = 7) =>
  mesh(new THREE.SphereGeometry(r, ws, hs), mat, x, y, z, p);

export function flatPlane(w, d, mat, x, y, z, parent) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

export function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (parent) parent.add(g);
  return g;
}

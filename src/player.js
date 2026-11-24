import { colliders } from './util.js';

const R = 0.36; // body radius
const EYE = 1.62;
export const BOUNDS = { minX: -19.4, maxX: 19.4, minZ: -31.2, maxZ: 26.4 };

export function makePlayer(camera, dom) {
  const p = {
    x: 0, z: 26, yaw: 0, pitch: 0.2,
    keys: {}, active: false, locked: false,
    moving: false, stride: 0, stepped: false, speed: 0,
    frozen: false,
  };

  addEventListener('keydown', (e) => {
    p.keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => { p.keys[e.code] = false; });
  addEventListener('blur', () => { p.keys = {}; });
  document.addEventListener('pointerlockchange', () => { p.locked = document.pointerLockElement === dom; });
  addEventListener('mousemove', (e) => {
    if (!p.locked) return;
    p.yaw -= e.movementX * 0.0022;
    p.pitch -= e.movementY * 0.0022;
    p.pitch = Math.max(-1.35, Math.min(1.35, p.pitch));
  });

  p.lock = () => {
    try {
      const r = dom.requestPointerLock && dom.requestPointerLock();
      if (r && r.catch) r.catch(() => {});
    } catch (_) { /* pointer lock unavailable: arrow keys still look around */ }
  };

  function collide() {
    if (p.noclip) return;
    for (let pass = 0; pass < 2; pass++) {
      for (const b of colliders.boxes) {
        if (!b.on) continue;
        const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
        const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
        let dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2), push = R - d;
          p.x += (dx / d) * push;
          p.z += (dz / d) * push;
        } else {
          // centre is inside the box: leave by the nearest face
          const l = p.x - b.minX, r = b.maxX - p.x, n = p.z - b.minZ, f = b.maxZ - p.z;
          const m = Math.min(l, r, n, f);
          if (m === l) p.x = b.minX - R;
          else if (m === r) p.x = b.maxX + R;
          else if (m === n) p.z = b.minZ - R;
          else p.z = b.maxZ + R;
        }
      }
      for (const c of colliders.circles) {
        if (!c.on) continue;
        const dx = p.x - c.x, dz = p.z - c.z;
        const d = Math.hypot(dx, dz), min = R + c.r;
        if (d < min && d > 1e-6) {
          p.x = c.x + (dx / d) * min;
          p.z = c.z + (dz / d) * min;
        }
      }
    }
    p.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, p.x));
    p.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, p.z));
  }

  p.update = (dt) => {
    const k = p.keys;
    if (p.active) {
      const turn = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
      const look = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
      p.yaw += turn * dt * 1.7;
      p.pitch = Math.max(-1.35, Math.min(1.35, p.pitch + look * dt * 1.1));
    }
    let f = 0, s = 0;
    if (p.active && !p.frozen) {
      f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
      s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    }
    const len = Math.hypot(f, s);
    const target = len > 0 ? (k.ShiftLeft || k.ShiftRight ? 3.5 : 2.1) : 0;
    p.speed += (target - p.speed) * Math.min(1, dt * 8);
    p.moving = len > 0 && p.speed > 0.3;
    p.stepped = false;
    if (len > 0) {
      f /= len; s /= len;
      const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
      const ox = p.x, oz = p.z;
      p.x += (-sin * f + cos * s) * p.speed * dt;
      p.z += (-cos * f - sin * s) * p.speed * dt;
      collide();
      const moved = Math.hypot(p.x - ox, p.z - oz);
      const before = Math.floor(p.stride / 0.78);
      p.stride += moved;
      if (Math.floor(p.stride / 0.78) !== before) p.stepped = true;
    } else {
      collide();
    }
    const bob = Math.sin((p.stride / 0.78) * Math.PI) * 0.035 * Math.min(1, p.speed / 2);
    camera.position.set(p.x, EYE + Math.abs(bob) - 0.02, p.z);
    camera.rotation.set(p.pitch, p.yaw, Math.sin((p.stride / 1.56) * Math.PI) * 0.006, 'YXZ');
  };

  p.teleport = (x, z, yaw = p.yaw, pitch = 0) => { p.x = x; p.z = z; p.yaw = yaw; p.pitch = pitch; };
  return p;
}

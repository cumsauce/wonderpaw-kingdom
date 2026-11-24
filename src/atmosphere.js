import * as THREE from 'three';
import { rng, updaters } from './util.js';

export const FOG_COLOR = 0x5d6263;

export function setupAtmosphere(scene, camera) {
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.082);

  const hemi = new THREE.HemisphereLight(0x9aa4ac, 0x2c2822, 1.15);
  scene.add(hemi);

  // Weak hand torch, held low and to the right so bars throw moving shadows.
  const torch = new THREE.SpotLight(0xfff0d2, 70, 28, 0.5, 0.6, 1.5);
  torch.position.set(0.28, -0.24, 0.1);
  torch.target.position.set(0.05, -0.08, -1);
  torch.castShadow = true;
  torch.shadow.mapSize.set(1024, 1024);
  torch.shadow.camera.near = 0.3;
  torch.shadow.camera.far = 28;
  torch.shadow.bias = -0.0025;
  camera.add(torch);
  camera.add(torch.target);
  scene.add(camera);

  let on = true, base = 70, dip = 0;
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') on = !on;
  });
  const r = rng(404);
  updaters.push((t, dt) => {
    // the battery is not what it was
    if (dip <= 0 && r() < dt * 0.12) dip = 0.08 + r() * 0.35;
    dip -= dt;
    const flick = dip > 0 ? 0.25 + 0.5 * r() : 1;
    torch.intensity = on ? base * flick : 0;
  });

  // Ash drifting through the torch beam.
  const N = 700, span = 26, hgt = 9;
  const pos = new Float32Array(N * 3), vel = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (r() - 0.5) * span;
    pos[i * 3 + 1] = r() * hgt;
    pos[i * 3 + 2] = (r() - 0.5) * span;
    vel[i] = 0.12 + r() * 0.25;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ash = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xb8b6ac, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false,
  }));
  ash.frustumCulled = false;
  scene.add(ash);
  updaters.push((t, dt) => {
    const cx = camera.position.x, cz = camera.position.z;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      pos[j] += Math.sin(t * 0.4 + i) * 0.05 * dt + 0.08 * dt;
      pos[j + 1] -= vel[i] * dt;
      if (pos[j + 1] < 0) pos[j + 1] += hgt;
      if (pos[j] - cx > span / 2) pos[j] -= span; else if (pos[j] - cx < -span / 2) pos[j] += span;
      if (pos[j + 2] - cz > span / 2) pos[j + 2] -= span; else if (pos[j + 2] - cz < -span / 2) pos[j + 2] += span;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return { hemi, torch };
}

import * as THREE from 'three';
import { updaters, addBox, lam, lamT, basic, box, cyl, sph, group } from './util.js';
import { T } from './textures.js';
import { plaqueTexture, textTexture } from './signs.js';
import { makePost } from './post.js';
import { makePlayer } from './player.js';
import { setupAtmosphere } from './atmosphere.js';
import { makeAudio } from './audio.js';
import { buildGround } from './world/ground.js';
import { buildEntrance } from './world/entrance.js';
import { buildHub } from './world/hub.js';
import { buildProps } from './world/props.js';
import { buildEnclosure, ENC } from './world/enclosure.js';
import { buildLion } from './exhibits/lion.js';
import { buildFlamingo } from './exhibits/flamingo.js';
import { buildChimp } from './exhibits/chimp.js';
import { buildPenguin } from './exhibits/penguin.js';
import { trackHead, updateWatch } from './performers.js';

const canvas = document.getElementById('view');
const overlay = document.getElementById('overlay');
const hint = document.getElementById('hint');
const params = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, 1, 0.08, 90);
const post = makePost(renderer, Number(params.get('res')) || 450);
const player = makePlayer(camera, canvas);
const audio = makeAudio();
setupAtmosphere(scene, camera);

// ---------- the park ----------
buildGround(scene);
buildEntrance(scene);
buildHub(scene);
const props = buildProps(scene);

// arrows on the hub signpost: every one of them points at a cage
for (const [txt, ry, y] of [['LIONS', 0.75, 2.9], ['FLAMINGOS', -0.75, 2.62], ['CHIMPS', 2.4, 2.34], ['PENGUINS', -2.4, 2.06], ['EXIT', Math.PI, 1.7]]) {
  const a = group(props.signpost, 0, y, 0);
  a.rotation.y = ry;
  const tx = textTexture([txt], { w: 256, h: 56, font: 'bold 34px Georgia, serif', seed: y * 10, age: 0.5 });
  const b = box(1.0, 0.22, 0.03, lamT(tx), 0.55, 0, 0, a);
  b.castShadow = false;
  if (txt === 'EXIT') { b.material = lamT(textTexture([''], { w: 256, h: 56, seed: 5 })); } // painted over
}

// Four cages on the diagonals, all facing the avenue.
const cages = [
  {
    key: 'lion', x: -9.6, z: 9, build: buildLion,
    o: { wall: '#c9a45a', stripeA: '#8a2a22', stripeB: '#cfc39a', floor: T.sand(4, 3), mural: 'savanna', light: 0xffc890, seed: 61,
      plaque: { title: 'THE LION', latin: 'Panthera leo  ·  "Gerald"', lines: ['Proud. Powerful.', 'Paces fourteen hours a day.', 'Please do not answer him.'] } },
  },
  {
    key: 'flamingo', x: 9.6, z: 9, build: buildFlamingo,
    o: { wall: '#c98a94', stripeA: '#b04a70', stripeB: '#cfc39a', floor: T.concrete(3, 2), mural: 'lagoon', light: 0xffd8e0, seed: 62,
      plaque: { title: 'THE FLAMINGO', latin: 'Phoenicopterus roseus  ·  "Miss Odette"', lines: ['On one leg since 1987.', 'She is not tired.', 'She has told us so.'] } },
  },
  {
    key: 'chimp', x: -9.6, z: -9, build: buildChimp,
    o: { wall: '#8fa878', stripeA: '#3d6c4a', stripeB: '#cfc39a', floor: T.chips(4, 3), mural: 'jungle', light: 0xfff0c0, seed: 63, doorAjar: true,
      plaque: { title: 'THE CHIMPANZEE', latin: 'Pan troglodytes  ·  "Mr. Buttons"', lines: ['Our cleverest animal!', 'He is writing to you.', 'Do not read it.'] } },
  },
  {
    key: 'penguin', x: 9.6, z: -9, build: buildPenguin,
    o: { wall: '#8ab0c0', stripeA: '#2f5a7a', stripeB: '#cfc39a', floor: T.bluepaint(3, 2), mural: 'ice', light: 0xd8ecff, seed: 64,
      plaque: { title: 'THE PENGUIN', latin: 'Aptenodytes forsteri  ·  "Walter"', lines: ['Feeding 3 pm.', 'They know.', 'Keeps his suit very clean.'] } },
  },
];
const performers = [];
for (const c of cages) {
  const enc = buildEnclosure(scene, c.o);
  enc.group.position.set(c.x, 0, c.z);
  enc.group.rotation.y = c.x > 0 ? -Math.PI / 2 : Math.PI / 2;
  enc.group.updateMatrixWorld(true);
  addBox(c.x - 3.3, c.x + 3.3, c.z - 4.3, c.z + 4.3);
  const p = c.build(enc);
  p.key = c.key;
  p.enc = enc;
  performers.push(p);
  // each bulb has its own bad habit
  const seed = performers.length * 3.7, base = enc.light.intensity, col = enc.bulb.material.color.clone();
  updaters.push((t) => {
    const n = Math.sin(t * 23 + seed) * Math.sin(t * 1.7 + seed);
    const k = n > 0.86 ? 0.2 : 1;
    enc.light.intensity = base * k;
    enc.bulb.material.color.copy(col).multiplyScalar(k);
  });
}

// The fifth cage, at the far end. Not on the map.
const fifth = buildEnclosure(scene, {
  wall: '#b8b0a0', stripeA: '#5a5a5a', stripeB: '#a8a294', floor: T.concrete(3, 2), mural: null, light: 0xfff4d8, lightPower: 0,
  seed: 65, gate: true, sag: 0.45, plaque: { blank: true },
});
const FZ = -27.6;
fifth.group.position.set(0, 0, FZ);
fifth.group.updateMatrixWorld(true);
fifth.bulb.material.color.setHex(0x2a2a26);
{
  const { hw, hd } = ENC, g = fifth.gap;
  addBox(-hw - 0.3, -hw + 0.15, FZ - hd - 0.3, FZ + hd + 0.15);
  addBox(hw - 0.15, hw + 0.3, FZ - hd - 0.3, FZ + hd + 0.15);
  addBox(-hw - 0.3, hw + 0.3, FZ - hd - 0.4, FZ - hd + 0.12);
  addBox(-hw - 0.3, -g, FZ + hd - 0.15, FZ + hd + 0.15);
  addBox(g, hw + 0.3, FZ + hd - 0.15, FZ + hd + 0.15);
  // what is waiting inside
  const i = fifth.interior;
  cyl(0.19, 0.19, 0.05, lamT(T.wood(1, 1)), 0, 0.52, -0.6, i, 10);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.283; cyl(0.02, 0.02, 0.52, lam(0x2a221a), Math.cos(a) * 0.13, 0.26, -0.6 + Math.sin(a) * 0.13, i, 4); }
  // a folded outfit, in your size
  box(0.3, 0.04, 0.26, lam(0x7a8a9a), 0, 0.565, -0.6, i);
  box(0.3, 0.04, 0.26, lam(0xb8463c), 0, 0.605, -0.6, i);
  box(0.28, 0.035, 0.24, lam(0xd8cfae), 0, 0.642, -0.6, i);
  box(0.09, 0.012, 0.05, lam(0xf4f0e4), 0.06, 0.667, -0.52, i); // name tag
  cyl(0.22, 0.17, 0.1, new THREE.MeshPhongMaterial({ color: 0x8a8a86, shininess: 60 }), -2.6, 0.05, -1.9, i, 12);
  cyl(0.22, 0.17, 0.1, new THREE.MeshPhongMaterial({ color: 0x8a8a86, shininess: 60 }), -2.0, 0.05, -1.9, i, 12);
  box(1.9, 0.12, 0.8, lam(0x5a5448), 2.4, 0.06, -2.2, i); // bedding
  box(0.5, 0.1, 0.4, lam(0x8a8474), 3.0, 0.16, -2.2, i);
  // wall mirror, so you can see how you look
  box(0.9, 1.3, 0.04, new THREE.MeshPhongMaterial({ color: 0x8a9698, shininess: 140, specular: 0xffffff }), -1.2, 1.5, -2.86, i);
  box(1.0, 1.4, 0.03, lam(0x8a7a3a), -1.2, 1.5, -2.875, i);
}
const gateOpenBox = addBox(-fifth.gap - 0.08, -fifth.gap + 0.08, FZ + ENC.hd, FZ + ENC.hd + 1.5);
const gateShutBox = addBox(-fifth.gap, fifth.gap, FZ + ENC.hd - 0.12, FZ + ENC.hd + 0.12);
gateShutBox.on = false;
let trapped = 0; // 0 free, >0 seconds since the gate shut

// ---------- loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  post.setSize(w, h);
}
addEventListener('resize', resize);
resize();

overlay.addEventListener('click', () => {
  overlay.classList.add('hidden');
  player.active = true;
  player.lock();
  audio.start();
});
canvas.addEventListener('click', () => { if (player.active && !player.locked) player.lock(); });
addEventListener('keydown', (e) => { if (e.code === 'KeyR' && trapped > 6) location.reload(); });

const clock = new THREE.Clock();
let t = 0, fade = 0;
const camPos = new THREE.Vector3();

function step(dt) {
  t += dt;
  player.update(dt);
  camera.updateMatrixWorld(true);
  for (const u of updaters) u(t, dt);

  camera.getWorldPosition(camPos);
  let near = 99, pressure = 0;
  for (const p of performers) {
    updateWatch(p, camera, dt);
    p.update(t, dt);
    trackHead(p.fig, camPos, dt, p.key === 'lion' ? 2.3 : 1.75);
    near = Math.min(near, p.dist);
    pressure = Math.max(pressure, (p.stage / 2) * Math.max(0, 1 - p.dist / 9));
  }

  // the fifth cage closes behind you
  if (!trapped && player.z < FZ + ENC.hd - 1.1 && Math.abs(player.x) < ENC.hw - 0.3) {
    trapped = 0.0001;
    gateOpenBox.on = false;
    gateShutBox.on = true;
    audio.clang();
    fifth.plaque.material.map = plaqueTexture({ title: 'THE HUMAN', latin: 'Homo sapiens  ·  "You"', lines: ['New arrival.', 'Settling in nicely.', 'Please do not answer it.'] }, 66);
    fifth.plaque.material.needsUpdate = true;
    setTimeout(() => audio.tannoy('Wonderpaw Kingdom is delighted to announce a new arrival. Do come and', 4.2), 2200);
  }
  if (trapped) {
    trapped += dt;
    const k = Math.min(1, trapped / 0.35);
    fifth.gate.rotation.y = -1.75 * (1 - k * k);
    fifth.light.intensity = trapped > 1.2 ? 13 * (Math.sin(t * 40) > -0.9 ? 1 : 0.3) : 0;
    if (trapped > 1.2) fifth.bulb.material.color.setHex(0xfff4d8);
    if (trapped > 14 && !hint.classList.contains('show')) {
      hint.textContent = 'press R to wake up';
      hint.classList.add('show');
    }
  }

  const staticAmt = Math.min(1, Math.max(0, 1 - near / 7) * 0.55 + pressure * 0.9 + (trapped ? Math.max(0, 1 - trapped / 2.5) : 0));
  post.uniforms.staticAmt.value += (staticAmt - post.uniforms.staticAmt.value) * Math.min(1, dt * 4);
  post.uniforms.time.value = t;
  fade = Math.min(1, fade + dt * (player.active ? 0.5 : 0.25));
  post.uniforms.fade.value = player.active ? fade : Math.min(fade, 0.55);
  audio.update({ hubDist: Math.hypot(player.x, player.z), staticAmt: post.uniforms.staticAmt.value, stepped: player.stepped });

  post.render(scene, camera);
}
function frame() {
  step(Math.min(0.05, clock.getDelta()));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// handy for looking around from the console
window.__zoo = { player, performers, camera, scene, audio, fifth, step, get trapped() { return trapped; } };

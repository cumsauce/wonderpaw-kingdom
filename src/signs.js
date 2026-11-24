import * as THREE from 'three';
import { rng } from './util.js';
import { toTex } from './textures.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function age(ctx, w, h, seed, amount = 1) {
  const r = rng(seed);
  for (let i = 0; i < 12 * amount; i++) {
    const x = r() * w, y = r() * h, rad = 10 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(40,28,14,0.35)');
    g.addColorStop(1, 'rgba(40,28,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 10 * amount; i++) {
    const x = r() * w, l = h * (0.2 + r() * 0.8);
    const g = ctx.createLinearGradient(0, 0, 0, l);
    g.addColorStop(0, 'rgba(30,20,10,0.4)');
    g.addColorStop(1, 'rgba(30,20,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + r() * 8, l);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let i = 0; i < 400 * amount; i++) ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
}

function plain(c) {
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// Species plaque. { title, latin, lines: [..] } or { blank: true }
export function plaqueTexture(o, seed = 1) {
  const c = canvas(512, 352), x = c.getContext('2d');
  x.fillStyle = '#d9cda8'; x.fillRect(0, 0, 512, 352);
  x.fillStyle = '#7d1f1a'; x.fillRect(0, 0, 512, 84);
  x.strokeStyle = '#3a2a16'; x.lineWidth = 8; x.strokeRect(4, 4, 504, 344);
  if (!o.blank) {
    x.textAlign = 'center';
    x.fillStyle = '#f1e6c0';
    x.font = 'bold 50px Georgia, serif';
    x.fillText(o.title, 256, 60);
    x.fillStyle = '#3a2a16';
    x.font = 'italic 27px Georgia, serif';
    x.fillText(o.latin, 256, 128);
    x.font = '29px Georgia, serif';
    let y = 184;
    for (const line of o.lines) {
      x.fillText(line, 256, y);
      y += 44;
    }
    x.font = 'bold 17px Georgia, serif';
    x.fillStyle = '#7d1f1a';
    x.fillText('WONDERPAW KINGDOM  ·  WHERE EVERYONE IS AN ANIMAL', 256, 332);
  }
  age(x, 512, 352, seed, o.blank ? 0.5 : 1);
  return plain(c);
}

export function textTexture(lines, o = {}) {
  const w = o.w || 512, h = o.h || 128;
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = o.bg || '#d9cda8'; x.fillRect(0, 0, w, h);
  if (o.border) { x.strokeStyle = o.border; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); }
  x.textAlign = 'center';
  x.fillStyle = o.fg || '#7d1f1a';
  x.font = o.font || 'bold 44px Georgia, serif';
  const lh = o.lh || 50;
  let y = h / 2 - ((lines.length - 1) * lh) / 2 + 15;
  for (const l of lines) { x.fillText(l, w / 2, y); y += lh; }
  age(x, w, h, o.seed || 3, o.age ?? 1);
  return plain(c);
}

export function letterTexture(ch, seed) {
  const c = canvas(64, 80), x = c.getContext('2d');
  x.fillStyle = '#e4d8b0'; x.fillRect(0, 0, 64, 80);
  x.strokeStyle = '#a8882e'; x.lineWidth = 5; x.strokeRect(2, 2, 60, 76);
  x.fillStyle = '#8a1f1a';
  x.font = 'bold 62px Georgia, serif';
  x.textAlign = 'center';
  x.fillText(ch, 32, 61);
  age(x, 64, 80, seed, 0.25);
  return plain(c);
}

export function clockTexture(hour, minute, seed) {
  const c = canvas(128, 128), x = c.getContext('2d');
  x.fillStyle = '#2a2018'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#d8ceb0';
  x.beginPath(); x.arc(64, 64, 58, 0, 6.283); x.fill();
  x.fillStyle = '#2a2018';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.283;
    x.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 2, 5, 5);
  }
  const hand = (a, len, w) => {
    x.strokeStyle = '#1a1410'; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.sin(a) * len, 64 - Math.cos(a) * len); x.stroke();
  };
  hand(((hour % 12) + minute / 60) / 12 * 6.283, 28, 6);
  hand((minute / 60) * 6.283, 44, 4);
  age(x, 128, 128, seed, 0.4);
  return plain(c);
}

// Cheerful painted backdrops for the back wall of each cage, long faded.
export function muralTexture(kind) {
  const W = 512, H = 256;
  const c = canvas(W, H), x = c.getContext('2d');
  const r = rng(kind.length * 31);
  const sky = (a, b) => {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, a); g.addColorStop(1, b);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  };
  const sun = (sx, sy, rad, col) => {
    x.fillStyle = col;
    x.beginPath(); x.arc(sx, sy, rad, 0, 6.283); x.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.283;
      x.fillRect(sx + Math.cos(a) * (rad + 8) - 3, sy + Math.sin(a) * (rad + 8) - 3, 7, 7);
    }
    // the sun is always smiling
    x.fillStyle = '#2a1a10';
    x.beginPath(); x.arc(sx - rad * 0.35, sy - rad * 0.2, rad * 0.1, 0, 6.283); x.fill();
    x.beginPath(); x.arc(sx + rad * 0.35, sy - rad * 0.2, rad * 0.1, 0, 6.283); x.fill();
    x.strokeStyle = '#2a1a10'; x.lineWidth = 4;
    x.beginPath(); x.arc(sx, sy + rad * 0.05, rad * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  };
  if (kind === 'savanna') {
    sky('#d98a3a', '#e8c46a');
    sun(390, 90, 44, '#f4dc7a');
    x.fillStyle = '#8a6a2a'; x.fillRect(0, 190, W, 66);
    x.fillStyle = '#3a2a16';
    for (const tx of [90, 250]) {
      x.fillRect(tx - 5, 120, 10, 80);
      x.beginPath(); x.ellipse(tx, 116, 70, 18, 0, 0, 6.283); x.fill();
    }
  } else if (kind === 'lagoon') {
    sky('#5ab0a8', '#e8a8b0');
    sun(110, 80, 40, '#f8e0a0');
    x.fillStyle = '#d87a98'; x.fillRect(0, 180, W, 76);
    x.fillStyle = '#2a5a3a';
    for (const tx of [330, 440]) {
      x.fillRect(tx - 5, 80, 10, 110);
      for (let i = 0; i < 7; i++) {
        x.save(); x.translate(tx, 82); x.rotate(-1.4 + i * 0.47);
        x.beginPath(); x.ellipse(40, 0, 44, 9, 0, 0, 6.283); x.fill(); x.restore();
      }
    }
  } else if (kind === 'jungle') {
    sky('#3a7a4a', '#1e4a2a');
    sun(256, 70, 36, '#e8e07a');
    for (let i = 0; i < 46; i++) {
      x.fillStyle = ['#2a6a3a', '#1e5230', '#3a8a4a', '#164024'][(r() * 4) | 0];
      x.save(); x.translate(r() * W, 60 + r() * 200); x.rotate(r() * 3.14);
      x.beginPath(); x.ellipse(0, 0, 50 + r() * 30, 14, 0, 0, 6.283); x.fill(); x.restore();
    }
    x.strokeStyle = '#143a20'; x.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const vx = r() * W;
      x.beginPath(); x.moveTo(vx, 0); x.quadraticCurveTo(vx + 40, 80, vx - 10, 150 + r() * 80); x.stroke();
    }
  } else {
    sky('#8ac4dc', '#d8ecf0');
    sun(100, 76, 38, '#f8eca0');
    x.fillStyle = '#4a8aa8'; x.fillRect(0, 196, W, 60);
    x.fillStyle = '#f2f6f6';
    for (const [bx, bw, bh] of [[220, 150, 130], [370, 120, 90], [470, 90, 150]]) {
      x.beginPath(); x.moveTo(bx - bw / 2, 200); x.lineTo(bx - bw * 0.1, 200 - bh); x.lineTo(bx + bw * 0.2, 200 - bh * 0.7); x.lineTo(bx + bw / 2, 200); x.fill();
    }
  }
  // decades of damp
  x.fillStyle = '#6c6a63';
  for (let i = 0; i < 22; i++) {
    const cx = r() * W, cy = r() * H, s = 6 + r() * 30;
    x.beginPath();
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * 6.283, rr = s * (0.5 + r() * 0.6);
      if (j === 0) x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.fill();
  }
  x.fillStyle = 'rgba(60,62,58,0.42)'; x.fillRect(0, 0, W, H);
  age(x, W, H, kind.length * 7, 2);
  return plain(c);
}

// Tally marks scratched into plaster. Transparent background.
export function tallyTexture() {
  const c = canvas(256, 128), x = c.getContext('2d');
  const r = rng(77);
  x.strokeStyle = 'rgba(28,24,20,0.9)'; x.lineWidth = 2; x.lineCap = 'round';
  let px = 8, py = 10;
  for (let g = 0; g < 46; g++) {
    for (let i = 0; i < 4; i++) {
      x.beginPath(); x.moveTo(px + i * 5 + r() * 2, py + r() * 2); x.lineTo(px + i * 5 + r() * 2, py + 16 + r() * 2); x.stroke();
    }
    x.beginPath(); x.moveTo(px - 3, py + 13); x.lineTo(px + 20, py + 3); x.stroke();
    px += 30;
    if (px > 232) { px = 8 + r() * 6; py += 22; }
  }
  const t = plain(c);
  return t;
}

// The long sheet coming out of the typewriter.
export function typedTexture() {
  const c = canvas(128, 512), x = c.getContext('2d');
  x.fillStyle = '#d8d2c0'; x.fillRect(0, 0, 128, 512);
  x.fillStyle = '#1a1612'; x.font = '9px Courier New, monospace';
  const words = ['ook', 'ook', 'ook ook', 'banana', 'ook', 'good boy', 'ook ook ook', 'i am a monkey', 'ook'];
  const r = rng(5);
  for (let y = 12; y < 500; y += 11) {
    let line = '';
    while (line.length < 20) line += words[(r() * words.length) | 0] + ' ';
    if (y > 300 && r() < 0.22) line = 'please';
    if (y > 440) line = 'i am a monkey i am a';
    x.fillText(line.slice(0, 22), 6, y);
  }
  age(x, 128, 512, 9, 0.6);
  return plain(c);
}

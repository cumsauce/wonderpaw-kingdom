import * as THREE from 'three';
import { rng } from './util.js';

// All surface textures are painted here on small canvases, then shown
// unfiltered for a coarse, old-console look.

const cache = {};
function getCanvas(key, w, h, draw) {
  if (!cache[key]) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    cache[key] = c;
  }
  return cache[key];
}

export function toTex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, w, h, r, n, pal, smin, smax, a) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = a * (0.4 + 0.6 * r());
    ctx.fillStyle = pal[(r() * pal.length) | 0];
    const s = smin + r() * (smax - smin);
    ctx.fillRect(r() * w, r() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

function cracks(ctx, w, h, r, n, color, len) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    let x = r() * w, y = r() * h, a = r() * 6.28;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < len; j++) {
      a += (r() - 0.5) * 1.3;
      x += Math.cos(a) * 4;
      y += Math.sin(a) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drips(ctx, w, h, r, n, rgb, alpha) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, l = h * (0.25 + r() * 0.75), ww = 2 + r() * 7;
    const g = ctx.createLinearGradient(0, 0, 0, l);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, ww, l);
  }
}

function blotch(ctx, w, h, r, n, rgb, alpha, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rmin + r() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

// Hard-edged flaked patches (paint that has come away).
function flakes(ctx, w, h, r, n, color, smin, smax) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const cx = r() * w, cy = r() * h, s = smin + r() * (smax - smin);
    ctx.beginPath();
    const k = 5 + ((r() * 4) | 0);
    for (let j = 0; j < k; j++) {
      const a = (j / k) * 6.283, rr = s * (0.5 + r() * 0.6);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.8;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function groundGrime(ctx, w, h, strength = 0.6) {
  const g = ctx.createLinearGradient(0, h, 0, h * 0.45);
  g.addColorStop(0, `rgba(18,14,10,${strength})`);
  g.addColorStop(1, 'rgba(18,14,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export const T = {
  asphalt(rx = 1, ry = 1) {
    return toTex(getCanvas('asphalt', 128, 128, (c, w, h) => {
      const r = rng(11);
      c.fillStyle = '#343436'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 2600, ['#2a2a2c', '#3e3e40', '#48474a', '#232324'], 1, 2.5, 0.8);
      blotch(c, w, h, r, 8, '14,13,12', 0.5, 10, 34);
      cracks(c, w, h, r, 9, '#111112', 16);
      blotch(c, w, h, r, 4, '70,60,40', 0.18, 8, 20);
    }), rx, ry);
  },
  cobble(rx = 1, ry = 1) {
    return toTex(getCanvas('cobble', 128, 128, (c, w, h) => {
      const r = rng(12);
      c.fillStyle = '#26241f'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const v = 70 + ((r() * 40) | 0);
        c.fillStyle = `rgb(${v + 8},${v + 2},${v - 8})`;
        const ox = (y % 2) * 8;
        c.fillRect(((x * 16 + ox) % w) + 1, y * 16 + 1, 14, 14);
      }
      speckle(c, w, h, r, 900, ['#3a362e', '#8b8576', '#221f1a'], 1, 2, 0.5);
      blotch(c, w, h, r, 6, '15,12,8', 0.5, 10, 30);
    }), rx, ry);
  },
  concrete(rx = 1, ry = 1) {
    return toTex(getCanvas('concrete', 128, 128, (c, w, h) => {
      const r = rng(13);
      c.fillStyle = '#716f68'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 2200, ['#66645d', '#7d7b73', '#5a5851', '#88867d'], 1, 3, 0.7);
      drips(c, w, h, r, 14, '40,28,16', 0.5);
      blotch(c, w, h, r, 6, '30,34,24', 0.35, 8, 26);
      cracks(c, w, h, r, 5, '#2c2b28', 14);
    }), rx, ry);
  },
  rust(rx = 1, ry = 1) {
    return toTex(getCanvas('rust', 64, 128, (c, w, h) => {
      const r = rng(14);
      c.fillStyle = '#4a2a1a'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 1400, ['#6b3a1c', '#3a2014', '#7d4a22', '#2a1810', '#8a5a2a'], 1, 3, 0.8);
      // what is left of the gilding
      speckle(c, w, h, r, 260, ['#b8983a', '#c9aa4a', '#9a7c2a'], 1, 3, 0.9);
      drips(c, w, h, r, 8, '20,10,6', 0.6);
    }), rx, ry);
  },
  plaster(color, rx = 1, ry = 1) {
    return toTex(getCanvas('plaster' + color, 256, 256, (c, w, h) => {
      const r = rng(15 + color.length * 7 + color.charCodeAt(2));
      c.fillStyle = color; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 1800, ['#ffffff', '#000000'], 1, 3, 0.06);
      flakes(c, w, h, r, 16, '#6c6a63', 6, 26);
      flakes(c, w, h, r, 10, '#57554f', 3, 12);
      drips(c, w, h, r, 22, '50,34,18', 0.45);
      drips(c, w, h, r, 8, '20,30,18', 0.4);
      blotch(c, w, h, r, 8, '20,16,10', 0.35, 14, 50);
      cracks(c, w, h, r, 6, 'rgba(30,26,22,0.8)', 22);
      groundGrime(c, w, h, 0.75);
    }), rx, ry);
  },
  stripes(a, b, rx = 1, ry = 1) {
    return toTex(getCanvas('stripes' + a + b, 64, 64, (c, w, h) => {
      const r = rng(16);
      c.fillStyle = a; c.fillRect(0, 0, w, h);
      c.fillStyle = b; c.fillRect(0, 0, w / 2, h);
      speckle(c, w, h, r, 500, ['#1a1612', '#3a3024'], 1, 3, 0.35);
      blotch(c, w, h, r, 5, '20,22,14', 0.45, 6, 22);
      drips(c, w, h, r, 6, '30,22,12', 0.4);
    }), rx, ry);
  },
  grass(rx = 1, ry = 1) {
    return toTex(getCanvas('grass', 128, 128, (c, w, h) => {
      const r = rng(17);
      c.fillStyle = '#34352a'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 3200, ['#3d3f2a', '#2a2b20', '#4a4630', '#2f2a1e', '#454a30'], 1, 3, 0.8);
      blotch(c, w, h, r, 7, '40,30,18', 0.45, 10, 30);
    }), rx, ry);
  },
  sand(rx = 1, ry = 1) {
    return toTex(getCanvas('sand', 128, 128, (c, w, h) => {
      const r = rng(18);
      c.fillStyle = '#8a7650'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 2600, ['#7a6844', '#9a8458', '#6a5a3a', '#a08c60'], 1, 2.5, 0.7);
      blotch(c, w, h, r, 8, '40,26,14', 0.4, 8, 30);
      cracks(c, w, h, r, 14, 'rgba(50,38,22,0.7)', 6);
    }), rx, ry);
  },
  ice(rx = 1, ry = 1) {
    return toTex(getCanvas('ice', 128, 128, (c, w, h) => {
      const r = rng(19);
      c.fillStyle = '#aebcbe'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 1600, ['#c4d0d0', '#9aa9ab', '#d2dada'], 1, 4, 0.5);
      blotch(c, w, h, r, 7, '120,110,50', 0.3, 8, 28);
      blotch(c, w, h, r, 5, '40,40,36', 0.3, 6, 20);
      cracks(c, w, h, r, 8, 'rgba(60,70,72,0.8)', 14);
    }), rx, ry);
  },
  rock(rx = 1, ry = 1) {
    return toTex(getCanvas('rock', 64, 64, (c, w, h) => {
      const r = rng(20);
      c.fillStyle = '#5c5449'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 900, ['#4a443a', '#6c6457', '#3a352d', '#7a7062'], 1, 4, 0.8);
    }), rx, ry);
  },
  wood(rx = 1, ry = 1) {
    return toTex(getCanvas('wood', 64, 64, (c, w, h) => {
      const r = rng(21);
      c.fillStyle = '#4c3824'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        c.fillStyle = ['#3c2a1a', '#5a442c', '#33241a'][(r() * 3) | 0];
        c.globalAlpha = 0.6;
        c.fillRect(r() * w, 0, 1 + r() * 2, h);
      }
      c.globalAlpha = 1;
      speckle(c, w, h, r, 200, ['#1e160e'], 1, 2, 0.6);
    }), rx, ry);
  },
  chips(rx = 1, ry = 1) {
    return toTex(getCanvas('chips', 128, 128, (c, w, h) => {
      const r = rng(22);
      c.fillStyle = '#3a2c1e'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        c.fillStyle = ['#5a4630', '#4a3826', '#6a5438', '#2a2016'][(r() * 4) | 0];
        c.save();
        c.translate(r() * w, r() * h);
        c.rotate(r() * 3.14);
        c.fillRect(0, 0, 2 + r() * 5, 1 + r() * 2);
        c.restore();
      }
    }), rx, ry);
  },
  bluepaint(rx = 1, ry = 1) {
    return toTex(getCanvas('bluepaint', 128, 128, (c, w, h) => {
      const r = rng(23);
      c.fillStyle = '#4f7f8c'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 1200, ['#5a8a96', '#44707c'], 1, 3, 0.5);
      flakes(c, w, h, r, 26, '#6e6c66', 3, 16);
      blotch(c, w, h, r, 8, '30,40,26', 0.4, 8, 30);
      cracks(c, w, h, r, 8, 'rgba(24,30,30,0.8)', 14);
    }), rx, ry);
  },
  rope(rx = 1, ry = 1) {
    return toTex(getCanvas('rope', 32, 32, (c, w, h) => {
      c.fillStyle = '#8a7650'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#4a3c24'; c.lineWidth = 2;
      for (let i = -32; i < 64; i += 6) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 16, 32); c.stroke();
      }
    }), rx, ry);
  },
  chainlink(rx = 1, ry = 1) {
    const t = toTex(getCanvas('chainlink', 32, 32, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.strokeStyle = '#7d7a70'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(32, 32);
      c.moveTo(32, 0); c.lineTo(0, 32);
      c.moveTo(-16, 16); c.lineTo(16, 48);
      c.moveTo(16, -16); c.lineTo(48, 16);
      c.moveTo(16, 48); c.lineTo(48, 16);
      c.moveTo(-16, 16); c.lineTo(16, -16);
      c.stroke();
    }), rx, ry);
    return t;
  },
  water(rx = 1, ry = 1) {
    return toTex(getCanvas('water', 64, 64, (c, w, h) => {
      const r = rng(24);
      c.fillStyle = '#0a1413'; c.fillRect(0, 0, w, h);
      speckle(c, w, h, r, 300, ['#12201e', '#060c0b', '#1a2a26'], 2, 8, 0.6);
      speckle(c, w, h, r, 30, ['#3a4a3a'], 1, 3, 0.5);
    }), rx, ry);
  },
};

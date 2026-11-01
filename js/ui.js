// Bausteine für die Oberfläche: Icons, Pixel-Grafiken, Fenster, Balken, Sound.

import { ICONS } from './icons-data.js';
import { fmtNum } from './logic.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const icon = (name, cls = '') =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name] || ICONS.alert}" fill="currentColor"/></svg>`;

// --- Mehrfarbige Pixel-Grafiken -------------------------------------------
// Jede Zeile ein String, jedes Zeichen ein Pixel; '.' ist transparent.

const PAL = {
  K: 'var(--ink)', W: '#fff', C: 'var(--cream)', R: 'var(--red)', Y: 'var(--yellow)', G: 'var(--green)',
  O: 'var(--orange)', B: 'var(--blue)', P: 'var(--pink)', T: 'var(--teal)', L: '#a8e08f', H: 'rgba(255,255,255,.7)',
};

export function pix(rows, cls = '', fill = {}) {
  const pal = { ...PAL, ...fill };
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>`;
      x += w;
    }
  });
  return `<svg class="pix ${cls}" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

export const SPARKLE = [
  '....K....',
  '...KYK...',
  '...KYK...',
  '.KKYYYKK.',
  'KYYYWYYYK',
  '.KKYYYKK.',
  '...KYK...',
  '...KYK...',
  '....K....',
];

export const HEART = [
  '.KKK...KKK.',
  'KRRRK.KRRRK',
  'KRWRRKRRRRK',
  'KRRRRRRRRRK',
  'KRRRRRRRRRK',
  '.KRRRRRRRK.',
  '..KRRRRRK..',
  '...KRRRK...',
  '....KRK....',
  '.....K.....',
];

export const CURSOR = [
  'K.......',
  'KK......',
  'KCK.....',
  'KCCK....',
  'KCCCK...',
  'KCCCCK..',
  'KCCCCCK.',
  'KCCCCKKK',
  'KCKCCK..',
  'KK.KCCK.',
  'K...KCK.',
  '.....KK.',
];

// Smileys für die Stimmung 1–5, Basis ist ein Pixel-Kreis
const FACE_BASE = [
  '....KKKK....',
  '..KKFFFFKK..',
  '.KFHHFFFFFK.',
  '.KFHFFFFFFK.',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  '.KFFFFFFFFK.',
  '.KFFFFFFFFK.',
  '..KKFFFFKK..',
  '....KKKK....',
];
const EYES = [[4, 4], [5, 4], [4, 7], [5, 7]];
const MOUTHS = {
  1: [[8, 4], [8, 5], [8, 6], [8, 7], [9, 3], [9, 8]],
  2: [[8, 5], [8, 6], [9, 4], [9, 7]],
  3: [[8, 4], [8, 5], [8, 6], [8, 7]],
  4: [[7, 3], [7, 8], [8, 4], [8, 5], [8, 6], [8, 7]],
  5: [[7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [8, 4], [8, 7], [9, 5], [9, 6]],
};
const FACE_FILL = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--yellow)', 4: '#a8e08f', 5: 'var(--green)' };
export const MOOD_LABEL = { 1: 'Mies', 2: 'Nicht so', 3: 'Okay', 4: 'Gut', 5: 'Super' };

export function face(mood, cls = '') {
  const rows = FACE_BASE.map((r) => r.split(''));
  for (const [y, x] of [...EYES, ...MOUTHS[mood]]) rows[y][x] = 'K';
  if (mood === 5) { rows[8][5] = 'P'; rows[8][6] = 'P'; }
  if (mood === 1) { rows[6][8] = 'B'; rows[7][8] = 'B'; }
  return pix(rows.map((r) => r.join('')), cls, { F: FACE_FILL[mood] });
}

// --- Fenster & Balken ------------------------------------------------------

export function win({ title = '', color = 'teal', body = '', cls = '', controls = true, right = '', attrs = '' }) {
  const ctrl = controls ? `<span class="win-ctrl" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span>` : '';
  return `<section class="win ${cls}" ${attrs}>
    <header class="win-bar bg-${color}"><span class="win-title">${title}</span>${right}${ctrl}</header>
    <div class="win-body">${body}</div>
  </section>`;
}

// Segmentierter Ladebalken wie im Retro-Design (0..1)
export const bar = (value, color = 'blue', cls = '') =>
  `<div class="bar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}">
    <div class="bar-fill bg-${color}" style="width:${Math.max(0, Math.min(1, value)) * 100}%"></div>
  </div>`;

export const pct = (v) => `${fmtNum(Math.round(v * 100))} %`;

export function strengthLabel(s) {
  if (s.installed) return 'Installiert ✓';
  if (s.total === 0) return 'Bereit zur Installation';
  return 'Installation läuft…';
}

// --- 8-Bit-Sound beim Abhaken -------------------------------------------

let audio;
export function blip(kind = 'done') {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'done' ? [660, 880, 1320] : kind === 'big' ? [523, 659, 784, 1046, 1318] : [440, 330];
    const t0 = audio.currentTime;
    notes.forEach((f, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'square';
      o.frequency.value = f;
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.1);
    });
  } catch { /* Ton ist nur Bonus */ }
}

// Kleine Pixel-Explosion an einer Position
export function burst(x, y, colors = ['var(--yellow)', 'var(--pink)', 'var(--green)', 'var(--blue)', 'var(--orange)']) {
  const layer = document.getElementById('fx');
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const d = 40 + Math.random() * 40;
    p.className = 'spark';
    p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    layer.append(p);
    setTimeout(() => p.remove(), 700);
  }
}

export function floatText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.cssText = `left:${x}px;top:${y}px`;
  document.getElementById('fx').append(el);
  setTimeout(() => el.remove(), 900);
}

// Einstieg: Router, Klick-Aktionen, Dialoge.

import { state, requestPersistence } from './store.js';
import { icon, pix, esc, SPARKLE, CURSOR } from './ui.js';
import * as today from './views/today.js';
import * as habit from './views/habit.js';
import * as mood from './views/mood.js';
import * as stats from './views/stats.js';
import * as more from './views/more.js';
import * as review from './views/review.js';
import * as welcome from './views/welcome.js';
import * as sos from './views/sos.js';

const ROUTES = [
  [/^#?\/?$|^#\/today$/, today.view, 'today'],
  [/^#\/mood$/, mood.view, 'mood'],
  [/^#\/day\/(\d{4}-\d{2}-\d{2})$/, mood.dayView, 'mood'],
  [/^#\/stats$/, stats.view, 'stats'],
  [/^#\/more$/, more.view, 'more'],
  [/^#\/review$/, review.view, null],
  [/^#\/library$/, habit.libraryView, null],
  [/^#\/new(?:\/(.+))?$/, habit.editView, null],
  [/^#\/edit\/(.+)$/, (id) => habit.editView(null, id), null],
  [/^#\/habit\/(.+)$/, habit.detailView, null],
  [/^#\/welcome$/, welcome.view, null],
  [/^#\/sos$/, sos.sosView, null],
  [/^#\/sos\/breathe$/, sos.breatheView, null],
  [/^#\/sos\/thought$/, sos.thoughtView, null],
  [/^#\/sos\/park$/, sos.parkView, null],
  [/^#\/facts$/, sos.factsView, null],
];

const ACTIONS = { ...today.actions, ...habit.actions, ...mood.actions, ...stats.actions, ...more.actions, ...review.actions, ...welcome.actions, ...sos.actions };

const NAV = [
  ['today', '#/today', 'home', 'Heute'],
  ['mood', '#/mood', 'mood-happy', 'Check-in'],
  ['stats', '#/stats', 'chart-bar', 'Verlauf'],
  ['more', '#/more', 'sliders', 'Mehr'],
];

const viewEl = document.getElementById('view');
const navEl = document.getElementById('nav');
let lastHash = null;

export function render() {
  if (!state.settings.onboarded && location.hash !== '#/welcome' && !location.hash.startsWith('#/new')) {
    location.replace('#/welcome');
    return;
  }
  const hash = location.hash || '#/today';
  let html = '', tab = null, mount;
  for (const [re, fn, t] of ROUTES) {
    const m = hash.match(re);
    if (m) {
      const out = fn(...m.slice(1));
      html = typeof out === 'string' ? out : out.html;
      mount = out.mount;
      tab = t;
      break;
    }
  }
  if (!html) { location.replace('#/today'); return; }

  const keepScroll = hash === lastHash ? window.scrollY : 0;
  viewEl.innerHTML = html;
  mount?.(viewEl);
  window.scrollTo(0, keepScroll);
  lastHash = hash;

  const showNav = state.settings.onboarded && !/^#\/(welcome|new|edit|library)/.test(hash);
  document.body.classList.toggle('has-nav', showNav);
  navEl.hidden = !showNav;
  navEl.innerHTML = NAV.map(([id, href, ic, label]) =>
    `<a href="${href}" class="nav-item ${tab === id ? 'active' : ''}" ${tab === id ? 'aria-current="page"' : ''}>
      ${icon(ic)}<span>${label}</span>${id === 'more' && more.needsBackup() ? '<b class="dot"></b>' : ''}
    </a>`).join('');
}

export const go = (hash) => { location.hash = hash; };
export const back = (fallback = '#/today') => { if (history.length > 1) history.back(); else location.replace(fallback); };

// --- Dialoge --------------------------------------------------------------

export function dialog({ title = 'nachricht.exe', color = 'orange', heading = '', text = '', html = '', buttons = [{ label: 'OK', value: true, primary: true }], sparkle = false }) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal');
    root.innerHTML = `<div class="modal-back"></div>
      <section class="win dialog" role="dialog" aria-modal="true" aria-label="${esc(heading || title)}">
        <header class="win-bar bg-${color}"><span class="win-title">${esc(title)}</span>
          <span class="win-ctrl" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span></header>
        <div class="win-body">
          ${sparkle ? `<div class="dialog-art">${pix(SPARKLE, 'sparkle-big')}</div>` : ''}
          ${heading ? `<h2 class="dialog-heading">${esc(heading)}</h2>` : ''}
          ${text ? `<p class="dialog-text">${esc(text)}</p>` : ''}
          ${html}
          <div class="dialog-buttons">
            ${buttons.map((b, i) => `<button class="btn ${b.primary ? 'btn-ok' : ''} ${b.danger ? 'btn-danger' : ''}" data-i="${i}">${esc(b.label)}${b.primary && buttons.length === 1 ? pix(CURSOR, 'cursor') : ''}</button>`).join('')}
          </div>
        </div>
      </section>`;
    root.hidden = false;
    const close = (value) => { root.hidden = true; root.innerHTML = ''; resolve(value); };
    root.querySelectorAll('[data-i]').forEach((btn) => btn.addEventListener('click', () => close(buttons[btn.dataset.i].value)));
    root.querySelector('.modal-back').addEventListener('click', () => close(buttons.length === 1 ? buttons[0].value : null));
    root.querySelector('.btn-ok, .btn')?.focus({ preventScroll: true });
  });
}

export const confirmDialog = (heading, text, yes = 'Ja', no = 'Abbrechen', danger = false) =>
  dialog({ title: 'frage.exe', color: 'yellow', heading, text, buttons: [{ label: no, value: false }, { label: yes, value: true, primary: !danger, danger }] });

export function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.getElementById('fx').append(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2300);
}

// --- Events ---------------------------------------------------------------

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

for (const type of ['input', 'change']) {
  document.addEventListener(type, (e) => {
    const el = e.target.closest(`[data-${type}]`);
    if (el) ACTIONS[el.dataset[type]]?.(el, e);
  });
}

document.addEventListener('submit', (e) => {
  const fn = ACTIONS[e.target.dataset.submit];
  if (fn) { e.preventDefault(); fn(e.target, e); }
});

window.addEventListener('hashchange', render);

// Um Mitternacht (oder nach langer Pause) den Tag neu berechnen
let renderedDay = new Date().toDateString();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && new Date().toDateString() !== renderedDay) {
    renderedDay = new Date().toDateString();
    render();
  }
});

// Lokal beim Entwickeln ohne Offline-Cache, damit Änderungen sofort sichtbar sind
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service Worker nicht registriert', err));
}

document.addEventListener('pointerdown', () => requestPersistence(), { once: true });

render();

// Erster Start: kurze Einführung, dann bis zu 3 Habits auswählen oder selbst anlegen.

import { state, update, saveHabit, deleteHabit } from '../store.js';
import { render, go, toast } from '../app.js';
import { LIBRARY, findTemplate } from '../library.js';
import { icon, esc, win, pix, SPARKLE, HEART, CURSOR } from '../ui.js';

let step = 1;
const picked = new Set();
const MAX = 3;

// Eigene Habits, die während der Einrichtung angelegt wurden, zählen mit
const count = () => picked.size + state.habits.length;

export function view() {
  if (step === 1 && !state.habits.length) {
    return `
      <div class="welcome-art">${pix(HEART, 'heart-big')}${pix(SPARKLE, 'sparkle-big')}</div>
      <header class="hero"><h1>Hey, schön dass du da bist.</h1><span class="pill">Dein Habit-Tracker</span></header>
      ${win({
        title: 'willkommen.exe', color: 'teal',
        body: `<p class="win-heading">Drei Regeln, die wirklich funktionieren:</p>
          <ul class="principles">
            <li><b>Klein anfangen.</b> Lieber 1 Seite jeden Tag als 50 Seiten einmal.</li>
            <li><b>Nie zweimal hintereinander auslassen.</b> Ein schlechter Tag ist normal und zerstört nichts.</li>
            <li><b>Harte Tage sind erlaubt.</b> Dann reicht die Mini-Version, und sie zählt voll.</li>
          </ul>
          <button class="btn btn-ok btn-block" data-act="welcomeNext">Los geht's ${pix(CURSOR, 'cursor')}</button>`,
      })}`;
  }

  const own = state.habits;
  return `
    <header class="hero"><h1>Womit fängst du an?</h1><span class="pill">Wähl 1 bis 3</span></header>
    <div class="bubble"><p>Weniger ist mehr: Mit wenigen Habits gleichzeitig hält man deutlich länger durch. Später kannst du jederzeit weitere hinzufügen.</p></div>

    <h2 class="section-title">Deine eigenen</h2>
    <div class="lib-list">
      ${own.map((h) => `
        <div class="lib-item sel">
          <span class="tile bg-${h.color}">${icon(h.icon)}</span>
          <span class="lib-text"><b>${esc(h.name)}</b>${h.anchor ? `<span>${esc(h.anchor)}</span>` : ''}</span>
          <button class="pick-box remove" data-act="welcomeRemove" data-id="${h.id}" aria-label="${esc(h.name)} entfernen">${icon('close')}</button>
        </div>`).join('')}
      <button class="add-btn" data-act="welcomeOwn">${icon('plus')} Eigenes Habit anlegen</button>
    </div>

    ${LIBRARY.map((g) => `
      <h2 class="section-title">${g.group}</h2>
      <div class="lib-list">${g.items.map((t) => `
        <button class="lib-item pickable ${picked.has(t.key) ? 'sel' : ''}" data-act="welcomePick" data-key="${t.key}" aria-pressed="${picked.has(t.key)}">
          <span class="tile bg-${t.color}">${icon(t.icon)}</span>
          <span class="lib-text"><b>${esc(t.name)}</b><span>${esc(t.why)}</span>${t.source ? `<small>${esc(t.source)}</small>` : ''}</span>
          <span class="pick-box">${picked.has(t.key) ? icon('check') : ''}</span>
        </button>`).join('')}
      </div>`).join('')}

    <div class="sticky-actions">
      <button class="btn btn-ok" data-act="welcomeDone" ${count() ? '' : 'disabled'}>Starten mit ${count()} von ${MAX}</button>
    </div>`;
}

const full = () => {
  if (count() < MAX) return false;
  toast(`Höchstens ${MAX} zum Start. Später kannst du jederzeit mehr hinzufügen.`);
  return true;
};

export const actions = {
  welcomeNext() { step = 2; render(); window.scrollTo(0, 0); },

  welcomePick(el) {
    const k = el.dataset.key;
    if (picked.has(k)) picked.delete(k);
    else if (!full()) picked.add(k);
    render();
  },

  welcomeOwn() {
    if (!full()) go('#/new');
  },

  welcomeRemove(el) {
    deleteHabit(el.dataset.id);
    render();
  },

  welcomeDone() {
    for (const k of picked) {
      const t = findTemplate(k);
      saveHabit({ name: t.name, icon: t.icon, color: t.color, anchor: t.anchor, mini: t.mini, days: [0, 1, 2, 3, 4, 5, 6] });
    }
    picked.clear();
    update((s) => { s.settings.onboarded = true; });
    location.replace('#/today');
  },
};

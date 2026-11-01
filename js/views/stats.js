// Verlauf: alle Habits mit Stärke, Serie, Gesamtzahl und Jahresübersicht.

import { state } from '../store.js';
import { habitStats, activeHabits, dayRatio, isPausedNow } from '../logic.js';
import { icon, esc, win, bar, pct, strengthLabel } from '../ui.js';
import { yearGrid } from './habit.js';

function card(h) {
  const s = habitStats(state, h);
  return `<a class="stat-card" href="#/habit/${h.id}">
    <div class="stat-card-head">
      <span class="tile bg-${h.color}">${icon(h.icon)}</span>
      <span class="stat-card-name"><b>${esc(h.name)}</b><small>${isPausedNow(h) ? 'pausiert' : strengthLabel(s)}</small></span>
      <span class="big-num sm">${Math.round(s.strength * 100)}<small>%</small></span>
    </div>
    ${bar(s.strength, h.color === 'blue' ? 'teal' : 'blue')}
    <div class="stat-card-row">
      <span>Serie <b>${s.streak}</b></span><span>Rekord <b>${s.best}</b></span><span>Gesamt <b>${s.total}×</b></span><span>Woche <b>${s.weekDone}/${s.weekPlanned}</b></span>
    </div>
  </a>`;
}

export function view() {
  const habits = activeHabits(state);
  const archived = state.habits.filter((h) => h.archived);
  const total = Object.values(state.logs).reduce((n, e) => n + Object.keys(e).length, 0);
  const checkins = Object.values(state.moods).filter((m) => m.mood).length;

  const year = yearGrid((k) => {
    const r = dayRatio(state, k);
    if (r == null || r === 0) return '';
    return r >= 1 ? 'on bg-green' : r >= 0.5 ? 'on lvl2' : 'on lvl1';
  });

  return `
    <header class="page-head"><div><h1>Verlauf</h1><span class="pill">Dein Fortschritt</span></div></header>

    <div class="tiles tiles-3">
      <div class="stat"><b>${total}</b><span>Haken gesamt</span></div>
      <div class="stat"><b>${habits.length}</b><span>Habits</span></div>
      <div class="stat"><b>${checkins}</b><span>Check-ins</span></div>
    </div>

    ${win({ title: 'jahr.exe', color: 'blue', body: `<p class="win-heading">Dein Jahr</p>${year}
      <div class="legend"><i></i>nichts <i class="on lvl1"></i>etwas <i class="on lvl2"></i>halb <i class="on bg-green"></i>alles</div>` })}

    ${habits.length ? `<h2 class="section-title">Deine Habits</h2><div class="stack">${habits.map(card).join('')}</div>`
      : `<p class="muted center">Noch keine Habits. <a href="#/library">Jetzt eins anlegen</a></p>`}

    ${archived.length ? `<h2 class="section-title">Archiv</h2><div class="stack">${archived.map(card).join('')}</div>` : ''}
  `;
}

export const actions = {};

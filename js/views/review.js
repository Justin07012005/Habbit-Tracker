// Wochenrückblick: Was lief gut, was war schwer, was passe ich an?

import { state, update } from '../store.js';
import { back, toast } from '../app.js';
import { today, addDays, weekday, weekStart, isoWeekKey, fmtDate, activeHabits, logOf, isScheduled, isPaused, moodAverage } from '../logic.js';
import { icon, esc, win, face, pix, SPARKLE } from '../ui.js';

function targetWeek() {
  const t = today();
  const lastWeek = addDays(weekStart(t), -7);
  if (weekday(t) === 0 && !state.reviews[isoWeekKey(lastWeek)] && Object.keys(state.logs).some((k) => k < t)) return lastWeek;
  return weekStart(t);
}

export function view() {
  const start = targetWeek();
  const end = addDays(start, 6);
  const last = end < today() ? end : today();
  const key = isoWeekKey(start);
  const r = state.reviews[key] || {};

  const rows = activeHabits(state).map((h) => {
    let done = 0, planned = 0;
    for (let k = start; k <= last; k = addDays(k, 1)) {
      if (k < h.createdAt && !logOf(state, h, k)) continue;
      if (isScheduled(h, k) && !isPaused(h, k)) planned++;
      if (logOf(state, h, k)) done++;
    }
    return `<li><span class="tile tile-sm bg-${h.color}">${icon(h.icon)}</span><span>${esc(h.name)}</span><b>${done} von ${planned}</b></li>`;
  }).join('');

  const avg = moodAverage(state, start, last);

  const summary = `
    <p class="win-heading">${fmtDate(start)} – ${fmtDate(end)}</p>
    ${rows ? `<ul class="week-list">${rows}</ul>` : '<p class="muted">Noch keine Habits.</p>'}
    ${avg ? `<div class="week-mood">${face(Math.round(avg), 'face-md')}<span>Stimmung im Schnitt: <b>${avg.toFixed(1).replace('.', ',')}</b> von 5</span></div>` : ''}
    <p class="hint">Brüche statt Prozente: Bei 7 Tagen sagt „5 von 7“ mehr als „71 %“.</p>`;

  const form = `
    <form class="form" data-submit="saveReview" data-key="${key}">
      <label class="field"><span>Was lief gut diese Woche?</span>
        <textarea name="good" rows="2" maxlength="600" placeholder="Auch Kleinigkeiten zählen.">${esc(r.good || '')}</textarea></label>
      <label class="field"><span>Was war schwer?</span>
        <textarea name="hard" rows="2" maxlength="600" placeholder="Ehrlich, ohne dich fertigzumachen.">${esc(r.hard || '')}</textarea></label>
      <label class="field"><span>Was passe ich nächste Woche an?</span>
        <textarea name="change" rows="2" maxlength="600" placeholder="z. B. Mini-Version kleiner machen, andere Uhrzeit…">${esc(r.change || '')}</textarea></label>
      <button type="submit" class="btn btn-ok btn-block">${r.savedAt ? 'Aktualisieren' : 'Rückblick speichern'}</button>
    </form>`;

  const past = Object.entries(state.reviews).filter(([k]) => k !== key).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  return `
    <button class="back-btn" data-act="back">${icon('chevron-left')}<span>Zurück</span></button>
    <header class="page-head"><div><h1>Wochenrückblick</h1><span class="pill">2 Minuten · ${key.replace('-W', ' · KW ')}</span></div>${pix(SPARKLE, 'sparkle-head')}</header>
    ${win({ title: 'woche.exe', color: 'orange', body: summary })}
    ${win({ title: 'notizen.txt', color: 'yellow', body: form })}
    ${past.length ? `<h2 class="section-title">Frühere Wochen</h2>${past.map(([k, v]) => `
      <details class="past-review"><summary>${k.replace('-W', ' · KW ')}</summary>
        ${v.good ? `<p><b>Gut:</b> ${esc(v.good)}</p>` : ''}${v.hard ? `<p><b>Schwer:</b> ${esc(v.hard)}</p>` : ''}${v.change ? `<p><b>Anpassen:</b> ${esc(v.change)}</p>` : ''}
      </details>`).join('')}` : ''}
  `;
}

export const actions = {
  saveReview(form) {
    const f = new FormData(form);
    update((s) => {
      s.reviews[form.dataset.key] = { good: f.get('good').trim(), hard: f.get('hard').trim(), change: f.get('change').trim(), savedAt: new Date().toISOString() };
    });
    toast('Rückblick gespeichert');
    back();
  },
};

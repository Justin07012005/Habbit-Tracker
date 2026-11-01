// Täglicher Check-in (Stimmung, Energie, Schlaf, Notiz) und „Was dir guttut“.

import { state, update } from '../store.js';
import { render, toast } from '../app.js';
import { today, addDays, weekday, DAY_SHORT, fmtNum, insights, MIN_CHECKINS } from '../logic.js';
import { icon, esc, win, bar, face, pix, MOOD_LABEL, SPARKLE, burst, blip } from '../ui.js';

const ENERGY = { 1: 'Leer', 2: 'Müde', 3: 'Geht so', 4: 'Wach', 5: 'Voller Energie' };
const sleepText = (v) => `${fmtNum(v, v % 1 ? 1 : 0)} Std.`;

export function view() {
  const m = state.moods[today()] || {};
  const energy = m.energy ?? 3;
  const sleep = m.sleep ?? 7;

  const form = `
    <p class="win-heading">Wie geht's dir heute?</p>
    <div class="faces">${[1, 2, 3, 4, 5].map((n) => `
      <button class="face-btn ${m.mood === n ? 'sel' : ''}" data-act="setMood" data-mood="${n}" aria-pressed="${m.mood === n}" aria-label="${MOOD_LABEL[n]}">
        ${face(n, 'face-lg')}<small>${MOOD_LABEL[n]}</small>
      </button>`).join('')}
    </div>

    <label class="slider-field">
      <span>Energie <b id="energy-out">${ENERGY[energy]}</b></span>
      <input type="range" class="range range-yellow" min="1" max="5" step="1" value="${energy}" data-input="slideEnergy" data-change="saveEnergy">
    </label>

    <label class="slider-field">
      <span>Schlaf letzte Nacht <b id="sleep-out">${sleepText(sleep)}</b></span>
      <input type="range" class="range range-blue" min="3" max="12" step="0.5" value="${sleep}" data-input="slideSleep" data-change="saveSleep">
    </label>

    <label class="field">
      <span>Was beschäftigt dich? <em>optional</em></span>
      <textarea name="note" rows="3" maxlength="1000" placeholder="Ein Satz reicht." data-change="saveNote">${esc(m.note || '')}</textarea>
    </label>
    ${m.mood ? `<p class="saved">${icon('check')} Für heute gespeichert</p>` : '<p class="hint">Tipp auf ein Gesicht speichert sofort.</p>'}`;

  // Letzte 14 Tage
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(addDays(today(), -i));
  const strip = `<div class="mood-strip">${days.map((k) => {
    const mm = state.moods[k]?.mood;
    return `<div class="mood-cell">${mm ? face(mm, 'face-sm') : '<i class="empty-face"></i>'}<small>${DAY_SHORT[weekday(k)]}</small></div>`;
  }).join('')}</div>`;

  const ins = insights(state);
  let insightBody;
  if (ins.checkins < MIN_CHECKINS) {
    insightBody = `
      <p>Nach ${MIN_CHECKINS} Check-ins zeige ich dir, was deine Stimmung hebt.</p>
      ${bar(ins.checkins / MIN_CHECKINS, 'pink')}
      <p class="hint">${ins.checkins} von ${MIN_CHECKINS} Check-ins</p>`;
  } else if (!ins.items.length) {
    insightBody = `<p>Noch kein klares Muster. Je mehr Tage zusammenkommen, desto genauer wird's.</p>`;
  } else {
    insightBody = `<ul class="insights">${ins.items.slice(0, 5).map((it) => {
      const up = it.diff > 0;
      const what = it.sleep ? 'mit 7+ Stunden Schlaf' : `mit „${esc(it.habit.name)}“`;
      return `<li class="${up ? 'up' : 'down'}">
        ${it.sleep ? icon('moon') : icon(it.habit.icon)}
        <span>${up
          ? `An Tagen ${what} war deine Stimmung im Schnitt <b>${fmtNum(it.diff, 1)} Punkte besser</b>.`
          : `An Tagen ${what} war deine Stimmung im Schnitt <b>${fmtNum(-it.diff, 1)} Punkte niedriger</b>. Kann auch heißen: Du greifst an schweren Tagen eher dazu.`}</span>
      </li>`;
    }).join('')}</ul>
    <p class="hint">Das ist ein Zusammenhang, kein Beweis. Aber ein guter Hinweis, was dir guttut.</p>`;
  }

  const html = `
    <header class="page-head"><div><h1>Check-in</h1><span class="pill">10 Sekunden für dich</span></div></header>
    ${win({ title: 'check-in.exe', color: 'pink', body: form })}
    ${win({ title: 'verlauf.exe', color: 'teal', body: strip })}
    ${win({ title: 'was-dir-guttut.exe', color: 'green', body: `<div class="insight-head">${pix(SPARKLE, 'sparkle-sm')}<b>Was dir guttut</b></div>${insightBody}` })}
  `;
  return { html, mount: (root) => root.querySelectorAll('.range').forEach(paintRange) };
}

const setField = (field, value) => update((s) => { s.moods[today()] = { ...(s.moods[today()] || {}), [field]: value }; });

export const actions = {
  setMood(el) {
    setField('mood', Number(el.dataset.mood));
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    if (state.settings.sound) blip('done');
    render();
  },
  slideEnergy(el) { document.getElementById('energy-out').textContent = ENERGY[el.value]; paintRange(el); },
  slideSleep(el) { document.getElementById('sleep-out').textContent = sleepText(Number(el.value)); paintRange(el); },
  saveEnergy(el) { setField('energy', Number(el.value)); },
  saveSleep(el) { setField('sleep', Number(el.value)); },
  saveNote(el) { setField('note', el.value.trim()); toast('Notiz gespeichert'); },
};

// Gefüllten Teil der Schiene einfärben
export function paintRange(el) {
  const p = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--p', `${p}%`);
}

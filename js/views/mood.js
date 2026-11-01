// Check-in (Stimmung, Energie, Schlaf, Notiz), Stimmungs-Kalender, Tagesansicht,
// „Schlechte Tage“ mit Mustern und „Was dir guttut“.

import { state, update } from '../store.js';
import { render, toast } from '../app.js';
import {
  today, addDays, weekday, parseDay, dayKey, fmtDate, DAY_SHORT, DAY_LONG, MONTHS, fmtNum, insights, MIN_CHECKINS,
  logOf, isScheduled, isPaused,
} from '../logic.js';
import { icon, esc, win, bar, face, pix, MOOD_LABEL, SPARKLE, burst, blip } from '../ui.js';

const ENERGY = { 1: 'Leer', 2: 'Müde', 3: 'Geht so', 4: 'Wach', 5: 'Voller Energie' };
const sleepText = (v) => `${fmtNum(v, v % 1 ? 1 : 0)} Std.`;
const shortDate = (k) => `${DAY_SHORT[weekday(k)]}, ${fmtDate(k)}`;
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// --- Check-in-Formular (heute oder ein früherer Tag) -----------------------

function checkinForm(day) {
  const m = state.moods[day] || {};
  const isToday = day === today();
  const energy = m.energy ?? 3;
  const sleep = m.sleep ?? 7;

  return `
    <div data-day="${day}">
      <p class="win-heading">${isToday ? 'Wie geht\'s dir heute?' : 'Wie ging\'s dir an dem Tag?'}</p>
      <div class="faces">${[1, 2, 3, 4, 5].map((n) => `
        <button class="face-btn ${m.mood === n ? 'sel' : ''}" data-act="setMood" data-mood="${n}" aria-pressed="${m.mood === n}" aria-label="${MOOD_LABEL[n]}">
          ${face(n, 'face-lg')}<small>${MOOD_LABEL[n]}</small>
        </button>`).join('')}
      </div>

      <label class="slider-field">
        <span>Energie <b class="out">${m.energy ? ENERGY[energy] : '–'}</b></span>
        <input type="range" class="range range-yellow" min="1" max="5" step="1" value="${energy}" data-input="slideEnergy" data-change="saveEnergy">
      </label>

      <label class="slider-field">
        <span>Schlaf ${isToday ? 'letzte Nacht' : 'in der Nacht davor'} <b class="out">${m.sleep != null ? sleepText(sleep) : '–'}</b></span>
        <input type="range" class="range range-blue" min="3" max="12" step="0.5" value="${sleep}" data-input="slideSleep" data-change="saveSleep">
      </label>

      <label class="field">
        <span>${isToday ? 'Was beschäftigt dich?' : 'Was hat dich beschäftigt?'} <em>optional</em></span>
        <textarea name="note" rows="3" maxlength="1000" placeholder="Ein Satz reicht." data-input="typeNote" data-change="saveNote">${esc(m.note || '')}</textarea>
      </label>
      ${m.mood ? `<p class="saved">${icon('check')} Gespeichert</p>` : '<p class="hint">Tipp auf ein Gesicht speichert sofort.</p>'}
    </div>`;
}

// --- Stimmungs-Kalender ------------------------------------------------------

let moodCal = null; // { y, m }

export function moodCalendar() {
  const t = today();
  if (!moodCal) { const d = parseDay(t); moodCal = { y: d.getFullYear(), m: d.getMonth() }; }
  const first = dayKey(new Date(moodCal.y, moodCal.m, 1, 12));
  const daysInMonth = new Date(moodCal.y, moodCal.m + 1, 0).getDate();
  const isCurrent = first === dayKey(new Date(parseDay(t).getFullYear(), parseDay(t).getMonth(), 1, 12));

  const cells = [];
  for (let i = 0; i < weekday(first); i++) cells.push('<span></span>');
  for (let d = 0; d < daysInMonth; d++) {
    const k = addDays(first, d);
    const m = state.moods[k];
    if (k > t) { cells.push(`<span class="mcal-day future"><small>${d + 1}</small></span>`); continue; }
    cells.push(`<a class="mcal-day ${k === t ? 'today' : ''}" href="#/day/${k}" aria-label="${fmtDate(k)}${m?.mood ? `, ${MOOD_LABEL[m.mood]}` : ''}">
      ${m?.mood ? face(m.mood, 'face-sm') : '<i class="empty-face"></i>'}
      <small>${d + 1}${m?.note ? '<b class="note-dot"></b>' : ''}</small>
    </a>`);
  }

  return `
    <div class="cal-head">
      <button class="icon-btn sm" data-act="moodCalMove" data-dir="-1" aria-label="Vorheriger Monat">${icon('chevron-left')}</button>
      <b>${MONTHS[moodCal.m]} ${moodCal.y}</b>
      <button class="icon-btn sm" data-act="moodCalMove" data-dir="1" aria-label="Nächster Monat" ${isCurrent ? 'disabled' : ''}>${icon('chevron-right')}</button>
    </div>
    <div class="mcal-grid">${DAY_SHORT.map((d) => `<span class="cal-wd">${d}</span>`).join('')}${cells.join('')}</div>
    <p class="hint">Tippe auf einen Tag, um ihn anzusehen oder nachzutragen. <b class="note-dot"></b> = mit Notiz</p>`;
}

// --- Habits an einem Tag -------------------------------------------------------

function habitStatus(h, k) {
  const log = logOf(state, h, k);
  if (log === 'full') return ['done', 'erledigt'];
  if (log === 'mini') return ['mini', 'Mini'];
  if (k < h.createdAt) return null;
  if (isPaused(h, k)) return ['off', 'pausiert'];
  if (!isScheduled(h, k)) return ['off', 'frei'];
  return k < today() ? ['miss', 'ausgelassen'] : ['open', 'offen'];
}

const missedOn = (k) => state.habits.filter((h) => habitStatus(h, k)?.[0] === 'miss');

// --- „Schlechte Tage“ und ihre Muster ------------------------------------------

let showAllBad = false;

function badDays() {
  const all = Object.keys(state.moods).filter((k) => state.moods[k].mood).sort().reverse();
  const bad = all.filter((k) => state.moods[k].mood <= 2);
  if (!all.length) return '';
  if (!bad.length) {
    return win({ title: 'schlechte-tage.exe', color: 'orange', body: '<p>Bisher keine Tage mit „Mies“ oder „Nicht so“. Schön!</p>' });
  }

  // Muster: Schlaf und ausgelassene Habits an schlechten Tagen im Vergleich zum Rest
  const rest = all.filter((k) => state.moods[k].mood >= 3);
  const patterns = [];
  const sleepOf = (ks) => ks.map((k) => state.moods[k].sleep).filter((v) => v != null);
  const sb = sleepOf(bad), sr = sleepOf(rest);
  if (sb.length >= 2 && sr.length >= 2 && avg(sr) - avg(sb) >= 0.5) {
    patterns.push(`${icon('moon')}<span>An schlechten Tagen hast du im Schnitt <b>${sleepText(Math.round(avg(sb) * 2) / 2)}</b> geschlafen, sonst <b>${sleepText(Math.round(avg(sr) * 2) / 2)}</b></span>`);
  }
  let worst = null;
  for (const h of state.habits) {
    const rate = (ks) => {
      const planned = ks.filter((k) => ['done', 'mini', 'miss'].includes(habitStatus(h, k)?.[0]));
      return { n: planned.length, miss: planned.filter((k) => habitStatus(h, k)[0] === 'miss').length };
    };
    const b = rate(bad), r = rate(rest);
    if (b.n < 2 || r.n < 2) continue;
    const diff = b.miss / b.n - r.miss / r.n;
    if (diff >= 0.25 && (!worst || diff > worst.diff)) worst = { h, diff, b };
  }
  if (worst) {
    patterns.push(`${icon(worst.h.icon)}<span>„${esc(worst.h.name)}“ hast du an <b>${worst.b.miss} von ${worst.b.n}</b> schlechten Tagen ausgelassen, an anderen Tagen viel seltener.</span>`);
  }

  const list = (showAllBad ? bad : bad.slice(0, 5)).map((k) => {
    const m = state.moods[k];
    const meta = [m.sleep != null && `${sleepText(m.sleep)} Schlaf`, m.energy && `Energie: ${ENERGY[m.energy]}`].filter(Boolean).join(' · ');
    const missed = missedOn(k);
    return `<a class="bad-row" href="#/day/${k}">
      ${face(m.mood, 'face-md')}
      <span class="bad-text">
        <b>${shortDate(k)}</b>
        ${meta ? `<small>${meta}</small>` : ''}
        ${m.note ? `<span class="bad-note">„${esc(m.note)}“</span>` : ''}
        ${missed.length ? `<small class="bad-missed">Ausgelassen: ${missed.map((h) => esc(h.name)).join(', ')}</small>` : ''}
      </span>
      ${icon('chevron-right')}
    </a>`;
  }).join('');

  return win({
    title: 'schlechte-tage.exe', color: 'orange',
    body: `
      <p class="win-heading">Deine schlechten Tage <span class="count">${bad.length}</span></p>
      ${patterns.length ? `<ul class="insights patterns">${patterns.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
      <div class="bad-list">${list}</div>
      ${bad.length > 5 ? `<button class="link" data-act="toggleBad">${showAllBad ? 'Weniger zeigen' : `Alle ${bad.length} zeigen`}</button>` : ''}
      <p class="hint">Schlechte Tage gehören dazu. Wenn du siehst, was sie gemeinsam haben, kannst du ihnen besser vorbeugen.</p>`,
  });
}

// --- Seiten -------------------------------------------------------------------

function insightWindow() {
  const ins = insights(state);
  let body;
  if (ins.checkins < MIN_CHECKINS) {
    body = `
      <p>Nach ${MIN_CHECKINS} Check-ins zeige ich dir, was deine Stimmung hebt.</p>
      ${bar(ins.checkins / MIN_CHECKINS, 'pink')}
      <p class="hint">${ins.checkins} von ${MIN_CHECKINS} Check-ins</p>`;
  } else if (!ins.items.length) {
    body = `<p>Noch kein klares Muster. Je mehr Tage zusammenkommen, desto genauer wird's.</p>`;
  } else {
    body = `<ul class="insights">${ins.items.slice(0, 5).map((it) => {
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
  return win({ title: 'was-dir-guttut.exe', color: 'green', body: `<div class="insight-head">${pix(SPARKLE, 'sparkle-sm')}<b>Was dir guttut</b></div>${body}` });
}

const paintAll = (root) => root.querySelectorAll('.range').forEach(paintRange);

export function view() {
  const html = `
    <header class="page-head"><div><h1>Check-in</h1><span class="pill">10 Sekunden für dich</span></div></header>
    ${win({ title: 'check-in.exe', color: 'pink', body: checkinForm(today()) })}
    ${win({ title: 'stimmung.exe', color: 'teal', body: moodCalendar() })}
    ${badDays()}
    ${insightWindow()}
  `;
  return { html, mount: paintAll };
}

export function dayView(k) {
  const t = today();
  if (k > t) { location.replace('#/mood'); return ''; }
  const habits = state.habits
    .map((h) => [h, habitStatus(h, k)])
    .filter(([h, s]) => s && (!h.archived || s[0] === 'done' || s[0] === 'mini'));

  const habitList = habits.length
    ? `<ul class="day-habits">${habits.map(([h, [cls, label]]) => `
        <li>
          <span class="tile tile-sm bg-${h.color}">${icon(h.icon)}</span>
          <span class="day-habit-name">${esc(h.name)}</span>
          <button class="day-status ${cls}" data-act="cycleDay" data-id="${h.id}" data-day="${k}" aria-label="${esc(h.name)}: ${label}, tippen zum Ändern">${label}</button>
        </li>`).join('')}
      </ul>
      <p class="hint">Tippen zum Nachtragen: erledigt → Mini → leer</p>`
    : '<p class="muted">An diesem Tag gab es noch keine Habits.</p>';

  const html = `
    <button class="back-btn" data-act="back">${icon('chevron-left')}<span>Zurück</span></button>
    <header class="page-head day-head">
      <a class="icon-btn sm" href="#/day/${addDays(k, -1)}" aria-label="Vorheriger Tag">${icon('chevron-left')}</a>
      <div class="center"><h1>${k === t ? 'Heute' : DAY_LONG[weekday(k)]}</h1><span class="pill">${fmtDate(k)} ${k.slice(0, 4)}</span></div>
      ${k < t ? `<a class="icon-btn sm" href="#/day/${addDays(k, 1)}" aria-label="Nächster Tag">${icon('chevron-right')}</a>` : '<span class="icon-btn sm" aria-hidden="true" style="visibility:hidden"></span>'}
    </header>
    ${win({ title: 'check-in.exe', color: 'pink', body: checkinForm(k) })}
    ${win({ title: 'habits.exe', color: 'teal', body: habitList })}
  `;
  return { html, mount: paintAll };
}

// --- Aktionen -------------------------------------------------------------

const dayOf = (el) => el.closest('[data-day]')?.dataset.day || today();
const setField = (day, field, value) => update((s) => { s.moods[day] = { ...(s.moods[day] || {}), [field]: value }; });
let noteTimer;

export const actions = {
  setMood(el) {
    setField(dayOf(el), 'mood', Number(el.dataset.mood));
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    if (state.settings.sound) blip('done');
    render();
  },
  slideEnergy(el) { el.closest('.slider-field').querySelector('.out').textContent = ENERGY[el.value]; paintRange(el); },
  slideSleep(el) { el.closest('.slider-field').querySelector('.out').textContent = sleepText(Number(el.value)); paintRange(el); },
  saveEnergy(el) { setField(dayOf(el), 'energy', Number(el.value)); },
  saveSleep(el) { setField(dayOf(el), 'sleep', Number(el.value)); },
  // Beim Tippen leise mitspeichern, damit nichts verloren geht, wenn die App zugeht
  typeNote(el) {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => setField(dayOf(el), 'note', el.value.trim()), 600);
  },
  saveNote(el) {
    clearTimeout(noteTimer);
    setField(dayOf(el), 'note', el.value.trim());
    toast('Notiz gespeichert');
  },
  moodCalMove(el) {
    const d = new Date(moodCal.y, moodCal.m + Number(el.dataset.dir), 1);
    moodCal = { y: d.getFullYear(), m: d.getMonth() };
    render();
  },
  toggleBad() { showAllBad = !showAllBad; render(); },
};

// Gefüllten Teil der Schiene einfärben
export function paintRange(el) {
  const p = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--p', `${p}%`);
}

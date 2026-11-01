// Startseite „Heute“: Tagesfortschritt, Habits abhaken, Mini-Modus, Schnell-Check-in.

import { state, update } from '../store.js';
import { render, dialog } from '../app.js';
import {
  today, addDays, weekday, isoWeekKey, fmtDate, DAY_LONG, habitStats, activeHabits, todayProgress, isPausedNow, isScheduled, INSTALLED,
} from '../logic.js';
import { icon, pix, esc, win, bar, pct, face, strengthLabel, blip, burst, floatText, SPARKLE, HEART, MOOD_LABEL } from '../ui.js';

const LINES = [
  'Ein kleiner Schritt reicht.',
  'Nicht perfekt. Nur dranbleiben.',
  'Du musst heute nur anfangen.',
  'Mini zählt auch.',
  'Jeder Haken ist ein Beweis.',
  'Schritt für Schritt.',
  'Sei heute nett zu dir.',
];

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Guten Morgen';
  if (h >= 11 && h < 17) return 'Hallo';
  if (h >= 17 && h < 23) return 'Guten Abend';
  return 'Noch wach?';
}

export function reviewDue(day = today()) {
  const wd = weekday(day);
  if (wd === 6) return !state.reviews[isoWeekKey(day)] && Object.keys(state.logs).some((k) => k >= addDays(day, -6) && k < day);
  if (wd === 0) return !state.reviews[isoWeekKey(addDays(day, -1))] && Object.keys(state.logs).some((k) => k < day);
  return false;
}

export const isBadDay = () => state.settings.badDay === today();

function habitWindow(h) {
  const s = habitStats(state, h);
  const done = s.doneToday;
  const bad = isBadDay();
  const title = s.total === 0
    ? 'neu.exe'
    : `${pix(HEART, 'heart-mini')} Serie ${s.streak} · ${s.total}×`;
  const kind = bad ? 'mini' : 'full';

  const body = `
    <div class="habit-main">
      <a class="habit-info" href="#/habit/${h.id}">
        <span class="tile bg-${h.color}">${icon(h.icon)}</span>
        <span class="habit-text">
          <b class="habit-name">${esc(h.name)}</b>
          ${h.anchor ? `<small class="habit-anchor">${esc(h.anchor)}</small>` : ''}
        </span>
      </a>
      <button class="check ${done ? 'is-done' : ''}" data-act="check" data-id="${h.id}" data-kind="${kind}"
        aria-pressed="${!!done}" aria-label="${esc(h.name)} ${done ? 'erledigt' : 'abhaken'}">
        ${done ? icon('check') : ''}
      </button>
    </div>
    ${(bad || done === 'mini') && h.mini ? `<p class="mini-line">${done === 'mini' ? 'Mini geschafft' : 'Mini'}: ${esc(h.mini)}</p>` : ''}
    <div class="strength">
      ${bar(s.strength, h.color === 'blue' ? 'teal' : 'blue')}
      <span class="strength-label">${strengthLabel(s)} <b>${pct(s.strength)}</b></span>
    </div>
    ${!done && s.lastMissed ? `
      <div class="nudge">
        <span>Letztes Mal ausgelassen. Heute nicht nochmal, dann bleibt die Serie. ${h.mini ? 'Mini reicht!' : ''}</span>
        <button class="link" data-act="backfill" data-id="${h.id}" data-day="${s.lastMissed}">Doch gemacht? Nachtragen</button>
      </div>` : ''}
    ${!done && !bad && h.mini ? `<button class="btn-mini" data-act="check" data-id="${h.id}" data-kind="mini">Nur Mini geschafft</button>` : ''}`;

  return win({
    title, color: h.color, body, controls: false,
    cls: `habit ${done ? 'done' : ''}`,
    right: `<a class="win-btn" href="#/habit/${h.id}" aria-label="Details">${icon('more-horizontal')}</a>`,
  });
}

function offRow(h) {
  const done = state.logs[today()]?.[h.id];
  const why = isPausedNow(h) ? 'pausiert' : 'heute frei';
  return `<div class="off-row">
    <a href="#/habit/${h.id}" class="off-info"><span class="tile tile-sm bg-${h.color}">${icon(h.icon)}</span><span>${esc(h.name)}</span><small>${why}</small></a>
    <button class="check check-sm ${done ? 'is-done' : ''}" data-act="check" data-id="${h.id}" data-kind="full" aria-label="Trotzdem abhaken">${done ? icon('check') : ''}</button>
  </div>`;
}

function moodWindow() {
  const m = state.moods[today()];
  if (m?.mood) {
    return win({
      title: 'check-in.exe', color: 'pink',
      body: `<a href="#/mood" class="mood-done">${face(m.mood, 'face-md')}<span>Heute: <b>${MOOD_LABEL[m.mood]}</b><small>Energie, Schlaf, Notiz ergänzen</small></span>${icon('chevron-right')}</a>`,
    });
  }
  return win({
    title: 'check-in.exe', color: 'pink',
    body: `<p class="win-heading">Wie geht's dir heute?</p>
      <div class="faces">${[1, 2, 3, 4, 5].map((n) => `<button class="face-btn" data-act="quickMood" data-mood="${n}" aria-label="${MOOD_LABEL[n]}">${face(n, 'face-lg')}<small>${MOOD_LABEL[n]}</small></button>`).join('')}</div>`,
  });
}

export function view() {
  const day = today();
  const habits = activeHabits(state);
  const planned = habits.filter((h) => isScheduled(h, day) && !isPausedNow(h));
  const off = habits.filter((h) => !planned.includes(h));
  const prog = todayProgress(state);
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const allDone = prog.total > 0 && prog.done === prog.total;

  const fresh = weekday(day) === 0 ? 'Neue Woche, frischer Start. Was letzte Woche war, ist vorbei.'
    : day.endsWith('-01') ? 'Neuer Monat. Ein guter Moment, neu anzufangen.' : null;
  const freshKey = `fresh-${day}`;

  const progress = win({
    title: 'heute.exe', color: 'orange',
    body: prog.total === 0
      ? `<p class="win-heading">Heute ist nichts geplant.</p><p class="muted">Genieß den freien Tag, oder hak trotzdem etwas ab.</p>`
      : `<div class="progress-head">
          <span class="vt">${allDone ? 'Alles erledigt!' : 'Loading…'}</span>
          <span class="big-num">${prog.done}<small>/${prog.total}</small></span>
        </div>
        ${bar(prog.done / prog.total, allDone ? 'green' : 'blue', 'bar-lg')}
        ${allDone ? `<p class="all-done">${pix(SPARKLE, 'sparkle-sm')} Stark. Für heute bist du fertig.</p>` : ''}`,
  });

  const bad = isBadDay();
  const badDay = bad
    ? `<div class="badday on">
        <div><b>Mini-Modus an</b><small>Heute zählt jede Mini-Version voll. Sei nett zu dir.</small></div>
        <button class="btn btn-sm" data-act="badDay">Aus</button>
      </div>`
    : `<button class="badday" data-act="badDay">
        ${icon('moon')}
        <div><b>Harter Tag?</b><small>Auf Mini-Versionen runterschalten</small></div>
        ${icon('chevron-right')}
      </button>`;

  const html = `
    <header class="page-head">
      <div>
        <h1>${greeting()}</h1>
        <p class="sub">${LINES[doy % LINES.length]}</p>
        <span class="pill">${DAY_LONG[weekday(day)]} · ${fmtDate(day)}</span>
      </div>
      <a href="#/review" class="icon-btn" aria-label="Wochenrückblick">${icon('mail')}${reviewDue() ? '<b class="dot"></b>' : ''}</a>
    </header>

    ${progress}

    ${fresh && !state.settings.dismissed[freshKey] ? `
      <div class="bubble">
        <p>${fresh}</p>
        <button class="link" data-act="dismiss" data-key="${freshKey}">Okay</button>
      </div>` : ''}

    ${habits.length === 0 ? win({
      title: 'start.exe', color: 'teal',
      body: `<p class="win-heading">Noch keine Habits.</p><p class="muted">Fang mit einem an, höchstens drei. Klein anfangen ist der Trick.</p>
        <a class="btn btn-ok btn-block" href="#/library">Habit hinzufügen</a>`,
    }) : `
      ${planned.length ? badDay : ''}
      <div class="stack">${planned.map(habitWindow).join('')}</div>
      ${off.length ? `<h2 class="section-title">Heute frei</h2><div class="off-list">${off.map(offRow).join('')}</div>` : ''}
    `}

    ${moodWindow()}

    ${habits.length ? `<a class="add-btn" href="#/library">${icon('plus')} Neues Habit</a>` : ''}
  `;
  return html;
}

// --- Feiern -----------------------------------------------------------------

const MILESTONES = [1, 7, 21, 30, 50, 100, 150, 200, 300, 365, 500];
const milestoneText = (n, name) => ({
  1: ['Erster Haken!', `Der schwerste Schritt bei „${name}“ ist geschafft: anfangen.`],
  7: ['7× geschafft!', 'Eine Woche Beweis, dass du das kannst.'],
  21: ['21×!', 'Langsam wird das zur Routine. Weiter so.'],
  30: ['30×!', 'Respekt. Das ist kein Zufall mehr.'],
}[n] || [`${n}×!`, `„${name}“ gehört inzwischen richtig zu dir.`]);

async function celebrate(h, before, after) {
  const seen = state.celebrated[h.id] || [];
  const mark = (m) => update((s) => { s.celebrated[h.id] = [...(s.celebrated[h.id] || []), m]; });

  if (before.strength < INSTALLED && after.strength >= INSTALLED && !seen.includes('installed')) {
    mark('installed');
    blip('big');
    await dialog({ title: 'setup.exe', color: 'green', sparkle: true, heading: 'Installation abgeschlossen!', text: `„${h.name}“ ist jetzt eine echte Gewohnheit und läuft fast von allein.` });
    return;
  }
  const m = MILESTONES.find((n) => before.total < n && after.total >= n);
  // „Erster Haken“ nur einmal in der ganzen App, nicht für jedes Habit
  const firstEver = m === 1 && Object.values(state.celebrated).some((list) => list.includes(1));
  if (m && !seen.includes(m) && !firstEver) {
    mark(m);
    const [heading, text] = milestoneText(m, h.name);
    if (m > 1) blip('big');
    await dialog({ sparkle: true, heading, text });
    return;
  }
  const prog = todayProgress(state);
  const key = `alldone-${today()}`;
  if (prog.total > 1 && prog.done === prog.total && !state.settings.dismissed[key]) {
    update((s) => { s.settings.dismissed[key] = true; });
    blip('big');
    await dialog({ sparkle: true, heading: 'Alles erledigt!', text: 'Jeder Haken heute ist ein Beweis, dass du dein Leben in die Hand nimmst.' });
  }
}

export const actions = {
  check(el) {
    const id = el.dataset.id;
    const h = state.habits.find((x) => x.id === id);
    const day = today();
    const before = habitStats(state, h);
    const current = state.logs[day]?.[id];

    update((s) => {
      const entry = (s.logs[day] ||= {});
      if (current) delete entry[id];
      else entry[id] = el.dataset.kind;
      if (!Object.keys(entry).length) delete s.logs[day];
    });

    if (!current) {
      const r = (el.closest('.habit')?.querySelector('.check') || el).getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      burst(x, y);
      floatText(x, y - 20, '+1');
      if (state.settings.sound) blip('done');
    }
    render();
    if (!current) {
      document.querySelector(`.check[data-id="${id}"]`)?.classList.add('pop');
      setTimeout(() => celebrate(h, before, habitStats(state, h)), 450);
    }
  },

  backfill(el) {
    update((s) => { (s.logs[el.dataset.day] ||= {})[el.dataset.id] = 'full'; });
    if (state.settings.sound) blip('done');
    render();
  },

  badDay() {
    update((s) => { s.settings.badDay = isBadDay() ? null : today(); });
    render();
  },

  dismiss(el) {
    update((s) => { s.settings.dismissed[el.dataset.key] = true; });
    render();
  },

  quickMood(el) {
    const mood = Number(el.dataset.mood);
    update((s) => { s.moods[today()] = { ...(s.moods[today()] || {}), mood }; });
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    if (state.settings.sound) blip('done');
    render();
  },
};

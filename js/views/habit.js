// Vorschläge, Habit anlegen/bearbeiten und Detailansicht mit Kalender.

import { state, update, saveHabit, deleteHabit, setPaused, cycleLog } from '../store.js';
import { render, go, back, dialog, confirmDialog, toast } from '../app.js';
import {
  today, addDays, weekday, weekStart, parseDay, dayKey, fmtDate, DAY_SHORT, MONTHS, habitStats, activeHabits,
  isScheduled, isPaused, isPausedNow, logOf,
} from '../logic.js';
import { LIBRARY, COLORS, HABIT_ICONS, ANCHORS, findTemplate } from '../library.js';
import { icon, esc, win, bar, pct, strengthLabel } from '../ui.js';

const backBtn = (label = 'Zurück') => `<button class="back-btn" data-act="back">${icon('chevron-left')}<span>${label}</span></button>`;

// --- Vorschläge -------------------------------------------------------------

export function libraryView() {
  const names = new Set(state.habits.map((h) => h.name.toLowerCase()));
  return `
    ${backBtn()}
    <header class="page-head"><div><h1>Neues Habit</h1><span class="pill">Vorschläge aus der Forschung</span></div></header>
    <a class="btn btn-ok btn-block" href="#/new">${icon('plus')} Eigenes Habit anlegen</a>
    <div class="bubble"><p>Tipp: Wähl eins, das sich gerade machbar anfühlt. Lieber klein und jeden Tag als groß und selten.</p></div>
    ${LIBRARY.map((g) => `
      <h2 class="section-title">${g.group}</h2>
      <div class="lib-list">
        ${g.items.map((t) => `
          <a class="lib-item" href="#/new/${t.key}">
            <span class="tile bg-${t.color}">${icon(t.icon)}</span>
            <span class="lib-text">
              <b>${esc(t.name)} ${names.has(t.name.toLowerCase()) ? '<em class="tag">schon dabei</em>' : ''}</b>
              <span>${esc(t.why)}</span>
              ${t.source ? `<small>${esc(t.source)}</small>` : ''}
            </span>
          </a>`).join('')}
      </div>`).join('')}
  `;
}

// --- Anlegen / Bearbeiten ---------------------------------------------------

export function editView(tplKey, id) {
  const existing = id && state.habits.find((h) => h.id === id);
  const tpl = tplKey ? findTemplate(tplKey) : null;
  const h = existing || {
    name: tpl?.name || '', icon: tpl?.icon || 'heart', color: tpl?.color || 'teal',
    anchor: tpl?.anchor || '', mini: tpl?.mini || '', days: [0, 1, 2, 3, 4, 5, 6],
  };

  const body = `
    <form class="form" data-submit="saveHabit" data-id="${existing ? existing.id : ''}">
      <label class="field">
        <span>Was willst du tun?</span>
        <div class="name-row">
          <span class="tile bg-${h.color}" id="preview-tile">${icon(h.icon)}</span>
          <input name="name" required maxlength="40" value="${esc(h.name)}" placeholder="z. B. 10 Minuten lesen" autocomplete="off">
        </div>
      </label>

      <div class="field">
        <span>Symbol</span>
        <input type="hidden" name="icon" value="${h.icon}">
        <div class="icon-grid">${HABIT_ICONS.map((n) => `<button type="button" class="icon-pick ${n === h.icon ? 'sel' : ''}" data-act="pickIcon" data-icon="${n}" aria-label="${n}">${icon(n)}</button>`).join('')}</div>
      </div>

      <div class="field">
        <span>Farbe</span>
        <input type="hidden" name="color" value="${h.color}">
        <div class="color-row">${COLORS.map((c) => `<button type="button" class="color-pick bg-${c} ${c === h.color ? 'sel' : ''}" data-act="pickColor" data-color="${c}" aria-label="${c}"></button>`).join('')}</div>
      </div>

      <div class="field">
        <label for="anchor">Wann genau? <em>Dein Wenn-dann-Plan</em></label>
        <input id="anchor" name="anchor" maxlength="60" value="${esc(h.anchor)}" placeholder="Nach dem Kaffee" autocomplete="off">
        <div class="chips">${ANCHORS.map((a) => `<button type="button" class="chip" data-act="pickAnchor" data-anchor="${esc(a)}">${esc(a)}</button>`).join('')}</div>
        <small class="hint">Häng das Habit an etwas, das du sowieso jeden Tag tust. Das ist die am besten belegte Technik, damit es klappt.</small>
      </div>

      <label class="field">
        <span>Mini-Version <em>für harte Tage</em></span>
        <input name="mini" maxlength="60" value="${esc(h.mini)}" placeholder="z. B. 1 Seite lesen" autocomplete="off">
        <small class="hint">So klein, dass es fast lächerlich ist. Sie zählt voll.</small>
      </label>

      <div class="field">
        <span>An welchen Tagen?</span>
        <div class="days">${DAY_SHORT.map((d, i) => `
          <label class="day-toggle"><input type="checkbox" name="days" value="${i}" ${h.days.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}
        </div>
      </div>

      <div class="form-buttons">
        <button type="button" class="btn" data-act="back">Abbrechen</button>
        <button type="submit" class="btn btn-ok">OK</button>
      </div>
    </form>`;

  return `
    <header class="page-head"><div><h1>${existing ? 'Bearbeiten' : 'Neues Habit'}</h1></div></header>
    ${win({ title: existing ? 'edit.exe' : 'neu.exe', color: h.color, body })}`;
}

// --- Detailansicht ----------------------------------------------------------

let cal = { id: null, y: 0, m: 0 };

function calendar(h) {
  const t = today();
  if (cal.id !== h.id) { const d = parseDay(t); cal = { id: h.id, y: d.getFullYear(), m: d.getMonth() }; }
  const first = dayKey(new Date(cal.y, cal.m, 1, 12));
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < weekday(first); i++) cells.push('<span></span>');
  for (let d = 0; d < daysInMonth; d++) {
    const k = addDays(first, d);
    const log = logOf(state, h, k);
    const future = k > t;
    const planned = isScheduled(h, k) && !isPaused(h, k);
    const miss = !log && !future && k < t && planned && k >= h.createdAt;
    const cls = [log === 'full' && `done bg-${h.color}`, log === 'mini' && 'mini', miss && 'miss', !planned && !log && 'off', k === t && 'today'].filter(Boolean).join(' ');
    cells.push(future
      ? `<span class="cal-day future">${d + 1}</span>`
      : `<button class="cal-day ${cls}" data-act="cycleDay" data-id="${h.id}" data-day="${k}" aria-label="${fmtDate(k)}">${d + 1}</button>`);
  }
  const isCurrent = `${cal.y}-${cal.m}` === `${parseDay(t).getFullYear()}-${parseDay(t).getMonth()}`;
  return `
    <div class="cal-head">
      <button class="icon-btn sm" data-act="calMove" data-dir="-1" aria-label="Vorheriger Monat">${icon('chevron-left')}</button>
      <b>${MONTHS[cal.m]} ${cal.y}</b>
      <button class="icon-btn sm" data-act="calMove" data-dir="1" aria-label="Nächster Monat" ${isCurrent ? 'disabled' : ''}>${icon('chevron-right')}</button>
    </div>
    <div class="cal-grid">${DAY_SHORT.map((d) => `<span class="cal-wd">${d}</span>`).join('')}${cells.join('')}</div>
    <p class="hint">Tippen zum Nachtragen: leer → erledigt → Mini → leer</p>`;
}

// Jahresraster: 53 Wochen, jede Spalte eine Woche (Mo oben)
export function yearGrid(cellClass) {
  const t = today();
  const start = addDays(weekStart(t), -52 * 7);
  let cells = '';
  for (let k = start; k <= addDays(weekStart(t), 6); k = addDays(k, 1)) {
    cells += `<i class="${k > t ? 'future' : cellClass(k)}"></i>`;
  }
  return `<div class="year-grid">${cells}</div><div class="year-legend"><span>vor 1 Jahr</span><span>heute</span></div>`;
}

export function detailView(id) {
  const h = state.habits.find((x) => x.id === id);
  if (!h) { location.replace('#/today'); return ''; }
  const s = habitStats(state, h);
  const paused = isPausedNow(h);
  const daysText = h.days.length === 7 ? 'Jeden Tag' : h.days.map((d) => DAY_SHORT[d]).join(', ');

  const status = win({
    title: s.installed ? 'installiert.exe' : 'installation.exe', color: h.color,
    body: `
      <div class="detail-head">
        <span class="tile tile-lg bg-${h.color}">${icon(h.icon)}</span>
        <div><h2>${esc(h.name)}</h2>${paused ? '<span class="tag">pausiert</span>' : ''}${h.archived ? '<span class="tag">archiviert</span>' : ''}</div>
      </div>
      <div class="strength-big">
        <span class="vt">${strengthLabel(s)}</span>
        <span class="big-num">${Math.round(s.strength * 100)}<small>%</small></span>
      </div>
      ${bar(s.strength, h.color === 'blue' ? 'teal' : 'blue', 'bar-lg')}
      <button class="link" data-act="explainStrength">Wie wird das berechnet?</button>`,
  });

  const tiles = `<div class="tiles">
    <div class="stat"><b>${s.streak}</b><span>Serie</span></div>
    <div class="stat"><b>${s.best}</b><span>Rekord</span></div>
    <div class="stat"><b>${s.total}×</b><span>Gesamt</span></div>
    <div class="stat"><b>${s.weekDone}<small>/${s.weekPlanned}</small></b><span>Diese Woche</span></div>
  </div>`;

  const year = yearGrid((k) => {
    const log = logOf(state, h, k);
    if (log === 'full') return `on bg-${h.color}`;
    if (log === 'mini') return 'half';
    return '';
  });

  return `
    ${backBtn()}
    ${status}
    ${tiles}
    ${win({ title: 'kalender.exe', color: 'yellow', body: calendar(h) })}
    ${win({ title: 'jahr.exe', color: 'blue', body: year })}
    ${win({ title: 'plan.txt', color: 'pink', body: `
      <dl class="plan">
        <dt>Wann</dt><dd>${h.anchor ? esc(h.anchor) : '<span class="muted">nicht festgelegt</span>'}</dd>
        <dt>Mini</dt><dd>${h.mini ? esc(h.mini) : '<span class="muted">keine</span>'}</dd>
        <dt>Tage</dt><dd>${daysText}</dd>
        <dt>Seit</dt><dd>${fmtDate(h.createdAt)} ${h.createdAt.slice(0, 4)}</dd>
      </dl>
      <a class="btn btn-block" href="#/edit/${h.id}">${icon('edit')} Bearbeiten</a>` })}
    <div class="danger-zone">
      <button class="btn" data-act="togglePause" data-id="${h.id}">${icon(paused ? 'play' : 'pause')} ${paused ? 'Fortsetzen' : 'Pausieren'}</button>
      <button class="btn" data-act="toggleArchive" data-id="${h.id}">${icon('archive')} ${h.archived ? 'Wiederherstellen' : 'Archivieren'}</button>
      <button class="btn btn-danger" data-act="deleteHabit" data-id="${h.id}">${icon('trash')} Löschen</button>
    </div>
    <p class="hint center">Pausieren: für Urlaub oder Krankheit, die Stärke bleibt stehen.<br>Archivieren: aus „Heute“ ausblenden, Daten bleiben.</p>
  `;
}

// --- Aktionen ---------------------------------------------------------------

function selectIn(el, attr) {
  el.parentElement.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
  el.classList.add('sel');
  const form = el.closest('form');
  form.elements[attr].value = el.dataset[attr];
  const tile = form.querySelector('#preview-tile');
  if (attr === 'icon') tile.innerHTML = icon(el.dataset.icon);
  else tile.className = `tile bg-${el.dataset.color}`;
}

export const actions = {
  back: () => back(),
  pickIcon: (el) => selectIn(el, 'icon'),
  pickColor: (el) => selectIn(el, 'color'),
  pickAnchor: (el) => { el.closest('.field').querySelector('input').value = el.dataset.anchor; },

  async saveHabit(form) {
    const f = new FormData(form);
    const days = f.getAll('days').map(Number).sort();
    const name = f.get('name').trim();
    if (!name) return;
    if (!days.length) { toast('Wähl mindestens einen Tag'); return; }
    const id = form.dataset.id || undefined;

    if (!id) {
      const running = activeHabits(state).filter((h) => !isPausedNow(h));
      const shaky = running.filter((h) => habitStats(state, h).strength < 0.5);
      if (running.length >= 3 && shaky.length) {
        const ok = await dialog({
          title: 'tipp.exe', color: 'yellow',
          heading: `Du hast schon ${running.length} Habits`,
          text: 'Wenige Gewohnheiten gleichzeitig klappen deutlich besser. Ein guter Zeitpunkt für ein neues: wenn deine anderen bei mindestens 50 % sind (≈ 2 Wochen dranbleiben).',
          buttons: [{ label: 'Trotzdem', value: true }, { label: 'Lieber später', value: false, primary: true }],
        });
        if (!ok) { go('#/today'); return; }
      }
    }

    saveHabit({ id, name, icon: f.get('icon'), color: f.get('color'), anchor: f.get('anchor').trim(), mini: f.get('mini').trim(), days });
    if (!state.settings.onboarded) update((s) => { s.settings.onboarded = true; });
    toast(id ? 'Gespeichert' : 'Habit angelegt');
    if (id) back(); else location.replace('#/today');
  },

  cycleDay(el) {
    cycleLog(el.dataset.id, el.dataset.day);
    render();
  },

  calMove(el) {
    const d = new Date(cal.y, cal.m + Number(el.dataset.dir), 1);
    cal = { ...cal, y: d.getFullYear(), m: d.getMonth() };
    render();
  },

  explainStrength() {
    dialog({
      title: 'hilfe.txt', color: 'blue', heading: 'Gewohnheitsstärke',
      html: `<div class="dialog-text">
        <p>Die Zahl zeigt, wie fest die Gewohnheit <b>gerade</b> sitzt, wie ein Akku.</p>
        <p>Jeder erledigte Tag lädt sie ein Stück auf. Ein verpasster zieht nur ein bisschen ab. Die letzten Wochen zählen am meisten.</p>
        <p>Nach etwa <b>66 Tagen</b> am Stück bist du bei 95 %. So lange dauert es laut Studie im Schnitt, bis etwas automatisch läuft (Lally et al. 2010).</p>
        <p>Tage, an denen das Habit nicht geplant oder pausiert ist, zählen nicht.</p>
      </div>`,
    });
  },

  togglePause(el) {
    const h = state.habits.find((x) => x.id === el.dataset.id);
    setPaused(h.id, !isPausedNow(h));
    toast(isPausedNow(h) ? 'Pausiert' : 'Weiter geht’s');
    render();
  },

  toggleArchive(el) {
    update((s) => { const h = s.habits.find((x) => x.id === el.dataset.id); h.archived = !h.archived; });
    render();
  },

  async deleteHabit(el) {
    const h = state.habits.find((x) => x.id === el.dataset.id);
    const ok = await confirmDialog('Wirklich löschen?', `„${h.name}“ und alle Haken dazu werden gelöscht. Wenn du nur eine Pause brauchst: Pausieren oder Archivieren behält deine Daten.`, 'Löschen', 'Abbrechen', true);
    if (!ok) return;
    deleteHabit(h.id);
    location.replace('#/today');
  },
};

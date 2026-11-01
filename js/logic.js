// Datums-Helfer und alle Berechnungen (Stärke, Serie, Quoten, Zusammenhänge).
// Daten-Tage sind lokale Strings "YYYY-MM-DD", Wochentage 0 = Montag … 6 = Sonntag.

// Pro geplantem Tag wandert die Stärke um diesen Anteil Richtung 100 % (erledigt)
// bzw. Richtung 0 % (verpasst). Gewählt so, dass 66 Tage am Stück ≈ 95 % ergeben
// (Lally et al. 2010: im Schnitt 66 Tage bis zur Automatik).
export const ALPHA = 1 - Math.pow(0.05, 1 / 66);
export const INSTALLED = 0.95;

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const today = () => dayKey(new Date());
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const weekday = (k) => (parseDay(k).getDay() + 6) % 7;
export const diffDays = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 864e5);
export const weekStart = (k) => addDays(k, -weekday(k));

export function isoWeekKey(k) {
  const d = parseDay(k);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4, 12);
  const week = 1 + Math.round(((d - jan4) / 864e5 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${year}-W${pad(week)}`;
}

export const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const DAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export const fmtDate = (k) => { const d = parseDay(k); return `${d.getDate()}. ${MONTHS[d.getMonth()]}`; };
export const fmtNum = (n, digits = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// --- Habit-Status pro Tag -------------------------------------------------

export const logOf = (state, habit, k) => state.logs[k]?.[habit.id] || null; // 'full' | 'mini' | null
export const isScheduled = (habit, k) => habit.days.includes(weekday(k));
export const isPaused = (habit, k) => (habit.pauses || []).some((p) => k >= p.from && (!p.to || k <= p.to));
export const isPausedNow = (habit) => (habit.pauses || []).some((p) => !p.to);

export function firstDay(state, habit) {
  let first = habit.createdAt;
  for (const k in state.logs) if (k < first && state.logs[k][habit.id]) first = k;
  return first;
}

// Wie zählt ein Tag? 'done' | 'miss' | 'skip' (nicht geplant / pausiert / heute noch offen)
export function dayStatus(state, habit, k, todayKey = today()) {
  if (logOf(state, habit, k)) return 'done';
  if (k > todayKey || k === todayKey) return 'skip';
  if (!isScheduled(habit, k) || isPaused(habit, k)) return 'skip';
  return 'miss';
}

// Alle Kennzahlen eines Habits in einem Durchlauf.
export function habitStats(state, habit, todayKey = today()) {
  const start = firstDay(state, habit);
  let strength = 0, total = 0, mini = 0;
  let run = 0, best = 0, misses = 0;
  let installedOn = null;

  for (let k = start; k <= todayKey; k = addDays(k, 1)) {
    const s = dayStatus(state, habit, k, todayKey);
    if (s === 'done') {
      strength += (1 - strength) * ALPHA;
      total++;
      if (logOf(state, habit, k) === 'mini') mini++;
      run++; misses = 0;
      if (!installedOn && strength >= INSTALLED) installedOn = k;
    } else if (s === 'miss') {
      strength *= 1 - ALPHA;
      // „Nie zweimal hintereinander“: erst der zweite verpasste Tag in Folge beendet die Serie.
      if (++misses >= 2) run = 0;
    }
    best = Math.max(best, run);
  }

  // Woche (Mo bis heute): erledigt / geplant, inkl. heute
  let weekDone = 0, weekPlanned = 0;
  for (let k = weekStart(todayKey); k <= todayKey; k = addDays(k, 1)) {
    const done = !!logOf(state, habit, k);
    const planned = isScheduled(habit, k) && !isPaused(habit, k);
    if (planned) weekPlanned++;
    if (done) weekDone++;
  }

  // Letzter geplanter Tag vor heute verpasst? → sanfter Hinweis „nicht zweimal“
  let lastMissed = null;
  for (let k = addDays(todayKey, -1), i = 0; k >= start && i < 14; k = addDays(k, -1), i++) {
    const s = dayStatus(state, habit, k, todayKey);
    if (s === 'done') break;
    if (s === 'miss') { lastMissed = k; break; }
  }

  return {
    strength, total, mini, streak: run, best, misses,
    weekDone, weekPlanned, installed: strength >= INSTALLED, installedOn,
    lastMissed: misses === 1 ? lastMissed : null,
    plannedToday: isScheduled(habit, todayKey) && !isPaused(habit, todayKey),
    doneToday: logOf(state, habit, todayKey),
    days: diffDays(start, todayKey) + 1,
  };
}

export const activeHabits = (state) => state.habits.filter((h) => !h.archived);

export function todayProgress(state, todayKey = today()) {
  const planned = activeHabits(state).filter((h) => isScheduled(h, todayKey) && !isPaused(h, todayKey));
  const done = planned.filter((h) => logOf(state, h, todayKey)).length;
  return { done, total: planned.length };
}

// Anteil erledigter geplanter Habits an einem Tag (für die Jahresübersicht aller Habits)
export function dayRatio(state, k) {
  let planned = 0, done = 0;
  for (const h of activeHabits(state)) {
    if (k < h.createdAt && !logOf(state, h, k)) continue;
    const isDone = !!logOf(state, h, k);
    if ((isScheduled(h, k) && !isPaused(h, k)) || isDone) planned++;
    if (isDone) done++;
  }
  return planned ? done / planned : null;
}

// --- Stimmung & Zusammenhänge -----------------------------------------------

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const MIN_CHECKINS = 10;

export function insights(state) {
  const days = Object.keys(state.moods).filter((k) => state.moods[k].mood);
  const result = { checkins: days.length, items: [] };
  if (days.length < MIN_CHECKINS) return result;

  for (const h of activeHabits(state)) {
    const withH = [], without = [];
    for (const k of days) {
      const done = !!logOf(state, h, k);
      if (done) withH.push(state.moods[k].mood);
      else if (isScheduled(h, k) && !isPaused(h, k) && k >= h.createdAt) without.push(state.moods[k].mood);
    }
    if (withH.length >= 3 && without.length >= 3) {
      const diff = avg(withH) - avg(without);
      if (Math.abs(diff) >= 0.3) result.items.push({ habit: h, diff, n: withH.length + without.length });
    }
  }

  const sleepGood = [], sleepBad = [];
  for (const k of days) {
    const m = state.moods[k];
    if (m.sleep == null) continue;
    (m.sleep >= 7 ? sleepGood : sleepBad).push(m.mood);
  }
  if (sleepGood.length >= 3 && sleepBad.length >= 3) {
    const diff = avg(sleepGood) - avg(sleepBad);
    if (Math.abs(diff) >= 0.3) result.items.push({ sleep: true, diff, n: sleepGood.length + sleepBad.length });
  }

  result.items.sort((a, b) => b.diff - a.diff);
  return result;
}

export function moodAverage(state, from, to) {
  const xs = [];
  for (let k = from; k <= to; k = addDays(k, 1)) if (state.moods[k]?.mood) xs.push(state.moods[k].mood);
  return xs.length ? avg(xs) : null;
}

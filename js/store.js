// Speicherung: alles liegt lokal im Browser-Speicher (localStorage) des Geräts.
// Jede Änderung wird sofort geschrieben, Backups gehen als JSON-Datei raus und rein.

import { today, addDays } from './logic.js';

const KEY = 'habbit-tracker.v1';
const listeners = new Set();

const fresh = () => ({
  version: 1,
  habits: [],
  logs: {},     // { 'YYYY-MM-DD': { habitId: 'full' | 'mini' } }
  moods: {},    // { 'YYYY-MM-DD': { mood: 1-5, energy: 1-5, sleep: Stunden, note } }
  reviews: {},  // { 'YYYY-Www': { good, hard, change, savedAt } }
  settings: {
    onboarded: false,
    sound: true,
    badDay: null,          // Datum, an dem der Mini-Modus aktiv ist
    lastBackup: null,
    dismissed: {},         // einmalige Hinweise, z. B. { 'fresh-2026-W45': true }
  },
  celebrated: {},          // { habitId: [Meilensteine] }
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const base = fresh();
      return { ...base, ...data, settings: { ...base.settings, ...data.settings } };
    }
  } catch (e) {
    console.error('Laden fehlgeschlagen', e);
  }
  return fresh();
}

export let state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Speichern fehlgeschlagen', e);
  }
  listeners.forEach((fn) => fn());
}

export const subscribe = (fn) => listeners.add(fn);

export function update(fn) {
  fn(state);
  save();
}

// Browser bitten, die Daten nicht bei Speicherknappheit zu löschen.
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
    return await navigator.storage?.persisted?.();
  } catch {
    return false;
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// --- Habits & Einträge --------------------------------------------------

export function toggleLog(habitId, day, kind = 'full') {
  update((s) => {
    const entry = (s.logs[day] ||= {});
    if (entry[habitId] === kind) delete entry[habitId];
    else entry[habitId] = kind;
    if (!Object.keys(entry).length) delete s.logs[day];
  });
}

// Kalender: leer → voll → mini → leer
export function cycleLog(habitId, day) {
  update((s) => {
    const entry = (s.logs[day] ||= {});
    const next = { undefined: 'full', full: 'mini', mini: undefined }[entry[habitId]];
    if (next) entry[habitId] = next;
    else delete entry[habitId];
    if (!Object.keys(entry).length) delete s.logs[day];
  });
}

export function saveHabit(data) {
  update((s) => {
    const existing = s.habits.find((h) => h.id === data.id);
    if (existing) Object.assign(existing, data);
    else s.habits.push({ id: uid(), createdAt: today(), archived: false, pauses: [], ...data });
  });
}

export function deleteHabit(id) {
  update((s) => {
    s.habits = s.habits.filter((h) => h.id !== id);
    for (const k of Object.keys(s.logs)) {
      delete s.logs[k][id];
      if (!Object.keys(s.logs[k]).length) delete s.logs[k];
    }
    delete s.celebrated[id];
  });
}

export function setPaused(id, paused) {
  update((s) => {
    const h = s.habits.find((x) => x.id === id);
    h.pauses ||= [];
    const open = h.pauses.find((p) => !p.to);
    if (paused && !open) h.pauses.push({ from: today(), to: null });
    if (!paused && open) {
      // Pause endet gestern, damit heute wieder zählt
      const y = addDays(today(), -1);
      if (y < open.from) h.pauses = h.pauses.filter((p) => p !== open);
      else open.to = y;
    }
  });
}

// --- Backup ---------------------------------------------------------------

export function backupFile() {
  const json = JSON.stringify({ app: 'habbit-tracker', exportedAt: new Date().toISOString(), data: state }, null, 1);
  return new File([json], `habit-backup-${today()}.json`, { type: 'application/json' });
}

export async function exportBackup() {
  const file = backupFile();
  // Auf dem iPhone öffnet das Teilen-Menü → „In Dateien sichern“ / iCloud Drive
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Habit-Backup' });
    } catch (e) {
      if (e.name === 'AbortError') return false;
      throw e;
    }
  } else {
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  update((s) => { s.settings.lastBackup = today(); });
  return true;
}

export async function importBackup(file) {
  const parsed = JSON.parse(await file.text());
  const data = parsed.data || parsed;
  if (!Array.isArray(data.habits) || typeof data.logs !== 'object') throw new Error('Keine gültige Backup-Datei');
  const base = fresh();
  state = { ...base, ...data, settings: { ...base.settings, ...data.settings, onboarded: true } };
  save();
}

export function resetAll() {
  state = fresh();
  save();
}

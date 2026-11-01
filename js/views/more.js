// „Mehr“: Backup, Ton, Erklärungen, Installation, Daten löschen.

import { state, update, exportBackup, importBackup, resetAll, requestPersistence } from '../store.js';
import { render, dialog, confirmDialog, toast } from '../app.js';
import { today, diffDays, fmtDate } from '../logic.js';
import { icon, win } from '../ui.js';

const BACKUP_DAYS = 14;

export function needsBackup() {
  // Erst melden, wenn seit 14 Tagen Daten ohne Backup zusammenkommen
  const first = Object.keys(state.logs).sort()[0];
  const last = state.settings.lastBackup;
  return !!first && diffDays(last || first, today()) >= BACKUP_DAYS;
}

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

let persisted = null;

export function view() {
  if (persisted === null) requestPersistence().then((p) => { persisted = !!p; render(); });
  const last = state.settings.lastBackup;

  const backup = `
    <p>Deine Daten sind nur auf diesem Gerät gespeichert. Schließen der App ist kein Problem, aber wenn du die App löschst oder das Handy verlierst, sind sie weg.</p>
    <p class="${needsBackup() ? 'warn' : 'muted'}">${last ? `Letztes Backup: ${fmtDate(last)} ${last.slice(0, 4)}` : 'Noch kein Backup gemacht.'}</p>
    <div class="btn-row">
      <button class="btn btn-ok" data-act="exportBackup">${icon('upload')} Sichern</button>
      <label class="btn">${icon('download')} Laden<input type="file" accept="application/json,.json" hidden data-change="importBackup"></label>
    </div>
    <p class="hint">Tipp: Im Teilen-Menü „In Dateien sichern“ → iCloud Drive wählen.${persisted ? ' Dauerhafter Speicher ist aktiv.' : ''}</p>`;

  const install = standalone() ? '' : win({
    title: 'installieren.txt', color: 'teal',
    body: `<p class="win-heading">Auf den Home-Bildschirm</p>
      <ol class="steps">
        <li>In Safari unten auf <b>Teilen</b> tippen (Quadrat mit Pfeil)</li>
        <li><b>Zum Home-Bildschirm</b> wählen</li>
        <li>Auf <b>Hinzufügen</b> tippen</li>
      </ol>
      <p class="hint">Danach öffnet sich die App ohne Browserleiste, wie eine echte App.</p>`,
  });

  return `
    <header class="page-head"><div><h1>Mehr</h1><span class="pill">Einstellungen</span></div></header>
    ${install}
    <div class="lib-list">
      <a class="lib-item" href="#/facts"><span class="tile bg-yellow">${icon('lightbulb')}</span>
        <span class="lib-text"><b>Fakten durchblättern</b><span>Psychologie, die hilft, mit Quellen. Lieblingsfakten merken.</span></span>${icon('chevron-right')}</a>
      <a class="lib-item" href="#/sos"><span class="tile bg-pink">${icon('heart')}</span>
        <span class="lib-text"><b>SOS</b><span>Atmen, Gedanken-Check, Grübel-Parkplatz und Hilfe.</span></span>${icon('chevron-right')}</a>
    </div>
    ${win({ title: 'backup.exe', color: 'orange', body: backup })}
    ${win({ title: 'einstellungen.exe', color: 'yellow', body: `
      <label class="switch-row"><span>${icon('music')} Sound beim Abhaken</span>
        <input type="checkbox" class="switch" ${state.settings.sound ? 'checked' : ''} data-change="toggleSound"></label>
      <div class="switch-row muted"><span>${icon('clock')} Erinnerungen</span><small>kommt bald</small></div>` })}
    ${win({ title: 'wie-es-funktioniert.txt', color: 'blue', body: `
      <ul class="principles">
        <li><b>Klein anfangen.</b> Höchstens 3 Habits gleichzeitig, mit einer Mini-Version für harte Tage.</li>
        <li><b>Wenn-dann-Plan.</b> Häng jedes Habit an etwas, das du sowieso tust.</li>
        <li><b>Nie zweimal hintereinander.</b> Ein verpasster Tag beendet die Serie nicht, erst der zweite.</li>
        <li><b>Gewohnheitsstärke</b> statt Prozent-Chaos: Sie wächst mit jedem Haken und erreicht nach ca. 66 Tagen 95 %.</li>
        <li><b>Check-in.</b> Nach 10 Tagen siehst du, was deine Stimmung hebt.</li>
      </ul>` })}
    ${win({ title: 'gefahr.exe', color: 'pink', body: `
      <p class="muted">Löscht alle Habits, Haken und Check-ins auf diesem Gerät.</p>
      <button class="btn btn-danger" data-act="resetAll">${icon('trash')} Alle Daten löschen</button>` })}
    <p class="hint center">Icons: pixelarticons (MIT)</p>
  `;
}

export const actions = {
  async exportBackup() {
    try {
      if (await exportBackup()) toast('Backup gesichert');
    } catch (e) {
      dialog({ heading: 'Hat nicht geklappt', text: String(e.message || e) });
    }
    render();
  },

  async importBackup(el) {
    const file = el.files[0];
    if (!file) return;
    const ok = await confirmDialog('Backup laden?', 'Die aktuellen Daten auf diesem Gerät werden durch das Backup ersetzt.', 'Laden');
    if (!ok) { el.value = ''; return; }
    try {
      await importBackup(file);
      toast('Backup geladen');
      location.hash = '#/today';
      render();
    } catch (e) {
      dialog({ heading: 'Konnte nicht geladen werden', text: 'Das scheint keine gültige Backup-Datei zu sein.' });
    }
  },

  toggleSound(el) {
    update((s) => { s.settings.sound = el.checked; });
  },

  async resetAll() {
    const ok = await confirmDialog('Wirklich alles löschen?', 'Das kann nicht rückgängig gemacht werden. Mach vorher am besten ein Backup.', 'Alles löschen', 'Abbrechen', true);
    if (!ok) return;
    resetAll();
    location.hash = '#/welcome';
  },
};

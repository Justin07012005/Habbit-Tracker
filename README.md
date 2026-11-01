# Habits – Habit-Tracker als Web-App

Ein Habit-Tracker im Retro-Desktop-Look, gebaut nach Erkenntnissen aus der Verhaltensforschung.
Läuft komplett im Browser, offline-fähig, und lässt sich auf dem iPhone zum Home-Bildschirm hinzufügen.

## Prinzipien

- **Gewohnheitsstärke statt Prozent-Chaos**: Jeder erledigte Tag lädt die Stärke ein Stück auf, ein verpasster zieht nur wenig ab. Nach ca. 66 Tagen am Stück sind es 95 % (Lally et al. 2010).
- **Nie zweimal hintereinander**: Ein verpasster Tag beendet die Serie nicht, erst der zweite in Folge.
- **Wenn-dann-Plan** und **Mini-Version** für jedes Habit, plus **Mini-Modus** für harte Tage.
- **Check-in** mit Stimmung, Energie und Schlaf. Nach 10 Einträgen zeigt die App, was die Stimmung hebt.
- **Wochenrückblick** am Sonntag.
- **Fakten statt Sprüche**: passende psychologische Fakten im richtigen Moment (nach verpassten Tagen, bei schlechter Stimmung). Bewusst keine positiven Affirmationen, die bei schlechter Verfassung eher schaden können (Wood et al. 2009).
- **SOS**: Gefühl benennen, Atemübung (zyklisches Seufzen), Gedanken-Check (kognitive Umstrukturierung), Grübel-Parkplatz mit fester Grübelzeit, Beweis-Archiv und Hilfe-Nummern.

## Daten

Alles liegt lokal im `localStorage` des Geräts, es gibt keinen Server. Backups gehen als JSON-Datei über das Teilen-Menü raus („In Dateien sichern“) und unter „Mehr“ wieder rein.

## Lokal starten

```bash
node tools/serve.mjs 8765
```

Dann http://localhost:8765 öffnen. Lokal ist der Service Worker aus, damit Änderungen sofort sichtbar sind. Er läuft nur über HTTPS (z. B. GitHub Pages).

## Aufbau

- `index.html`, `css/style.css`: Grundgerüst und Design
- `js/logic.js`: Berechnungen (Stärke, Serie, Quoten, Zusammenhänge)
- `js/store.js`: Speicherung und Backup
- `js/views/*`: die einzelnen Bildschirme
- `sw.js`: Offline-Cache. Bei Änderungen an der Dateiliste `CACHE` hochzählen.
- `tools/`: Icons erzeugen bzw. Pixel-Icons neu laden

Icons: [pixelarticons](https://github.com/halfmage/pixelarticons) (MIT, Gerrit Halfmann).

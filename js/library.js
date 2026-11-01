// Vorschläge für Habits mit Begründung aus der Forschung.
// Jeder Eintrag bringt einen Wenn-dann-Plan (anchor) und eine Mini-Version mit.

export const COLORS = ['teal', 'orange', 'pink', 'yellow', 'blue', 'green'];

export const HABIT_ICONS = [
  'human-run', 'human', 'human-handsup', 'zap', 'sun', 'moon', 'bed', 'drop', 'coffee', 'tea',
  'book-open', 'edit', 'notes', 'chat', 'users', 'heart', 'device-phone', 'wind', 'music', 'headphone',
  'home', 'lightbulb', 'briefcase', 'coin', 'gamepad', 'trophy', 'bullseye', 'clock', 'checklist', 'flag',
];

export const ANCHORS = ['Nach dem Aufstehen', 'Nach dem Zähneputzen', 'Nach dem Kaffee', 'Nach dem Mittagessen', 'Nach der Arbeit', 'Vor dem Schlafen'];

export const LIBRARY = [
  {
    group: 'Körper & Energie',
    items: [
      { key: 'walk', name: 'Spazieren gehen', icon: 'human', color: 'green', anchor: 'Nach dem Mittagessen', mini: '5 Minuten um den Block',
        why: 'Bewegung wirkt deutlich gegen gedrückte Stimmung. Gehen gehört zu den wirksamsten Formen.', source: 'Noetel et al., BMJ 2024' },
      { key: 'workout', name: 'Training', icon: 'human-handsup', color: 'orange', anchor: 'Nach der Arbeit', mini: '10 Kniebeugen',
        why: 'Krafttraining, Joggen und Yoga senken depressive Symptome messbar.', source: 'Noetel et al., BMJ 2024' },
      { key: 'water', name: 'Wasser trinken', icon: 'drop', color: 'blue', anchor: 'Nach dem Aufstehen', mini: 'Ein Glas Wasser',
        why: 'Schon leichter Flüssigkeitsmangel kann Konzentration und Stimmung drücken.', source: 'Armstrong et al. 2012' },
    ],
  },
  {
    group: 'Schlaf & Rhythmus',
    items: [
      { key: 'wake', name: 'Feste Aufstehzeit', icon: 'clock', color: 'yellow', anchor: 'Wenn der Wecker klingelt', mini: 'Füße auf den Boden, sofort',
        why: 'Ein regelmäßiger Schlafrhythmus sagt Gesundheit teils besser voraus als die Schlafdauer.', source: 'Windred et al. 2024' },
      { key: 'daylight', name: 'Morgens raus ans Licht', icon: 'sun', color: 'yellow', anchor: 'Nach dem Aufstehen', mini: '2 Minuten ans offene Fenster',
        why: 'Tageslicht am Morgen stellt die innere Uhr. Das hilft beim Einschlafen und gibt tagsüber Energie.', source: 'Schlafforschung' },
      { key: 'phone-bed', name: 'Handy weg vorm Schlafen', icon: 'moon', color: 'blue', anchor: 'Um 22:30 Uhr', mini: 'Handy außerhalb vom Bett laden',
        why: 'Weniger Bildschirm am Abend heißt besserer Schlaf, und der Kopf kommt zur Ruhe.', source: 'Schlafforschung' },
    ],
  },
  {
    group: 'Kopf & Gefühle',
    items: [
      { key: 'journal', name: 'Gedanken aufschreiben', icon: 'edit', color: 'pink', anchor: 'Vor dem Schlafen', mini: 'Ein Satz über den Tag',
        why: 'Gefühle und Gedanken aufzuschreiben hat kleine, aber belegte positive Effekte.', source: 'Frattaroli 2006' },
      { key: 'breathe', name: 'Atmen / Meditieren', icon: 'wind', color: 'teal', anchor: 'Nach dem Zähneputzen', mini: '3 ruhige Atemzüge',
        why: 'Achtsamkeitstraining reduziert Angst und Stress.', source: 'Goyal et al., JAMA 2014' },
      { key: 'good-things', name: '3 gute Dinge notieren', icon: 'heart', color: 'pink', anchor: 'Vor dem Schlafen', mini: 'Eine Sache, die okay war',
        why: 'Lenkt den Blick bewusst auf das, was funktioniert. Kleine, aber positive Effekte.', source: 'Seligman et al. 2005' },
      { key: 'read', name: 'Lesen', icon: 'book-open', color: 'orange', anchor: 'Vor dem Schlafen', mini: '1 Seite',
        why: 'Ein ruhiger Abschluss des Tages statt Bildschirm. Zeit nur für dich.', source: null },
    ],
  },
  {
    group: 'Menschen & Alltag',
    items: [
      { key: 'connect', name: 'Jemandem schreiben', icon: 'chat', color: 'teal', anchor: 'Nach dem Abendessen', mini: 'Eine kurze Nachricht an eine Person',
        why: 'Soziale Verbundenheit ist einer der stärksten Faktoren für Gesundheit und Lebenserwartung.', source: 'Holt-Lunstad et al. 2010' },
      { key: 'social-limit', name: 'Social Media begrenzen', icon: 'device-phone', color: 'orange', anchor: 'Wenn ich das Handy entsperre', mini: 'Eine App heute nicht öffnen',
        why: 'Wer Social Media 3 Wochen begrenzt hat, fühlte sich weniger einsam und weniger niedergeschlagen.', source: 'Hunt et al. 2018' },
      { key: 'tidy', name: 'Kurz aufräumen', icon: 'home', color: 'green', anchor: 'Vor dem Schlafen', mini: '5 Dinge wegräumen',
        why: 'Eine aufgeräumte Umgebung macht den Start in den nächsten Tag leichter.', source: null },
    ],
  },
];

export const findTemplate = (key) => LIBRARY.flatMap((g) => g.items).find((i) => i.key === key);

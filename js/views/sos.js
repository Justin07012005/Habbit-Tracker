// SOS für schwere Momente: Gefühl benennen, Atemübung, Gedanken-Check, Grübel-Parkplatz,
// Beweis-Archiv und Hilfe von Menschen. Außerdem die Fakten-Karten für andere Seiten.

import { state, update, uid } from '../store.js';
import { render, go, toast } from '../app.js';
import { today, fmtDate, habitStats, activeHabits } from '../logic.js';
import { pickFact, FACTS, CATEGORIES } from '../facts.js';
import { icon, pix, esc, win, face, burst, blip, SPARKLE, HEART } from '../ui.js';

const BULB = [
  '..KKKK..',
  '.KYYYYK.',
  'KYYWYYYK',
  'KYWYYYYK',
  'KYYYYYYK',
  '.KYYYYK.',
  '..KYYK..',
  '..KKKK..',
  '..KCCK..',
  '...KK...',
];

const backBtn = (to = null) => `<button class="back-btn" data-act="${to ? 'goTo' : 'back'}" ${to ? `data-to="${to}"` : ''}>${icon('chevron-left')}<span>Zurück</span></button>`;

// --- Fakten-Karte ------------------------------------------------------------

const factOffset = {};

export function factCard(category, dismissKey = null) {
  const f = pickFact(category, today(), factOffset[category] || 0);
  return `<div class="fact">
    <div class="fact-head">${pix(BULB, 'bulb')}<b>Gut zu wissen</b></div>
    <p>${esc(f.text)}</p>
    <small>${esc(f.source)}</small>
    <div class="fact-actions">
      <button class="link" data-act="nextFact" data-cat="${category}">Noch einer</button>
      <a class="link" href="#/facts">Alle Fakten</a>
      ${dismissKey ? `<button class="link" data-act="dismiss" data-key="${dismissKey}">Okay</button>` : ''}
    </div>
  </div>`;
}

// --- Alle Fakten zum Durchblättern ---------------------------------------------

const ALL_FACTS = Object.entries(FACTS).flatMap(([cat, list]) => list.map((f) => ({ ...f, cat })));
const favs = () => state.settings.favFacts || [];
let browse = { cat: 'all', i: 0 };

function browseList() {
  if (browse.cat === 'fav') return ALL_FACTS.filter((f) => favs().includes(f.text));
  if (browse.cat === 'all') return ALL_FACTS;
  return ALL_FACTS.filter((f) => f.cat === browse.cat);
}

export function factsView() {
  const list = browseList();
  const i = Math.min(browse.i, Math.max(0, list.length - 1));
  const f = list[i];
  const chips = [['all', 'Alle'], ['fav', `Gemerkt${favs().length ? ` (${favs().length})` : ''}`], ...Object.entries(CATEGORIES)];
  const isFav = f && favs().includes(f.text);

  return `
    ${backBtn()}
    <header class="page-head"><div><h1>Fakten</h1><span class="pill">Psychologie, die hilft</span></div>${pix(BULB, 'sparkle-head')}</header>
    <div class="chips wrap">${chips.map(([k, label]) => `<button class="chip ${browse.cat === k ? 'sel' : ''}" data-act="factsCat" data-cat="${k}">${label}</button>`).join('')}</div>
    ${f ? `
      <div class="fact fact-big">
        <div class="fact-head">${pix(BULB, 'bulb')}<b>${CATEGORIES[f.cat]}</b><span class="fact-count">${i + 1} / ${list.length}</span></div>
        <p>${esc(f.text)}</p>
        <small>${esc(f.source)}</small>
        <button class="fav-btn ${isFav ? 'on' : ''}" data-act="factFav" aria-pressed="${isFav}">${isFav ? pix(HEART, 'fav-heart') : icon('heart')} ${isFav ? 'Gemerkt' : 'Merken'}</button>
      </div>
      <div class="fact-nav">
        <button class="btn" data-act="factMove" data-dir="-1" aria-label="Vorheriger Fakt">${icon('chevron-left')}</button>
        <button class="btn btn-ok" data-act="factRandom">Zufällig</button>
        <button class="btn" data-act="factMove" data-dir="1" aria-label="Nächster Fakt">${icon('chevron-right')}</button>
      </div>`
    : `<div class="fact fact-big"><p>Noch nichts gemerkt. Tipp bei einem Fakt auf „Merken“, dann findest du ihn hier wieder.</p></div>`}
    <p class="hint center">Echte Erkenntnisse aus der Forschung, keine Sprüche. Jeder Fakt hat eine Quelle.</p>
  `;
}

// --- Beweis-Archiv ---------------------------------------------------------

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 3);

export function evidenceWindow() {
  const total = Object.values(state.logs).reduce((n, e) => n + Object.keys(e).length, 0);
  const stats = activeHabits(state).map((h) => [h, habitStats(state, h)]);
  const best = Math.max(0, ...stats.map(([, s]) => s.best));
  const week = stats.reduce((n, [, s]) => n + s.weekDone, 0);
  const installed = stats.filter(([, s]) => s.installed).map(([h]) => h);
  const goodDays = Object.values(state.moods).filter((m) => m.mood >= 4).length;

  const quotes = [
    ...Object.entries(state.moods).filter(([, m]) => m.mood >= 4 && m.note).map(([k, m]) => ({ k, text: m.note })),
    ...Object.values(state.reviews).filter((r) => r.good).map((r) => ({ k: r.savedAt.slice(0, 10), text: r.good })),
  ].sort((a, b) => hash(today() + a.k) - hash(today() + b.k)).slice(0, 2);

  const items = [
    total && [icon('check'), `Du hast schon <b>${total} Haken</b> gesetzt. Jeder davon ist wirklich passiert.`],
    week && [icon('calendar'), `Diese Woche schon <b>${week}</b> davon.`],
    best >= 2 && [icon('zap'), `Deine längste Serie: <b>${best} Tage</b> am Stück.`],
    ...installed.map((h) => [icon(h.icon), `„${esc(h.name)}“ ist schon <b>installiert</b> und läuft fast von allein.`]),
    goodDays && [face(4, 'face-xs'), `Du hattest schon <b>${goodDays} gute Tage</b>. Es kommen wieder welche.`],
    ...quotes.map((q) => [icon('notes'), `Am ${fmtDate(q.k)} hast du geschrieben: <i>„${esc(q.text)}“</i>`]),
  ].filter(Boolean);

  return win({
    title: 'beweise.exe', color: 'green',
    body: `<p class="win-heading">Beweise, dass du was hinkriegst</p>
      ${items.length
        ? `<ul class="evidence">${items.map(([ic, t]) => `<li>${ic}<span>${t}</span></li>`).join('')}</ul>
           <p class="hint">Dein Kopf sagt vielleicht gerade was anderes. Das hier sind deine echten Daten.</p>`
        : '<p>Du stehst noch am Anfang. Ab heute sammelt die App hier deine Beweise. Jeder Haken zählt.</p>'}`,
  });
}

// --- Grübelzeit (auf „Heute“, sobald die Uhrzeit erreicht ist) ----------------

const nowTime = () => new Date().toTimeString().slice(0, 5);

export function worryWindow() {
  const open = state.parked.filter((p) => !p.done);
  if (!open.length || nowTime() < state.settings.worryTime) return '';
  return win({
    title: 'grübelzeit.exe', color: 'blue',
    body: `<p class="win-heading">Deine Grübelzeit <span class="count">${open.length}</span></p>
      <p class="muted">Jetzt darfst du über deine geparkten Gedanken nachdenken, höchstens 15 Minuten. Viele wirken jetzt schon kleiner.</p>
      ${parkedList(open)}`,
  });
}

function parkedList(items) {
  return `<ul class="parked">${items.map((p) => `
    <li>
      <p>„${esc(p.text)}“</p>
      <small>${fmtDate(p.createdAt)}</small>
      <div class="parked-actions">
        <button class="btn btn-sm" data-act="parkDone" data-id="${p.id}">${icon('check')} Nicht mehr wichtig</button>
        <button class="btn btn-sm" data-act="parkCheck" data-id="${p.id}">${icon('lightbulb')} Gedanken-Check</button>
      </div>
    </li>`).join('')}</ul>`;
}

// --- SOS-Startseite -------------------------------------------------------

const FEELINGS = [
  { key: 'sad', named: 'Du bist gerade traurig.', label: 'Traurig', text: 'Traurigkeit darf da sein. Sie geht vorbei, auch wenn es sich gerade nicht so anfühlt.', tools: ['evidence', 'people'] },
  { key: 'anxious', named: 'Da ist gerade Angst.', label: 'Ängstlich', text: 'Angst ist eine Alarmanlage, die gerade zu laut eingestellt ist. Dein Körper kann sie runterregeln.', tools: ['breathe'] },
  { key: 'stressed', named: 'Gerade ist alles zu viel.', label: 'Überfordert', text: 'Alles auf einmal geht nicht. Ein Atemzug und eine Sache nach der anderen.', tools: ['breathe', 'park'] },
  { key: 'angry', named: 'Du bist gerade wütend.', label: 'Wütend', text: 'Wut hat oft einen Grund. Erst runterkommen, dann entscheiden, was du damit machst.', tools: ['breathe'] },
  { key: 'empty', named: 'Gerade fühlt sich alles leer an.', label: 'Leer', text: 'Wenn nichts geht, reicht der kleinste Schritt. Motivation kommt oft erst beim Machen.', tools: ['evidence', 'mini'] },
  { key: 'lonely', named: 'Du fühlst dich gerade einsam.', label: 'Einsam', text: 'Eine kurze Nachricht an eine Person kann schon viel verändern, auch wenn es Überwindung kostet.', tools: ['people'] },
  { key: 'ruminating', named: 'Deine Gedanken kreisen gerade.', label: 'Am Grübeln', text: 'Grübeln fühlt sich an wie Lösen, ist es aber meistens nicht. Park den Gedanken oder prüf ihn einmal richtig.', tools: ['park', 'thought'] },
  { key: 'selfcritical', named: 'Du bist gerade hart zu dir.', label: 'Hart zu mir', text: 'Würdest du so mit einem Freund reden? Prüf den Gedanken einmal fair.', tools: ['thought', 'evidence'] },
];

const TOOLS = {
  breathe: { href: '#/sos/breathe', icon: 'wind', color: 'teal', name: 'Atmen', desc: '1 Minute. Beruhigt den Körper schnell.' },
  thought: { href: '#/sos/thought', icon: 'lightbulb', color: 'yellow', name: 'Gedanken-Check', desc: '2 Minuten. Denkfallen erkennen und fairer denken.' },
  park: { href: '#/sos/park', icon: 'archive', color: 'blue', name: 'Grübel-Parkplatz', desc: 'Gedanken für später parken statt jetzt kreisen.' },
  evidence: { href: '#evidence', icon: 'trophy', color: 'green', name: 'Deine Beweise', desc: 'Was du schon geschafft hast, schwarz auf weiß.' },
  people: { href: '#people', icon: 'chat', color: 'pink', name: 'Mit jemandem reden', desc: 'Freunde oder anonym und kostenlos am Telefon.' },
  mini: { href: '#/today', icon: 'checklist', color: 'orange', name: 'Eine Mini-Version machen', desc: 'Nur ein winziger Schritt, und er zählt voll.' },
  facts: { href: '#/facts', icon: 'lightbulb', color: 'yellow', name: 'Fakten durchblättern', desc: 'Psychologie, die dich aus dem Gedankenkarussell holt.' },
};

let feeling = null;

const toolCard = (key, highlight = false) => {
  const t = TOOLS[key];
  const anchor = t.href.startsWith('#/') ? `href="${t.href}"` : `href="${t.href}" data-act="scrollTo" data-target="${t.href.slice(1)}"`;
  return `<a class="lib-item ${highlight ? 'sel' : ''}" ${anchor}>
    <span class="tile bg-${t.color}">${icon(t.icon)}</span>
    <span class="lib-text"><b>${t.name}</b><span>${t.desc}</span></span>
    ${icon('chevron-right')}
  </a>`;
};

export function sosView() {
  const f = FEELINGS.find((x) => x.key === feeling);
  const past = [...state.thoughts].reverse().slice(0, 5);

  return `
    ${backBtn()}
    <header class="page-head"><div><h1>Kurz durch&shy;atmen</h1><span class="pill">Du bist nicht allein</span></div>${pix(HEART, 'sparkle-head')}</header>

    ${win({
      title: 'gefühl.exe', color: 'pink',
      body: `<p class="win-heading">Was fühlst du gerade?</p>
        <div class="feelings">${FEELINGS.map((x) => `<button class="chip ${feeling === x.key ? 'sel' : ''}" data-act="pickFeeling" data-key="${x.key}">${x.label}</button>`).join('')}</div>
        ${f ? `<div class="feeling-answer">
            <p><b>Okay. ${f.named}</b> ${f.text}</p>
            <p class="hint">Allein das Gefühl zu benennen dämpft es schon ein bisschen (Lieberman et al. 2007).</p>
            <p class="win-heading sm">Das könnte dir jetzt helfen:</p>
            <div class="lib-list">${f.tools.map((t) => toolCard(t, true)).join('')}</div>
          </div>` : ''}`,
    })}

    <h2 class="section-title">Alle Werkzeuge</h2>
    <div class="lib-list">${['breathe', 'thought', 'park', 'facts', 'evidence', 'people'].map((t) => toolCard(t)).join('')}</div>

    <div id="evidence">${evidenceWindow()}</div>

    <div id="people">${win({
      title: 'hilfe.exe', color: 'orange',
      body: `<p class="win-heading">Mit jemandem reden</p>
        <p>Schreib einer Person, der du vertraust. Es muss kein langes Gespräch sein, „Hey, mir geht's grad nicht so gut“ reicht.</p>
        <a class="btn btn-block" href="sms:">${icon('chat')} Nachricht schreiben</a>
        <p class="win-heading sm" style="margin-top:16px">Anonym & kostenlos telefonieren</p>
        <div class="phone-list">
          <a class="btn btn-block" href="tel:08001110111">${icon('device-phone')}<span>Telefonseelsorge 0800 111 0 111<small>rund um die Uhr</small></span></a>
          <a class="btn btn-block" href="tel:08001110222">${icon('device-phone')}<span>Telefonseelsorge 0800 111 0 222<small>rund um die Uhr</small></span></a>
          <a class="btn btn-block" href="tel:116111">${icon('device-phone')}<span>Nummer gegen Kummer 116 111<small>für junge Leute, Mo–Sa 14–20 Uhr</small></span></a>
        </div>
        <p class="hint">Wenn du in akuter Gefahr bist oder daran denkst, dir etwas anzutun: Ruf sofort die <a href="tel:112"><b>112</b></a> an.</p>`,
    })}</div>

    ${past.length ? `<h2 class="section-title">Deine Gedanken-Checks</h2>${past.map((t) => `
      <details class="past-review"><summary>${fmtDate(t.date)} · ${esc(TRAPS.find((x) => x.key === t.trap)?.name || 'Gedanke')}</summary>
        <p><b>Vorher:</b> ${esc(t.thought)}</p>
        ${t.balanced ? `<p><b>Fairer:</b> ${esc(t.balanced)}</p>` : ''}
        <p class="hint">Geglaubt: ${t.before} % → ${t.after} %</p>
      </details>`).join('')}` : ''}
  `;
}

// --- Atemübung (zyklisches Seufzen, Balban et al. 2023) --------------------

const BREATH = [
  { text: 'Durch die Nase einatmen…', ms: 2200, scale: 0.78 },
  { text: 'Kurz nachziehen…', ms: 1000, scale: 1 },
  { text: 'Ganz langsam ausatmen…', ms: 5800, scale: 0.36 },
];
const CYCLES = 6;

export function breatheView() {
  return `
    ${backBtn('#/sos')}
    <header class="page-head"><div><h1>Atmen</h1><span class="pill">1 Minute</span></div></header>
    ${win({
      title: 'atmen.exe', color: 'teal',
      body: `<div class="breath-stage"><div class="breath-box" id="breath-box">${pix(HEART, 'breath-heart')}</div></div>
        <p class="breath-text" id="breath-text">Bereit, wenn du es bist.</p>
        <p class="vt center" id="breath-count">0 / ${CYCLES}</p>
        <button class="btn btn-ok btn-block" id="breath-start" data-act="startBreath">Start</button>
        <div id="breath-done" hidden>
          <p class="center"><b>Geschafft.</b> Spür kurz nach, wie es dir jetzt geht.</p>
          <div class="btn-row"><a class="btn" href="#/sos">Zurück zu SOS</a><button class="btn btn-ok" data-act="startBreath">Nochmal</button></div>
        </div>`,
    })}
    <p class="hint">Zweimal durch die Nase einatmen (einmal tief, dann kurz nachziehen), danach ganz langsam durch den Mund ausatmen. In einer Studie hob diese Übung die Stimmung stärker als Meditation (Balban et al. 2023).</p>
  `;
}

let breathRun = 0;

function runBreath() {
  const run = ++breathRun;
  const box = document.getElementById('breath-box');
  const text = document.getElementById('breath-text');
  const count = document.getElementById('breath-count');
  document.getElementById('breath-start').hidden = true;
  document.getElementById('breath-done').hidden = true;
  let cycle = 0, phase = 0;

  const step = () => {
    if (run !== breathRun || !document.body.contains(box)) return; // Seite verlassen
    if (phase === BREATH.length) { phase = 0; cycle++; count.textContent = `${cycle} / ${CYCLES}`; }
    if (cycle === CYCLES) {
      text.textContent = 'Fertig.';
      box.style.transform = 'scale(0.6)';
      document.getElementById('breath-done').hidden = false;
      if (state.settings.sound) blip('done');
      return;
    }
    const p = BREATH[phase++];
    text.textContent = p.text;
    box.style.transition = `transform ${p.ms}ms ease-in-out`;
    box.style.transform = `scale(${p.scale})`;
    setTimeout(step, p.ms);
  };
  step();
}

// --- Gedanken-Check (kognitive Umstrukturierung) --------------------------------

export const TRAPS = [
  { key: 'allornothing', name: 'Alles-oder-nichts', example: '„Ein Tag verpasst, jetzt ist alles kaputt.“', question: 'Gibt es etwas zwischen perfekt und gescheitert?' },
  { key: 'overgeneral', name: 'Verallgemeinern', example: '„Ich krieg nie was hin.“', question: 'Stimmt „nie“ wirklich? Fällt dir eine Ausnahme ein?' },
  { key: 'catastrophe', name: 'Katastrophisieren', example: '„Das wird furchtbar enden.“', question: 'Was ist realistisch am wahrscheinlichsten?' },
  { key: 'mindreading', name: 'Gedankenlesen', example: '„Die finden mich bestimmt peinlich.“', question: 'Woher weißt du, was andere denken?' },
  { key: 'should', name: 'Muss-Sätze', example: '„Ich müsste das längst können.“', question: 'Wer sagt, dass es so sein muss?' },
  { key: 'feeling', name: 'Gefühl = Fakt', example: '„Ich fühl mich wie ein Versager, also bin ich einer.“', question: 'Ist ein Gefühl ein Beweis?' },
  { key: 'discount', name: 'Positives kleinreden', example: '„Das war nur Glück.“', question: 'Würdest du das bei einem Freund auch so sehen?' },
];

const freshCheck = () => ({ step: 1, thought: '', before: 80, trap: null, friend: '', balanced: '', after: 50 });
let tc = freshCheck();

export function thoughtView() {
  const trap = TRAPS.find((t) => t.key === tc.trap);
  const steps = 4;
  let body;

  if (tc.step === 1) {
    body = `
      <label class="field"><span>Was denkst du gerade?</span>
        <textarea rows="3" maxlength="500" placeholder="z. B. Ich hab gestern nicht gelernt, ich krieg das eh nie hin." data-input="tcField" data-field="thought">${esc(tc.thought)}</textarea></label>
      <label class="slider-field"><span>Wie sehr glaubst du das? <b class="out">${tc.before} %</b></span>
        <input type="range" class="range range-pink" min="0" max="100" step="10" value="${tc.before}" data-input="tcRange" data-field="before"></label>`;
  } else if (tc.step === 2) {
    body = `
      <p class="win-heading">Welche Denkfalle könnte drinstecken?</p>
      <p class="quote">„${esc(tc.thought)}“</p>
      <div class="traps">${TRAPS.map((t) => `
        <button class="trap ${tc.trap === t.key ? 'sel' : ''}" data-act="tcTrap" data-trap="${t.key}">
          <b>${t.name}</b><small>${t.example}</small>
        </button>`).join('')}
      </div>
      <p class="hint">Unsicher? Nimm die, die am ehesten passt. Es gibt kein Falsch.</p>`;
  } else if (tc.step === 3) {
    body = `
      ${trap ? `<div class="bubble"><p>${trap.question}</p></div>` : ''}
      <label class="field"><span>Was würdest du einem guten Freund sagen, der genau das denkt?</span>
        <textarea rows="3" maxlength="500" placeholder="Hey, ein Tag ist kein Weltuntergang…" data-input="tcField" data-field="friend">${esc(tc.friend)}</textarea></label>`;
  } else if (tc.step === 4) {
    body = `
      <label class="field"><span>Wie klingt ein fairerer Gedanke?</span>
        <textarea rows="3" maxlength="500" placeholder="z. B. Ich hab einen Tag verpasst. Das ist normal, und heute mach ich die Mini-Version." data-input="tcField" data-field="balanced">${esc(tc.balanced)}</textarea></label>
      <label class="slider-field"><span>Wie sehr glaubst du den alten Gedanken jetzt noch? <b class="out">${tc.after} %</b></span>
        <input type="range" class="range range-pink" min="0" max="100" step="10" value="${tc.after}" data-input="tcRange" data-field="after"></label>`;
  } else {
    const drop = tc.before - tc.after;
    body = `
      <div class="dialog-art">${pix(SPARKLE, 'sparkle-big')}</div>
      <p class="center win-heading">${drop > 0 ? `Von ${tc.before} % auf ${tc.after} %` : 'Gut, dass du hingeschaut hast'}</p>
      ${tc.balanced ? `<div class="bubble"><p>${esc(tc.balanced)}</p></div>` : ''}
      <p class="hint center">${drop > 0 ? 'Der Gedanke hat an Macht verloren. Genau so funktioniert das.' : 'Manche Gedanken brauchen mehrere Anläufe. Das ist normal.'} Gespeichert unter SOS.</p>
      <a class="btn btn-ok btn-block" href="#/sos" data-act="tcFinish">Fertig</a>`;
  }

  const nav = tc.step <= steps ? `
    <div class="form-buttons">
      ${tc.step > 1 ? '<button class="btn" data-act="tcStep" data-dir="-1">Zurück</button>' : ''}
      <button class="btn btn-ok" data-act="${tc.step === steps ? 'tcSave' : 'tcStep'}" data-dir="1">${tc.step === steps ? 'Fertig' : 'Weiter'}</button>
    </div>` : '';

  const html = `
    ${backBtn('#/sos')}
    <header class="page-head"><div><h1>Gedanken-Check</h1><span class="pill">${tc.step <= steps ? `Schritt ${tc.step} von ${steps}` : 'Geschafft'}</span></div></header>
    ${win({ title: 'gedanken-check.exe', color: 'yellow', body: `<div class="form">${body}${nav}</div>` })}
    <p class="hint">Eine Technik aus der kognitiven Verhaltenstherapie: Gedanken nicht wegdrücken, sondern fair prüfen.</p>`;
  return { html, mount: (root) => root.querySelectorAll('.range').forEach(paint) };
}

// --- Grübel-Parkplatz ----------------------------------------------------------

export function parkView() {
  const open = state.parked.filter((p) => !p.done);
  const done = state.parked.length - open.length;
  return `
    ${backBtn('#/sos')}
    <header class="page-head"><div><h1>Grübel-Parkplatz</h1><span class="pill">Später ist auch okay</span></div></header>
    ${win({
      title: 'parkplatz.exe', color: 'blue',
      body: `<form class="form" data-submit="parkAdd">
          <label class="field"><span>Was geht dir im Kopf rum?</span>
            <textarea name="text" rows="3" maxlength="500" required placeholder="Schreib's kurz auf, dann darf es warten."></textarea></label>
          <button type="submit" class="btn btn-ok btn-block">Parken</button>
        </form>
        <label class="switch-row" style="margin-top:14px"><span>${icon('clock')} Deine Grübelzeit</span>
          <input type="time" class="time-input" value="${state.settings.worryTime}" data-change="setWorryTime"></label>
        <p class="hint">Ab dieser Uhrzeit erscheinen deine geparkten Gedanken auf „Heute“. Grübeln auf eine feste Zeit zu verschieben, verringert es nachweislich (Borkovec et al. 1983; McGowan & Behar 2013).</p>`,
    })}
    ${open.length ? win({ title: 'geparkt.txt', color: 'teal', body: `<p class="win-heading">Geparkt <span class="count">${open.length}</span></p>${parkedList(open)}` }) : ''}
    ${done ? `<p class="hint center">${done} Gedanke${done === 1 ? '' : 'n'} schon losgelassen.</p>` : ''}
  `;
}

// --- Aktionen -------------------------------------------------------------

function paint(el) {
  el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
}

export const actions = {
  goTo: (el) => go(el.dataset.to),
  factsCat(el) { browse = { cat: el.dataset.cat, i: 0 }; render(); },
  factMove(el) {
    const n = browseList().length;
    if (n) browse.i = (browse.i + Number(el.dataset.dir) + n) % n;
    render();
  },
  factRandom() {
    const n = browseList().length;
    if (n > 1) { let j; do { j = Math.floor(Math.random() * n); } while (j === browse.i); browse.i = j; }
    render();
  },
  factFav() {
    const list = browseList();
    const f = list[Math.min(browse.i, list.length - 1)];
    update((s) => {
      const set = new Set(s.settings.favFacts || []);
      if (set.has(f.text)) set.delete(f.text); else set.add(f.text);
      s.settings.favFacts = [...set];
    });
    if (browse.cat === 'fav' && browse.i >= browseList().length) browse.i = Math.max(0, browseList().length - 1);
    render();
  },
  nextFact(el) {
    const c = el.dataset.cat;
    factOffset[c] = (factOffset[c] || 0) + 1;
    render();
  },
  pickFeeling(el) {
    feeling = feeling === el.dataset.key ? null : el.dataset.key;
    render();
  },
  scrollTo(el) {
    document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  startBreath: () => runBreath(),

  tcField(el) { tc[el.dataset.field] = el.value; },
  tcRange(el) {
    tc[el.dataset.field] = Number(el.value);
    el.closest('.slider-field').querySelector('.out').textContent = `${el.value} %`;
    paint(el);
  },
  tcTrap(el) { tc.trap = el.dataset.trap; render(); },
  tcStep(el) {
    const dir = Number(el.dataset.dir);
    if (dir > 0 && tc.step === 1 && !tc.thought.trim()) { toast('Schreib den Gedanken kurz auf'); return; }
    tc.step += dir;
    render();
    window.scrollTo(0, 0);
  },
  tcSave(el) {
    update((s) => {
      s.thoughts.push({ date: today(), thought: tc.thought.trim(), before: tc.before, trap: tc.trap, friend: tc.friend.trim(), balanced: tc.balanced.trim(), after: tc.after });
    });
    tc.step = 5;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top);
    if (state.settings.sound) blip('big');
    render();
    window.scrollTo(0, 0);
  },
  tcFinish() { tc = freshCheck(); go('#/sos'); },

  parkAdd(form) {
    const text = new FormData(form).get('text').trim();
    if (!text) return;
    update((s) => { s.parked.push({ id: uid(), text, createdAt: today(), done: false }); });
    toast(`Geparkt bis ${state.settings.worryTime} Uhr`);
    render();
  },
  parkDone(el) {
    update((s) => { s.parked.find((p) => p.id === el.dataset.id).done = true; });
    toast('Losgelassen');
    render();
  },
  parkCheck(el) {
    const p = state.parked.find((x) => x.id === el.dataset.id);
    update(() => { p.done = true; });
    tc = { ...freshCheck(), thought: p.text };
    go('#/sos/thought');
  },
  setWorryTime(el) {
    if (el.value) update((s) => { s.settings.worryTime = el.value; });
  },
};

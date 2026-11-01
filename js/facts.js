// Psychologische Fakten für bestimmte Momente – bewusst keine Motivationssprüche:
// Positive Selbstaussagen können Menschen in schlechter Verfassung eher runterziehen
// (Wood, Perunovic & Lee 2009). Fakten und Selbstmitgefühl wirken verlässlicher.

export const FACTS = {
  missed: [
    { text: 'Ein verpasster Tag hatte in der Studie keinen messbaren Einfluss darauf, ob eine Gewohnheit entsteht. Entscheidend ist, was du heute machst.', source: 'Lally et al. 2010' },
    { text: 'Bis etwas automatisch läuft, dauert es im Schnitt 66 Tage, bei manchen 18, bei anderen über 200. Perfekt muss es auf dem Weg nicht sein.', source: 'Lally et al. 2010' },
    { text: 'Nach einem kleinen Ausrutscher denken viele „Jetzt ist eh alles egal“ und hören ganz auf. Der Effekt ist gut erforscht. Wer ihn kennt, fällt seltener darauf rein.', source: 'Marlatt & Gordon 1985' },
  ],
  setback: [
    { text: 'Wer nach einem Fehler freundlich zu sich ist statt hart, strengt sich danach mehr an, nicht weniger.', source: 'Breines & Chen 2012' },
    { text: 'Selbstmitgefühl hängt deutlich mit weniger Angst, Stress und Niedergeschlagenheit zusammen. Freundlich zu sich sein ist keine Schwäche.', source: 'MacBeth & Gumley 2012' },
    { text: 'Rückfälle sind bei Verhaltensänderung der Normalfall. Die meisten, die es dauerhaft schaffen, haben mehrere Anläufe gebraucht.', source: 'Prochaska et al. 1992' },
    { text: 'Menschen starten leichter neu, wenn sie einen Moment bewusst als Neuanfang sehen. Heute kann so ein Moment sein.', source: 'Dai, Milkman & Riis 2014' },
  ],
  badMood: [
    { text: 'Dein Gehirn gewichtet Negatives stärker als Positives. Das ist ein altes Schutzprogramm, kein Beweis, dass alles schlecht ist.', source: 'Baumeister et al. 2001' },
    { text: 'Ein Gefühl in Worte zu fassen („Ich bin gerade traurig“) dämpft es messbar. Benennen ist schon ein Schritt.', source: 'Lieberman et al. 2007' },
    { text: 'Grübeln fühlt sich an wie Problemlösen, ist es aber meistens nicht. Eine kleine Handlung hilft oft mehr als noch eine Runde Nachdenken.', source: 'Nolen-Hoeksema et al. 2008' },
    { text: 'Gedanken sind keine Fakten. „Ich krieg nichts hin“ ist ein Gedanke, kein Messergebnis.', source: 'Kognitive Verhaltenstherapie' },
    { text: 'Andere bemerken unsere Fehler und Peinlichkeiten viel seltener, als wir glauben.', source: 'Gilovich et al. 2000' },
    { text: 'Schon ein kurzer Spaziergang hebt bei vielen Menschen die Stimmung, oft nach wenigen Minuten.', source: 'Studien zu Bewegung & Stimmung' },
    { text: 'Nach einer Nacht ohne Schlaf reagierte das Angstzentrum im Gehirn rund 60 % stärker auf Negatives. Nach wenig Schlaf wirkt alles schlimmer, als es ist.', source: 'Yoo et al. 2007' },
    { text: 'Gefühle kommen und gehen. Manche verfliegen in Minuten, Traurigkeit hält am längsten an. Aber auch sie geht vorbei.', source: 'Verduyn & Lavrijsen 2015' },
  ],
  mini: [
    { text: 'Motivation kommt oft erst nach dem Anfangen, nicht davor. Darum reicht heute der kleinste Schritt.', source: 'Verhaltensaktivierung' },
    { text: 'Eine Mini-Version hält die Gewohnheit am Leben, bis wieder mehr geht. Das zählt mehr als ein perfekter Tag.', source: 'Fogg, Tiny Habits' },
  ],
  general: [
    { text: 'Ein Wenn-dann-Plan („Nach dem Kaffee lese ich“) gehört zu den am besten belegten Tricks, um Vorsätze umzusetzen.', source: 'Gollwitzer & Sheeran 2006' },
    { text: 'Wer seinen Fortschritt festhält, erreicht Ziele deutlich häufiger. Jeder Haken hier zählt also doppelt.', source: 'Harkin et al. 2016' },
    { text: 'Gute Beziehungen zu anderen Menschen gehören zu den stärksten Faktoren für Gesundheit und ein langes Leben.', source: 'Holt-Lunstad et al. 2010' },
    { text: 'Ein regelmäßiger Schlafrhythmus ist teils wichtiger als die Schlafdauer.', source: 'Windred et al. 2024' },
    { text: 'Ein Gefühl in Worte zu fassen dämpft es messbar. Darum lohnt sich der tägliche Check-in.', source: 'Lieberman et al. 2007' },
    { text: 'Rund 40 % von dem, was wir täglich tun, sind Gewohnheiten, nicht bewusste Entscheidungen. Darum lohnt es sich so, gute aufzubauen.', source: 'Wood, Quinn & Kashy 2002' },
    { text: 'Menschen, die pro Woche mindestens 2 Stunden in der Natur verbringen, berichten deutlich häufiger von guter Gesundheit und Wohlbefinden.', source: 'White et al. 2019' },
    { text: 'Kurze Gespräche mit Fremden machen glücklicher, als die meisten erwarten. Wir unterschätzen, wie gern andere mit uns reden.', source: 'Epley & Schroeder 2014' },
  ],
};

// Sprüche nur zum selbst Durchblättern, nicht automatisch an schlechten Tagen.
// Bewusst bodenständig statt „Du bist großartig!“, und Zitate nur mit gesicherter Herkunft.
export const QUOTES = {
  start: [
    { text: 'Du musst heute nicht alles schaffen. Nur den nächsten kleinen Schritt.' },
    { text: 'Anfangen ist der schwerste Teil. Darum darf er winzig sein.' },
    { text: 'Erst kommt die Handlung, dann die Motivation. Nicht umgekehrt.' },
    { text: 'Was du heute tust, muss nicht beeindruckend sein. Nur echt.' },
    { text: 'Langsam ist auch eine Geschwindigkeit.' },
    { text: 'Fortschritt sieht von nahem oft aus wie Stillstand. Von weitem sieht man ihn.' },
    { text: 'Ein Versprechen an dich selbst zählt genauso wie eins an andere. Fang mit einem kleinen an.' },
  ],
  hard: [
    { text: 'Ein schlechter Tag ist ein schlechter Tag. Kein schlechtes Leben.' },
    { text: 'Mini zählt. Immer.' },
    { text: 'Nicht perfekt. Aber dabei.' },
    { text: 'Du hast bisher jeden schweren Tag überstanden. Jeden einzelnen.' },
    { text: 'Hinfallen gehört dazu. Wie schnell du wieder aufstehst, ist egal. Hauptsache, du tust es.' },
    { text: 'Heute reicht es, wenn du es versuchst.' },
    { text: 'Sei für dich der Freund, den du gerade brauchst.' },
    { text: 'Du bist nicht hinterher. Du bist da, wo du gerade bist, und von hier geht es weiter.' },
  ],
  wisdom: [
    { text: 'Eine Reise von tausend Meilen beginnt mit einem einzigen Schritt.', source: 'Laozi, Tao Te King' },
    { text: 'Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.', source: 'Seneca, Briefe an Lucilius' },
    { text: 'Wir leiden öfter in der Vorstellung als in der Wirklichkeit.', source: 'Seneca, Briefe an Lucilius' },
    { text: 'Nicht die Dinge selbst beunruhigen die Menschen, sondern ihre Meinungen über die Dinge.', source: 'Epiktet, Handbüchlein der Moral' },
    { text: 'Was der Handlung im Weg steht, treibt die Handlung voran. Was im Weg steht, wird zum Weg.', source: 'Mark Aurel, Selbstbetrachtungen' },
    { text: 'Es ist nicht genug, zu wissen, man muss auch anwenden; es ist nicht genug, zu wollen, man muss auch tun.', source: 'Goethe, Wilhelm Meisters Wanderjahre' },
    { text: 'Das Leben kann nur rückwärts verstanden werden, aber es muss vorwärts gelebt werden.', source: 'Kierkegaard, Tagebücher' },
    { text: 'Hat man sein Warum des Lebens, so verträgt man sich fast mit jedem Wie.', source: 'Nietzsche, Götzen-Dämmerung' },
  ],
};

export const QUOTE_CATEGORIES = {
  start: 'Zum Anfangen',
  hard: 'Für harte Tage',
  wisdom: 'Weisheiten',
};

export const CATEGORIES = {
  missed: 'Verpasster Tag',
  setback: 'Rückschläge',
  badMood: 'Schlechte Stimmung',
  mini: 'Harte Tage',
  general: 'Gewohnheiten & Leben',
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Pro Tag und Kategorie stabil, mit „Noch einer“ weiterblättern
export function pickFact(category, day, offset = 0) {
  const list = FACTS[category];
  return list[(hash(day + category) + offset) % list.length];
}

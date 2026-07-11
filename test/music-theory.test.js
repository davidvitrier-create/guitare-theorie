const test = require("node:test");
const assert = require("node:assert/strict");
const mt = require("../js/music-theory.js");

test("LETTERS et SOLFEGE couvrent les 7 notes naturelles", () => {
  assert.deepEqual(mt.LETTERS, ["C", "D", "E", "F", "G", "A", "B"]);
  mt.LETTERS.forEach((l) => assert.ok(mt.SOLFEGE[l], "SOLFEGE manque " + l));
});

test("CHROMATIC contient les 12 demi-tons dans l'ordre", () => {
  assert.equal(mt.CHROMATIC.length, 12);
  const sharps = mt.CHROMATIC.filter((n) => n.accidental === "#").length;
  const naturals = mt.CHROMATIC.filter((n) => n.accidental === "").length;
  assert.equal(sharps, 5);
  assert.equal(naturals, 7);
});

test("absToNote retrouve la bonne note pour chaque demi-ton et la bonne octave", () => {
  assert.deepEqual(mt.absToNote(0), { letter: "C", accidental: "", octave: 0 });
  assert.deepEqual(mt.absToNote(1), { letter: "C", accidental: "#", octave: 0 });
  assert.deepEqual(mt.absToNote(11), { letter: "B", accidental: "", octave: 0 });
  assert.deepEqual(mt.absToNote(12), { letter: "C", accidental: "", octave: 1 });
  assert.deepEqual(mt.absToNote(40), { letter: "E", accidental: "", octave: 3 });
});

test("fretboardNotesAll couvre les 6 cordes x 13 cases sans trou chromatique", () => {
  assert.equal(mt.fretboardNotesAll.length, 78);
  const openLowE = mt.fretboardNotesAll.find((n) => n.stringIndex === 0 && n.fret === 0);
  assert.deepEqual(openLowE, { stringIndex: 0, fret: 0, letter: "E", accidental: "", octave: 3 });
  const octaveUp = mt.fretboardNotesAll.find((n) => n.stringIndex === 0 && n.fret === 12);
  assert.equal(octaveUp.letter, "E");
  assert.equal(octaveUp.octave, openLowE.octave + 1);
});

test("intervalDetails calcule correctement les intervalles usuels", () => {
  assert.equal(mt.intervalDetails("C", 4, "E", 4).label, "tierce majeure");
  assert.equal(mt.intervalDetails("C", 4, "G", 4).label, "quinte juste");
  assert.equal(mt.intervalDetails("C", 4, "C", 5).label, "octave juste");
  assert.equal(mt.intervalDetails("C", 4, "D", 4).label, "seconde majeure");
});

test("intervalDetails gere les cas diminues/augmentes (triton naturel)", () => {
  assert.equal(mt.intervalDetails("B", 4, "F", 5).label, "quinte diminuee");
  assert.equal(mt.intervalDetails("F", 4, "B", 4).label, "quarte augmentee");
});

test("enharmonicOf donne l'equivalent bemol des 5 notes dieses", () => {
  assert.deepEqual(mt.enharmonicOf({ letter: "C", accidental: "#", octave: 4 }), { letter: "D", accidental: "b", octave: 4 });
  assert.deepEqual(mt.enharmonicOf({ letter: "G", accidental: "#", octave: 3 }), { letter: "A", accidental: "b", octave: 3 });
});

test("enharmonicOf retourne null pour une note naturelle", () => {
  assert.equal(mt.enharmonicOf({ letter: "C", accidental: "", octave: 4 }), null);
});

test("fretMarkerDots signale les cases 3/5/7/9 (1 point) et 12 (2 points)", () => {
  [3, 5, 7, 9].forEach((f) => assert.equal(mt.fretMarkerDots(f), 1));
  assert.equal(mt.fretMarkerDots(12), 2);
  assert.equal(mt.fretMarkerDots(1), 0);
});

test("shuffle et buildQueueOfLength preservent le contenu et la longueur demandee", () => {
  const pool = [1, 2, 3];
  const shuffled = mt.shuffle(pool.slice());
  assert.deepEqual([...shuffled].sort(), [1, 2, 3]);
  const queue = mt.buildQueueOfLength(pool, 7);
  assert.equal(queue.length, 7);
  queue.forEach((n) => assert.ok(pool.includes(n)));
});

test("staffSVG sans options reproduit le format historique (module Intervalles)", () => {
  const svg = mt.staffSVG([{ letter: "C", octave: 4, x: 80 }, { letter: "E", octave: 4, x: 140 }]);
  assert.ok(svg.startsWith('<svg viewBox="0 0 220 80" width="220" style="max-width:100%;">'));
  assert.ok(!svg.includes("height=\"80\""), "ne doit pas ajouter d'attribut height sans heightAttr:true");
  assert.ok(svg.includes('fill="#2c2c2a"'), "couleur charcoal par defaut");
});

test("staffSVG avec options reproduit le format historique (sequence du module Notes)", () => {
  const svg = mt.staffSVG(
    [{ letter: "F", octave: 4, accidental: "#", x: 70, color: "#3b6d11" }],
    { width: 165, heightAttr: true, style: "display:block;", top: -30, height: 170, ledgerColor: "#8a8880", stems: true, markIndex: 0 }
  );
  assert.ok(svg.startsWith('<svg viewBox="0 -30 165 170" width="165" height="170" style="display:block;">'));
  assert.ok(svg.includes("♯"), "glyphe diese affiche");
  assert.ok(svg.includes("polygon"), "marqueur de question courante affiche");
  assert.ok(svg.includes('fill="#3b6d11"'), "couleur de statut appliquee");
});

test("tabSVG n'affiche que les cases jouees", () => {
  // frettes hors 1-6 pour ne pas collisionner avec les libelles de corde (1 a 6)
  const svg = mt.tabSVG([
    { stringIndex: 0, fret: 9, shown: true, color: "#3b6d11" },
    { stringIndex: 1, fret: 10, shown: false },
  ]);
  assert.ok(svg.includes(">9<"));
  assert.ok(!svg.includes(">10<"));
});

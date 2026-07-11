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

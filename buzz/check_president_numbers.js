#!/usr/bin/env node
// Checks the presidential-number categories against the official 1-47 order
// and against Buzz Board's answer matcher.
// Canonical order: U.S. Government Publishing Office presidency guide (as of June 2026)
// and the White House (Cleveland 22 and 24, Trump 45 and 47, Biden 46).
"use strict";
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const start = html.indexOf("// Lenient answer checking");
const s = html.lastIndexOf("<script>", start);
const e = html.indexOf("</script>", start);
const tmp = path.join(require("os").tmpdir(), "bb_match_pres.js");
fs.writeFileSync(tmp, html.slice(s + "<script>".length, e));
const { isRight } = require(tmp);
const bank = JSON.parse(fs.readFileSync(path.join(dir, "clues.json"), "utf8"));

const ORDER = [
  [1, "George Washington"],
  [2, "John Adams"],
  [3, "Thomas Jefferson"],
  [4, "James Madison"],
  [5, "James Monroe"],
  [6, "John Quincy Adams"],
  [7, "Andrew Jackson"],
  [8, "Martin Van Buren"],
  [9, "William Henry Harrison"],
  [10, "John Tyler"],
  [11, "James K. Polk"],
  [12, "Zachary Taylor"],
  [13, "Millard Fillmore"],
  [14, "Franklin Pierce"],
  [15, "James Buchanan"],
  [16, "Abraham Lincoln"],
  [17, "Andrew Johnson"],
  [18, "Ulysses S. Grant"],
  [19, "Rutherford B. Hayes"],
  [20, "James A. Garfield"],
  [21, "Chester A. Arthur"],
  [22, "Grover Cleveland"],
  [23, "Benjamin Harrison"],
  [24, "Grover Cleveland"],
  [25, "William McKinley"],
  [26, "Theodore Roosevelt"],
  [27, "William Howard Taft"],
  [28, "Woodrow Wilson"],
  [29, "Warren G. Harding"],
  [30, "Calvin Coolidge"],
  [31, "Herbert Hoover"],
  [32, "Franklin D. Roosevelt"],
  [33, "Harry S. Truman"],
  [34, "Dwight D. Eisenhower"],
  [35, "John F. Kennedy"],
  [36, "Lyndon B. Johnson"],
  [37, "Richard Nixon"],
  [38, "Gerald Ford"],
  [39, "Jimmy Carter"],
  [40, "Ronald Reagan"],
  [41, "George H. W. Bush"],
  [42, "Bill Clinton"],
  [43, "George W. Bush"],
  [44, "Barack Obama"],
  [45, "Donald Trump"],
  [46, "Joe Biden"],
  [47, "Donald Trump"],
];
const BY_NUM = new Map(ORDER.map(([n, name]) => [n, name]));
const NUMS_OF = new Map();
for (const [n, name] of ORDER) {
  if (!NUMS_OF.has(name)) NUMS_OF.set(name, []);
  NUMS_OF.get(name).push(n);
}
const NAMES = [...NUMS_OF.keys()].sort((a, b) => b.length - a.length);
const ALIAS = { "Harry Truman": "Harry S. Truman", "Harry S Truman": "Harry S. Truman" };

// Forms a correct player might say, and forms that must be rejected for this person.
const YES = {
  "George Washington": ["George Washington", "Washington"],
  "John Adams": ["John Adams"],
  "Thomas Jefferson": ["Thomas Jefferson", "Jefferson"],
  "James Madison": ["James Madison", "Madison"],
  "James Monroe": ["James Monroe", "Monroe"],
  "John Quincy Adams": ["John Quincy Adams", "Quincy Adams", "JQA"],
  "Andrew Jackson": ["Andrew Jackson", "Jackson", "Andy Jackson"],
  "Martin Van Buren": ["Martin Van Buren", "Van Buren"],
  "William Henry Harrison": ["William Henry Harrison", "William Harrison", "William H. Harrison"],
  "John Tyler": ["John Tyler", "Tyler"],
  "James K. Polk": ["James K. Polk", "James Polk", "Polk"],
  "Zachary Taylor": ["Zachary Taylor", "Taylor"],
  "Millard Fillmore": ["Millard Fillmore", "Fillmore"],
  "Franklin Pierce": ["Franklin Pierce", "Pierce"],
  "James Buchanan": ["James Buchanan", "Buchanan"],
  "Abraham Lincoln": ["Abraham Lincoln", "Lincoln", "Abe Lincoln"],
  "Andrew Johnson": ["Andrew Johnson"],
  "Ulysses S. Grant": ["Ulysses S. Grant", "Ulysses Grant", "Grant"],
  "Rutherford B. Hayes": ["Rutherford B. Hayes", "Rutherford Hayes", "Hayes"],
  "James A. Garfield": ["James A. Garfield", "James Garfield", "Garfield"],
  "Chester A. Arthur": ["Chester A. Arthur", "Chester Arthur", "Arthur"],
  "Grover Cleveland": ["Grover Cleveland", "Cleveland"],
  "Benjamin Harrison": ["Benjamin Harrison", "Ben Harrison"],
  "William McKinley": ["William McKinley", "McKinley"],
  "Theodore Roosevelt": ["Theodore Roosevelt", "Teddy Roosevelt", "Teddy", "TR"],
  "William Howard Taft": ["William Howard Taft", "William Taft", "Taft"],
  "Woodrow Wilson": ["Woodrow Wilson", "Wilson"],
  "Warren G. Harding": ["Warren G. Harding", "Warren Harding", "Harding"],
  "Calvin Coolidge": ["Calvin Coolidge", "Coolidge"],
  "Herbert Hoover": ["Herbert Hoover", "Hoover"],
  "Franklin D. Roosevelt": ["Franklin D. Roosevelt", "Franklin Roosevelt", "Franklin Delano Roosevelt", "FDR"],
  "Harry S. Truman": ["Harry S. Truman", "Harry Truman", "Truman"],
  "Dwight D. Eisenhower": ["Dwight D. Eisenhower", "Dwight Eisenhower", "Eisenhower", "Ike"],
  "John F. Kennedy": ["John F. Kennedy", "John Kennedy", "Kennedy", "JFK", "Jack Kennedy"],
  "Lyndon B. Johnson": ["Lyndon B. Johnson", "Lyndon Johnson", "LBJ", "Lyndon Baines Johnson"],
  "Richard Nixon": ["Richard Nixon", "Nixon"],
  "Gerald Ford": ["Gerald Ford", "Ford"],
  "Jimmy Carter": ["Jimmy Carter", "Jimmy Carter", "James Carter", "Carter"],
  "Ronald Reagan": ["Ronald Reagan", "Reagan"],
  "George H. W. Bush": ["George H. W. Bush", "George Herbert Walker Bush"],
  "Bill Clinton": ["Bill Clinton", "Clinton"],
  "George W. Bush": ["George W. Bush", "George Walker Bush"],
  "Barack Obama": ["Barack Obama", "Barack Hussein Obama", "Obama"],
  "Donald Trump": ["Donald Trump", "Donald J. Trump", "Trump"],
  "Joe Biden": ["Joe Biden", "Joseph Biden", "Joseph R. Biden", "Joseph R. Biden Jr.", "Biden"],
};
// Bare last names that must not be accepted, because two presidents share them.
const BARE_NO = ["Adams", "Harrison", "Johnson", "Roosevelt", "Bush"];
const NO_ALWAYS = ["John Adams", "Adams", "John Quincy Adams", "Harrison", "William Henry Harrison", "William Harrison", "Benjamin Harrison", "Ben Harrison", "Andrew Johnson", "Johnson", "Lyndon Johnson", "Lyndon B. Johnson", "Roosevelt", "Theodore Roosevelt", "Teddy Roosevelt", "Franklin Roosevelt", "Franklin D. Roosevelt", "George Bush", "Bush", "George W. Bush", "George H. W. Bush", "Andrew Jackson"];

const fails = [];
const fail = (m) => fails.push(m);
function suf(n) {
  if ([11, 12, 13].includes(n % 100)) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
}
const WORD = {
  1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth",
  11: "eleventh", 12: "twelfth", 13: "thirteenth", 14: "fourteenth", 15: "fifteenth", 16: "sixteenth", 17: "seventeenth", 18: "eighteenth", 19: "nineteenth",
  20: "twentieth", 21: "twenty-first", 22: "twenty-second", 23: "twenty-third", 24: "twenty-fourth", 25: "twenty-fifth",
  26: "twenty-sixth", 27: "twenty-seventh", 28: "twenty-eighth", 29: "twenty-ninth", 30: "thirtieth",
  31: "thirty-first", 32: "thirty-second", 33: "thirty-third", 34: "thirty-fourth", 35: "thirty-fifth",
  36: "thirty-sixth", 37: "thirty-seventh", 38: "thirty-eighth", 39: "thirty-ninth", 40: "fortieth",
  41: "forty-first", 42: "forty-second", 43: "forty-third", 44: "forty-fourth", 45: "forty-fifth", 46: "forty-sixth", 47: "forty-seventh",
};
function formsOf(n) {
  return [`${n}${suf(n)}`, String(n), WORD[n], WORD[n].replace("-", " "), `the ${n}${suf(n)}`, `number ${n}`];
}
function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

if (ORDER.length !== 47) fail("canonical list is not 47 long");
if (new Set(ORDER.map(([n]) => n)).size !== 47) fail("canonical numbers are not 1-47 unique");
for (let i = 1; i <= 47; i++) if (BY_NUM.get(i) == null) fail("missing number " + i);
if (BY_NUM.get(22) !== "Grover Cleveland" || BY_NUM.get(24) !== "Grover Cleveland") fail("Cleveland is not 22 and 24");
if (BY_NUM.get(45) !== "Donald Trump" || BY_NUM.get(47) !== "Donald Trump") fail("Trump is not 45 and 47");
if (BY_NUM.get(46) !== "Joe Biden") fail("Biden is not 46");
if (NUMS_OF.get("Grover Cleveland").join(",") !== "22,24") fail("Cleveland numbers");
if (NUMS_OF.get("Donald Trump").join(",") !== "45,47") fail("Trump numbers");
const uniquePeople = new Set(ORDER.map(([, name]) => name));
if (uniquePeople.size !== 45) fail("expected 45 different people, got " + uniquePeople.size);

const pres = { r1: bank.r1.filter((c) => c.tag === "pres"), r2: bank.r2.filter((c) => c.tag === "pres") };
const finals = bank.final.filter((f) => ["xf-0220", "xf-0221", "xf-0222"].includes(f.id));
if (pres.r1.length < 4 || pres.r1.length > 6) fail("round 1 pres count " + pres.r1.length);
if (pres.r2.length < 4 || pres.r2.length > 6) fail("round 2 pres count " + pres.r2.length);
if (finals.length !== 3) fail("final count " + finals.length);

const seenText = new Map();
for (const round of ["r1", "r2"]) {
  for (const c of bank[round]) for (const q of c.clues) seenText.set(norm(q[0]), `${round} ${c.name}`);
}
for (const f of bank.final) seenText.set(norm(f.clue), "final " + f.cat);

const names = new Set();
function checkNameAnswer(label, person, answer, alts) {
  for (const y of YES[person]) {
    if (!isRight(y, answer, alts)) fail(`${label}: missed "${y}" for ${person} (answer ${answer} / ${alts})`);
  }
  for (const [other, forms] of Object.entries(YES)) {
    if (other === person) continue;
    for (const form of forms) {
      if (YES[person].includes(form)) continue;
      if (isRight(form, answer, alts)) fail(`${label}: "${form}" (${other}) matched ${person}`);
    }
  }
  const last = person.split(" ").slice(-1)[0];
  if (BARE_NO.includes(last)) {
    if (isRight(last, answer, alts)) fail(`${label}: bare "${last}" matched ${person}`);
  }
}
function checkNumberAnswer(label, n, answer, alts) {
  for (const f of formsOf(n)) if (!isRight(f, answer, alts)) fail(`${label}: missed number form "${f}" for ${n} (answer ${answer} / ${alts})`);
  for (let m = 1; m <= 47; m++) if (m !== n) {
    for (const f of formsOf(m)) if (isRight(f, answer, alts)) fail(`${label}: wrong number "${f}" matched ${n}`);
  }
}

const report = [];
for (const round of ["r1", "r2"]) {
  report.push(round.toUpperCase());
  for (const c of pres[round]) {
    if (names.has(c.name)) fail("duplicate category name " + c.name);
    names.add(c.name);
    if (!/^xr[12]-g\d+$/.test(c.id)) fail("bad id " + c.id);
    if (c.clues.length !== 5) fail(c.name + " does not have 5 clues");
    const diffs = c.clues.map((q) => q[3]);
    if (diffs.join(",") !== "1,2,3,4,5") fail(c.name + " difficulties " + diffs.join(","));
    report.push("  " + c.name);
    const peopleHere = new Set();
    c.clues.forEach((q, i) => {
      const [text, answer, alts, d, au, ms] = q;
      const label = `${c.name} d${d}`;
      if (au) fail(label + " has an audio id");
      if (/[—–]/.test(text) || /jeopardy/i.test(text)) fail(label + " has an em dash or the show name");
      if (text.length > 110) fail(label + " clue is very long (" + text.length + ")");
      const key = norm(text);
      const owners = [];
      for (const rr of ["r1", "r2"]) for (const cat of bank[rr]) for (const qq of cat.clues) {
        if (norm(qq[0]) === key) owners.push(cat.id);
      }
      if (owners.length !== 1) fail(label + " duplicate clue text: " + text);
      const who = text.match(/the (\d+)(st|nd|rd|th) president/i);
      const num = text.match(/^(.+?) was this number president/i);
      if (num) {
        const spoken = ALIAS[num[1]] || num[1];
        const named = NAMES.find((name) => spoken === name || spoken.endsWith(name));
        if (!named) fail(label + " could not place " + num[1]);
        else {
          const nums = NUMS_OF.get(named);
          if (nums.length !== 1) fail(label + " " + named + " has more than one number");
          else {
            checkNumberAnswer(label, nums[0], answer, alts);
            peopleHere.add(named);
            report.push(`    ${d}. ${named} -> ${nums[0]}`);
          }
        }
      } else if (who && !/this many different people/.test(text)) {
        const n = Number(who[1]);
        const person = BY_NUM.get(n);
        if (!person) fail(label + " bad number " + n);
        else {
          checkNameAnswer(label, person, answer, alts);
          peopleHere.add(person + "#" + n);
          report.push(`    ${d}. ${n} -> ${person}`);
        }
      } else if (/this many different people/.test(text)) {
        for (const f of ["45", "forty-five", "forty five", "number 45"]) {
          if (!isRight(f, answer, alts)) fail(label + " missed count form " + f);
        }
        for (const f of ["45th", "forty-fifth", "forty fifth", "47", "46", "44", "forty-seven", "the 45th"]) {
          if (isRight(f, answer, alts)) fail(label + " count clue accepted " + f);
        }
        report.push("    " + d + ". different people -> 45");
      } else fail(label + " unrecognized clue shape: " + text);
      if (d !== i + 1) fail(label + " out of order");
    });
  }
}

const finalExpect = {
  "xf-0220": { person: "Grover Cleveland", kind: "name" },
  "xf-0221": { person: "Benjamin Harrison", kind: "name" },
  "xf-0222": { n: 47, kind: "num" },
};
report.push("FINALS");
for (const f of finals) {
  if (f.tag === "ring") fail(f.id + " is tagged ring");
  if (f.au) fail(f.id + " has audio");
  if (/[—–]/.test(f.clue) || /jeopardy/i.test(f.clue)) fail(f.id + " bad text");
  const exp = finalExpect[f.id];
  if (exp.kind === "name") checkNameAnswer(f.id, exp.person, f.a, f.alt);
  else checkNumberAnswer(f.id, exp.n, f.a, f.alt);
  report.push(`  ${f.cat}: ${f.clue}`);
  report.push(`    -> ${f.a}`);
}

// Existing clues still match themselves, and compound ordinals do not collapse.
let selfMiss = 0;
for (const round of ["r1", "r2"]) for (const c of bank[round]) for (const q of c.clues) {
  if (!isRight(q[1], q[1], q[2])) { selfMiss++; fail(`existing self-match failed: ${q[1]}`); }
  for (const alt of String(q[2] || "").split("|").filter(Boolean)) {
    if (!isRight(alt, q[1], q[2])) { selfMiss++; fail(`existing alt failed: ${alt} for ${q[1]}`); }
  }
}
for (const f of bank.final) {
  if (!isRight(f.a, f.a, f.alt)) fail("final self-match " + f.a);
  for (const alt of String(f.alt || "").split("|").filter(Boolean)) if (!isRight(alt, f.a, f.alt)) fail("final alt " + alt + " for " + f.a);
}
if (isRight("twenty-first", "first", "")) fail("twenty-first matched first");
if (isRight("forty-fourth", "fourth", "")) fail("forty-fourth matched fourth");
if (!isRight("seventh inning", "seventh inning", "7th|seventh inning stretch|seventh")) fail("seventh inning regression");
if (!isRight("July Fourth", "July 4", "July Fourth|Fourth of July")) fail("July Fourth regression");
if (isRight("twenty-second", "second", "")) fail("twenty-second matched second");

// Deal simulation, same shape as index.html.
function drawFrom(pool, n, used, avoid, rnd) {
  let open = pool.filter((c) => !used.has(c.id) && !avoid.has(c.id));
  if (open.length < n) { for (const c of pool) used.delete(c.id); open = pool.filter((c) => !avoid.has(c.id)); }
  const arr = open.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  const out = arr.slice(0, n);
  for (const c of out) { used.add(c.id); avoid.add(c.id); }
  return out;
}
function planRound(bankRound, mix, ringFirst, funHere, used, avoid, rnd) {
  const by = (f) => bankRound.filter(f);
  const gen = by((c) => c.tag === "gen"), fun = by((c) => c.tag === "fun");
  const sports = by((c) => c.tag === "sports"), wrest = by((c) => c.tag === "wrestling");
  let cats = [];
  if (mix === "fight") cats = [...drawFrom(sports, ringFirst === "wrestling" ? 1 : 2, used, avoid, rnd), ...drawFrom(wrest, ringFirst === "wrestling" ? 2 : 1, used, avoid, rnd)];
  else if (mix === "standard") {
    cats = drawFrom(ringFirst === "wrestling" ? wrest : sports, 1, used, avoid, rnd);
    if (rnd() < 0.25) cats.push(...drawFrom(ringFirst === "wrestling" ? sports : wrest, 1, used, avoid, rnd));
  }
  if (funHere && mix !== "fight") cats.push(...drawFrom(fun, 1, used, avoid, rnd));
  cats.push(...drawFrom(gen, 6 - cats.length, used, avoid, rnd));
  return cats;
}
function slotPres(cats, bankRound, used, avoid, rnd) {
  const pool = bankRound.filter((c) => c.tag === "pres");
  const picked = drawFrom(pool, 1, used, avoid, rnd);
  let idx = cats.findIndex((c) => c.tag === "gen");
  if (idx < 0) idx = cats.length - 1;
  const gone = cats[idx];
  if (gone && gone.id !== picked[0].id) { used.delete(gone.id); avoid.delete(gone.id); }
  cats[idx] = picked[0];
}
if (!html.includes("slotPres(r1, BANK.r1, used, avoid)") || !html.includes("if (r2) slotPres(r2, BANK.r2, used, avoid)")) {
  fail("index.html does not deal pres from both rounds");
}
const r1ids = new Set(pres.r1.map((c) => c.id));
const r2ids = new Set(pres.r2.map((c) => c.id));
let dealBad = 0;
for (const mix of ["standard", "fight", "general"]) {
  for (let t = 0; t < 80; t++) {
    let seed = (t + 1) * 997 + mix.length * 13;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const used = new Set();
    const avoid = new Set();
    const first = rnd() < 0.5 ? "sports" : "wrestling";
    const r1 = planRound(bank.r1, mix, first, rnd() < 0.3, used, avoid, rnd);
    const r2 = planRound(bank.r1, mix, first === "sports" ? "wrestling" : "sports", false, used, avoid, rnd);
    slotPres(r1, bank.r1, used, avoid, rnd);
    slotPres(r2, bank.r2, used, avoid, rnd);
    const p1 = r1.filter((c) => c.tag === "pres");
    const p2 = r2.filter((c) => c.tag === "pres");
    if (p1.length !== 1 || p2.length !== 1 || !r1ids.has(p1[0].id) || !r2ids.has(p2[0].id)) dealBad++;
    if (r1.length !== 6 || r2.length !== 6) dealBad++;
    const ring = (cats) => cats.filter((c) => c.tag === "sports" || c.tag === "wrestling").length;
    if (mix === "fight" && (ring(r1) !== 3 || ring(r2) !== 3)) dealBad++;
    if (mix === "general" && (ring(r1) || ring(r2))) dealBad++;
  }
}
if (dealBad) fail("deal simulation failures: " + dealBad);

// Voice fallback still skips a missing audio id.
if (!/if\s*\(\s*!a\s*\)\s*\{\s*fallback\(\)/.test(html)) fail("speak() no longer falls back when there is no audio id");
if (!html.includes('if (q[4]) clueAudio.set')) fail("empty audio ids would be indexed");

console.log(report.join("\n"));
console.log("\nCanonical check: 47 numbers, Cleveland 22 and 24, Trump 45 and 47, Biden 46, 45 different people.");
console.log("Deal simulation: 240 games, one pres category per round, round 2 from the harder set.");
if (fails.length) {
  console.error("\nFAILED " + fails.length);
  fails.slice(0, 40).forEach((f) => console.error(" - " + f));
  process.exit(1);
}
console.log("OK");

/*
 * Станція Новоолексіївка, after the station plan «Дата кор. 11.02.2015».
 * Double-track line Партизани (Мелітополь) — Салькове (Джанкой) and a single-track branch to Генічеськ.
 * Odd trains run to the right on track I (entry Н on the left); even trains to the left on II (entry Ч on the right).
 * The branch to Генічеськ (entry Чг) is served by the branch tracks 8 and VI (towards Мелітополь) and
 * 10 and 12 (towards Салькове). Track 9 is a shunting track; 23 and 22 are dead ends on the left,
 * 17 and 18 on the right, 15а leads to the П/К. The 45° schematic is drawn after the plan.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "novooleksiivka", station: "Новоолексіївка", planDate: "11.02.2015", shuntToTracks: true, rightParity: "odd", lockFrame: true },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 335], APl: [-55, 335], HN: [40, 335],
      S1: [270, 300], S3: [305, 335], S9: [370, 335], S11: [405, 370], H23: [150, 370], M13n: [330, 370],
      S13: [460, 335], S15: [495, 300], S23: [575, 300], S25: [610, 265], M7n: [420, 265], H22: [320, 265],
      S17: [560, 370], X17: [595, 405], S21: [630, 440], X21: [665, 475], S19: [680, 370], X19: [715, 405],
      L4: [900, 265], L2: [650, 300], L1: [620, 335], L3: [740, 370], L5: [750, 405], L7: [680, 440], L9: [700, 475],
      S29: [700, 265], S31: [840, 265], L8: [805, 160], L6: [910, 195], R8: [1110, 160], R6: [1120, 195],
      X37: [1150, 195], S37: [1185, 160], S33: [1220, 125], G1: [1255, 90], EG: [1300, 90], GP: [1450, 90], G0: [1600, 90],
      S35: [1255, 160], X35: [1290, 195], L10: [1300, 160], R10: [1410, 160], X10: [1440, 160], L12: [1325, 195], R12: [1420, 195],
      S32: [1475, 195], X32: [1510, 230], S30: [1545, 265],
      R4: [1500, 265], R2: [1500, 300], R1: [1520, 335], R3: [1400, 370], R5: [1380, 405], R7: [1340, 440], R9: [1300, 475],
      S34: [1480, 370], S38: [1445, 405], S40: [1410, 440], S42: [1375, 475], X42: [1555, 475],
      S22: [1610, 335], S24: [1575, 370], S20: [1660, 370], M16n: [1720, 370], H15a: [1830, 370],
      S28: [1660, 265], S26: [1695, 300], S2: [1760, 265], M4n: [1830, 265], H18: [1940, 265], X2: [1795, 230], M2n: [1830, 230], H17: [1990, 230],
      S14: [1765, 335], S12: [1800, 300], S6: [1840, 300], S4: [1875, 335],
      CN: [2000, 300], BRu: [2140, 300], A1u: [2280, 300], EX: [2000, 335], BRl: [2140, 335], A1l: [2280, 335]
    },
    switches: [
      ["1", "S1", "EU", "S15", "S3", -1], ["3", "S3", "S9", "HN", "S1", 1], ["9", "S9", "S3", "S13", "S11", 1], ["11", "S11", "S17", "M13n", "S9", 1],
      ["13", "S13", "S9", "L1", "S15", 1], ["15", "S15", "S23", "S1", "S13", -1], ["23", "S23", "S15", "L2", "S25", 1], ["25", "S25", "S29", "M7n", "S23", -1],
      ["17", "S17", "S11", "S19", "X17", -1], ["19", "S19", "S17", "L3", "X19", -1], ["21", "S21", "X17", "L7", "X21", 1],
      ["29", "S29", "S25", "S31", "L8", 1], ["31", "S31", "S29", "L4", "L6", 1],
      ["37", "S37", "S33", "R8", "X37", -1], ["33", "S33", "G1", "S37", "S35", -1], ["35", "S35", "S33", "L10", "X35", 1], ["32", "S32", "X32", "R12", "X10", 1],
      ["30", "S30", "S28", "R4", "X32", -1], ["28", "S28", "S30", "S2", "S26", -1], ["26", "S26", "S12", "R2", "S28", 1], ["2", "S2", "S28", "M4n", "X2", -1],
      ["22", "S22", "S14", "R1", "S24", 1], ["24", "S24", "S34", "S20", "S22", 1], ["34", "S34", "S24", "R3", "S38", 1], ["38", "S38", "S34", "R5", "S40", 1],
      ["40", "S40", "S38", "R7", "S42", 1], ["42", "S42", "R9", "X42", "S40", 1], ["20", "S20", "M16n", "S24", "X42", 1],
      ["14", "S14", "S22", "S4", "S12", 1], ["12", "S12", "S6", "S26", "S14", -1], ["6", "S6", "S12", "CN", "S4", -1], ["4", "S4", "EX", "S14", "S6", 1]
    ],
    edges: [
      ["A0u", "APu", "2ЧП"], ["APu", "EU", "1ЧП"], ["EU", "S1"], ["A0l", "APl", "2НП"], ["APl", "HN", "1НП"], ["HN", "S3"],
      ["S1", "S15"], ["S1", "S3"], ["S3", "S9"], ["S9", "S13"], ["S9", "S11"], ["S11", "M13n"], ["M13n", "H23", "23П"], ["S11", "S17"],
      ["S13", "L1"], ["S13", "S15"], ["S15", "S23"], ["S23", "L2"], ["S23", "S25"], ["S25", "M7n"], ["M7n", "H22", "22П"], ["S25", "S29"],
      ["S17", "S19"], ["S17", "X17"], ["X17", "S21"], ["S21", "L7"], ["S21", "X21"], ["X21", "L9"], ["S19", "L3"], ["S19", "X19"], ["X19", "L5"],
      ["S29", "S31"], ["S29", "L8"], ["S31", "L4"], ["S31", "L6"],
      ["R8", "S37"], ["R6", "X37"], ["X37", "S37"], ["S37", "S33"], ["S33", "G1"], ["G1", "EG"], ["EG", "GP", "1ГН"], ["GP", "G0", "2ГН"],
      ["S33", "S35"], ["S35", "L10"], ["S35", "X35"], ["X35", "L12"], ["R10", "X10"], ["X10", "S32"], ["R12", "S32"], ["S32", "X32"], ["X32", "S30"],
      ["R4", "S30"], ["S30", "S28"], ["S28", "S2"], ["S28", "S26"], ["S2", "M4n"], ["M4n", "H18", "18П"], ["S2", "X2"], ["X2", "M2n"], ["M2n", "H17", "17П"],
      ["R2", "S26"], ["S26", "S12"], ["S12", "S6"], ["S12", "S14"], ["S6", "CN"], ["S6", "S4"],
      ["R1", "S22"], ["S22", "S14"], ["S22", "S24"], ["S14", "S4"], ["S4", "EX"],
      ["R3", "S34"], ["S34", "S24"], ["S24", "S20"], ["S20", "M16n"], ["M16n", "H15a", "15аП"], ["S34", "S38"], ["R5", "S38"], ["S38", "S40"], ["R7", "S40"],
      ["S40", "S42"], ["R9", "S42"], ["S42", "X42"], ["X42", "S20"],
      ["CN", "BRu", "1ЧС"], ["BRu", "A1u", "2ЧС"], ["EX", "BRl", "1НС"], ["BRl", "A1l", "2НС"]
    ],
    info: {
      "23П": { kind: "track", len: 453, label: "Колія 23 (453 м, тупик)" },
      "22П": { kind: "track", len: 256, label: "Колія 22 (256 м, тупик)" },
      "17П": { kind: "track", len: 644, label: "Колія 17 (644 м, тупик; далі МПК)" },
      "18П": { kind: "track", len: 287, label: "Колія 18 (287 м, тупик)" },
      "15аП": { kind: "track", len: 122, label: "Колія 15а (122 м) → П/К №1, №2, №3" }
    },
    signals: [
      { id: "М13", node: "M13n", dir: "R", kind: "shunt", note: "виїзд з тупика 23" },
      { id: "М7", node: "M7n", dir: "R", kind: "shunt", note: "виїзд з тупика 22" },
      { id: "М16", node: "M16n", dir: "L", kind: "shunt", note: "виїзд з колії 15а (П/К)" },
      { id: "М4", node: "M4n", dir: "L", kind: "shunt", note: "виїзд з колії 18" },
      { id: "М2", node: "M2n", dir: "L", kind: "shunt", note: "виїзд з колії 17" }
    ],
    park: [
      { id: "8П", L: "L8", R: "R8", len: 1012, sigL: "Ч8", sigR: "Н8", label: "Колія 8 (1012 м, на Генічеськ)", noArrive: ["S"] },
      { id: "VIП", L: "L6", R: "R6", len: 922, sigL: "Ч6", sigR: "Н6", name: "VI", label: "Колія VI (922 м, головна на Генічеськ)", noArrive: ["S"] },
      { id: "10П", L: "L10", R: "R10", len: 822, sigL: "НГ10", sigR: "Н10", label: "Колія 10 (822 м, Генічеськ — Салькове)", noArrive: ["P"], labelX: 1350 },
      { id: "12П", L: "L12", R: "R12", len: 840, sigL: "НГ12", sigR: "Н12", label: "Колія 12 (840 м, Генічеськ — Салькове)", noArrive: ["P"], labelX: 1335, labelY: 224 },
      { id: "4П", L: "L4", R: "R4", len: 547, sigL: "Ч4", sigR: "Н4", label: "Колія 4 (547 м, біля платформи)" },
      { id: "IIП", L: "L2", R: "R2", len: 833, sigL: "ЧII", sigR: "НII", name: "II", label: "Колія II (833 м, головна)" },
      { id: "IП", L: "L1", R: "R1", len: 987, sigL: "ЧI", sigR: "НI", name: "I", label: "Колія I (987 м, головна)" },
      { id: "3П", L: "L3", R: "R3", len: 864, sigL: "Ч3", sigR: "Н3", label: "Колія 3 (864 м, біля платформи)" },
      { id: "5П", L: "L5", R: "R5", len: 853, sigL: "Ч5", sigR: "Н5", label: "Колія 5 (853 м)" },
      { id: "7П", L: "L7", R: "R7", len: 702, sigL: "Ч7", sigR: "Н7", label: "Колія 7 (702 м)" },
      { id: "9П", L: "L9", R: "R9", len: 643, sigL: "М27", sigR: "М32", kindL: "shunt", kindR: "shunt", label: "Колія 9 (643 м, маневрова)", noArrive: ["P", "S", "G"] }
    ],
    lines: [
      { key: "P", name: "Партизани (Мелітополь)", arrParity: "odd", secs: [["2НП", 1300, "Перегін з Партизан, 2-й блок"], ["1НП", 900, "Перегін з Партизан, 1-й блок"]],
        entry: { id: "Н", node: "HN", dir: "R", note: "вхідний з Партизан (Мелітополь)" },
        exit: { far: "A0u", sec: "2ЧП", secs: [["1ЧП", 900, "Перегін на Партизани, 1-й блок"], ["2ЧП", 1300, "Перегін на Партизани, 2-й блок"]] },
        button: { id: "ВП", node: "EU", dx: -110, side: -1, label: "відпр. на ПАРТИЗАНИ", note: "кінець маршруту відправлення на Партизани (Мелітополь)" } },
      { key: "S", name: "Салькове (Джанкой)", arrParity: "even", secs: [["2ЧС", 1300, "Перегін з Салькового, 2-й блок"], ["1ЧС", 900, "Перегін з Салькового, 1-й блок"]],
        entry: { id: "Ч", node: "CN", dir: "L", note: "вхідний з Салькового" },
        exit: { far: "A1l", sec: "2НС", secs: [["1НС", 900, "Перегін на Салькове, 1-й блок"], ["2НС", 1300, "Перегін на Салькове, 2-й блок"]] },
        button: { id: "ВС", node: "EX", dx: 110, side: 1, label: "відпр. на САЛЬКОВЕ", note: "кінець маршруту відправлення на Салькове (Джанкой)" } },
      { key: "G", name: "Генічеськ", arrParity: "even", secs: [["2ГН", 1300, "Перегін Генічеськ — Новоолексіївка, 2-й блок (одноколійний)"], ["1ГН", 900, "Перегін Генічеськ — Новоолексіївка, 1-й блок (одноколійний)"]],
        entry: { id: "Чг", node: "EG", dir: "L", note: "вхідний з Генічеська" },
        exit: { far: "G0", sec: "2ГН" },
        button: { id: "ВГ", node: "EG", dx: 70, side: 1, label: "відпр. на ГЕНІЧЕСЬК", note: "кінець маршруту відправлення на Генічеськ" } }
    ],
    view: {
      box: [-165, 40, 2460, 470],
      platforms: [[1000, 278, 380, 8], [960, 347, 460, 8]],
      notes: [[-150, 255, "← ПАРТИЗАНИ · Мелітополь"], [2040, 255, "САЛЬКОВЕ · Джанкой →"], [1620, 70, "ГЕНІЧЕСЬК (непарний) →"], [150, 395, "23 тупик"], [1840, 395, "→ П/К №1–3"], [1990, 215, "МПК"], [1060, 505, "ЕЦ · ПБ"]],
      borders: [],
      blockLabels: [["2ЧП", -110, 300, -13], ["1ЧП", -15, 300, -13], ["2НП", -110, 335, 20], ["1НП", -15, 335, 20], ["1ЧС", 2060, 300, -13], ["2ЧС", 2200, 300, -13], ["1НС", 2060, 335, 20], ["2НС", 2200, 335, 20], ["1ГН", 1375, 90, -13], ["2ГН", 1525, 90, -13]],
      graph: ["Партизани", "Новоолексіївка", "Салькове"]
    },
    radio: { sides: { P: { name: "Партизани", from: "Партизан", dsp: "Ткаченко", inc: 20 }, S: { name: "Салькове", from: "Салькового", dsp: "Литвиненко", inc: 40 }, G: { name: "Генічеськ", from: "Генічеська", dsp: "Кравець", inc: 30 } },
      bySignal: { "Н": "P", "Ч": "S", "Чг": "G" }, byLine: { "2ЧП": "P", "2НС": "S", "2ГН": "G" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний", odd: "непарний", station: "по станції" },
    trackPreference: { odd: ["IП", "3П", "5П", "7П"], even: ["IIП", "4П", "3П", "5П", "7П"] },
    typeTracks: { passenger: ["IП", "IIП", "4П", "3П", "VIП", "8П", "10П", "12П"], electric: ["4П", "3П", "IП", "IIП", "VIП", "8П", "12П", "10П"], freight: ["5П", "7П", "3П", "IП", "IIП", "8П", "VIП", "10П", "12П"],
      reserve: ["IП", "IIП", "VIП", "10П"], household: ["5П", "7П"], test: ["IП", "IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 70, electric: 60, freight: 45, household: 35, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["4П", "IIП", "IП", "3П", "VIП", "8П", "10П", "12П"], mainTracks: ["IП", "IIП", "VIП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {
      "Т23": { name: "Подача вагонів у тупик 23 з колії 9", start: "9П", plan: [{ sig: "М27", end: "23П" }, { leave: true }, { wait: 60 }, { sig: "М13", end: "9П" }] },
      "Т23П": { name: "Прибирання вагонів з тупика 23 на колію 9", start: "9П", plan: [{ sig: "М27", end: "23П" }, { couple: true }, { wait: 120 }, { sig: "М13", end: "9П" }] },
      "П15": { name: "Подача вагонів на колію 15а (П/К) з колії 9", start: "9П", plan: [{ sig: "М32", end: "15аП" }, { leave: true }, { wait: 60 }, { sig: "М16", end: "9П" }] },
      "П15П": { name: "Прибирання вагонів з колії 15а (П/К) на колію 9", start: "9П", plan: [{ sig: "М32", end: "15аП" }, { couple: true }, { wait: 120 }, { sig: "М16", end: "9П" }] }
    }
  };
  const LINE = { P: { entry: "Н", exit: "2ЧП", name: "Партизани" }, S: { entry: "Ч", exit: "2НС", name: "Салькове" }, G: { entry: "Чг", exit: "2ГН", name: "Генічеськ" } };
  // the direction a train has here: to Салькове odd, to Партизани even; to Генічеськ odd from Партизани, even from Салькове
  const parityOf = (fl, tl) => (tl === "S" ? "odd" : tl === "P" ? "even" : fl === "P" ? "odd" : "even");
  const TRACKS = {
    "P>S": { stop: ["IП", "3П"], pass: ["IП"] }, "S>P": { stop: ["IIП", "4П"], pass: ["IIП"] },
    "P>G": { stop: ["VIП", "8П"], pass: ["VIП"] }, "G>P": { stop: ["VIП", "8П"], pass: ["VIП"] },
    "S>G": { stop: ["12П", "10П"], pass: ["12П"] }, "G>S": { stop: ["10П", "12П"], pass: ["10П"] }
  };
  function generate(seed, intensity, day) {
    const G = K.toolkit("NOV|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    const key = (ln, inbound) => (ln === "G" ? "G" : ln + (inbound ? ">" : "<"));
    function through(type, fl, tl, t, stop, from, to) {
      const gIn = fl === "G" ? 12 : 8, gOut = tl === "G" ? 12 : 8;
      const ta = G.slot(key(fl, true), t, gIn); if (ta == null) return false;
      const td = G.slot(key(tl, false), ta + stop + 3, gOut); if (td == null) { G.unslot(key(fl, true), ta); return false; }
      const par = parityOf(fl, tl), odd = par === "odd";
      const n = G.num(type === "passenger" ? 1 : type === "electric" ? 6401 : type === "reserve" ? 4901 : 2001, type === "freight" ? 898 : type === "passenger" ? 140 : 98, odd);
      const tr = TRACKS[fl + ">" + tl], rec = stop ? G.pick(tr.stop) : tr.pass[0];
      ev.push({ time: K.hm(ta), train: String(n), type, direction: par, action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        recTrack: rec, from, to, timeStatus: "generated", note: (stop ? "зупинка " + stop + " хв" : "без зупинки") + " · " + LINE[fl].name + " → " + LINE[tl].name });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(i, n); a++); };
    const both = (a, b) => (G.r() < 0.5 ? [a, b] : [b, a]);
    // електропоїзди: Мелітополь — Генічеськ (the main suburban flow), Мелітополь — Джанкой, a few Генічеськ — Джанкой
    tryN(Math.max(4, Math.round(8 * k)), (i, n) => { const [f, t] = both("P", "G"); return through("electric", f, t, 290 + (i + 0.5) * (1080 / n) + G.ri(-25, 25), 1, f === "P" ? "Мелітополь" : "Генічеськ", f === "P" ? "Генічеськ" : "Мелітополь"); });
    tryN(Math.max(3, Math.round(6 * k)), () => { const [f, t] = both("P", "S"); return through("electric", f, t, G.ri(280, 1380), 1, f === "P" ? "Мелітополь" : "Джанкой", f === "P" ? "Джанкой" : "Мелітополь"); });
    tryN(Math.max(1, Math.round(2 * k)), () => { const [f, t] = both("S", "G"); return through("electric", f, t, G.ri(300, 1300), 2, f === "S" ? "Джанкой" : "Генічеськ", f === "S" ? "Генічеськ" : "Джанкой"); });
    // passenger: through Крим and seasonal to Генічеськ
    tryN(Math.max(2, Math.round(4 * k)), () => { const [f, t] = both("P", "S"); return through("passenger", f, t, G.ri(0, 1400), G.r() < 0.5 ? 2 : 0, f === "P" ? G.pick(["Київ", "Харків", "Запоріжжя-1"]) : G.pick(["Сімферополь", "Севастополь"]), f === "P" ? G.pick(["Сімферополь", "Євпаторія"]) : G.pick(["Київ", "Дніпропетровськ"])); });
    tryN(Math.max(1, Math.round(1.5 * k)), () => { const [f, t] = both("P", "G"); return through("passenger", f, t, G.ri(300, 1100), 3, f === "P" ? G.pick(["Київ", "Харків"]) : "Генічеськ", f === "P" ? "Генічеськ" : G.pick(["Київ", "Харків"])); });
    // freight mostly on the main line; a rare one to/from Генічеськ
    tryN(Math.max(3, Math.round(7 * k)), () => { const [f, t] = both("P", "S"); return through("freight", f, t, G.ri(0, 1400), G.r() < 0.25 ? G.ri(15, 40) : 0, f === "P" ? "Мелітополь" : "Джанкой", f === "P" ? "Джанкой" : "Мелітополь"); });
    if (G.r() < 0.6) tryN(1, () => { const [f, t] = both("P", "G"); return through("freight", f, t, G.ri(300, 1100), 0, f === "P" ? "Мелітополь" : "Генічеськ", f === "P" ? "Генічеськ" : "Мелітополь"); });
    tryN(Math.max(1, Math.round(2 * k)), () => { const [f, t] = both("P", "S"); return through("reserve", f, t, G.ri(0, 1400), 0, f === "P" ? "Мелітополь" : "Джанкой", f === "P" ? "Джанкой" : "Мелітополь"); });
    // local shunting from track 9: dead end 23 and the П/К track 15а
    let mn = 0;
    const shunt = (t, job) => ev.push({ time: K.hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" });
    [["Т23", "Т23П"], ["П15", "П15П"]].forEach(([a, b], i) => { if (G.r() < 0.8) { const t = 420 + i * 240 + G.ri(-30, 30); shunt(t, a); shunt(t + G.ri(150, 260), b); } });
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "novooleksiivka_" + seed + "_" + intensity + "_d" + day, station: "Новоолексіївка", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.novooleksiivka = { id: "novooleksiivka", name: "Новоолексіївка", note: "вузлова: Партизани — Салькове, відгалуження на Генічеськ", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE, parityOf };
})();

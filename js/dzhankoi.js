/*
 * Станція Джанкой, after the station plan «Дата кор. 01.02.2013» (four parts).
 * The largest station of the route: on the left the double-track line to Мамут (Мелітополь) and the
 * single-track line to Вадим (Богемка); on the right the double-track line to Сімферополь and the
 * single-track line to Владиславівка (Феодосія).
 * Drawn as a square (45°) schematic after the plan:
 *  - Приміський парк (17А, 18А, IIА, IIIА, VА) for the suburban electric trains from Мамут;
 *  - Південний парк (IVЮ, IIIЮ, VIЮ, 6Ю … 12Ю, IЮ) with the lengths from the plan, signals Ч..Ю / Н..Ю;
 *  - the hump (ГАЦ, МГ1) and Сортувально-відправний парк (11 … 18, 21, 22) with signals Н11 … Н22;
 *  - the locomotive depot (ЛД1, ЛД2), the carriage depot (1в, 2в), ЕЧК-39 (М11);
 *  - shunting signals М2/М4, М14/М12 (left), М25/М21, М17/М19 (right) for running round in the throats.
 * The plan has many more switches than are drawn here; groups of them are merged into ladders.
 * Model choices: block division, the timetable, train lengths and the shunting plans.
 * Odd trains run to the right (from Мамут / Вадим), even trains to the left.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const W = 3500, MX = (x) => W - x;
  // Південний парк: [id, name, y, length, signal suffix]
  const SOUTH = [["IVЮП", "IVЮ", 370, 632, "4Ю"], ["IIIЮП", "IIIЮ", 405, 640, "2Ю"], ["VIЮП", "VIЮ", 440, 485, "5Ю"], ["6ЮП", "6Ю", 475, 876, "6Ю"], ["7ЮП", "7Ю", 510, 876, "7Ю"],
    ["8ЮП", "8Ю", 545, 844, "8Ю"], ["9ЮП", "9Ю", 580, 851, "9Ю"], ["10ЮП", "10Ю", 615, 963, "10Ю"], ["11ЮП", "11Ю", 650, 913, "11Ю"], ["12ЮП", "12Ю", 685, 618, "12Ю"], ["IЮП", "IЮ", 720, 429, "1Ю"]];
  // Приміський парк (dead ends on the right): [id, name, y, length, signal]
  const PRIM = [["17АП", "17А", 125, 273, "Ч17А"], ["18АП", "18А", 160, 279, "Ч18А"], ["IIАП", "IIА", 195, 283, "Ч2А"], ["IIIАП", "IIIА", 230, 247, "Ч3А"], ["VАП", "VА", 265, 267, "Ч5А"]];
  // Сортувально-відправний парк (to the right of the hump, as on the plan): [id, name, y, length]
  const YARD = [["С11П", "11", 470, 803], ["С12П", "12", 505, 840], ["С13П", "13", 540, 825], ["С14П", "14", 575, 837], ["С15П", "15", 610, 855],
    ["С16П", "16", 645, 855], ["С17П", "17", 680, 850], ["С18П", "18", 715, 850], ["С21П", "21", 750, 860], ["С22П", "22", 785, 857]];
  const SL = 1080, SR = MX(SL), PL = 900, PR = 1350, YL = 3700, YR = 4380, RO = 2520;
  const N = {
    // ---- left: lines
    A0u: [-150, 300], APu: [-55, 300], EMU: [40, 300], A0l: [-150, 335], APl: [-55, 335], EML: [40, 335],
    A0b: [-150, 525], APb: [-55, 525], EB: [40, 525], SB: [90, 525],
    // ---- left throat: Вадим junction, crossovers, running-round pairs
    S38: [280, 335], SAl: [320, 335], SAu: [355, 300], SBu: [415, 300], SBl: [450, 335],
    M2n: [545, 335], M4n: [580, 335], G5: [620, 335], M14n: [480, 300], M12n: [505, 300], PU: [620, 300], DU: [700, 300],
    // ---- Приміський парк ladder, ЕЧК-39
    P5: [655, 265], P3: [690, 230], P2: [725, 195], P18: [760, 160], P17: [795, 125], PE: [830, 90], LEK: [PL, 90], HEK: [1200, 90],
    // ---- Південний парк, upper ladder
    D1: [770, 370], D2: [805, 405], D3: [840, 440],
    // ---- under the southern park: the locomotive and carriage depots
    BV1: [1040, 755], BV2: [1075, 790], DJ: [1110, 825], DJ2: [1145, 860], DJ3: [1180, 895], DJ4: [1215, 930],
    LLD1: [1270, 825], HLD1: [1800, 825], LLD2: [1300, 860], HLD2: [1800, 860], L1v: [1330, 895], H1v: [1700, 895], L2v: [1360, 930], H2v: [1700, 930],
    // ---- right throat of the southern park
    DUr: [MX(700), 300], D1r: [MX(770), 370], D2r: [MX(805), 405], D3r: [MX(840), 440], G5r: [MX(620), 335],
    M17n: [2995, 300], M19n: [3020, 300], M25n: [2920, 335], M21n: [2955, 335],
    // ---- the hump: from the main line down to МГ1, the yard ladders, the yard exit
    HB: [3010, 335], HD: [3110, 435], HM: [3160, 435], MG1n: [3200, 435], Y0: [3250, 435],
    YJ: [4870, 335], M33n: [4920, 335], M31n: [4955, 335],
    // ---- locomotive tracks 1Т, 2Т
    TJ: [5010, 335], TJ2: [5080, 405], TJ3: [5115, 440], L1T: [5160, 405], H1T: [5480, 405], L2T: [5190, 440], H2T: [5480, 440],
    // ---- right: crossovers and the Владиславівка junction
    SBrl: [3075 + RO, 335], SBru: [3110 + RO, 300], SAru: [3170 + RO, 300], SArl: [3205 + RO, 335], FS: [3280 + RO, 300], FB: [3350 + RO, 230],
    // ---- right: lines
    EN: [3460 + RO, 300], BRu: [3600 + RO, 300], A1u: [3740 + RO, 300], EX: [3460 + RO, 335], BRl: [3600 + RO, 335], A1l: [3740 + RO, 335],
    EF: [3460 + RO, 230], BRf: [3600 + RO, 230], A1f: [3740 + RO, 230]
  };
  const LOWER = SOUTH.slice(3);
  // the lower ladder nodes are named by their track
  const eL = (id) => "E" + id, eR = (id) => "Er" + id;
  LOWER.forEach(([id, , y]) => { N[eL(id)] = [y + 285, y]; N[eR(id)] = [MX(y + 285), y]; });
  SOUTH.forEach(([id, , y]) => { N["L" + id] = [SL, y]; N["R" + id] = [SR, y]; });
  PRIM.forEach(([id, , y]) => { N["L" + id] = [PL, y]; N["R" + id] = [PR, y]; });
  YARD.forEach(([id, , y]) => { N["L" + id] = [YL, y]; N["R" + id] = [YR, y]; N["Y" + id] = [y + 2815, y]; N["Yr" + id] = [5205 - y, y]; });
  const L = (t) => "L" + t, R = (t) => "R" + t;

  const SW = [
    // left throat
    ["1", "SAu", "SBu", "EMU", "SAl", 1], ["3", "SAl", "S38", "SBl", "SAu", -1], ["5", "SBu", "SAu", "M14n", "SBl", 1], ["7", "SBl", "M2n", "SAl", "SBu", -1],
    ["9", "S38", "SAl", "EML", "SB", 1], ["11", "PU", "M12n", "DU", "P5", -1],
    ["13", "P5", "PU", "P3", L("VАП"), -1], ["15", "P3", "P5", "P2", L("IIIАП"), -1], ["17", "P2", "P3", "P18", L("IIАП"), -1], ["19", "P18", "P2", "P17", L("18АП"), -1], ["21", "P17", "P18", "PE", L("17АП"), -1],
    ["23", "D1", "DU", "D2", L("IVЮП"), 1], ["25", "D2", "D1", "D3", L("IIIЮП"), 1],
    // depots under the southern park
    ["71", "DJ", "BV2", "DJ2", "LLD1", 1], ["73", "DJ2", "DJ", "DJ3", "LLD2", 1], ["75", "DJ3", "DJ2", "DJ4", "L1v", 1],
    // right throat of the southern park, the hump, the yard exit, locomotive tracks
    ["12", "D1r", "DUr", "D2r", R("IVЮП"), 1], ["14", "D2r", "D1r", "D3r", R("IIIЮП"), 1],
    ["101", "HB", "M21n", "YJ", "HD", 1], ["150", "YJ", "M33n", "HB", "Yr" + YARD[0][0], 1],
    ["152", "TJ", "M31n", "SBrl", "TJ2", 1], ["154", "TJ2", "TJ", "TJ3", "L1T", 1],
    // right: crossovers, the Владиславівка junction
    ["2", "SArl", "EX", "SBrl", "SAru", -1], ["4", "SAru", "SBru", "FS", "SArl", 1], ["6", "SBru", "SAru", "M19n", "SBrl", 1], ["8", "SBrl", "TJ", "SArl", "SBru", -1],
    ["10", "FS", "SAru", "EN", "FB", -1]
  ];
  // lower ladders of the southern park
  LOWER.forEach(([id], i) => {
    const prevL = i === 0 ? "G5" : eL(LOWER[i - 1][0]), nextL = i === LOWER.length - 1 ? "BV1" : eL(LOWER[i + 1][0]);
    SW.push([String(27 + 2 * i), eL(id), prevL, nextL, L(id), 1]);
    if (i < LOWER.length - 1) SW.push([String(16 + 2 * i), eR(id), i === 0 ? "G5r" : eR(LOWER[i - 1][0]), eR(LOWER[i + 1][0]), R(id), 1]);
  });
  // ladders of the yard: on the left from the hump, on the right up to the main line
  YARD.forEach(([id], i) => {
    if (i < YARD.length - 1) {
      SW.push([String(103 + 2 * i), "Y" + id, i === 0 ? "Y0" : "Y" + YARD[i - 1][0], "Y" + YARD[i + 1][0], L(id), 1]);
      SW.push([String(148 - 2 * i), "Yr" + id, i === 0 ? "YJ" : "Yr" + YARD[i - 1][0], "Yr" + YARD[i + 1][0], R(id), 1]);
    }
  });
  const E = [
    ["A0u", "APu", "2ЧМ"], ["APu", "EMU", "1ЧМ"], ["EMU", "SAu"], ["A0l", "APl", "2НМ"], ["APl", "EML", "1НМ"], ["EML", "S38"],
    ["A0b", "APb", "2ВБ"], ["APb", "EB", "1ВБ"], ["EB", "SB"], ["SB", "S38"],
    ["S38", "SAl"], ["SAl", "SAu"], ["SAl", "SBl"], ["SAu", "SBu"], ["SBu", "SBl"], ["SBu", "M14n"], ["M14n", "M12n", "М14-12П"], ["M12n", "PU"],
    ["SBl", "M2n"], ["M2n", "M4n", "М2-4П"], ["M4n", "G5"], ["G5", eL("6ЮП")],
    ["PU", "DU"], ["PU", "P5"], ["P5", "P3"], ["P3", "P2"], ["P2", "P18"], ["P18", "P17"], ["P17", "PE"], ["PE", "LEK"], ["LEK", "HEK", "ЕЧКП"],
    ["P5", L("VАП")], ["P3", L("IIIАП")], ["P2", L("IIАП")], ["P18", L("18АП")], ["P17", L("17АП")],
    ["DU", "D1"], ["D1", "D2"], ["D2", "D3"], ["D1", L("IVЮП")], ["D2", L("IIIЮП")], ["D3", L("VIЮП")],
    [eL("IЮП"), "BV1"], ["BV1", "BV2", "ДП"], ["BV2", "DJ"], ["DJ", "DJ2"], ["DJ2", "DJ3"], ["DJ3", "DJ4"],
    ["DJ", "LLD1"], ["DJ2", "LLD2"], ["DJ3", "L1v"], ["L1v", "H1v", "1вП"], ["DJ4", "L2v"], ["L2v", "H2v", "2вП"],
    // right
    ["DUr", "D1r"], ["D1r", "D2r"], ["D2r", "D3r"], ["D1r", R("IVЮП")], ["D2r", R("IIIЮП")], ["D3r", R("VIЮП")],
    ["DUr", "M17n"], ["M17n", "M19n", "М17-19П"], ["M19n", "SBru"], ["G5r", "M25n"], ["M25n", "M21n", "М25-21П"], ["M21n", "HB"], ["G5r", eR("6ЮП")],
    ["HB", "HD"], ["HD", "HM"], ["HM", "MG1n", "ГП"], ["MG1n", "Y0"], ["Y0", "Y" + YARD[0][0]],
    ["HB", "YJ", "ГХП"], ["YJ", "M33n"], ["M33n", "M31n", "М33-31П"], ["M31n", "TJ"], ["YJ", "Yr" + YARD[0][0]],
    ["TJ", "TJ2"], ["TJ2", "TJ3"], ["TJ2", "L1T"], ["TJ3", "L2T"], ["TJ", "SBrl"],
    ["SBrl", "SBru"], ["SBrl", "SArl"], ["SBru", "SAru"], ["SAru", "SArl"], ["SAru", "FS"], ["SArl", "EX"], ["FS", "EN"], ["FS", "FB"], ["FB", "EF"],
    ["EN", "BRu", "1ЧС"], ["BRu", "A1u", "2ЧС"], ["EX", "BRl", "1НС"], ["BRl", "A1l", "2НС"], ["EF", "BRf", "1ВЛ"], ["BRf", "A1f", "2ВЛ"]
  ];
  LOWER.forEach(([id], i) => {
    if (i < LOWER.length - 1) { E.push([eL(id), eL(LOWER[i + 1][0])]); E.push([eR(id), eR(LOWER[i + 1][0])]); }
    E.push([eL(id), L(id)]); E.push([eR(id), R(id)]);
  });
  YARD.forEach(([id], i) => {
    if (i < YARD.length - 1) { E.push(["Y" + id, "Y" + YARD[i + 1][0]]); E.push(["Yr" + id, "Yr" + YARD[i + 1][0]]); }
    E.push(["Y" + id, L(id)]); E.push(["Yr" + id, R(id)]);
  });
  const info = {
    "ЕЧКП": { kind: "track", len: 180, label: "Колія ЕЧК-39 (тупик)" }, "1вП": { kind: "track", len: 150, label: "Колія 1в — вагонне депо (тупик)" }, "2вП": { kind: "track", len: 150, label: "Колія 2в — вагонне депо (тупик)" },
    "М14-12П": { kind: "switchless", len: 60, label: "Ділянка між М14 і М12" }, "М2-4П": { kind: "switchless", len: 60, label: "Ділянка між М2 і М4 (зміна напрямку маневрів)" },
    "М17-19П": { kind: "switchless", len: 60, label: "Ділянка між М17 і М19" }, "М25-21П": { kind: "switchless", len: 60, label: "Ділянка між М25 і М21 (зміна напрямку маневрів)" },
    "М33-31П": { kind: "switchless", len: 60, label: "Ділянка між М33 і М31 (зміна напрямку маневрів)" },
    "ГП": { kind: "switchless", len: 80, label: "Насув на гірку (між М72 і МГ1)" }, "ДП": { kind: "switchless", len: 60, label: "Хід до депо, між М74 і М76" },
    "ГХП": { kind: "switchless", len: 1500, label: "Головний хід уздовж сортувального парку (стрілки 101 — 150)" }
  };
  const sig = (id, node, dir, note) => ({ id, node, dir, kind: "shunt", note });
  const signals = [
    sig("М2", "M2n", "L", "витягування в лівій горловині (хід Мамут)"), sig("М4", "M4n", "R", "з горловини на колії 6Ю … IЮ і в депо"),
    sig("М14", "M14n", "L", "витягування в лівій горловині (верхній хід)"), sig("М12", "M12n", "R", "з горловини в Приміський парк, на колії IVЮ … VIЮ, ЕЧК"),
    sig("М25", "M25n", "L", "з горловини на колії 6Ю … IЮ"), sig("М21", "M21n", "R", "на гірку і до колій 1Т, 2Т"),
    sig("М17", "M17n", "L", "з горловини на колії IVЮ … VIЮ"), sig("М19", "M19n", "R", "витягування в правій горловині (верхній хід)"),
    sig("МГ1", "MG1n", "R", "гірковий: розпуск у сортувальний парк"), sig("М72", "HM", "L", "з гірки в горловину"),
    sig("М33", "M33n", "L", "у сортувальний парк з правого боку"), sig("М31", "M31n", "R", "на колії 1Т, 2Т"),
    sig("М74", "BV1", "L", "з колій депо в горловину"), sig("М76", "BV2", "R", "на колії депо ЛД1, ЛД2, 1в, 2в")
  ];
  const sh = (id, Lx, Rx, len, sl, label, extra) => Object.assign({ id, L: Lx, R: Rx, len, sigL: sl, kindL: "shunt", noArrive: ["M", "B", "S", "F"], label }, extra || {});
  const park = SOUTH.map(([id, name, , len, sx]) => ({ id, L: L(id), R: R(id), len, sigL: "Ч" + sx, sigR: "Н" + sx, name, label: "Колія " + name + " (" + len + " м), Південний парк" }))
    .concat(PRIM.map(([id, name, , len, s]) => ({ id, L: L(id), R: R(id), len, sigL: s, name, label: "Колія " + name + " (" + len + " м, тупик), Приміський парк" })))
    .concat(YARD.map(([id, name, , len]) => ({ id, L: L(id), R: R(id), len, sigL: "ПЧ" + name, kindL: "shunt", sigR: "Н" + name, name, noArrive: ["M", "B"], label: "Колія " + name + " (" + len + " м), сортувально-відправний парк" })))
    .concat([sh("ЛД1П", "LLD1", "HLD1", 160, "М80", "Колія ЛД1 — локомотивне депо (тупик)", { name: "ЛД1" }), sh("ЛД2П", "LLD2", "HLD2", 150, "М82", "Колія ЛД2 — локомотивне депо (тупик)", { name: "ЛД2" }),
      sh("1ТП", "L1T", "H1T", 120, "М35", "Колія 1Т — для локомотивів (тупик)", { name: "1Т" }), sh("2ТП", "L2T", "H2T", 120, "М37", "Колія 2Т — для локомотивів (тупик)", { name: "2Т" })]);
  signals.push(sig("М11", "LEK", "L", "виїзд з ЕЧК-39"), sig("М84", "L1v", "L", "виїзд з колії 1в"), sig("М86", "L2v", "L", "виїзд з колії 2в"));
  const T = K.build({
    meta: { id: "dzhankoi", station: "Джанкой", planDate: "01.02.2013", shuntToTracks: true, rightParity: "odd", lockFrame: true, shuntStops: 5 },
    nodes: N, switches: SW, edges: E, info, signals, park,
    lines: [
      { key: "M", name: "Мамут (Мелітополь)", arrParity: "odd", secs: [["2НМ", 1300, "Перегін з Мамута, 2-й блок"], ["1НМ", 900, "Перегін з Мамута, 1-й блок"]],
        entry: { id: "Нм", node: "EML", dir: "R", note: "вхідний з Мамута" },
        exit: { far: "A0u", sec: "2ЧМ", secs: [["1ЧМ", 900, "Перегін на Мамут, 1-й блок"], ["2ЧМ", 1300, "Перегін на Мамут, 2-й блок"]] },
        button: { id: "ВМ", node: "EMU", dx: -110, side: -1, label: "відпр. на МАМУТ", note: "кінець маршруту відправлення на Мамут (Мелітополь)" } },
      { key: "B", name: "Вадим (Богемка)", arrParity: "odd", secs: [["2ВБ", 1300, "Перегін Вадим — Джанкой, 2-й блок (одноколійний)"], ["1ВБ", 900, "Перегін Вадим — Джанкой, 1-й блок (одноколійний)"]],
        entry: { id: "НБ", node: "EB", dir: "R", note: "вхідний з Вадима" }, exit: { far: "A0b", sec: "2ВБ" },
        button: { id: "ВБ", node: "EB", dx: -110, side: -1, label: "відпр. на ВАДИМ", note: "кінець маршруту відправлення на Вадим (Богемка)" } },
      { key: "S", name: "Сімферополь", arrParity: "even", secs: [["2ЧС", 1300, "Перегін з Сімферополя, 2-й блок"], ["1ЧС", 900, "Перегін з Сімферополя, 1-й блок"]],
        entry: { id: "Чс", node: "EN", dir: "L", note: "вхідний з Сімферополя" },
        exit: { far: "A1l", sec: "2НС", secs: [["1НС", 900, "Перегін на Сімферополь, 1-й блок"], ["2НС", 1300, "Перегін на Сімферополь, 2-й блок"]] },
        button: { id: "ВС", node: "EX", dx: 110, side: 1, label: "відпр. на СІМФЕРОПОЛЬ", note: "кінець маршруту відправлення на Сімферополь" } },
      { key: "F", name: "Владиславівка (Феодосія)", arrParity: "even", secs: [["2ВЛ", 1300, "Перегін Владиславівка — Джанкой, 2-й блок (одноколійний)"], ["1ВЛ", 900, "Перегін Владиславівка — Джанкой, 1-й блок (одноколійний)"]],
        entry: { id: "ЧВ", node: "EF", dir: "L", note: "вхідний з Владиславівки" }, exit: { far: "A1f", sec: "2ВЛ" },
        button: { id: "ВВ", node: "EF", dx: 110, side: 1, label: "відпр. на ВЛАДИСЛАВІВКУ", note: "кінець маршруту відправлення на Владиславівку (Феодосія)" } }
    ],
    view: {
      box: [-165, 40, 6460, 920],
      platforms: [[1250, 349, 1000, 8], [1250, 419, 1000, 8], [1250, 489, 1000, 8], [960, 139, 330, 8], [960, 209, 330, 8]],
      notes: [[-150, 262, "← МАМУТ · Мелітополь"], [-150, 492, "← ВАДИМ · Богемка"], [6000, 375, "СІМФЕРОПОЛЬ →"], [6000, 205, "ВЛАДИСЛАВІВКА →"], [6000, 185, "Феодосія"],
        [1000, 62, "Приміський парк"], [1240, 95, "ЕЧК-39"], [1650, 330, "Південний парк"], [3150, 470, "ГАЦ · гірка"], [1830, 845, "Локомотивне депо"], [1730, 915, "Вагонне депо"],
        [3900, 420, "Сортувально-відправний парк"], [5200, 475, "колії для локомотивів"]],
      borders: [],
      blockLabels: [["2ЧМ", -110, 300, -13], ["1ЧМ", -15, 300, -13], ["2НМ", -110, 335, 20], ["1НМ", -15, 335, 20], ["2ВБ", -110, 525, 20], ["1ВБ", -15, 525, 20],
        ["1ЧС", 3500 + RO, 300, -13], ["2ЧС", 3640 + RO, 300, -13], ["1НС", 3500 + RO, 335, 20], ["2НС", 3640 + RO, 335, 20], ["1ВЛ", 3500 + RO, 230, -13], ["2ВЛ", 3640 + RO, 230, -13]],
      graph: ["Мамут", "Джанкой", "Сімферополь"]
    },
    radio: { sides: { M: { name: "Мамут", from: "Мамута", dsp: "Гончарук", inc: 25 }, B: { name: "Вадим", from: "Вадима", dsp: "Кравець", inc: 15 },
      S: { name: "Сімферополь", from: "Сімферополя", dsp: "Остапенко", inc: 40 }, F: { name: "Владиславівка", from: "Владиславівки", dsp: "Руденко", inc: 20 } },
      bySignal: { "Нм": "M", "НБ": "B", "Чс": "S", "ЧВ": "F" }, byLine: { "2ЧМ": "M", "2ВБ": "B", "2НС": "S", "2ВЛ": "F" }, odd: {}, even: {} },
    entrySignal: { odd: "Нм", even: "Чс" }
  });
  [["ЕЧК 180", 1000, 85], ["1в 150", 1450, 890], ["2в 150", 1480, 925]].forEach((l) => T.labels.push(l));

  // ------------------------------------------------------------ model parameters
  const UP = ["IVЮП", "IIIЮП", "VIЮП"], PAS = ["6ЮП", "7ЮП"], FR = ["8ЮП", "9ЮП", "10ЮП", "11ЮП", "12ЮП", "IЮП"];
  const PRIMT = PRIM.map((p) => p[0]), YF = YARD.slice(0, 8).map((y) => y[0]), DEPOT = ["ЛД1П", "ЛД2П"], LOCOR = ["1ТП", "2ТП"];
  const P = {
    directionParity: { even: "even", odd: "odd", arr: "odd", dep: "even" }, directionLabel: { even: "парний (вліво)", odd: "непарний (вправо)", station: "по станції" },
    trackPreference: { odd: ["7ЮП", "6ЮП", "8ЮП", "9ЮП"], even: ["IIIЮП", "IVЮП", "8ЮП", "9ЮП"] },
    typeTracks: { passenger: ["IIIЮП", "IVЮП", "VIЮП", "6ЮП", "7ЮП"], electric: ["IVЮП", "IIIЮП", "VIЮП", "6ЮП", "7ЮП"], freight: ["8ЮП", "9ЮП", "10ЮП", "11ЮП", "7ЮП", "12ЮП"],
      household: ["IЮП", "12ЮП"], reserve: ["IЮП", "12ЮП", "11ЮП"], test: ["IЮП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 5, electric: 5, freight: 7, household: 7, reserve: 5, shunting: 1, test: 5 }, departLeadMin: 6, terminateSec: 90,
    speedKmh: { passenger: 50, electric: 50, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: UP.concat(PAS).concat(PRIMT), mainTracks: ["IIIЮП", "IVЮП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 40,
    shuntingJobs: {}
  };
  const freeIn = (list) => (S, secBusy) => list.find((s) => !secBusy(S.sec[s]) && !S.sec[s].lock);
  const freeLocoR = freeIn(LOCOR);
  const freeDepot = (S, secBusy) => DEPOT.find((s) => !secBusy(S.sec[s]) && !S.sec[s].lock);
  const nm = (s) => s.replace("П", "").replace(/^С/, "");
  Object.assign(P.shuntingJobs, {
    // an even train (locomotive at the left end): the locomotive goes to the depot under the southern park
    LOCO_OUT: {
      name: "Зміна локомотива: прибулий локомотив — у депо", estSec: 900,
      build({ S, ev, findConsist }) {
        const sec = findConsist(ev.ev.consist);
        if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
        if (S.sec[sec].wagons.ready) return { skip: "локомотив уже змінено" };
        return { start: sec, onWagons: true, plan: [
          { sig: "@L", end: "М2", txt: "відчепитися і виїхати ліворуч у горловину за М2" },
          { sig: "М4", end: DEPOT, free: true, txt: "за М4 через стрілки 27 … 41, М74, М76 — у депо" }
        ] };
      }
    },
    LOCO_IN: {
      name: "Зміна локомотива: локомотив з депо в голову поїзда", estSec: 1000,
      build({ S, ev, findConsist, secBusy }) {
        const sec = findConsist(ev.ev.consist);
        if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
        if (S.sec[sec].wagons.ready) return { skip: "локомотив уже на поїзді" };
        if (S.trains.some((t) => !t.done && t.shunt && t.shunt.job === "LOCO_OUT" && t.seq.includes(sec))) return { wait: "прибулий локомотив ще не відійшов" };
        const start = freeDepot(S, secBusy);
        if (!start) return { wait: "у депо немає вільної колії з локомотивом" };
        return { start, plan: [
          { sig: "@L", end: "М2", txt: "з депо через М74, стрілки 41 … 27 у горловину за М2" },
          { sig: "М4", end: sec, txt: "за М4 на колію " + nm(sec) + " до состава" },
          { attach: true }
        ] };
      }
    },
    // a freight train that ends here is pushed over the hump into the sorting yard (to the right of the southern park)
    ROZF: {
      name: "Розформування: состав через гірку в сортувальний парк", estSec: 1800,
      build({ S, ev, findConsist }) {
        const sec = findConsist(ev.ev.consist);
        if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
        return { start: sec, onWagons: true, plan: [
          { couple: true },
          { sig: "@R", end: "МГ1", txt: "з составом праворуч через стрілки 16 … 101 на насув до МГ1" },
          { sig: "МГ1", end: YF, free: true, txt: "за МГ1 з гірки на вільну колію сортувального парку" },
          { leave: true, consist: "Р-" + ev.ev.consist },
          { wait: 60 },
          { sig: "@L", end: "М25", txt: "локомотив з сортувального парку через гірку в горловину за М21 (до М25)" },
          { sig: "М21", end: LOCOR, free: true, txt: "за М21 головним ходом, М33, М31 — на колію 1Т або 2Т" }
        ] };
      }
    },
    // a new train to Сімферополь / Владиславівка: a locomotive from 1Т / 2Т to the right end of the consist
    FORM: {
      name: "Формування: локомотив під состав у сортувальному парку", estSec: 1200,
      build({ S, ev, findConsist, secBusy }) {
        const ws = findConsist("Р-" + ev.ev.consist);
        if (!ws) return { wait: "состав " + ev.ev.consist + " ще не в сортувальному парку" };
        if (S.sec[ws].wagons.ready) return { skip: "локомотив уже на составі" };
        const start = freeLocoR(S, secBusy);
        if (!start) return { wait: "на коліях 1Т, 2Т немає локомотива" };
        return { start, plan: [
          { sig: "@L", end: "М33", txt: "з колії " + nm(start) + " через стрілки 154, 152 за М31 до М33" },
          { sig: "М33", end: ws, txt: "за М33 через стрілку 150 на колію " + nm(ws) + " до состава" },
          { attach: true }
        ] };
      }
    },
    // a new train to Мамут / Вадим: the consist from the sorting yard over the hump to a track of the southern park;
    // a locomotive from the depot then comes to its left end (LOCO_IN)
    FORMW: {
      name: "Формування: состав з сортувального парку на колію Південного парку", estSec: 2400,
      build({ S, ev, findConsist, secBusy }) {
        const ws = findConsist("Р-" + ev.ev.consist);
        if (!ws) return { wait: "состав " + ev.ev.consist + " ще не в сортувальному парку" };
        const start = freeLocoR(S, secBusy);
        if (!start) return { wait: "на коліях 1Т, 2Т немає локомотива" };
        return { start, plan: [
          { sig: "@L", end: "М33", txt: "з колії " + nm(start) + " за М31 до М33" },
          { sig: "М33", end: ws, txt: "за М33 на колію " + nm(ws) + " до состава" },
          { couple: true }, { wait: 120 },
          { sig: "@L", end: "М25", txt: "з составом через гірку і стрілку 101 у горловину за М21 (до М25)" },
          { sig: "М25", end: FR, free: true, txt: "за М25 на вільну колію 8Ю … IЮ" },
          { leave: true, consist: ev.ev.out },
          { sig: "@R", end: LOCOR, free: true, txt: "локомотив головним ходом на колію 1Т або 2Т" }
        ] };
      }
    },
    // static jobs
    "ЕЧК": { name: "Подача вагонів з ЕЧК-39 на колію VА (Приміський парк)", start: "ЕЧКП", plan: [{ sig: "М11", end: "М14" }, { sig: "М12", end: "VАП" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "М14" }, { sig: "М12", end: "ЕЧКП" }] },
    "ЕЧКП": { name: "Прибирання вагонів з колії VА в ЕЧК-39", start: "ЕЧКП", plan: [{ sig: "М11", end: "М14" }, { sig: "М12", end: "VАП" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "М14" }, { sig: "М12", end: "ЕЧКП" }] },
    "ВЧ1": { name: "Подача вагонів у вагонне депо (колія 1в) з колії ЛД2", start: "ЛД2П", plan: [{ sig: "@L", end: "М74" }, { sig: "М76", end: "1вП" }, { leave: true }, { wait: 60 }, { sig: "М84", end: "М74" }, { sig: "М76", end: "ЛД2П" }] },
    "ВЧ1П": { name: "Прибирання вагонів з вагонного депо (1в) на колію ЛД2", start: "ЛД2П", plan: [{ sig: "@L", end: "М74" }, { sig: "М76", end: "1вП" }, { couple: true }, { wait: 120 }, { sig: "М84", end: "М74" }, { sig: "М76", end: "ЛД2П" }] },
    "ВЧ2": { name: "Подача вагонів у вагонне депо (колія 2в) з колії ЛД1", start: "ЛД1П", plan: [{ sig: "@L", end: "М74" }, { sig: "М76", end: "2вП" }, { leave: true }, { wait: 60 }, { sig: "М86", end: "М74" }, { sig: "М76", end: "ЛД1П" }] },
    "ВЧ2П": { name: "Прибирання вагонів з вагонного депо (2в) на колію ЛД1", start: "ЛД1П", plan: [{ sig: "@L", end: "М74" }, { sig: "М76", end: "2вП" }, { couple: true }, { wait: 120 }, { sig: "М86", end: "М74" }, { sig: "М76", end: "ЛД1П" }] },
    "МВ": { name: "Перестановка місцевих вагонів з колії 22 на колію 21 (через гірку)", start: "С22П", plan: [{ sig: "ПЧ22", end: "М72" }, { sig: "МГ1", end: "С21П" }, { leave: true }, { wait: 60 }, { sig: "ПЧ21", end: "М72" }, { sig: "МГ1", end: "С22П" }] },
    "МВП": { name: "Прибирання місцевих вагонів з колії 21 на колію 22", start: "С22П", plan: [{ sig: "ПЧ22", end: "М72" }, { sig: "МГ1", end: "С21П" }, { couple: true }, { wait: 120 }, { sig: "ПЧ21", end: "М72" }, { sig: "МГ1", end: "С22П" }] }
  });

  // ------------------------------------------------------------ timetable (model): a busy junction with a hump yard
  const LINE = { M: { entry: "Нм", exit: "2ЧМ", name: "Мамут" }, B: { entry: "НБ", exit: "2ВБ", name: "Вадим" }, S: { entry: "Чс", exit: "2НС", name: "Сімферополь" }, F: { entry: "ЧВ", exit: "2ВЛ", name: "Владиславівка" } };
  const PLACE = { M: ["Мелітополь", "Запоріжжя-1", "Харків", "Київ", "Дніпропетровськ"], B: ["Вадим", "Армянськ", "Херсон"], S: ["Сімферополь", "Севастополь", "Євпаторія"], F: ["Владиславівка", "Феодосія", "Керч"] };
  const left = (ln) => ln === "M" || ln === "B";
  const parTo = (tl) => (left(tl) ? "even" : "odd");
  const single = (ln) => ln === "B" || ln === "F";
  function generate(seed, intensity, day) {
    const G = K.toolkit("DZH|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    const sk = (ln, inbound) => (single(ln) ? ln : ln + (inbound ? ">" : "<"));
    const gap = (ln) => (single(ln) ? 14 : 5);
    const busy = {};
    const freeTrk = (t, a, b) => (busy[t] || []).every(([x, y]) => b <= x || a >= y);
    const hold = (t, a, b) => (busy[t] = busy[t] || []).push([a, b]);
    const count = (t, a, b) => (busy[t] || []).filter(([x, y]) => !(b <= x || a >= y)).length;
    let mn = 0;
    const shunt = (t, job, extra) => ev.push(Object.assign({ time: K.hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" }, extra || {}));
    const num = (type, par) => G.num(type === "passenger" ? 1 : type === "electric" ? 6101 : type === "reserve" ? 4701 : 2001, type === "freight" ? 898 : type === "passenger" ? 180 : 398, par === "odd");
    const unslot2 = (fl, ta, tl, td) => { G.unslot(sk(fl, true), ta); if (td != null) G.unslot(sk(tl, false), td); };
    function through(type, fl, tl, t, stop, tracks) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stop + 3, gap(tl)); if (td == null) { G.unslot(sk(fl, true), ta); return false; }
      const par = parTo(tl), n = num(type, par);
      const e = { time: K.hm(ta), train: String(n), type, direction: par, action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        from: G.pick(PLACE[fl]), to: G.pick(PLACE[tl]), timeStatus: "generated", note: (stop ? "стоянка " + stop + " хв" : "без зупинки") + " · " + LINE[fl].name + " → " + LINE[tl].name };
      if (tracks) e.onlyTracks = tracks;
      ev.push(e);
      return true;
    }
    // a pair at this station: arrival (the consist stays), later the departure of the same consist
    function pairAt(type, fl, tl, t, stand, ready, tracks, jobs) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stand, gap(tl)); if (td == null || td > 1425) { unslot2(fl, ta, tl, td); return false; }
      const fr = tracks.filter((x) => freeTrk(x, ta - 6, td + 4));
      if (!fr.length) { unslot2(fl, ta, tl, td); return false; }
      const trk = G.pick(fr.slice(0, 3));
      hold(trk, ta - 6, td + 4);
      if (jobs === "loco" && !freeTrk("DEPOT", ta, ta + 45)) { unslot2(fl, ta, tl, td); return false; }
      const pin = left(fl) ? "odd" : "even", pout = parTo(tl);
      const c = String(num(type, pin)), back = jobs === "loco" ? c : String(num(type, pout));
      ev.push({ time: K.hm(ta), train: c, type, direction: pin, action: "arrive", consist: c, grp: c, ready, entry: LINE[fl].entry, recTrack: trk, onlyTracks: ready ? undefined : [trk], from: G.pick(PLACE[fl]), to: jobs === "loco" ? G.pick(PLACE[tl]) : "Джанкой", timeStatus: "generated",
        note: jobs === "loco" ? "стоянка зі зміною локомотива, відправлення о " + K.hm(td) : "кінцева: зворотний рейс № " + back + " о " + K.hm(td) });
      ev.push({ time: K.hm(td), train: back, type, direction: pout, action: "depart", consist: c, grp: c, exitTo: LINE[tl].exit, from: jobs === "loco" ? G.pick(PLACE[fl]) : "Джанкой", to: G.pick(PLACE[tl]), timeStatus: "generated",
        note: jobs === "loco" ? "після зміни локомотива" : "відправлення состава поїзда № " + c });
      if (jobs === "loco") { hold("DEPOT", ta, ta + 45); shunt(ta + 3, "LOCO_OUT", { consist: c, grp: c, note: "відчеплення локомотива поїзда № " + c }); shunt(ta + 10, "LOCO_IN", { consist: c, grp: c, note: "локомотив під поїзд № " + c }); }
      return true;
    }
    // a freight train from Мамут / Вадим ends here: humped into the yard, later a new train is formed from it
    function sorting(fl, t) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const tr = ta + 4, tf = tr + G.ri(70, 150), east = G.r() < 0.6;
      const tl = east ? (G.r() < 0.75 ? "S" : "F") : (G.r() < 0.75 ? "M" : "B");
      const td = G.slot(sk(tl, false), tf + (east ? G.ri(25, 35) : G.ri(70, 85)), gap(tl));
      const trk = FR.slice(0, 5).find((x) => freeTrk(x, ta - 6, tr + 25));
      const wtrk = east ? null : FR.find((x) => x !== trk && freeTrk(x, tf + 20, (td || 0) + 4));
      if (td == null || td > 1425 || !trk || (!east && !wtrk) || !freeTrk("HUMP", tr, tr + 40) || count("YARD", tr, td) >= 7 || !freeTrk("LOCOR", tf, tf + 35) || (!east && !freeTrk("DEPOT", tf + 40, tf + 70))) { unslot2(fl, ta, tl, td); return false; }
      hold(trk, ta - 6, tr + 25); hold("HUMP", tr, tr + 40); hold("YARD", tr, td); hold("LOCOR", tf, tf + 35); if (wtrk) { hold(wtrk, tf + 20, td + 4); hold("DEPOT", tf + 40, tf + 70); }
      const c = String(num("freight", "odd")), o = String(num("freight", parTo(tl)));
      ev.push({ time: K.hm(ta), train: c, type: "freight", direction: "odd", action: "arrive", consist: c, grp: c, ready: false, entry: LINE[fl].entry, recTrack: trk, onlyTracks: [trk], from: G.pick(PLACE[fl]), to: "Джанкой", timeStatus: "generated",
        note: "на розформування: через гірку в сортувальний парк" });
      shunt(tr, "ROZF", { consist: c, grp: c, note: "розформування поїзда № " + c });
      if (east) {
        shunt(tf, "FORM", { consist: c, grp: c, note: "формування поїзда № " + o + " (локомотив з колії 1Т / 2Т)" });
        ev.push({ time: K.hm(td), train: o, type: "freight", direction: "odd", action: "depart", consist: "Р-" + c, grp: c, exitTo: LINE[tl].exit, from: "Джанкой", to: G.pick(PLACE[tl]), timeStatus: "generated",
          note: "сформований у сортувальному парку" });
      } else {
        shunt(tf, "FORMW", { consist: c, grp: c, out: "Ф-" + o, note: "состав з сортувального парку → поїзд № " + o });
        shunt(tf + 40, "LOCO_IN", { consist: "Ф-" + o, grp: c, note: "локомотив з депо під поїзд № " + o });
        ev.push({ time: K.hm(td), train: o, type: "freight", direction: "even", action: "depart", consist: "Ф-" + o, grp: c, exitTo: LINE[tl].exit, from: "Джанкой", to: G.pick(PLACE[tl]), timeStatus: "generated",
          note: "сформований у сортувальному парку, виставлений на колію відправлення" });
      }
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 8 && !f(i, n); a++); };
    const ms = () => (G.r() < 0.5 ? ["M", "S"] : ["S", "M"]);
    // passenger trains Мелітополь — Крим with long stands; trains from Сімферополь to Мамут change the locomotive
    tryN(Math.round(5 * k), () => { const [f, t] = ms(); return through("passenger", f, t, G.ri(0, 1400), G.ri(10, 20)); });
    tryN(Math.max(1, Math.round(1.5 * k)), () => { const [f, t] = G.r() < 0.5 ? ["M", "F"] : ["F", "M"]; return through("passenger", f, t, G.ri(200, 1300), G.ri(10, 15)); });
    tryN(Math.max(2, Math.round(3 * k)), () => pairAt("passenger", G.r() < 0.8 ? "S" : "F", G.r() < 0.85 ? "M" : "B", G.ri(200, 1300), G.ri(28, 38), false, PAS, "loco"));
    // suburban electric trains: Мамут — Джанкой into the Приміський парк; Сімферополь and Владиславівка into the southern park
    tryN(Math.max(6, Math.round(12 * k)), (i, n) => pairAt("electric", "M", "M", 260 + (i + 0.5) * (1120 / n) + G.ri(-10, 10), G.ri(20, 45), true, PRIMT, null));
    tryN(Math.max(1, Math.round(2 * k)), () => pairAt("electric", "B", "B", G.ri(300, 1300), G.ri(25, 50), true, PRIMT, null));
    tryN(Math.max(4, Math.round(7 * k)), (i, n) => { const f = G.r() < 0.7 ? "S" : "F"; return pairAt("electric", f, f, 270 + (i + 0.5) * (1100 / n) + G.ri(-10, 10), G.ri(20, 45), true, UP, null); });
    tryN(Math.max(1, Math.round(2 * k)), () => { const [f, t] = ms(); return through("electric", f, t, G.ri(300, 1350), G.ri(2, 4), UP.concat(PAS)); });
    // freight: through trains, locomotive changes, trains for the hump
    tryN(Math.max(4, Math.round(7 * k)), () => { const [f, t] = G.r() < 0.8 ? ms() : (G.r() < 0.5 ? ["B", "S"] : ["F", "M"]); return through("freight", f, t, G.ri(0, 1420), G.r() < 0.3 ? G.ri(10, 25) : 0, FR.slice(0, 5)); });
    tryN(Math.max(1, Math.round(2 * k)), () => pairAt("freight", G.r() < 0.7 ? "S" : "F", G.r() < 0.8 ? "M" : "B", G.ri(100, 1300), G.ri(35, 50), false, ["9ЮП", "10ЮП", "11ЮП"], "loco"));
    tryN(Math.max(4, Math.round(8 * k)), (i, n) => sorting(G.r() < 0.75 ? "M" : "B", 120 + (i + 0.5) * (1050 / n) + G.ri(-20, 20)));
    tryN(Math.max(1, Math.round(2 * k)), () => { const [f, t] = ms(); return through("reserve", f, t, G.ri(0, 1420), 0, ["IЮП", "12ЮП", "11ЮП"]); });
    // local shunting: deliveries and pickups
    const JOBS = [["ЕЧК", "ЕЧКП", "ЕЧК", "VАП"], ["ВЧ1", "ВЧ1П", "DEPOT", null], ["ВЧ2", "ВЧ2П", "DEPOT", null], ["МВ", "МВП", "МВ", null]];
    const nJ = Math.max(4, Math.round(8 * k)), used = {};
    for (let i = 0; i < nJ; i++) {
      const t = 330 + (i + 0.5) * (950 / nJ) + G.ri(-20, 20);
      const ok = JOBS.filter(([a, , base]) => (used[a] || 0) < 2 && freeTrk("J" + base, t - 5, t + 40) && (base !== "DEPOT" || freeTrk("DEPOT", t - 5, t + 30)));
      if (!ok.length) continue;
      const [a, b, base, trk] = G.pick(ok);
      const tp = t + G.ri(120, 240);
      if (trk && !freeTrk(trk, t - 5, tp + 40)) continue;
      used[a] = (used[a] || 0) + 1;
      if (trk) hold(trk, t - 5, tp + 40);
      hold("J" + base, t - 5, t + 40); if (base === "DEPOT") hold("DEPOT", t - 5, t + 30); shunt(t, a);
      if (b && tp < 1390 && freeTrk("J" + base, tp - 5, tp + 40)) { hold("J" + base, tp - 5, tp + 40); if (base === "DEPOT") hold("DEPOT", tp - 5, tp + 30); shunt(tp, b); }
    }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "dzhankoi_" + seed + "_" + intensity + "_d" + day, station: "Джанкой", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.dzhankoi = { id: "dzhankoi", name: "Джанкой", note: "велика вузлова: 4 лінії, Приміський і Південний парки, гірка, сортувальний парк, депо", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

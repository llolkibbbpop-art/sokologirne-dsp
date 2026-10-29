/*
 * Станція Бердянськ (тупикова), transcribed from the station plan «Дата кор. 14.04.2015».
 * Coordinates are a square (45°) schematic drawn after the plan; the order of switches,
 * tracks, signals and their sides follow the plan. Track lengths (m) are from the plan.
 *
 * All trains arrive from Берда/Пологи (single-track line, entry signal Н) and leave back the
 * same way through the exit signals Ч1–Ч7. Loco-hauled trains need a runaround (обгін
 * локомотива) through the right throat; freight wagons are taken to the port (колії 19, 1а)
 * and brought back to form departing trains. Blue tracks on the plan (21–23) are port tracks.
 *
 * Model choices (not from the plan): block division (one block per track), train lengths,
 * the timetable, which tracks a train type uses, and the shunting scenarios.
 */
(function () {
  "use strict";
  const T = {
    id: "berdyansk",
    station: "Бердянськ",
    planDate: "14.04.2015",
    terminal: true,
    shuntToTracks: true,
    lineArrivalParity: "odd",
    directions: { left: { name: "Берда (Пологи)", parity: "парний — відправлення", note: "plan" } },
    nodes: {
      // single-track line from Берда / Пологи and the left throat
      A0: [-150, 310], AP: [-55, 310], A1: [40, 310], M3n: [240, 310], S1: [290, 310], S3: [360, 310], S9: [420, 310],
      S5: [325, 345], S7: [360, 380], S11: [455, 275], S13: [520, 275],
      X3a: [500, 170], X11a: [525, 205], X13a: [555, 240],
      S15: [150, 380], M1n: [110, 380], H15: [40, 380], X10: [185, 415], H10: [270, 415],
      // park tracks: left ends (exit signals Ч) and right ends (shunting signals)
      C7: [600, 170], C6: [600, 205], C5: [600, 240], C4: [600, 275], C3: [600, 310], C2: [600, 345], C1: [600, 380],
      R7: [1460, 170], R6: [1460, 205], R5: [1460, 240], R4: [1460, 275], R3: [1450, 310], R2: [1460, 345], R1: [1430, 380],
      H8: [700, 135], R8: [1460, 135], H11: [700, 100], S46: [790, 100], J46: [830, 100], R11: [1440, 100], X26: [755, 65], H26: [690, 65],
      // right throat: switches 36, 30, 22, 18 and the ladder 34–32–28–26–38–20
      X11b: [1475, 100], S36: [1510, 135], X36: [1525, 135], S30: [1560, 170], X6: [1575, 205], S22: [1610, 170], M8n: [1650, 170], S18: [1700, 170],
      S20: [1665, 205], M10n: [1648, 222], S38: [1630, 240], S26: [1595, 275], S40: [1520, 275], X3r: [1485, 310], S28: [1560, 310],
      S32: [1525, 345], S34: [1490, 380], M12n: [1625, 310], M20n: [1545, 380], X20: [1700, 240], M6n: [1730, 240],
      // tracks 13, 14, 16 and the yard 15/17 → 17а
      X13r: [1870, 240], S10: [1940, 310], S12: [1870, 310], X16: [1800, 380], S8: [2000, 310], X8: [2035, 275], X15: [2185, 275],
      S6: [2220, 310], J6: [2240, 290],
      // switches 14, 16, 202, 4, 204, 2: tracks 18/18а and the port (19, 1а)
      S14: [1800, 170], X14m: [1835, 205], M2n: [1858, 205], S202: [1910, 205], X202: [1945, 240], S4: [2290, 240], S204: [2325, 205],
      S2: [2400, 205], X2: [2450, 155], H19: [2620, 155], X2m: [2470, 275], H1a: [2650, 275],
      // switches 16, 104, 106, 206: port tracks 21–23, dead ends 25 and 25а
      S16: [1850, 170], S104: [1920, 170], X104: [1990, 100], H21: [2200, 100], S106: [1990, 170], H23: [2240, 170], X106: [2025, 135], H22: [2220, 135],
      S206: [1920, 100], H25a: [1840, 100], X25: [1955, 65], M4n: [1990, 65], H25: [2090, 65]
    },
    edges: [
      ["A0", "AP", "2БП"], ["AP", "A1", "1БП"], ["A1", "M3n", "НІП"], ["M3n", "S1", "1СП"],
      ["S1", "S3", "3СП"], ["S3", "X3a", "3СП"], ["X3a", "C7", "3СП"],
      ["S3", "S9", "9СП"], ["S9", "C3", "9СП"],
      ["S9", "S11", "11СП"], ["S11", "X11a", "11СП"], ["X11a", "C6", "11СП"],
      ["S11", "S13", "13СП"], ["S13", "C4", "13СП"], ["S13", "X13a", "13СП"], ["X13a", "C5", "13СП"],
      ["S1", "S5", "5СП"], ["S5", "C2", "5СП"], ["S5", "S7", "7СП"], ["S7", "C1", "7СП"],
      ["S7", "S15", "29П"], ["H15", "M1n", "15Т"], ["M1n", "S15", "15СП"], ["S15", "X10", "10П"], ["X10", "H10", "10П"],
      ["C7", "R7", "7П"], ["C6", "R6", "6П"], ["C5", "R5", "5П"], ["C4", "R4", "4П"], ["C3", "R3", "IIIП"], ["C2", "R2", "2П"], ["C1", "R1", "1П"],
      ["H8", "R8", "8П"], ["H11", "S46", "46СП"], ["S46", "J46", "46СП"], ["J46", "R11", "11П"], ["S46", "X26", "26П"], ["X26", "H26", "26П"],
      ["R11", "X11b", "36СП"], ["X11b", "S36", "36СП"], ["R8", "S36", "36СП"], ["S36", "X36", "36СП"],
      ["X36", "S30", "30СП"], ["R7", "S30", "30СП"], ["S30", "S22", "30СП"],
      ["R6", "X6", "22СП"], ["X6", "S22", "22СП"], ["S22", "M8n", "22СП"],
      ["M8n", "S18", "14-18СП"], ["S18", "S20", "14-18СП"], ["S18", "S14", "14-18СП"],
      ["S20", "M10n", "20СП"], ["S20", "X20", "20СП"], ["X20", "M6n", "20СП"],
      ["M10n", "S38", "38СП"], ["R5", "S38", "38СП"],
      ["S38", "S26", "26СП"], ["S26", "S28", "26СП"],
      ["S26", "S40", "40СП"], ["R4", "S40", "40СП"], ["R3", "X3r", "40СП"], ["X3r", "S40", "40СП"],
      ["S28", "S32", "28-32СП"], ["S28", "M12n", "28-32СП"], ["R2", "S32", "28-32СП"],
      ["S32", "S34", "34СП"], ["R1", "S34", "34СП"], ["S34", "M20n", "34СП"],
      ["M12n", "S12", "14П"], ["M20n", "X16", "16П"], ["X16", "S12", "16П"], ["S12", "S10", "12СП"],
      ["M6n", "X13r", "13П"], ["X13r", "S10", "13П"], ["S10", "S8", "8-10СП"], ["S8", "X8", "8-10СП"],
      ["X8", "X15", "15П"], ["X15", "S6", "6СП"], ["S8", "S6", "17П"], ["S6", "J6", "6СП"], ["J6", "S4", "17аП"],
      ["S14", "X14m", "14СП"], ["X14m", "M2n", "14СП"], ["M2n", "S202", "202СП"], ["S202", "S204", "18аП"],
      ["S202", "X202", "202СП"], ["X202", "S4", "18П"], ["S4", "S204", "4СП"],
      ["S204", "S2", "2-204СП"], ["S2", "X2", "2-204СП"], ["X2", "H19", "19П"], ["S2", "X2m", "2-204СП"], ["X2m", "H1a", "1аП"],
      ["S14", "S16", "16СП"], ["S16", "S104", "104СП"], ["S104", "S106", "106СП"], ["S104", "X104", "21П"], ["X104", "H21", "21П"],
      ["S106", "H23", "23П"], ["S106", "X106", "22П"], ["X106", "H22", "22П"],
      ["S16", "S206", "206СП"], ["H25a", "S206", "25аП"], ["S206", "X25", "206СП"], ["X25", "M4n", "206СП"], ["M4n", "H25", "25П"]
    ],
    sectionInfo: {
      "2БП": { kind: "line", len: 1300, label: "Перегін Берда — Бердянськ, 2-й блок (одноколійний)", source: "derived" },
      "1БП": { kind: "line", len: 900, label: "Перегін Берда — Бердянськ, 1-й блок (одноколійний)", source: "derived" },
      "НІП": { kind: "switchless", len: 150, label: "Безстрілочна ділянка за вхідним Н", source: "derived" },
      "1П": { kind: "track", len: 571, label: "Колія 1 (571 м, біля платформи)", source: "plan" },
      "2П": { kind: "track", len: 614, label: "Колія 2 (614 м, біля платформи)", source: "plan" },
      "IIIП": { kind: "track", len: 641, label: "Колія III (641 м, головна)", source: "plan" },
      "4П": { kind: "track", len: 503, label: "Колія 4 (503 м)", source: "plan" },
      "5П": { kind: "track", len: 599, label: "Колія 5 (599 м)", source: "plan" },
      "6П": { kind: "track", len: 659, label: "Колія 6 (659 м)", source: "plan" },
      "7П": { kind: "track", len: 666, label: "Колія 7 (666 м)", source: "plan" },
      "8П": { kind: "track", len: 364, label: "Колія 8 (364 м, тупик з боку МПК)", source: "plan" },
      "11П": { kind: "track", len: 268, label: "Колія 11 (268 м, тупик з боку МПК)", source: "plan" },
      "26П": { kind: "track", len: 150, label: "Колія 26 — під'їзна колія (на плані «П/К не діє»)", source: "plan" },
      "13П": { kind: "track", len: 233, label: "Колія 13 (233 м)", source: "plan" },
      "14П": { kind: "track", len: 323, label: "Колія 14 (323 м)", source: "plan" },
      "15П": { kind: "track", len: 147, label: "Колія 15 (147 м)", source: "plan" },
      "16П": { kind: "track", len: 464, label: "Колія 16 (464 м, контейнерний майданчик)", source: "plan" },
      "17П": { kind: "track", len: 147, label: "Колія 17 (147 м)", source: "plan" },
      "17аП": { kind: "track", len: 78, label: "Колія 17а (78 м)", source: "plan" },
      "18П": { kind: "track", len: 353, label: "Колія 18 (353 м)", source: "plan" },
      "18аП": { kind: "track", len: 372, label: "Колія 18а (372 м)", source: "plan" },
      "19П": { kind: "track", len: 475, label: "Колія 19 (475 м, на порт через переїзд Стр№2 + 198 м)", source: "plan" },
      "1аП": { kind: "track", len: 400, label: "Колія 1а — на під'їзну колію (1) порту (на плані «П/К (1) діє»; довжина 2403 м, у моделі скорочено)", source: "plan" },
      "21П": { kind: "track", len: 220, label: "Колія 21 (порт, на плані виділено синім)", source: "plan" },
      "22П": { kind: "track", len: 200, label: "Колія 22 (порт, на плані виділено синім)", source: "plan" },
      "23П": { kind: "track", len: 220, label: "Колія 23 (порт, на плані виділено синім)", source: "plan" },
      "25П": { kind: "track", len: 120, label: "Колія 25 (тупик)", source: "plan" },
      "25аП": { kind: "track", len: 80, label: "Колія 25а (тупик)", source: "plan" },
      "29П": { kind: "track", len: 82, label: "Колія 29 (82 м)", source: "plan" },
      "10П": { kind: "track", len: 34, label: "Колія 10 (34 м, тупик)", source: "plan" },
      "15Т": { kind: "track", len: 40, label: "Короткий тупик біля стрілки 15 (за М1)", source: "plan" }
    },
    // common = point side; plus = straight; minus = diverging (from the drawing)
    switches: [
      { id: "1", node: "S1", common: "M3n", plus: "S3", minus: "S5", label: -1 },
      { id: "3", node: "S3", common: "S1", plus: "S9", minus: "X3a", label: 1 },
      { id: "9", node: "S9", common: "S3", plus: "C3", minus: "S11", label: 1 },
      { id: "11", node: "S11", common: "S9", plus: "S13", minus: "X11a", label: 1 },
      { id: "13", node: "S13", common: "S11", plus: "C4", minus: "X13a", label: 1 },
      { id: "5", node: "S5", common: "S1", plus: "C2", minus: "S7", label: 1 },
      { id: "7", node: "S7", common: "C1", plus: "S15", minus: "S5", label: 1 },
      { id: "15", node: "S15", common: "M1n", plus: "S7", minus: "X10", label: -1 },
      { id: "46", node: "S46", common: "J46", plus: "H11", minus: "X26", label: 1 },
      { id: "36", node: "S36", common: "X36", plus: "R8", minus: "X11b", label: -1 },
      { id: "30", node: "S30", common: "S22", plus: "R7", minus: "X36", label: -1, lockOut: true },
      { id: "22", node: "S22", common: "M8n", plus: "X6", minus: "S30", label: -1, lockOut: true },
      { id: "18", node: "S18", common: "S14", plus: "M8n", minus: "S20", label: -1 },
      { id: "20", node: "S20", common: "M10n", plus: "S18", minus: "X20", label: -1 },
      { id: "38", node: "S38", common: "M10n", plus: "S26", minus: "R5", label: -1 },
      { id: "26", node: "S26", common: "S38", plus: "S28", minus: "S40", label: -1 },
      { id: "40", node: "S40", common: "S26", plus: "R4", minus: "X3r", label: 1 },
      { id: "28", node: "S28", common: "S32", plus: "S26", minus: "M12n", label: 1 },
      { id: "32", node: "S32", common: "S28", plus: "S34", minus: "R2", label: -1 },
      { id: "34", node: "S34", common: "R1", plus: "M20n", minus: "S32", label: 1 },
      { id: "12", node: "S12", common: "S10", plus: "M12n", minus: "X16", label: 1 },
      { id: "10", node: "S10", common: "S8", plus: "S12", minus: "X13r", label: 1 },
      { id: "8", node: "S8", common: "S10", plus: "S6", minus: "X8", label: 1 },
      { id: "6", node: "S6", common: "J6", plus: "S8", minus: "X15", label: 1 },
      { id: "14", node: "S14", common: "S18", plus: "S16", minus: "X14m", label: 1 },
      { id: "202", node: "S202", common: "M2n", plus: "S204", minus: "X202", label: 1 },
      { id: "4", node: "S4", common: "S204", plus: "X202", minus: "J6", label: -1 },
      { id: "204", node: "S204", common: "S2", plus: "S202", minus: "S4", label: -1 },
      { id: "2", node: "S2", common: "S204", plus: "X2", minus: "X2m", label: 1 },
      { id: "16", node: "S16", common: "S14", plus: "S104", minus: "S206", label: -1 },
      { id: "104", node: "S104", common: "S16", plus: "S106", minus: "X104", label: 1 },
      { id: "106", node: "S106", common: "S104", plus: "H23", minus: "X106", label: 1 },
      { id: "206", node: "S206", common: "X25", plus: "S16", minus: "H25a", label: 1, lockOut: true }
    ],
    // dir R = towards the right (into the station), L = towards Берда; side: drawn below (+1) / above (−1)
    signals: [
      { id: "Н", node: "A1", dir: "R", side: 1, kind: "entry", approachChain: ["2БП", "1БП"], source: "plan" },
      { id: "М3", node: "M3n", dir: "R", side: 1, kind: "shunt", source: "plan", note: "за ним маневровий рейс повертає з безстрілочної ділянки НІП у парк (обгін локомотива)" },
      { id: "М1", node: "M1n", dir: "R", side: 1, kind: "shunt", source: "plan", note: "виїзд з тупика біля стрілки 15 на колії 29 і 10" },
      { id: "Ч1", node: "C1", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч2", node: "C2", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч3", node: "C3", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч4", node: "C4", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч5", node: "C5", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч6", node: "C6", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "Ч7", node: "C7", dir: "L", side: -1, kind: "exit", source: "plan" },
      { id: "М30", node: "R1", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М28", node: "R2", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М24", node: "R3", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М22", node: "R4", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М16", node: "R5", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М14", node: "R6", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М26", node: "R7", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М34", node: "R8", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М32", node: "R11", dir: "R", side: 1, kind: "shunt", source: "plan" },
      { id: "М8", node: "M8n", dir: "L", side: -1, kind: "shunt", source: "plan" },
      { id: "М10", node: "M10n", dir: "L", side: -1, dx: -34, kind: "shunt", source: "plan" },
      { id: "М12", node: "M12n", dir: "L", side: -1, kind: "shunt", source: "plan" },
      { id: "М6", node: "M6n", dir: "L", side: -1, kind: "shunt", source: "plan" },
      { id: "М20", node: "M20n", dir: "L", side: -1, kind: "shunt", source: "plan" },
      { id: "М2", node: "M2n", dir: "L", side: -1, kind: "shunt", source: "plan", note: "виїзд з колій 18, 18а і з порту (19, 1а) у бік парку" },
      { id: "М4", node: "M4n", dir: "L", side: -1, kind: "shunt", source: "plan", note: "на плані біля тупика 25а; у моделі — виїзд з тупика 25" }
    ],
    markers: [],
    endButtons: [
      { id: "ВБ", node: "A1", dx: -100, side: -1, label: "відпр. на БЕРДУ", note: "кнопка кінця маршруту відправлення на Берду (Пологи)" }
    ],
    routes: [
      { id: "Н→1", from: "Н", to: "1П", type: "train", ends: ["М30", "1П"], path: ["A1", "M3n", "S1", "S5", "S7", "C1", "R1"] },
      { id: "Н→2", from: "Н", to: "2П", type: "train", ends: ["М28", "2П"], path: ["A1", "M3n", "S1", "S5", "C2", "R2"] },
      { id: "Н→III", from: "Н", to: "IIIП", type: "train", ends: ["М24", "IIIП"], path: ["A1", "M3n", "S1", "S3", "S9", "C3", "R3"] },
      { id: "Н→4", from: "Н", to: "4П", type: "train", ends: ["М22", "4П"], path: ["A1", "M3n", "S1", "S3", "S9", "S11", "S13", "C4", "R4"] },
      { id: "Н→5", from: "Н", to: "5П", type: "train", ends: ["М16", "5П"], path: ["A1", "M3n", "S1", "S3", "S9", "S11", "S13", "X13a", "C5", "R5"] },
      { id: "Н→6", from: "Н", to: "6П", type: "train", ends: ["М14", "6П"], path: ["A1", "M3n", "S1", "S3", "S9", "S11", "X11a", "C6", "R6"] },
      { id: "Н→7", from: "Н", to: "7П", type: "train", ends: ["М26", "7П"], path: ["A1", "M3n", "S1", "S3", "X3a", "C7", "R7"] },
      { id: "Ч1→", from: "Ч1", to: "2БП", type: "train", ends: ["ВБ"], path: ["C1", "S7", "S5", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч2→", from: "Ч2", to: "2БП", type: "train", ends: ["ВБ"], path: ["C2", "S5", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч3→", from: "Ч3", to: "2БП", type: "train", ends: ["ВБ"], path: ["C3", "S9", "S3", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч4→", from: "Ч4", to: "2БП", type: "train", ends: ["ВБ"], path: ["C4", "S13", "S11", "S9", "S3", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч5→", from: "Ч5", to: "2БП", type: "train", ends: ["ВБ"], path: ["C5", "X13a", "S13", "S11", "S9", "S3", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч6→", from: "Ч6", to: "2БП", type: "train", ends: ["ВБ"], path: ["C6", "X11a", "S11", "S9", "S3", "S1", "M3n", "A1", "AP", "A0"] },
      { id: "Ч7→", from: "Ч7", to: "2БП", type: "train", ends: ["ВБ"], path: ["C7", "X3a", "S3", "S1", "M3n", "A1", "AP", "A0"] }
    ],
    exitSignals: { odd: {}, even: { "1П": "Ч1", "2П": "Ч2", "IIIП": "Ч3", "4П": "Ч4", "5П": "Ч5", "6П": "Ч6", "7П": "Ч7" } },
    entrySignal: { odd: "Н" },
    labels: [
      ["11 268", 1080, 95], ["8 364", 1080, 130], ["7 666", 1080, 165], ["6 659", 1080, 200], ["5 599", 1080, 235], ["4 503", 1080, 270],
      ["III 641", 1080, 305], ["2 614", 1080, 340], ["1 571", 1080, 375], ["14 323", 1740, 305], ["16 464", 1660, 375], ["13 233", 1800, 235],
      ["18а 372", 2110, 200], ["18 353", 2110, 235], ["15 147", 2110, 270], ["17 147", 2110, 305], ["19 475", 2540, 150], ["1а", 2560, 270],
      ["21 порт", 2100, 95], ["22 порт", 2125, 130], ["23 порт", 2125, 165], ["25", 2045, 60], ["25а", 1862, 95], ["29 82", 228, 375], ["10 34", 228, 410], ["26", 720, 60]
    ],
    view: {
      box: [-165, 40, 2865, 400],
      platforms: [[760, 357, 420, 11], [600, 393, 650, 14]],
      notes: [[-150, 262, "← БЕРДА · ПОЛОГИ (відправлення — парні)"], [565, 432, "Пост ЕЦ"], [1640, 425, "Контейнерний майданчик (16)"],
        [2470, 130, "→ порт (переїзд Стр№2 + 198 м)"], [2480, 300, "→ П/К (1) порту діє"], [640, 55, "П/К не діє"], [700, 90, "МПК"], [700, 125, "МПК"],
        [2300, 292, "17а 78"]],
      borders: [],
      blockLabels: [["2БП", -105, 310, 20], ["1БП", -10, 310, 20]],
      graph: ["Берда", "Бердянськ"]
    },
    radio: {
      sides: { B: { name: "Берда", from: "Берди", dsp: "Шевченко", inc: 30 } },
      odd: { back: "B", fwd: null }, even: { back: null, fwd: "B" }
    }
  };

  Object.entries(T.sectionInfo).forEach(([id, si]) => { if (si.kind === "track") si.group = id; });

  // ------------------------------------------------------------ model parameters
  const EXITS = ["Ч1", "Ч2", "Ч3", "Ч4", "Ч5", "Ч6", "Ч7"];
  const P = {
    directionParity: { arr: "odd", dep: "even" },
    directionLabel: { arr: "прибуття", dep: "відправлення", station: "по станції" },
    trackPreference: { odd: ["2П", "1П", "IIIП", "4П", "5П", "6П", "7П"], even: [] },
    // which tracks a train type is received on (model choice)
    typeTracks: { passenger: ["2П", "1П"], suburban: ["1П", "2П"], freight: ["5П", "4П", "6П", "7П", "IIIП"], household: ["5П", "4П", "IIIП", "6П"], reserve: ["IIIП", "4П", "5П", "6П"], test: ["IIIП"] },
    recommendedTrack: { passenger: { odd: "2П" }, suburban: { odd: "1П" }, freight: { odd: "5П" }, household: { odd: "4П" }, reserve: { odd: "IIIП" } },
    appearLeadMin: { passenger: 5, suburban: 5, freight: 7, household: 7, reserve: 5, shunting: 1, test: 5 },
    departLeadMin: 6,
    terminateSec: 90,
    speedKmh: { passenger: 50, suburban: 50, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 },
    minSectionSec: 8,
    tailSec: 10,
    cancelDelaySec: 180,
    cancelDelayShuntSec: 60,
    platformTracks: ["1П", "2П"],
    mainTracks: ["1П", "2П", "IIIП"],
    trainBlocks: { passenger: [2, 3], suburban: [1, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180,
    shuntWaitSec: 300,
    shuntingEnabledByDefault: true,
    switchTransferSec: 4,
    cancelFreeSec: 6,
    invitationSec: 90,
    divergingKmh: 40,
    shuntingJobs: {
      // dynamic jobs: the plan depends on the track where the consist actually stands
      RUN: {
        name: "Обгін локомотива: перечеплення в голову состава для зворотного рейсу",
        estSec: 1500,
        build({ S, ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "состав " + ev.ev.consist + " ще не прибув" };
          if (S.sec[sec].wagons.ready) return { skip: "состав уже готовий" };
          const own = T.exitSignals.even[sec];
          if (!own) return { wait: "состав стоїть на колії без виходу на перегін" };
          return { start: sec, onWagons: true, plan: [
            { sig: "@R", end: ["13П", "25П", "18аП", "18П", "19П", "1аП"], free: true, txt: "відчепитися і виїхати в правий бік на вільну колію (13, тупик 25, 18а, 18)" },
            { sig: "@L", end: EXITS.filter((x) => x !== own), free: true, txt: "по вільній колії парку до її лівого кінця" },
            { sig: "@L", end: "Н", txt: "через ліву горловину за М3 (ділянка НІП)" },
            { sig: "М3", end: sec, txt: "назад на свою колію до состава" },
            { attach: true }
          ] };
        }
      },
      PORT: {
        name: "Подача вагонів прибулого поїзда в порт (колія 19 або 1а)",
        estSec: 1500,
        build({ S, ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
          return { start: sec, onWagons: true, plan: [
            { couple: true },
            { sig: "@R", end: ["19П", "1аП"], free: true, txt: "через праву горловину, 18 або 18а, стрілку 2 — у порт" },
            { leave: true, consist: "П-" + ev.ev.consist },
            { wait: 60 },
            { sig: "@L", end: ["11П", "8П", "13П"], free: true, txt: "локомотив з порту через М2 на колію 11 або 8" }
          ] };
        }
      },
      PORTBACK: {
        name: "Прибирання вагонів з порту і виставлення поїзда на колію відправлення",
        estSec: 1800,
        build({ S, ev, findConsist, secBusy }) {
          const ws = findConsist("П-" + ev.ev.consist);
          if (!ws) return { wait: "вагонів " + ev.ev.consist + " ще немає в порту" };
          const start = ["11П", "8П"].find((s) => !secBusy(S.sec[s]) && !S.sec[s].lock);
          if (!start) return { wait: "колії 11 і 8 зайняті — локомотиву нема де стати" };
          return { start, plan: [
            { sig: "@R", end: ws, txt: "локомотив у порт до вагонів" },
            { couple: true },
            { wait: 120 },
            { sig: "@L", end: ["Ч5", "Ч4", "Ч6", "Ч7", "Ч3"], free: true, txt: "через М2 на вільну колію парку до вихідного світлофора" },
            { leave: true, consist: ev.ev.out, ready: true }
          ] };
        }
      },
      // static jobs
      "Т25": { name: "Подача вагонів у тупик 25 з колії 8", start: "8П", plan: [{ sig: "М34", end: "25П" }, { leave: true }, { wait: 60 }, { sig: "М4", end: "8П" }] },
      "Т25П": { name: "Прибирання вагонів з тупика 25 на колію 8", start: "8П", plan: [{ sig: "М34", end: "25П" }, { couple: true }, { wait: 120 }, { sig: "М4", end: "8П" }] },
      "П21": { name: "Подача вагонів на колію 21 порту з колії 11", start: "11П", plan: [{ sig: "М32", end: "21П" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "11П" }] },
      "П21П": { name: "Прибирання вагонів з колії 21 порту на колію 11", start: "11П", plan: [{ sig: "М32", end: "21П" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "11П" }] },
      "П22": { name: "Подача вагонів на колію 22 порту з колії 11", start: "11П", plan: [{ sig: "М32", end: "22П" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "11П" }] },
      "П22П": { name: "Прибирання вагонів з колії 22 порту на колію 11", start: "11П", plan: [{ sig: "М32", end: "22П" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "11П" }] },
      "П23": { name: "Подача вагонів на колію 23 порту з колії 8", start: "8П", plan: [{ sig: "М34", end: "23П" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "8П" }] },
      "П23П": { name: "Прибирання вагонів з колії 23 порту на колію 8", start: "8П", plan: [{ sig: "М34", end: "23П" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "8П" }] },
      "18А": { name: "Подача вагонів на колію 18а з колії 8", start: "8П", plan: [{ sig: "М34", end: "18аП" }, { leave: true }, { wait: 60 }, { sig: "М2", end: "8П" }] },
      "18АП": { name: "Прибирання вагонів з колії 18а на колію 8", start: "8П", plan: [{ sig: "М34", end: "18аП" }, { couple: true }, { wait: 120 }, { sig: "М2", end: "8П" }] },
      "К16": { name: "Подача вагонів на контейнерний майданчик (колія 16) з колії 1", start: "1П", plan: [{ sig: "М30", end: "16П" }, { leave: true }, { wait: 60 }, { sig: "М20", end: "1П" }] },
      "К16П": { name: "Прибирання вагонів з контейнерного майданчика (16) на колію 1", start: "1П", plan: [{ sig: "М30", end: "16П" }, { couple: true }, { wait: 120 }, { sig: "М20", end: "1П" }] },
      "Л13": { name: "Маневровий локомотив: колія 5 → колія 13 (екіпірування) → колія 5", start: "5П", plan: [{ sig: "М16", end: "13П" }, { wait: 600 }, { sig: "М6", end: "5П" }] }
    }
  };

  // ------------------------------------------------------------ timetable generator (model)
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const hm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const LEVELS = { low: 0.6, medium: 1, high: 1.5 };
  const ENDS = {
    passenger: ["Київ", "Харків", "Дніпропетровськ", "Львів", "Запоріжжя-1"],
    suburban: ["Пологи", "Запоріжжя-1"],
    freight: ["Пологи", "Запоріжжя-Ліве", "Федорівка"],
    household: ["Пологи"],
    reserve: ["Пологи"]
  };

  function generate(seed, intensity, day) {
    const r = mulberry32(hash("BRD|" + seed + "|" + intensity + "|" + day));
    const k = LEVELS[intensity] || 1;
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const pick = (a) => a[ri(0, a.length - 1)];
    const ev = [];
    const used = new Set();
    const num = (base, span) => { for (let i = 0; i < 60; i++) { let n = base + ri(0, span); if (n % 2 === 0) n++; if (!used.has(n)) { used.add(n); return n; } } return base + 2 * used.size + 1; };
    // the single-track line: arrivals and departures at least 12 min apart
    const line = [];
    const lineSlot = (t) => { for (let i = 0; i < 40; i++, t += 4) if (t < 1425 && line.every((x) => Math.abs(x - t) >= 12)) { line.push(t); return t; } return null; };
    const busy = { "1П": [], "2П": [], port: [], cargo: [], "8П": [], "11П": [] };
    const free = (key, a, b, cap) => busy[key].filter(([x, y]) => !(b <= x || a >= y)).length < (cap || 1);
    let mn = 0;
    const shunt = (t, job, extra) => ev.push(Object.assign({ time: hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" }, extra || {}));
    function pair(type, a, stand, needRun) {
      const ta = lineSlot(a); if (ta == null) return false;
      const td = lineSlot(ta + stand); if (td == null || td > 1420) { line.splice(line.indexOf(ta), 1); return false; }
      let trk = null;
      if (type === "passenger" || type === "suburban") {
        trk = (type === "suburban" ? ["1П", "2П"] : ["2П", "1П"]).find((p) => free(p, ta - 8, td + 4));
        if (!trk) { line.splice(line.indexOf(ta), 1); line.splice(line.indexOf(td), 1); return false; }
        busy[trk].push([ta - 8, td + 4]);
      }
      const n = num(type === "passenger" ? 101 : type === "suburban" ? 6001 : type === "reserve" ? 4801 : 9601, 98);
      const where = pick(ENDS[type]);
      const c = String(n);
      ev.push({ time: hm(ta), train: c, type, direction: "arr", action: "arrive", consist: c, ready: !needRun, from: where, to: "Бердянськ", recTrack: trk || undefined, timeStatus: "generated",
        note: needRun ? "кінцева: після прибуття — обгін локомотива, зворотний рейс № " + (n + 1) + " о " + hm(td) : "кінцева: зворотний рейс № " + (n + 1) + " о " + hm(td) + " (обгін не потрібен)" });
      ev.push({ time: hm(td), train: String(n + 1), type, direction: "dep", action: "depart", consist: c, from: "Бердянськ", to: where, timeStatus: "generated",
        note: "відправлення состава поїзда № " + c + " (" + (trk ? "колія " + trk.replace("П", "") : "колія за фактом прибуття") + ")" });
      if (needRun) shunt(ta + ri(10, 15), "RUN", { consist: c, note: "обгін локомотива поїзда № " + c });
      return true;
    }
    // long-distance passenger trains: a long layover at the terminus
    const nP = Math.max(2, Math.round(3 * k));
    for (let i = 0; i < nP; i++) for (let tries = 0; tries < 6 && !pair("passenger", ri(300, 1080), ri(80, 220), true); tries++);
    // suburban diesel trains (cab at both ends: no runaround)
    const nS = Math.max(3, Math.round(5 * k));
    for (let i = 0; i < nS; i++) for (let tries = 0; tries < 6 && !pair("suburban", 300 + (i + 0.5) * (960 / nS) + ri(-30, 30), ri(25, 55), false); tries++);
    // reserve locomotives and a household train
    for (let i = 0; i < Math.max(1, Math.round(2 * k)); i++) pair("reserve", ri(60, 1200), ri(30, 120), false);
    if (r() < 0.6 * k) pair("household", ri(420, 900), ri(90, 180), true);
    // freight: arrival → wagons to the port → back from the port → departure
    const nF = Math.max(2, Math.round(4 * k));
    for (let i = 0; i < nF; i++) {
      for (let tries = 0; tries < 8; tries++) {
        const ta = lineSlot(ri(20, 1000)); if (ta == null) continue;
        const port = ta + ri(15, 25), back = port + ri(110, 220);
        const td = lineSlot(back + ri(40, 55));
        if (td == null || td > 1415 || !free("port", port, back + 10, 2) || !free("cargo", ta - 8, td, 3)) { line.splice(line.indexOf(ta), 1); if (td != null) line.splice(line.indexOf(td), 1); continue; }
        busy.port.push([port, back + 10]); busy.cargo.push([ta - 8, td]);
        const n = num(2001, 898), c = String(n), out = num(2001, 898) + 1, from = pick(ENDS.freight), to = pick(ENDS.freight);
        ev.push({ time: hm(ta), train: c, type: "freight", direction: "arr", action: "arrive", consist: c, ready: false, from, to: "Бердянськ (порт)", timeStatus: "generated",
          note: "вагони в порт; локомотив відчепити після подачі" });
        shunt(port, "PORT", { consist: c, note: "подача вагонів поїзда № " + c + " у порт" });
        shunt(back, "PORTBACK", { consist: c, out: "В-" + out, note: "вагони з порту → поїзд № " + out });
        ev.push({ time: hm(td), train: String(out), type: "freight", direction: "dep", action: "depart", consist: "В-" + out, from: "Бердянськ (порт)", to, timeStatus: "generated",
          note: "состав формується з вагонів, прибраних з порту" });
        break;
      }
    }
    // local shunting work: deliveries and later pickups
    const JOBS = [["Т25", "8П"], ["П21", "11П"], ["П22", "11П"], ["П23", "8П"], ["18А", "8П"], ["К16", "1П"], ["Л13", null]];
    const PICK = { "Т25": "Т25П", "П21": "П21П", "П22": "П22П", "П23": "П23П", "18А": "18АП", "К16": "К16П" };
    const loaded = {};
    const nJ = Math.round(6 * k);
    for (let i = 0; i < nJ; i++) {
      const t = 300 + (i + 0.5) * (1020 / nJ) + ri(-25, 25);
      const ok = JOBS.filter(([j, st]) => !loaded[j] && (!st || free(st, t - 5, t + 45)));
      if (!ok.length) continue;
      const [job, st] = pick(ok);
      if (st) busy[st].push([t - 5, t + 45]);
      shunt(t, job);
      if (PICK[job]) {
        const tp = t + ri(120, 240);
        if (tp < 1380 && (!st || free(st, tp - 5, tp + 45))) { loaded[job] = true; if (st) busy[st].push([tp - 5, tp + 45]); shunt(tp, PICK[job]); }
      }
    }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "berdyansk_generated_" + seed + "_" + intensity + "_d" + day, station: "Бердянськ", generated: true, events: ev };
  }

  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.berdyansk = { id: "berdyansk", name: "Бердянськ", TOPOLOGY: T, MODEL_PARAMS: P, generate };
})();

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
  // coordinates follow the plan: the main lines across the bottom, the branch to Генічеськ rising to the top
  const T = K.build({
    meta: { id: "novooleksiivka", station: "Новоолексіївка", planDate: "11.02.2015", shuntToTracks: true, rightParity: "odd", lockFrame: true, shuntStops: 5 },
    nodes: {
      // ---- left: lines to Партизани (upper — departures, lower — arrivals)
      A0u: [-150, 935], APu: [-55, 935], EU: [40, 935], A0l: [-150, 970], APl: [-55, 970], HN: [40, 970],
      M1n: [120, 935], M3n: [130, 970], S1: [180, 935], S3: [215, 970], S9: [310, 970], S11: [345, 1005], M17n: [390, 970], S13: [455, 970], S15: [490, 935],
      M25n: [545, 935], S23: [595, 935], H23: [130, 1005], M13n: [260, 1005], M19n: [470, 1005],
      // ---- the 4-line on the left: КМС-137, tracks 21 and 22
      K1: [320, 820], K1j: [375, 875], K1b: [400, 900], S7: [435, 900], S5: [400, 865], K2: [320, 785], K2j: [375, 840], L22: [440, 865], R22: [555, 865], L21: [470, 900], R21: [555, 900],
      S27: [590, 900], S25: [630, 900], M29n: [700, 900], S29: [770, 900], X8: [805, 865], S31: [990, 900], X6: [1025, 865],
      // ---- the 3-line throat on the left: 17, 19, 21
      S17: [600, 1005], S19: [730, 1005], X19: [765, 1040], S21: [670, 1075], X21: [705, 1110],
      // ---- station tracks: ends
      L4: [1060, 900], R4: [1600, 900], L2: [720, 935], R2: [1835, 935], L1: [760, 970], R1: [1990, 970],
      L3: [930, 1005], R3: [1720, 1005], L5: [900, 1040], R5: [1700, 1040], L7: [980, 1075], R7: [1640, 1075], L9: [950, 1110], R9: [1480, 1110],
      // ---- the branch to Генічеськ: 8 and VI on the left, 10 and 12 on the right, rising to 37, 35, 33
      L8: [895, 865], R8: [1170, 590], L6: [1035, 865], R6: [1300, 600], V6: [1360, 540],
      S37: [1360, 400], S33: [1360, 300], S35: [1400, 340], L12: [1430, 450], R12: [1545, 795], L10: [1480, 430], R10: [1580, 730],
      S48: [1600, 770], S32: [1575, 840], S30: [1635, 900], J26: [1660, 770], L26: [1700, 770], H26: [1800, 770],
      EG: [1365, 200], GP: [1370, 110], G0: [1375, 20],
      // ---- right: 4-line to 17 and 18
      S28: [1845, 900], M24n: [1890, 900], X28: [2000, 900], S2: [2035, 865], X2: [2070, 830], L18: [2075, 865], H18: [2280, 865], L17: [2110, 830], H17: [2500, 830],
      // ---- right throat: II and I lines, crossovers
      S26: [1880, 935], M22n: [2000, 935], S12: [2310, 935], S6: [2365, 935], M14n: [2420, 935],
      S22: [2125, 970], M20n: [2170, 970], S14: [2275, 970], S4: [2400, 970], M6n: [2445, 970],
      // ---- 3, 5, 7, 9 on the right; 13; 20/42; 15а and the П/К
      S34: [1870, 1005], M26n: [1925, 1005], S24: [2090, 1005], S38: [1835, 1040], S40: [1800, 1075], S42: [1765, 1110], S56: [1520, 1110],
      J13: [1460, 1170], H13: [1300, 1170], M30n: [1820, 1110], X20: [2120, 1110], M18n: [2175, 1055], S20: [2225, 1005],
      M16n: [2260, 1005], M38n: [2310, 1005], S60: [2335, 1005], S400: [2460, 1005], S320: [2570, 1005], H15b: [2680, 1005],
      MP3: [2360, 1030], HP3: [2430, 1100], MP1: [2485, 1030], HP1: [2555, 1100], MP2: [2595, 1030], HP2: [2665, 1100],
      // ---- right: lines to Салькове (upper — arrivals, lower — departures)
      CN: [2550, 935], BRu: [2690, 935], A1u: [2830, 935], EX: [2550, 970], BRl: [2690, 970], A1l: [2830, 970]
    },
    switches: [
      ["1", "S1", "M1n", "S15", "S3", 1], ["3", "S3", "S9", "M3n", "S1", -1], ["9", "S9", "S3", "M17n", "S11", 1], ["11", "S11", "M19n", "M13n", "S9", -1],
      ["13", "S13", "M17n", "L1", "S15", -1], ["15", "S15", "M25n", "S1", "S13", 1], ["23", "S23", "M25n", "L2", "S25", -1], ["25", "S25", "M29n", "S27", "S23", 1],
      ["27", "S27", "S25", "R21", "R22", -1], ["7", "S7", "L21", "K1b", "S5", -1], ["5", "S5", "S7", "L22", "K2j", -1],
      ["17", "S17", "M19n", "S19", "S21", 1], ["19", "S19", "S17", "L3", "X19", 1], ["21", "S21", "S17", "L7", "X21", 1],
      ["29", "S29", "M29n", "S31", "X8", -1], ["31", "S31", "S29", "L4", "X6", -1],
      ["37", "S37", "S33", "V6", "R8", 1], ["33", "S33", "EG", "S37", "S35", 1], ["35", "S35", "S33", "L12", "L10", 1],
      ["32", "S32", "S30", "R12", "S48", -1], ["48", "S48", "S32", "R10", "J26", -1], ["30", "S30", "S28", "R4", "S32", -1],
      ["28", "S28", "S30", "M24n", "S26", 1], ["2", "S2", "X28", "L18", "X2", -1], ["26", "S26", "M22n", "R2", "S28", -1],
      ["12", "S12", "S6", "M22n", "S14", 1], ["6", "S6", "S12", "M14n", "S4", 1], ["14", "S14", "M20n", "S4", "S12", -1], ["4", "S4", "M6n", "S14", "S6", -1],
      ["22", "S22", "M20n", "R1", "S24", 1], ["24", "S24", "M26n", "S20", "S22", -1],
      ["34", "S34", "M26n", "R3", "S38", 1], ["38", "S38", "S34", "R5", "S40", 1], ["40", "S40", "S38", "R7", "S42", 1], ["42", "S42", "S40", "S56", "M30n", 1],
      ["56", "S56", "S42", "R9", "J13", 1], ["20", "S20", "M16n", "S24", "M18n", 1],
      ["60", "S60", "M38n", "S400", "MP3", 1], ["400", "S400", "S60", "S320", "MP1", 1], ["320", "S320", "S400", "H15b", "MP2", 1]
    ],
    edges: [
      ["A0u", "APu", "2ЧП"], ["APu", "EU", "1ЧП"], ["EU", "M1n"], ["M1n", "S1"], ["A0l", "APl", "2НП"], ["APl", "HN", "1НП"], ["HN", "M3n"], ["M3n", "S3"],
      ["S1", "S3"], ["S1", "S15"], ["S3", "S9"], ["S9", "S11"], ["S9", "M17n"], ["M17n", "S13"], ["S13", "L1"], ["S13", "S15"], ["S15", "M25n"], ["M25n", "S23"], ["S23", "L2"], ["S23", "S25"],
      ["H23", "M13n", "23П"], ["M13n", "S11"], ["S11", "M19n"], ["M19n", "S17"], ["S17", "S19"], ["S17", "S21"], ["S19", "L3"], ["S19", "X19"], ["X19", "L5"], ["S21", "L7"], ["S21", "X21"], ["X21", "L9"],
      ["K1", "K1j", "КМС1П"], ["K1j", "K1b"], ["K1b", "S7"], ["K2", "K2j", "КМС2П"], ["K2j", "S5"], ["S5", "S7"], ["S5", "L22"], ["R22", "S27"], ["S7", "L21"], ["R21", "S27"],
      ["S27", "S25"], ["S25", "M29n"], ["M29n", "S29"], ["S29", "S31"], ["S29", "X8"], ["X8", "L8"], ["S31", "L4"], ["S31", "X6"], ["X6", "L6"],
      ["R8", "S37"], ["R6", "V6"], ["V6", "S37"], ["S37", "S33"], ["S33", "EG"], ["EG", "GP", "1ГН"], ["GP", "G0", "2ГН"], ["S33", "S35"], ["S35", "L12"], ["S35", "L10"],
      ["R12", "S32"], ["R10", "S48"], ["S48", "S32"], ["S48", "J26"], ["J26", "L26"], ["L26", "H26", "ПЧ4П"], ["S32", "S30"], ["R4", "S30"], ["S30", "S28"],
      ["S28", "M24n"], ["M24n", "X28"], ["X28", "S2"], ["S2", "L18"], ["L18", "H18", "18П"], ["S2", "X2"], ["X2", "L17"], ["L17", "H17", "17П"],
      ["S28", "S26"], ["R2", "S26"], ["S26", "M22n"], ["M22n", "S12"], ["S12", "S6"], ["S12", "S14"], ["S6", "M14n"], ["M14n", "CN"], ["S6", "S4"],
      ["R1", "S22"], ["S22", "M20n"], ["M20n", "S14"], ["S14", "S4"], ["S4", "M6n"], ["M6n", "EX"],
      ["R3", "S34"], ["S34", "M26n"], ["M26n", "S24"], ["S24", "S22"], ["S24", "S20"], ["S34", "S38"], ["R5", "S38"], ["S38", "S40"], ["R7", "S40"], ["S40", "S42"],
      ["R9", "S56"], ["S56", "S42"], ["S56", "J13"], ["J13", "H13", "13П"], ["S42", "M30n"], ["M30n", "X20"], ["X20", "M18n"], ["M18n", "S20"],
      ["S20", "M16n"], ["M16n", "M38n", "15аП"], ["M38n", "S60"], ["S60", "S400"], ["S400", "S320"], ["S320", "H15b", "15бП"],
      ["S60", "MP3"], ["MP3", "HP3", "ПК3П"], ["S400", "MP1"], ["MP1", "HP1", "ПК1П"], ["S320", "MP2"], ["MP2", "HP2", "ПК2П"],
      ["CN", "BRu", "1ЧС"], ["BRu", "A1u", "2ЧС"], ["EX", "BRl", "1НС"], ["BRl", "A1l", "2НС"]
    ],
    info: {
      "23П": { kind: "track", len: 453, label: "Колія 23 (453 м, тупик)" }, "13П": { kind: "track", len: 145, label: "Колія 13 (145 м, тупик біля платформи)" },
      "17П": { kind: "track", len: 644, label: "Колія 17 (644 м, тупик; далі МПК)" }, "18П": { kind: "track", len: 287, label: "Колія 18 (287 м, тупик)" },
      "15аП": { kind: "track", len: 122, label: "Колія 15а (122 м) → П/К №1, №2, №3" }, "15бП": { kind: "track", len: 120, label: "Продовження колії 15а (тупик)" },
      "ПК1П": { kind: "track", len: 150, label: "П/К №1 (діє)" }, "ПК2П": { kind: "track", len: 150, label: "П/К №2 (діє)" }, "ПК3П": { kind: "track", len: 150, label: "П/К №3 (діє)" },
      "ПЧ4П": { kind: "track", len: 120, label: "Колія 26 — ПЧ-4 (за скидальною стрілкою 44)" },
      "КМС1П": { kind: "track", len: 150, label: "Колія КМС-137 (1)" }, "КМС2П": { kind: "track", len: 150, label: "Колія КМС-137 (2)" }
    },
    signals: [
      { id: "М1", node: "M1n", dir: "R", kind: "shunt", note: "з перегону Партизани (парний шлях) у горловину" },
      { id: "М3", node: "M3n", dir: "R", kind: "shunt", note: "з перегону Партизани (непарний шлях) у горловину" },
      { id: "М17", node: "M17n", dir: "L", kind: "shunt", note: "витягування на непарний шлях" }, { id: "М25", node: "M25n", dir: "L", kind: "shunt", note: "витягування на парний шлях" },
      { id: "М13", node: "M13n", dir: "R", kind: "shunt", note: "виїзд з тупика 23" }, { id: "М19", node: "M19n", dir: "L", kind: "shunt", note: "до тупика 23 і на колії 9 … 3" },
      { id: "М29", node: "M29n", dir: "L", kind: "shunt", note: "з колій 4, 8, VI у ліву горловину" },
      { id: "М24", node: "M24n", dir: "R", kind: "shunt", note: "до колій 17, 18" }, { id: "М22", node: "M22n", dir: "R", kind: "shunt", note: "з колії II у праву горловину" },
      { id: "М20", node: "M20n", dir: "R", kind: "shunt", note: "з колії I у праву горловину" }, { id: "М14", node: "M14n", dir: "R", kind: "shunt", note: "витягування на перегін Салькове (парний шлях)" },
      { id: "М6", node: "M6n", dir: "L", kind: "shunt", note: "з перегону Салькове (непарний шлях) у горловину" }, { id: "М26", node: "M26n", dir: "R", kind: "shunt", note: "з колій 3 … 9 у праву горловину" },
      { id: "М30", node: "M30n", dir: "R", kind: "shunt", note: "на хід 20/42" }, { id: "М18", node: "M18n", dir: "L", kind: "shunt", note: "з колії 15а на хід 20/42" },
      { id: "М16", node: "M16n", dir: "L", kind: "shunt", note: "виїзд з колії 15а (П/К)" }, { id: "М38", node: "M38n", dir: "R", kind: "shunt", note: "на П/К №1–3" },
      { id: "МП3", node: "MP3", dir: "L", kind: "shunt", note: "виїзд з П/К №3" }, { id: "МП1", node: "MP1", dir: "L", kind: "shunt", note: "виїзд з П/К №1" }, { id: "МП2", node: "MP2", dir: "L", kind: "shunt", note: "виїзд з П/К №2" },
      { id: "М36", node: "L26", dir: "L", kind: "shunt", note: "виїзд з колії ПЧ-4" }, { id: "М4", node: "L18", dir: "L", kind: "shunt", note: "виїзд з колії 18" },
      { id: "М2", node: "L17", dir: "L", kind: "shunt", note: "виїзд з колії 17" }, { id: "М32", node: "R9", dir: "R", kind: "shunt", note: "виїзд з колії 9 праворуч" },
      { id: "М5", node: "K1j", dir: "R", kind: "shunt", note: "виїзд з колії КМС-137 (1)" }, { id: "М21", node: "K2j", dir: "R", kind: "shunt", note: "виїзд з колії КМС-137 (2)" },
      { id: "М8", node: "X28", dir: "L", kind: "shunt", note: "з колій 17, 18 у праву горловину" }
    ],
    park: [
      { id: "8П", L: "L8", R: "R8", len: 1012, sigL: "Ч8", sigR: "Н8", label: "Колія 8 (1012 м, на Генічеськ)", noArrive: ["S"], labelX: 960, labelY: 740 },
      { id: "VIП", L: "L6", R: "R6", len: 922, sigL: "Ч6", sigR: "Н6", name: "VI", label: "Колія VI (922 м, головна на Генічеськ)", noArrive: ["S"], labelX: 1170, labelY: 760 },
      { id: "10П", L: "L10", R: "R10", len: 822, sigL: "НГ10", sigR: "Н10", label: "Колія 10 (822 м, Генічеськ — Салькове)", noArrive: ["P"], labelX: 1545, labelY: 560 },
      { id: "12П", L: "L12", R: "R12", len: 840, sigL: "НГ12", sigR: "Н12", label: "Колія 12 (840 м, Генічеськ — Салькове)", noArrive: ["P"], labelX: 1405, labelY: 640 },
      { id: "4П", L: "L4", R: "R4", len: 547, sigL: "Ч4", sigR: "Н4", label: "Колія 4 (547 м, між платформами)" },
      { id: "IIП", L: "L2", R: "R2", len: 833, sigL: "ЧII", sigR: "НII", name: "II", label: "Колія II (833 м, головна, біля платформи)" },
      { id: "IП", L: "L1", R: "R1", len: 987, sigL: "ЧI", sigR: "НI", name: "I", label: "Колія I (987 м, головна, біля платформи)" },
      { id: "3П", L: "L3", R: "R3", len: 864, sigL: "Ч3", sigR: "Н3", label: "Колія 3 (864 м, біля платформи)" },
      { id: "5П", L: "L5", R: "R5", len: 853, sigL: "Ч5", sigR: "Н5", label: "Колія 5 (853 м)" },
      { id: "7П", L: "L7", R: "R7", len: 702, sigL: "Ч7", sigR: "Н7", label: "Колія 7 (702 м)" },
      { id: "9П", L: "L9", R: "R9", len: 643, sigL: "М27", kindL: "shunt", label: "Колія 9 (643 м, маневрова)", noArrive: ["P", "S", "G"] },
      { id: "21П", L: "L21", R: "R21", len: 221, sigL: "М9", sigR: "М15", kindL: "shunt", kindR: "shunt", label: "Колія 21 (221 м)", noArrive: ["P", "S", "G"], labelX: 470, labelY: 912 },
      { id: "22П", L: "L22", R: "R22", len: 256, sigL: "М7", sigR: "М11", kindL: "shunt", kindR: "shunt", label: "Колія 22 (256 м)", noArrive: ["P", "S", "G"] }
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
      box: [-165, 0, 3015, 1230],
      // [x, y, width, height, angle] — the platforms along the inclined tracks are turned with them
      platforms: [[1100, 879, 460, 8], [1130, 914, 420, 8], [1050, 984, 600, 8], [1300, 1186, 150, 8],
        [901, 712, 240, 8, -45], [1058, 739, 240, 8, -45], [1393, 596, 230, 8, 71.6]],
      notes: [[-150, 890, "← ПАРТИЗАНИ · Мелітополь"], [2560, 890, "САЛЬКОВЕ · Джанкой →"], [1395, 60, "↑ ГЕНІЧЕСЬК (непарний)"], [150, 1030, "23 тупик"],
        [2420, 1140, "П/К №1–3"], [2400, 815, "МПК"], [1700, 750, "ПЧ-4"], [1655, 795, "44"], [250, 785, "КМС-137"], [1680, 855, "ЕЦ · ПБ"]],
      borders: [],
      blockLabels: [["2ЧП", -110, 935, -13], ["1ЧП", -15, 935, -13], ["2НП", -110, 970, 20], ["1НП", -15, 970, 20], ["1ЧС", 2610, 935, -13], ["2ЧС", 2750, 935, -13],
        ["1НС", 2610, 970, 20], ["2НС", 2750, 970, 20], ["1ГН", 1385, 160, 0], ["2ГН", 1390, 70, 0]],
      graph: ["Партизани", "Новоолексіївка", "Салькове"]
    },
    radio: { sides: { P: { name: "Партизани", from: "Партизан", dsp: "Ткаченко", inc: 20 }, S: { name: "Салькове", from: "Салькового", dsp: "Литвиненко", inc: 40 }, G: { name: "Генічеськ", from: "Генічеська", dsp: "Кравець", inc: 30 } },
      bySignal: { "Н": "P", "Ч": "S", "Чг": "G" }, byLine: { "2ЧП": "P", "2НС": "S", "2ГН": "G" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  T.markers.push({ id: "44", node: "J26", note: "скидальна стрілка 44 перед колією ПЧ-4", side: -1 });
  [["13 145", 1330, 1160], ["23 453", 150, 995], ["17 644", 2250, 820], ["18 287", 2140, 855], ["15а 122", 2240, 995]].forEach((l) => T.labels.push(l));
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
      "П15П": { name: "Прибирання вагонів з колії 15а (П/К) на колію 9", start: "9П", plan: [{ sig: "М32", end: "15аП" }, { couple: true }, { wait: 120 }, { sig: "М16", end: "9П" }] },
      "ПК1": { name: "Подача вагонів з колії 15а на П/К №1", start: "15аП", plan: [{ sig: "М38", end: "ПК1П" }, { leave: true }, { wait: 60 }, { sig: "МП1", end: "15аП" }] },
      "ПК1П": { name: "Прибирання вагонів з П/К №1 на колію 15а", start: "15аП", plan: [{ sig: "М38", end: "ПК1П" }, { couple: true }, { wait: 120 }, { sig: "МП1", end: "15аП" }] },
      "ПЧ4": { name: "Подача вагонів у ПЧ-4 (колія 26) з колії 18", start: "18П", plan: [{ sig: "М4", end: "ПЧ4П" }, { leave: true }, { wait: 60 }, { sig: "М36", end: "18П" }] },
      "ПЧ4П": { name: "Прибирання вагонів з ПЧ-4 (колія 26) на колію 18", start: "18П", plan: [{ sig: "М4", end: "ПЧ4П" }, { couple: true }, { wait: 120 }, { sig: "М36", end: "18П" }] },
      "КМС": { name: "Подача вагонів на колію КМС-137 з колії 21", start: "21П", plan: [{ sig: "М9", end: "КМС1П" }, { leave: true }, { wait: 60 }, { sig: "М5", end: "21П" }] },
      "КМСП": { name: "Прибирання вагонів з КМС-137 на колію 21", start: "21П", plan: [{ sig: "М9", end: "КМС1П" }, { couple: true }, { wait: 120 }, { sig: "М5", end: "21П" }] }
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
    [["Т23", "Т23П"], ["П15", "П15П"], ["ПЧ4", "ПЧ4П"], ["КМС", "КМСП"], ["ПК1", "ПК1П"]].forEach(([a, b], i) => { if (G.r() < 0.75) { const t = 400 + i * 170 + G.ri(-30, 30); shunt(t, a); shunt(t + G.ri(150, 260), b); } });
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "novooleksiivka_" + seed + "_" + intensity + "_d" + day, station: "Новоолексіївка", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.novooleksiivka = { id: "novooleksiivka", name: "Новоолексіївка", note: "вузлова: Партизани — Салькове, відгалуження на Генічеськ", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE, parityOf };
})();

/*
 * Станція Запоріжжя II, after the station plan «Дата кор. 22.05.2014».
 * A junction: on the left the lines to Запоріжжя-Ліве (upper) and to Нікополь through
 * ім. Анатолія Алімова (lower); on the right the lines to Пологи (передатна, upper) and
 * to Запоріжжя 1 (lower). The main track VIII runs straight through the park.
 * Exit signals Н1–Н17 stand at the left ends of the tracks (departure to the left — odd),
 * Ч1–Ч17 at the right ends (departure to the right — even), as on the plan.
 * Tracks 12–17 belong to the motor-car depot РПЧ-3; on the right — the ПЧ-14 base and БМЕУ-3.
 *
 * Square 45° schematic drawn after the plan. Simplified in the model: each line is one
 * track with two blocks; the yards beyond the throats (ПЧ-14 base, БМЕУ-3, depot fan,
 * П/К) are reduced to a few dead-end tracks; the middle signals of tracks 2 and 3
 * (НМ2, ЧМ2, НМ3, ЧМ3) are shown but not controlled; directions of some shunting signals
 * are a model choice where the plan symbol is ambiguous.
 */
(function () {
  "use strict";
  const N = {
    // left lines and throat
    A0u: [-150, 324], APu: [-60, 324], NL: [30, 324], M4n: [120, 324], S4: [178, 324], S8: [242, 324], S12: [300, 324], M18n: [408, 324], S20: [478, 324], S22: [532, 324],
    A0l: [-150, 352], APl: [-60, 352], CM: [30, 352], M2n: [110, 352], S2: [150, 352], S6: [210, 352], S10: [270, 352], S16: [330, 352], M16n: [408, 352], S28: [450, 352], S24: [560, 352], S34: [600, 352],
    H39: [40, 380], M6n: [100, 380], X6: [182, 380],
    H66: [60, 408], M10n: [200, 408], S66: [274, 408], X16a: [302, 380], H66r: [360, 408],
    H38: [-100, 296], S14: [328, 296], M20n: [408, 296], S18: [450, 296], M26n: [482, 296], S30: [510, 296], S38: [580, 296], S46: [650, 296], H10: [740, 296],
    S40: [566, 240], X40d: [538, 212], H61: [470, 212], S48: [650, 156], S54: [678, 128], X54: [706, 100],
    S44: [636, 240], S52: [664, 212], X52: [692, 184], X46: [678, 268],
    S32: [534, 436], S36: [562, 464], X36: [646, 548], S26: [628, 380], X26: [656, 408], S42: [600, 464], S50: [640, 464], X42: [656, 520], X50: [668, 492],
    M30n: [700, 548], H23: [1150, 548],
    // park: left ends (Н) and right ends (Ч)
    L17: [760, 100], L16: [760, 128], L15: [760, 156], L14: [760, 184], L13: [760, 212], L12: [760, 240], L11: [760, 268], L9: [760, 324], L8: [760, 352],
    L7: [760, 380], L6: [760, 408], L5: [760, 436], L3: [760, 464], L2: [760, 492], L1: [760, 520],
    R17: [1660, 100], R16: [1660, 128], R15: [1660, 156], R14: [1660, 184], R13: [1660, 212], R12: [1660, 240], R11: [1660, 268], R9: [1660, 324], R8: [1660, 352],
    R7: [1660, 380], R6: [1660, 408], R5: [1660, 436], R3: [1660, 464], R2: [1660, 492], R1: [1660, 520],
    // right throat: depot ladder 53–43–27–21–17, tracks 11/12/13 via 41–37–25
    S53: [1690, 100], X53: [1718, 72], H199: [1800, 72], S43: [1718, 128], X15r: [1692, 156], S39: [1720, 184], S27: [1774, 184], M15n: [1802, 212],
    X13r: [1692, 212], S37: [1720, 240], S25: [1800, 240], S21: [1830, 240], S41: [1772, 268], S47: [1716, 324], S17: [1858, 268], X17: [1886, 296],
    S15: [2036, 296], S3: [2070, 296], M7n: [2110, 296], NPn: [2400, 296], APr: [2560, 296], A1u: [2740, 296],
    S1: [2098, 268], M1n: [2130, 268], S63: [2160, 268], H37: [2320, 268], S65: [2188, 240], H40: [1960, 240], S67: [2240, 240], H1b: [2340, 240], X67: [2268, 212], H2b: [2340, 212],
    S45: [1744, 352], M23n: [1800, 352], S13: [1940, 352], S11: [1980, 352], S9: [2020, 352], M9n: [2080, 352], CZn: [2400, 352], APz: [2560, 352], A1l: [2740, 352],
    X49: [1692, 408], S49: [1720, 380], M27n: [1780, 380], S29: [1912, 380],
    X57: [1692, 464], S57: [1720, 436], M25n: [1790, 436], S51: [1856, 436], X1r: [1692, 520], S55: [1720, 492], X55: [1800, 492],
    S31: [1884, 408], M19n: [1920, 408], S23: [1964, 408], S19: [2040, 408], M43n: [2070, 408], S73: [2100, 408], HB12: [2350, 408], S75: [2128, 436], HB13: [2350, 436],
    S79: [2156, 464], HB14: [2350, 464], X79: [2184, 492], HB16: [2300, 492], M41n: [2012, 436], S59: [1984, 464], HB34: [1900, 464], S161: [1928, 520], HB35: [1790, 520], X161: [1956, 548], HB36: [2080, 548]
  };
  // switches: common = point side, plus = straight, minus = diverging
  const SW = [
    ["2", "S2", "M2n", "S6", "S4", 1], ["4", "S4", "S8", "M4n", "S2", -1], ["6", "S6", "S10", "S2", "X6", 1], ["8", "S8", "S4", "S12", "S10", -1],
    ["10", "S10", "S16", "S6", "S8", 1], ["12", "S12", "S8", "M18n", "S14", 1], ["14", "S14", "M20n", "H38", "S12", -1], ["16", "S16", "M16n", "S10", "X16a", -1],
    ["66", "S66", "M10n", "H66r", "X16a", 1], ["18", "S18", "M20n", "M26n", "S20", -1], ["20", "S20", "S22", "M18n", "S18", 1], ["22", "S22", "S20", "L9", "S24", -1],
    ["24", "S24", "S34", "S28", "S22", 1], ["28", "S28", "M16n", "S24", "S32", -1], ["34", "S34", "S24", "L8", "S26", 1], ["26", "S26", "S34", "L7", "X26", 1],
    ["32", "S32", "S28", "S36", "L5", -1], ["36", "S36", "S32", "X36", "S42", -1], ["42", "S42", "S36", "S50", "X42", -1], ["50", "S50", "S42", "L3", "X50", -1],
    ["30", "S30", "M26n", "S38", "S40", 1], ["40", "S40", "S30", "S48", "X40d", 1], ["48", "S48", "S40", "S54", "L15", 1], ["54", "S54", "S48", "X54", "L16", 1],
    ["38", "S38", "S30", "S46", "S44", 1], ["44", "S44", "S38", "S52", "L12", 1], ["52", "S52", "S44", "X52", "L13", 1], ["46", "S46", "S38", "H10", "X46", 1],
    ["53", "S53", "S43", "R17", "X53", -1], ["43", "S43", "S27", "S53", "R16", 1], ["39", "S39", "S27", "R14", "X15r", 1], ["27", "S27", "M15n", "S43", "S39", -1],
    ["37", "S37", "S25", "R12", "X13r", 1], ["25", "S25", "S21", "S37", "S41", 1], ["41", "S41", "S25", "R11", "S47", 1], ["47", "S47", "R9", "S41", "S45", -1],
    ["21", "S21", "S17", "M15n", "S25", -1], ["17", "S17", "S21", "X17", "S1", 1], ["15", "S15", "S3", "X17", "S11", 1], ["3", "S3", "S15", "M7n", "S1", 1],
    ["1", "S1", "M1n", "S17", "S3", -1], ["63", "S63", "M1n", "H37", "S65", 1], ["65", "S65", "S67", "H40", "S63", -1], ["67", "S67", "S65", "H1b", "X67", -1],
    ["45", "S45", "M23n", "R8", "S47", 1], ["13", "S13", "S11", "M23n", "S29", 1], ["11", "S11", "S13", "S9", "S15", 1], ["9", "S9", "M9n", "S11", "S23", 1],
    ["49", "S49", "M27n", "R7", "X49", 1], ["29", "S29", "S13", "M27n", "S31", 1], ["57", "S57", "M25n", "R5", "X57", 1], ["51", "S51", "S31", "M25n", "X55", 1],
    ["55", "S55", "X55", "R2", "X1r", 1], ["31", "S31", "S51", "M19n", "S29", -1], ["23", "S23", "M19n", "S19", "S9", 1], ["19", "S19", "M43n", "S23", "M41n", 1],
    ["73", "S73", "M43n", "HB12", "S75", 1], ["75", "S75", "S73", "HB13", "S79", 1], ["79", "S79", "S75", "HB14", "X79", 1],
    ["59", "S59", "M41n", "S161", "HB34", 1], ["161", "S161", "S59", "HB35", "X161", 1]
  ];
  const TRK = { 17: 729, 16: 801, 15: 858, 14: 825, 13: 810, 12: 813, 11: 813, 9: 832, 8: 833, 7: 761, 6: 761, 5: 798, 3: 693, 2: 697, 1: 709 };
  const tid = (k) => (k === "8" ? "VIIIП" : k + "П");
  // edges: [a, b, section?]; sections of switch areas are named after the switch automatically
  const E = [
    ["A0u", "APu", "2ЛП"], ["APu", "NL", "1ЛП"], ["NL", "M4n", "НЛІП"], ["M4n", "S4"], ["S4", "S8"], ["S8", "S12"], ["S12", "M18n"], ["M18n", "S20"], ["S20", "S22"],
    ["A0l", "APl", "2МП"], ["APl", "CM", "1МП"], ["CM", "M2n", "ЧМІП"], ["M2n", "S2"], ["S2", "S4"], ["S2", "S6"], ["S6", "S10"], ["S8", "S10"], ["S10", "S16"], ["S16", "M16n"], ["M16n", "S28"],
    ["S28", "S24"], ["S22", "S24"], ["S24", "S34"], ["S22", "L9", "9Л"], ["S34", "L8", "VIIIЛ"],
    ["H39", "M6n", "39П"], ["M6n", "X6"], ["X6", "S6"], ["H66", "M10n", "ПК2П"], ["M10n", "S66"], ["S66", "H66r", "66Т"], ["S66", "X16a"], ["X16a", "S16"],
    ["H38", "S14", "38П"], ["S12", "S14"], ["S14", "M20n"], ["M20n", "S18"], ["S18", "M26n"], ["S18", "S20"], ["M26n", "S30"], ["S30", "S38"], ["S38", "S46"], ["S46", "H10", "10П"],
    ["S30", "S40"], ["S40", "X40d"], ["X40d", "H61", "61П"], ["S40", "S48"], ["S48", "S54"], ["S54", "X54"], ["X54", "L17"], ["S54", "L16"], ["S48", "L15"],
    ["S38", "S44"], ["S44", "S52"], ["S52", "X52"], ["X52", "L14"], ["S52", "L13"], ["S44", "L12"], ["S46", "X46"], ["X46", "L11"],
    ["S28", "S32"], ["S32", "S36"], ["S36", "X36"], ["X36", "M30n"], ["M30n", "H23", "23П"], ["S32", "L5"], ["S36", "S42"], ["S42", "S50"], ["S50", "L3"], ["S42", "X42"], ["X42", "L1"], ["S50", "X50"], ["X50", "L2"],
    ["S34", "S26"], ["S26", "L7"], ["S26", "X26"], ["X26", "L6"],
    // right throat
    ["R17", "S53"], ["S53", "X53"], ["X53", "H199", "199П"], ["S53", "S43"], ["R16", "S43"], ["S43", "S27"], ["R15", "X15r"], ["X15r", "S39"], ["R14", "S39"], ["S39", "S27"], ["S27", "M15n"], ["M15n", "S21"],
    ["R13", "X13r"], ["X13r", "S37"], ["R12", "S37"], ["S37", "S25"], ["S25", "S21"], ["R11", "S41"], ["S41", "S25"], ["R9", "S47"], ["S47", "S41"], ["S47", "S45"],
    ["S21", "S17"], ["S17", "X17"], ["X17", "S15"], ["S15", "S3"], ["S3", "M7n"], ["M7n", "NPn", "НПІП"], ["NPn", "APr", "1ПП"], ["APr", "A1u", "2ПП"],
    ["S17", "S1"], ["S3", "S1"], ["S1", "M1n"], ["M1n", "S63"], ["S63", "H37", "37П"], ["S63", "S65"], ["H40", "S65", "40П"], ["S65", "S67"], ["S67", "H1b", "БМЕУ1П"], ["S67", "X67"], ["X67", "H2b", "БМЕУ2П"],
    ["R8", "S45"], ["S45", "M23n"], ["M23n", "S13"], ["S13", "S11"], ["S11", "S9"], ["S11", "S15"], ["S9", "M9n"], ["M9n", "CZn", "ЧЗІП"], ["CZn", "APz", "1ЗП"], ["APz", "A1l", "2ЗП"],
    ["R7", "S49"], ["R6", "X49"], ["X49", "S49"], ["S49", "M27n"], ["M27n", "S29"], ["S29", "S13"],
    ["R5", "S57"], ["R3", "X57"], ["X57", "S57"], ["S57", "M25n"], ["M25n", "S51"], ["R2", "S55"], ["R1", "X1r"], ["X1r", "S55"], ["S55", "X55"], ["X55", "S51"],
    ["S51", "S31"], ["S31", "S29"], ["S31", "M19n"], ["M19n", "S23"], ["S23", "S9"], ["S23", "S19"], ["S19", "M43n"], ["M43n", "S73"], ["S73", "HB12", "Б12П"], ["S73", "S75"],
    ["S75", "HB13", "Б13П"], ["S75", "S79"], ["S79", "HB14", "Б14П"], ["S79", "X79"], ["X79", "HB16", "Б16П"],
    ["S19", "M41n"], ["M41n", "S59"], ["S59", "HB34", "Б34П"], ["S59", "S161"], ["S161", "HB35", "Б35П"], ["S161", "X161"], ["X161", "HB36", "Б36П"]
  ];
  Object.keys(TRK).forEach((k) => E.push(["L" + k, "R" + k, tid(k)]));
  // the left lead of track 9 and VIII belong to the switch areas, not to the tracks
  const swAt = {}; SW.forEach(([id, node, common]) => (swAt[node] = { id, common }));
  const edges = E.map(([a, b, sec]) => {
    if (sec === "9Л") sec = "22СП"; else if (sec === "VIIIЛ") sec = "34СП";
    if (!sec) {
      const A = swAt[a], B = swAt[b];
      if (A && A.common === b && B && B.common === a) sec = [A.id, B.id].sort((x, y) => x - y).join("-") + "СП";
      else if (A && A.common === b) sec = A.id + "СП";
      else if (B && B.common === a) sec = B.id + "СП";
      else if (A) sec = A.id + "СП";
      else if (B) sec = B.id + "СП";
      else {
        // a bend node between a switch and a joint: belongs to the switch next to it
        const nb = (n) => E.find((e) => (e[0] === n || e[1] === n) && (swAt[e[0]] || swAt[e[1]]));
        const e2 = nb(a) || nb(b); const s2 = e2 && (swAt[e2[0]] || swAt[e2[1]]);
        sec = s2 ? s2.id + "СП" : a + "-" + b;
      }
    }
    return [a, b, sec];
  });
  // switch sections shared by facing switches: make sure every switch keeps one section name
  const secOf = {}; edges.forEach(([a, b, s]) => (secOf[a + "|" + b] = secOf[b + "|" + a] = s));

  const info = {
    "2ЛП": { kind: "line", arrParity: "even", len: 1300, label: "Перегін на Запоріжжя-Ліве, 2-й блок" }, "1ЛП": { kind: "line", arrParity: "even", len: 900, label: "Перегін на Запоріжжя-Ліве, 1-й блок" },
    "2МП": { kind: "line", arrParity: "even", len: 1300, label: "Перегін на ім. Анатолія Алімова (Нікополь), 2-й блок" }, "1МП": { kind: "line", arrParity: "even", len: 900, label: "Перегін на ім. Анатолія Алімова (Нікополь), 1-й блок" },
    "2ПП": { kind: "line", arrParity: "odd", len: 1300, label: "Передатна колія на Пологи, 2-й блок" }, "1ПП": { kind: "line", arrParity: "odd", len: 900, label: "Передатна колія на Пологи, 1-й блок" },
    "2ЗП": { kind: "line", arrParity: "odd", len: 1300, label: "Перегін на Запоріжжя 1, 2-й блок" }, "1ЗП": { kind: "line", arrParity: "odd", len: 900, label: "Перегін на Запоріжжя 1, 1-й блок" },
    "НЛІП": { kind: "switchless", len: 150, label: "Ділянка за вхідним НЛ" }, "ЧМІП": { kind: "switchless", len: 150, label: "Ділянка за вхідним ЧМ" },
    "НПІП": { kind: "switchless", len: 300, label: "Ділянка за вхідним НП" }, "ЧЗІП": { kind: "switchless", len: 300, label: "Ділянка за вхідним ЧЗ" },
    "38П": { kind: "track", len: 588, label: "Колія 38 (588 м, тупик)" }, "39П": { kind: "track", len: 31, label: "Колія 39 (31 м, тупик)" },
    "ПК2П": { kind: "track", len: 300, label: "Під'їзна колія П/К (2) (діє)" }, "66Т": { kind: "track", len: 60, label: "Тупик біля стрілки 66" },
    "10П": { kind: "track", len: 26, label: "Колія 10 (26 м, тупик)" }, "61П": { kind: "track", len: 200, label: "Колія 61 — до моторвагонного депо (на плані синя)" },
    "23П": { kind: "track", len: 384, label: "Колія 23 (384 м, відкрита вантажна платформа)" }, "199П": { kind: "track", len: 150, label: "Колія 199 — у депо РПЧ-3 (на плані синя)" },
    "37П": { kind: "track", len: 340, label: "Колія 37 (340 м); далі П/К (1) — не діє" }, "40П": { kind: "track", len: 200, label: "Колія 40 (тупик)" },
    "БМЕУ1П": { kind: "track", len: 150, label: "Колія 1 БМЕУ-3" }, "БМЕУ2П": { kind: "track", len: 150, label: "Колія 2 БМЕУ-3" },
    "Б12П": { kind: "track", len: 200, label: "База ПЧ-14, колія 12" }, "Б13П": { kind: "track", len: 200, label: "База ПЧ-14, колія 13" }, "Б14П": { kind: "track", len: 200, label: "База ПЧ-14, колія 14" },
    "Б16П": { kind: "track", len: 120, label: "База ПЧ-14, колія 16 (у моделі об'єднано з 26, 15–17)" },
    "Б34П": { kind: "track", len: 120, label: "База ПЧ-14, колія 34" }, "Б35П": { kind: "track", len: 150, label: "База ПЧ-14, колія 35" }, "Б36П": { kind: "track", len: 120, label: "База ПЧ-14, колія 36 (і 65)" }
  };
  Object.keys(TRK).forEach((k) => (info[tid(k)] = { kind: "track", len: TRK[k], label: "Колія " + (k === "8" ? "VIII (головна)" : k) + " (" + TRK[k] + " м)" + (+k >= 12 ? ", депо РПЧ-3" : +k <= 3 ? ", біля платформи" : "") }));
  Object.entries(info).forEach(([id, si]) => { si.source = si.source || "plan"; if (si.kind === "track") si.group = id; });

  const sig = (id, node, dir, kind, extra) => Object.assign({ id, node, dir, side: dir === "R" ? 1 : -1, kind, source: "plan" }, extra || {});
  const signals = [
    sig("НЛ", "NL", "R", "entry", { approachChain: ["2ЛП", "1ЛП"], note: "вхідний з Запоріжжя-Лівого" }),
    sig("ЧМ", "CM", "R", "entry", { approachChain: ["2МП", "1МП"], note: "вхідний з ім. Анатолія Алімова (Нікополь)" }),
    sig("НП", "NPn", "L", "entry", { approachChain: ["2ПП", "1ПП"], note: "вхідний з передатної колії (Пологи)" }),
    sig("ЧЗ", "CZn", "L", "entry", { approachChain: ["2ЗП", "1ЗП"], note: "вхідний з Запоріжжя 1" }),
    sig("М4", "M4n", "L", "shunt"), sig("М2", "M2n", "L", "shunt"), sig("М6", "M6n", "R", "shunt"), sig("М10", "M10n", "R", "shunt"),
    sig("М20", "M20n", "R", "shunt"), sig("М18", "M18n", "R", "shunt", { note: "на плані перед мостом; у моделі — за мостом, у бік парку" }), sig("М16", "M16n", "R", "shunt"),
    sig("М26", "M26n", "L", "shunt", { note: "виїзд з колій 10, 61 і верхньої горловини в бік мосту" }), sig("М30", "M30n", "L", "shunt"),
    sig("М15", "M15n", "R", "shunt"), sig("М23", "M23n", "R", "shunt"), sig("М27", "M27n", "R", "shunt"), sig("М25", "M25n", "R", "shunt"), sig("М19", "M19n", "R", "shunt"),
    sig("М7", "M7n", "L", "shunt"), sig("М9", "M9n", "L", "shunt"), sig("М1", "M1n", "L", "shunt"), sig("М43", "M43n", "L", "shunt"), sig("М41", "M41n", "R", "shunt", { side: 1, dx: 22 })
  ];
  Object.keys(TRK).forEach((k) => { const n = k === "8" ? "8" : k; signals.push(sig("Н" + n, "L" + k, "L", "exit"), sig("Ч" + n, "R" + k, "R", "exit")); });

  const T = {
    id: "zaporizhzhia2", station: "Запоріжжя II", planDate: "22.05.2014", shuntToTracks: true, lockFrame: true, lineArrivalParity: "even",
    nodes: N, edges,
    sectionInfo: info,
    switches: SW.map(([id, node, common, plus, minus, label]) => ({ id, node, common, plus, minus, label })),
    signals,
    markers: [
      { id: "НМ2", node: "L2", dx: 340, side: 1, note: "середній світлофор колії 2 (2А / 2Б) — на плані є; у моделі колія 2 ціла, ним не керують" },
      { id: "ЧМ2", node: "L2", dx: 400, side: -1, note: "середній світлофор колії 2 — у моделі ним не керують" },
      { id: "НМ3", node: "L3", dx: 340, side: -1, note: "середній світлофор колії 3 (3А / 3Б) — у моделі ним не керують" },
      { id: "ЧМ3", node: "L3", dx: 340, side: 1, note: "середній світлофор колії 3 — у моделі ним не керують" }
    ],
    endButtons: [
      { id: "ВЛ", node: "NL", dx: -110, side: -1, label: "відпр. на ЗАПОРІЖЖЯ-ЛІВЕ", note: "кінець маршруту відправлення на Запоріжжя-Ліве" },
      { id: "ВН", node: "CM", dx: -110, side: 1, label: "відпр. на НІКОПОЛЬ", note: "кінець маршруту відправлення на ім. Анатолія Алімова (Нікополь)" },
      { id: "ВП", node: "NPn", dx: 110, side: -1, label: "відпр. на ПОЛОГИ", note: "кінець маршруту відправлення на передатну колію (Пологи)" },
      { id: "ВЗ", node: "CZn", dx: 110, side: 1, label: "відпр. на ЗАПОРІЖЖЯ 1", note: "кінець маршруту відправлення на Запоріжжя 1" }
    ],
    routes: [],
    exitSignals: { odd: {}, even: {} },
    entrySignal: { odd: "ЧЗ", even: "ЧМ" },
    labels: [],
    view: {
      box: [-165, 40, 2925, 535],
      platforms: [[1220, 474, 380, 9], [1220, 502, 380, 9], [1220, 530, 400, 11]],
      notes: [[-150, 290, "← ЗАПОРІЖЖЯ-ЛІВЕ"], [-150, 398, "← ім. А. АЛІМОВА · НІКОПОЛЬ"], [2440, 268, "ПОЛОГИ (передатна) →"], [2440, 390, "ЗАПОРІЖЖЯ 1 →"],
        [1020, 66, "Запорізьке моторвагонне депо (РПЧ-3) — колії 12–17"], [380, 286, "міст"], [700, 572, "Відкрита вантажна платформа"], [2180, 392, "База ПЧ-14"],
        [2200, 205, "БМЕУ-3"], [70, 432, "П/К (2) діє"], [1250, 566, "Пост ЕЦ"]],
      borders: [[372, 280, 372, 370], [384, 280, 384, 370]],
      blockLabels: [["2ЛП", -115, 324, -13], ["1ЛП", -25, 324, -13], ["2МП", -115, 352, 20], ["1МП", -25, 352, 20], ["1ПП", 2470, 296, -13], ["2ПП", 2640, 296, -13], ["1ЗП", 2470, 352, 20], ["2ЗП", 2640, 352, 20]],
      graph: ["Запоріжжя 1 / Пологи", "Запоріжжя II", "Ліве / Нікополь"]
    },
    radio: {
      sides: { L: { name: "Запоріжжя-Ліве", from: "Запоріжжя-Лівого", dsp: "Кравченко", inc: 20 }, N: { name: "ім. Анатолія Алімова", from: "ім. Анатолія Алімова", dsp: "Бондар", inc: 40 },
        P: { name: "Пологи (передатна)", from: "передатної (Пологи)", dsp: "Ткаченко", inc: 60 }, Z: { name: "Запоріжжя 1", from: "Запоріжжя 1", dsp: "Олійник", inc: 80 } },
      bySignal: { "НЛ": "L", "ЧМ": "N", "НП": "P", "ЧЗ": "Z" }, byLine: { "2ЛП": "L", "2МП": "N", "2ПП": "P", "2ЗП": "Z" }, odd: {}, even: {}
    }
  };
  // track labels
  Object.keys(TRK).forEach((k) => T.labels.push([(k === "8" ? "VIII" : k) + " " + TRK[k], 980, N["L" + k][1] - 5]));
  [["38 588", 120, 291], ["39 31", 60, 375], ["10 26", 700, 291], ["23 384", 900, 543], ["37 340 · П/К (1) не діє", 2210, 263], ["40", 2050, 235], ["199", 1760, 67], ["61", 490, 207],
    ["12", 2280, 403], ["13", 2280, 431], ["14", 2280, 459], ["16", 2250, 487], ["34", 1930, 459], ["35", 1830, 515], ["36", 2030, 543], ["1", 2300, 235], ["2", 2300, 207]].forEach((l) => T.labels.push(l));

  // ---- train routes: shortest path from the signal to the end, following the switches
  const adj = {}; edges.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
  const swN = {}; T.switches.forEach((s) => (swN[s.node] = s));
  const nextN = (prev, cur) => { const s = swN[cur]; return s ? (prev === s.common ? [s.plus, s.minus] : [s.common]) : (adj[cur] || []).filter((n) => n !== prev); };
  const kindAt = (a, b) => (info[secOf[a + "|" + b]] || {}).kind;
  function path(from, dir, goal, okEdge) {
    const sign = dir === "R" ? 1 : -1;
    const first = (adj[from] || []).filter((n) => (N[n][0] - N[from][0]) * sign > 0);
    const Q = first.map((n) => [from, n]);
    while (Q.length) {
      const p = Q.shift(), cur = p[p.length - 1], prev = p[p.length - 2];
      if (cur === goal) return p;
      if (p.length > 40) continue;
      nextN(prev, cur).filter((n) => !p.includes(n) && okEdge(cur, n)).forEach((n) => Q.push(p.concat(n)));
    }
    return null;
  }
  const park = Object.keys(TRK);
  const noLine = (a, b) => kindAt(a, b) !== "line" && kindAt(a, b) !== "track";
  // arrivals: entry → the far end of the track
  [["НЛ", "NL", "R"], ["ЧМ", "CM", "R"], ["НП", "NPn", "L"], ["ЧЗ", "CZn", "L"]].forEach(([s, node, dir]) => park.forEach((k) => {
    const near = dir === "R" ? "L" + k : "R" + k, far = dir === "R" ? "R" + k : "L" + k;
    const p = path(node, dir, near, noLine);
    if (!p) return;
    const endSig = (dir === "R" ? "Ч" : "Н") + k;
    T.routes.push({ id: s + "→" + (k === "8" ? "VIII" : k), from: s, to: tid(k), type: "train", ends: [endSig, tid(k)], path: p.concat(far) });
  }));
  // departures: exit signal → the far block of a line
  [["Н", "L", [["A0u", "2ЛП", "ВЛ", "Л"], ["A0l", "2МП", "ВН", "Н"]]], ["Ч", "R", [["A1u", "2ПП", "ВП", "П"], ["A1l", "2ЗП", "ВЗ", "З"]]]].forEach(([pre, dir, lines]) => park.forEach((k) => {
    const from = (dir === "L" ? "L" : "R") + k;
    lines.forEach(([goal, sec, btn, tag]) => {
      const p = path(from, dir, goal, (a, b) => kindAt(a, b) !== "track");
      if (p) T.routes.push({ id: pre + k + "→" + tag, from: pre + k, to: sec, type: "train", ends: [btn], path: p });
    });
    T.exitSignals[dir === "L" ? "odd" : "even"][tid(k)] = pre + k;
  }));

  // ------------------------------------------------------------ model parameters
  const DEPOT = ["14П", "15П", "13П", "16П", "12П", "17П"], PLAT = ["3П", "2П", "1П"];
  const P = {
    directionParity: { even: "even", odd: "odd" },
    directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["VIIIП", "9П", "7П", "6П", "5П"], even: ["VIIIП", "9П", "7П", "6П", "5П"] },
    typeTracks: { passenger: ["2П", "3П", "1П"], electric: ["3П", "2П", "1П"], freight: ["7П", "6П", "5П", "9П", "VIIIП"], household: ["6П", "7П", "5П"], reserve: ["9П", "VIIIП", "7П"], test: ["VIIIП"] },
    recommendedTrack: {},
    appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 },
    departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 60, electric: 55, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 },
    minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: PLAT, mainTracks: ["VIIIП", "1П", "2П", "3П"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 5], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {
      DEPOT_IN: {
        name: "Електропоїзд після прибуття — у депо РПЧ-3 (колії 12–17)", estSec: 1500,
        build({ ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "електропоїзд " + ev.ev.consist + " ще не прибув" };
          return { start: sec, onWagons: true, plan: [
            { couple: true },
            { sig: "@R", end: "НП", txt: "витягнути за М7 на ділянку НПІП" },
            { sig: "М7", end: DEPOT, free: true, txt: "через стрілки 3, 15, 17, 21 на вільну колію депо" },
            { leave: true, consist: "Д-" + ev.ev.consist }
          ] };
        }
      },
      DEPOT_OUT: {
        name: "Подача електропоїзда з депо РПЧ-3 на колію біля платформи", estSec: 1500,
        build({ ev, findConsist }) {
          const sec = findConsist("Д-" + ev.ev.consist);
          if (!sec) return { wait: "у депо ще немає составу " + ev.ev.consist };
          return { start: sec, onWagons: true, plan: [
            { couple: true },
            { sig: "@R", end: "НП", txt: "з колії депо до М7" },
            { sig: "М7", end: PLAT, free: true, txt: "на вільну колію біля платформи" },
            { leave: true, consist: ev.ev.out, ready: true }
          ] };
        }
      },
      "Б12": { name: "Подача вагонів на базу ПЧ-14 (колія 12) з колії 5", start: "5П", plan: [{ sig: "Ч5", end: "Б12П" }, { leave: true }, { wait: 60 }, { sig: "М43", end: "5П" }] },
      "Б12П": { name: "Прибирання вагонів з бази ПЧ-14 (колія 12) на колію 5", start: "5П", plan: [{ sig: "Ч5", end: "Б12П" }, { couple: true }, { wait: 120 }, { sig: "М43", end: "5П" }] },
      "Б13": { name: "Подача вагонів на базу ПЧ-14 (колія 13) з колії 5", start: "5П", plan: [{ sig: "Ч5", end: "Б13П" }, { leave: true }, { wait: 60 }, { sig: "М43", end: "5П" }] },
      "Б13П": { name: "Прибирання вагонів з бази ПЧ-14 (колія 13) на колію 5", start: "5П", plan: [{ sig: "Ч5", end: "Б13П" }, { couple: true }, { wait: 120 }, { sig: "М43", end: "5П" }] },
      "Б35": { name: "Подача вагонів на базу ПЧ-14 (колія 35) з колії 5 зі зміною напрямку за М43", start: "5П", plan: [{ sig: "Ч5", end: "Б14П" }, { wait: 60 }, { sig: "М43", end: "Б35П" }, { leave: true }, { wait: 60 }, { sig: "М41", end: "Б14П" }, { sig: "М43", end: "5П" }] },
      "Б35П": { name: "Прибирання вагонів з бази ПЧ-14 (колія 35) на колію 5", start: "5П", plan: [{ sig: "Ч5", end: "Б14П" }, { wait: 60 }, { sig: "М43", end: "Б35П" }, { couple: true }, { wait: 120 }, { sig: "М41", end: "Б14П" }, { sig: "М43", end: "5П" }] },
      "37": { name: "Подача вагонів на колію 37 з колії 11", start: "11П", plan: [{ sig: "Ч11", end: "37П" }, { leave: true }, { wait: 60 }, { sig: "М1", end: "11П" }] },
      "37П": { name: "Прибирання вагонів з колії 37 на колію 11", start: "11П", plan: [{ sig: "Ч11", end: "37П" }, { couple: true }, { wait: 120 }, { sig: "М1", end: "11П" }] },
      "БМЕУ": { name: "Подача вагонів у БМЕУ-3 (колія 1) з колії 11", start: "11П", plan: [{ sig: "Ч11", end: "БМЕУ1П" }, { leave: true }, { wait: 60 }, { sig: "М1", end: "11П" }] },
      "БМЕУП": { name: "Прибирання вагонів з БМЕУ-3 на колію 11", start: "11П", plan: [{ sig: "Ч11", end: "БМЕУ1П" }, { couple: true }, { wait: 120 }, { sig: "М1", end: "11П" }] },
      "38": { name: "Подача вагонів на колію 38 (тупик за мостом) з колії 9", start: "9П", plan: [{ sig: "Н9", end: "38П" }, { leave: true }, { wait: 60 }, { sig: "М20", end: "9П" }] },
      "38П": { name: "Прибирання вагонів з колії 38 на колію 9", start: "9П", plan: [{ sig: "Н9", end: "38П" }, { couple: true }, { wait: 120 }, { sig: "М20", end: "9П" }] },
      "ПК2": { name: "Подача вагонів на під'їзну колію П/К (2) з колії 6", start: "6П", plan: [{ sig: "Н6", end: "ПК2П" }, { leave: true }, { wait: 60 }, { sig: "М10", end: "6П" }] },
      "ПК2П": { name: "Прибирання вагонів з П/К (2) на колію 6", start: "6П", plan: [{ sig: "Н6", end: "ПК2П" }, { couple: true }, { wait: 120 }, { sig: "М10", end: "6П" }] },
      "23": { name: "Подача вагонів до вантажної платформи (колія 23) з колії 5", start: "5П", plan: [{ sig: "Н5", end: "М2" }, { wait: 60 }, { sig: "М16", end: "23П" }, { leave: true }, { wait: 60 }, { sig: "М30", end: "М2" }, { sig: "М16", end: "5П" }] },
      "Л39": { name: "Маневровий локомотив: колія 7 → тупик 39 → колія 7", start: "7П", plan: [{ sig: "Н7", end: "39П" }, { wait: 600 }, { sig: "М6", end: "7П" }] }
    }
  };

  // ------------------------------------------------------------ timetable generator (model)
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const hm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const LEVELS = { low: 0.6, medium: 1, high: 1.5 };
  const LINE = { L: { entry: "НЛ", exit: "2ЛП", name: "Запоріжжя-Ліве" }, N: { entry: "ЧМ", exit: "2МП", name: "Нікополь" }, P: { entry: "НП", exit: "2ПП", name: "Пологи" }, Z: { entry: "ЧЗ", exit: "2ЗП", name: "Запоріжжя 1" } };
  const FAR = { passenger: { N: ["Кривий Ріг", "Нікополь", "Марганець"], Z: ["Запоріжжя 1", "Харків", "Дніпропетровськ"] }, electric: { N: ["Нікополь", "Марганець", "ім. Анатолія Алімова"], Z: ["Запоріжжя 1"] },
    freight: { L: ["Запоріжжя-Ліве"], N: ["Нікополь"], P: ["Пологи"], Z: ["Запоріжжя 1"] } };

  function generate(seed, intensity, day) {
    const r = mulberry32(hash("ZP2|" + seed + "|" + intensity + "|" + day));
    const k = LEVELS[intensity] || 1;
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = (a) => a[ri(0, a.length - 1)];
    const ev = [], used = new Set();
    const num = (base, span, odd) => { for (let i = 0; i < 60; i++) { let n = base + ri(0, span); if ((n % 2 === 1) !== odd) n++; if (!used.has(n)) { used.add(n); return n; } } return base + 2 * used.size + (odd ? 1 : 0); };
    const slots = { L: [], N: [], P: [], Z: [] };
    const slot = (ln, t) => { for (let i = 0; i < 40; i++, t += 3) if (t > 5 && t < 1430 && slots[ln].every((x) => Math.abs(x - t) >= 9)) { slots[ln].push(t); return t; } return null; };
    const unslot = (ln, t) => { const i = slots[ln].indexOf(t); if (i >= 0) slots[ln].splice(i, 1); };
    const plat = [];
    const platFree = (a, b) => plat.filter(([x, y]) => !(b <= x || a >= y)).length < 3;
    function through(type, from, to, t, stop, note) {
      const odd = from === "P" || from === "Z";
      const ta = slot(from, t); if (ta == null) return false;
      const td = slot(to, ta + stop + 2); if (td == null) { unslot(from, ta); return false; }
      if ((type === "passenger" || type === "electric") && !platFree(ta - 4, td + 2)) { unslot(from, ta); unslot(to, td); return false; }
      if (type === "passenger" || type === "electric") plat.push([ta - 4, td + 2]);
      const n = num(type === "passenger" ? 61 : type === "electric" ? 6301 : type === "reserve" ? 4701 : type === "household" ? 9501 : 2001, type === "freight" ? 898 : 98, odd);
      const fr = (FAR[type] || FAR.freight)[from] || [LINE[from].name], tt = (FAR[type] || FAR.freight)[to] || [LINE[to].name];
      ev.push({ time: hm(ta), train: String(n), type, direction: odd ? "odd" : "even", action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[from].entry, exitTo: LINE[to].exit,
        from: pick(fr), to: pick(tt), timeStatus: "generated", note: note || (stop ? "зупинка " + stop + " хв" : "без зупинки") + ": з " + LINE[from].name + " на " + LINE[to].name });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(); a++); };
    // passenger trains Нікополь ↔ Запоріжжя 1, a few minutes at the platform
    tryN(Math.max(2, Math.round(4 * k)), () => (r() < 0.5 ? through("passenger", "N", "Z", ri(240, 1380), ri(2, 4)) : through("passenger", "Z", "N", ri(240, 1380), ri(2, 4))));
    // through electric trains
    tryN(Math.max(3, Math.round(6 * k)), () => (r() < 0.5 ? through("electric", "N", "Z", ri(300, 1360), ri(1, 2)) : through("electric", "Z", "N", ri(300, 1360), ri(1, 2))));
    // electric trains of the depot: arrive from Запоріжжя 1, go to the depot, later come out and leave
    let mn = 0;
    const shunt = (t, job, extra) => ev.push(Object.assign({ time: hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" }, extra || {}));
    tryN(Math.max(1, Math.round(2 * k)), () => {
      const ta = slot("Z", ri(300, 900)); if (ta == null) return false;
      const out = ta + ri(120, 260), dir = r() < 0.5 ? "Z" : "N", td = slot(dir, out + 30);
      if (td == null || td > 1420 || !platFree(ta - 4, ta + 12) || !platFree(out, td + 2)) { unslot("Z", ta); if (td != null) unslot(dir, td); return false; }
      plat.push([ta - 4, ta + 12], [out, td + 2]);
      const n = num(6401, 98, true), c = String(n), on = num(6401, 98, dir === "N");
      ev.push({ time: hm(ta), train: c, type: "electric", direction: "odd", action: "arrive", consist: c, ready: true, entry: "ЧЗ", from: "Запоріжжя 1", to: "Запоріжжя II (депо)", timeStatus: "generated", note: "кінцева: після прибуття — у депо РПЧ-3" });
      shunt(ta + ri(6, 10), "DEPOT_IN", { consist: c, note: "електропоїзд № " + c + " у депо" });
      shunt(out, "DEPOT_OUT", { consist: c, out: "Е-" + on, note: "з депо під поїзд № " + on });
      ev.push({ time: hm(td), train: String(on), type: "electric", direction: dir === "N" ? "odd" : "even", action: "depart", consist: "Е-" + on, exitTo: LINE[dir].exit, from: "Запоріжжя II", to: pick(FAR.electric[dir]), timeStatus: "generated", note: "формується з депо" });
      return true;
    });
    // freight: Запоріжжя-Ліве ↔ Пологи / Запоріжжя 1, some stand on the side tracks
    tryN(Math.max(3, Math.round(8 * k)), () => {
      const a = pick(["L", "L", "N"]), b = pick(["P", "Z", "Z"]);
      const [f, t] = r() < 0.5 ? [a, b] : [b, a];
      return through("freight", f, t, ri(0, 1400), r() < 0.3 ? ri(20, 60) : 0, null);
    });
    tryN(Math.max(1, Math.round(2 * k)), () => (r() < 0.5 ? through("reserve", pick(["L", "N"]), pick(["P", "Z"]), ri(0, 1400), 0) : through("reserve", pick(["P", "Z"]), pick(["L", "N"]), ri(0, 1400), 0)));
    if (r() < 0.6 * k) tryN(1, () => through("household", "L", "P", ri(480, 900), ri(20, 40), "господарський: стоянка на бічній колії"));
    // local shunting work
    const JOBS = [["Б12", "5П"], ["Б13", "5П"], ["Б35", "5П"], ["37", "11П"], ["БМЕУ", "11П"], ["38", "9П"], ["ПК2", "6П"], ["23", "5П"], ["Л39", "7П"]];
    const PICK = { "Б12": "Б12П", "Б13": "Б13П", "Б35": "Б35П", "37": "37П", "БМЕУ": "БМЕУП", "38": "38П", "ПК2": "ПК2П" };
    const busy = {}, loaded = {};
    const free = (st, a, b) => (busy[st] || []).every(([x, y]) => b <= x || a >= y);
    const nJ = Math.round(9 * k);
    for (let i = 0; i < nJ; i++) {
      const t = 270 + (i + 0.5) * (1110 / nJ) + ri(-20, 20);
      const ok = JOBS.filter(([j, st]) => !loaded[j] && free(st, t - 5, t + 45));
      if (!ok.length) continue;
      const [job, st] = pick(ok);
      (busy[st] = busy[st] || []).push([t - 5, t + 45]);
      shunt(t, job);
      if (PICK[job]) { const tp = t + ri(100, 220); if (tp < 1390 && free(st, tp - 5, tp + 45)) { loaded[job] = true; busy[st].push([tp - 5, tp + 45]); shunt(tp, PICK[job]); } }
    }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "zaporizhzhia2_generated_" + seed + "_" + intensity + "_d" + day, station: "Запоріжжя II", generated: true, events: ev };
  }

  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.zaporizhzhia2 = { id: "zaporizhzhia2", name: "Запоріжжя II", note: "вузлова: Запоріжжя-Ліве, Нікополь, Пологи, Запоріжжя 1; депо РПЧ-3", TOPOLOGY: T, MODEL_PARAMS: P, generate };
})();

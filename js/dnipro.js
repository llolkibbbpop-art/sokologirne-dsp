/*
 * Станція Дніпро-Головний (on the plan «Дніпропетровськ», дата кор. 22.01.2016).
 * A large junction: on the left the single-track line to Кайдацька (ЧК), the double-track line to
 * Горяїнове (ЧГ1 / ВГ) and the single-track line to Сухачівка (ЧГ); on the right the double-track
 * line to Пост Амur — Нижньодніпровськ (Н / ВА).
 * Drawn after the four parts of the plan as a square (45°) schematic:
 *  - the passenger park, 18 tracks (20 … 1) with lengths from the plan, exit signals Н.. / Ч..;
 *  - left throat: ladders from the Кайдацька line to the upper group and from the Горяїнове line to
 *    the lower group, crossovers, the connection 158/160 between the groups, shunting signals
 *    М2, М4, М6, М12, М14, М16 for running round in the throat;
 *  - track 40 and П/К (2) off the Кайдацька line (М8, М10, М24), the goods line with tracks 44, 6т–8т
 *    (М84, М94, М202) and on the right tracks 34, 36, 37 (М59, М61, М63, М65, М67), dead end 22 (М43);
 *  - the servicing park (екіпірувальний парк, 1еп–9еп), the carriage depot (7в, 4в), the locomotive
 *    depot (4д, ЛД), РПЧ-1 (1к–6к), База ПЧ, tracks 29 and 30 near П.Б.
 * The plan has many more switches than are drawn here; groups of them are merged into ladders.
 * Model choices: block division, the timetable, train lengths and the shunting plans.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  // the passenger park, top to bottom: [id, name on the plan, y, length, signal suffix]
  const PARK = [["20П", "20", 160, 335, "20"], ["19П", "19", 195, 337, "19"], ["XVIIIП", "XVIII", 230, 748, "18"], ["17П", "17", 265, 747, "17"], ["16П", "16", 300, 839, "16"],
    ["15П", "15", 335, 844, "15"], ["14П", "14", 370, 585, "14"], ["12П", "12", 405, 600, "12"], ["11П", "11", 440, 560, "11"], ["9П", "9", 475, 574, "9"], ["8П", "8", 510, 736, "8"],
    ["7П", "7", 545, 567, "7"], ["6П", "6", 580, 588, "6"], ["5П", "5", 615, 585, "5"], ["IVП", "IV", 650, 788, "4"], ["3П", "3", 685, 488, "3"], ["2П", "2", 720, 423, "2"], ["1П", "1", 755, 575, "1"]];
  const XL = 900, XR = 2100, M = (x) => 3000 - x;
  const N = {
    // ---- left: lines
    A0k: [-150, 230], APk: [-55, 230], EK: [40, 230], A0gu: [-150, 440], APgu: [-55, 440], EGU: [40, 440],
    A0gl: [-150, 475], APgl: [-55, 475], EGL: [40, 475], A0s: [-150, 650], APs: [-55, 650], ES: [40, 650], SB: [270, 650],
    // ---- Кайдацька line: 10, 12, 14, track 40, П/К (2), the goods line
    M8n: [125, 230], S10: [170, 230], S12: [205, 195], M10n: [60, 195], H40: [-110, 195], S14: [290, 195], M24n: [360, 195], HPK2: [470, 195],
    X14: [325, 160], X14b: [360, 125], M202n: [420, 125], S90: [620, 125], X90: [655, 90], M84n: [680, 90], H44: [900, 90],
    M94n: [930, 125], S204: [1000, 125], S206: [1035, 90], J8t: [1060, 90], H8t: [1350, 90], X206: [1070, 55], H7t: [1400, 55],
    S210: [1500, 125], X210: [1535, 90], H6t: [1850, 90],
    // ---- left throat
    S8: [400, 230], M16n: [440, 230], M6n: [460, 230], K4: [500, 230], KU: [535, 195], X20: [570, 160], K6: [580, 230],
    D1: [615, 265], D2: [650, 300], D3: [685, 335], D4: [720, 370], X12: [755, 405], S160: [790, 440],
    U1: [140, 440], U2: [190, 440], M14n: [250, 440], M12n: [270, 440], U3: [305, 440],
    L1s: [105, 475], L3s: [340, 475], M2n: [368, 475], M4n: [392, 475], S38: [445, 475], G5: [480, 475],
    E1: [515, 510], E2: [550, 545], E3: [585, 580], E4: [620, 615], E5: [655, 650], E6: [690, 685], E7: [725, 720], E8: [760, 755],
    // ---- servicing park, depots
    Qb: [795, 790], Q: [830, 825], D0: [865, 860], Q0: [830, 895],
    M72n: [935, 860], S86: [965, 860], X86: [1000, 895], M80n: [1025, 895], H4d: [1130, 895],
    S88: [1180, 860], X88: [1215, 895], M88n: [1240, 895], HLD: [1350, 895],
    S148: [1390, 860], M98n: [1430, 860], HPC: [1600, 860],
    S150: [1425, 895], S152: [1460, 930], S154: [1495, 965], S156: [1530, 1000], S158: [1565, 1035], X6k: [1600, 1070],
    // ---- right: lines
    EAU: [2960, 440], BAu: [3055, 440], AAu: [3150, 440], EAL: [2960, 475], BAl: [3055, 475], AAl: [3150, 475],
    // ---- right throat specials
    M43n: [2650, 230], H22: [2900, 230],
    S99: [2200, 160], S97: [2235, 125], M67n: [2260, 125], M63n: [2290, 125], S101: [2320, 125], X101: [2355, 90], M65n: [2380, 90], H34: [2430, 90],
    S91: [2420, 125], M59n: [2500, 125], H36: [2700, 125], X91: [2455, 90], M61n: [2510, 90], H37: [2700, 90],
    S49: [2205, 790], J29: [2130, 790], H29: [1950, 790], X49: [2170, 825], J30: [2135, 825], H30: [1950, 825]
  };
  // the right throat mirrors the left one
  const MIR = { L1s: "L1sr", U1: "U1r", U2: "U2r", M14n: "M17n", M12n: "M19n", U3: "U3r", L3s: "L3sr", M2n: "M21n", M4n: "M25n", G5: "G5r", S8: "S8r", M16n: "M51n", M6n: "M45n",
    K4: "K4r", KU: "KUr", X20: "X20r", K6: "K6r", D1: "D1r", D2: "D2r", D3: "D3r", D4: "D4r", X12: "X12r", S160: "S160r",
    E1: "E1r", E2: "E2r", E3: "E3r", E4: "E4r", E5: "E5r", E6: "E6r", E7: "E7r", E8: "E8r" };
  Object.entries(MIR).forEach(([a, b]) => (N[b] = [M(N[a][0]), N[a][1]]));
  // the pairs of shunting signals keep the outer one (to the line) and the inner one in order
  Object.assign(N, { M17n: [2745, 440], M19n: [2768, 440], U3r: [2710, 440], L3sr: [2675, 475], M21n: [2622, 475], M25n: [2592, 475], M45n: [2545, 230], M51n: [2570, 230] });
  // the servicing park: 1еп … 9еп (dead ends to the left), then the carriage depot
  const EP = [["1еп", 376], ["2еп", 377], ["3еп", 401], ["4еп", 343], ["5еп", 276], ["6еп", 238], ["7еп", 256], ["8еп", 247], ["9еп", 114]];
  EP.forEach((e, i) => { const x = 795 - 35 * i, y = 930 + 35 * i; N["P" + (i + 1)] = [x, y]; N["J" + e[0]] = [x - 40, y]; N["H" + e[0]] = [150, y]; });
  N.V1 = [480, 1245]; N.JV7 = [440, 1245]; N.HV7 = [200, 1245]; N.XV4 = [445, 1280]; N.JV4 = [405, 1280]; N.HV4 = [200, 1280];
  // РПЧ-1: 1к … 6к
  const KK = [["1к", 169, "S150", "М116"], ["2к", 108, "S152", "М118"], ["3к", 105, "S154", "М3К"], ["4к", 148, "S156", "М4К"], ["5к", 120, "S158", "М5К"], ["6к", 110, "X6k", "М6К"]];
  KK.forEach(([id, , sw]) => { N["J" + id] = [N[sw][0] + 35, N[sw][1]]; N["H" + id] = [1750, N[sw][1]]; });
  PARK.forEach(([id, , y]) => { N["L" + id] = [XL, y]; N["R" + id] = [XR, y]; });
  const L = (t) => "L" + t + "П", R = (t) => "R" + t + "П";

  const SW = [
    // Кайдацька line, track 40, П/К (2), goods line
    ["10", "S10", "M8n", "S8", "S12", 1], ["12", "S12", "S14", "M10n", "S10", -1], ["14", "S14", "S12", "X14", "M24n", 1],
    ["90", "S90", "M202n", "M94n", "X90", -1], ["204", "S204", "M94n", "S210", "S206", -1], ["206", "S206", "S204", "X206", "J8t", -1], ["210", "S210", "S204", "S97", "X210", -1],
    // left throat
    ["2", "L1s", "EGL", "L3s", "U1", 1], ["4", "U1", "U2", "EGU", "L1s", -1], ["6", "U2", "U1", "M14n", "S8", -1], ["20", "U3", "M12n", "S160", "L3s", -1],
    ["22", "L3s", "M2n", "L1s", "U3", 1], ["38", "S38", "G5", "M4n", "SB", -1], ["8", "S8", "M16n", "S10", "U2", -1],
    ["40", "K4", "M6n", "K6", "KU", -1], ["42", "KU", "K4", "X20", L("19"), -1], ["44", "K6", "K4", L("XVIII"), "D1", 1],
    ["50", "D1", "K6", "D2", L("17"), 1], ["52", "D2", "D1", "D3", L("16"), 1], ["54", "D3", "D2", "D4", L("15"), 1], ["56", "D4", "D3", "X12", L("14"), 1],
    ["158", "X12", "D4", "S160", L("12"), 1], ["160", "S160", L("11"), "U3", "X12", 1],
    ["62", "G5", "S38", L("9"), "E1", 1], ["64", "E1", "G5", "E2", L("8"), 1], ["66", "E2", "E1", "E3", L("7"), 1], ["68", "E3", "E2", "E4", L("6"), 1],
    ["70", "E4", "E3", "E5", L("5"), 1], ["72", "E5", "E4", "E6", L("IV"), 1], ["74", "E6", "E5", "E7", L("3"), 1], ["76", "E7", "E6", "E8", L("2"), 1], ["78", "E8", "E7", "Qb", L("1"), 1],
    // servicing park, depots
    ["402", "D0", "Q", "M72n", "Q0", 1], ["86", "S86", "M72n", "S88", "X86", -1], ["88", "S88", "S86", "S148", "X88", -1], ["148", "S148", "S88", "M98n", "S150", -1],
    ["150", "S150", "S148", "S152", "J1к", 1], ["152", "S152", "S150", "S154", "J2к", 1], ["154", "S154", "S152", "S156", "J3к", 1], ["156", "S156", "S154", "S158", "J4к", 1], ["157", "S158", "S156", "X6k", "J5к", 1],
    ["404", "P1", "Q0", "P2", "J1еп", -1], ["406", "P2", "P1", "P3", "J2еп", -1], ["408", "P3", "P2", "P4", "J3еп", -1], ["410", "P4", "P3", "P5", "J4еп", -1], ["412", "P5", "P4", "P6", "J5еп", -1],
    ["414", "P6", "P5", "P7", "J6еп", -1], ["416", "P7", "P6", "P8", "J7еп", -1], ["418", "P8", "P7", "P9", "J8еп", -1], ["420", "P9", "P8", "V1", "J9еп", -1], ["316", "V1", "P9", "XV4", "JV7", -1],
    // right throat
    ["1", "L1sr", "EAL", "L3sr", "U1r", 1], ["3", "U1r", "U2r", "EAU", "L1sr", -1], ["5", "U2r", "U1r", "M17n", "S8r", -1], ["7", "U3r", "M19n", "S160r", "L3sr", 1],
    ["23", "L3sr", "M21n", "L1sr", "U3r", 1], ["9", "S8r", "M51n", "M43n", "U2r", -1],
    ["51", "K4r", "M45n", "K6r", "KUr", -1], ["53", "KUr", "K4r", "X20r", R("19"), -1], ["55", "K6r", "K4r", R("XVIII"), "D1r", 1],
    ["57", "D1r", "K6r", "D2r", R("17"), 1], ["59", "D2r", "D1r", "D3r", R("16"), 1], ["61", "D3r", "D2r", "D4r", R("15"), 1], ["63", "D4r", "D3r", "X12r", R("14"), 1],
    ["81", "X12r", "D4r", "S160r", R("12"), 1], ["79", "S160r", R("11"), "U3r", "X12r", 1],
    ["27", "G5r", "M25n", R("9"), "E1r", 1], ["29", "E1r", "G5r", "E2r", R("8"), 1], ["31", "E2r", "E1r", "E3r", R("7"), 1], ["33", "E3r", "E2r", "E4r", R("6"), 1],
    ["35", "E4r", "E3r", "E5r", R("5"), 1], ["37", "E5r", "E4r", "E6r", R("IV"), 1], ["39", "E6r", "E5r", "E7r", R("3"), 1], ["41", "E7r", "E6r", "E8r", R("2"), 1], ["45", "E8r", "E7r", "S49", R("1"), 1],
    ["49", "S49", "E8r", "X49", "J29", -1],
    ["99", "S99", R("20"), "X20r", "S97", -1], ["97", "S97", "M67n", "S210", "S99", 1], ["101", "S101", "M63n", "S91", "X101", -1], ["91", "S91", "S101", "M59n", "X91", -1]
  ];
  const E = [
    ["A0k", "APk", "2КД"], ["APk", "EK", "1КД"], ["EK", "M8n"], ["M8n", "S10"], ["S10", "S8"], ["S10", "S12"], ["S12", "M10n"], ["M10n", "H40", "40П"], ["S12", "S14"],
    ["S14", "M24n"], ["M24n", "HPK2", "ПК2П"], ["S14", "X14"], ["X14", "X14b"], ["X14b", "M202n"], ["M202n", "S90"], ["S90", "X90"], ["X90", "M84n"], ["M84n", "H44", "44П"],
    ["S90", "M94n"], ["M94n", "S204"], ["S204", "S206"], ["S206", "J8t"], ["J8t", "H8t", "8тП"], ["S206", "X206"], ["X206", "H7t", "7тП"], ["S204", "S210"], ["S210", "X210"], ["X210", "H6t", "6тП"],
    ["S210", "S97"],
    ["A0gu", "APgu", "2НГ"], ["APgu", "EGU", "1НГ"], ["EGU", "U1"], ["A0gl", "APgl", "2ЧГ"], ["APgl", "EGL", "1ЧГ"], ["EGL", "L1s"], ["A0s", "APs", "2СХ"], ["APs", "ES", "1СХ"], ["ES", "SB"], ["SB", "S38"],
    ["L1s", "U1"], ["L1s", "L3s"], ["U1", "U2"], ["U2", "M14n"], ["M14n", "M12n", "6-20П"], ["M12n", "U3"], ["U2", "S8"], ["U3", "L3s"], ["U3", "S160"], ["S160", L("11")], ["S160", "X12"],
    ["L3s", "M2n"], ["M2n", "M4n", "22-38П"], ["M4n", "S38"], ["S38", "G5"],
    ["S8", "M16n"], ["M16n", "M6n", "8-40П"], ["M6n", "K4"], ["K4", "KU"], ["KU", "X20"], ["X20", L("20")], ["KU", L("19")], ["K4", "K6"], ["K6", L("XVIII")],
    ["K6", "D1"], ["D1", "D2"], ["D2", "D3"], ["D3", "D4"], ["D4", "X12"], ["D1", L("17")], ["D2", L("16")], ["D3", L("15")], ["D4", L("14")], ["X12", L("12")],
    ["G5", L("9")], ["G5", "E1"], ["E1", "E2"], ["E2", "E3"], ["E3", "E4"], ["E4", "E5"], ["E5", "E6"], ["E6", "E7"], ["E7", "E8"], ["E8", "Qb"],
    ["E1", L("8")], ["E2", L("7")], ["E3", L("6")], ["E4", L("5")], ["E5", L("IV")], ["E6", L("3")], ["E7", L("2")], ["E8", L("1")],
    ["Qb", "Q", "МР-П"], ["Q", "D0"], ["D0", "M72n"], ["M72n", "S86"], ["S86", "X86"], ["X86", "M80n"], ["M80n", "H4d", "4дП"], ["S86", "S88"], ["S88", "X88"], ["X88", "M88n"], ["M88n", "HLD", "ЛДП"],
    ["S88", "S148"], ["S148", "M98n"], ["M98n", "HPC", "ПЧП"], ["S148", "S150"], ["S150", "S152"], ["S152", "S154"], ["S154", "S156"], ["S156", "S158"], ["S158", "X6k"],
    ["D0", "Q0"], ["Q0", "P1"], ["P9", "V1"], ["V1", "JV7"], ["JV7", "HV7", "7вП"], ["V1", "XV4"], ["XV4", "JV4"], ["JV4", "HV4", "4вП"],
    // right
    ["EAU", "BAu", "1НА"], ["BAu", "AAu", "2НА"], ["EAL", "BAl", "1ЧА"], ["BAl", "AAl", "2ЧА"], ["U1r", "EAU"], ["L1sr", "EAL"],
    ["L1sr", "U1r"], ["L1sr", "L3sr"], ["U1r", "U2r"], ["U2r", "M17n"], ["M17n", "M19n", "5-7П"], ["M19n", "U3r"], ["U2r", "S8r"], ["U3r", "L3sr"], ["U3r", "S160r"], ["S160r", R("11")], ["S160r", "X12r"],
    ["L3sr", "M21n"], ["M21n", "M25n", "23-27П"], ["M25n", "G5r"],
    ["S8r", "M51n"], ["M51n", "M45n", "9-51П"], ["M45n", "K4r"], ["S8r", "M43n"], ["M43n", "H22", "22П"],
    ["K4r", "KUr"], ["KUr", "X20r"], ["X20r", "S99"], ["S99", R("20")], ["KUr", R("19")], ["K4r", "K6r"], ["K6r", R("XVIII")],
    ["K6r", "D1r"], ["D1r", "D2r"], ["D2r", "D3r"], ["D3r", "D4r"], ["D4r", "X12r"], ["D1r", R("17")], ["D2r", R("16")], ["D3r", R("15")], ["D4r", R("14")], ["X12r", R("12")],
    ["G5r", R("9")], ["G5r", "E1r"], ["E1r", "E2r"], ["E2r", "E3r"], ["E3r", "E4r"], ["E4r", "E5r"], ["E5r", "E6r"], ["E6r", "E7r"], ["E7r", "E8r"], ["E8r", "S49"],
    ["E1r", R("8")], ["E2r", R("7")], ["E3r", R("6")], ["E4r", R("5")], ["E5r", R("IV")], ["E6r", R("3")], ["E7r", R("2")], ["E8r", R("1")],
    ["S49", "J29"], ["J29", "H29", "29П"], ["S49", "X49"], ["X49", "J30"], ["J30", "H30", "30П"],
    ["S99", "S97"], ["S97", "M67n"], ["M67n", "M63n", "97-101П"], ["M63n", "S101"], ["S101", "X101"], ["X101", "M65n"], ["M65n", "H34", "34П"],
    ["S101", "S91"], ["S91", "M59n"], ["M59n", "H36", "36П"], ["S91", "X91"], ["X91", "M61n"], ["M61n", "H37", "37П"]
  ];
  EP.forEach(([id, len], i) => { E.push(["P" + (i + 1), "J" + id]); E.push(["J" + id, "H" + id, id + "П"]); if (i < EP.length - 1) E.push(["P" + (i + 1), "P" + (i + 2)]); });
  KK.forEach(([id, , sw]) => { E.push([sw, "J" + id]); E.push(["J" + id, "H" + id, id + "П"]); });
  const info = {
    "40П": { kind: "track", len: 147, label: "Колія 40 (147 м, тупик)" }, "ПК2П": { kind: "track", len: 150, label: "Під'їзна колія П/К (2) (діє)" },
    "44П": { kind: "track", len: 210, label: "Колія 44 (210 м, тупик)" }, "8тП": { kind: "track", len: 238, label: "Колія 8т (238 м, вантажна)" }, "7тП": { kind: "track", len: 259, label: "Колія 7т (259 м, вантажна)" },
    "6тП": { kind: "track", len: 301, label: "Колія 6т (301 м, вантажна)" }, "22П": { kind: "track", len: 293, label: "Колія 22 (293 м, тупик)" },
    "34П": { kind: "track", len: 120, label: "Колія 34 (КН, тупик)" }, "36П": { kind: "track", len: 200, label: "Колія 36 (тупик)" }, "37П": { kind: "track", len: 180, label: "Колія 37 (тупик)" },
    "29П": { kind: "track", len: 92, label: "Колія 29 (92 м, біля П.Б.)" }, "30П": { kind: "track", len: 70, label: "Колія 30 (70 м, біля П.Б.)" },
    "4дП": { kind: "track", len: 150, label: "Колія 4д — локомотивне депо" }, "ЛДП": { kind: "track", len: 200, label: "Колія локомотивного депо (через стрілку 316 на плані)" },
    "ПЧП": { kind: "track", len: 120, label: "Колія бази ПЧ" }, "7вП": { kind: "track", len: 150, label: "Колія 7в — вагонне депо" }, "4вП": { kind: "track", len: 120, label: "Колія 4в — вагонне депо" },
    "6-20П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 6 і 20 (М14 / М12)" }, "22-38П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 22 і 38 (М2 / М4)" },
    "8-40П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 8 і 40 (М16 / М6)" }, "МР-П": { kind: "switchless", len: 60, label: "Ділянка до екіпірувального парку і депо (М2Р / М3Р)" },
    "5-7П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 5 і 7 (М17 / М19)" }, "23-27П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 23 і 27 (М25 / М21)" },
    "9-51П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 9 і 51 (М45 / М51)" }, "97-101П": { kind: "switchless", len: 60, label: "Ділянка між стрілками 97 і 101 (М67 / М63)" }
  };
  EP.forEach(([id, len]) => (info[id + "П"] = { kind: "track", len, label: "Колія " + id + " (" + len + " м), екіпірувальний парк" }));
  KK.forEach(([id, len]) => (info[id + "П"] = { kind: "track", len, label: "Колія " + id + " (" + len + " м), РПЧ-1" }));
  const sig = (id, node, dir, note) => ({ id, node, dir, kind: "shunt", note });
  const signals = [
    sig("М8", "M8n", "L", "з колії 40 і П/К (2) на Кайдацький хід"), sig("М10", "M10n", "R", "виїзд з колії 40"), sig("М24", "M24n", "L", "виїзд з П/К (2)"),
    sig("М202", "M202n", "R", "на вантажні колії"), sig("М84", "M84n", "L", "виїзд з колії 44"), sig("М94", "M94n", "L", "з вантажних колій 6т–8т"),
    sig("М16", "M16n", "L", "витягування в горловині (Кайдацький хід)"), sig("М6", "M6n", "R", "з горловини на колії 20 … 12"),
    sig("М14", "M14n", "L", "витягування в горловині (хід Горяїнове)"), sig("М12", "M12n", "R", "з горловини на колію 11 і через 160/158 на колії 12 … 20"),
    sig("М2", "M2n", "L", "витягування в горловині"), sig("М4", "M4n", "R", "з горловини на колії 9 … 1, в екіпірувальний парк і депо"),
    Object.assign(sig("М2Р", "Qb", "L", "з екіпірувального парку і депо в парк"), { dx: 34 }), Object.assign(sig("М3Р", "Q", "R", "в екіпірувальний парк і депо"), { dx: -34 }), Object.assign(sig("М4Р", "Q0", "R", "виїзд з екіпірувального парку"), { dx: 34 }),
    sig("М72", "M72n", "R", "на колії депо"), sig("М80", "M80n", "L", "виїзд з колії 4д"), sig("М88", "M88n", "L", "виїзд з локомотивного депо"), sig("М98", "M98n", "L", "виїзд з бази ПЧ"),
    sig("М17", "M17n", "L", "з горловини на колію 11 і через 79/81 на колії 12 … 20"), sig("М19", "M19n", "R", "витягування в горловині (хід Пост Амур)"),
    sig("М25", "M25n", "L", "з горловини на колії 9 … 1, 29, 30"), sig("М21", "M21n", "R", "витягування в горловині"),
    sig("М45", "M45n", "L", "з горловини на колії 20 … 12"), sig("М51", "M51n", "R", "витягування в горловині"), sig("М43", "M43n", "L", "виїзд з колії 22"),
    sig("М67", "M67n", "L", "витягування на вантажному ході"), sig("М63", "M63n", "R", "на колії 34, 36, 37"), sig("М65", "M65n", "L", "виїзд з колії 34"),
    sig("М59", "M59n", "L", "виїзд з колії 36"), sig("М61", "M61n", "L", "виїзд з колії 37"), sig("М47", "J29", "R", "виїзд з колії 29"), sig("М73", "J30", "R", "виїзд з колії 30")
  ].concat(KK.map(([id, , , s]) => sig(s, "J" + id, "L", "виїзд з колії " + id)));
  const T = K.build({
    meta: { id: "dnipro", station: "Дніпро-Головний", planDate: "22.01.2016", shuntToTracks: true, rightParity: "even", lockFrame: true, shuntStops: 5 },
    nodes: N, switches: SW, edges: E, info, signals,
    park: PARK.map(([id, name, , len, sx]) => ({ id, L: "L" + id, R: "R" + id, len, sigL: "Н" + sx, sigR: "Ч" + sx, name, label: "Колія " + name + " (" + len + " м)" })),
    lines: [
      { key: "K", name: "Кайдацька", arrParity: "even", secs: [["2КД", 1300, "Перегін Кайдацька — Дніпро-Головний, 2-й блок (одноколійний)"], ["1КД", 900, "Перегін Кайдацька — Дніпро-Головний, 1-й блок (одноколійний)"]],
        entry: { id: "ЧК", node: "EK", dir: "R", note: "вхідний з Кайдацької" }, exit: { far: "A0k", sec: "2КД" },
        button: { id: "ВК", node: "EK", dx: -110, side: -1, label: "відпр. на КАЙДАЦЬКУ", note: "кінець маршруту відправлення на Кайдацьку" } },
      { key: "G", name: "Горяїнове", arrParity: "even", secs: [["2ЧГ", 1300, "Перегін з Горяїнового, 2-й блок"], ["1ЧГ", 900, "Перегін з Горяїнового, 1-й блок"]],
        entry: { id: "ЧГ1", node: "EGL", dir: "R", note: "вхідний з Горяїнового" },
        exit: { far: "A0gu", sec: "2НГ", secs: [["1НГ", 900, "Перегін на Горяїнове, 1-й блок"], ["2НГ", 1300, "Перегін на Горяїнове, 2-й блок"]] },
        button: { id: "ВГ", node: "EGU", dx: -110, side: -1, label: "відпр. на ГОРЯЇНОВЕ", note: "кінець маршруту відправлення на Горяїнове" } },
      { key: "S", name: "Сухачівка", arrParity: "even", secs: [["2СХ", 1300, "Перегін Сухачівка — Дніпро-Головний, 2-й блок (одноколійний)"], ["1СХ", 900, "Перегін Сухачівка — Дніпро-Головний, 1-й блок (одноколійний)"]],
        entry: { id: "ЧГ", node: "ES", dir: "R", note: "вхідний з Сухачівки" }, exit: { far: "A0s", sec: "2СХ" },
        button: { id: "ВСХ", node: "ES", dx: -110, side: -1, label: "відпр. на СУХАЧІВКУ", note: "кінець маршруту відправлення на Сухачівку" } },
      { key: "A", name: "Пост Амур (Нижньодніпровськ)", arrParity: "odd", secs: [["2НА", 900, "Перегін з Пост Амура, 2-й блок"], ["1НА", 700, "Перегін з Пост Амура, 1-й блок"]],
        entry: { id: "Н", node: "EAU", dir: "L", note: "вхідний з Пост Амура" },
        exit: { far: "AAl", sec: "2ЧА", secs: [["1ЧА", 700, "Перегін на Пост Амур, 1-й блок"], ["2ЧА", 900, "Перегін на Пост Амур, 2-й блок"]] },
        button: { id: "ВА", node: "EAL", dx: 110, side: 1, label: "відпр. на ПОСТ АМУР", note: "кінець маршруту відправлення на Пост Амур (Нижньодніпровськ)" } }
    ],
    view: {
      box: [-165, 25, 3330, 1290],
      platforms: [[1150, 383, 700, 8], [1150, 453, 700, 8], [1150, 593, 700, 8], [1150, 698, 700, 8], [1150, 768, 700, 8]],
      notes: [[-150, 262, "← КАЙДАЦЬКА (одноколійна)"], [-150, 400, "← ГОРЯЇНОВЕ"], [-150, 610, "← СУХАЧІВКА (одноколійна)"], [2960, 395, "ПОСТ АМУР →"], [2960, 528, "Нижньодніпровськ"],
        [150, 885, "Екіпірувальний парк"], [150, 1305, "Вагонне депо"], [1040, 935, "Локомотивне депо"], [1620, 850, "База ПЧ"], [1760, 1090, "РПЧ-1"],
        [1880, 812, "П.Б."], [2440, 80, "КН"], [1450, 45, "вантажні колії"], [2950, 220, "тупик"]],
      borders: [],
      blockLabels: [["2КД", -110, 230, -13], ["1КД", -15, 230, -13], ["2НГ", -110, 440, -13], ["1НГ", -15, 440, -13], ["2ЧГ", -110, 475, 20], ["1ЧГ", -15, 475, 20], ["2СХ", -110, 650, 20], ["1СХ", -15, 650, 20],
        ["1НА", 3000, 440, -13], ["2НА", 3100, 440, -13], ["1ЧА", 3000, 475, 20], ["2ЧА", 3100, 475, 20]],
      graph: ["Горяїнове", "Дніпро-Гол.", "Пост Амур"]
    },
    radio: { sides: { K: { name: "Кайдацька", from: "Кайдацької", dsp: "Бондар", inc: 15 }, G: { name: "Горяїнове", from: "Горяїнового", dsp: "Мельник", inc: 30 }, S: { name: "Сухачівка", from: "Сухачівки", dsp: "Ткачук", inc: 20 },
      A: { name: "Пост Амур", from: "Пост Амура", dsp: "Савченко", inc: 45 } },
      bySignal: { "ЧК": "K", "ЧГ1": "G", "ЧГ": "S", "Н": "A" }, byLine: { "2КД": "K", "2НГ": "G", "2СХ": "S", "2ЧА": "A" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "ЧГ1" }
  });
  // track labels of the dead ends
  [["40 147", -90, 190], ["П/К (2)", 390, 190], ["44 210", 720, 85], ["8т 238", 1150, 85], ["7т 259", 1150, 50], ["6т 301", 1650, 85], ["22 293", 2700, 225], ["36", 2560, 120], ["37", 2560, 85],
    ["29 92", 2010, 785], ["30 70", 2010, 820], ["4д", 1085, 890], ["ЛД", 1300, 890], ["ПЧ", 1550, 855], ["7в", 230, 1240], ["4в", 230, 1275]]
    .concat(EP.map(([id, len], i) => [id + " " + len, 170, 925 + 35 * i])).concat(KK.map(([id, len, sw]) => [id + " " + len, 1680, N[sw][1] - 5]))
    .forEach((l) => T.labels.push(l));

  // ------------------------------------------------------------ model parameters
  const LOWER = ["9П", "8П", "7П", "6П", "5П", "3П", "2П", "1П"], UPPER = ["20П", "19П", "17П", "16П", "15П", "14П", "12П"];
  const EPT = EP.map(([id]) => id + "П"), DEPOT = ["ЛДП", "4дП", "1кП", "2кП", "3кП"];
  const PLAT = PARK.map((p) => p[0]).filter((t) => t !== "XVIIIП" && t !== "IVП");
  const P = {
    directionParity: { even: "even", odd: "odd", arr: "odd", dep: "even" }, directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["11П", "9П", "8П", "12П", "XVIIIП", "IVП"], even: ["9П", "8П", "11П", "12П", "XVIIIП", "IVП"] },
    typeTracks: { passenger: ["9П", "8П", "7П", "6П", "5П", "12П", "11П", "14П", "15П", "16П", "17П", "3П"], electric: ["3П", "2П", "1П", "5П", "6П", "7П", "20П", "19П", "14П", "12П", "15П", "16П"],
      freight: ["XVIIIП", "IVП", "17П", "16П", "8П", "11П"], household: ["IVП", "XVIIIП"], reserve: ["XVIIIП", "IVП", "15П", "11П"], test: ["XVIIIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 5, electric: 5, freight: 7, household: 7, reserve: 5, shunting: 1, test: 5 }, departLeadMin: 6, terminateSec: 90,
    speedKmh: { passenger: 50, electric: 50, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: PLAT, mainTracks: ["XVIIIП", "IVП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 40,
    shuntingJobs: {
      // the train locomotive of a train from Пост Амур is uncoupled and taken to the depot
      LOCO_OUT: {
        name: "Зміна локомотива: прибулий локомотив — у депо", estSec: 900,
        build({ S, ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
          if (S.sec[sec].wagons.ready) return { skip: "локомотив уже змінено" };
          return { start: sec, onWagons: true, plan: [
            { sig: "@L", end: "М2", txt: "відчепитися і виїхати ліворуч у горловину за М2" },
            { sig: "М4", end: DEPOT, free: true, txt: "за М4 через стрілки 62 … 78, М3Р — на вільну колію депо" }
          ] };
        }
      },
      // a locomotive from the depot to the head of the train (left end)
      LOCO_IN: {
        name: "Зміна локомотива: локомотив з депо в голову поїзда", estSec: 900,
        build({ S, ev, findConsist, secBusy }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
          if (S.sec[sec].wagons.ready) return { skip: "локомотив уже на поїзді" };
          if (S.trains.some((t) => !t.done && t.shunt && t.shunt.job === "LOCO_OUT" && t.seq.includes(sec))) return { wait: "прибулий локомотив ще не відійшов" };
          const start = ["1кП", "2кП", "3кП", "ЛДП", "4дП"].find((s) => !secBusy(S.sec[s]) && !S.sec[s].lock);
          if (!start) return { wait: "у депо немає вільної колії з локомотивом" };
          return { start, plan: [
            { sig: "@L", end: "М2", txt: "з депо через М2Р, стрілки 78 … 62 у горловину за М2" },
            { sig: "М4", end: sec, txt: "за М4 на колію " + sec.replace("П", "") + " до состава" },
            { attach: true }
          ] };
        }
      },
      // a terminating long-distance train: the consist goes to the servicing park
      EKIP: {
        name: "Подача состава в екіпірувальний парк", estSec: 1500,
        build({ S, ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "поїзд " + ev.ev.consist + " ще не прибув" };
          return { start: sec, onWagons: true, plan: [
            { couple: true },
            { sig: "@L", end: "М2", txt: "з составом ліворуч у горловину за М2" },
            { sig: "М4", end: EPT, free: true, txt: "за М4 через стрілки 62 … 78, М3Р — на вільну колію екіпірувального парку" },
            { leave: true, consist: "Е-" + ev.ev.consist },
            { wait: 60 },
            { sig: "М4Р", end: "М3Р", txt: "локомотив з парку до М3Р" },
            { sig: "@R", end: DEPOT, free: true, txt: "за М72 у депо" }
          ] };
        }
      },
      // after servicing: the consist from the servicing park to a departure track
      EKIPBACK: {
        name: "Виставлення состава з екіпірувального парку на колію відправлення", estSec: 1800,
        build({ S, ev, findConsist, secBusy }) {
          const ws = findConsist("Е-" + ev.ev.consist);
          if (!ws) return { wait: "состава " + ev.ev.consist + " ще немає в екіпірувальному парку" };
          const start = ["ЛДП", "4дП", "1кП", "2кП", "3кП"].find((s) => !secBusy(S.sec[s]) && !S.sec[s].lock);
          if (!start) return { wait: "у депо немає вільної колії з локомотивом" };
          return { start, plan: [
            { sig: "@L", end: "М2Р", txt: "локомотив з депо до М2Р" },
            { sig: "М3Р", end: ws, txt: "за М3Р в екіпірувальний парк до состава" },
            { couple: true }, { wait: 120 },
            { sig: "М4Р", end: "М2", txt: "з составом через М2Р, стрілки 78 … 62 у горловину за М2" },
            { sig: "М4", end: ["9П", "8П", "7П", "6П", "5П", "3П"], free: true, txt: "за М4 на вільну колію відправлення" },
            { leave: true, consist: ev.ev.out, ready: true }
          ] };
        }
      },
      // static jobs
      "ПК2": { name: "Подача вагонів на П/К (2) з колії 40", start: "40П", plan: [{ sig: "М10", end: "ПК2П" }, { leave: true }, { wait: 60 }, { sig: "М24", end: "40П" }] },
      "ПК2П": { name: "Прибирання вагонів з П/К (2) на колію 40", start: "40П", plan: [{ sig: "М10", end: "ПК2П" }, { couple: true }, { wait: 120 }, { sig: "М24", end: "40П" }] },
      "Т8": { name: "Подача вагонів на вантажну колію 8т з колії 40", start: "40П", plan: [{ sig: "М10", end: "8тП" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "40П" }] },
      "Т8П": { name: "Прибирання вагонів з колії 8т на колію 40", start: "40П", plan: [{ sig: "М10", end: "8тП" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "40П" }] },
      "Т7": { name: "Подача вагонів на вантажну колію 7т з колії 40", start: "40П", plan: [{ sig: "М10", end: "7тП" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "40П" }] },
      "Т7П": { name: "Прибирання вагонів з колії 7т на колію 40", start: "40П", plan: [{ sig: "М10", end: "7тП" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "40П" }] },
      "Т6": { name: "Подача вагонів на вантажну колію 6т з колії 40", start: "40П", plan: [{ sig: "М10", end: "6тП" }, { leave: true }, { wait: 60 }, { sig: "@L", end: "40П" }] },
      "Т6П": { name: "Прибирання вагонів з колії 6т на колію 40", start: "40П", plan: [{ sig: "М10", end: "6тП" }, { couple: true }, { wait: 120 }, { sig: "@L", end: "40П" }] },
      "Т44": { name: "Подача вагонів на колію 44 з колії 40", start: "40П", plan: [{ sig: "М10", end: "44П" }, { leave: true }, { wait: 60 }, { sig: "М84", end: "40П" }] },
      "Т44П": { name: "Прибирання вагонів з колії 44 на колію 40", start: "40П", plan: [{ sig: "М10", end: "44П" }, { couple: true }, { wait: 120 }, { sig: "М84", end: "40П" }] },
      "Т37": { name: "Подача вагонів з колії 36 на колію 37 (витягування за М63)", start: "36П", plan: [{ sig: "М59", end: "М67" }, { sig: "М63", end: "37П" }, { leave: true }, { wait: 60 }, { sig: "М61", end: "М67" }, { sig: "М63", end: "36П" }] },
      "Т37П": { name: "Прибирання вагонів з колії 37 на колію 36", start: "36П", plan: [{ sig: "М59", end: "М67" }, { sig: "М63", end: "37П" }, { couple: true }, { wait: 120 }, { sig: "М61", end: "М67" }, { sig: "М63", end: "36П" }] },
      "Т34": { name: "Подача вагонів з колії 36 на колію 34 (КН)", start: "36П", plan: [{ sig: "М59", end: "М67" }, { sig: "М63", end: "34П" }, { leave: true }, { wait: 60 }, { sig: "М65", end: "М67" }, { sig: "М63", end: "36П" }] },
      "Т34П": { name: "Прибирання вагонів з колії 34 (КН) на колію 36", start: "36П", plan: [{ sig: "М59", end: "М67" }, { sig: "М63", end: "34П" }, { couple: true }, { wait: 120 }, { sig: "М65", end: "М67" }, { sig: "М63", end: "36П" }] },
      "Т30": { name: "Подача вагонів з колії 29 на колію 30 (витягування за М21)", start: "29П", plan: [{ sig: "М47", end: "М21" }, { sig: "М25", end: "30П" }, { leave: true }, { wait: 60 }, { sig: "М73", end: "М21" }, { sig: "М25", end: "29П" }] },
      "Т30П": { name: "Прибирання вагонів з колії 30 на колію 29", start: "29П", plan: [{ sig: "М47", end: "М21" }, { sig: "М25", end: "30П" }, { couple: true }, { wait: 120 }, { sig: "М73", end: "М21" }, { sig: "М25", end: "29П" }] },
      "ВД": { name: "Подача вагонів у вагонне депо (колія 7в) з бази ПЧ", start: "ПЧП", plan: [{ sig: "М98", end: "М2Р" }, { sig: "М3Р", end: "7вП" }, { leave: true }, { wait: 60 }, { sig: "М4Р", end: "М3Р" }, { sig: "@R", end: "ПЧП" }] },
      "ВДП": { name: "Прибирання вагонів з вагонного депо (7в) на базу ПЧ", start: "ПЧП", plan: [{ sig: "М98", end: "М2Р" }, { sig: "М3Р", end: "7вП" }, { couple: true }, { wait: 120 }, { sig: "М4Р", end: "М3Р" }, { sig: "@R", end: "ПЧП" }] },
      "ЛД4": { name: "Маневровий локомотив: депо → колія 4д (екіпірування) → депо", start: "ЛДП", plan: [{ sig: "М88", end: "М2Р" }, { sig: "М3Р", end: "4дП" }, { wait: 600 }, { sig: "М80", end: "М2Р" }, { sig: "М3Р", end: "ЛДП" }] },
      "К5": { name: "Локомотив з РПЧ-1 (1к) в екіпірувальний парк і назад", start: "1кП", plan: [{ sig: "М116", end: "М2Р" }, { sig: "М3Р", end: "5епП" }, { wait: 600 }, { sig: "М4Р", end: "М3Р" }, { sig: "@R", end: "1кП" }] },
    }
  };

  // ------------------------------------------------------------ timetable (model): a busy junction
  const LINE = { K: { entry: "ЧК", exit: "2КД", name: "Кайдацька" }, G: { entry: "ЧГ1", exit: "2НГ", name: "Горяїнове" }, S: { entry: "ЧГ", exit: "2СХ", name: "Сухачівка" }, A: { entry: "Н", exit: "2ЧА", name: "Пост Амур" } };
  const PLACE = { K: ["Кайдацька", "Новомосковськ", "Павлоград"], G: ["Горяїнове", "П'ятихатки", "Кривий Ріг", "Київ", "Львів", "Одеса"], S: ["Сухачівка", "Верхньодніпровськ", "Кам'янське"],
    A: ["Нижньодніпровськ", "Синельникове", "Запоріжжя-1", "Харків", "Мелітополь"] };
  const parityTo = (tl) => (tl === "A" ? "even" : "odd");
  const single = (ln) => ln === "K" || ln === "S";
  // which tracks each line reaches (Кайдацька — the upper group, Сухачівка — the lower group)
  const ALLT = PARK.map((p) => p[0]);
  const REACH = { K: UPPER.concat(["XVIIIП", "11П"]), S: LOWER.concat(["IVП"]), G: ALLT, A: ALLT };
  function generate(seed, intensity, day) {
    const G = K.toolkit("DNH|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    const sk = (ln, inbound) => (single(ln) ? ln : ln + (inbound ? ">" : "<"));
    const gap = (ln) => (single(ln) ? 14 : 5);
    const busy = {};
    const freeTrk = (t, a, b) => (busy[t] || []).every(([x, y]) => b <= x || a >= y);
    const hold = (t, a, b) => (busy[t] = busy[t] || []).push([a, b]);
    let mn = 0;
    const shunt = (t, job, extra) => ev.push(Object.assign({ time: K.hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" }, extra || {}));
    const num = (type, par) => G.num(type === "passenger" ? 1 : type === "electric" ? 6001 : type === "reserve" ? 4801 : 2001, type === "freight" ? 898 : type === "passenger" ? 180 : 598, par === "odd");
    function through(type, fl, tl, t, stop) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stop + 3, gap(tl)); if (td == null) { G.unslot(sk(fl, true), ta); return false; }
      const par = parityTo(tl), n = num(type, par);
      ev.push({ time: K.hm(ta), train: String(n), type, direction: par, action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        from: G.pick(PLACE[fl]), to: G.pick(PLACE[tl]), timeStatus: "generated", note: (stop ? "стоянка " + stop + " хв" : "без зупинки") + " · " + LINE[fl].name + " → " + LINE[tl].name });
      return true;
    }
    // a pair at this station: arrival (the consist stays), later the departure of the same consist
    function pairAt(type, fl, tl, t, stand, ready, tracks, jobs) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stand, gap(tl)); if (td == null || td > 1425) { G.unslot(sk(fl, true), ta); if (td != null) G.unslot(sk(tl, false), td); return false; }
      const fr = tracks.filter((x) => freeTrk(x, ta - 6, td + 4));
      if (!fr.length) { G.unslot(sk(fl, true), ta); G.unslot(sk(tl, false), td); return false; }
      const trk = G.pick(fr.slice(0, 4));
      hold(trk, ta - 6, td + 4);
      const pin = fl === "A" ? "odd" : "even", pout = parityTo(tl);
      const n = num(type, pin), c = String(n), back = jobs === "loco" ? c : String(num(type, pout));
      ev.push({ time: K.hm(ta), train: c, type, direction: pin, action: "arrive", consist: c, ready, entry: LINE[fl].entry, recTrack: trk, onlyTracks: ready ? undefined : LOWER, from: G.pick(PLACE[fl]), to: jobs === "loco" ? G.pick(PLACE[tl]) : "Дніпро-Головний", timeStatus: "generated",
        note: jobs === "loco" ? "стоянка зі зміною локомотива, відправлення о " + K.hm(td) : ready ? "кінцева: зворотний рейс № " + back + " о " + K.hm(td) : "кінцева" });
      ev.push({ time: K.hm(td), train: back, type, direction: pout, action: "depart", consist: c, exitTo: LINE[tl].exit, from: jobs === "loco" ? G.pick(PLACE[fl]) : "Дніпро-Головний", to: G.pick(PLACE[tl]), timeStatus: "generated",
        note: jobs === "loco" ? "після зміни локомотива" : "відправлення состава поїзда № " + c });
      if (jobs === "loco") { shunt(ta + 3, "LOCO_OUT", { consist: c, note: "відчеплення локомотива поїзда № " + c }); shunt(ta + 9, "LOCO_IN", { consist: c, note: "локомотив під поїзд № " + c }); }
      return true;
    }
    // a long-distance train that ends here: consist to the servicing park, later a new train from it
    function terminus(fl, tl, t) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const out = ta + G.ri(20, 30), back = out + G.ri(150, 260), td = G.slot(sk(tl, false), back + G.ri(35, 50), gap(tl));
      const trk = LOWER.find((x) => freeTrk(x, ta - 6, out + 20));
      if (td == null || td > 1425 || !trk || !freeTrk("EKIP", out, back + 30)) { G.unslot(sk(fl, true), ta); if (td != null) G.unslot(sk(tl, false), td); return false; }
      hold(trk, ta - 6, out + 20); hold("EKIP", out, back + 30);
      const pin = fl === "A" ? "odd" : "even", pout = parityTo(tl);
      const c = String(num("passenger", pin)), o = String(num("passenger", pout));
      ev.push({ time: K.hm(ta), train: c, type: "passenger", direction: pin, action: "arrive", consist: c, ready: false, entry: LINE[fl].entry, recTrack: trk, onlyTracks: LOWER, from: G.pick(PLACE[fl]), to: "Дніпро-Головний", timeStatus: "generated",
        note: "кінцева: состав — в екіпірувальний парк" });
      shunt(out, "EKIP", { consist: c, note: "состав поїзда № " + c + " в екіпірувальний парк" });
      shunt(back, "EKIPBACK", { consist: c, out: "Ф-" + o, note: "состав з екіпірувального парку → поїзд № " + o });
      ev.push({ time: K.hm(td), train: o, type: "passenger", direction: pout, action: "depart", consist: "Ф-" + o, exitTo: LINE[tl].exit, from: "Дніпро-Головний", to: G.pick(PLACE[tl]), timeStatus: "generated",
        note: "формується з екіпірувального парку" });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 8 && !f(i, n); a++); };
    const pair = () => (G.r() < 0.5 ? ["A", "G"] : ["G", "A"]);
    // long-distance passenger trains: through with a stand; trains from Пост Амур to Горяїнове change the locomotive
    tryN(Math.round(8 * k), () => { const [f, t] = pair(); return through("passenger", f, t, G.ri(0, 1400), G.ri(8, 18)); });
    tryN(Math.max(2, Math.round(4 * k)), () => pairAt("passenger", "A", G.r() < 0.8 ? "G" : "S", G.ri(200, 1300), G.ri(25, 35), false, ["9П", "8П", "7П", "6П", "5П"], "loco"));
    tryN(Math.max(1, Math.round(1.5 * k)), () => { const [f, t] = G.r() < 0.5 ? ["A", "K"] : ["K", "A"]; return through("passenger", f, t, G.ri(300, 1300), G.ri(8, 15)); });
    // trains that start and end here (the servicing park)
    tryN(Math.max(2, Math.round(4 * k)), () => { const [f, t] = pair(); return terminus(f, G.r() < 0.6 ? f : t, G.ri(240, 900)); });
    // suburban electric trains: a great many end here from all four lines and go back
    tryN(Math.max(10, Math.round(22 * k)), (i, n) => { const f = G.pick(["A", "A", "A", "G", "G", "G", "K", "S", "S"]); const t = G.r() < 0.75 ? f : G.pick(["A", "G"]);
      return pairAt("electric", f, t, 260 + (i + 0.5) * (1130 / n) + G.ri(-10, 10), G.ri(18, 50), true, ["3П", "2П", "1П", "5П", "6П", "7П", "20П", "19П", "14П", "12П", "15П", "16П"].filter((x) => REACH[f].includes(x) && REACH[t].includes(x)), null); });
    tryN(Math.max(4, Math.round(8 * k)), () => { const [f, t] = pair(); return through("electric", f, t, G.ri(280, 1380), G.ri(2, 4)); });
    // freight along the mains and to the branches
    tryN(Math.max(4, Math.round(9 * k)), () => { const [f, t] = pair(); return through("freight", f, t, G.ri(0, 1420), G.r() < 0.25 ? G.ri(10, 30) : 0); });
    tryN(Math.max(1, Math.round(3 * k)), () => (G.r() < 0.5 ? through("freight", "K", "A", G.ri(0, 1400), 0) : through("freight", "A", "K", G.ri(0, 1400), 0)));
    tryN(Math.max(1, Math.round(2 * k)), () => (G.r() < 0.5 ? through("freight", "S", "A", G.ri(0, 1400), 0) : through("freight", "A", "S", G.ri(0, 1400), 0)));
    tryN(Math.max(1, Math.round(3 * k)), () => { const [f, t] = pair(); return through("reserve", f, t, G.ri(0, 1420), 0); });
    // local shunting: deliveries and later pickups, depot moves
    const JOBS = [["ПК2", "ПК2П", "40П"], ["Т8", "Т8П", "40П"], ["Т7", "Т7П", "40П"], ["Т6", "Т6П", "40П"], ["Т44", "Т44П", "40П"], ["Т37", "Т37П", "36П"], ["Т34", "Т34П", "36П"],
      ["Т30", "Т30П", "29П"], ["ВД", "ВДП", "ПЧП"], ["ЛД4", null, "ЛДП"], ["К5", null, "1кП"]];
    const nJ = Math.max(5, Math.round(10 * k)), used = {};
    for (let i = 0; i < nJ; i++) {
      const t = 300 + (i + 0.5) * (1050 / nJ) + G.ri(-20, 20);
      const ok = JOBS.filter(([a, , base]) => !used[a] && freeTrk("J" + base, t - 5, t + 40));
      if (!ok.length) continue;
      const [a, b, base] = G.pick(ok); used[a] = true;
      hold("J" + base, t - 5, t + 40); shunt(t, a);
      if (b) { const tp = t + G.ri(120, 240); if (tp < 1390 && freeTrk("J" + base, tp - 5, tp + 40)) { hold("J" + base, tp - 5, tp + 40); shunt(tp, b); } }
    }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "dnipro_" + seed + "_" + intensity + "_d" + day, station: "Дніпро-Головний", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.dnipro = { id: "dnipro", name: "Дніпро-Головний", note: "на плані 2016 р. — Дніпропетровськ; велика вузлова: 4 лінії, депо, екіпірувальний парк", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

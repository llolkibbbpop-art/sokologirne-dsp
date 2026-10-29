/*
 * Станція Дніпропетровськ (пасажирська), after the station plan «Дата кор. 22.01.2016» (with Пост Амур).
 * The plan is very large (passenger park of 18 tracks, the locomotive and carriage depots,
 * the servicing park, goods tracks). The model keeps the passenger park and both throats in a
 * simplified square schematic: on the left the double-track line to Горяїнове / Сухачівка and the
 * single-track line to Кайдацька, on the right the double-track line to Пост Амур (Нижньодніпровськ).
 * Even trains run to the right, odd to the left (as on the plan: «Непарний» towards Горяїнове).
 * Track numbers and lengths are from the plan; the throats are reduced to ladders (model choice).
 */
(function () {
  "use strict";
  const K = window.StationKit;
  // tracks of the passenger park, top to bottom: [id, name, y, length]
  const PARK = [["20П", "20", 100, 335], ["19П", "19", 135, 337], ["XVIIIП", "XVIII", 170, 748], ["17П", "17", 205, 747], ["16П", "16", 240, 839], ["15П", "15", 275, 844],
    ["14П", "14", 310, 595], ["12П", "12", 345, 600], ["11П", "11", 380, 560], ["9П", "9", 415, 574], ["8П", "8", 450, 736], ["7П", "7", 485, 567], ["6П", "6", 520, 588],
    ["5П", "5", 555, 585], ["IVП", "IV", 590, 788], ["3П", "3", 625, 488], ["2П", "2", 660, 423], ["1П", "1", 695, 575]];
  const XL = 800, XR = 2000, M = (x) => 2800 - x;
  const nodes = {
    // left: lines
    A0k: [-150, 170], APk: [-55, 170], EK: [40, 170],
    A0gu: [-150, 380], APgu: [-55, 380], EGU: [40, 380], A0gl: [-150, 415], APgl: [-55, 415], EGL: [40, 415],
    // left throat
    L1s: [120, 415], U1: [155, 380], U2: [200, 380], K2: [410, 170], U3: [300, 380], L3: [335, 415],
    K4: [480, 170], KU: [515, 135], X20: [550, 100], K6: [560, 170], D1: [595, 205], D2: [630, 240], D3: [665, 275], D4: [700, 310], X12: [735, 345],
    G5: [480, 415], E1: [515, 450], E2: [550, 485], E3: [585, 520], E4: [620, 555], E5: [655, 590], E6: [690, 625], E7: [725, 660], X1t: [760, 695],
    // right: lines
    EAU: [2760, 380], BAu: [2855, 380], AAu: [2950, 380], EAL: [2760, 415], BAl: [2855, 415], AAl: [2950, 415], B: [2390, 170]
  };
  // the right throat mirrors the left one
  ["L1s", "U1", "U2", "U3", "L3", "K4", "KU", "X20", "K6", "D1", "D2", "D3", "D4", "X12", "G5", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "X1t"].forEach((n) => (nodes[n + "r"] = [M(nodes[n][0]), nodes[n][1]]));
  PARK.forEach(([id, , y]) => { nodes["L" + id] = [XL, y]; nodes["R" + id] = [XR, y]; });
  const L = (t) => "L" + t + "П", R = (t) => "R" + t + "П";
  const sw = [
    // left
    ["1", "L1s", "EGL", "L3", "U1", 1], ["3", "U1", "U2", "EGU", "L1s", -1], ["5", "U2", "U1", "U3", "K2", 1], ["7", "K2", "K4", "EK", "U2", -1], ["9", "U3", "U2", L("11"), "L3", 1], ["11", "L3", "G5", "L1s", "U3", 1],
    ["13", "K4", "K2", "K6", "KU", -1], ["15", "KU", "K4", "X20", L("19"), -1], ["17", "K6", "K4", L("XVIII"), "D1", 1],
    ["19", "D1", "K6", "D2", L("17"), 1], ["21", "D2", "D1", "D3", L("16"), 1], ["23", "D3", "D2", "D4", L("15"), 1], ["25", "D4", "D3", "X12", L("14"), 1],
    ["27", "G5", "L3", L("9"), "E1", 1], ["29", "E1", "G5", "E2", L("8"), 1], ["31", "E2", "E1", "E3", L("7"), 1], ["33", "E3", "E2", "E4", L("6"), 1], ["35", "E4", "E3", "E5", L("5"), 1],
    ["37", "E5", "E4", "E6", L("IV"), 1], ["39", "E6", "E5", "E7", L("3"), 1], ["41", "E7", "E6", "X1t", L("2"), 1],
    // right
    ["2", "L1sr", "EAL", "L3r", "U1r", 1], ["4", "U1r", "U2r", "EAU", "L1sr", -1], ["6", "U2r", "U1r", "U3r", "B", 1], ["8", "U3r", "U2r", R("11"), "L3r", 1], ["10", "L3r", "G5r", "L1sr", "U3r", 1],
    ["12", "K4r", "B", "K6r", "KUr", -1], ["14", "KUr", "K4r", "X20r", R("19"), -1], ["16", "K6r", "K4r", R("XVIII"), "D1r", 1],
    ["18", "D1r", "K6r", "D2r", R("17"), 1], ["20", "D2r", "D1r", "D3r", R("16"), 1], ["22", "D3r", "D2r", "D4r", R("15"), 1], ["24", "D4r", "D3r", "X12r", R("14"), 1],
    ["26", "G5r", "L3r", R("9"), "E1r", 1], ["28", "E1r", "G5r", "E2r", R("8"), 1], ["30", "E2r", "E1r", "E3r", R("7"), 1], ["32", "E3r", "E2r", "E4r", R("6"), 1], ["34", "E4r", "E3r", "E5r", R("5"), 1],
    ["36", "E5r", "E4r", "E6r", R("IV"), 1], ["38", "E6r", "E5r", "E7r", R("3"), 1], ["40", "E7r", "E6r", "X1tr", R("2"), 1]
  ];
  const edges = [
    ["A0k", "APk", "2КД"], ["APk", "EK", "1КД"], ["EK", "K2"], ["A0gu", "APgu", "2НГ"], ["APgu", "EGU", "1НГ"], ["EGU", "U1"], ["A0gl", "APgl", "2ЧГ"], ["APgl", "EGL", "1ЧГ"], ["EGL", "L1s"]
  ];
  const side = (sfx, park) => {
    const e = (a, b) => edges.push([a + sfx, b + sfx]);
    const P = (t) => (sfx ? "R" : "L") + t + "П";
    e("L1s", "L3"); e("L1s", "U1"); e("U1", "U2"); e("U2", "U3"); e("U3", "L3"); e("L3", "G5");
    edges.push(["U3" + sfx, P("11")]);
    e("K4", "KU"); e("KU", "X20"); edges.push(["X20" + sfx, P("20")], ["KU" + sfx, P("19")]);
    e("K4", "K6"); edges.push(["K6" + sfx, P("XVIII")]);
    e("K6", "D1"); e("D1", "D2"); e("D2", "D3"); e("D3", "D4"); e("D4", "X12"); edges.push(["X12" + sfx, P("12")], ["D1" + sfx, P("17")], ["D2" + sfx, P("16")], ["D3" + sfx, P("15")], ["D4" + sfx, P("14")]);
    e("G5", "E1"); e("E1", "E2"); e("E2", "E3"); e("E3", "E4"); e("E4", "E5"); e("E5", "E6"); e("E6", "E7"); e("E7", "X1t");
    edges.push(["G5" + sfx, P("9")], ["E1" + sfx, P("8")], ["E2" + sfx, P("7")], ["E3" + sfx, P("6")], ["E4" + sfx, P("5")], ["E5" + sfx, P("IV")], ["E6" + sfx, P("3")], ["E7" + sfx, P("2")], ["X1t" + sfx, P("1")]);
  };
  side("", true);
  edges.push(["U2", "K2"], ["K2", "K4"]);
  side("r", false);
  edges.push(["U2r", "B"], ["B", "K4r"], ["U1r", "EAU"], ["L1sr", "EAL"], ["EAU", "BAu", "1НА"], ["BAu", "AAu", "2НА"], ["EAL", "BAl", "1ЧА"], ["BAl", "AAl", "2ЧА"]);
  const T = K.build({
    meta: { id: "dnipro", station: "Дніпропетровськ", planDate: "22.01.2016", shuntToTracks: true, rightParity: "even", lockFrame: true },
    nodes, switches: sw, edges,
    park: PARK.map(([id, name, , len]) => ({ id, L: "L" + id, R: "R" + id, len, sigL: "Н" + name, sigR: "Ч" + name, name, label: "Колія " + name + " (" + len + " м)" })),
    lines: [
      { key: "K", name: "Кайдацька", arrParity: "even", secs: [["2КД", 1300, "Перегін Кайдацька — Дніпропетровськ, 2-й блок (одноколійний)"], ["1КД", 900, "Перегін Кайдацька — Дніпропетровськ, 1-й блок (одноколійний)"]],
        entry: { id: "ЧК", node: "EK", dir: "R", note: "вхідний з Кайдацької" }, exit: { far: "A0k", sec: "2КД" },
        button: { id: "ВК", node: "EK", dx: -110, side: -1, label: "відпр. на КАЙДАЦЬКУ", note: "кінець маршруту відправлення на Кайдацьку" } },
      { key: "G", name: "Горяїнове (Сухачівка)", arrParity: "even", secs: [["2ЧГ", 1300, "Перегін з Горяїнового, 2-й блок"], ["1ЧГ", 900, "Перегін з Горяїнового, 1-й блок"]],
        entry: { id: "ЧГ", node: "EGL", dir: "R", note: "вхідний з Горяїнового" },
        exit: { far: "A0gu", sec: "2НГ", secs: [["1НГ", 900, "Перегін на Горяїнове, 1-й блок"], ["2НГ", 1300, "Перегін на Горяїнове, 2-й блок"]] },
        button: { id: "ВГ", node: "EGU", dx: -110, side: -1, label: "відпр. на ГОРЯЇНОВЕ", note: "кінець маршруту відправлення на Горяїнове" } },
      { key: "A", name: "Пост Амур (Нижньодніпровськ)", arrParity: "odd", secs: [["2НА", 1300, "Перегін з Пост Амура, 2-й блок"], ["1НА", 900, "Перегін з Пост Амура, 1-й блок"]],
        entry: { id: "Н", node: "EAU", dir: "L", note: "вхідний з Пост Амура" },
        exit: { far: "AAl", sec: "2ЧА", secs: [["1ЧА", 900, "Перегін на Пост Амур, 1-й блок"], ["2ЧА", 1300, "Перегін на Пост Амур, 2-й блок"]] },
        button: { id: "ВА", node: "EAL", dx: 110, side: 1, label: "відпр. на ПОСТ АМУР", note: "кінець маршруту відправлення на Пост Амур (Нижньодніпровськ)" } }
    ],
    view: {
      box: [-165, 50, 3130, 690],
      platforms: [[1100, 323, 600, 8], [1100, 393, 600, 8], [1100, 533, 600, 8], [1100, 638, 600, 8], [1100, 708, 600, 8]],
      notes: [[-150, 128, "← КАЙДАЦЬКА (одноколійна)"], [-150, 338, "← ГОРЯЇНОВЕ · СУХАЧІВКА"], [2700, 338, "ПОСТ АМУР · НИЖНЬОДНІПРОВСЬК →"], [1300, 735, "Пасажирський парк (спрощено: депо, екіпірувальний і вантажний парки не показано)"]],
      borders: [],
      blockLabels: [["2КД", -110, 170, -13], ["1КД", -15, 170, -13], ["2НГ", -110, 380, -13], ["1НГ", -15, 380, -13], ["2ЧГ", -110, 415, 20], ["1ЧГ", -15, 415, 20],
        ["1НА", 2800, 380, -13], ["2НА", 2900, 380, -13], ["1ЧА", 2800, 415, 20], ["2ЧА", 2900, 415, 20]],
      graph: ["Горяїнове", "Дніпропетровськ", "Пост Амур"]
    },
    radio: { sides: { K: { name: "Кайдацька", from: "Кайдацької", dsp: "Бондар", inc: 15 }, G: { name: "Горяїнове", from: "Горяїнового", dsp: "Мельник", inc: 30 }, A: { name: "Пост Амур", from: "Пост Амура", dsp: "Савченко", inc: 45 } },
      bySignal: { "ЧК": "K", "ЧГ": "G", "Н": "A" }, byLine: { "2КД": "K", "2НГ": "G", "2ЧА": "A" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "ЧГ" }
  });
  const ALL = PARK.map((p) => p[0]);
  const PLAT = ALL.filter((t) => t !== "XVIIIП" && t !== "IVП");
  const P = {
    directionParity: { even: "even", odd: "odd", arr: "odd", dep: "even" }, directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["11П", "9П", "8П", "12П", "XVIIIП", "IVП"], even: ["9П", "8П", "11П", "12П", "XVIIIП", "IVП"] },
    typeTracks: { passenger: ["12П", "11П", "9П", "8П", "14П", "15П", "16П", "17П", "7П", "6П", "5П", "3П"], electric: ["3П", "2П", "1П", "5П", "6П", "7П", "20П", "19П", "14П", "12П"],
      freight: ["XVIIIП", "IVП", "17П", "16П", "8П"], household: ["IVП", "XVIIIП"], reserve: ["XVIIIП", "IVП", "15П"], test: ["XVIIIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 5, electric: 5, freight: 7, household: 7, reserve: 5, shunting: 1, test: 5 }, departLeadMin: 6, terminateSec: 90,
    speedKmh: { passenger: 50, electric: 50, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: PLAT, mainTracks: ["XVIIIП", "IVП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 40,
    shuntingJobs: {}
  };
  const LINE = { K: { entry: "ЧК", exit: "2КД", name: "Кайдацька" }, G: { entry: "ЧГ", exit: "2НГ", name: "Горяїнове" }, A: { entry: "Н", exit: "2ЧА", name: "Пост Амур" } };
  const PLACE = { K: ["Кайдацька", "Новомосковськ"], G: ["Горяїнове", "Сухачівка", "П'ятихатки", "Кривий Ріг", "Київ", "Львів"], A: ["Нижньодніпровськ", "Синельникове", "Запоріжжя-1", "Харків", "Москва"] };
  // a train leaving to the right (Пост Амур) is even, to the left odd
  const parityTo = (tl) => (tl === "A" ? "even" : "odd");
  function generate(seed, intensity, day) {
    const G = K.toolkit("DNP|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    const sk = (ln, inbound) => (ln === "K" ? "K" : ln + (inbound ? ">" : "<"));
    const gap = (ln) => (ln === "K" ? 14 : 6);
    const busy = {};
    const freeTrk = (t, a, b) => (busy[t] || []).every(([x, y]) => b <= x || a >= y);
    function through(type, fl, tl, t, stop) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stop + 3, gap(tl)); if (td == null) { G.unslot(sk(fl, true), ta); return false; }
      const par = parityTo(tl), n = G.num(type === "passenger" ? 1 : type === "electric" ? 6001 : type === "reserve" ? 4801 : 2001, type === "freight" ? 898 : type === "passenger" ? 180 : 398, par === "odd");
      ev.push({ time: K.hm(ta), train: String(n), type, direction: par, action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        from: G.pick(PLACE[fl]), to: G.pick(PLACE[tl]), timeStatus: "generated", note: (stop ? "стоянка " + stop + " хв" : "без зупинки") + " · " + LINE[fl].name + " → " + LINE[tl].name });
      return true;
    }
    // a suburban electric that ends here and later goes back (cabs at both ends)
    function turn(fl, tl, t, stand) {
      const ta = G.slot(sk(fl, true), t, gap(fl)); if (ta == null) return false;
      const td = G.slot(sk(tl, false), ta + stand, gap(tl)); if (td == null || td > 1420) { G.unslot(sk(fl, true), ta); if (td != null) G.unslot(sk(tl, false), td); return false; }
      const trk = ["3П", "2П", "1П", "5П", "6П", "7П", "20П", "19П"].find((x) => freeTrk(x, ta - 6, td + 4));
      if (!trk) { G.unslot(sk(fl, true), ta); G.unslot(sk(tl, false), td); return false; }
      (busy[trk] = busy[trk] || []).push([ta - 6, td + 4]);
      const pin = fl === "A" ? "odd" : "even", pout = parityTo(tl);
      const n = G.num(6001, 398, pin === "odd"), c = String(n), back = String(G.num(6001, 398, pout === "odd"));
      ev.push({ time: K.hm(ta), train: c, type: "electric", direction: pin, action: "arrive", consist: c, ready: true, entry: LINE[fl].entry, recTrack: trk, from: G.pick(PLACE[fl]), to: "Дніпропетровськ", timeStatus: "generated",
        note: "кінцева: зворотний рейс № " + back + " о " + K.hm(td) });
      ev.push({ time: K.hm(td), train: back, type: "electric", direction: pout, action: "depart", consist: c, exitTo: LINE[tl].exit, from: "Дніпропетровськ", to: G.pick(PLACE[tl]), timeStatus: "generated", note: "відправлення состава поїзда № " + c });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 8 && !f(i, n); a++); };
    const pair = () => (G.r() < 0.5 ? ["A", "G"] : ["G", "A"]);
    // long-distance passenger trains with a stand at the platforms
    tryN(Math.max(4, Math.round(9 * k)), () => { const [f, t] = pair(); return through("passenger", f, t, G.ri(0, 1400), G.ri(8, 20)); });
    // suburban electric trains: many end here (from all three lines)
    tryN(Math.max(6, Math.round(12 * k)), (i, n) => { const f = G.pick(["A", "A", "G", "G", "K"]); const t = G.r() < 0.7 ? f : G.pick(["A", "G"]); return turn(f, t, 270 + (i + 0.5) * (1100 / n) + G.ri(-15, 15), G.ri(20, 55)); });
    tryN(Math.max(3, Math.round(6 * k)), () => { const [f, t] = pair(); return through("electric", f, t, G.ri(280, 1380), G.ri(2, 4)); });
    // freight trains along the mains, a few to / from Кайдацька
    tryN(Math.max(3, Math.round(7 * k)), () => { const [f, t] = pair(); return through("freight", f, t, G.ri(0, 1400), G.r() < 0.2 ? G.ri(10, 30) : 0); });
    tryN(Math.max(1, Math.round(2 * k)), () => (G.r() < 0.5 ? through("freight", "K", "A", G.ri(0, 1400), 0) : through("freight", "A", "K", G.ri(0, 1400), 0)));
    tryN(Math.max(1, Math.round(2 * k)), () => { const [f, t] = pair(); return through("reserve", f, t, G.ri(0, 1400), 0); });
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "dnipro_" + seed + "_" + intensity + "_d" + day, station: "Дніпропетровськ", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.dnipro = { id: "dnipro", name: "Дніпропетровськ", note: "пасажирська, 18 колій (спрощено): Горяїнове, Кайдацька — Пост Амур", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

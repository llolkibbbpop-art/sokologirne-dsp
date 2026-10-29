/*
 * Станція Сиваш, after the station plan «Дата кор. 11.02.2015».
 * Double-track line: on the left Солоне Озеро (Джанкой), on the right Салькове (Мелітополь).
 * Odd trains run to the left on track I (entry Н on the right), even trains to the right on
 * track II (entry Ч on the left). Side tracks 3 and 4 have platforms.
 * Square schematic drawn after the plan; block lengths on the lines are a model choice.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "sivash", station: "Сиваш", planDate: "11.02.2015", shuntToTracks: true, rightParity: "even", lockFrame: false },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 335], APl: [-55, 335], CH: [40, 335],
      S2: [200, 335], S4: [235, 300], S6: [330, 300], S8: [365, 335], S10: [480, 300], X10: [515, 265], S12: [560, 335], X12: [595, 370],
      L3: [620, 265], L1: [620, 300], L2: [620, 335], L4: [660, 370],
      R3: [1540, 265], R1: [1560, 300], R2: [1530, 335], R4: [1520, 370],
      X11: [1605, 265], S11: [1640, 300], X9: [1565, 370], S9: [1600, 335], S7: [1700, 300], S5: [1735, 335], S3: [1830, 335], S1: [1865, 300],
      NN: [2000, 300], BRu: [2140, 300], A1u: [2280, 300], EX: [2000, 335], BRl: [2140, 335], A1l: [2280, 335]
    },
    switches: [
      ["2", "S2", "CH", "S8", "S4", 1], ["4", "S4", "S6", "EU", "S2", -1], ["6", "S6", "S4", "S10", "S8", -1], ["8", "S8", "S12", "S2", "S6", 1],
      ["10", "S10", "S6", "L1", "X10", -1], ["12", "S12", "S8", "L2", "X12", 1],
      ["11", "S11", "S7", "R1", "X11", -1], ["9", "S9", "S5", "R2", "X9", 1], ["7", "S7", "S11", "S1", "S5", -1], ["5", "S5", "S3", "S9", "S7", 1],
      ["3", "S3", "S5", "EX", "S1", 1], ["1", "S1", "NN", "S7", "S3", -1]
    ],
    edges: [
      ["A0u", "APu", "2НД"], ["APu", "EU", "1НД"], ["EU", "S4"], ["A0l", "APl", "2ЧД"], ["APl", "CH", "1ЧД"], ["CH", "S2"],
      ["S2", "S4"], ["S4", "S6"], ["S2", "S8"], ["S6", "S8"], ["S6", "S10"], ["S8", "S12"], ["S10", "L1"], ["S10", "X10"], ["X10", "L3"], ["S12", "L2"], ["S12", "X12"], ["X12", "L4"],
      ["R3", "X11"], ["X11", "S11"], ["R1", "S11"], ["R4", "X9"], ["X9", "S9"], ["R2", "S9"], ["S11", "S7"], ["S9", "S5"], ["S7", "S5"], ["S7", "S1"], ["S5", "S3"], ["S3", "S1"],
      ["S1", "NN"], ["NN", "BRu", "1НС"], ["BRu", "A1u", "2НС"], ["S3", "EX"], ["EX", "BRl", "1ЧС"], ["BRl", "A1l", "2ЧС"]
    ],
    park: [
      { id: "3П", L: "L3", R: "R3", len: 860, sigL: "Н3", sigR: "Ч3", label: "Колія 3 (860 м, біля платформи)" },
      { id: "IП", L: "L1", R: "R1", len: 916, sigL: "Н1", name: "I", label: "Колія I (916 м, головна)" },
      { id: "IIП", L: "L2", R: "R2", len: 843, sigR: "Ч2", name: "II", label: "Колія II (843 м, головна)" },
      { id: "4П", L: "L4", R: "R4", len: 842, sigL: "Н4", sigR: "Ч4", label: "Колія 4 (842 м, біля платформи)" }
    ],
    lines: [
      { key: "D", name: "Солоне Озеро (Джанкой)", arrParity: "even", secs: [["2ЧД", 1300, "Перегін з Солоного Озера, 2-й блок"], ["1ЧД", 900, "Перегін з Солоного Озера, 1-й блок"]],
        entry: { id: "Ч", node: "CH", dir: "R", note: "вхідний з Солоного Озера (Джанкой)" },
        exit: { far: "A0u", sec: "2НД", secs: [["1НД", 900, "Перегін на Солоне Озеро, 1-й блок"], ["2НД", 1300, "Перегін на Солоне Озеро, 2-й блок"]] },
        button: { id: "ВД", node: "EU", dx: -110, side: -1, label: "відпр. на СОЛОНЕ ОЗЕРО", note: "кінець маршруту відправлення на Солоне Озеро (Джанкой)" } },
      { key: "S", name: "Салькове (Мелітополь)", arrParity: "odd", secs: [["2НС", 1300, "Перегін з Салькового, 2-й блок"], ["1НС", 900, "Перегін з Салькового, 1-й блок"]],
        entry: { id: "Н", node: "NN", dir: "L", note: "вхідний з Салькового" },
        exit: { far: "A1l", sec: "2ЧС", secs: [["1ЧС", 900, "Перегін на Салькове, 1-й блок"], ["2ЧС", 1300, "Перегін на Салькове, 2-й блок"]] },
        button: { id: "ВС", node: "EX", dx: 110, side: 1, label: "відпр. на САЛЬКОВЕ", note: "кінець маршруту відправлення на Салькове (Мелітополь)" } }
    ],
    labels: [],
    view: {
      box: [-165, 150, 2460, 300],
      platforms: [[820, 245, 560, 9], [840, 381, 560, 9]],
      notes: [[-150, 255, "← СОЛОНЕ ОЗЕРО · Джанкой"], [2040, 255, "САЛЬКОВЕ · Мелітополь →"], [1040, 420, "ПБ · ЕЦ · км 1342+42,40"], [-150, 380, "переїзд ПК5+76,95"]],
      borders: [[150, 285, 150, 350], [160, 285, 160, 350]],
      blockLabels: [["2НД", -110, 300, -13], ["1НД", -15, 300, -13], ["2ЧД", -110, 335, 20], ["1ЧД", -15, 335, 20], ["1НС", 2060, 300, -13], ["2НС", 2200, 300, -13], ["1ЧС", 2060, 335, 20], ["2ЧС", 2200, 335, 20]],
      graph: ["Салькове", "Сиваш", "Солоне Озеро"]
    },
    radio: { sides: { D: { name: "Солоне Озеро", from: "Солоного Озера", dsp: "Гончаренко", inc: 20 }, S: { name: "Салькове", from: "Салькового", dsp: "Литвиненко", inc: 40 } },
      bySignal: { "Ч": "D", "Н": "S" }, byLine: { "2НД": "D", "2ЧС": "S" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["IП", "3П"], even: ["IIП", "4П"] },
    typeTracks: { passenger: ["IП", "IIП", "3П", "4П"], electric: ["3П", "4П"], freight: ["IП", "IIП", "3П", "4П"], reserve: ["IП", "IIП"], household: ["3П", "4П"], test: ["IП", "IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 70, electric: 60, freight: 45, household: 35, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["3П", "4П"], mainTracks: ["IП", "IIП", "3П", "4П"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {}
  };
  // ------------------------------------------------------------ timetable (model): through trains only
  const LINE = { D: { entry: "Ч", exit: "2НД", name: "Солоне Озеро" }, S: { entry: "Н", exit: "2ЧС", name: "Салькове" } };
  function generate(seed, intensity, day) {
    const G = K.toolkit("SIV|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    function through(type, odd, t, stop, from, to) {
      const fl = odd ? "S" : "D", tl = odd ? "D" : "S";
      const ta = G.slot(fl, t); if (ta == null) return false;
      const td = G.slot(tl, ta + stop + 2); if (td == null) { G.unslot(fl, ta); return false; }
      const n = G.num(type === "passenger" ? 1 : type === "electric" ? 6501 : type === "reserve" ? 4901 : 2001, type === "freight" ? 898 : type === "passenger" ? 140 : 98, odd);
      const plat = stop && (type === "passenger" || type === "electric");
      ev.push({ time: K.hm(ta), train: String(n), type, direction: odd ? "odd" : "even", action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        recTrack: plat ? (odd ? "3П" : "4П") : (odd ? "IП" : "IIП"), from, to, timeStatus: "generated", note: (stop ? "зупинка " + stop + " хв" : "без зупинки") });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(); a++); };
    tryN(Math.max(2, Math.round(4 * k)), () => { const o = G.r() < 0.5; return through("passenger", o, G.ri(0, 1400), G.r() < 0.4 ? 2 : 0, o ? G.pick(["Київ", "Харків", "Запоріжжя-1"]) : G.pick(["Сімферополь", "Севастополь", "Феодосія"]), o ? G.pick(["Сімферополь", "Севастополь", "Євпаторія"]) : G.pick(["Київ", "Москва-Курська", "Дніпропетровськ"])); });
    tryN(Math.max(4, Math.round(8 * k)), () => { const o = G.r() < 0.5; return through("electric", o, G.ri(270, 1380), 1, o ? G.pick(["Мелітополь", "Новоолексіївка"]) : "Джанкой", o ? "Джанкой" : G.pick(["Мелітополь", "Новоолексіївка"])); });
    tryN(Math.max(3, Math.round(8 * k)), () => { const o = G.r() < 0.5; return through("freight", o, G.ri(0, 1400), G.r() < 0.2 ? G.ri(15, 40) : 0, o ? "Мелітополь" : "Джанкой", o ? "Джанкой" : "Мелітополь"); });
    tryN(Math.max(1, Math.round(2 * k)), () => { const o = G.r() < 0.5; return through("reserve", o, G.ri(0, 1400), 0, o ? "Мелітополь" : "Джанкой", o ? "Джанкой" : "Мелітополь"); });
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "sivash_" + seed + "_" + intensity + "_d" + day, station: "Сиваш", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.sivash = { id: "sivash", name: "Сиваш", note: "проміжна, двоколійна: Солоне Озеро (Джанкой) — Салькове", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

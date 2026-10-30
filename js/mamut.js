/*
 * Станція Мамут, after the station plan «Дата кор. 27.12.2012».
 * Double-track line: on the left Солоне Озеро (Мелітополь), on the right Джанкой.
 * Odd trains run to the right on the lower main I (entry Н on the left), even trains to the left on
 * the upper main II (entry Ч on the right). Side track 3 (platform), dead end 4 and П/К (не діє).
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "mamut", station: "Мамут", planDate: "27.12.2012", shuntToTracks: true, rightParity: "odd" },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 335], APl: [-55, 335], EL: [40, 335],
      S1: [220, 300], S3: [255, 335], S5: [420, 335], X5: [455, 370], S7: [560, 335], S9: [595, 300],
      L2: [700, 300], L1: [700, 335], L3: [720, 370],
      R2: [1400, 300], R1: [1420, 335], R3: [1380, 370],
      S10: [1450, 300], S8: [1485, 335], S14: [1420, 370], S12: [1455, 405], H4: [1300, 405], HPK: [1700, 405], M2n: [1520, 405],
      X6: [1580, 370], S6: [1615, 335], S4: [1745, 335], S2: [1780, 300],
      CN: [2000, 300], BRu: [2140, 300], A1u: [2280, 300], EX: [2000, 335], BRl: [2140, 335], A1l: [2280, 335]
    },
    switches: [
      ["1", "S1", "EU", "S9", "S3", 1], ["3", "S3", "S5", "EL", "S1", -1], ["5", "S5", "S3", "S7", "X5", 1], ["7", "S7", "S5", "L1", "S9", -1], ["9", "S9", "L2", "S1", "S7", 1],
      ["10", "S10", "R2", "S2", "S8", 1], ["8", "S8", "S6", "R1", "S10", -1], ["14", "S14", "R3", "X6", "S12", 1], ["12", "S12", "H4", "M2n", "S14", -1],
      ["6", "S6", "S4", "S8", "X6", 1], ["4", "S4", "S6", "EX", "S2", -1], ["2", "S2", "CN", "S10", "S4", 1]
    ],
    edges: [
      ["A0u", "APu", "2ЧС"], ["APu", "EU", "1ЧС"], ["EU", "S1"], ["A0l", "APl", "2НС"], ["APl", "EL", "1НС"], ["EL", "S3"],
      ["S1", "S3"], ["S1", "S9"], ["S3", "S5"], ["S5", "S7"], ["S5", "X5"], ["X5", "L3"], ["S7", "L1"], ["S7", "S9"], ["S9", "L2"],
      ["R2", "S10"], ["R1", "S8"], ["S10", "S8"], ["S10", "S2"], ["S8", "S6"], ["R3", "S14"], ["S14", "X6"], ["X6", "S6"], ["S14", "S12"], ["S12", "H4", "4П"], ["S12", "M2n"], ["M2n", "HPK", "ПКП"],
      ["S6", "S4"], ["S4", "S2"], ["S4", "EX"], ["S2", "CN"],
      ["CN", "BRu", "1ЧД"], ["BRu", "A1u", "2ЧД"], ["EX", "BRl", "1НД"], ["BRl", "A1l", "2НД"]
    ],
    info: { "4П": { kind: "track", len: 28, label: "Колія 4 (28 м, тупик)" }, "ПКП": { kind: "track", len: 150, label: "Під'їзна колія (П/К не діє)" } },
    signals: [{ id: "М2", node: "M2n", dir: "L", kind: "shunt", note: "виїзд з під'їзної колії" }],
    park: [
      { id: "IIП", L: "L2", R: "R2", len: 774, sigL: "ЧII", sigR: "НII", kindR: "shunt", name: "II", label: "Колія II (774 м, головна)" },
      { id: "IП", L: "L1", R: "R1", len: 833, sigL: "ЧI", sigR: "НI", name: "I", label: "Колія I (833 м, головна)" },
      { id: "3П", L: "L3", R: "R3", len: 831, sigL: "Ч3", sigR: "Н3", label: "Колія 3 (831 м, біля платформи)" }
    ],
    lines: [
      { key: "S", name: "Солоне Озеро (Мелітополь)", arrParity: "odd", secs: [["2НС", 1300, "Перегін з Солоного Озера, 2-й блок"], ["1НС", 900, "Перегін з Солоного Озера, 1-й блок"]],
        entry: { id: "Н", node: "EL", dir: "R", note: "вхідний з Солоного Озера" },
        exit: { far: "A0u", sec: "2ЧС", secs: [["1ЧС", 900, "Перегін на Солоне Озеро, 1-й блок"], ["2ЧС", 1300, "Перегін на Солоне Озеро, 2-й блок"]] },
        button: { id: "ВС", node: "EU", dx: -110, side: -1, label: "відпр. на СОЛОНЕ ОЗЕРО", note: "кінець маршруту відправлення на Солоне Озеро (Мелітополь)" } },
      { key: "D", name: "Джанкой", arrParity: "even", secs: [["2ЧД", 1300, "Перегін з Джанкоя, 2-й блок"], ["1ЧД", 900, "Перегін з Джанкоя, 1-й блок"]],
        entry: { id: "Ч", node: "CN", dir: "L", note: "вхідний з Джанкоя" },
        exit: { far: "A1l", sec: "2НД", secs: [["1НД", 900, "Перегін на Джанкой, 1-й блок"], ["2НД", 1300, "Перегін на Джанкой, 2-й блок"]] },
        button: { id: "ВД", node: "EX", dx: 110, side: 1, label: "відпр. на ДЖАНКОЙ", note: "кінець маршруту відправлення на Джанкой" } }
    ],
    view: {
      box: [-165, 200, 2460, 260],
      platforms: [[870, 284, 500, 8], [870, 351, 500, 8]],
      notes: [[-150, 255, "← СОЛОНЕ ОЗЕРО · Мелітополь"], [2040, 255, "ДЖАНКОЙ →"], [1560, 430, "П/К не діє"], [960, 230, "ЕЦ · ПБ"]],
      borders: [],
      blockLabels: [["2ЧС", -110, 300, -13], ["1ЧС", -15, 300, -13], ["2НС", -110, 335, 20], ["1НС", -15, 335, 20], ["1ЧД", 2060, 300, -13], ["2ЧД", 2200, 300, -13], ["1НД", 2060, 335, 20], ["2НД", 2200, 335, 20]],
      graph: ["Солоне Озеро", "Мамут", "Джанкой"]
    },
    radio: { sides: { S: { name: "Солоне Озеро", from: "Солоного Озера", dsp: "Литвин", inc: 25 }, D: { name: "Джанкой", from: "Джанкоя", dsp: "Захарченко", inc: 60 } },
      bySignal: { "Н": "S", "Ч": "D" }, byLine: { "2ЧС": "S", "2НД": "D" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  T.labels.push(["4 28", 1320, 400]);
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний (вліво)", odd: "непарний (вправо)", station: "по станції" },
    trackPreference: { odd: ["IП", "3П"], even: ["IIП", "3П"] },
    typeTracks: { passenger: ["IП", "IIП", "3П"], electric: ["3П", "IП", "IIП"], freight: ["IП", "IIП", "3П"], household: ["3П"], reserve: ["IП", "IIП"], test: ["IП", "IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 70, electric: 60, freight: 45, household: 35, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["IП", "IIП", "3П"], mainTracks: ["IП", "IIП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {}
  };
  const LINE = { S: { entry: "Н", exit: "2ЧС", name: "Солоне Озеро" }, D: { entry: "Ч", exit: "2НД", name: "Джанкой" } };
  function generate(seed, intensity, day) {
    const G = K.toolkit("MAM|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    function through(type, odd, t, stop) {
      const fl = odd ? "S" : "D", tl = odd ? "D" : "S";
      const ta = G.slot(fl, t); if (ta == null) return false;
      const n = G.num(type === "passenger" ? 1 : type === "electric" ? 6501 : type === "reserve" ? 4901 : 2001, type === "freight" ? 898 : type === "passenger" ? 140 : 98, odd);
      ev.push({ time: K.hm(ta), train: String(n), type, direction: odd ? "odd" : "even", action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        from: odd ? "Мелітополь" : "Джанкой", to: odd ? "Джанкой" : "Мелітополь", timeStatus: "generated", note: stop ? "зупинка " + stop + " хв" : "без зупинки" });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(); a++); };
    tryN(Math.max(4, Math.round(8 * k)), () => through("electric", G.r() < 0.5, G.ri(270, 1380), 1));
    tryN(Math.max(2, Math.round(4 * k)), () => through("passenger", G.r() < 0.5, G.ri(0, 1400), 0));
    tryN(Math.max(3, Math.round(8 * k)), () => through("freight", G.r() < 0.5, G.ri(0, 1400), G.r() < 0.2 ? G.ri(15, 40) : 0));
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "mamut_" + seed + "_" + intensity + "_d" + day, station: "Мамут", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.mamut = { id: "mamut", name: "Мамут", note: "проміжна, двоколійна: Солоне Озеро — Джанкой", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

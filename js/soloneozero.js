/*
 * Станція Солоне Озеро, after the station plan «Дата кор. 11.03.2014».
 * Double-track line: on the left Мамут (Джанкой), on the right Сиваш (Мелітополь).
 * Odd trains run to the left on the upper main I (entry Н on the right), even trains to the right
 * on the lower main II (entry Ч on the left). Side tracks 5, 3 (upper) and 4 (lower, platform),
 * dead end 3а (М12), the ЕЧК territory (tracks 9, 10) behind switches 7 and 13, П/К (не діє).
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "soloneozero", station: "Солоне Озеро", planDate: "11.03.2014", shuntToTracks: true, rightParity: "even" },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 335], APl: [-55, 335], EL: [40, 335],
      S4: [240, 335], X4: [205, 370], M2n: [150, 370], HPK: [20, 370],
      S6: [300, 335], S8: [335, 300], S10: [480, 300], S12: [515, 335],
      S14: [600, 300], S16: [635, 265], S18: [670, 230], M12n: [600, 230], H3a: [420, 230], S20: [700, 335], X20: [735, 370],
      L5: [760, 230], L3: [760, 265], L1: [760, 300], L2: [760, 335], L4: [780, 370],
      R5: [1450, 230], R3: [1420, 265], R1: [1500, 300], R2: [1500, 335], R4: [1480, 370],
      S11: [1485, 265], S7: [1565, 265], S5: [1600, 300], X9: [1515, 370], S9: [1550, 335],
      X7: [1600, 230], M5n: [1630, 200], S13: [1660, 170], X13: [1695, 135], H9: [1900, 135], H10: [1900, 170],
      S3: [1745, 335], S1: [1780, 300],
      EN: [2000, 300], BNu: [2140, 300], A1u: [2280, 300], EX: [2000, 335], BNl: [2140, 335], A1l: [2280, 335]
    },
    switches: [
      ["4", "S4", "S6", "EL", "X4", 1], ["6", "S6", "S4", "S12", "S8", 1], ["8", "S8", "S10", "EU", "S6", -1],
      ["10", "S10", "S8", "S14", "S12", -1], ["12", "S12", "S20", "S6", "S10", 1],
      ["14", "S14", "S10", "L1", "S16", -1], ["16", "S16", "S14", "S18", "L3", -1], ["18", "S18", "L5", "S16", "M12n", -1],
      ["20", "S20", "S12", "L2", "X20", 1],
      ["11", "S11", "S7", "R3", "R5", -1], ["7", "S7", "S11", "S5", "X7", -1], ["5", "S5", "S1", "R1", "S7", -1],
      ["9", "S9", "S3", "R2", "X9", 1], ["13", "S13", "M5n", "X13", "H10", -1],
      ["3", "S3", "S9", "EX", "S1", 1], ["1", "S1", "EN", "S5", "S3", -1]
    ],
    edges: [
      ["A0u", "APu", "2НМ"], ["APu", "EU", "1НМ"], ["EU", "S8"], ["A0l", "APl", "2ЧМ"], ["APl", "EL", "1ЧМ"], ["EL", "S4"],
      ["S4", "S6"], ["S4", "X4"], ["X4", "M2n"], ["M2n", "HPK", "ПКП"], ["S6", "S8"], ["S6", "S12"], ["S8", "S10"], ["S10", "S12"], ["S10", "S14"], ["S12", "S20"],
      ["S14", "L1"], ["S14", "S16"], ["S16", "L3"], ["S16", "S18"], ["S18", "L5"], ["S18", "M12n"], ["M12n", "H3a", "3аП"], ["S20", "L2"], ["S20", "X20"], ["X20", "L4"],
      ["R5", "S11"], ["R3", "S11"], ["S11", "S7"], ["S7", "S5"], ["S7", "X7"], ["X7", "M5n"], ["M5n", "S13"], ["S13", "X13"], ["X13", "H9", "9П"], ["S13", "H10", "10П"],
      ["R1", "S5"], ["S5", "S1"], ["R4", "X9"], ["X9", "S9"], ["R2", "S9"], ["S9", "S3"], ["S3", "S1"], ["S3", "EX"], ["S1", "EN"],
      ["EN", "BNu", "1НС"], ["BNu", "A1u", "2НС"], ["EX", "BNl", "1ЧС"], ["BNl", "A1l", "2ЧС"]
    ],
    info: {
      "3аП": { kind: "track", len: 118, label: "Колія 3а (118 м, тупик)" }, "ПКП": { kind: "track", len: 150, label: "Під'їзна колія (П/К не діє)" },
      "9П": { kind: "track", len: 180, label: "Колія 9 (територія ЕЧК, тупик)" }, "10П": { kind: "track", len: 180, label: "Колія 10 (територія ЕЧК)" }
    },
    signals: [
      { id: "М12", node: "M12n", dir: "R", kind: "shunt", note: "виїзд з колії 3а" }, { id: "М2", node: "M2n", dir: "R", kind: "shunt", note: "виїзд з під'їзної колії" },
      { id: "М5", node: "M5n", dir: "L", kind: "shunt", note: "виїзд з території ЕЧК" }
    ],
    park: [
      { id: "5П", L: "L5", R: "R5", len: 816, sigL: "Н5", sigR: "М11", kindR: "shunt", label: "Колія 5 (816 м)" },
      { id: "3П", L: "L3", R: "R3", len: 837, sigL: "Н3", sigR: "М9", kindR: "shunt", label: "Колія 3 (837 м)" },
      { id: "IП", L: "L1", R: "R1", len: 958, sigL: "НI", name: "I", label: "Колія I (958 м, головна)" },
      { id: "IIП", L: "L2", R: "R2", len: 842, sigR: "ЧII", name: "II", label: "Колія II (842 м, головна)" },
      { id: "4П", L: "L4", R: "R4", len: 848, sigL: "Н4", sigR: "Ч4", label: "Колія 4 (848 м, біля платформи)" }
    ],
    lines: [
      { key: "M", name: "Мамут (Джанкой)", arrParity: "even", secs: [["2ЧМ", 1300, "Перегін з Мамута, 2-й блок"], ["1ЧМ", 900, "Перегін з Мамута, 1-й блок"]],
        entry: { id: "Ч", node: "EL", dir: "R", note: "вхідний з Мамута" },
        exit: { far: "A0u", sec: "2НМ", secs: [["1НМ", 900, "Перегін на Мамут, 1-й блок"], ["2НМ", 1300, "Перегін на Мамут, 2-й блок"]] },
        button: { id: "ВМ", node: "EU", dx: -110, side: -1, label: "відпр. на МАМУТ", note: "кінець маршруту відправлення на Мамут (Джанкой)" } },
      { key: "V", name: "Сиваш (Мелітополь)", arrParity: "odd", secs: [["2НС", 1300, "Перегін з Сиваша, 2-й блок"], ["1НС", 900, "Перегін з Сиваша, 1-й блок"]],
        entry: { id: "Н", node: "EN", dir: "L", note: "вхідний з Сиваша" },
        exit: { far: "A1l", sec: "2ЧС", secs: [["1ЧС", 900, "Перегін на Сиваш, 1-й блок"], ["2ЧС", 1300, "Перегін на Сиваш, 2-й блок"]] },
        button: { id: "ВС", node: "EX", dx: 110, side: 1, label: "відпр. на СИВАШ", note: "кінець маршруту відправлення на Сиваш (Мелітополь)" } }
    ],
    view: {
      box: [-165, 100, 2460, 330],
      platforms: [[900, 246, 500, 8], [900, 386, 500, 8]],
      notes: [[-150, 255, "← МАМУТ · Джанкой"], [2040, 255, "СИВАШ · Мелітополь →"], [20, 395, "П/К не діє"], [1720, 110, "Територія ЕЧК"], [1100, 430, "ПБ"]],
      borders: [],
      blockLabels: [["2НМ", -110, 300, -13], ["1НМ", -15, 300, -13], ["2ЧМ", -110, 335, 20], ["1ЧМ", -15, 335, 20], ["1НС", 2060, 300, -13], ["2НС", 2200, 300, -13], ["1ЧС", 2060, 335, 20], ["2ЧС", 2200, 335, 20]],
      graph: ["Сиваш", "Солоне Озеро", "Мамут"]
    },
    radio: { sides: { M: { name: "Мамут", from: "Мамута", dsp: "Кузьменко", inc: 20 }, V: { name: "Сиваш", from: "Сиваша", dsp: "Гончаренко", inc: 35 } },
      bySignal: { "Ч": "M", "Н": "V" }, byLine: { "2НМ": "M", "2ЧС": "V" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  T.labels.push(["3а 118", 440, 225], ["9", 1820, 130], ["10", 1820, 165]);
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["IП", "3П", "5П"], even: ["IIП", "4П"] },
    typeTracks: { passenger: ["IП", "IIП", "4П"], electric: ["4П", "IП", "IIП"], freight: ["IП", "IIП", "3П", "5П", "4П"], household: ["3П", "5П"], reserve: ["IП", "IIП"], test: ["IП", "IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 70, electric: 60, freight: 45, household: 35, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["IП", "IIП", "4П"], mainTracks: ["IП", "IIП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {
      "ЕЧК": { name: "Подача вагонів на територію ЕЧК (колія 10) з колії 3а", start: "3аП", plan: [{ sig: "М12", end: "10П" }, { leave: true }, { wait: 60 }, { sig: "М5", end: "3аП" }] },
      "ЕЧКП": { name: "Прибирання вагонів з території ЕЧК (колія 10) на колію 3а", start: "3аП", plan: [{ sig: "М12", end: "10П" }, { couple: true }, { wait: 120 }, { sig: "М5", end: "3аП" }] }
    }
  };
  const LINE = { M: { entry: "Ч", exit: "2НМ", name: "Мамут" }, V: { entry: "Н", exit: "2ЧС", name: "Сиваш" } };
  function generate(seed, intensity, day) {
    const G = K.toolkit("SOZ|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    function through(type, odd, t, stop) {
      const fl = odd ? "V" : "M", tl = odd ? "M" : "V";
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
    if (G.r() < 0.8) { const t = G.ri(420, 800); ev.push({ time: K.hm(t), train: "МН-01", type: "shunting", direction: "station", action: "shunting_sequence", job: "ЕЧК", timeStatus: "generated" }, { time: K.hm(t + G.ri(150, 260)), train: "МН-02", type: "shunting", direction: "station", action: "shunting_sequence", job: "ЕЧКП", timeStatus: "generated" }); }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "soloneozero_" + seed + "_" + intensity + "_d" + day, station: "Солоне Озеро", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.soloneozero = { id: "soloneozero", name: "Солоне Озеро", note: "проміжна, двоколійна: Мамут — Сиваш", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

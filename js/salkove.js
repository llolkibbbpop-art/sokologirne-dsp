/*
 * Станція Салькове, after the station plan «Дата кор. 23.12.2014».
 * Double-track line: on the left Новоолексіївка (Мелітополь), on the right Сиваш (Джанкой).
 * Odd trains run to the right on track I (entry Н on the left), even trains to the left on
 * track II (entry Ч on the right). Side tracks 4 and 3 have platforms; dead end 5 (ЕЧ-4).
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "salkove", station: "Салькове", planDate: "23.12.2014", shuntToTracks: true, rightParity: "odd" },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 335], APl: [-55, 335], HN: [40, 335],
      S1: [300, 335], S3: [335, 300], S5: [420, 335], X5: [455, 370], S7: [460, 300], X7: [495, 265],
      L4: [580, 265], L2: [580, 300], L1: [580, 335], L3: [560, 370],
      R4: [1560, 265], R2: [1560, 300], R1: [1560, 335], R3: [1500, 370],
      X6: [1605, 265], S6: [1640, 300], S8: [1640, 335], S10: [1605, 370], H5: [1820, 370],
      S4: [1740, 300], S2: [1775, 335],
      CN: [2000, 300], BRu: [2140, 300], A1u: [2280, 300], EX: [2000, 335], BRl: [2140, 335], A1l: [2280, 335]
    },
    switches: [
      ["1", "S1", "HN", "S5", "S3", 1], ["3", "S3", "S7", "EU", "S1", -1], ["5", "S5", "S1", "L1", "X5", 1], ["7", "S7", "S3", "L2", "X7", -1],
      ["6", "S6", "S4", "R2", "X6", -1], ["8", "S8", "S2", "R1", "S10", 1], ["10", "S10", "R3", "H5", "S8", 1],
      ["4", "S4", "CN", "S6", "S2", -1], ["2", "S2", "S8", "EX", "S4", 1]
    ],
    edges: [
      ["A0u", "APu", "2ЧН"], ["APu", "EU", "1ЧН"], ["EU", "S3"], ["A0l", "APl", "2НН"], ["APl", "HN", "1НН"], ["HN", "S1"],
      ["S1", "S3"], ["S1", "S5"], ["S3", "S7"], ["S5", "L1"], ["S5", "X5"], ["X5", "L3"], ["S7", "L2"], ["S7", "X7"], ["X7", "L4"],
      ["R4", "X6"], ["X6", "S6"], ["R2", "S6"], ["R1", "S8"], ["R3", "S10"], ["S10", "H5", "5П"], ["S10", "S8"],
      ["S6", "S4"], ["S8", "S2"], ["S4", "S2"], ["S4", "CN"], ["CN", "BRu", "1ЧС"], ["BRu", "A1u", "2ЧС"], ["S2", "EX"], ["EX", "BRl", "1НС"], ["BRl", "A1l", "2НС"]
    ],
    info: { "5П": { kind: "track", len: 150, label: "Колія 5 — тупик (ЕЧ-4)" } },
    park: [
      { id: "4П", L: "L4", R: "R4", len: 845, sigL: "Ч4", sigR: "Н4", label: "Колія 4 (845 м, біля платформи)" },
      { id: "IIП", L: "L2", R: "R2", len: 848, sigL: "ЧII", name: "II", label: "Колія II (848 м, головна)" },
      { id: "IП", L: "L1", R: "R1", len: 851, sigR: "НI", name: "I", label: "Колія I (851 м, головна)" },
      { id: "3П", L: "L3", R: "R3", len: 839, sigR: "Н3", label: "Колія 3 (839 м, біля платформи)" }
    ],
    lines: [
      { key: "N", name: "Новоолексіївка (Мелітополь)", arrParity: "odd", secs: [["2НН", 1300, "Перегін з Новоолексіївки, 2-й блок"], ["1НН", 900, "Перегін з Новоолексіївки, 1-й блок"]],
        entry: { id: "Н", node: "HN", dir: "R", note: "вхідний з Новоолексіївки" },
        exit: { far: "A0u", sec: "2ЧН", secs: [["1ЧН", 900, "Перегін на Новоолексіївку, 1-й блок"], ["2ЧН", 1300, "Перегін на Новоолексіївку, 2-й блок"]] },
        button: { id: "ВН", node: "EU", dx: -110, side: -1, label: "відпр. на НОВООЛЕКСІЇВКУ", note: "кінець маршруту відправлення на Новоолексіївку (Мелітополь)" } },
      { key: "V", name: "Сиваш (Джанкой)", arrParity: "even", secs: [["2ЧС", 1300, "Перегін з Сиваша, 2-й блок"], ["1ЧС", 900, "Перегін з Сиваша, 1-й блок"]],
        entry: { id: "Ч", node: "CN", dir: "L", note: "вхідний з Сиваша" },
        exit: { far: "A1l", sec: "2НС", secs: [["1НС", 900, "Перегін на Сиваш, 1-й блок"], ["2НС", 1300, "Перегін на Сиваш, 2-й блок"]] },
        button: { id: "ВС", node: "EX", dx: 110, side: 1, label: "відпр. на СИВАШ", note: "кінець маршруту відправлення на Сиваш (Джанкой)" } }
    ],
    view: {
      box: [-165, 150, 2460, 300],
      platforms: [[960, 245, 560, 9], [960, 381, 480, 9]],
      notes: [[-150, 255, "← НОВООЛЕКСІЇВКА · Мелітополь"], [2040, 255, "СИВАШ · Джанкой →"], [1680, 395, "(ЕЧ-4)"], [1160, 425, "ЕЦ · ПБ"]],
      borders: [],
      blockLabels: [["2ЧН", -110, 300, -13], ["1ЧН", -15, 300, -13], ["2НН", -110, 335, 20], ["1НН", -15, 335, 20], ["1ЧС", 2060, 300, -13], ["2ЧС", 2200, 300, -13], ["1НС", 2060, 335, 20], ["2НС", 2200, 335, 20]],
      graph: ["Новоолексіївка", "Салькове", "Сиваш"]
    },
    radio: { sides: { N: { name: "Новоолексіївка", from: "Новоолексіївки", dsp: "Марченко", inc: 20 }, V: { name: "Сиваш", from: "Сиваша", dsp: "Гончаренко", inc: 40 } },
      bySignal: { "Н": "N", "Ч": "V" }, byLine: { "2ЧН": "N", "2НС": "V" }, odd: {}, even: {} },
    entrySignal: { odd: "Н", even: "Ч" }
  });
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний (вліво)", odd: "непарний (вправо)", station: "по станції" },
    trackPreference: { odd: ["IП", "3П"], even: ["IIП", "4П"] },
    typeTracks: { passenger: ["IП", "IIП", "3П", "4П"], electric: ["3П", "4П"], freight: ["IП", "IIП", "3П", "4П"], reserve: ["IП", "IIП"], household: ["3П", "4П"], test: ["IП", "IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 6, household: 6, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 70, electric: 60, freight: 45, household: 35, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["3П", "4П"], mainTracks: ["IП", "IIП", "3П", "4П"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {
      "ЕЧ5": { name: "Подача вагонів у тупик 5 (ЕЧ-4) з колії 3", start: "3П", plan: [{ sig: "Н3", end: "5П" }, { leave: true }, { wait: 300 }, { couple: true }, { wait: 60 }] }
    }
  };
  const LINE = { N: { entry: "Н", exit: "2ЧН", name: "Новоолексіївка" }, V: { entry: "Ч", exit: "2НС", name: "Сиваш" } };
  function generate(seed, intensity, day) {
    const G = K.toolkit("SAL|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    function through(type, odd, t, stop, from, to) {
      const fl = odd ? "N" : "V", tl = odd ? "V" : "N";
      const ta = G.slot(fl, t); if (ta == null) return false;
      const td = G.slot(tl, ta + stop + 2); if (td == null) { G.unslot(fl, ta); return false; }
      const n = G.num(type === "passenger" ? 1 : type === "electric" ? 6501 : type === "reserve" ? 4901 : 2001, type === "freight" ? 898 : type === "passenger" ? 140 : 98, odd);
      const plat = stop && (type === "passenger" || type === "electric");
      ev.push({ time: K.hm(ta), train: String(n), type, direction: odd ? "odd" : "even", action: stop ? "stop" : "pass_station", stopMin: stop, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        recTrack: plat ? (odd ? "3П" : "4П") : (odd ? "IП" : "IIП"), from, to, timeStatus: "generated", note: stop ? "зупинка " + stop + " хв" : "без зупинки" });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(); a++); };
    tryN(Math.max(2, Math.round(4 * k)), () => { const o = G.r() < 0.5; return through("passenger", o, G.ri(0, 1400), G.r() < 0.4 ? 2 : 0, o ? G.pick(["Київ", "Харків", "Запоріжжя-1"]) : G.pick(["Сімферополь", "Севастополь"]), o ? G.pick(["Сімферополь", "Євпаторія"]) : G.pick(["Київ", "Дніпропетровськ"])); });
    tryN(Math.max(4, Math.round(8 * k)), () => { const o = G.r() < 0.5; return through("electric", o, G.ri(270, 1380), 1, o ? G.pick(["Мелітополь", "Новоолексіївка"]) : "Джанкой", o ? "Джанкой" : G.pick(["Мелітополь", "Новоолексіївка"])); });
    tryN(Math.max(3, Math.round(8 * k)), () => { const o = G.r() < 0.5; return through("freight", o, G.ri(0, 1400), G.r() < 0.2 ? G.ri(15, 40) : 0, o ? "Мелітополь" : "Джанкой", o ? "Джанкой" : "Мелітополь"); });
    tryN(Math.max(1, Math.round(2 * k)), () => { const o = G.r() < 0.5; return through("reserve", o, G.ri(0, 1400), 0, o ? "Мелітополь" : "Джанкой", o ? "Джанкой" : "Мелітополь"); });
    if (G.r() < 0.7) { const t = G.ri(500, 1000); ev.push({ time: K.hm(t), train: "МН-01", type: "shunting", direction: "station", action: "shunting_sequence", job: "ЕЧ5", timeStatus: "generated" }); }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "salkove_" + seed + "_" + intensity + "_d" + day, station: "Салькове", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.salkove = { id: "salkove", name: "Салькове", note: "проміжна, двоколійна: Новоолексіївка — Сиваш", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

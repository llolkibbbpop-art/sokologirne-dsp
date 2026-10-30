/*
 * Пост Амур (between Дніпро-Головний and Нижньодніпровськ), after the station plan «Дата кор. 22.01.2016».
 * A block post on the double-track line: three tracks IАП (896 м), 3АП (863 м), IIАП (909 м),
 * crossovers 2А/4А/6А on the Дніпро side and 1А/3А/5А on the Нижньодніпровськ side.
 * Odd trains run to the left (towards Дніпро-Головний) on IАП, even to the right on IIАП;
 * 3АП takes trains of both directions (overtaking). Trains do not stop here, there is no shunting.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "amur", station: "Пост Амур", planDate: "22.01.2016", shuntToTracks: false, rightParity: "even" },
    nodes: {
      A0u: [-150, 300], APu: [-55, 300], EU: [40, 300], A0l: [-150, 370], APl: [-55, 370], EL: [40, 370],
      S4: [300, 300], S2: [300, 370], S6: [335, 335],
      L1: [520, 300], L3: [520, 335], L2: [520, 370],
      R1: [1480, 300], R3: [1480, 335], R2: [1480, 370],
      S5: [1665, 335], S1: [1700, 300], S3: [1700, 370],
      EN: [1960, 300], BNu: [2100, 300], ANu: [2240, 300], EX: [1960, 370], BNl: [2100, 370], ANl: [2240, 370]
    },
    switches: [
      ["4А", "S4", "EU", "L1", "S6", 1], ["2А", "S2", "EL", "L2", "S6", -1], ["6А", "S6", "L3", "S4", "S2", 1],
      ["1А", "S1", "EN", "R1", "S5", 1], ["3А", "S3", "EX", "R2", "S5", -1], ["5А", "S5", "R3", "S1", "S3", 1]
    ],
    edges: [
      ["A0u", "APu", "2ЧД"], ["APu", "EU", "1ЧД"], ["EU", "S4"], ["A0l", "APl", "2НД"], ["APl", "EL", "1НД"], ["EL", "S2"],
      ["S4", "L1"], ["S2", "L2"], ["S4", "S6"], ["S2", "S6"], ["S6", "L3"],
      ["R1", "S1"], ["R2", "S3"], ["R3", "S5"], ["S5", "S1"], ["S5", "S3"],
      ["S1", "EN"], ["EN", "BNu", "1НН"], ["BNu", "ANu", "2НН"], ["S3", "EX"], ["EX", "BNl", "1ЧН"], ["BNl", "ANl", "2ЧН"]
    ],
    park: [
      { id: "IАП", L: "L1", R: "R1", len: 896, sigL: "Н1А", name: "IАП", label: "Колія IАП (896 м, головна)" },
      { id: "3АП", L: "L3", R: "R3", len: 863, sigL: "Н3А", sigR: "Ч3А", name: "3АП", label: "Колія 3АП (863 м, обгінна)" },
      { id: "IIАП", L: "L2", R: "R2", len: 909, sigR: "Ч2А", name: "IIАП", label: "Колія IIАП (909 м, головна)" }
    ],
    lines: [
      { key: "D", name: "Дніпро-Головний", arrParity: "even", secs: [["2НД", 900, "Перегін з Дніпра-Головного, 2-й блок"], ["1НД", 700, "Перегін з Дніпра-Головного, 1-й блок"]],
        entry: { id: "ЧА", node: "EL", dir: "R", note: "вхідний з Дніпра-Головного" },
        exit: { far: "A0u", sec: "2ЧД", secs: [["1ЧД", 700, "Перегін на Дніпро-Головний, 1-й блок"], ["2ЧД", 900, "Перегін на Дніпро-Головний, 2-й блок"]] },
        button: { id: "ВД", node: "EU", dx: -110, side: -1, label: "відпр. на ДНІПРО-ГОЛ.", note: "кінець маршруту відправлення на Дніпро-Головний" } },
      { key: "N", name: "Нижньодніпровськ", arrParity: "odd", secs: [["2НН", 1300, "Перегін з Нижньодніпровська, 2-й блок"], ["1НН", 900, "Перегін з Нижньодніпровська, 1-й блок"]],
        entry: { id: "НА", node: "EN", dir: "L", note: "вхідний з Нижньодніпровська" },
        exit: { far: "ANl", sec: "2ЧН", secs: [["1ЧН", 900, "Перегін на Нижньодніпровськ, 1-й блок"], ["2ЧН", 1300, "Перегін на Нижньодніпровськ, 2-й блок"]] },
        button: { id: "ВН", node: "EX", dx: 110, side: 1, label: "відпр. на НИЖНЬОДНІПРОВСЬК", note: "кінець маршруту відправлення на Нижньодніпровськ" } }
    ],
    view: {
      box: [-165, 200, 2420, 240],
      platforms: [[700, 284, 500, 8], [700, 381, 500, 8]],
      notes: [[-150, 255, "← ДНІПРО-ГОЛОВНИЙ"], [1960, 255, "НИЖНЬОДНІПРОВСЬК →"], [900, 420, "Пост Амур · поїзди не зупиняються, маневрів немає"]],
      borders: [],
      blockLabels: [["2ЧД", -110, 300, -13], ["1ЧД", -15, 300, -13], ["2НД", -110, 370, 20], ["1НД", -15, 370, 20], ["1НН", 2030, 300, -13], ["2НН", 2170, 300, -13], ["1ЧН", 2030, 370, 20], ["2ЧН", 2170, 370, 20]],
      graph: ["Дніпро-Гол.", "Пост Амур", "Нижньодн."]
    },
    radio: { sides: { D: { name: "Дніпро-Головний", from: "Дніпра-Головного", dsp: "Коваленко", inc: 50 }, N: { name: "Нижньодніпровськ", from: "Нижньодніпровська", dsp: "Олійник", inc: 30 } },
      bySignal: { "ЧА": "D", "НА": "N" }, byLine: { "2ЧД": "D", "2ЧН": "N" }, odd: {}, even: {} },
    entrySignal: { odd: "НА", even: "ЧА" }
  });
  const P = {
    directionParity: { even: "even", odd: "odd" }, directionLabel: { even: "парний (вправо)", odd: "непарний (вліво)", station: "по станції" },
    trackPreference: { odd: ["IАП", "3АП"], even: ["IIАП", "3АП"] },
    typeTracks: { passenger: ["IАП", "IIАП", "3АП"], electric: ["IАП", "IIАП", "3АП"], freight: ["3АП", "IАП", "IIАП"], household: ["3АП", "IАП", "IIАП"], reserve: ["IАП", "IIАП", "3АП"], test: ["IАП", "IIАП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 4, electric: 4, freight: 5, household: 5, reserve: 4, shunting: 1, test: 4 }, departLeadMin: 5, terminateSec: 90,
    speedKmh: { passenger: 60, electric: 60, freight: 45, household: 40, reserve: 60, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["IАП", "IIАП", "3АП"], mainTracks: ["IАП", "IIАП"],
    trainBlocks: { passenger: [2, 3], electric: [2, 2], freight: [3, 4], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: false, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 50,
    shuntingJobs: {}
  };
  const LINE = { D: { entry: "ЧА", exit: "2ЧД", name: "Дніпро-Головний" }, N: { entry: "НА", exit: "2ЧН", name: "Нижньодніпровськ" } };
  // standalone: many through trains, none stop (a block post)
  function generate(seed, intensity, day) {
    const G = K.toolkit("AMR|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    function through(type, odd, t) {
      const fl = odd ? "N" : "D", tl = odd ? "D" : "N";
      const ta = G.slot(fl, t, 5); if (ta == null) return false;
      const n = G.num(type === "passenger" ? 1 : type === "electric" ? 6001 : type === "reserve" ? 4801 : 2001, type === "freight" ? 898 : type === "passenger" ? 180 : 398, odd);
      ev.push({ time: K.hm(ta), train: String(n), type, direction: odd ? "odd" : "even", action: "pass_station", stopMin: 0, entry: LINE[fl].entry, exitTo: LINE[tl].exit,
        from: odd ? "Нижньодніпровськ" : "Дніпро-Головний", to: odd ? "Дніпро-Головний" : "Нижньодніпровськ", timeStatus: "generated", note: "без зупинки" });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 6 && !f(); a++); };
    tryN(Math.round(16 * k), () => through("electric", G.r() < 0.5, G.ri(270, 1400)));
    tryN(Math.round(12 * k), () => through("passenger", G.r() < 0.5, G.ri(0, 1420)));
    tryN(Math.round(14 * k), () => through("freight", G.r() < 0.5, G.ri(0, 1420)));
    tryN(Math.max(1, Math.round(3 * k)), () => through("reserve", G.r() < 0.5, G.ri(0, 1420)));
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "amur_" + seed + "_" + intensity + "_d" + day, station: "Пост Амур", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.amur = { id: "amur", name: "Пост Амур", note: "пост на перегоні Дніпро-Головний — Нижньодніпровськ", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

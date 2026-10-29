/*
 * Станція Генічеськ (тупикова), after the station plan.
 * Single-track line from Новоолексіївка (entry Н on the left); all trains terminate and leave back
 * through the exit signals Ч1, ЧII, Ч3. Loco-hauled trains need a runaround through track 2а
 * (towards вантажний парк Б) and the other main track. Електропоїзди have cabs at both ends.
 * Small station: very few freight trains; П/К №1 and П/К №2 are served from track 3.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const T = K.build({
    meta: { id: "henichesk", station: "Генічеськ", planDate: "2015", terminal: true, lineArrivalParity: "odd", shuntToTracks: true, rightParity: "odd",
      directions: { left: { name: "Новоолексіївка", parity: "парний — відправлення", note: "plan" } } },
    nodes: {
      A0: [-150, 300], AP: [-55, 300], EN: [40, 300], M1n: [150, 300],
      S1: [260, 300], X1: [295, 335], S3: [380, 335], X3: [345, 370], M3n: [290, 370], HK2: [150, 370],
      S7: [450, 335], X7: [485, 370], M5n: [560, 370], HK1: [860, 370],
      S5: [420, 300], X5: [455, 265],
      L1: [560, 265], L2: [560, 300], L3: [560, 335],
      R1: [1400, 265], R2: [1380, 300], R3: [960, 335],
      S10: [1440, 265], M4n: [1530, 265], H10: [1640, 265], S2: [1475, 300], M2n: [1560, 300], H2a: [1940, 300]
    },
    switches: [
      ["1", "S1", "M1n", "S5", "X1", 1], ["5", "S5", "S1", "L2", "X5", -1],
      ["3", "S3", "S7", "X1", "X3", -1], ["7", "S7", "S3", "L3", "X7", 1],
      ["10", "S10", "R1", "M4n", "S2", -1], ["2", "S2", "M2n", "R2", "S10", 1]
    ],
    edges: [
      ["A0", "AP", "2ГН"], ["AP", "EN", "1ГН"], ["EN", "M1n", "НІП"], ["M1n", "S1"],
      ["S1", "S5"], ["S1", "X1"], ["X1", "S3"], ["S5", "L2"], ["S5", "X5"], ["X5", "L1"],
      ["S3", "S7"], ["S3", "X3"], ["X3", "M3n"], ["M3n", "HK2", "ПК2П"], ["S7", "L3"], ["S7", "X7"], ["X7", "M5n"], ["M5n", "HK1", "ПК1П"],
      ["R1", "S10"], ["S10", "M4n"], ["M4n", "H10", "10П"], ["S10", "S2"], ["R2", "S2"], ["S2", "M2n"], ["M2n", "H2a", "2аП"]
    ],
    info: {
      "НІП": { kind: "switchless", len: 150, label: "Безстрілочна ділянка за вхідним Н" },
      "ПК2П": { kind: "track", len: 180, label: "Під'їзна колія П/К №2" },
      "ПК1П": { kind: "track", len: 300, label: "Під'їзна колія П/К №1" },
      "10П": { kind: "track", len: 120, label: "Колія 10 — тупик за стрілкою 10" },
      "2аП": { kind: "track", len: 1335, label: "Колія 2а (1335 м) на вантажний парк Б, тупик" }
    },
    signals: [
      { id: "М1", node: "M1n", dir: "R", kind: "shunt", note: "повернення з ділянки НІП у парк (обгін локомотива)" },
      { id: "М3", node: "M3n", dir: "R", kind: "shunt", note: "виїзд з П/К №2" },
      { id: "М5", node: "M5n", dir: "L", kind: "shunt", note: "виїзд з П/К №1" },
      { id: "М4", node: "M4n", dir: "L", kind: "shunt", note: "виїзд з тупика 10" },
      { id: "М2", node: "M2n", dir: "L", kind: "shunt", note: "виїзд з колії 2а (вантажний парк Б) у парк" }
    ],
    park: [
      { id: "1П", L: "L1", R: "R1", len: 831, sigL: "Ч1", sigR: "Н1М", kindR: "shunt", label: "Колія 1 (831 м, біля платформи)" },
      { id: "IIП", L: "L2", R: "R2", len: 798, sigL: "ЧII", sigR: "НIIМ", kindR: "shunt", name: "II", label: "Колія II (798 м, головна, біля платформи)" },
      { id: "3П", L: "L3", R: "R3", len: 393, sigL: "Ч3", label: "Колія 3 (393 м, тупик)" }
    ],
    lines: [
      { key: "N", name: "Новоолексіївка", arrParity: "odd", secs: [["2ГН", 1300, "Перегін Новоолексіївка — Генічеськ, 2-й блок (одноколійний)"], ["1ГН", 900, "Перегін Новоолексіївка — Генічеськ, 1-й блок (одноколійний)"]],
        entry: { id: "Н", node: "EN", dir: "R", note: "вхідний з Новоолексіївки" },
        exit: { far: "A0", sec: "2ГН" },
        button: { id: "ВН", node: "EN", dx: -100, side: -1, label: "відпр. на НОВООЛЕКСІЇВКУ", note: "кінець маршруту відправлення на Новоолексіївку" } }
    ],
    view: {
      box: [-165, 200, 2140, 230],
      platforms: [[760, 245, 520, 9]],
      notes: [[-150, 255, "← НОВООЛЕКСІЇВКА (відправлення — парні)"], [150, 395, "П/К №2"], [700, 395, "П/К №1"], [1700, 290, "→ вантажний парк Б"], [1010, 340, "тупик"]],
      borders: [],
      blockLabels: [["2ГН", -105, 300, 20], ["1ГН", -10, 300, 20]],
      graph: ["Новоолексіївка", "Генічеськ"]
    },
    radio: { sides: { N: { name: "Новоолексіївка", from: "Новоолексіївки", dsp: "Марченко", inc: 25 } }, odd: { back: "N", fwd: null }, even: { back: null, fwd: "N" } },
    entrySignal: { odd: "Н" }
  });
  const EXITS = ["Ч1", "ЧII"];
  const P = {
    directionParity: { arr: "odd", dep: "even" }, directionLabel: { arr: "прибуття", dep: "відправлення", station: "по станції" },
    trackPreference: { odd: ["1П", "IIП", "3П"], even: [] },
    typeTracks: { passenger: ["IIП", "1П"], electric: ["1П", "IIП", "3П"], freight: ["IIП", "1П"], household: ["IIП", "1П"], reserve: ["IIП", "1П", "3П"], test: ["IIП"] },
    recommendedTrack: {}, appearLeadMin: { passenger: 5, electric: 5, freight: 7, household: 7, reserve: 5, shunting: 1, test: 5 }, departLeadMin: 6, terminateSec: 90,
    speedKmh: { passenger: 50, electric: 50, freight: 40, household: 35, reserve: 50, shunting: 15, test: 50 }, minSectionSec: 8, tailSec: 10, cancelDelaySec: 180, cancelDelayShuntSec: 60,
    platformTracks: ["1П", "IIП", "3П"], mainTracks: ["1П", "IIП"],
    trainBlocks: { passenger: [2, 3], electric: [1, 2], freight: [3, 3], household: [2, 2], reserve: [1, 1], shunting: [1, 1], test: [2, 2] },
    artReleaseSec: 180, shuntWaitSec: 300, shuntingEnabledByDefault: true, switchTransferSec: 4, cancelFreeSec: 6, invitationSec: 90, divergingKmh: 40,
    shuntingJobs: {
      RUN: {
        name: "Обгін локомотива через колію 2а і сусідню головну колію",
        estSec: 1500,
        build({ S, ev, findConsist }) {
          const sec = findConsist(ev.ev.consist);
          if (!sec) return { wait: "состав " + ev.ev.consist + " ще не прибув" };
          if (S.sec[sec].wagons.ready) return { skip: "состав уже готовий" };
          const own = T.exitSignals.even[sec];
          if (!own || own === "Ч3") return { wait: "состав стоїть на колії без обгінного виходу" };
          return { start: sec, onWagons: true, plan: [
            { sig: "@R", end: "2аП", free: true, txt: "відчепитися і виїхати праворуч на колію 2а" },
            { sig: "М2", end: EXITS.filter((x) => x !== own), free: true, txt: "з колії 2а за М2 на сусідню колію до вихідного світлофора" },
            { sig: "@L", end: "Н", txt: "через ліву горловину за М1 (ділянка НІП)" },
            { sig: "М1", end: sec, txt: "назад на свою колію до состава" },
            { attach: true }
          ] };
        }
      },
      "ПК1": { name: "Подача вагонів на П/К №1 з колії 3", start: "3П", plan: [{ sig: "Ч3", end: "Н" }, { sig: "М1", end: "ПК1П" }, { leave: true }, { wait: 60 }, { sig: "М5", end: "Н" }, { sig: "М1", end: "3П" }] },
      "ПК1П": { name: "Прибирання вагонів з П/К №1 на колію 3", start: "3П", plan: [{ sig: "Ч3", end: "Н" }, { sig: "М1", end: "ПК1П" }, { couple: true }, { wait: 120 }, { sig: "М5", end: "Н" }, { sig: "М1", end: "3П" }] },
      "ПК2": { name: "Подача вагонів на П/К №2 з колії 3", start: "3П", plan: [{ sig: "Ч3", end: "ПК2П" }, { leave: true }, { wait: 60 }, { sig: "М3", end: "3П" }] },
      "ПК2П": { name: "Прибирання вагонів з П/К №2 на колію 3", start: "3П", plan: [{ sig: "Ч3", end: "ПК2П" }, { couple: true }, { wait: 120 }, { sig: "М3", end: "3П" }] }
    }
  };
  const LINE = { N: { entry: "Н", exit: "2ГН", name: "Новоолексіївка" } };
  function generate(seed, intensity, day) {
    const G = K.toolkit("GEN|" + seed + "|" + intensity + "|" + day), k = K.LEVELS[intensity] || 1, ev = [];
    let mn = 0;
    const shunt = (t, job, extra) => ev.push(Object.assign({ time: K.hm(t), train: "МН-" + String(++mn).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" }, extra || {}));
    const odd = (n) => (n % 2 ? n : n + 1);
    // a terminating pair on the single-track line; loco-hauled trains reserve the other main track for the runaround
    function pair(type, a, stand, needRun, where) {
      const ta = G.slot("N", a, 10); if (ta == null) return false;
      const td = G.slot("N", ta + stand, 10); if (td == null || td > 1420) { G.unslot("N", ta); return false; }
      const tracks = needRun ? ["IIП", "1П"] : type === "electric" ? ["1П", "IIП", "3П"] : ["IIП", "1П", "3П"];
      const trk = tracks.find((p) => G.free(p, ta - 8, td + 4) && (!needRun || G.free(p === "IIП" ? "1П" : "IIП", ta + 5, ta + 40)) && (p !== "3П" || G.free("3W", ta - 8, td + 4)));
      if (!trk) { G.unslot("N", ta); G.unslot("N", td); return false; }
      G.take(trk, ta - 8, td + 4); if (needRun) G.take(trk === "IIП" ? "1П" : "IIП", ta + 5, ta + 40); if (trk === "3П") G.take("3W", ta - 8, td + 4);
      const n = odd(G.num(type === "passenger" ? 101 : type === "electric" ? 6401 : type === "reserve" ? 4801 : 2401, 96, true)), c = String(n);
      ev.push({ time: K.hm(ta), train: c, type, direction: "arr", action: "arrive", consist: c, ready: !needRun, from: where, to: "Генічеськ", recTrack: trk, timeStatus: "generated", entry: "Н",
        note: needRun ? "кінцева: обгін локомотива, зворотний рейс № " + (n + 1) + " о " + K.hm(td) : "кінцева: зворотний рейс № " + (n + 1) + " о " + K.hm(td) });
      ev.push({ time: K.hm(td), train: String(n + 1), type, direction: "dep", action: "depart", consist: c, from: "Генічеськ", to: where, exitTo: "2ГН", timeStatus: "generated",
        note: "відправлення состава поїзда № " + c });
      if (needRun) shunt(ta + G.ri(8, 12), "RUN", { consist: c, note: "обгін локомотива поїзда № " + c });
      return true;
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 8 && !f(i, n); a++); };
    // електропоїзди — the backbone of the timetable
    tryN(Math.max(5, Math.round(9 * k)), (i, n) => pair("electric", 290 + (i + 0.5) * (1060 / n) + G.ri(-20, 20), G.ri(18, 45), false, G.pick(["Мелітополь", "Новоолексіївка", "Запоріжжя-1", "Мелітополь"])));
    // long-distance passenger (seasonal) — loco-hauled
    tryN(Math.max(1, Math.round(2 * k)), () => pair("passenger", G.ri(300, 1000), G.ri(90, 200), true, G.pick(["Київ", "Харків", "Дніпропетровськ", "Запоріжжя-1"])));
    // very little freight
    if (G.r() < 0.5 + 0.3 * k) tryN(1, () => pair("freight", G.ri(400, 1000), G.ri(80, 160), true, "Мелітополь"));
    if (G.r() < 0.5 * k) tryN(1, () => pair("reserve", G.ri(60, 1200), G.ri(30, 90), false, "Новоолексіївка"));
    // П/К from track 3: delivery, later pickup (track 3 kept free of electrics meanwhile)
    const PK = G.pick([["ПК1", "ПК1П"], ["ПК2", "ПК2П"]]);
    for (let a = 0; a < 8; a++) {
      const t = G.ri(420, 900), tp = t + G.ri(120, 220);
      if (!G.free("3П", t - 5, t + 45) || !G.free("3П", tp - 5, tp + 45)) continue;
      G.take("3П", t - 5, t + 45); G.take("3П", tp - 5, tp + 45);
      shunt(t, PK[0]); shunt(tp, PK[1]); break;
    }
    ev.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "henichesk_" + seed + "_" + intensity + "_d" + day, station: "Генічеськ", generated: true, events: ev };
  }
  window.STATION_DATA = window.STATION_DATA || {};
  window.STATION_DATA.henichesk = { id: "henichesk", name: "Генічеськ", note: "тупикова: одноколійна лінія з Новоолексіївки, обгін через 2а", TOPOLOGY: T, MODEL_PARAMS: P, generate, line: LINE };
})();

/*
 * Seeded daily timetable generator (model). Same seed + intensity + day => same timetable.
 *
 * Train categories and how this model receives them (simplified from general ПТЕ / ТРА practice,
 * not taken from the real technical-administrative act of Сокологірне):
 *  - Інтерсіті / пасажирський без зупинки: main track (odd I, even II), never a side track if avoidable.
 *  - Електропоїзд (приміський) with a stop: a track next to a platform — I or II (island platform),
 *    odd one may go to 3 (side platform). Stop ~1 min.
 *  - Вантажний: passes on the main track; if a faster train of the same direction follows closely,
 *    it is received on the side track (odd 3, even 4) and waits there to be overtaken (обгін).
 *  - Trains of the same direction keep a minimum headway (one block section ≈ 6 min).
 */
(function (root) {
  "use strict";
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const hm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };

  const DIRS = { odd: "Dzhankoi", even: "Melitopol" };
  const SPEED_RANK = { intercity: 4, passenger: 3, electric: 2, reserve: 2, freight: 1, household: 1 };
  // origin / destination stations (model; odd trains run towards Джанкой, even towards Мелітополь)
  const ENDS = {
    passenger: { a: ["Київ", "Харків", "Дніпропетровськ", "Запоріжжя-1", "Львів"], b: ["Сімферополь", "Севастополь", "Євпаторія", "Феодосія"] },
    intercity: { a: ["Київ"], b: ["Сімферополь"] },
    electric:  { a: ["Мелітополь", "Якимівка"], b: ["Новоолексіївка", "Джанкой"] },
    freight:   { a: ["Мелітополь", "Запоріжжя-Ліве", "Пологи", "Федорівка"], b: ["Джанкой", "Новоолексіївка", "Херсон"] },
    household: { a: ["Мелітополь", "Якимівка"], b: ["Новоолексіївка", "Партизани"] },
    reserve:   { a: ["Мелітополь"], b: ["Джанкой", "Новоолексіївка"] }
  };
  const HEADWAY = 6;   // min between trains of one direction
  const LEVELS = { low: 0.6, medium: 1, high: 1.5 };

  function generate(seed, intensity, day) {
    const r = mulberry32(hash(seed + "|" + intensity + "|" + day));
    const k = LEVELS[intensity] || 1;
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const list = [];
    const used = new Set();
    const num = (base, span, parity) => {
      for (let i = 0; i < 50; i++) {
        let n = base + ri(0, span);
        if ((n % 2 === 1) !== (parity === "odd")) n++;
        if (!used.has(n)) { used.add(n); return String(n); }
      }
      return String(base + used.size * 2 + (parity === "odd" ? 1 : 0));
    };
    ["odd", "even"].forEach((par) => {
      // electric trains, roughly evenly spread 05:00–22:30
      const nEl = Math.max(2, Math.round(6 * k));
      for (let i = 0; i < nEl; i++) list.push({ m: 300 + (i + 0.5) * (1050 / nEl) + ri(-20, 20), type: "electric", par, n: num(6001, 98, par) });
      // long-distance passenger trains (no stop at this station in the model)
      const nP = Math.max(2, Math.round(4 * k));
      for (let i = 0; i < nP; i++) list.push({ m: ri(0, 1439), type: "passenger", par, n: num(101, 48, par) });
      // Intercity: one per direction at medium/high intensity
      if (k >= 1) list.push({ m: ri(420, 1260), type: "intercity", par, n: num(701, 28, par) });
      // freight
      const nF = Math.max(3, Math.round(9 * k));
      for (let i = 0; i < nF; i++) list.push({ m: ri(0, 1439), type: "freight", par, n: num(2001, 798, par) });
      // reserve locomotives (light engine, no wagons) and a household (track works) train
      const nR = Math.max(1, Math.round(2 * k));
      for (let i = 0; i < nR; i++) list.push({ m: ri(0, 1439), type: "reserve", par, n: num(4801, 98, par) });
      if (r() < 0.6 * k) list.push({ m: ri(480, 1080), type: "household", par, n: num(9601, 98, par) });
    });
    // side tracks are shared by both directions: keep a busy list per track
    const busy = { "3П": [], "4П": [], "6П": [] };
    const SIDE = { odd: ["3П", "4П", "6П"], even: ["4П", "6П", "3П"] };
    const free = (trk, a, b) => busy[trk].every(([x, y]) => b <= x || a >= y);
    // headway: same direction trains at least HEADWAY apart (faster one keeps its slot)
    ["odd", "even"].forEach((par) => {
      const L = list.filter((t) => t.par === par).sort((a, b) => a.m - b.m || SPEED_RANK[b.type] - SPEED_RANK[a.type]);
      for (let i = 1; i < L.length; i++) if (L[i].m - L[i - 1].m < HEADWAY) L[i].m = L[i - 1].m + HEADWAY;
      // overtaking: freight followed closely by a faster train is put on the side track
      for (let i = 0; i < L.length - 1; i++) {
        const f = L[i];
        if (f.type !== "freight") continue;
        const fast = L.slice(i + 1).find((t) => t.m - f.m <= 14 && SPEED_RANK[t.type] > 1);
        if (fast) {
          // the freight must clear the throat well before the faster train: arrive ≥ 9 min ahead
          const prevSame = L[i - 1];
          const earliest = prevSame ? prevSame.m + HEADWAY : 0;
          if (fast.m - f.m < 9 && fast.m - 9 >= earliest) f.m = fast.m - 9;
          const stop = Math.ceil(fast.m - f.m) + 3;
          const trk = SIDE[par].find((t) => free(t, f.m - 3, f.m + stop + 5));
          if (!trk) continue; // no free side track: the freight runs ahead on the main track
          busy[trk].push([f.m - 3, f.m + stop + 5]);
          f.side = trk; f.stop = stop;
          f.note = "обгін: прийняти на колію " + trk.replace("П", "") + ", пропустити поїзд " + fast.n + " по головній, потім відправити";
        }
      }
    });
    // more variety (model): long stands of freight trains on side tracks, odd electric trains at
    // the side platform of track 3, some passenger trains with a short stop
    list.sort((a, b) => a.m - b.m);
    list.forEach((t) => {
      if (t.type === "freight" && !t.side && t.m > 120 && t.m < 1260 && r() < 0.28) {
        const stop = ri(30, 110);
        const trk = SIDE[t.par].find((x) => free(x, t.m - 3, t.m + stop + 6));
        if (trk) {
          busy[trk].push([t.m - 3, t.m + stop + 6]);
          t.side = trk; t.stop = stop;
          t.note = "стоянка " + stop + " хв на колії " + trk.replace("П", "") + " (зміна локомотивної бригади / очікування відправлення)";
        }
      }
      if (t.type === "electric") {
        t.stop = r() < 0.3 ? 2 : 1;
        if (t.par === "odd" && r() < 0.4 && free("3П", t.m - 3, t.m + t.stop + 5)) { busy["3П"].push([t.m - 3, t.m + t.stop + 5]); t.side = "3П"; }
        t.note = "зупинка " + t.stop + " хв біля платформи (колія " + (t.side ? "3" : t.par === "odd" ? "I" : "II") + ")";
      }
      if (t.type === "passenger" && r() < 0.3) { t.stop = 2; t.note = "зупинка 2 хв (посадка/висадка), головна колія"; }
      if (t.type === "household") {
        const stop = ri(20, 45), trk = SIDE[t.par].find((x) => free(x, t.m - 3, t.m + stop + 6));
        if (trk) { busy[trk].push([t.m - 3, t.m + stop + 6]); t.side = trk; t.stop = stop; t.note = "господарський: стоянка " + stop + " хв на колії " + trk.replace("П", "") + " (колійні роботи)"; }
      }
      const E = ENDS[t.type];
      if (E) { const a = E.a[ri(0, E.a.length - 1)], b = E.b[ri(0, E.b.length - 1)]; t.from = t.par === "odd" ? a : b; t.to = t.par === "odd" ? b : a; }
    });
    list.forEach((t) => { if (t.m > 1435) t.m = 1435; });
    list.sort((a, b) => a.m - b.m);
    const events = list.map((t) => {
      const main = t.par === "odd" ? "IП" : "IIП";
      const e = {
        time: hm(t.m), train: t.n, type: t.type, direction: DIRS[t.par],
        action: t.stop ? ((t.type === "freight" || t.type === "household") && !t.note.startsWith("обгін") ? "stand" : t.type === "freight" ? "overtake" : "stop") : "pass_station",
        timeStatus: "generated", recTrack: t.side || main, stopMin: t.stop || 0, from: t.from, to: t.to
      };
      if (t.type === "intercity") e.note = "Інтерсіті: лише головна колія, без зупинки, пріоритет";
      if (t.note) e.note = t.note;
      return e;
    });
    // shunting jobs: 5 / 8 / 12 per day over 05:00–23:00. Wagons delivered to a dead end (14, 15, 10)
    // stay there (the section shows occupied) until a pickup job 2–4 h later. Jobs that use station
    // tracks are not placed while a freight train stands there.
    const JOBS = { "ЕЧ-14": [], "Т-15": [], "ПЧ-10": ["6П"], "8-10": [], "4-6": ["4П", "6П"], "3-I": ["3П"] };
    const PICKUP = { "ЕЧ-14": "ЕЧ-14П", "Т-15": "Т-15П", "ПЧ-10": "ПЧ-10П" };
    const loaded = {};
    const nSh = Math.round(8 * k);
    let n = 0;
    for (let i = 0; i < nSh; i++) {
      const t = 300 + (i + 0.5) * (1080 / nSh) + ri(-25, 25);
      const ok = Object.keys(JOBS).filter((j) => JOBS[j].every((trk) => free(trk, t - 5, t + 40)) && !(PICKUP[j] && loaded[j]));
      if (!ok.length) continue;
      const job = ok[ri(0, ok.length - 1)];
      JOBS[job].forEach((trk) => busy[trk].push([t - 5, t + 40]));
      events.push({ time: hm(t), train: "МН-" + String(++n).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job, timeStatus: "generated" });
      if (PICKUP[job]) {
        const tp = t + ri(120, 240);
        if (tp < 1390 && JOBS[job].every((trk) => free(trk, tp - 5, tp + 40))) {
          loaded[job] = true;
          JOBS[job].forEach((trk) => busy[trk].push([tp - 5, tp + 40]));
          events.push({ time: hm(tp), train: "МН-" + String(++n).padStart(2, "0"), type: "shunting", direction: "station", action: "shunting_sequence", job: PICKUP[job], timeStatus: "generated" });
        }
      }
    }
    events.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { scheduleId: "generated_" + seed + "_" + intensity + "_d" + day, station: "Сокологірне", generated: true, events };
  }
  root.ScheduleGenerator = { generate };
  if (typeof module !== "undefined") module.exports = root.ScheduleGenerator;
})(typeof window !== "undefined" ? window : globalThis);

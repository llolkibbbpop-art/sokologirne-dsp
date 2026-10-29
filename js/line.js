/*
 * Line mode: several neighbouring stations run as one organism.
 * Every station keeps its own interlocking model (one engine instance per station); all of them
 * step together on one clock. A train that leaves one station towards a neighbour keeps its
 * number: when it clears the departure line, the neighbour's arrival is released after the
 * running time between the stations, and the train appears on that station's approach.
 * Stations without a player are worked by the automatic dispatcher.
 * The single-track line Новоолексіївка — Генічеськ is taken by one train at a time.
 */
(function () {
  "use strict";
  const K = window.StationKit;
  const LINES = {
    sh: {
      id: "sh", name: "Сиваш — Генічеськ", note: "ділянка: Сиваш — Салькове — Новоолексіївка — Генічеськ",
      stations: ["sivash", "salkove", "novooleksiivka", "henichesk"],
      // [station A, line key at A, station B, line key at B, running time (min), single-track]
      links: [["sivash", "S", "salkove", "V", 6, false], ["salkove", "N", "novooleksiivka", "S", 7, false], ["novooleksiivka", "G", "henichesk", "N", 10, true]],
      outer: { "sivash:D": "Солоне Озеро (Джанкой)", "novooleksiivka:P": "Партизани (Мелітополь)" }
    }
  };

  // ------------------------------------------------------------ the line timetable
  // a journey is a list of hops [station, line in, line out, stop min]; the time at a station is its arrival
  const PATH = {
    "P>D": [["novooleksiivka", "P", "S"], ["salkove", "N", "V"], ["sivash", "S", "D"]],
    "D>P": [["sivash", "D", "S"], ["salkove", "V", "N"], ["novooleksiivka", "S", "P"]],
    "P>G": [["novooleksiivka", "P", "G"], ["henichesk", "N", null]],
    "D>G": [["sivash", "D", "S"], ["salkove", "V", "N"], ["novooleksiivka", "S", "G"], ["henichesk", "N", null]],
    "G>P": [["henichesk", null, "N"], ["novooleksiivka", "G", "P"]],
    "G>D": [["henichesk", null, "N"], ["novooleksiivka", "G", "S"], ["salkove", "N", "V"], ["sivash", "S", "D"]]
  };
  const PLACE = { P: "Мелітополь", D: "Джанкой", G: "Генічеськ" };
  function linkOf(L, st, key) {
    for (const l of L.links) {
      if (l[0] === st && l[1] === key) return { to: l[2], toKey: l[3], run: l[4], single: l[5], link: l };
      if (l[2] === st && l[3] === key) return { to: l[0], toKey: l[1], run: l[4], single: l[5], link: l };
    }
    return null;
  }
  const oppo = (p) => (p === "odd" ? "even" : "odd");

  function generateLine(L, seed, level, day) {
    const G = K.toolkit("LINE|" + L.id + "|" + seed + "|" + level + "|" + day), k = K.LEVELS[level] || 1;
    const out = {}; L.stations.forEach((s) => (out[s] = []));
    const slots = {};
    const fits = (key, t, gap) => (slots[key] || []).every((x) => Math.abs(x - t) >= gap);
    const take = (key, t) => (slots[key] = slots[key] || []).push(t);
    const busy = {};
    const free = (key, a, b) => (busy[key] || []).every(([x, y]) => b <= x || a >= y);
    const hold = (key, a, b) => (busy[key] = busy[key] || []).push([a, b]);
    let jn = 0;
    // times of all hops of a journey that starts at t0 (with stops); null if it leaves the day
    function plan(path, t0, stops) {
      const ts = []; let t = t0;
      for (let i = 0; i < path.length; i++) {
        ts.push(t);
        if (i < path.length - 1) { const ln = linkOf(L, path[i][0], path[i][2]); t += (stops[i] || 0) + ln.run + 8; }
      }
      return ts[ts.length - 1] < 1425 && t0 > 5 ? ts : null;
    }
    // slot keys a hop uses: entering the station from a line, and the single-track line as a whole
    function keys(path, ts) {
      const r = [];
      path.forEach(([st, inK, outK], i) => {
        if (inK) r.push([st + "<" + inK, ts[i], 8]);
        if (outK) { const ln = linkOf(L, st, outK); if (ln && ln.single) r.push(["single:" + ln.link.join(), ts[i] + 2, 18]); }
      });
      return r;
    }
    function place(path, t, stops) {
      for (let i = 0; i < 40; i++, t += 3) {
        const ts = plan(path, t, stops); if (!ts) return null;
        const ks = keys(path, ts);
        if (ks.every(([key, x, gap]) => fits(key, x, gap))) { ks.forEach(([key, x]) => take(key, x)); return ts; }
      }
      return null;
    }
    // per-station events of one journey
    function emit(path, ts, stops, o) {
      const id = "d" + day + "-j" + ++jn;
      path.forEach(([st, inK, outK], i) => {
        const SD = window.STATION_DATA[st], T = SD.TOPOLOGY;
        const prev = i > 0, next = i < path.length - 1 ? { st: path[i + 1][0], run: linkOf(L, st, outK).run } : null;
        const base = { train: o.num, type: o.type, from: o.from, to: o.to, lineId: id, hold: prev || undefined, next: next || undefined, timeStatus: "generated" };
        if (!outK) { // arrival at the terminus
          out[st].push(Object.assign(base, { time: K.hm(ts[i]), direction: "arr", action: "arrive", consist: o.num, ready: !o.run, entry: T.lineByKey[inK].entry, recTrack: o.track,
            note: o.run ? "кінцева: обгін локомотива, зворотний рейс № " + o.back : "кінцева: зворотний рейс № " + o.back }));
          return;
        }
        if (!inK) { // departure from the terminus
          out[st].push(Object.assign(base, { time: K.hm(ts[i]), direction: "dep", action: "depart", consist: o.consist, exitTo: T.lineByKey[outK].exit, note: "відправлення состава поїзда № " + o.consist }));
          return;
        }
        const par = SD.parityOf ? SD.parityOf(inK, outK) : oppo(T.lineByKey[outK].arrParity);
        const stop = stops[i] || 0;
        const rec = SD.recFor ? SD.recFor(inK, outK, stop, G) : null;
        out[st].push(Object.assign(base, { time: K.hm(ts[i]), direction: par, action: stop ? "stop" : "pass_station", stopMin: stop, entry: T.lineByKey[inK].entry, exitTo: T.lineByKey[outK].exit,
          recTrack: rec || undefined, note: (stop ? "зупинка " + stop + " хв" : "без зупинки") + " · " + o.from + " → " + o.to }));
      });
    }
    const odd = (d) => d.endsWith("D") || d.endsWith("G");
    const num = (type, dir) => G.num(type === "passenger" ? 1 : type === "electric" ? 6401 : type === "reserve" ? 4901 : 2001, type === "freight" ? 898 : type === "passenger" ? 140 : 98, odd(dir));
    function journey(dir, type, t, stopFn, extra) {
      const path = PATH[dir], stops = path.map((h, i) => stopFn(h, i));
      const ts = place(path, t, stops); if (!ts) return null;
      const n = String(num(type, dir));
      const o = Object.assign({ num: n, type, from: PLACE[dir[0]], to: PLACE[dir[2]] }, extra || {});
      return { path, ts, stops, o, emit: () => emit(path, ts, stops, o) };
    }
    const tryN = (n, f) => { for (let i = 0; i < n; i++) for (let a = 0; a < 8 && !f(i, n); a++); };
    const elStop = () => 1;
    // terminus pair at Генічеськ: arrival, layover, departure back (loco-hauled trains need a runaround)
    function gPair(type, inDir, outDir, t, stand, needRun) {
      const a = journey(inDir, type, t, type === "electric" ? elStop : (h) => (h[0] === "novooleksiivka" ? 2 : 0)); if (!a) return false;
      const ta = a.ts[a.ts.length - 1];
      const tracks = needRun ? ["IIП", "1П"] : ["1П", "IIП"];
      for (let s = stand; s < stand + 30; s += 5) {
        const td = ta + s;
        const trk = tracks.find((p) => free(p, ta - 8, td + 4) && (!needRun || free(p === "IIП" ? "1П" : "IIП", ta + 5, ta + 40)));
        if (!trk) continue;
        const b = journey(outDir, type, td, type === "electric" ? elStop : (h) => (h[0] === "novooleksiivka" ? 2 : 0), { consist: a.o.num }); if (!b) continue;
        hold(trk, ta - 8, td + 4); if (needRun) hold(trk === "IIП" ? "1П" : "IIП", ta + 5, ta + 40);
        a.o.track = trk; a.o.run = needRun; a.o.back = b.o.num;
        a.emit(); b.emit();
        if (needRun) out.henichesk.push({ time: K.hm(ta + 10), train: "МН-Г" + jn, type: "shunting", direction: "station", action: "shunting_sequence", job: "RUN", consist: a.o.num, timeStatus: "generated", note: "обгін локомотива поїзда № " + a.o.num });
        return true;
      }
      return false;
    }
    const pd = () => (G.r() < 0.5 ? ["P>D", "D>P"] : ["D>P", "P>D"]);
    // електропоїзди: Мелітополь — Генічеськ is the main suburban flow
    tryN(Math.max(5, Math.round(8 * k)), (i, n) => gPair("electric", "P>G", "G>P", 300 + (i + 0.5) * (1000 / n) + G.ri(-20, 20), G.ri(20, 40), false));
    tryN(Math.max(1, Math.round(2 * k)), (i, n) => gPair("electric", "D>G", "G>D", 330 + (i + 0.5) * (900 / n) + G.ri(-20, 20), G.ri(25, 45), false));
    tryN(Math.max(4, Math.round(6 * k)), () => { const j = journey(pd()[0], "electric", G.ri(270, 1300), elStop); if (j) j.emit(); return !!j; });
    // passenger: through to Крим; seasonal to Генічеськ with a long layover
    tryN(Math.max(2, Math.round(4 * k)), () => { const d = pd()[0]; const j = journey(d, "passenger", G.ri(10, 1300), (h) => (h[0] === "novooleksiivka" && G.r() < 0.6 ? 2 : 0),
      { from: d[0] === "P" ? G.pick(["Київ", "Харків", "Запоріжжя-1"]) : G.pick(["Сімферополь", "Севастополь"]), to: d[0] === "P" ? G.pick(["Сімферополь", "Євпаторія"]) : G.pick(["Київ", "Дніпропетровськ"]) }); if (j) j.emit(); return !!j; });
    tryN(Math.max(1, Math.round(1.5 * k)), () => gPair("passenger", "P>G", "G>P", G.ri(300, 900), G.ri(90, 180), true));
    // freight: the main line; Генічеськ gets one at most
    tryN(Math.max(3, Math.round(7 * k)), () => { const j = journey(pd()[0], "freight", G.ri(10, 1350), () => 0); if (j) j.emit(); return !!j; });
    if (G.r() < 0.5) tryN(1, () => gPair("freight", "P>G", "G>P", G.ri(400, 900), G.ri(80, 140), true));
    tryN(Math.max(1, Math.round(2 * k)), () => { const j = journey(pd()[0], "reserve", G.ri(10, 1350), () => 0); if (j) j.emit(); return !!j; });
    // each station's own shunting work
    L.stations.forEach((st) => {
      const own = window.STATION_DATA[st].generate(seed, level, day).events.filter((e) => e.type === "shunting" && e.job !== "RUN");
      own.forEach((e) => out[st].push(Object.assign({}, e)));
    });
    const res = {};
    L.stations.forEach((st) => {
      out[st].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
      res[st] = { scheduleId: L.id + "_" + st + "_" + seed + "_" + level + "_d" + day, station: window.STATION_DATA[st].name, generated: true, events: out[st] };
    });
    return res;
  }

  // ------------------------------------------------------------ the world: all stations on one clock
  function createWorld(lineId, o) {
    o = o || {};
    const L = LINES[lineId], E = window.SimEngine;
    const W = { id: lineId, L, seed: o.seed || 2014, level: o.level || "medium", sims: {}, player: o.player || L.stations[0], endMode: "newday", shunting: true, playerAuto: false };
    let cache = {}, release = {}, transit = [], meta = {};
    const listeners = [];
    const gen = (day) => cache[day] || (cache[day] = generateLine(L, W.seed, W.level, day));
    const abs = (S) => S.day * 86400 + S.time;
    function hold(st, ev, S) {
      if (!ev.ev.hold) return false;
      const r = release[st + "|" + ev.ev.lineId];
      return !(r && abs(S) >= r.at);
    }
    // the single-track line: free only if no train is on it from either end
    function gate(st, R) {
      const T = window.STATION_DATA[st].TOPOLOGY;
      const key = Object.keys(T.lineByKey).find((k2) => T.lineByKey[k2].exit === R.to);
      const ln = key && linkOf(L, st, key);
      if (!ln || !ln.single) return null;
      const t = transit.find((x) => x.link === ln.link);
      if (t) return "Перегін до ст. " + window.STATION_DATA[ln.to].name + " зайнятий: поїзд № " + t.train + " у дорозі";
      const os = W.sims[ln.to], oT = window.STATION_DATA[ln.to].TOPOLOGY, ch = os.D.signals[oT.lineByKey[ln.toKey].entry].approachChain;
      if (ch.some((s) => os.S.sec[s].occ != null || os.S.sec[s].lock)) return "Перегін до ст. " + window.STATION_DATA[ln.to].name + " зайнятий або задано маршрут з того боку";
      return null;
    }
    function onLog(st, e) {
      if (!e.trId) return;
      const sim = W.sims[st], S = sim.S;
      if (e.evt === "spawn" || e.evt === "form") {
        const tr = S.trains.find((t) => t.id === e.trId); const ev = tr && S.events[tr.eventIdx];
        if (ev && ev.ev.lineId) meta[st + "|" + e.trId] = ev.ev;
      } else if (e.evt === "gone") {
        const m = meta[st + "|" + e.trId]; delete meta[st + "|" + e.trId];
        if (!m || !m.next) return;
        const ln = linkOf(L, st, Object.keys(window.STATION_DATA[st].TOPOLOGY.lineByKey).find((k2) => window.STATION_DATA[st].TOPOLOGY.lineByKey[k2].exit === m.exitTo));
        release[m.next.st + "|" + m.lineId] = { at: abs(S) + m.next.run * 60, from: st };
        transit.push({ link: ln ? ln.link : null, to: m.next.st, lineId: m.lineId, train: m.train, from: st });
        listeners.forEach((f) => f({ kind: "handover", from: st, to: m.next.st, train: m.train, at: abs(S) + m.next.run * 60 }));
      }
    }
    function build() {
      L.stations.forEach((st) => {
        const SD = window.STATION_DATA[st];
        const sim = E.createSim(SD.TOPOLOGY, (day) => gen(day)[st], SD.MODEL_PARAMS, { auto: st !== W.player || W.playerAuto, endMode: W.endMode, hold: (ev, S) => hold(st, ev, S), lineGate: (R) => gate(st, R) });
        sim.on((e) => onLog(st, e));
        W.sims[st] = sim;
      });
    }
    function cleanTransit() {
      transit = transit.filter((x) => {
        const ev = W.sims[x.to].S.events.find((e) => e.ev.lineId === x.lineId && e.ev.hold);
        return ev && (ev.status === "planned" || ev.status === "waiting");
      });
    }
    W.step = () => { L.stations.forEach((st) => W.sims[st].step()); cleanTransit(); };
    W.isIdle = () => L.stations.every((st) => W.sims[st].isIdle());
    W.time = () => W.sims[L.stations[0]].S.time;
    W.reset = (opt) => {
      cache = {}; release = {}; transit = []; meta = {};
      L.stations.forEach((st) => W.sims[st].reset({ auto: st === W.player ? W.playerAuto : true, endMode: W.endMode, shuntingEnabled: W.shunting, delays: {} }));
    };
    W.regenerate = (seed, level) => { if (seed) W.seed = seed; if (level) W.level = level; W.reset(); };
    W.setPlayer = (st, auto) => {
      const prev = W.player; W.player = st;
      if (W.sims[prev] && !(W.others && W.others.has(prev))) W.sims[prev].S.auto = true;
      if (W.sims[st]) W.sims[st].S.auto = !!auto;
    };
    W.inTransit = () => transit.slice();
    W.on = (f) => { listeners.push(f); return () => listeners.splice(listeners.indexOf(f), 1); };
    W.station = (st) => window.STATION_DATA[st];
    build();
    return W;
  }

  window.LineWorld = { LINES, createWorld, generateLine, linkOf };
  if (typeof module !== "undefined") module.exports = window.LineWorld;
})();

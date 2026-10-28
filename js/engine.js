/*
 * Simulation engine (no DOM). Deterministic: advances in fixed 1-second steps
 * and never uses Math.random or wall-clock time.
 * Training model only — not connected to any real signalling system.
 */
(function (root) {
  "use strict";
  const DAY = 86400;
  const ek = (a, b) => (a < b ? a + "|" + b : b + "|" + a);

  function fmt(t) {
    t = Math.max(0, Math.floor(t)) % DAY;
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  const parseHM = (s) => { const [h, m] = s.split(":").map(Number); return h * 3600 + m * 60; };

  function derive(T) {
    const edgeMap = {}, sections = {}, problems = [];
    T.edges.forEach(([a, b, sec, opt]) => {
      const e = { a, b, sec, ...(opt || {}) };
      if (!T.nodes[a] || !T.nodes[b]) problems.push("Ребро " + a + "–" + b + ": невідомий вузол");
      edgeMap[ek(a, b)] = e;
      (sections[sec] = sections[sec] || { id: sec, edges: [], kind: "switch", len: 60, ...(T.sectionInfo[sec] || {}) }).edges.push(e);
    });
    const swByNode = {}, switches = {};
    T.switches.forEach((s) => {
      const e = edgeMap[ek(s.node, s.common)];
      if (!e) { problems.push("Стрілка " + s.id + ": немає кореневого ребра"); return; }
      switches[s.id] = { ...s, section: e.sec };
      swByNode[s.node] = switches[s.id];
    });
    const signals = {};
    T.signals.forEach((s) => (signals[s.id] = { ...s }));
    const routes = {};
    T.routes.forEach((r) => {
      const R = { ...r, sections: [], switches: {}, problems: [] };
      for (let i = 0; i < r.path.length - 1; i++) {
        const e = edgeMap[ek(r.path[i], r.path[i + 1])];
        if (!e) { R.problems.push("немає ребра " + r.path[i] + "–" + r.path[i + 1]); continue; }
        if (R.sections[R.sections.length - 1] !== e.sec) R.sections.push(e.sec);
      }
      for (let i = 1; i < r.path.length - 1; i++) {
        const sw = swByNode[r.path[i]]; if (!sw) continue;
        const p = r.path[i - 1], n = r.path[i + 1];
        const other = p === sw.common ? n : n === sw.common ? p : null;
        if (other === null) { R.problems.push("стрілка " + sw.id + ": шлях не проходить через вістря"); continue; }
        R.switches[sw.id] = other === sw.plus ? "+" : other === sw.minus ? "-" : "?";
      }
      if (!signals[r.from]) R.problems.push("невідомий сигнал " + r.from);
      R.problems.forEach((p) => problems.push("Маршрут " + r.id + ": " + p));
      routes[r.id] = R;
    });
    return { edgeMap, sections, switches, signals, routes, problems };
  }

  function createSim(T, SCHED, P, opts) {
    const D = derive(T);
    const listeners = [];
    let S;

    function log(kind, text) {
      const e = { day: S.day, t: S.time, kind, text };
      S.log.push(e);
      listeners.forEach((f) => f(e));
    }

    function buildEvents() {
      return SCHED.events.map((ev, i) => {
        const parity = P.directionParity[ev.direction] || null;
        let needsConfig = null;
        if (ev.action === "shunting_sequence") {
          if (!S.shuntingEnabled) needsConfig = "маневровий сценарій вимкнено: призначення сигналу М9 (повернення з колії 14) — припущення, потребує підтвердження";
        } else if (!parity) needsConfig = "напрямок «" + ev.direction + "» не зіставлено з планом";
        return {
          idx: i, ev, parity, needsConfig,
          time: parseHM(ev.time), delayMin: (S.delays[i] || 0),
          status: needsConfig ? "config" : "planned", trainId: null, passedAt: null, extraWait: 0
        };
      });
    }

    function reset(o) {
      o = o || {};
      S = {
        day: 1, time: o.startTime || 0, auto: o.auto !== undefined ? o.auto : true,
        endMode: o.endMode || "newday", paused: false,
        shuntingEnabled: o.shuntingEnabled !== undefined ? o.shuntingEnabled : P.shuntingEnabledByDefault,
        sw: {}, sec: {}, sig: {}, routes: {}, trains: [], log: [], delays: o.delays || {}, nextTrainId: 1,
        pendingTests: [], timers: []
      };
      Object.keys(D.switches).forEach((id) => (S.sw[id] = { pos: "+", lockedInd: false, blocked: false }));
      Object.keys(D.sections).forEach((id) => (S.sec[id] = { occ: null, lock: null, blocked: false, artUntil: null }));
      Object.keys(D.signals).forEach((id) => (S.sig[id] = { open: false }));
      S.events = buildEvents();
      log("sys", "Початок модельної доби. Режим: " + (S.auto ? "автодиспетчер" : "ручне керування"));
      D.problems.forEach((p) => log("warn", "Топологія: " + p));
    }

    // ---------- interlocking checks ----------
    function switchLockedBy(id) {
      const sw = D.switches[id];
      const sec = S.sec[sw.section];
      if (S.sw[id].lockedInd) return "стрілку " + id + " замкнено індивідуально";
      if (sec.lock) return "стрілка " + id + " замкнена в маршруті " + sec.lock;
      if (sec.occ) return "стрілочна секція " + sw.section + " зайнята";
      return null;
    }

    function checkRoute(rid) {
      const R = D.routes[rid];
      if (!R) return "Невідомий маршрут " + rid;
      if (R.problems.length) return "Маршрут " + rid + " потребує уточнення: " + R.problems.join("; ");
      if (S.routes[rid]) return "Маршрут " + rid + " вже задано";
      for (const s of R.sections) {
        const st = S.sec[s];
        if (st.occ) return "Секція " + s + " зайнята (" + trainLabel(st.occ) + ")";
        if (st.lock) return "Секція " + s + " замкнена у ворожому маршруті " + st.lock;
        if (st.blocked) return "Секція " + s + " заблокована ДСП";
      }
      for (const [id, pos] of Object.entries(R.switches)) {
        if (pos === "?") return "Положення стрілки " + id + " не визначене";
        if (S.sw[id].blocked) return "Стрілку " + id + " заблоковано ДСП";
        if (S.sw[id].pos !== pos) { const l = switchLockedBy(id); if (l) return "Не можна перевести: " + l; }
      }
      return null;
    }

    function setRoute(rid, by) {
      const err = checkRoute(rid);
      if (err) { log("error", "МНУ " + rid + ": відмова — " + err); return { ok: false, err }; }
      const R = D.routes[rid];
      for (const [id, pos] of Object.entries(R.switches)) {
        if (S.sw[id].pos !== pos) { S.sw[id].pos = pos; log("auto", "Стрілку " + id + " переведено в " + (pos === "+" ? "плюс" : "мінус")); }
      }
      R.sections.forEach((s) => (S.sec[s].lock = rid));
      S.routes[rid] = { state: "set", setAt: S.time, by: by || "ДСП" };
      log(by === "авто" ? "auto" : "cmd", "Маршрут " + rid + " задано і замкнено (" + (by || "ДСП") + ")");
      return { ok: true };
    }

    function routeFromSignal(sig, states) {
      return Object.keys(S.routes).find((rid) => D.routes[rid].from === sig && (!states || states.includes(S.routes[rid].state)));
    }

    function openSignal(sig, by) {
      const rid = routeFromSignal(sig, ["set"]);
      if (!rid) {
        const err = routeFromSignal(sig, ["open"]) ? "сигнал уже відкрито" : "маршрут від " + sig + " не задано і не замкнено";
        log("error", "Відкриття " + sig + ": відмова — " + err);
        return { ok: false, err };
      }
      const R = D.routes[rid];
      for (const [id, pos] of Object.entries(R.switches))
        if (S.sw[id].pos !== pos) { const err = "стрілка " + id + " не в положенні маршруту"; log("error", "Відкриття " + sig + ": відмова — " + err); return { ok: false, err }; }
      for (const s of R.sections)
        if (S.sec[s].occ) { const err = "секція " + s + " зайнята"; log("error", "Відкриття " + sig + ": відмова — " + err); return { ok: false, err }; }
      S.routes[rid].state = "open"; S.sig[sig].open = true;
      log(by === "авто" ? "auto" : "cmd", "Світлофор " + sig + " відкрито (маршрут " + rid + ")");
      return { ok: true };
    }

    function closeSignal(sig) {
      if (!S.sig[sig] || !S.sig[sig].open) { log("error", "Закриття " + sig + ": сигнал не відкритий"); return { ok: false, err: "сигнал не відкритий" }; }
      S.sig[sig].open = false;
      const rid = routeFromSignal(sig, ["open"]);
      if (rid) S.routes[rid].state = "set";
      log("cmd", "Світлофор " + sig + " закрито ДСП (маршрут лишається замкнутим)");
      return { ok: true };
    }

    function releaseRoute(rid, why) {
      const R = D.routes[rid];
      R.sections.forEach((s) => { if (S.sec[s].lock === rid) S.sec[s].lock = null; });
      if (S.sig[R.from]) S.sig[R.from].open = false;
      delete S.routes[rid];
      log("auto", "Маршрут " + rid + " розімкнено" + (why ? " (" + why + ")" : ""));
    }

    function cancelRoute(rid) {
      const st = S.routes[rid];
      if (!st) { log("error", "МВ " + rid + ": маршрут не задано"); return { ok: false, err: "маршрут не задано" }; }
      if (st.state === "used") { log("error", "МВ " + rid + ": поїзд уже в маршруті — розмикання посекційне"); return { ok: false, err: "поїзд у маршруті" }; }
      if (st.state === "cancelling") return { ok: false, err: "уже розмикається" };
      const R = D.routes[rid];
      const sigObj = D.signals[R.from];
      const approachOcc = st.state === "open" && approachOccupied(R.from);
      S.sig[R.from].open = false;
      if (approachOcc) {
        st.state = "cancelling"; st.until = S.time + P.cancelDelaySec;
        log("cmd", "МВ " + rid + ": ділянка наближення зайнята — розмикання з витримкою " + P.cancelDelaySec + " с");
      } else releaseRoute(rid, "відміна ДСП");
      return { ok: true };
    }

    function approachOccupied(sig) {
      const sg = D.signals[sig];
      if (sg.approach) return !!S.sec[sg.approach].occ;
      return S.trains.some((tr) => !tr.done && tr.nextSignal === sig);
    }

    function moveSwitch(id, pos) {
      const cur = S.sw[id];
      if (!pos) pos = cur.pos === "+" ? "-" : "+";
      if (cur.pos === pos) return { ok: false, err: "стрілка вже в цьому положенні" };
      if (cur.blocked) { log("error", "Переведення " + id + ": стрілку заблоковано"); return { ok: false, err: "стрілку заблоковано" }; }
      const l = switchLockedBy(id);
      if (l) { log("error", "Переведення " + id + ": відмова — " + l); return { ok: false, err: l }; }
      cur.pos = pos; log("cmd", "Стрілку " + id + " переведено в " + (pos === "+" ? "плюс" : "мінус"));
      return { ok: true };
    }
    function toggleSwitchLock(id) { const s = S.sw[id]; s.lockedInd = !s.lockedInd; log("cmd", "Стрілку " + id + (s.lockedInd ? " замкнено індивідуально" : " розімкнено")); return { ok: true }; }
    function toggleSwitchBlock(id) { const s = S.sw[id]; s.blocked = !s.blocked; log("cmd", "Стрілку " + id + (s.blocked ? " заблоковано" : " деблоковано")); return { ok: true }; }
    function toggleSectionBlock(id) { const s = S.sec[id]; s.blocked = !s.blocked; log("cmd", "Секцію " + id + (s.blocked ? " заблоковано" : " деблоковано")); return { ok: true }; }
    function artRelease(id) {
      const s = S.sec[id];
      if (!s.lock) { log("error", "ШР " + id + ": секція не замкнена"); return { ok: false, err: "секція не замкнена" }; }
      if (s.occ) { log("error", "ШР " + id + ": секція зайнята"); return { ok: false, err: "секція зайнята" }; }
      s.artUntil = S.time + P.artReleaseSec; log("cmd", "ШР " + id + ": штучне розмикання, витримка " + P.artReleaseSec + " с");
      return { ok: true };
    }

    // ---------- trains ----------
    function trainLabel(id) { const t = S.trains.find((x) => x.id === id); return t ? "поїзд " + t.num : "поїзд"; }

    function secDur(secId, tr) {
      const sec = D.sections[secId];
      const v = (P.speedKmh[tr.type] || 50) / 3.6;
      return Math.max(P.minSectionSec, Math.round(sec.len / v));
    }

    function spawnTrain(o) {
      const tr = {
        id: S.nextTrainId++, num: o.num, type: o.type, parity: o.parity, eventIdx: o.eventIdx,
        pref: o.pref, stopSec: o.stopSec || 0, seq: [o.start], idx: 0, tIn: 0, tail: null,
        nextSignal: null, wait: null, waitSec: 0, done: false, status: "на підході", shunt: o.shunt || null,
        appearedAt: S.time, stopped: 0
      };
      S.sec[o.start].occ = tr.id;
      S.trains.push(tr);
      updateNextSignal(tr);
      log("train", "Поїзд " + tr.num + " (" + typeName(tr.type) + ") з'явився на " + o.start);
      return tr;
    }
    const typeName = (t) => ({ passenger: "пасажирський", freight: "вантажний", shunting: "маневровий", test: "тестовий" }[t] || t);

    function headSec(tr) { return tr.seq[tr.idx]; }

    function updateNextSignal(tr) {
      const h = headSec(tr), info = D.sections[h];
      tr.nextSignal = null;
      if (tr.idx < tr.seq.length - 1) return;
      if (tr.shunt) { tr.nextSignal = tr.shunt.signals[tr.shunt.step] || null; return; }
      if (info.kind === "exit") return;
      if (info.kind === "approach") tr.nextSignal = T.entrySignal[tr.parity];
      else tr.nextSignal = (T.exitSignals[tr.parity] || {})[h] || null;
    }

    function autoDispatch(tr) {
      const sig = tr.nextSignal; if (!sig) return;
      if (routeFromSignal(sig, ["open"])) return;
      const setR = routeFromSignal(sig, ["set"]);
      if (setR) { openSignal(sig, "авто"); return; }
      let cands = Object.values(D.routes).filter((r) => r.from === sig);
      if (tr.pref && D.sections[headSec(tr)].kind === "approach") {
        cands = tr.pref.map((p) => cands.find((r) => r.to === p)).filter(Boolean);
      }
      let firstErr = null;
      for (const r of cands) {
        const err = checkRoute(r.id);
        if (!err) { setRoute(r.id, "авто"); openSignal(sig, "авто"); tr.lastReason = null; return; }
        firstErr = firstErr || err;
      }
      const reason = cands.length ? firstErr : "немає маршруту від " + sig;
      if (tr.lastReason !== reason) {
        tr.lastReason = reason;
        log("delay", "Поїзд " + tr.num + " затримано біля " + sig + ": " + reason);
      }
    }

    function releaseSection(secId) {
      const st = S.sec[secId];
      st.occ = null;
      if (st.lock) {
        const rid = st.lock; st.lock = null;
        if (S.routes[rid] && !D.routes[rid].sections.some((s) => S.sec[s].lock === rid)) {
          delete S.routes[rid]; log("auto", "Маршрут " + rid + " розімкнено після проходу");
        }
      }
    }

    function stepTrain(tr) {
      if (tr.done) return;
      tr.tIn++;
      if (tr.tail && S.time >= tr.tail.until) { releaseSection(tr.tail.sec); tr.tail = null; }
      const h = headSec(tr), info = D.sections[h];
      let need = secDur(h, tr);
      const atTrackEnd = tr.idx === tr.seq.length - 1 && info.kind === "track";
      if (atTrackEnd && tr.stopSec) need += tr.stopSec;
      if (atTrackEnd && tr.shunt && tr.shunt.step === 1) need += P.shuntWaitSec;
      if (atTrackEnd && tr.status !== "на станції") tr.status = "на станції";
      if (tr.tIn < need) return;
      if (tr.idx === tr.seq.length - 1) {
        if (info.kind === "exit" || (tr.shunt && tr.shunt.step >= tr.shunt.signals.length)) {
          if (tr.tail) { releaseSection(tr.tail.sec); tr.tail = null; }
          releaseSection(h); tr.done = true; tr.doneAt = S.time; tr.status = tr.shunt ? "маневри завершено" : "проследував";
          finishEvent(tr);
          log("train", tr.shunt ? "Маневровий склад " + tr.num + " завершив маневри на " + h : "Поїзд " + tr.num + " віддалився з " + h);
          return;
        }
        if (S.auto) autoDispatch(tr);
        const sig = tr.nextSignal;
        const rid = sig && routeFromSignal(sig, ["open"]);
        if (!rid) {
          if (!tr.wait) { tr.wait = sig ? "чекає відкриття " + sig : "немає вихідного сигналу з " + h; tr.status = "стоїть: " + tr.wait; }
          tr.waitSec++; tr.stopped++;
          return;
        }
        tr.seq.push(...D.routes[rid].sections);
        S.routes[rid].state = "used"; S.sig[sig].open = false;
        if (tr.shunt) { tr.shunt.step++; }
        if (D.signals[sig].kind === "exit") tr.passedAt = S.time;
        tr.wait = null;
        log("train", "Поїзд " + tr.num + " проходить " + sig + " за маршрутом " + rid);
      }
      const next = tr.seq[tr.idx + 1];
      if (S.sec[next].occ && S.sec[next].occ !== tr.id) {
        if (!tr.wait) { tr.wait = "секція " + next + " зайнята"; log("warn", "Поїзд " + tr.num + ": " + tr.wait); }
        tr.waitSec++; return;
      }
      tr.wait = null;
      if (tr.tail) { releaseSection(tr.tail.sec); }
      tr.tail = { sec: h, until: S.time + P.tailSec };
      tr.idx++; tr.tIn = 0;
      S.sec[next].occ = tr.id;
      const ni = D.sections[next];
      tr.status = ni.kind === "exit" ? "відправлено" : ni.kind === "track" ? "прибуває на " + ni.label : "рух по " + next;
      updateNextSignal(tr);
    }

    function finishEvent(tr) {
      if (tr.eventIdx == null) return;
      const ev = S.events[tr.eventIdx]; if (!ev) return;
      ev.status = "passed"; ev.passedAt = S.time;
      const late = Math.round(((tr.passedAt || S.time) - ev.time) / 60);
      ev.lateMin = late;
    }

    function spawnScheduled() {
      for (const ev of S.events) {
        if (ev.status !== "planned" && ev.status !== "waiting") continue;
        const lead = typeof P.appearLeadMin === "object" ? (P.appearLeadMin[ev.ev.type] ?? 3) : P.appearLeadMin;
        const appear = ev.time + ev.delayMin * 60 - lead * 60;
        if (S.time < appear) continue;
        if (ev.ev.action === "shunting_sequence") {
          const st = S.sec[P.shuntingPlan.start];
          if (st.occ || st.lock) { if (ev.status !== "waiting") { ev.status = "waiting"; log("delay", "Маневри " + ev.ev.train + " відкладено: колія " + P.shuntingPlan.start + " зайнята"); } continue; }
          const tr = spawnTrain({ num: ev.ev.train, type: "shunting", parity: null, start: P.shuntingPlan.start, eventIdx: ev.idx, shunt: { signals: P.shuntingPlan.signals.slice(), step: 0 } });
          ev.status = "active"; ev.trainId = tr.id; continue;
        }
        const start = D.signals[T.entrySignal[ev.parity]].approach;
        if (S.sec[start].occ) {
          if (ev.status !== "waiting") { ev.status = "waiting"; log("delay", "Поїзд " + ev.ev.train + " затримано на перегоні: ділянка " + start + " зайнята"); }
          continue;
        }
        const tr = spawnTrain({ num: ev.ev.train, type: ev.ev.type, parity: ev.parity, start, eventIdx: ev.idx, pref: P.trackPreference[ev.parity] });
        ev.status = "active"; ev.trainId = tr.id;
      }
      for (const pt of S.pendingTests) {
        if (pt.spawned || S.time < pt.at) continue;
        const start = D.signals[T.entrySignal[pt.parity]].approach;
        if (S.sec[start].occ) continue;
        pt.spawned = true;
        spawnTrain({ num: pt.num, type: "test", parity: pt.parity, start, pref: pt.pref, stopSec: pt.stopSec });
      }
    }

    function stepTimers() {
      for (const [rid, st] of Object.entries(S.routes)) if (st.state === "cancelling" && S.time >= st.until) releaseRoute(rid, "витримку завершено");
      for (const [id, st] of Object.entries(S.sec)) if (st.artUntil != null && S.time >= st.artUntil) {
        st.artUntil = null;
        if (st.occ) { log("error", "ШР " + id + ": скасовано — секція зайнята"); continue; }
        const rid = st.lock; st.lock = null; log("auto", "ШР " + id + " виконано");
        if (rid && S.routes[rid] && !D.routes[rid].sections.some((s) => S.sec[s].lock === rid)) { delete S.routes[rid]; log("auto", "Маршрут " + rid + " розімкнено повністю"); }
      }
    }

    function step() {
      if (S.paused) return;
      S.time++;
      if (S.time >= DAY) {
        if (S.endMode === "stop") { S.time = DAY - 1; S.paused = true; log("sys", "Кінець модельної доби 23:59:59 — симуляцію зупинено"); return; }
        S.time = 0; S.day++;
        S.events = buildEvents();
        log("sys", "Почалася доба " + S.day + " (графік повторюється)");
      }
      stepTimers();
      spawnScheduled();
      for (const tr of S.trains) stepTrain(tr);
      if (S.trains.length > 40) S.trains = S.trains.filter((t) => !t.done || S.time - (t.doneAt || 0) < 3600).slice(-40);
      // mark delays on events
      for (const ev of S.events) {
        if (ev.status !== "active") continue;
        const tr = S.trains.find((t) => t.id === ev.trainId);
        if (tr && tr.waitSec > 60 && !ev.delayed) { ev.delayed = true; }
      }
    }

    function run(seconds) { for (let i = 0; i < seconds && !S.paused; i++) step(); }

    function setDelay(idx, min) {
      S.delays[idx] = min;
      const ev = S.events[idx];
      if (ev && (ev.status === "planned" || ev.status === "waiting")) ev.delayMin = min;
      log("delay", "ДСП: затримка поїзда " + SCHED.events[idx].train + " = " + min + " хв");
    }

    function addTestTrain(o) {
      const pt = { num: o.num || "Т-" + (S.pendingTests.length + 1), parity: o.parity, pref: o.track ? [o.track] : P.trackPreference[o.parity], stopSec: (o.stopMin || 0) * 60, at: S.time + (o.inMin || 0) * 60, spawned: false };
      S.pendingTests.push(pt);
      log("cmd", "Створено тестовий поїзд " + pt.num + " (" + (o.parity === "odd" ? "непарний" : "парний") + ", колія " + (o.track || "авто") + ") на " + fmt(pt.at));
      return pt;
    }

    function nextEvent() {
      return S.events.filter((e) => e.status !== "passed" && e.status !== "config")
        .map((e) => ({ e, at: e.time + e.delayMin * 60 }))
        .filter((x) => x.e.status !== "active" || true)
        .sort((a, b) => a.at - b.at)[0] || null;
    }

    function isIdle() {
      return S.trains.every((t) => t.done) && !Object.values(S.routes).some((r) => r.state === "cancelling")
        && !Object.values(S.sec).some((s) => s.artUntil != null) && S.pendingTests.every((p) => p.spawned);
    }

    reset(opts);
    return {
      D, get S() { return S; }, reset, step, run, setRoute, openSignal, closeSignal, cancelRoute, moveSwitch,
      toggleSwitchLock, toggleSwitchBlock, toggleSectionBlock, artRelease, setDelay, addTestTrain, checkRoute,
      nextEvent, isIdle, fmt, on: (f) => listeners.push(f), routeFromSignal, buildEvents: () => (S.events = buildEvents()),
      log: (k, t) => log(k, t)
    };
  }

  root.SimEngine = { createSim, derive, fmt, DAY };
  if (typeof module !== "undefined") module.exports = root.SimEngine;
})(typeof window !== "undefined" ? window : globalThis);

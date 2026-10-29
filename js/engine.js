/*
 * Simulation engine (no DOM). Deterministic: advances in fixed 1-second steps and never
 * uses Math.random or wall-clock time. Training model only — not connected to any real system.
 *
 * Mechanics follow the handbook «Автоматизовані станційні системи керування рухом поїздів»,
 * pp. 136–165 (route setting from start to end signal, switch transfer, locking, opening;
 * three cancellation sets 6 s / 60 s / 180 s; artificial release 3 min; invitation signal;
 * auxiliary switch transfer with counters; blocking of signals, switches and sections).
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

  // ---------------------------------------------------------------- topology derivation
  function derive(T) {
    const edgeMap = {}, sections = {}, problems = [], adj = {};
    T.edges.forEach(([a, b, sec, opt]) => {
      const e = { a, b, sec, ...(opt || {}) };
      if (!T.nodes[a] || !T.nodes[b]) problems.push("Ребро " + a + "–" + b + ": невідомий вузол");
      edgeMap[ek(a, b)] = e;
      (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
      (sections[sec] = sections[sec] || { id: sec, edges: [], kind: "switch", len: 60, ...(T.sectionInfo[sec] || {}) }).edges.push(e);
    });
    const swByNode = {}, switches = {};
    T.switches.forEach((s) => {
      const e = edgeMap[ek(s.node, s.common)];
      if (!e) { problems.push("Стрілка " + s.id + ": немає кореневого ребра"); return; }
      switches[s.id] = { ...s, section: e.sec };
      swByNode[s.node] = switches[s.id];
    });
    const X = (n) => T.nodes[n][0];
    const signals = {}, sigAt = {};
    T.signals.forEach((s) => {
      const sg = { ...s };
      // the section "behind" the signal (where a movement waits in front of it)
      const sign = s.dir === "R" ? 1 : -1;
      const back = (adj[s.node] || []).filter((n) => (X(n) - X(s.node)) * sign < 0);
      sg.behind = back.map((n) => edgeMap[ek(n, s.node)].sec);
      if (sg.approachChain) sg.behind = [sg.approachChain[sg.approachChain.length - 1]];
      signals[s.id] = sg;
      (sigAt[s.node] = sigAt[s.node] || []).push(sg);
    });

    function buildRoute(r) {
      const R = { ...r, sections: [], switches: {}, problems: [], through: r.through || [] };
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
      R.minus = Object.values(R.switches).includes("-");
      R.ends = r.ends || [r.end];
      if (!signals[r.from]) R.problems.push("невідомий сигнал " + r.from);
      R.problems.forEach((p) => problems.push("Маршрут " + r.id + ": " + p));
      return R;
    }

    const routes = {};
    T.routes.forEach((r) => (routes[r.id] = buildRoute(r)));

    // Shunting routes: from every shunting and exit signal to each signal reachable ahead
    // (elementary routes and through routes with up to two intermediate signals), or to a dead end.
    const BOUNDARY = new Set(["approach", "exit"]);
    Object.values(signals).forEach((sg) => {
      if (sg.kind !== "shunt" && sg.kind !== "exit") return;
      const sign = sg.dir === "R" ? 1 : -1;
      const first = (adj[sg.node] || []).filter((n) => (X(n) - X(sg.node)) * sign > 0);
      if (!first.length) return;
      const found = {};
      const add = (end, path, through) => {
        if (!found[end] || found[end].path.length > path.length) found[end] = { end, path: path.slice(), through: through.slice() };
      };
      (function dfs(path, through, stops) {
        const cur = path[path.length - 1], prev = path[path.length - 2];
        const e = edgeMap[ek(prev, cur)];
        if (BOUNDARY.has(sections[e.sec].kind)) return;
        let thr = through;
        const here = (sigAt[cur] || []).filter((s) => s.id !== sg.id);
        if (here.length) {
          here.forEach((s) => add(s.id, path, through));
          if (stops >= 3) return;
          stops++;
          thr = through.concat(here.filter((s) => s.dir === sg.dir && s.kind !== "entry").map((s) => s.id));
        }
        const sw = swByNode[cur];
        let next = sw ? (prev === sw.common ? [sw.plus, sw.minus] : [sw.common]) : (adj[cur] || []).filter((n) => n !== prev);
        next = next.filter((n) => !path.includes(n));
        if (!next.length) { add(e.sec, path, thr); return; }   // dead end: the track itself is the end
        next.forEach((n) => dfs(path.concat(n), thr, stops));
      })([sg.node, first[0]], [], 0);
      Object.values(found).forEach((f) => {
        const id = sg.id + "⇢" + f.end;
        if (routes[id]) return;
        const R = buildRoute({ id, from: sg.id, to: f.end, type: "shunt", ends: [f.end], path: f.path, through: f.through, generated: true });
        if (!R.problems.length && R.sections.length) routes[id] = R;
      });
    });
    return { edgeMap, sections, switches, signals, routes, problems, adj, sigAt };
  }

  // ---------------------------------------------------------------- simulation
  function createSim(T, SCHED, P, opts) {
    const D = derive(T);
    const listeners = [];
    let S;
    const SWITCH_SEC = P.switchTransferSec || 4;
    const KIT_SEC = { free: P.cancelFreeSec || 6, shunt: P.cancelDelayShuntSec || 60, train: P.cancelDelaySec || 180 };
    const KIT_NAME = { free: "ВІЛЬН.", shunt: "МАНЕВР.", train: "ПОЇЗД." };

    function log(kind, text, extra) {
      const e = { day: S.day, t: S.time, kind, text, ...(extra || {}) };
      S.log.push(e);
      listeners.forEach((f) => f(e));
    }
    const routeDef = (rid) => D.routes[rid] || (S.pseudo && S.pseudo[rid]);

    const schedFor = (day) => (typeof SCHED === "function" ? SCHED(day) : SCHED);
    function buildEvents() {
      return schedFor(S.day).events.map((ev, i) => {
        const parity = P.directionParity[ev.direction] || null;
        let needsConfig = null;
        if (ev.action === "shunting_sequence") {
          if (!S.shuntingEnabled) needsConfig = "маневровий сценарій вимкнено в налаштуваннях";
        } else if (!parity) needsConfig = "напрямок «" + ev.direction + "» не зіставлено з планом";
        const rt = ev.recTrack || (parity && P.recommendedTrack && P.recommendedTrack[ev.type] ? P.recommendedTrack[ev.type][parity] : null);
        return { idx: i, ev, parity, needsConfig, recTrack: rt, time: parseHM(ev.time), delayMin: (S.delays[i] || 0),
          status: needsConfig ? "config" : "planned", trainId: null, passedAt: null };
      });
    }

    function reset(o) {
      o = o || {};
      S = {
        day: 1, time: o.startTime || 0, auto: o.auto !== undefined ? o.auto : false,
        endMode: o.endMode || "newday", paused: false,
        shuntingEnabled: o.shuntingEnabled !== undefined ? o.shuntingEnabled : P.shuntingEnabledByDefault,
        sw: {}, sec: {}, sig: {}, routes: {}, pseudo: {}, trains: [], log: [], delays: o.delays || {}, nextTrainId: 1,
        pendingTests: [], kits: { free: null, shunt: null, train: null }, counters: { inv: 0, aux: 0, art: 0 }, lastDir: null
      };
      Object.keys(D.switches).forEach((id) => (S.sw[id] = { pos: "+", lockedInd: false, blocked: false, moving: null, lost: false }));
      Object.keys(D.sections).forEach((id) => (S.sec[id] = { occ: null, lock: null, blocked: false, artUntil: null, falseOcc: false }));
      Object.keys(D.signals).forEach((id) => (S.sig[id] = { open: false, aspect: null, inv: null, blocked: false }));
      S.events = buildEvents();
      log("sys", "Початок модельної доби. Режим: " + (S.auto ? "автодиспетчер" : "ручне керування"));
      D.problems.forEach((p) => log("warn", "Топологія: " + p));
    }

    // ---------------------------------------------------------------- interlocking checks
    const secBusy = (st) => st.occ != null || st.falseOcc;
    function switchLockedBy(id) {
      const sw = D.switches[id], sec = S.sec[sw.section];
      if (S.sw[id].lockedInd) return "положення стрілки " + id + " заблоковано";
      if (sec.lock) return "стрілка " + id + " замкнена в маршруті " + sec.lock;
      if (sec.occ != null) return "стрілочна секція " + sw.section + " зайнята";
      if (sec.falseOcc) return "стрілочна секція " + sw.section + " показує зайнятість — потрібне допоміжне переведення";
      return null;
    }

    function checkRoute(rid) {
      const R = D.routes[rid];
      if (!R) return "Невідомий маршрут " + rid;
      if (R.problems.length) return "Маршрут " + rid + " потребує уточнення: " + R.problems.join("; ");
      if (S.routes[rid]) return "Маршрут " + rid + " вже задано";
      if (S.sig[R.from].blocked) return "Світлофор " + R.from + " заблоковано";
      if (Object.values(S.routes).some((r) => r.state === "setting")) return "Йде встановлення іншого маршруту — зачекайте кілька секунд";
      for (const s of R.sections) {
        const st = S.sec[s];
        if (st.occ != null) return "Секція " + s + " зайнята (" + trainLabel(st.occ) + ")";
        if (st.falseOcc) return "Секція " + s + " показує зайнятість (несправність)";
        if (st.lock) return "Секція " + s + " замкнена у ворожому маршруті " + st.lock;
        if (st.blocked) return "Секція " + s + " заблокована ДСП";
      }
      for (const [id, pos] of Object.entries(R.switches)) {
        const sw = S.sw[id];
        if (pos === "?") return "Положення стрілки " + id + " не визначене";
        if (sw.lost) return "Немає контролю положення стрілки " + id;
        if (sw.blocked) return "Стрілку " + id + " заблоковано ДСП";
        if (sw.moving) return "Стрілка " + id + " переводиться";
        if (sw.pos !== pos) { const l = switchLockedBy(id); if (l) return "Не можна перевести: " + l; }
      }
      return null;
    }

    function routeFromSignal(sig, states) {
      return Object.keys(S.routes).find((rid) => routeDef(rid).from === sig && (!states || states.includes(S.routes[rid].state)));
    }

    // Route setting: switches transfer (≈4 s), sections lock, then the start signal opens.
    function setRoute(rid, by, mode, autoOpen) {
      const err = checkRoute(rid);
      if (err) { log("error", "Маршрут " + rid + ": відмова — " + err); return { ok: false, err }; }
      const R = D.routes[rid];
      mode = R.type === "shunt" ? "shunt" : mode === "shunt" ? "shunt" : "train";
      let moves = 0;
      for (const [id, pos] of Object.entries(R.switches)) {
        if (S.sw[id].pos !== pos) { S.sw[id].moving = { to: pos, until: S.time + SWITCH_SEC }; moves++; }
      }
      R.sections.forEach((s) => (S.sec[s].lock = rid));
      S.routes[rid] = { state: "setting", until: S.time + (moves ? SWITCH_SEC + 1 : 1), by: by || "ДСП", mode, autoOpen: autoOpen !== false };
      S.lastDir = { dir: D.signals[R.from].dir, mode };
      log(by === "авто" ? "auto" : "cmd", (mode === "shunt" ? "Маневровий" : "Поїзний") + " маршрут " + rid + ": набір" + (moves ? ", переведення " + moves + " стр." : "") + " (" + (by || "ДСП") + ")");
      return { ok: true };
    }

    function openSignal(sig, by) {
      if (S.sig[sig].blocked) { log("error", "Відкриття " + sig + ": світлофор заблоковано"); return { ok: false, err: "світлофор заблоковано" }; }
      const rid = routeFromSignal(sig, ["set"]);
      if (!rid) {
        const st = routeFromSignal(sig, ["setting"]) ? "маршрут ще встановлюється" : routeFromSignal(sig, ["open"]) ? "сигнал уже відкрито" : "маршрут від " + sig + " не задано і не замкнено";
        log("error", "Відкриття " + sig + ": відмова — " + st);
        return { ok: false, err: st };
      }
      const R = D.routes[rid];
      for (const [id, pos] of Object.entries(R.switches))
        if (S.sw[id].pos !== pos || S.sw[id].lost) { const err = "немає контролю стрілки " + id + " у положенні маршруту"; log("error", "Відкриття " + sig + ": відмова — " + err); return { ok: false, err }; }
      for (const s of R.sections)
        if (secBusy(S.sec[s])) { const err = "секція " + s + " зайнята"; log("error", "Відкриття " + sig + ": відмова — " + err); return { ok: false, err }; }
      const mode = S.routes[rid].mode;
      S.routes[rid].state = "open";
      S.sig[sig].open = true; S.sig[sig].aspect = mode === "shunt" ? "white" : "green";
      (R.through || []).forEach((t) => { if (!S.sig[t].blocked) { S.sig[t].open = true; S.sig[t].aspect = "white"; } });
      log(by === "авто" ? "auto" : "cmd", "Світлофор " + sig + " відкрито" + (R.through && R.through.length ? " (попутні " + R.through.join(", ") + ")" : "") + " · " + rid);
      return { ok: true };
    }

    function closeSignalsOf(rid) {
      const R = routeDef(rid);
      [R.from].concat(R.through || []).forEach((s) => { if (S.sig[s]) { S.sig[s].open = false; S.sig[s].aspect = null; } });
    }

    function closeSignal(sig) {
      if (!S.sig[sig] || !S.sig[sig].open) { log("error", "Закриття " + sig + ": сигнал не відкритий"); return { ok: false, err: "сигнал не відкритий" }; }
      const rid = routeFromSignal(sig, ["open"]);
      if (rid) { closeSignalsOf(rid); S.routes[rid].state = "set"; } else { S.sig[sig].open = false; S.sig[sig].aspect = null; }
      log("cmd", "Світлофор " + sig + " закрито ДСП (маршрут лишається замкнутим)");
      return { ok: true };
    }

    function dropRoute(rid, why) {
      const R = routeDef(rid);
      R.sections.forEach((s) => { if (S.sec[s].lock === rid) S.sec[s].lock = null; });
      closeSignalsOf(rid);
      delete S.routes[rid]; delete S.pseudo[rid];
      log("auto", "Маршрут " + rid + " розімкнено" + (why ? " (" + why + ")" : ""));
    }

    function approachOccupied(sig) {
      const sg = D.signals[sig];
      if (sg.approachChain) return sg.approachChain.some((s) => secBusy(S.sec[s]));
      if (sg.behind.some((s) => S.sec[s].occ != null)) return true;
      return S.trains.some((tr) => !tr.done && tr.nextSignal === sig);
    }

    // Three cancellation sets: free approach 6 s, shunting 60 s, train 180 s. One route per set.
    function cancelRoute(rid) {
      const st = S.routes[rid];
      if (!st) { log("error", "Відміна " + rid + ": маршрут не задано"); return { ok: false, err: "маршрут не задано" }; }
      if (st.state === "used") { log("error", "Відміна " + rid + ": рухомий склад уже в маршруті — розмикання посекційне або штучне"); return { ok: false, err: "рухомий склад у маршруті" }; }
      if (st.state === "cancelling") return { ok: false, err: "маршрут уже розмикається" };
      const R = D.routes[rid];
      const kit = approachOccupied(R.from) && (st.state === "open" || st.state === "set") ? st.mode : "free";
      if (S.kits[kit]) { const err = "комплект відміни «" + KIT_NAME[kit] + "» зайнятий маршрутом " + S.kits[kit]; log("error", "Відміна " + rid + ": " + err); return { ok: false, err }; }
      closeSignalsOf(rid);
      S.kits[kit] = rid;
      st.state = "cancelling"; st.kit = kit; st.until = S.time + KIT_SEC[kit];
      log("cmd", "Відміна маршруту " + rid + ": комплект «" + KIT_NAME[kit] + "», витримка " + KIT_SEC[kit] + " с");
      return { ok: true };
    }

    function moveSwitch(id, pos, aux) {
      const cur = S.sw[id];
      if (!pos) pos = cur.pos === "+" ? "-" : "+";
      if (cur.pos === pos && !cur.moving) return { ok: false, err: "стрілка вже в цьому положенні" };
      if (cur.blocked) { log("error", "Переведення " + id + ": стрілку заблоковано"); return { ok: false, err: "стрілку заблоковано" }; }
      if (cur.moving) return { ok: false, err: "стрілка вже переводиться" };
      const sec = S.sec[D.switches[id].section];
      if (aux) {
        if (cur.lockedInd || sec.lock) { const err = "стрілка замкнена"; log("error", "Допоміжне переведення " + id + ": " + err); return { ok: false, err }; }
        if (sec.occ != null) { const err = "на секції фактично стоїть рухомий склад"; log("error", "Допоміжне переведення " + id + ": " + err); return { ok: false, err }; }
        S.counters.aux++;
      } else {
        const l = switchLockedBy(id);
        if (l) { log("error", "Переведення " + id + ": відмова — " + l); return { ok: false, err: l }; }
      }
      cur.moving = { to: pos, until: S.time + SWITCH_SEC };
      log("cmd", (aux ? "Допоміжне переведення" : "Переведення") + " стрілки " + id + " в " + (pos === "+" ? "плюс" : "мінус"));
      return { ok: true };
    }
    function toggleSwitchLock(id) { const s = S.sw[id]; s.lockedInd = !s.lockedInd; log("cmd", "Положення стрілки " + id + (s.lockedInd ? " заблоковано (замок)" : " розблоковано")); return { ok: true }; }
    function toggleSwitchBlock(id) { const s = S.sw[id]; s.blocked = !s.blocked; log("cmd", "Стрілку " + id + (s.blocked ? " заблоковано" : " розблоковано")); return { ok: true }; }
    function toggleSectionBlock(id) { const s = S.sec[id]; s.blocked = !s.blocked; log("cmd", "Ділянку " + id + (s.blocked ? " заблоковано" : " розблоковано")); return { ok: true }; }
    function toggleSignalBlock(id) {
      const s = S.sig[id];
      if (!s.blocked && s.open) { const err = "спершу закрийте світлофор"; log("error", "Блокування " + id + ": " + err); return { ok: false, err }; }
      s.blocked = !s.blocked; log("cmd", "Світлофор " + id + (s.blocked ? " заблоковано" : " розблоковано")); return { ok: true };
    }
    function artRelease(id) {
      const s = S.sec[id];
      if (!s.lock) { log("error", "ШР " + id + ": секція не замкнена"); return { ok: false, err: "секція не замкнена" }; }
      if (s.occ != null) { log("error", "ШР " + id + ": на секції рухомий склад"); return { ok: false, err: "на секції рухомий склад" }; }
      if (s.artUntil != null) return { ok: false, err: "розмикання вже йде" };
      S.counters.art++;
      s.artUntil = S.time + P.artReleaseSec; log("cmd", "Штучне розмикання " + id + ", витримка " + P.artReleaseSec + " с");
      return { ok: true };
    }

    // Invitation signal (запрошувальний): held for up to 90 s; a train may pass the red signal
    // at ≤ 20 km/h along the route the switches currently form. Responsible command with counter.
    function inviteSignal(sig) {
      const sg = D.signals[sig];
      if (sg.kind !== "entry" && sg.kind !== "exit") return { ok: false, err: "запрошувальний сигнал є лише на вхідних і вихідних" };
      if (S.sig[sig].open) return { ok: false, err: "світлофор відкритий" };
      if (S.sig[sig].blocked) return { ok: false, err: "світлофор заблоковано" };
      S.sig[sig].inv = S.time + (P.invitationSec || 90);
      S.counters.inv++;
      log("cmd", "Запрошувальний сигнал на " + sig + " увімкнено (лічильник: " + S.counters.inv + ")");
      return { ok: true };
    }
    function invitedRoute(sig, tr) {
      const cands = Object.values(D.routes).filter((r) => r.from === sig && r.type === "train");
      const ordered = tr && tr.pref ? tr.pref.map((p) => cands.find((r) => r.to === p)).filter(Boolean).concat(cands) : cands;
      return ordered.find((r) =>
        Object.entries(r.switches).every(([id, pos]) => S.sw[id].pos === pos && !S.sw[id].lost && !S.sw[id].moving) &&
        r.sections.every((s) => S.sec[s].occ == null && !S.sec[s].lock));
    }

    // Faults for training: false occupancy of a section, loss of switch control
    function setFault(kind, id, on) {
      if (kind === "sec") {
        S.sec[id].falseOcc = on;
        log(on ? "warn" : "cmd", on ? "НЕСПРАВНІСТЬ: секція " + id + " показує зайнятість без поїзда" : "Несправність секції " + id + " усунено");
      } else {
        S.sw[id].lost = on;
        log(on ? "warn" : "cmd", on ? "НЕСПРАВНІСТЬ: втрата контролю стрілки " + id + " (РОЗРІЗ СТР.)" : "Контроль стрілки " + id + " відновлено");
      }
      if (on) {
        Object.entries(S.routes).forEach(([rid, st]) => {
          const R = routeDef(rid);
          const hit = kind === "sec" ? R.sections.includes(id) : R.switches && R.switches[id];
          if (hit && st.state === "open") { closeSignalsOf(rid); st.state = "set"; log("warn", "Світлофор " + R.from + " перекрито через несправність"); }
        });
      }
      return { ok: true };
    }

    // ---------------------------------------------------------------- trains
    function trainLabel(id) { const t = S.trains.find((x) => x.id === id); return t ? (t.type === "shunting" ? "маневровий " : "поїзд ") + t.num : "рухомий склад"; }
    const typeName = (t) => ({ passenger: "пасажирський", freight: "вантажний", shunting: "маневровий", test: "тестовий", electric: "електропоїзд", intercity: "Інтерсіті" }[t] || t);

    function secDur(i, tr) {
      const sec = D.sections[tr.seq[i]];
      let v = P.speedKmh[tr.type] || 50;
      if (tr.lim[i]) v = Math.min(v, tr.lim[i]);
      return Math.max(P.minSectionSec, Math.round(sec.len / (v / 3.6)));
    }
    function blocksFor(type, num) {
      const r = (P.trainBlocks && P.trainBlocks[type]) || [2, 3];
      let h = 0; for (const c of String(num)) h = (h * 31 + c.charCodeAt(0)) % 9973;
      return r[0] + (h % (r[1] - r[0] + 1));
    }
    function spawnTrain(o) {
      const chain = Array.isArray(o.start) ? o.start : [o.start];
      const tr = {
        id: S.nextTrainId++, num: o.num, type: o.type, parity: o.parity, eventIdx: o.eventIdx,
        pref: o.pref, stopSec: o.stopSec || 0, seq: chain.slice(), lim: chain.map(() => 0), idx: 0, tIn: 0,
        occ: [chain[0]], len: o.len || blocksFor(o.type, o.num), nextSignal: null, wait: null, waitSec: 0, done: false,
        status: o.type === "shunting" ? "стоїть" : "на підході", shunt: o.shunt || null, loco: !!o.loco, appearedAt: S.time,
        marks: { appear: S.time }
      };
      S.sec[chain[0]].occ = tr.id;
      S.trains.push(tr);
      updateNextSignal(tr);
      log("train", (tr.type === "shunting" ? "Маневровий склад " : "Поїзд ") + tr.num + " (" + typeName(tr.type) + ", " + tr.len + " бл.) " + (tr.loco ? "поставлено на " : "з'явився на ") + chain[0], { approach: !tr.loco && tr.type !== "shunting" });
      return tr;
    }
    function spawnLoco(sec) {
      const st = S.sec[sec];
      if (!st || st.occ != null) return { ok: false, err: "ділянка зайнята" };
      const n = "Л-" + (S.trains.filter((t) => t.loco).length + 1);
      spawnTrain({ num: n, type: "shunting", parity: null, start: sec, loco: true, len: 1 });
      return { ok: true };
    }
    function removeLoco(id) {
      const tr = S.trains.find((t) => t.id === id && t.loco && !t.done);
      if (!tr) return { ok: false, err: "немає локомотива" };
      if (tr.idx < tr.seq.length - 1) return { ok: false, err: "локомотив рухається" };
      tr.occ.forEach(releaseSection); tr.occ = []; tr.done = true; tr.doneAt = S.time;
      log("cmd", "Маневровий локомотив " + tr.num + " прибрано зі схеми");
      return { ok: true };
    }

    function headSec(tr) { return tr.seq[tr.idx]; }
    function updateNextSignal(tr) {
      const h = headSec(tr), info = D.sections[h];
      tr.nextSignal = null;
      if (tr.idx < tr.seq.length - 1) return;
      if (tr.loco) return; // a free locomotive follows whichever shunting route is opened in front of it
      if (tr.shunt) { tr.nextSignal = (tr.shunt.plan[tr.shunt.step] || {}).sig || null; return; }
      if (info.kind === "exit") return;
      if (info.kind === "approach") tr.nextSignal = T.entrySignal[tr.parity];
      else tr.nextSignal = (T.exitSignals[tr.parity] || {})[h] || null;
    }
    // signals whose behind-section (or lead track) is where the movement stands
    function signalsFacing(sec) {
      return Object.values(D.signals).filter((sg) => sg.behind.includes(sec) || (sg.lead && sg.lead[sec]));
    }

    // the signal the movement will meet at the end of what it has been given so far
    function upcomingSignal(tr) {
      if (tr.loco) return null;
      if (tr.shunt) return (tr.shunt.plan[tr.shunt.step] || {}).sig || null;
      const last = tr.seq[tr.seq.length - 1], info = D.sections[last];
      if (info.kind === "exit") return null;
      if (info.kind === "approach") return T.entrySignal[tr.parity];
      return (T.exitSignals[tr.parity] || {})[last] || null;
    }
    // the automatic dispatcher prepares a route one block in advance, as a DSP does
    function autoDispatch(tr) {
      const sig = upcomingSignal(tr); if (!sig) return;
      const lastSec = tr.seq[tr.seq.length - 1];
      if (routeFromSignal(sig, ["open", "setting"])) return;
      if (routeFromSignal(sig, ["set"])) { openSignal(sig, "авто"); return; }
      let cands;
      if (tr.shunt) {
        const goal = tr.shunt.plan[tr.shunt.step] || {};
        cands = Object.values(D.routes).filter((r) => r.from === sig && r.type === "shunt" && r.ends.includes(goal.end));
        const sg = D.signals[sig], lead = sg.lead && sg.lead[lastSec];
        if (lead) {
          const want = lastSec === "14П" ? "+" : "-";
          if (S.sw["19"].pos !== want && !S.sw["19"].moving) moveSwitch("19", want);
          if (S.sw["19"].moving || S.sw["19"].pos !== want) return;
        }
      } else {
        cands = Object.values(D.routes).filter((r) => r.from === sig && r.type === "train");
        if (tr.pref && D.sections[lastSec].kind === "approach") cands = tr.pref.map((p) => cands.find((r) => r.to === p)).filter(Boolean);
      }
      let firstErr = null;
      for (const r of cands) {
        const err = checkRoute(r.id);
        if (!err) { setRoute(r.id, "авто", r.type === "shunt" ? "shunt" : "train", true); tr.lastReason = null; return; }
        firstErr = firstErr || err;
      }
      const reason = cands.length ? firstErr : "немає маршруту від " + sig;
      if (tr.lastReason !== reason && !/встановлення іншого маршруту/.test(reason)) { tr.lastReason = reason; log("delay", trainLabel(tr.id) + " чекає біля " + sig + ": " + reason); }
    }

    function releaseSection(secId) {
      const st = S.sec[secId];
      st.occ = null;
      if (st.lock) {
        const rid = st.lock; st.lock = null;
        const R = routeDef(rid);
        if (S.routes[rid] && R && !R.sections.some((s) => S.sec[s].lock === rid)) {
          delete S.routes[rid]; delete S.pseudo[rid]; log("auto", "Маршрут " + rid + " розімкнено після проходу");
        }
      }
    }

    function enterRoute(tr, rid, sig, lead) {
      const R = routeDef(rid);
      const add = (lead ? [lead] : []).concat(R.sections);
      const limit = R.invite ? 20 : R.minus && tr.type !== "shunting" ? (P.divergingKmh || 50) : 0;
      add.forEach(() => tr.lim.push(limit));
      tr.seq.push(...add);
      S.routes[rid].state = "used";
      closeSignalsOf(rid);
      if (S.sig[sig].inv) S.sig[sig].inv = null;
      if (tr.shunt) tr.shunt.step++;
      if (D.signals[sig].kind === "exit" && tr.type !== "shunting") { tr.passedAt = S.time; tr.marks.depart = S.time; }
      if (D.signals[sig].kind === "entry" && tr.type !== "shunting") tr.marks.arrive = S.time;
      tr.wait = null; tr.status = "рух";
      log("train", trainLabel(tr.id) + " проходить " + sig + (R.invite ? " за запрошувальним сигналом (≤20 км/год)" : " · " + rid));
    }

    function stepTrain(tr) {
      if (tr.done) return;
      tr.tIn++;
      if (S.auto && !tr.loco && tr.idx >= tr.seq.length - 2 && !(tr.shunt && (tr.shunt.plan[tr.shunt.step] || {}).wait)) {
        // a train with a stop gets its departure route only near the end of the stop
        const lastKind = D.sections[tr.seq[tr.seq.length - 1]].kind;
        const dwelling = lastKind === "track" && tr.stopSec && !tr.shunt &&
          (tr.idx < tr.seq.length - 1 || tr.tIn < secDur(tr.idx, tr) + tr.stopSec - 20);
        if (!dwelling) autoDispatch(tr);
      }
      const h = headSec(tr), info = D.sections[h];
      let need = secDur(tr.idx, tr);
      const atEnd = tr.idx === tr.seq.length - 1;
      const atTrackEnd = atEnd && info.kind === "track";
      if (atTrackEnd && tr.stopSec && !tr.loco && !tr.shunt) need += tr.stopSec;
      const waitStep = tr.shunt && atEnd && (tr.shunt.plan[tr.shunt.step] || {}).wait;
      if (waitStep) need += waitStep;
      if (tr.tIn < need) return;
      if (waitStep) { tr.shunt.step++; updateNextSignal(tr); }
      if (atEnd) {
        if (info.kind === "exit" || (tr.shunt && tr.shunt.step >= tr.shunt.plan.length)) {
          tr.occ.forEach(releaseSection); tr.occ = [];
          tr.done = true; tr.doneAt = S.time; tr.marks.gone = S.time; tr.status = tr.shunt ? "маневри завершено" : "проследував";
          finishEvent(tr);
          log("train", tr.shunt ? "Маневровий склад " + tr.num + " завершив маневри на " + h : "Поїзд " + tr.num + " віддалився з " + h);
          return;
        }
        let sig = tr.nextSignal, rid = sig && routeFromSignal(sig, ["open"]), lead = null;
        if (tr.loco || tr.shunt) {
          rid = null;
          const facing = signalsFacing(h).filter((sg) => !tr.shunt || sg.id === tr.nextSignal);
          for (const sg of facing) {
            const r = Object.keys(S.routes).find((k) => routeDef(k).from === sg.id && S.routes[k].state === "open" && S.routes[k].mode === "shunt");
            if (r) { sig = sg.id; rid = r; lead = sg.lead ? sg.lead[h] : null; break; }
          }
          if (lead) {
            const want = h === "14П" ? "+" : "-";
            if (S.sw["19"].pos !== want || S.sw["19"].moving || S.sw["19"].lost || secBusy(S.sec["19СП"])) {
              const w = "стрілка 19 не в бік колії " + h.replace("П", "");
              if (tr.wait !== w) { tr.wait = w; tr.status = "стоїть: " + w; }
              tr.waitSec++; return;
            }
          }
        }
        if (!rid && sig && S.sig[sig] && S.sig[sig].inv && S.sig[sig].inv >= S.time) {
          const r = invitedRoute(sig, tr);
          if (r) {
            const pid = "ЗС·" + sig;
            S.pseudo[pid] = { from: sig, sections: r.sections.slice(), switches: r.switches, invite: true, to: r.to };
            r.sections.forEach((s) => (S.sec[s].lock = pid));
            S.routes[pid] = { state: "open", mode: "train", by: "ДСП" };
            rid = pid;
          }
        }
        if (!rid) {
          const reason = sig ? (S.sig[sig].inv ? "запрошувальний горить, але стрілки не утворюють маршруту" : "чекає відкриття " + sig) : tr.loco ? "чекає маневрового маршруту" : "немає вихідного сигналу з " + h;
          if (tr.wait !== reason) { tr.wait = reason; tr.status = "стоїть: " + reason; }
          tr.waitSec++;
          return;
        }
        enterRoute(tr, rid, sig, lead);
      }
      const next = tr.seq[tr.idx + 1];
      const ns = S.sec[next];
      if ((ns.occ != null && ns.occ !== tr.id) || (ns.falseOcc && tr.lim[tr.idx + 1] !== 20)) {
        if (!tr.wait) { tr.wait = "секція " + next + " зайнята"; log("warn", trainLabel(tr.id) + ": " + tr.wait); }
        tr.waitSec++; return;
      }
      tr.wait = null;
      tr.idx++; tr.tIn = 0;
      ns.occ = tr.id;
      tr.occ.push(next);
      const ni = D.sections[next];
      while (tr.occ.length > tr.len) releaseSection(tr.occ.shift());
      if (ni.kind === "track" && tr.idx === tr.seq.length - 1) {
        tr.occ = tr.occ.filter((s) => { if (D.sections[s].group === ni.group) return true; releaseSection(s); return false; });
        if (!tr.checkedTrack && tr.type !== "shunting") {
          tr.checkedTrack = true;
          const plat = (P.platformTracks || []).includes(ni.group), main = (P.mainTracks || []).includes(ni.group);
          if ((tr.type === "electric" || ((tr.type === "passenger" || tr.type === "intercity") && tr.stopSec)) && !plat)
            log("warn", "Правило: " + typeName(tr.type) + " " + tr.num + " із зупинкою прийнято на колію без платформи (" + ni.group + ")");
          else if ((tr.type === "passenger" || tr.type === "intercity") && !main)
            log("warn", "Правило: " + typeName(tr.type) + " " + tr.num + " прийнято на бічну колію " + ni.group + " (≤50 км/год по стрілці)");
        }
      }
      tr.status = ni.kind === "exit" ? "відправлено" : ni.kind === "track" ? "на колії " + (ni.group || next).replace("П", "") : "рух по " + next;
      updateNextSignal(tr);
    }

    function finishEvent(tr) {
      if (tr.eventIdx == null) return;
      const ev = S.events[tr.eventIdx]; if (!ev) return;
      ev.status = "passed"; ev.passedAt = S.time;
      ev.lateMin = tr.type === "shunting" ? 0 : Math.round(((tr.passedAt || S.time) - ev.time - (ev.ev.stopMin || 0) * 60) / 60);
    }

    function spawnScheduled() {
      for (const ev of S.events) {
        if (ev.test) continue;
        if (ev.status !== "planned" && ev.status !== "waiting") continue;
        const lead = typeof P.appearLeadMin === "object" ? (P.appearLeadMin[ev.ev.type] ?? 3) : P.appearLeadMin;
        const appear = ev.time + ev.delayMin * 60 - lead * 60;
        if (S.time < appear) continue;
        if (ev.ev.action === "shunting_sequence") {
          const job = (P.shuntingJobs && P.shuntingJobs[ev.ev.job]) || P.shuntingPlan;
          const st = S.sec[job.start];
          if (secBusy(st) || st.lock) { if (ev.status !== "waiting") { ev.status = "waiting"; log("delay", "Маневри " + ev.ev.train + " відкладено: ділянка " + job.start + " зайнята"); } continue; }
          const tr = spawnTrain({ num: ev.ev.train, type: "shunting", parity: null, start: job.start, eventIdx: ev.idx, len: 1, shunt: { plan: job.plan, step: 0, job: ev.ev.job } });
          ev.status = "active"; ev.trainId = tr.id; ev.marks = tr.marks; continue;
        }
        const start = D.signals[T.entrySignal[ev.parity]].approachChain;
        if (secBusy(S.sec[start[0]])) {
          if (ev.status !== "waiting") { ev.status = "waiting"; log("delay", "Поїзд " + ev.ev.train + " затримано на перегоні: блок " + start[0] + " зайнятий"); }
          continue;
        }
        const pref = [ev.recTrack, ...P.trackPreference[ev.parity]].filter((v, k, a) => v && a.indexOf(v) === k);
        const tr = spawnTrain({ num: ev.ev.train, type: ev.ev.type, parity: ev.parity, start, eventIdx: ev.idx, pref, stopSec: (ev.ev.stopMin || 0) * 60 });
        ev.status = "active"; ev.trainId = tr.id; ev.marks = tr.marks;
      }
      for (const pt of S.pendingTests) {
        if (pt.spawned || S.time < pt.at) continue;
        const start = D.signals[T.entrySignal[pt.parity]].approachChain;
        if (secBusy(S.sec[start[0]])) continue;
        pt.spawned = true;
        const ev = S.events.find((e) => e.test === pt);
        const tr = spawnTrain({ num: pt.num, type: "test", parity: pt.parity, start, pref: pt.pref, stopSec: pt.stopSec, eventIdx: ev ? ev.idx : undefined });
        if (ev) { ev.status = "active"; ev.trainId = tr.id; ev.marks = tr.marks; }
      }
    }

    function stepTimers() {
      for (const sw of Object.values(S.sw)) if (sw.moving && S.time >= sw.moving.until) { sw.pos = sw.moving.to; sw.moving = null; }
      for (const [rid, st] of Object.entries(S.routes)) {
        if (st.state === "setting" && S.time >= st.until) {
          const R = D.routes[rid];
          const ok = Object.entries(R.switches).every(([id, pos]) => S.sw[id].pos === pos && !S.sw[id].lost);
          if (!ok) { log("error", "Маршрут " + rid + ": немає контролю стрілок — маршрут не замкнено"); dropRoute(rid, "відмова набору"); continue; }
          st.state = "set";
          log("auto", "Маршрут " + rid + " замкнено");
          if (st.autoOpen) openSignal(R.from, st.by === "авто" ? "авто" : null);
        }
        if (st.state === "cancelling" && S.time >= st.until) { S.kits[st.kit] = null; dropRoute(rid, "відміна, витримку завершено"); }
      }
      for (const sg of Object.values(S.sig)) if (sg.inv && S.time > sg.inv) sg.inv = null;
      for (const [id, st] of Object.entries(S.sec)) if (st.artUntil != null && S.time >= st.artUntil) {
        st.artUntil = null;
        if (st.occ != null) { log("error", "ШР " + id + ": скасовано — на секції рухомий склад"); continue; }
        const rid = st.lock; st.lock = null; log("auto", "Штучне розмикання " + id + " виконано");
        const R = rid && routeDef(rid);
        if (R && S.routes[rid] && !R.sections.some((s) => S.sec[s].lock === rid)) {
          if (S.routes[rid].kit) S.kits[S.routes[rid].kit] = null;
          closeSignalsOf(rid); delete S.routes[rid]; delete S.pseudo[rid]; log("auto", "Маршрут " + rid + " розімкнено повністю");
        }
      }
    }

    function step() {
      if (S.paused) return;
      S.time++;
      if (S.time >= DAY) {
        if (S.endMode === "stop") { S.time = DAY - 1; S.paused = true; log("sys", "Кінець модельної доби 23:59:59 — симуляцію зупинено"); return; }
        S.time = 0; S.day++;
        S.events = buildEvents();
        log("sys", "Почалася доба " + S.day);
      }
      stepTimers();
      spawnScheduled();
      for (const tr of S.trains) stepTrain(tr);
      if (S.trains.length > 40) S.trains = S.trains.filter((t) => !t.done || S.time - (t.doneAt || 0) < 3600).slice(-40);
    }
    function run(seconds) { for (let i = 0; i < seconds && !S.paused; i++) step(); }

    function setDelay(idx, min) {
      S.delays[idx] = min;
      const ev = S.events[idx];
      if (ev && (ev.status === "planned" || ev.status === "waiting")) ev.delayMin = min;
      log("delay", "ДСП: затримка поїзда " + (ev ? ev.ev.train : idx) + " = " + min + " хв");
    }
    function addTestTrain(o) {
      const pt = { num: o.num || "Т-" + (S.pendingTests.length + 1), parity: o.parity, pref: o.track ? [o.track] : P.trackPreference[o.parity], stopSec: (o.stopMin || 0) * 60, at: S.time + (o.inMin || 0) * 60, spawned: false };
      S.pendingTests.push(pt);
      // a test train is entered into the day's timetable like any other train
      const idx = S.events.length;
      S.events.push({ idx, test: pt, ev: { time: fmt(pt.at + 240).slice(0, 5), train: pt.num, type: "test", direction: o.parity === "odd" ? "Dzhankoi" : "Melitopol",
        action: "pass_station", timeStatus: "manual", stopMin: o.stopMin || 0 }, parity: o.parity, needsConfig: null, recTrack: pt.pref[0],
        time: pt.at + 240, delayMin: 0, status: "planned", trainId: null, passedAt: null });
      log("cmd", "Створено тестовий поїзд " + pt.num + " (" + (o.parity === "odd" ? "непарний" : "парний") + ", колія " + (o.track || "авто") + ") на " + fmt(pt.at));
      return pt;
    }
    function lateMin(ev) {
      if (ev.ev.type === "shunting") return 0;
      if (ev.status === "passed") return ev.lateMin || 0;
      if (ev.status === "config") return 0;
      const late = Math.floor((S.time - ev.time - (ev.ev.stopMin || 0) * 60) / 60);
      return late > 0 ? late : 0;
    }
    function nextEvent() {
      return S.events.filter((e) => e.status !== "passed" && e.status !== "config")
        .map((e) => ({ e, at: e.time + e.delayMin * 60 })).sort((a, b) => a.at - b.at)[0] || null;
    }
    function isIdle() {
      return S.trains.every((t) => t.done || (t.loco && t.idx === t.seq.length - 1)) && !Object.values(S.routes).some((r) => r.state === "cancelling" || r.state === "setting")
        && !Object.values(S.sec).some((s) => s.artUntil != null) && S.pendingTests.every((p) => p.spawned);
    }
    function routesFrom(sig, mode) {
      return Object.values(D.routes).filter((r) => r.from === sig && (mode === "shunt" ? r.type === "shunt" : r.type === "train"));
    }
    function setSchedule(src, o) { SCHED = src; reset(o); }

    reset(opts);
    return {
      setSchedule, D, get S() { return S; }, reset, step, run, setRoute, openSignal, closeSignal, cancelRoute, moveSwitch,
      toggleSwitchLock, toggleSwitchBlock, toggleSectionBlock, toggleSignalBlock, artRelease, inviteSignal, setFault,
      spawnLoco, removeLoco, setDelay, addTestTrain, checkRoute, routesFrom, routeDef,
      nextEvent, isIdle, lateMin, blocksFor, fmt, on: (f) => listeners.push(f), routeFromSignal, buildEvents: () => (S.events = buildEvents()),
      log: (k, t) => log(k, t), KIT_NAME
    };
  }

  root.SimEngine = { createSim, derive, fmt, DAY };
  if (typeof module !== "undefined") module.exports = root.SimEngine;
})(typeof window !== "undefined" ? window : globalThis);

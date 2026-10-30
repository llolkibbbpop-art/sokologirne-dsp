/* UI layer: АРМ ДСП screen. Renders the station diagram and panels; commands go to the engine.
 * Interaction follows the handbook (pp. 159–165): click a signal → context menu → choose
 * "train" or "shunting" route → click the end signal (a line follows the cursor) → the
 * switches transfer, sections lock and the signal opens. */
(function () {
  "use strict";
  const E = window.SimEngine;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  // state that outlives one station screen (line mode switches stations without reloading)
  const KEEP = { running: true, speed: 1, autoCode: true, sound: true, radio: {} };
  // a model day (24 h) takes 35 minutes of real time at ×1
  const DAY_RATE = 86400 / (35 * 60);
  // timetable source: seeded generator (default) or the fixed JSON from the task
  const src = { kind: "gen", seed: 2014, level: "medium" };

  // one station screen; returns a function that removes it again
  function mount(ctx) {
  const T = ctx.T, P = ctx.P, W = ctx.world || null;
  const V = T.view || {};
  const scheduleSource = () => (src.kind === "gen" ? (day) => ctx.generate(src.seed, src.level, day) : ctx.SCHEDULE);
  let sim = W ? W.sims[ctx.st] : E.createSim(T, scheduleSource(), P, { auto: false });
  if (ctx.wrap) sim = ctx.wrap(sim);
  const D = sim.D;
  const RO = !!ctx.readonly, REMOTE = !!(W && W.remote);
  // network play: the clock and the timetable belong to the host
  const hostOnly = () => { if (!REMOTE) return false; toast("Часом і графіком керує ведучий гри.", "err"); return true; };
  const ui = { running: KEEP.running, speed: KEEP.speed, sel: null, pick: null, selTrain: null, selEvent: null, logFilter: "all", logCount: 0, autoCode: KEEP.autoCode, sound: KEEP.sound };
  const offs = [];
  let alive = true;
  let seed = 20141028;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); // UI only (vigilance codes)

  // Signal lamp colours (handbook table 2.14). Set via style, not presentation attributes.
  const LAMP = { red: "#ff2b2b", green: "#2fe05a", white: "#ffffff", blue: "#2f6bff" };

  // ui.vs stretches the plan vertically ("Лише пульт"): track spacing grows, symbols keep their size
  const BOX = V.box || [-165, 48, 2895, 316], VY0 = BOX[1], VH = BOX[3];
  const sy = (y) => VY0 + (y - VY0) * (ui.vs || 1);
  const pt = (n) => { const p = (T.displayNodes && T.displayNodes[n]) || T.nodes[n]; return [p[0], sy(p[1])]; };
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const trackName = (g) => (g ? "колія " + g.replace("П", "") : "");
  const endBtn = (e) => (T.endButtons || []).find((b) => b.id === e);
  const endName = (e) => (D.signals[e] ? "світлофор " + e : endBtn(e) ? "кнопка " + endBtn(e).label : D.sections[e] ? (D.sections[e].group ? trackName(D.sections[e].group) : e) : trackName(e));
  // geometry of a signal symbol (shared by drawing, pick highlighting and the route line)
  function sigGeom(s) {
    const [x0, y] = pt(s.node), x = x0 + (s.dx || 0), dir = s.dir === "R" ? 1 : -1, yy = y + s.side * 15;
    return { x, y, yy, dir, lx: x + dir * 12 };
  }

  // ---------- diagram ----------
  const svg = $("scheme");
  const edgeEls = [], swEls = {}, sigEls = {}, endEls = {};
  let trainLayer, pickLayer, gXO, gXI;
  // every drawn piece of a switch leg (including bends up to the next joint), and ALL switches it depends on:
  // a crossover piece belongs to two switches and is "in use" only when both point to it
  const swLegEdge = {};
  (function () {
    const secAt = {}, adjN = {}, swAtN = {};
    T.edges.forEach(([a, b, sec]) => { secAt[a + "|" + b] = secAt[b + "|" + a] = sec; (adjN[a] = adjN[a] || []).push(b); (adjN[b] = adjN[b] || []).push(a); });
    T.switches.forEach((sw) => (swAtN[sw.node] = sw));
    const add = (a, b, v) => { [a + "|" + b, b + "|" + a].forEach((k) => (swLegEdge[k] = swLegEdge[k] || []).push(v)); };
    T.switches.forEach((sw) => [["+", sw.plus], ["-", sw.minus]].forEach(([leg, n0]) => {
      const sec = secAt[sw.node + "|" + n0], v = { sw: sw.id, leg };
      let prev = sw.node, cur = n0; add(prev, cur, v);
      // follow plain bend nodes that stay in the same section
      for (let i = 0; i < 6 && !swAtN[cur] && (adjN[cur] || []).length === 2; i++) {
        const nx = adjN[cur].find((x) => x !== prev);
        if (!nx || secAt[cur + "|" + nx] !== sec) break;
        add(cur, nx, v); prev = cur; cur = nx;
      }
    }));
  })();
  const legOff = (legs, S) => !!legs && legs.some((l) => { const sw = S.sw[l.sw]; return sw.moving ? sw.moving.to !== l.leg : !sw.lost && sw.pos !== l.leg; });

  // display points of an edge, including bends from T.displayVia
  function edgePts(a, b) {
    const V = T.displayVia || {};
    const via = (V[a + "|" + b] || (V[b + "|" + a] ? V[b + "|" + a].slice().reverse() : [])).map(([x, y]) => [x, sy(y)]);
    return [pt(a), ...via, pt(b)];
  }
  function shrunk(a, b, cutA, cutB) {
    const P = edgePts(a, b).map((p) => p.slice());
    const cut = (p, q, c) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; p[0] += (q[0] - p[0]) / L * c; p[1] += (q[1] - p[1]) / L * c; };
    cut(P[0], P[1], cutA); cut(P[P.length - 1], P[P.length - 2], cutB);
    return "M" + P.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
  }

  function buildSvg() {
    svg.innerHTML = "";
    const nodeSecs = {};
    T.edges.forEach(([a, b, sec]) => [a, b].forEach((n) => (nodeSecs[n] = nodeSecs[n] || new Set()).add(sec)));
    const isJoint = (n) => nodeSecs[n].size > 1 && !/^S/.test(n);
    svg.setAttribute("viewBox", BOX[0] + " " + VY0 + " " + BOX[2] + " " + Math.round(VH * (ui.vs || 1)));
    (V.platforms || []).forEach(([x, y, w, h]) => el("rect", { x, y: sy(y + h / 2) - h / 2, width: w, height: h, class: "platform" }, svg));
    const note = (x, y, t, cls) => (el("text", { x, y: sy(y), class: cls || "note" }, svg).textContent = t);
    (V.notes || []).forEach(([x, y, t]) => note(x, y, t));
    (V.borders || []).forEach(([x1, y1, x2, y2]) => el("line", { x1, y1: sy(y1), x2, y2: sy(y2), class: "border" }, svg));
    // Draw order: inactive switch legs (dim) at the bottom, sloped branches, then straight tracks on top.
    gXO = el("g", {}, svg); gXI = el("g", {}, svg);
    const gSO = el("g", {}, svg), gSI = el("g", {}, svg), gO = el("g", {}, svg), gI = el("g", {}, svg), gHit = el("g", {}, svg);
    edgeEls.length = 0;
    // join pieces of one section that meet at a plain bend into one polyline (no notches at the corners)
    const swNode = new Set(T.switches.map((x) => x.node)), byNode = {};
    T.edges.forEach((e, k) => [e[0], e[1]].forEach((n) => (byNode[n] = byNode[n] || []).push(k)));
    const legKey = (a, b) => JSON.stringify(swLegEdge[a + "|" + b] || null);
    const seen = new Set();
    T.edges.forEach((e0, k0) => {
      if (seen.has(k0)) return;
      seen.add(k0);
      const sec = e0[2], lk = legKey(e0[0], e0[1]);
      let nodes = [e0[0], e0[1]];
      const grow = (atEnd) => {
        for (let g = 0; g < 50; g++) {
          const n = atEnd ? nodes[nodes.length - 1] : nodes[0], prev = atEnd ? nodes[nodes.length - 2] : nodes[1];
          if (swNode.has(n) || (byNode[n] || []).length !== 2) return;
          const k = byNode[n].find((x) => !seen.has(x) && !((T.edges[x][0] === n && T.edges[x][1] === prev) || (T.edges[x][1] === n && T.edges[x][0] === prev)));
          if (k == null) return;
          const e = T.edges[k], nx = e[0] === n ? e[1] : e[0];
          if (e[2] !== sec || legKey(n, nx) !== lk) return;
          seen.add(k);
          if (atEnd) nodes.push(nx); else nodes.unshift(nx);
        }
      };
      grow(true); grow(false);
      const pts = [];
      for (let q = 0; q < nodes.length - 1; q++) { const P = edgePts(nodes[q], nodes[q + 1]); (q ? P.slice(1) : P).forEach((x) => pts.push(x.slice())); }
      const cut = (p0, p1, c) => { const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1; p0[0] += (p1[0] - p0[0]) / L * c; p0[1] += (p1[1] - p0[1]) / L * c; };
      if (isJoint(nodes[0])) cut(pts[0], pts[1], 3);
      if (isJoint(nodes[nodes.length - 1])) cut(pts[pts.length - 1], pts[pts.length - 2], 3);
      const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
      const leg = swLegEdge[nodes[0] + "|" + nodes[1]];
      const sloped = pts.some((p, k, A) => k && p[1] !== A[k - 1][1]);
      const o = el("path", { d, class: "tube-o" }, sloped ? gSO : gO);
      const i = el("path", { d, class: "tube-i" }, sloped ? gSI : gI);
      const hit = el("path", { d, class: "hit" }, gHit);
      el("title", {}, hit).textContent = (D.sections[sec].label || "Стрілочна секція") + " · " + sec;
      hit.addEventListener("click", (ev) => onObjectClick({ kind: "sec", id: sec }, ev));
      edgeEls.push({ o, i, sec, leg, home: [sloped ? gSO : gO, sloped ? gSI : gI], off: false });
    });
    // dead ends: a white buffer stop across the end of a station track
    const deg = {}; T.edges.forEach(([a, b]) => { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; });
    T.edges.forEach(([a, b, sec]) => [[a, b], [b, a]].forEach(([n, m]) => {
      const k = (D.sections[sec] || {}).kind;
      if (deg[n] !== 1 || ["line", "approach", "exit"].includes(k)) return;
      const P = edgePts(n, m), [x0, y0] = P[0], [x1, y1] = P[1], L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
      el("rect", { x: -3, y: -9, width: 6, height: 18, class: "bufstop", transform: `translate(${(x0 - ux * 2).toFixed(1)},${(y0 - uy * 2).toFixed(1)}) rotate(${ang.toFixed(1)})` }, svg);
    }));
    T.labels.forEach(([t, x, y]) => (el("text", { x, y: sy(y + 6) - 12, class: "trk-label" }, svg).textContent = t));
    (V.blockLabels || []).forEach(([t, x, y, dy]) => (el("text", { x, y: sy(y) + dy, class: "blk-label" }, svg).textContent = t));
    // switches: number on the side shown on the plan; lock sign and red block square per table 2.16
    T.switches.forEach((s) => {
      const [x, y] = pt(s.node);
      const g = el("g", { class: "swg" }, svg);
      const below = s.label ? s.label > 0 : pt(s.minus)[1] < y;
      const ty = below ? y + 21 : y - 12;
      // keep the number off the diverging branch: shift it away when the branch runs on the label's side
      const side = below ? 1 : -1;
      const sloped = [s.plus, s.minus, s.common].map((n) => edgePts(s.node, n)[1]).find((q) => Math.sign(q[1] - y) === side);
      const away = sloped ? -Math.sign(sloped[0] - x) : 1;
      const tx = sloped ? x + away * 14 : x;
      el("rect", { x: tx - 13, y: below ? y + 7 : y - 26, width: 26, height: 20, class: "sw-hit" }, g);
      // blocked: red underlay under the number (handbook p.190); position locked: padlock beside it
      const bl = el("rect", { x: tx - 9, y: ty - 11, width: 18, height: 14, rx: 2, class: "sw-block" }, g);
      const t = el("text", { x: tx, y: ty, "text-anchor": "middle", class: "sw-label" }, g); t.textContent = s.id;
      const lk = T.lockFrame ? el("rect", { x: tx - 11, y: ty - 13, width: 22, height: 18, class: "sw-lockf" }, g)
        : s.lockOut ? el("text", { x: tx, y: ty + (below ? 17 : -17), "text-anchor": "middle", class: "sw-lock" }, g)
        : el("text", { x: tx + away * (s.id.length > 1 ? 15 : 13), y: ty, "text-anchor": away > 0 ? "start" : "end", class: "sw-lock" }, g);
      if (!T.lockFrame) lk.textContent = "🔒";
      el("title", {}, g).textContent = "Стрілка " + s.id;
      g.addEventListener("click", (ev) => onObjectClick({ kind: "sw", id: s.id }, ev));
      swEls[s.id] = { t, lk, bl, g };
    });
    // non-signal objects from the plan (С30)
    (T.markers || []).forEach((m) => {
      const [x, y] = pt(m.node), xx = x + (m.dx || 0), yy = y + (m.side || -1) * 14;
      const g = el("g", { class: "marker" }, svg);
      el("line", { x1: xx - 4, y1: yy - 5, x2: xx + 4, y2: yy + 5 }, g);
      el("text", { x: xx + 8, y: yy + 4 }, g).textContent = m.id;
      el("title", {}, g).textContent = m.id + ": " + m.note;
      g.addEventListener("click", (ev) => onObjectClick({ kind: "marker", id: m.id }, ev));
    });
    // end buttons for departure routes
    (T.endButtons || []).forEach((b) => {
      const [x, y] = pt(b.node), xx = x + (b.dx || 0), yy = y + (b.side || -1) * 15;
      const g = el("g", { class: "endbtn" }, svg);
      const r = el("rect", { x: xx - 8, y: yy - 6, width: 16, height: 12 }, g);
      el("text", { x: xx + 12, y: yy + 4 }, g).textContent = b.id;
      el("title", {}, g).textContent = b.note;
      g.addEventListener("click", (ev) => onObjectClick({ kind: "end", id: b.id }, ev));
      endEls[b.id] = { g, r, x: xx, y: yy };
    });
    // signals (all of them are controllable)
    T.signals.forEach((s) => {
      const { x, yy, dir, lx } = sigGeom(s);
      const g = el("g", { class: "sig " + s.kind }, svg);
      el("rect", { x: Math.min(x, lx) - 24, y: yy - 12, width: 50, height: 24, class: "sw-hit" }, g); // tap area
      el("line", { x1: x, y1: yy - 6, x2: x, y2: yy + 6, class: "mast" }, g);
      el("line", { x1: x, y1: yy, x2: x + dir * 5, y2: yy, class: "mast" }, g);
      const lr = s.kind === "shunt" ? 5.5 : 6;
      // invitation light (white, flashing) drawn as a ring around the red main light
      const inv = el("circle", { cx: lx, cy: yy, r: lr + 2.5, class: "inv" }, g);
      const lamp = el("circle", { cx: lx, cy: yy, r: lr, class: "lamp" }, g);
      const tw = 8 * s.id.length + 4;
      const blk = el("rect", { x: dir > 0 ? x - 4 - tw : x + 2, y: yy - 7, width: tw, height: 14, rx: 2, class: "sw-block" }, g);
      const t = el("text", { x: dir > 0 ? x - 4 : x + 4, y: yy + 4, "text-anchor": dir > 0 ? "end" : "start" }, g); t.textContent = s.id;
      el("title", {}, g).textContent = "Світлофор " + s.id + (s.note ? " — " + s.note : "");
      g.addEventListener("click", (ev) => onObjectClick({ kind: "sig", id: s.id }, ev));
      sigEls[s.id] = { g, lamp, inv, blk };
    });
    pickLayer = el("g", { class: "pick" }, svg);
    trainLayer = el("g", {}, svg);
    renderScheme();
  }

  function secMid(secId) {
    const all = D.sections[secId].edges, on = all.filter((e) => !legOff(swLegEdge[e.a + "|" + e.b], sim.S));
    const es = on.length ? on : all;
    let best = es[0], bl = -1;
    es.forEach((e) => { const [x1, y1] = pt(e.a), [x2, y2] = pt(e.b); const l = Math.hypot(x2 - x1, y2 - y1) + (y1 === y2 ? 300 : 0); if (l > bl) { bl = l; best = e; } });
    const [x1, y1] = pt(best.a), [x2, y2] = pt(best.b);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  function renderScheme() {
    const S = sim.S;
    const pickEnds = ui.pick ? pickTargets() : null;
    edgeEls.forEach((e) => {
      const st = S.sec[e.sec];
      const cls = [];
      if (st.occ != null || st.falseOcc || st.wagons) cls.push("occ");
      if (st.lock) {
        const rs = S.routes[st.lock];
        cls.push(rs && rs.state === "setting" ? "setting" : "locked");
        cls.push(rs && rs.mode === "shunt" ? "m-shunt" : "m-train");
        if (rs && rs.state === "cancelling") cls.push("blink");
      }
      if (st.blocked) cls.push("blocked");
      if (st.artUntil != null) cls.push("blink");
      if (pickEnds && pickEnds.secs.has(e.sec)) cls.push("target");
      let off = false;
      if (e.leg) { off = legOff(e.leg, S); if (e.leg.some((l) => S.sw[l.sw].lost)) cls.push("lost"); }
      // the leg the switch does not point to shows nothing: no route colour, no occupancy
      if (off) { cls.length = 0; cls.push("off"); if (e.leg.some((l) => S.sw[l.sw].lost)) cls.push("lost"); }
      if (ui.sel && ui.sel.kind === "sec" && ui.sel.id === e.sec) cls.push("sel");
      const c = cls.join(" ");
      if (e.c !== c) { e.o.setAttribute("class", "tube-o " + c); e.i.setAttribute("class", "tube-i " + c); e.c = c; }
      if (e.off !== off) { (off ? gXO : e.home[0]).appendChild(e.o); (off ? gXI : e.home[1]).appendChild(e.i); e.off = off; }
    });
    for (const [id, e] of Object.entries(swEls)) {
      const st = S.sw[id];
      e.t.setAttribute("class", "sw-label" + (st.pos === "-" ? " minus" : "") + (st.moving ? " moving" : "") + (st.lost ? " lost" : "") + (ui.sel && ui.sel.kind === "sw" && ui.sel.id === id ? " sel" : ""));
      e.lk.style.display = st.lockedInd ? "" : "none";
      e.bl.style.display = st.blocked ? "" : "none";
    }
    for (const [id, e] of Object.entries(sigEls)) {
      const sg = D.signals[id], st = S.sig[id];
      const c = st.open ? (st.aspect === "white" ? LAMP.white : LAMP.green) : sg.kind === "shunt" ? LAMP.blue : LAMP.red;
      if (e.lamp.style.fill !== c) e.lamp.style.fill = c;
      e.inv.style.display = st.inv ? "" : "none";
      e.blk.style.display = st.blocked ? "" : "none";
      e.g.classList.toggle("sel", !!(ui.sel && ui.sel.kind === "sig" && ui.sel.id === id));
      e.g.classList.toggle("target", !!(pickEnds && pickEnds.ends.has(id)));
      e.g.classList.toggle("start", !!(ui.pick && ui.pick.from === id));
    }
    for (const [id, e] of Object.entries(endEls)) e.g.classList.toggle("target", !!(pickEnds && pickEnds.ends.has(id)));
    trainLayer.innerHTML = "";
    Object.entries(S.sec).forEach(([id, st]) => {
      if (!st.wagons || st.occ != null) return;
      const [x, y] = secMid(id);
      const g = el("g", { class: "train wagons", transform: `translate(${x},${y})` }, trainLayer);
      const w = st.wagons, lab = w.consist ? (w.ready ? "◄" : "") + w.consist : "ваг.";
      const bw = Math.max(36, 12 + lab.length * 7.4);
      el("rect", { x: -bw / 2, y: -9, width: bw, height: 17 }, g);
      el("text", { x: 0, y: 4, "text-anchor": "middle" }, g).textContent = lab;
      el("title", {}, g).textContent = (w.consist ? "Состав " + w.consist + (w.ready ? " — готовий до відправлення (локомотив у голові)" : " — без локомотива з боку відправлення") : "Вагони (залишив " + w.num + ")") + " на " + id + " з " + E.fmt(w.since).slice(0, 5);
    });
    S.trains.filter((t) => !t.done).forEach((tr) => {
      const [x, y] = secMid(tr.seq[tr.idx]);
      const ev = tr.eventIdx != null ? S.events[tr.eventIdx] : null;
      const late = ev ? sim.lateMin(ev) : 0;
      const g = el("g", { class: "train " + tr.type + (late > 0 ? " late" : ""), transform: `translate(${x},${y})` }, trainLayer);
      const right = tr.parity && tr.parity === (T.rightParity || "odd"), left = tr.parity && !right;
      const label = (left ? "◄" : "") + tr.num + (right ? "►" : "") + (late > 0 ? " +" + late : "");
      const w = 12 + label.length * 7.4;
      el("rect", { x: -w / 2, y: -9, width: w, height: 17 }, g);
      el("text", { x: 0, y: 4, "text-anchor": "middle" }, g).textContent = label;
      el("title", {}, g).textContent = (tr.type === "shunting" ? "Маневровий " : "Поїзд ") + tr.num + ": " + tr.status;
      g.addEventListener("click", (e2) => { e2.stopPropagation(); if (tr.eventIdx != null) openInfo(tr.eventIdx, e2.clientX, e2.clientY); });
    });
  }

  // ---------- route setting: start → end (handbook p.160) ----------
  function pickTargets() {
    const routes = sim.routesFrom(ui.pick.from, ui.pick.mode);
    const ends = new Set(), secs = new Set();
    routes.forEach((r) => r.ends.forEach((e) => {
      ends.add(e);
      if (D.sections[e]) secs.add(e);
      else if (!D.signals[e] && !(T.endButtons || []).some((b) => b.id === e)) Object.keys(D.sections).filter((k) => D.sections[k].group === e).forEach((k) => secs.add(k));
    }));
    return { routes, ends, secs };
  }
  function startPick(from, mode) {
    ui.pick = { from, mode };
    document.body.classList.toggle("picking", true);
    toast((mode === "shunt" ? "Маневровий" : "Поїзний") + " маршрут від " + from + ": клацніть кінцевий світлофор (підсвічені) або колію. Esc — відміна набору.", "ok");
    renderScheme(); renderRku(); renderIndicators();
  }
  function stopPick(msg) {
    ui.pick = null; pickLayer.innerHTML = ""; document.body.classList.remove("picking");
    if (!ui.sel) $("rkuCard").classList.remove("open");
    if (msg) toast(msg);
    renderScheme(); renderRku(); renderIndicators();
  }
  // the first variant of a route to this end that can be set now (else the main variant)
  function routeForEnd(end) {
    const t = pickTargets();
    let c = t.routes.filter((r) => r.ends.includes(end));
    if (!c.length && D.sections[end]) c = t.routes.filter((r) => r.ends.includes(D.sections[end].group));
    return c.find((r) => !sim.checkRoute(r.id)) || c[0];
  }
  function finishPick(endId) {
    const r = routeForEnd(endId);
    if (!r) { toast("Маршруту від " + ui.pick.from + " до «" + endName(endId) + "» немає. Виберіть підсвічений кінець або Esc — відміна набору.", "err"); return; }
    const mode = ui.pick.mode, from = ui.pick.from;
    const endObj = D.sections[endId] ? (D.sections[endId].group || endId) : endId;
    confirmCmd(mode === "shunt" ? "ММЗ" : "ПМЗ", endObj, "Задати " + (mode === "shunt" ? "маневровий" : "поїзний") + " маршрут від " + from + " до " + endObj, false, () => {
      const res = sim.setRoute(r.id, null, mode, true);
      if (res.ok) { stopPick(); toast("Маршрут " + r.id + ": стрілки переводяться, після замикання світлофор відкриється.", "ok"); }
      else toast("Маршрут " + r.id + " не встановлено: " + res.err + ". Виберіть інший кінець або Esc.", "err");
      return res;
    });
  }
  // a line from the start signal to the cursor (green — train, yellow — shunting)
  let curSent = 0;
  svg.addEventListener("pointermove", (ev) => {
    if (ctx.onCursor && performance.now() - curSent > 90) {
      const p0 = svg.createSVGPoint(); p0.x = ev.clientX; p0.y = ev.clientY;
      const m0 = svg.getScreenCTM();
      if (m0) { const q0 = p0.matrixTransform(m0.inverse()); curSent = performance.now(); ctx.onCursor(Math.round(q0.x), Math.round(VY0 + (q0.y - VY0) / (ui.vs || 1)), ctx.st); }
    }
    if (!ui.pick) return;
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const m = svg.getScreenCTM(); if (!m) return;
    const q = p.matrixTransform(m.inverse());
    const g = sigGeom(D.signals[ui.pick.from]);
    pickLayer.innerHTML = "";
    el("line", { x1: g.lx, y1: g.yy, x2: q.x, y2: q.y, class: "pick-line " + ui.pick.mode }, pickLayer);
    el("text", { x: q.x + 6, y: q.y - 6, class: "pick-x " + ui.pick.mode }, pickLayer).textContent = "✕";
  });
  svg.addEventListener("click", (ev) => {
    if (ui.pick && ev.target === svg) toast("Виберіть кінцевий світлофор або колію. Esc — відміна набору.");
    else if (!ui.pick && ev.target === svg) select(null);
  });

  function onObjectClick(o, ev) {
    if (ev) ev.stopPropagation();
    if (ui.pick) {
      if (o.kind === "sig" || o.kind === "end") return finishPick(o.id);
      if (o.kind === "sec") return finishPick(o.id);
      return;
    }
    select(o, ev);
  }

  // ---------- indicators (handbook table 2.21) ----------
  function renderIndicators() {
    const S = sim.S;
    const kit = (k) => { const rid = S.kits[k]; if (!rid) return null; const st = S.routes[rid]; return st ? Math.max(0, st.until - S.time) : null; };
    [["indFree", "free", "ВІЛЬН."], ["indTrain", "train", "ПОЇЗД."], ["indShunt", "shunt", "МАНЕВР."]].forEach(([id, k, name]) => {
      const left = kit(k); $(id).classList.toggle("lit", left != null); $(id).querySelector(".ilc").textContent = left != null ? name + " " + left : name;
    });
    $("indCancel").classList.toggle("lit", Object.values(S.kits).some(Boolean));
    $("modeMain").classList.toggle("lit-g", S.mode === "main"); $("modeRes").classList.toggle("lit-g", S.mode === "reserve"); $("modeAux").classList.toggle("lit", S.mode === "aux");
    $("indFuse").classList.toggle("lit", S.faults.fuse); $("indSlow").classList.toggle("lit", S.faults.slow); $("indKv").classList.toggle("lit", S.faults.kv);
    $("indIR").classList.toggle("lit", Object.values(S.sec).some((s) => s.artUntil != null));
    $("indCut").classList.toggle("lit", Object.values(S.sw).some((s) => s.lost));
    $("indAuto").textContent = S.auto ? "АВТО" : "РУЧНЕ";
    $("indAuto").classList.toggle("on", S.auto);
    const ld = S.lastDir, any = Object.values(S.routes).length > 0;
    $("dirL").className = "dir-arrow" + (any && ld && ld.dir === "L" ? " " + ld.mode : "");
    $("dirR").className = "dir-arrow" + (any && ld && ld.dir === "R" ? " " + ld.mode : "");
    $("cntInv").textContent = S.counters.inv; $("cntAux").textContent = S.counters.aux; $("cntArt").textContent = S.counters.art;
  }

  // ---------- panels ----------
  function toast(msg, kind) { const t = $("toast"); t.textContent = msg; t.className = "toast" + (kind ? " " + kind : ""); }
  // the object panel opens next to the clicked object (bottom sheet on phones)
  document.body.appendChild($("rkuCard"));
  function placePanel(x, y) {
    const card = $("rkuCard");
    if (window.innerWidth < 720) { card.style.left = card.style.top = ""; return; }
    const w = 340, h = Math.min(card.offsetHeight || 300, window.innerHeight * 0.7);
    let left = x + 18, top = y - 20;
    if (left + w > window.innerWidth - 8) left = x - w - 18;
    if (top + h > window.innerHeight - 8) top = window.innerHeight - h - 8;
    card.style.left = Math.max(8, left) + "px"; card.style.top = Math.max(8, top) + "px";
  }
  function select(o, ev) {
    ui.sel = o; renderRku(); renderScheme();
    const card = $("rkuCard");
    card.classList.toggle("open", !!o || !!ui.pick);
    if (o && ev && ev.clientX != null) placePanel(ev.clientX, ev.clientY);
  }
  $("rkuClose").onclick = () => select(null);
  const routeStateName = { setting: "набір: стрілки переводяться", set: "замкнено, світлофор закритий", open: "світлофор відкрито", used: "рухомий склад у маршруті", cancelling: "розмикання з витримкою…" };
  const B = (c, a, label, opts) => `<button data-c="${c}" data-a="${esc(a)}"${opts && opts.danger ? ' class="danger"' : ""}${opts && opts.dis ? " disabled" : ""}${opts && opts.title ? ` title="${esc(opts.title)}"` : ""}>${label}</button>`;

  function renderRku() {
    const box = $("rku"), S = sim.S, s = ui.sel;
    let h = "";
    if (ui.pick) {
      const t = pickTargets();
      h += `<p><b>${ui.pick.mode === "shunt" ? "Маневровий" : "Поїзний"} маршрут від ${esc(ui.pick.from)}</b>: клацніть кінцевий світлофор на схемі (обведені бірюзовим) або виберіть тут.</p><div class="ends">`;
      [...t.ends].forEach((e) => {
        const r = routeForEnd(e); const err = r && sim.checkRoute(r.id);
        h += `<button data-c="pickend" data-a="${esc(e)}" ${err ? `class="dis" title="${esc(err)}"` : ""}>${esc(e)}${D.signals[e] ? "" : " · " + esc(endName(e))}</button>`;
      });
      h += `</div><div class="btns">${B("pickcancel", "", "Відміна набору")}</div>`;
    } else if (!s) { h = null; }
    else if (s.kind === "sig") {
      const sg = D.signals[s.id], st = S.sig[s.id];
      const kindName = { entry: "вхідний", exit: "вихідний", shunt: "маневровий" }[sg.kind];
      // a route the train is already running on does not stop a new route from this signal (the next train)
      const rid = sim.routeFromSignal(s.id, ["setting", "set", "open", "cancelling"]) || sim.routeFromSignal(s.id), rs = rid && S.routes[rid];
      const busyRid = rs && rs.state !== "used" ? rid : null;
      const hasTrain = sim.routesFrom(s.id, "train").length, hasShunt = sim.routesFrom(s.id, "shunt").length;
      h += `<dl class="kv"><dt>Світлофор</dt><dd><b>${esc(s.id)}</b> · ${kindName}</dd><dt>Показання</dt><dd>${st.open ? (st.aspect === "white" ? "білий — маневри дозволено" : "зелений — поїзд прийняти/відправити") : sg.kind === "shunt" ? "синій — маневри заборонено" : "червоний — заборонено"}${st.inv ? " + запрошувальний" : ""}${st.blocked ? " · ЗАБЛОКОВАНО" : ""}</dd>
        ${rid ? `<dt>Маршрут</dt><dd>${esc(rid)} — ${routeStateName[rs.state] || rs.state}</dd>` : ""}${sg.note ? `<dt>Примітка</dt><dd>${esc(sg.note)}</dd>` : ""}</dl><div class="menu">`;
      if (hasTrain) h += B("pick", "train", "Встановити поїзний маршрут", { dis: !!busyRid || st.blocked });
      if (hasShunt) h += B("pick", "shunt", "Встановити маневровий маршрут", { dis: !!busyRid || st.blocked });
      if (rid && rs.state !== "used") h += B("cancel", rid, rs.mode === "shunt" ? "Відмінити маневровий маршрут" : "Відмінити поїзний маршрут", { danger: true, dis: rs.state === "cancelling" });
      if (rid && rs.state === "set") h += B("open", s.id, "Повторно відкрити світлофор");
      if (st.open) h += B("close", s.id, "Закрити світлофор");
      if (sg.kind === "entry" || sg.kind === "exit") h += B("inv", s.id, st.inv ? "Запрошувальний горить" : "Запрошувальний сигнал", { danger: true, dis: !!st.inv || st.open });
      h += B("sigblock", s.id, st.blocked ? "Розблокувати" : "Заблокувати");
      h += `</div>`;
    } else if (s.kind === "sw") {
      const st = S.sw[s.id], sw = D.switches[s.id], sec = S.sec[sw.section];
      h += `<dl class="kv"><dt>Стрілка</dt><dd><b>${esc(s.id)}</b> · секція ${esc(sw.section)}</dd><dt>Контроль</dt><dd>${st.lost ? "<b class='late'>немає контролю (розріз)</b>" : st.moving ? "переводиться…" : st.pos === "+" ? "плюсовий" : "мінусовий"}</dd>
        <dt>Замикання</dt><dd>${sec.lock ? "у маршруті " + esc(sec.lock) : st.lockedInd ? "положення заблоковано" : "ні"}</dd>${st.blocked ? "<dt>Стан</dt><dd>заблокована</dd>" : ""}${sec.falseOcc ? "<dt>Секція</dt><dd class='late'>показує зайнятість</dd>" : ""}</dl><div class="menu">`;
      h += B("sw+", s.id, "Перевести в плюс", { dis: st.pos === "+" && !st.moving });
      h += B("sw-", s.id, "Перевести в мінус", { dis: st.pos === "-" && !st.moving });
      if (sec.falseOcc) h += B("aux", s.id, "Допоміжне переведення", { danger: true });
      h += B("swlock", s.id, st.lockedInd ? "Розблокувати положення" : "Заблокувати положення");
      h += B("swblock", s.id, st.blocked ? "Розблокувати стрілку" : "Заблокувати стрілку");
      h += `</div><details class="train-faults"><summary>Навчання: несправності</summary><div class="menu">${B("swfault", s.id, st.lost ? "Відновити контроль (електромеханік)" : "Ввести втрату контролю")}</div></details>`;
    } else if (s.kind === "sec") {
      const st = S.sec[s.id], info = D.sections[s.id];
      const occ = st.occ != null ? S.trains.find((t) => t.id === st.occ) : null;
      h += `<dl class="kv"><dt>Ділянка</dt><dd><b>${esc(s.id)}</b> · ${esc(info.label || "стрілочна секція")}</dd><dt>Зайнятість</dt><dd>${occ ? "зайнята: " + esc(occ.num) : st.falseOcc ? "<b class='late'>показує зайнятість без поїзда</b>" : "вільна"}</dd><dt>Замикання</dt><dd>${st.lock ? "маршрут " + esc(st.lock) : "ні"}${st.artUntil != null ? " · ШР до " + E.fmt(st.artUntil) : ""}</dd></dl><div class="menu">`;
      h += B("secblock", s.id, st.blocked ? "Розблокувати ділянку" : "Заблокувати ділянку");
      h += B("art", s.id, "Штучне розмикання", { danger: true, dis: !st.lock });
      if (st.wagons) h = h.replace("</dl>", `<dt>Вагони</dt><dd>${st.wagons.consist ? "состав " + esc(st.wagons.consist) + (st.wagons.ready ? " — готовий до відправлення" : "") : "залишив " + esc(st.wagons.num)} з ${E.fmt(st.wagons.since).slice(0, 5)}</dd></dl>`);
      if (!occ && !st.lock && !["approach", "exit", "line"].includes(info.kind)) h += B("loco", s.id, "Поставити маневровий локомотив");
      if (occ && occ.loco) h += B("locodel", String(occ.id), "Прибрати локомотив");
      h += `</div><details class="train-faults"><summary>Навчання: несправності</summary><div class="menu">${B("secfault", s.id, st.falseOcc ? "Усунути хибну зайнятість" : "Ввести хибну зайнятість")}</div></details>`;
    } else if (s.kind === "marker") {
      const m = (T.markers || []).find((x) => x.id === s.id);
      h += `<dl class="kv"><dt>Об'єкт</dt><dd><b>${esc(m.id)}</b></dd></dl><p class="hint">${esc(m.note)}</p>`;
    } else if (s.kind === "end") {
      const b = (T.endButtons || []).find((x) => x.id === s.id);
      const ex = Object.values(D.routes).filter((r) => r.ends.includes(b.id)).map((r) => r.from);
      h += `<dl class="kv"><dt>Кнопка</dt><dd><b>${esc(b.id)}</b> · ${esc(b.note)}</dd></dl><p class="hint">Її натискають як кінець маршруту відправлення: спершу виберіть вихідний світлофор (${esc(ex.join(", "))}) → «Встановити поїзний маршрут».</p>`;
    }
    if (box.__h === h) return;
    box.__h = h;
    if (h == null) { box.className = "hint"; box.textContent = "Клацніть світлофор, стрілку або ділянку на схемі."; }
    else { box.className = ""; box.innerHTML = h; }
  }

  $("rku").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-c]"); if (!b || b.disabled) return;
    const c = b.dataset.c, a = b.dataset.a;
    if (c === "pick") { startPick(ui.sel.id, a); return; }
    if (c === "pickend") { finishPick(a); return; }
    if (c === "pickcancel") { stopPick("Набір маршруту відмінено."); return; }
    const S = sim.S;
    const rd = sim.routeDef(a);
    const map = {
      open: ["ПВС", a, "Повторно відкрити світлофор", false, () => sim.openSignal(a)],
      close: ["ЗСВ", a, "Закрити світлофор", false, () => sim.closeSignal(a)],
      cancel: ["МВ", rd ? rd.from : a, "Відмінити (скасувати) маршрут", true, () => sim.cancelRoute(a)],
      inv: ["ЗПС", a, "Увімкнути запрошувальний сигнал (до 90 с, поїзд ≤20 км/год)", true, () => sim.inviteSignal(a)],
      sigblock: ["БЛС", a, S.sig[a] && S.sig[a].blocked ? "Розблокувати світлофор" : "Заблокувати світлофор", S.sig[a] && S.sig[a].blocked, () => sim.toggleSignalBlock(a)],
      "sw+": ["СП+", "Стрілка " + a, "Перевести стрілку в плюсове положення", false, () => sim.moveSwitch(a, "+")],
      "sw-": ["СП−", "Стрілка " + a, "Перевести стрілку в мінусове положення", false, () => sim.moveSwitch(a, "-")],
      aux: ["ДПС", "Стрілка " + a, "Допоміжне переведення стрілки (секцію перевірено особисто)", true, () => sim.moveSwitch(a, S.sw[a].pos === "+" ? "-" : "+", true)],
      swlock: ["БПС", "Стрілка " + a, S.sw[a] && S.sw[a].lockedInd ? "Розблокувати положення стрілки" : "Заблокувати положення стрілки", S.sw[a] && S.sw[a].lockedInd, () => sim.toggleSwitchLock(a)],
      swblock: ["БЛСТ", "Стрілка " + a, S.sw[a] && S.sw[a].blocked ? "Розблокувати стрілку" : "Заблокувати стрілку", S.sw[a] && S.sw[a].blocked, () => sim.toggleSwitchBlock(a)],
      swfault: ["НС", "Стрілка " + a, S.sw[a] && S.sw[a].lost ? "Відновити контроль стрілки (електромеханік)" : "Навчання: ввести втрату контролю стрілки", false, () => sim.setFault("sw", a, !S.sw[a].lost)],
      secblock: ["БЛД", a, S.sec[a] && S.sec[a].blocked ? "Розблокувати ділянку" : "Заблокувати ділянку", S.sec[a] && S.sec[a].blocked, () => sim.toggleSectionBlock(a)],
      art: ["ШР", a, "Штучне розмикання ділянки (витримка " + Math.round(P.artReleaseSec / 60) + " хв)", true, () => sim.artRelease(a)],
      secfault: ["НС", a, S.sec[a] && S.sec[a].falseOcc ? "Усунути хибну зайнятість" : "Навчання: ввести хибну зайнятість ділянки", false, () => sim.setFault("sec", a, !S.sec[a].falseOcc)],
      loco: ["ЛК", a, "Поставити маневровий локомотив", false, () => sim.spawnLoco(a)],
      locodel: ["ЛК", "Локомотив", "Прибрати маневровий локомотив", false, () => sim.removeLoco(+a)]
    };
    const [mn, obj, desc, resp, fn] = map[c];
    confirmCmd(mn, obj, desc, resp, fn);
  });

  let pending = null;
  // dialog as in the АРМ: «Підтвердіть виконання (відповідальної) команди»
  function confirmCmd(mn, obj, desc, resp, fn, onCancel) {
    const code = String(100 + Math.floor(rnd() * 900));
    pending = { fn, resp, code, onCancel };
    $("mWinTitle").textContent = resp ? "Підтвердіть виконання відповідальної команди" : "Підтвердіть виконання команди";
    $("mTitle").textContent = obj;
    $("mBody").innerHTML = resp
      ? `<p class="m-cmd"><b class="m-red">Команда</b> <span class="m-red">- ${esc(desc)}</span></p>
         <div class="m-code"><span>Для підтвердження введіть число</span><b>${code}</b><input id="mCode" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Число для підтвердження" value="${ui.autoCode ? code : ""}"></div>`
      : `<p class="m-cmd">${esc(mn)} - ${esc(desc)}</p>`;
    $("modal").hidden = false;
    (resp && !ui.autoCode ? $("mCode") : $("mOk")).focus();
  }
  function closeModal() { $("modal").hidden = true; pending = null; }
  $("mX").onclick = () => $("mCancel").click();
  $("mCancel").onclick = () => { if (pending) { sim.log("cmd", "Команду відмінено ДСП"); if (pending.onCancel) pending.onCancel(); } closeModal(); refresh(); };
  $("mOk").onclick = () => {
    if (!pending) return;
    if (pending.resp && (!$("mCode") || $("mCode").value.trim() !== pending.code)) { sim.log("error", "Код пильності не збігся — відповідальну команду не виконано"); toast("Код пильності не збігся. Команду не виконано.", "err"); closeModal(); refresh(); return; }
    const r = pending.fn(); closeModal();
    toast(r && r.ok ? "Виконано." : "Відмова: " + (r && r.err), r && r.ok ? "ok" : "err");
    refresh();
  };
  document.addEventListener("keydown", (e) => {
    if (!$("modal").hidden) { if (e.key === "Escape") $("mCancel").click(); if (e.key === "Enter") $("mOk").click(); }
    else if (!$("help").hidden && e.key === "Escape") $("help").hidden = true;
    else if (ui.pick && e.key === "Escape") stopPick("Набір маршруту відмінено.");
  });
  svg.addEventListener("contextmenu", (e) => { if (ui.pick) { e.preventDefault(); stopPick("Набір маршруту відмінено."); } });

  // approach announcement: a short beep when a train enters the approach section (p.165)
  let actx = null;
  function beep() {
    if (!ui.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.18);
    } catch (e) { /* audio unavailable */ }
  }
  offs.push(sim.on((e) => { if (e.approach) beep(); }));
  // radio call: two short tones on every incoming message (neighbour station, driver, duty)
  function ring() {
    if (!ui.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22].forEach((d, k) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = k ? 1046 : 784; g.gain.value = 0.06; o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + d); o.stop(actx.currentTime + d + 0.16);
      });
    } catch (e) { /* audio unavailable */ }
  }
  const radio = window.Radio.init(() => sim, { ring, store: (KEEP.radio[T.id] = KEEP.radio[T.id] || {}) }, T);
  offs.push(sim.on((e) => radio.onEvent(e)));

  // accident: show the cause at the top left and restart the day from 00:00
  function handleAccident() {
    const a = sim.S.accident; if (!a) return;
    if (REMOTE) return;
    $("accText").textContent = " Доба " + a.day + ", " + E.fmt(a.time).slice(0, 5) + (W ? ", ст. " + T.station : "") + ". " + a.text + ". Добу перезапущено з 00:00" + (W ? " на всій ділянці" : "") + ".";
    $("accident").hidden = false;
    if (W) { W.playerAuto = $("chkAuto").checked; W.endMode = $("selEnd").value; W.shunting = $("chkShunt").checked; W.reset(); }
    else sim.reset({ auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    sim.log("error", "Перезапуск після аварії: " + a.text);
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; if (ui.pick) stopPick();
    setRunning(true); refresh(true);
  }
  $("accClose").onclick = () => { $("accident").hidden = true; };

  // recommendation: which routes to set for an event
  function advice(ev) {
    if (!ev.parity) return null;
    if (ev.ev.action === "depart") {
      const sec = sim.findConsist(ev.ev.consist);
      const exitSig = sec && T.exitSignals[ev.parity][sec];
      const rOut = exitSig && Object.values(D.routes).find((r) => r.from === exitSig && r.type === "train" && (!ev.ev.exitTo || r.to === ev.ev.exitTo));
      return { depart: true, track: sec ? trackName(sec) : null, exitSig, outEnd: rOut && rOut.ends[0] };
    }
    if (!ev.recTrack) return null;
    const entry = ev.ev.entry || T.entrySignal[ev.parity];
    const rIn = Object.values(D.routes).find((r) => r.from === entry && r.to === ev.recTrack);
    const exM = T.exitSignals[ev.parity] || {};
    const exitSec = Object.keys(exM).find((k) => k === ev.recTrack || k.startsWith(ev.recTrack + "-"));
    const exitSig = exM[exitSec];
    const rOut = exitSig && Object.values(D.routes).find((r) => r.from === exitSig && r.type === "train" && (!ev.ev.exitTo || r.to === ev.ev.exitTo));
    return { track: trackName(ev.recTrack), entry, rIn: rIn && rIn.id, inEnd: rIn && rIn.ends[0], exitSig, outEnd: rOut && rOut.ends[0] };
  }

  const statusInfo = (ev) => {
    const late = sim.lateMin(ev);
    if (ev.status === "config") return ["p-config", "уточнити"];
    if (ev.status === "passed") {
      const w = ev.ev.action === "arrive" ? "прибув" : ev.ev.action === "depart" ? "відправився" : ev.ev.type === "shunting" ? "виконано" : "проїхав";
      return [late > 0 ? "p-late" : "p-passed", late > 0 ? w + ", запізн. " + late + " хв" : w + " за графіком"];
    }
    if (ev.status === "waiting") return ["p-late", (ev.waitWhy || (ev.ev.type === "shunting" ? "відкладено" : "затримано на перегоні")) + (late ? " +" + late + " хв" : "")];
    if (ev.status === "active") {
      const tr = sim.S.trains.find((t) => t.id === ev.trainId);
      const txt = tr ? tr.status : "активний";
      return [late > 0 ? "p-late" : tr && tr.wait ? "p-waiting" : "p-active", txt + (late > 0 ? " · запізн. " + late + " хв" : "")];
    }
    return ["p-planned", "модельний час"];
  };
  const typeShort = { passenger: "пас", freight: "тов", shunting: "ман", electric: "ел", intercity: "ІС+", test: "тест", household: "хоз", reserve: "рез", suburban: "прим" };
  const BASE_DATE = Date.UTC(2014, 9, 28);
  const dateStr = (day) => { const d = new Date(BASE_DATE + (day - 1) * 86400000); return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "." + d.getUTCFullYear(); };
  const ends = (ev) => {
    if (ev.ev.type === "shunting") return [T.station, T.station];
    if (ev.ev.from) return [ev.ev.from, ev.ev.to];
    return ev.ev.direction === "Dzhankoi" ? ["Мелітополь", "Джанкой"] : ["Джанкой", "Мелітополь"];
  };

  function renderEvents(full) {
    const S = sim.S, tb = $("evTable").tBodies[0];
    // rebuild whenever the day's timetable object changes (new day, new variant, reset) or grows (test train)
    if (full || tb.rows.length !== S.events.length || ui.evRef !== S.events) {
      ui.evRef = S.events;
      $("evDay").textContent = "· доба " + S.day + " · " + S.events.length + " подій";
      const date = dateStr(S.day);
      tb.innerHTML = S.events.map((ev, i) => {
        const [f, t] = ends(ev);
        return `<tr class="ev" data-i="${i}"><td><b>${esc(ev.ev.train)}</b></td><td>${date}</td><td class="tm">${esc(ev.ev.time)}</td><td>${typeShort[ev.ev.type] || ""}</td><td>${esc(f)}</td><td>${esc(t)}</td></tr>`;
      }).join("");
    }
    S.events.forEach((ev, i) => {
      const row = tb.rows[i], late = sim.lateMin(ev);
      const st = ev.status === "passed" ? "done" : ev.status === "config" ? "cfg" : ev.status === "active" ? "act" : ev.status === "waiting" ? "wait" : "";
      const cls = "ev " + st + (late > 0 ? " late" : "") + (ui.selEvent === i ? " sel" : "");
      if (row.className !== cls) row.className = cls;
      const tm = row.cells[2], txt = ev.ev.time + (late > 0 ? " +" + late : "");
      if (tm.textContent !== txt) tm.textContent = txt;
    });
  }
  // train information only on a click in the timetable (or on the train on the diagram)
  function openInfo(i, x, y) {
    ui.selEvent = i; ui.selTrain = sim.S.events[i] && sim.S.events[i].trainId;
    const pop = $("infoPop"); pop.classList.add("open"); $("trainBox").__h = undefined;
    renderTrain(); renderEvents();
    if (window.innerWidth >= 720) {
      const w = 360, h = Math.min(pop.offsetHeight || 320, window.innerHeight * 0.7);
      let left = x + 16, top = y - 30;
      if (left + w > window.innerWidth - 8) left = x - w - 16;
      if (top + h > window.innerHeight - 8) top = window.innerHeight - h - 8;
      pop.style.left = Math.max(8, left) + "px"; pop.style.top = Math.max(8, top) + "px";
    } else { pop.style.left = pop.style.top = ""; }
  }
  $("infoClose").onclick = () => { $("infoPop").classList.remove("open"); ui.selEvent = null; ui.selTrain = null; renderEvents(); };
  $("evTable").addEventListener("click", (e) => { const r = e.target.closest("tr.ev"); if (!r) return; openInfo(+r.dataset.i, e.clientX, e.clientY); });
  $("trainBox").addEventListener("change", (e) => { const i = e.target.dataset.d; if (i == null) return; sim.setDelay(+i, Math.max(0, +e.target.value || 0)); refresh(); });

  function stepHtml(st, sigNow) {
    if (st.wait) return "чекати " + Math.round(st.wait / 60) + " хв";
    if (st.leave) return st.ready ? "виставити состав для відправлення" : "відчепити й залишити вагони";
    if (st.couple) return "причепити вагони";
    if (st.attach) return "причепитися до состава з боку відправлення";
    const sig = st.sig && st.sig[0] === "@" && sigNow ? "<b>" + esc(sigNow) + "</b>" : st.sig && st.sig[0] === "@" ? "світлофор " + (st.sig[1] === "L" ? "у бік лівої горловини" : "у бік правої горловини") + ", що стоїть перед локомотивом" : "<b>" + esc(st.sig) + "</b>";
    const end = [].concat(st.end).map(esc).join(" або ");
    return sig + " → «Встановити маневровий маршрут» → кінець <b>" + end + "</b>" + (st.txt ? " (" + esc(st.txt) + ")" : "");
  }
  function adviceHtml(ev) {
    const job = ev.ev.job && (ev.plan || P.shuntingJobs[ev.ev.job]);
    if (job) {
      const note = ev.ev.note ? `<div class="adv-note">${esc(ev.ev.note)}</div>` : "";
      if (!job.plan) return `<div class="advice"><b>Маневрова робота:</b> ${esc(job.name)}. План складається, коли состав стоятиме на колії.${note}</div>`;
      const tr = ev.trainId != null ? sim.S.trains.find((t) => t.id === ev.trainId && !t.done) : null;
      const cur = tr && tr.shunt ? tr.shunt.step : -1;
      const steps = job.plan.map((st, i) => (i === cur ? "<u>зараз: " + stepHtml(st, tr.nextSignal) + "</u>" : i < cur ? "<s>" + stepHtml(st) + "</s>" : stepHtml(st))).join("; потім ");
      return `<div class="advice"><b>Маневрова робота:</b> ${esc(job.name || P.shuntingJobs[ev.ev.job].name)}. Локомотив з'явиться на ділянці <b>${esc(job.start)}</b>. Порядок: ${steps}.${note}</div>`;
    }
    const a = advice(ev); if (!a) return "";
    const note = ev.ev.note ? `<div class="adv-note">${esc(ev.ev.note)}</div>` : "";
    if (a.depart) return `<div class="advice"><b>Порада ДСП:</b> ${a.track ? "состав стоїть на <b>" + esc(a.track) + "</b>" : "состав ще не готовий"}. Відправлення: <b>${esc(a.exitSig || "вихідний світлофор колії")}</b> → «Встановити поїзний маршрут» → кінець <b>${esc(a.outEnd || "")}</b>. Поїзд рушить не раніше часу за графіком.${note}</div>`;
    if (T.terminal) return `<div class="advice"><b>Порада ДСП:</b> прийом на <b>${esc(a.track)}</b>: світлофор <b>${esc(a.entry)}</b> → «Встановити поїзний маршрут» → кінець <b>${esc(a.inEnd || "")}</b> (або сама колія). Станція тупикова: поїзд залишиться на колії до зворотного рейсу.${note}</div>`;
    return `<div class="advice"><b>Порада ДСП:</b> прийом на <b>${esc(a.track)}</b>: світлофор <b>${esc(a.entry)}</b> → «Встановити поїзний маршрут» → кінець <b>${esc(a.inEnd || "")}</b> (або сама колія). ${ev.ev.stopMin ? "Стоянка " + ev.ev.stopMin + " хв, потім" : "Далі"} відправлення: <b>${esc(a.exitSig || "")}</b> → «Встановити поїзний маршрут» → кінець <b>${esc(a.outEnd || "")}</b>.${note}</div>`;
  }

  function renderNext() {
    const S = sim.S;
    // the most urgent: an active train waiting at a red signal, else the next scheduled one
    const waiting = S.trains.find((t) => !t.done && t.wait && t.eventIdx != null);
    let ev, at;
    if (waiting) { ev = S.events[waiting.eventIdx]; at = ev.time + ev.delayMin * 60; }
    else { const n = sim.nextEvent(); if (!n) { $("nextBox").innerHTML = "Подій до кінця доби немає."; return; } ev = n.e; at = n.at; }
    const dt = at - S.time, late = sim.lateMin(ev);
    const [cls, txt] = statusInfo(ev);
    const [nf, nt] = ends(ev);
    const html = `<div class="next"><span class="big">${esc(ev.ev.train)}</span><span>${esc(typeShort[ev.ev.type] || "")} · ${esc(nf)} — ${esc(nt)} · <span class="pill ${cls}">${esc(txt)}</span></span>
      <span class="hint">о ${E.fmt(at).slice(0, 5)}</span><span>${late > 0 ? `<b class="late">Запізнюється на ${late} хв</b>` : dt > 0 ? "через " + Math.floor(dt / 60) + " хв " + (dt % 60) + " с" : "зараз"}${ev.delayMin ? " · задана затримка " + ev.delayMin + " хв" : ""}</span></div>` + adviceHtml(ev);
    if ($("nextBox").__h !== html) { $("nextBox").innerHTML = html; $("nextBox").__h = html; }
  }

  function renderTrain() {
    const box = $("trainBox"), S = sim.S;
    const ev = ui.selEvent != null ? S.events[ui.selEvent] : null;
    const tr = ev && ev.trainId != null ? S.trains.find((t) => t.id === ev.trainId) : ui.selTrain != null ? S.trains.find((t) => t.id === ui.selTrain) : null;
    let h = null;
    if (ev) {
      const [f, t] = ends(ev), late = sim.lateMin(ev);
      const job = ev.ev.job && P.shuntingJobs[ev.ev.job];
      h = `<dl class="kv"><dt>№ поїзда</dt><dd><b>${esc(ev.ev.train)}</b> · ${esc(typeShort[ev.ev.type] || ev.ev.type)}</dd>
        <dt>Дата, час</dt><dd>${dateStr(S.day)} ${esc(ev.ev.time)}${ev.delayMin ? " (+" + ev.delayMin + " хв задано)" : ""}</dd>
        <dt>Від — до</dt><dd>${esc(f)} — ${esc(t)}</dd>
        ${job ? `<dt>Робота</dt><dd>${esc(job.name)}</dd>` : ""}${ev.ev.note ? `<dt>Примітка</dt><dd>${esc(ev.ev.note)}</dd>` : ""}
        <dt>Стан</dt><dd>${esc(statusInfo(ev)[1])}</dd>${late > 0 ? `<dt>Запізнення</dt><dd><b class="late">${late} хв</b></dd>` : ""}
        ${tr ? `<dt>Довжина</dt><dd>${tr.len} бл.</dd><dt>Займає</dt><dd>${esc(tr.occ.join(", ") || "—")}</dd><dt>Наступний сигнал</dt><dd>${esc(tr.nextSignal || "—")}</dd>` : ""}
        ${ev.status === "planned" || ev.status === "waiting" ? `<dt>Затримка, хв</dt><dd><input type="number" min="0" max="600" value="${ev.delayMin}" data-d="${ev.idx}" aria-label="Затримка, хв" style="width:80px"></dd>` : ""}</dl>` + adviceHtml(ev);
    }
    if (box.__h === h) return;
    box.__h = h;
    box.innerHTML = h || "";
  }

  const LOGKIND = { cmd: "команда", train: "поїзд", delay: "затримка", error: "помилка", warn: "увага", auto: "автодисп.", sys: "система" };
  function renderLog(full) {
    const L = sim.S.log, box = $("log");
    if (full) { box.innerHTML = ""; ui.logCount = 0; }
    const frag = document.createDocumentFragment();
    for (let i = ui.logCount; i < L.length; i++) {
      const l = L[i];
      if (ui.logFilter !== "all" && !(ui.logFilter === "cmd" ? l.kind === "cmd" : ui.logFilter === "train" ? l.kind === "train" : ui.logFilter === "delay" ? l.kind === "delay" : l.kind === "error" || l.kind === "warn")) continue;
      const d = document.createElement("tr");
      d.className = "lg-" + l.kind;
      d.innerHTML = `<td class="tm">${dateStr(l.day)}</td><td class="tm">${E.fmt(l.t)}</td><td class="kd">${LOGKIND[l.kind] || esc(l.kind)}</td><td class="txt">${esc(l.text)}</td>`;
      frag.prepend(d);
    }
    const added = L.length - ui.logCount;
    ui.logCount = L.length;
    box.prepend(frag);
    while (box.childNodes.length > 600) box.removeChild(box.lastChild);
    if (!full && added > 0) { const last = L[L.length - 1]; if (last.kind === "error") toast(last.text, "err"); }
  }
  $("logFilters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.logFilter = b.dataset.f; [...$("logFilters").children].forEach((x) => x.classList.toggle("on", x === b)); renderLog(true); });

  const ac = $("aclock");
  (function buildClock() {
    let h = '<circle r="46" class="ac-face"/>';
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30, long = i % 5 === 0, r1 = long ? 36 : 41;
      h += `<line x1="${(Math.sin(a) * r1).toFixed(2)}" y1="${(-Math.cos(a) * r1).toFixed(2)}" x2="${(Math.sin(a) * 45).toFixed(2)}" y2="${(-Math.cos(a) * 45).toFixed(2)}" class="${long ? "ac-hr" : "ac-min"}"/>`;
    }
    h += '<line id="acH" class="ac-hh" x1="0" y1="4" x2="0" y2="-24"/><line id="acM" class="ac-mh" x1="0" y1="6" x2="0" y2="-36"/><line id="acS" class="ac-sh" x1="0" y1="8" x2="0" y2="-40"/><circle r="2.5" class="ac-pin"/>';
    ac.innerHTML = h;
  })();
  function renderClock() {
    const S = sim.S, t = S.time;
    const hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
    $("clock").textContent = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + "." + String(ss).padStart(2, "0");
    $("dateLine").textContent = dateStr(S.day) + (S.paused ? " · зупинено" : "");
    $("acH").setAttribute("transform", "rotate(" + (((hh % 12) + mm / 60) * 30) + ")");
    $("acM").setAttribute("transform", "rotate(" + ((mm + ss / 60) * 6) + ")");
    $("acS").setAttribute("transform", "rotate(" + (ss * 6) + ")");
  }

  // ---------- графік руху: time–distance chart, plan dashed, executed solid ----------
  const G = { span: window.innerWidth < 600 ? 2 : 4, follow: true, start: 0, last: 0 };
  [...$("gSpan").children].forEach((x) => x.classList.toggle("on", +x.dataset.h === G.span));
  const GCOL = { passenger: "#ff5a4e", intercity: "#ff8a3d", electric: "#2fe05a", suburban: "#2fe05a", freight: "#e8eef0", test: "#9a9a9a", shunting: "#ffd23f", household: "#ff9fcf", reserve: "#bdbdbd" };
  function drawGraph(force) {
    const S = sim.S, cv = $("graph");
    const nowKey = Math.floor(S.time / 5) + ":" + S.day + ":" + G.span + ":" + G.start + ":" + G.follow;
    if (!force && G.last === nowKey && cv.width === Math.round(cv.clientWidth * (window.devicePixelRatio || 1))) return;
    G.last = nowKey;
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.body), T_ = !!T.terminal;
    const col = (v) => css.getPropertyValue(v).trim();
    c.fillStyle = col("--panel"); c.fillRect(0, 0, W, H);
    const L = W < 500 ? 66 : 96, R = 10, top = 26, bot = H - 24;
    const yTop = top, yBot = bot, yA = top + (bot - top) * (T.terminal ? 0.62 : 0.38), yB = T.terminal ? bot : top + (bot - top) * 0.62;
    const span = G.span * 3600;
    if (G.follow) G.start = Math.max(0, Math.min(86400 - span, S.time - span * 0.3));
    const t0 = G.start, t1 = t0 + span;
    const X = (t) => L + ((t - t0) / span) * (W - L - R);
    // rows
    c.fillStyle = "rgba(127,127,127,.12)"; c.fillRect(L, yA, W - L - R, yB - yA);
    c.strokeStyle = col("--line"); c.lineWidth = 1;
    (T.terminal ? [yTop, yA, yB] : [yTop, yA, yB, yBot]).forEach((y) => { c.beginPath(); c.moveTo(L, y); c.lineTo(W - R, y); c.stroke(); });
    c.fillStyle = col("--fg"); c.font = "600 " + (W < 500 ? 10 : 11) + "px " + col("--font-mono"); c.textBaseline = "middle";
    const names = (V.graph || ["", T.station, ""]).map((n) => (W < 500 && n.length > 9 ? n.slice(0, 7) + "." : n));
    c.fillText(names[0], 4, yTop); c.fillText(names[1], 4, (yA + yB) / 2); if (names[2]) c.fillText(names[2], 4, yBot);
    // time grid
    const step = [900, 1800, 3600, 7200, 10800].find((st) => (st / span) * (W - L - R) >= 56) || 10800;
    c.textBaseline = "alphabetic"; c.font = "10px " + col("--font-mono"); c.fillStyle = col("--muted");
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) {
      const x = X(t); c.strokeStyle = "rgba(127,127,127,.18)"; c.beginPath(); c.moveTo(x, top - 6); c.lineTo(x, bot); c.stroke();
      c.fillText(E.fmt(t).slice(0, 5), x - 14, H - 6);
    }
    const lead = (ev) => ((ev.ev.action === "depart" ? -(P.departLeadMin || 6) : P.appearLeadMin[ev.ev.type] || 3) * 60);
    // everything inside the plot is clipped to the time window; train numbers never overlap
    c.save(); c.beginPath(); c.rect(L, 0, W - L - R, H); c.clip();
    const used = { top: [], bot: [], mid: [] };
    const label = (row, x, y, text, color) => {
      c.font = "600 10px " + col("--font-mono");
      const w = c.measureText(text).width;
      if (used[row].some(([a, b]) => x < b + 4 && a < x + w + 4)) return;
      used[row].push([x, x + w]); c.fillStyle = color; c.fillText(text, x, y);
    };
    S.events.forEach((ev) => {
      if (ev.status === "config") return;
      const color = GCOL[ev.ev.type] || "#ccc";
      const T = ev.time + (ev.delayMin || 0) * 60, stop = (ev.ev.stopMin || 0) * 60;
      const odd = ev.parity === "odd";
      const yIn = odd ? yTop : yBot, yEdgeIn = odd ? yA : yB, yEdgeOut = odd ? yB : yA, yOut = odd ? yBot : yTop;
      let planPts, sh = ev.ev.type === "shunting";
      if (sh) {
        const job = ev.plan || P.shuntingJobs[ev.ev.job] || P.shuntingPlan;
        const dur = job.plan ? job.plan.reduce((a, st) => a + (st.wait || 180), 0) : job.estSec || 1200;
        if (T + dur < t0 || T > t1) return;
        c.fillStyle = "rgba(255,210,63,.18)"; c.fillRect(X(T), yA + 3, Math.max(2, X(T + dur) - X(T)), yB - yA - 6);
        const m = ev.marks;
        if (m && m.appear != null) { c.fillStyle = color; c.fillRect(X(m.appear), (yA + yB) / 2 - 3, Math.max(2, X(m.gone != null ? m.gone : S.time) - X(m.appear)), 6); }
        label("mid", Math.max(L + 2, X(T) + 2), yA + 12, ev.ev.train, color);
        return;
      }
      const yMid = (yA + yB) / 2;
      if (T_ && ev.ev.action === "arrive") planPts = [[T - lead(ev), yTop], [T - 30, yA], [T + 90, yMid]];
      else if (T_ && ev.ev.action === "depart") planPts = [[T - 300, yMid], [T, yA], [T + 240, yTop]];
      else planPts = [[T - lead(ev), yIn], [T - 30, yEdgeIn], [T + stop, yEdgeOut], [T + stop + 240, yOut]];
      if (planPts[planPts.length - 1][0] < t0 || planPts[0][0] > t1) return;
      c.strokeStyle = color; c.globalAlpha = 0.55; c.setLineDash([5, 4]); c.lineWidth = 1.2;
      c.beginPath(); planPts.forEach(([t, y], k) => (k ? c.lineTo(X(t), y) : c.moveTo(X(t), y))); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
      // executed line from the train's marks, extended to "now" while it is still running
      const m = ev.marks;
      if (m && m.appear != null) {
        const tr = S.trains.find((x) => x.id === ev.trainId);
        const pts = T_ ? [[m.appear, ev.ev.action === "depart" ? yMid : yTop]] : [[m.appear, yIn]];
        if (T_ && ev.ev.action === "arrive") { if (m.arrive != null) pts.push([m.arrive, yA]); if (m.gone != null) pts.push([m.gone, yMid]); }
        else if (T_) { if (m.depart != null) pts.push([m.depart, yA]); if (m.gone != null) pts.push([m.gone, yTop]); }
        else {
          if (m.arrive != null) pts.push([m.arrive, yEdgeIn]);
          if (m.depart != null) pts.push([m.depart, yEdgeOut]);
          if (m.gone != null) pts.push([m.gone, yOut]);
        }
        if (m.gone == null && tr && !tr.done) {
          const k = D.sections[tr.seq[tr.idx]].kind;
          const y = T_ ? (ev.ev.action === "depart" ? (m.depart != null ? (yA + yTop) / 2 : yMid) : m.arrive != null ? (yA + yMid) / 2 : yTop + (yA - yTop) * (tr.wait ? 0.95 : 0.5))
            : m.depart != null ? yEdgeOut + (yOut - yEdgeOut) * 0.5 : m.arrive != null ? (k === "track" ? (yEdgeIn + yEdgeOut) / 2 : yEdgeIn + (yEdgeOut - yEdgeIn) * 0.25) : yIn + (yEdgeIn - yIn) * (tr.wait ? 0.95 : 0.5);
          pts.push([S.time, y]);
        }
        c.strokeStyle = color; c.lineWidth = 2;
        c.beginPath(); pts.forEach(([t, y], k) => (k ? c.lineTo(X(t), y) : c.moveTo(X(t), y))); c.stroke();
      }
      const lx = Math.max(L + 2, X(planPts[0][0]) + 2);
      const late = sim.lateMin(ev);
      const row = T_ ? "top" : odd ? "top" : "bot";
      label(row, lx, row === "top" ? yTop - 5 : yBot + 13, ev.ev.train + (late > 0 ? " +" + late : ""), late > 0 ? "#ff5a4e" : color);
    });
    // now
    if (S.time >= t0 && S.time <= t1) { c.strokeStyle = "#ff2b2b"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(S.time), top - 10); c.lineTo(X(S.time), bot); c.stroke(); }
    c.restore();
    $("graphDay").textContent = "· доба " + S.day + " · " + E.fmt(t0).slice(0, 5) + "–" + E.fmt(Math.min(t1, 86399)).slice(0, 5);
  }
  $("gSpan").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; G.span = +b.dataset.h; [...$("gSpan").children].forEach((x) => x.classList.toggle("on", x === b)); if (G.span === 24) { G.follow = false; G.start = 0; $("gNow").classList.remove("on"); } drawGraph(true); });
  $("gBack").onclick = () => { G.follow = false; $("gNow").classList.remove("on"); G.start = Math.max(0, G.start - G.span * 1800); drawGraph(true); };
  $("gFwd").onclick = () => { G.follow = false; $("gNow").classList.remove("on"); G.start = Math.min(86400 - G.span * 3600, G.start + G.span * 1800); drawGraph(true); };
  $("gNow").onclick = () => { G.follow = true; $("gNow").classList.add("on"); if (G.span === 24) { G.span = 4; [...$("gSpan").children].forEach((x) => x.classList.toggle("on", x.dataset.h === "4")); } drawGraph(true); };
  window.addEventListener("resize", () => drawGraph(true));

  // line mode: the stations of the line, who works each one, trains running between them
  function renderLineStrip() {
    const box = $("lineStrip"); if (!W) { box.hidden = true; return; }
    box.hidden = false;
    const L = W.L, tr = W.inTransit(), SDx = window.STATION_DATA, ro = (W.roster && W.roster()) || [];
    const who = (id) => ro.filter((r) => r.st === id && r.id !== ctx.meId);
    const badge = (r) => `<i class="pl" style="--pc:${r.color}" title="${esc(r.name)}">${esc(r.name)}</i>`;
    const tag = (id) => {
      const ws = ro.filter((r) => r.view === id && r.st !== id);
      const own = who(id);
      const base = id === ctx.st && !RO ? "ви" + (sim.S.auto ? " · авто" : "") : own.length ? "" : "автодиспетчер";
      return base + (own.length ? own.map(badge).join(" ") : "") + (ws.length ? " · дивляться: " + ws.map((r) => esc(r.name)).join(", ") : "");
    };
    const appr = (id) => (W.info ? W.info(id).appr : 0);
    const cell = (id) => { const busy = W.full && W.full(id) && id !== ctx.st;
      return `<button class="ls-st${id === ctx.st ? " me" : busy ? " other" : ""}" data-ls="${id}" title="${busy ? "станцією керує інший гравець — клацніть, щоб спостерігати" : "перейти на станцію"}"><b>${esc(SDx[id].name)}${id === ctx.st && RO ? " · спостереження" : ""}</b><span>${tag(id)}${appr(id) ? " · на підході " + appr(id) : ""}</span></button>`; };
    const gap = (a, b) => { const ln = L.links.find((l) => (l[0] === a && l[2] === b) || (l[0] === b && l[2] === a));
      const on = tr.filter((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
      return `<div class="ls-gap${ln && ln[5] ? " single" : ""}">${on.length ? on.map((x) => `<span class="tr">${x.from === a ? "→" : "←"} № ${esc(x.train)}</span>`).join("") : "<span>перегін вільний</span>"}</div>`; };
    const order = L.order || L.stations, ends = L.ends || ["", ""];
    let html = ends[0] ? `<div class="ls-end">${esc(ends[0])}</div>` : "";
    order.forEach((id, i) => { html += cell(id); if (i < order.length - 1) html += gap(id, order[i + 1]); });
    if (ends[1]) html += `<div class="ls-end">${esc(ends[1])}</div>`;
    if (box.__h !== html) { box.innerHTML = html; box.__h = html; }
  }
  $("lineStrip").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ls]"); if (!b) return;
    const id = b.dataset.ls;
    if (id === ctx.st && !RO) return;
    const busy = W.full && W.full(id);
    if (busy) window.switchStation(id, { watch: true }); else window.switchStation(id);
  });
  // other players' pointers on this station's plan
  function renderCursors() {
    let g = svg.querySelector("g.cursors");
    if (!g) g = el("g", { class: "cursors" }, svg);
    else svg.appendChild(g);
    const cs = (ctx.cursors && ctx.cursors()) || [];
    const html = cs.filter((c) => c.view === ctx.st).map((c) => {
      const x = c.x, y = sy(c.y), col = c.color;
      const shape = { arrow: `<path d="M0 0 L0 22 L6 16 L10 26 L14 24 L10 14 L18 14 Z"/>`, cross: `<path d="M-10 -2 H10 V2 H-10 Z M-2 -10 H2 V10 H-2 Z"/>`, diamond: `<path d="M0 -11 L11 0 L0 11 L-11 0 Z"/>`,
        ring: `<circle r="9" fill="none" stroke-width="4" stroke="${col}"/>`, square: `<rect x="-8" y="-8" width="16" height="16"/>`, tri: `<path d="M0 -11 L11 9 L-11 9 Z"/>` }[c.shape] || `<circle r="7"/>`;
      return `<g transform="translate(${x},${y})" fill="${col}" stroke="#000" stroke-width="1.5">${shape}<text x="14" y="-8" class="cur-name" fill="${col}" stroke="none">${esc(c.name)}</text></g>`;
    }).join("");
    if (g.__h !== html) { g.innerHTML = html; g.__h = html; }
  }

  function refresh(full) { renderLineStrip(); renderClock(); renderScheme(); renderIndicators(); renderEvents(full); renderNext(); renderTrain(); renderRku(); renderLog(full); drawGraph(full); renderCursors(); }

  // ---------- controls ----------
  function setRunning(r) { ui.running = KEEP.running = r; $("btnPlay").textContent = r ? "⏸ Пауза" : "▶ Пуск"; $("btnPlay").classList.toggle("on", r); }
  $("btnPlay").onclick = () => { if (hostOnly()) return; if (sim.S.paused) { toast("Доба завершена. Скиньте добу або оберіть «новий день».", "err"); return; } setRunning(!ui.running); };
  $("speedSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || hostOnly()) return; ui.speed = KEEP.speed = +b.dataset.s; [...$("speedSeg").children].forEach((x) => x.classList.toggle("on", x === b)); sim.log("cmd", "Швидкість ×" + ui.speed + " (доба за " + Math.round(35 / ui.speed) + " хв)"); renderLog(); });
  $("btnReset").onclick = () => {
    if (hostOnly()) return;
    if (W) { W.playerAuto = $("chkAuto").checked; W.endMode = $("selEnd").value; W.shunting = $("chkShunt").checked; W.reset(); }
    else sim.reset({ auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0; $("infoPop").classList.remove("open"); if (ui.pick) stopPick();
    toast("Добу скинуто на 00:00:00.", "ok"); refresh(true);
  };
  $("chkAuto").checked = sim.S.auto;
  $("chkAuto").onchange = (e) => { if (RO) { e.target.checked = sim.S.auto; toast("Режим спостереження.", "err"); return; } if (REMOTE) { ctx.netCmd("__auto", [e.target.checked]); return; } sim.S.auto = e.target.checked; if (W) W.playerAuto = e.target.checked; sim.log("cmd", "Автодиспетчер " + (sim.S.auto ? "увімкнено: маршрути задає система" : "вимкнено: маршрути задає ДСП")); refresh(); };
  $("chkCode").onchange = (e) => { ui.autoCode = KEEP.autoCode = e.target.checked; };
  $("chkSound").onchange = (e) => { ui.sound = KEEP.sound = e.target.checked; };
  $("selEnd").onchange = (e) => { if (W) { W.endMode = e.target.value; Object.values(W.sims).forEach((x) => (x.S.endMode = e.target.value)); } else sim.S.endMode = e.target.value; };
  $("chkShunt").onchange = (e) => {
    (W ? Object.values(W.sims) : [sim]).forEach((x) => { x.S.shuntingEnabled = e.target.checked; x.S.events.forEach((ev) => { if (ev.ev.action === "shunting_sequence" && (ev.status === "config" || ev.status === "planned")) { ev.needsConfig = e.target.checked ? null : "маневровий сценарій вимкнено в налаштуваннях"; ev.status = e.target.checked ? "planned" : "config"; } }); });
    if (W) W.shunting = e.target.checked;
    sim.log("cmd", "Маневровий сценарій " + (e.target.checked ? "увімкнено" : "вимкнено"));
    refresh(true);
  };
  $("btnSkip").onclick = () => {
    if (hostOnly()) return;
    const S = sim.S; let n = 0;
    const idle = () => (W ? W.isIdle() : sim.isIdle());
    if (!idle()) { toast(W ? "На ділянці є поїзди або витримки. Прокрутка недоступна." : "На станції є поїзди або витримки. Прокрутка недоступна.", "err"); return; }
    while (idle() && n < 86400 && !S.paused) { if (W) W.step(); else sim.step(); n++; }
    sim.log("cmd", "Прокрутка часу на " + Math.round(n / 60) + " хв");
    refresh();
  };
  function applySource(msg) {
    if (hostOnly()) return;
    if (W) { W.playerAuto = $("chkAuto").checked; W.endMode = $("selEnd").value; W.shunting = $("chkShunt").checked; W.regenerate(src.seed, src.level); }
    else sim.setSchedule(scheduleSource(), { auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0; $("infoPop").classList.remove("open");
    toast(msg, "ok"); refresh(true);
  }
  $("selSrc").onchange = (e) => { src.kind = e.target.value; $("genCtl").hidden = src.kind !== "gen"; applySource(src.kind === "gen" ? "Згенеровано новий модельний графік." : "Завантажено графік із завдання (24 події)."); };
  $("selLevel").onchange = (e) => { src.level = e.target.value; applySource("Інтенсивність змінено, графік перегенеровано."); };
  $("btnGen").onclick = () => { src.seed = Math.max(1, Math.floor(+$("inSeed").value || 1)); applySource("Графік згенеровано, номер варіанта " + src.seed + "."); };
  $("btnNewSeed").onclick = () => { src.seed = 1 + Math.floor(rnd() * 99999); $("inSeed").value = src.seed; applySource("Новий випадковий графік, номер варіанта " + src.seed + "."); };
  document.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => {
    const m = b.dataset.m;
    if (m === "aux" && sim.S.mode !== "aux") confirmCmd("ДУ", "Допоміжне управління", "Увімкнути допоміжне управління: маршрути задаються лише після індивідуального переведення стрілок; «Допоміжне переведення» діє навіть під замкнутим маршрутом. Помилка ДСП може призвести до сходу або зіткнення.", true, () => sim.setMode("aux"));
    else { sim.setMode(m); refresh(); }
  }));
  document.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { sim.toggleFault(b.dataset.f); refresh(); }));
  function setTheme(t) {
    document.body.classList.toggle("grey-console", t === "grey");
    [...$("themeSeg").children].forEach((x) => x.classList.toggle("on", x.dataset.t === t));
    try { localStorage.setItem("dsp-theme", t); } catch (e) { /* storage unavailable */ }
    drawGraph(true);
  }
  $("themeSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setTheme(b.dataset.t); });
  try { const t = localStorage.getItem("dsp-theme"); if (t) setTheme(t); } catch (e) { /* storage unavailable */ }
  function fitConsole() {
    if (!document.body.classList.contains("console-only")) { ui.vs = 1; return; }
    const wrap = $("schemeWrap"), bar = wrap.querySelector(".indbar");
    const w = ZOOMS[ui.zoom] || wrap.clientWidth || window.innerWidth, want = window.innerHeight * 0.7 - (bar ? bar.offsetHeight : 0);
    ui.vs = Math.max(1, Math.min(4.5, want / ((w / BOX[2]) * VH)));
  }
  $("btnConsole").onclick = () => {
    const on = document.body.classList.toggle("console-only");
    $("btnConsole").classList.toggle("on", on);
    $("btnConsole").textContent = on ? "▤ Показати все" : "▣ Лише пульт";
    if (window.innerWidth >= 720) { if (on) { ui.zoomSaved = ui.zoom; ui.zoom = 0; } else if (ui.zoomSaved != null) ui.zoom = ui.zoomSaved; }
    applyZoom(); fitConsole(); buildSvg(); drawGraph(true);
  };
  window.addEventListener("resize", () => { if (document.body.classList.contains("console-only")) { fitConsole(); buildSvg(); } });
  $("btnHelp").onclick = () => { $("help").hidden = false; $("helpClose").focus(); };
  $("helpClose").onclick = () => { $("help").hidden = true; };
  $("help").addEventListener("click", (e) => { if (e.target === $("help")) $("help").hidden = true; });
  $("tabSim").onclick = () => { $("viewSim").hidden = false; $("viewHist").hidden = true; $("tabSim").classList.add("on"); $("tabHist").classList.remove("on"); };
  $("tabHist").onclick = () => { $("viewSim").hidden = true; $("viewHist").hidden = false; $("tabHist").classList.add("on"); $("tabSim").classList.remove("on"); };
  const lvl = { plan: ["p-hist", "підтверджено планом / посібником"], source: ["p-hist", "джерело наведено, не перевірено повністю"], unconfirmed: ["p-planned", "не підтверджено"] };
  // ---------- station: names, menu, station-specific help and sources ----------
  document.title = "АРМ ДСП " + T.station;
  $("brandName").textContent = "АРМ ДСП · " + T.station;
  $("brandSub").textContent = (W ? "Маршрут " + W.L.name.replace(" — ", " → ") + " · " : "Навчальна модель МПЦ · ") + "план від " + T.planDate;
  document.querySelectorAll("[data-station]").forEach((n) => (n.hidden = n.dataset.station !== T.id));
  const SD = window.STATION_DATA || {}, LINES = (window.LineWorld && window.LineWorld.LINES) || {};
  // names of the other players at a station, but only when it has no room left
  const occupied = (id) => (W && W.full && W.full(id) ? ((W.others && W.others.get(id)) || []).join(", ") : null);
  // stations that belong to a route appear only inside that route
  const inLine = new Set([].concat(...Object.values(LINES).map((l) => l.stations)));
  const singles = Object.values(SD).filter((st) => !inLine.has(st.id));
  const lineBtns = Object.values(LINES).map((l) => `<button data-line="${esc(l.id)}" class="${W && W.L.id === l.id ? "on" : ""}"><b>Маршрут ${esc(l.name.replace(" — ", " → "))}</b><span>${l.stations.map((x) => esc(SD[x].name)).join(" · ")} — ${l.stations.length} станції разом</span></button>`).join("");
  $("stationList").innerHTML = (W
    ? `<div class="st-cap">Зараз: маршрут ${esc(W.L.name.replace(" — ", " → "))}</div><p class="st-note">Між станціями маршруту перемикайтеся кнопкою «⇄» поруч. Станції без гравця веде автодиспетчер.</p>` +
      `<button data-single="1"><b>← Вийти з маршруту</b><span>до окремих станцій</span></button><div class="st-cap">Окремі станції</div>`
    : `<div class="st-cap">Окремі станції</div>`) +
    singles.map((st) => `<button data-st="${esc(st.id)}" class="${!W && st.id === T.id ? "on" : ""}"><b>${esc(st.name)}</b><span>${esc(st.note || "")}</span></button>`).join("") +
    `<div class="st-cap">Маршрути (кілька станцій разом)</div>` + lineBtns;
  $("stationList").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.line) { if (W && W.L.id === b.dataset.line) return; confirmCmd("МР", LINES[b.dataset.line].name, "Перейти на маршрут " + LINES[b.dataset.line].name.replace(" — ", " → ") + " (поточна доба на ст. " + T.station + " завершиться)", false, () => { window.selectLine(b.dataset.line); return { ok: true }; }); return; }
    if (b.dataset.single) { confirmCmd("МР", "Вихід з маршруту", "Вийти з маршруту " + W.L.name + " до окремих станцій (поточна доба на маршруті завершиться)", false, () => { window.selectStation("sokologirne"); return { ok: true }; }); return; }
    if (!b.dataset.st || (!W && b.dataset.st === T.id)) return;
    confirmCmd("СТ", SD[b.dataset.st].name, "Перейти на станцію " + SD[b.dataset.st].name + " (поточна доба " + (W ? "на маршруті" : "на станції " + T.station) + " завершиться)", false, () => { window.selectStation(b.dataset.st); return { ok: true }; });
  });
  // route mode only: the switch between the stations of the route
  $("btnStation").title = W ? "Маршрут і вибір станцій" : "Вибір станції";
  $("stName").textContent = W ? "Маршрут " + W.L.name.replace(" — ", " → ") : T.station;
  if (W) {
    $("lineStName").textContent = T.station + (RO ? " (спостереження)" : "");
    const renderLineSt = () => {
      const ro = (W.roster && W.roster()) || [];
      const html = `<div class="st-cap">Станції маршруту ${esc(W.L.name.replace(" — ", " → "))}</div>` + W.L.stations.map((id, i) => {
        const who = occupied(id), here = id === T.id, names = (W.others && W.others.get(id)) || [], cap = W.cap ? W.cap(id) : 1;
        const sub = here ? (RO ? "ви спостерігаєте" : "ви тут" + (names.length ? " разом з " + names.join(", ") : "")) : who ? "керує " + who + " — можна лише спостерігати"
          : names.length ? "керує " + names.join(", ") + " — є місце ще для " + (cap - names.length) : "автодиспетчер — клацніть, щоб перейти" + (cap > 1 ? " (до " + cap + " гравців)" : "");
        return `<button data-lst="${esc(id)}" class="${here ? "on" : ""}"><b>${i + 1}. ${esc(SD[id].name)}</b><span>${esc(sub)}</span></button>`;
      }).join("");
      if ($("lineStList").__h !== html) { $("lineStList").innerHTML = html; $("lineStList").__h = html; }
    };
    renderLineSt();
    $("btnLineSt").addEventListener("click", renderLineSt);
    $("lineStList").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lst]"); if (!b) return;
      const id = b.dataset.lst; if (id === T.id && !RO) return;
      $("lineStPanel").hidden = true;
      window.switchStation(id, occupied(id) ? { watch: true } : undefined);
    });
  }
  $("selSrc").closest("label").hidden = !ctx.SCHEDULE;
  if (T.id !== "sokologirne") { $("tabHist").hidden = true; }
  $("histList").innerHTML = window.HISTORY_NOTES.map((n) => `<div class="hist-item"><span class="pill ${lvl[n.level][0]}">${lvl[n.level][1]}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p>${n.links.map(([t, u]) => `<div><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></div>`).join("")}</div>`).join("");

  // ---------- loop (fixed 1-second simulation steps) ----------
  let acc = 0, last = performance.now(), lastRender = 0;
  function frame(now) {
    if (!alive) return;
    // a player shows the host's clock state
    if (REMOTE && (ui.running !== KEEP.running || ui.speed !== KEEP.speed)) {
      ui.running = KEEP.running; ui.speed = KEEP.speed;
      $("btnPlay").textContent = ui.running ? "⏸ Пауза" : "▶ Пуск"; $("btnPlay").classList.toggle("on", ui.running);
      [...$("speedSeg").children].forEach((x) => x.classList.toggle("on", +x.dataset.s === ui.speed));
    }
    const dt = Math.min(0.5, (now - last) / 1000); last = now;
    if (ui.running && !sim.S.paused) {
      acc += dt * ui.speed * DAY_RATE;
      let n = 0;
      while (acc >= 1 && n < 4000 && !sim.S.paused) { if (W) W.step(); else sim.step(); acc -= 1; n++; }
      if (W) { const bad = Object.keys(W.sims).find((k) => W.sims[k].S.accident); if (bad && bad !== ctx.st) { acc = 0; const a = W.sims[bad].S.accident; toast("Аварія на ст. " + SD[bad].name + ": " + a.text + ". Ділянку перезапущено.", "err"); W.reset(); refresh(true); } }
      if (sim.S.accident) { acc = 0; handleAccident(); }
      else if (sim.S.paused) setRunning(false);
    }
    if (now - lastRender > 120) { lastRender = now; refresh(); radio.tick(); }
    requestAnimationFrame(frame);
  }
  // zoom: width of the diagram in px (0 = fit the window)
  const ZOOMS = [0, 1300, 1700, 2200, 2900];
  ui.zoom = KEEP.zoom != null ? KEEP.zoom : window.innerWidth >= 2200 ? 0 : 3;
  function applyZoom() {
    const w = ZOOMS[ui.zoom];
    svg.style.width = w ? w + "px" : "100%";
    svg.style.minWidth = w ? w + "px" : "0";
  }
  $("zoomSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const z = +b.dataset.z;
    ui.zoom = KEEP.zoom = z === 0 ? 0 : Math.max(0, Math.min(ZOOMS.length - 1, ui.zoom + z));
    applyZoom();
    if (document.body.classList.contains("console-only")) { fitConsole(); buildSvg(); }
  });
  applyZoom();
  // drop-down tabs next to «?»: time, settings
  function dropToggle(btn, panel) {
    $(btn).addEventListener("click", (e) => { e.stopPropagation(); const open = $(panel).hidden; document.querySelectorAll(".drop-panel").forEach((p) => (p.hidden = true)); $(panel).hidden = !open; $(btn).setAttribute("aria-expanded", String(open)); });
    $(panel).addEventListener("click", (e) => e.stopPropagation());
  }
  dropToggle("btnTime", "timePanel"); dropToggle("btnSet", "settings"); dropToggle("btnStation", "stationPanel"); dropToggle("btnLineSt", "lineStPanel");
  document.addEventListener("click", () => document.querySelectorAll(".drop-panel").forEach((p) => (p.hidden = true)));
  setRunning(ui.running);
  ["btnPlay", "btnReset", "btnSkip", "selEnd", "chkShunt", "selLevel", "btnGen", "btnNewSeed", "inSeed", "selSrc"].forEach((id) => { if ($(id)) $(id).disabled = REMOTE; });
  [...$("speedSeg").children].forEach((x) => (x.disabled = REMOTE));
  $("timeNote").textContent = REMOTE ? "Часом, швидкістю і графіком керує лише той, хто створив кімнату (ведучий)." : "×1 — модельна доба за 35 хв реального часу.";
  [...$("speedSeg").children].forEach((x) => x.classList.toggle("on", +x.dataset.s === ui.speed));
  $("chkCode").checked = ui.autoCode; $("chkSound").checked = ui.sound;
  if (W) { $("selEnd").value = W.endMode; $("chkShunt").checked = W.shunting; $("inSeed").value = W.seed; $("selLevel").value = W.level; }
  document.body.classList.toggle("line-mode", !!W);
  buildSvg();
  refresh(true);
  requestAnimationFrame(frame);
  window.__sim = sim; window.__edges = edgeEls; window.__refresh = () => refresh(); // for tests
  ctx.api = { refresh, toast };
  return () => { alive = false; offs.forEach((f) => f()); if (ui.pick) stopPick(); $("infoPop").classList.remove("open"); $("radio").hidden = true; };
  }

  // ---------------------------------------------------------------- boot
  // every listener a screen adds is removed with it (line mode remounts the screen for another station)
  function mountTracked(ctx) {
    const ac = new AbortController(), orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (t, f, o) {
      const opt = typeof o === "object" && o ? Object.assign({}, o) : { capture: !!o };
      opt.signal = ac.signal;
      return orig.call(this, t, f, opt);
    };
    let off;
    try { off = mount(ctx); } finally { EventTarget.prototype.addEventListener = orig; }
    return () => { off(); ac.abort(); };
  }
  const SDATA = window.STATION_DATA || {};
  const esc0 = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast0 = (msg, kind) => { const t = $("toast"); t.textContent = msg; t.className = "toast" + (kind ? " " + kind : ""); };
  if (window.LINE_ID && window.LineWorld) {
    const L = window.LineWorld.LINES[window.LINE_ID];
    let st = window.LINE_PLAYER && L.stations.includes(window.LINE_PLAYER) ? window.LINE_PLAYER : L.stations[0];
    const world = window.LineWorld.createWorld(L.id, { player: st, seed: src.seed, level: src.level });
    window.__world = world;
    const NET = { s: null, err: "" };
    const ownCursor = (look) => {
      const shape = { arrow: "M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L20 16 Z", cross: "M4 13 H24 V17 H4 Z M12 5 H16 V25 H12 Z", diamond: "M14 2 L26 14 L14 26 L2 14 Z", ring: "M14 4 A10 10 0 1 0 14.01 4 Z M14 9 A5 5 0 1 1 13.99 9 Z", square: "M5 5 H23 V23 H5 Z", tri: "M14 3 L26 24 L2 24 Z" }[look.shape];
      const svgc = `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><path d='${shape}' fill='${look.color}' fill-rule='evenodd' stroke='black' stroke-width='1.5'/></svg>`;
      $("scheme").style.cursor = look ? `url("data:image/svg+xml,${encodeURIComponent(svgc)}") ${look.shape === "arrow" ? "2 2" : "14 14"}, crosshair` : "";
    };
    const cursorList = (curs, roster, me) => Object.entries(curs || {}).filter(([k]) => k !== me).map(([k, c]) => { const r = (roster || []).find((x) => x.id === k) || {}; return Object.assign({ name: r.name || "?", color: r.color || "#fff", shape: r.shape || "arrow" }, c); });
    // ---------------- this browser runs the line (alone or as the host)
    let cur = null;
    const hostCtx = (id, watch) => ({ T: SDATA[id].TOPOLOGY, P: SDATA[id].MODEL_PARAMS, generate: SDATA[id].generate, SCHEDULE: null, world, st: id,
      wrap: watch ? (x) => window.Net.readonlySim(x) : null, readonly: !!watch, meId: "host",
      onCursor: (x, y, view) => { if (NET.s && NET.s.role === "host") NET.s.cursor(x, y, view); },
      cursors: () => (NET.s && NET.s.role === "host" ? cursorList(NET.s.cursors, NET.s.roster(), "host") : []) });
    world.roster = () => (NET.s && NET.s.role === "host" ? NET.s.roster() : []);
    world.info = world.info || ((id) => ({ appr: 0 }));
    window.TOPOLOGY = SDATA[st].TOPOLOGY;
    cur = { st, view: st, off: mountTracked(hostCtx(st)) };
    const remountHost = (id, watch) => { cur.off(); window.TOPOLOGY = SDATA[id].TOPOLOGY; cur = { st: watch ? null : id, view: id, off: mountTracked(hostCtx(id, watch)) }; renderNet(); };
    window.switchStation = (id, o) => {
      if (NET.s && NET.s.role === "client") return clientSwitch(id, o);
      if (!world.sims[id] || (id === cur.view && !(o && o.watch) && cur.st === id)) return false;
      const busy = world.full(id);
      if (busy || (o && o.watch)) { world.setPlayer(null); remountHost(id, true); return true; }
      world.setPlayer(id, world.playerAuto);
      try { localStorage.setItem("dsp-line-player", id); } catch (e) { /* storage unavailable */ }
      remountHost(id, false);
      return true;
    };
    // ---------------- this browser is a player at someone else's line
    let C = null, cw = null;
    function clientCtx(view) {
      const T = SDATA[view].TOPOLOGY, P = SDATA[view].MODEL_PARAMS;
      cw.sims[view] = cw.sims[view] || E.createSim(T, () => ({ events: [] }), P, { auto: false });
      const own = view === C.st;
      return { T, P, generate: SDATA[view].generate, SCHEDULE: null, world: cw, st: view, readonly: !own, meId: C.me.id,
        wrap: (x) => (own ? window.Net.remoteSim(x, C, (m, r) => { if (r && r.ok === false && cur.ctx && cur.ctx.api) cur.ctx.api.toast("Відмова: " + r.err, "err"); }) : window.Net.readonlySim(x)),
        netCmd: (m, a) => C.conn.send({ t: "cmd", st: C.view, m, a, id: ++C.seq }),
        onCursor: (x, y) => C.conn.send({ t: "cur", x, y }),
        cursors: () => cursorList(C.cursors, C.roster, C.me.id) };
    }
    function mountClient(view) {
      if (cur) cur.off();
      window.TOPOLOGY = SDATA[view].TOPOLOGY;
      const ctx = clientCtx(view);
      cur = { st: C.st, view, ctx, off: mountTracked(ctx) };
      renderNet();
    }
    function clientSwitch(id, o) { C.conn.send({ t: "switch", st: id, watch: !!(o && o.watch) || cw.full(id) }); return true; }
    async function joinRoom(code) {
      NET.err = ""; NET.busy = "Підключення…"; renderNet();
      try {
        const c = await window.Net.join(code, netName(), {
          onState: (m) => {
            const sm = cw.sims[m.view]; if (!sm) return;
            sm.ingest(m.snap, m.restart);
            const om = new Map(); m.roster.filter((r) => r.st && r.id !== C.me.id).forEach((r) => om.set(r.st, (om.get(r.st) || []).concat(r.name))); cw.others = om;
            KEEP.running = m.clock.running; KEEP.speed = m.clock.speed;
          },
          onAssign: (m) => mountClient(m.view),
          onDenied: (t) => toast0(t, "err"),
          onClose: () => { toast0("Зв'язок з ведучим втрачено. Повертаємось до власної ділянки…", "err"); setTimeout(() => location.reload(), 1500); }
        });
        if (c.line !== world.id) throw new Error("ведучий грає іншу ділянку");
        C = c; NET.s = C; NET.busy = "";
        Object.values(world.sims).forEach((x) => (x.S.paused = true));   // our own copy of the line stops
        cw = { remote: true, id: world.id, L: world.L, sims: {}, others: new Map(), player: C.st, seed: C.seed, level: C.level, endMode: "newday", shunting: true, playerAuto: false,
          cap: (s2) => (world.L.capacity && world.L.capacity[s2]) || 1, full: (s2) => ((cw.others && cw.others.get(s2)) || []).length >= ((world.L.capacity && world.L.capacity[s2]) || 1),
          step() {}, isIdle: () => false, reset() {}, regenerate() {}, setPlayer() {}, inTransit: () => C.transit || [], info: (id) => (C.info && C.info[id]) || { appr: 0 }, roster: () => C.roster || [] };
        ownCursor(C.me);
        mountClient(C.st);
      } catch (e) { NET.busy = ""; NET.err = "Не вдалося приєднатися: " + (e.message || e); renderNet(); }
    }
    async function hostRoom(local) {
      NET.err = ""; NET.busy = local ? "" : "Підключення до сервера PeerJS…"; renderNet();
      try {
        NET.s = await window.Net.host(world, local, { name: netName, view: () => cur.view, running: () => KEEP.running, speed: () => KEEP.speed, onChange: renderNet });
        NET.busy = ""; ownCursor(window.Net.LOOKS[0]);
      } catch (e) { NET.busy = ""; NET.err = "Не вдалося створити кімнату: " + (e.type === "unavailable-id" ? "код зайнятий, спробуйте ще" : e.message || e); }
      renderNet();
    }
    // ---------------- the panel
    const netName = () => { const v = ($("netName") && $("netName").value.trim()) || NET.name || "Гравець"; NET.name = v; try { localStorage.setItem("dsp-net-name", v); } catch (e) { /* storage unavailable */ } return v; };
    try { NET.name = localStorage.getItem("dsp-net-name") || ""; } catch (e) { /* storage unavailable */ }
    function renderNet() {
      const box = $("netBox"); if (!box) return;
      const s = NET.s, max = world.L.stations.reduce((n, x) => n + ((world.L.capacity && world.L.capacity[x]) || 1), 0);
      $("netLbl").textContent = s ? (s.role === "host" ? "Кімната " + s.code : "У грі " + s.code) : "Мережа";
      $("netLbl").classList.toggle("on", !!s);
      let h = "";
      if (!s) {
        h = `<p class="nb-note">Кожен гравець керує своєю станцією маршруту, решту веде автодиспетчер. Гравців — не більше ${max}${world.L.capacity ? " (" + Object.entries(world.L.capacity).map(([k, v]) => SDATA[k].name + " — до " + v).join(", ") + ")" : ""}.</p>
          <div class="nb-row"><label for="netName">Ваше ім'я</label><input type="text" id="netName" maxlength="24" value="${esc0(NET.name || "")}" placeholder="Гравець"></div>
          <div class="nb-row"><button id="netHost">Створити кімнату</button><button id="netLocal" title="Для перевірки: гравці — інші вкладки цього ж браузера">У вкладках</button></div>
          <div class="nb-row"><input type="text" id="netCode" maxlength="8" placeholder="Код кімнати" autocomplete="off"><button id="netJoin">Приєднатися</button></div>
          <p class="nb-note">Зв'язок напряму між браузерами (WebRTC) через безкоштовний сервер PeerJS. Модель рахує той, хто створив кімнату; у інших — його стан і їхні команди.</p>`;
      } else if (s.role === "host") {
        const ro = s.roster();
        h = `<div class="nb-row">Код кімнати: <span class="nb-code">${esc0(s.code)}</span></div>
          <p class="nb-note">Передайте код іншим гравцям${s.local ? " (лише вкладки цього браузера)" : ""}. Гравців ${ro.length} з ${max}.</p>
          ${ro.map((r) => `<div class="nb-pl"><i class="pl" style="--pc:${r.color}">${esc0(r.name)}${r.host ? " (ведучий)" : ""}</i><span>${r.st ? esc0(SDATA[r.st].name) : "спостерігає: " + esc0(SDATA[r.view] ? SDATA[r.view].name : "—")}</span></div>`).join("")}
          <div class="nb-row"><button id="netClose" class="danger">Закрити кімнату</button></div>`;
      } else {
        h = `<div class="nb-row">Кімната <span class="nb-code">${esc0(s.code)}</span></div>
          <p class="nb-note">Ви: <i class="pl" style="--pc:${s.me.color}">${esc0(NET.name)}</i>, ${s.st ? "станція " + esc0(SDATA[s.st].name) : "спостереження"}. Часом і графіком керує ведучий.</p>
          ${(s.roster || []).map((r) => `<div class="nb-pl"><i class="pl" style="--pc:${r.color}">${esc0(r.name)}${r.host ? " (ведучий)" : ""}</i><span>${r.st ? esc0(SDATA[r.st].name) : "спостерігає"}</span></div>`).join("")}
          <div class="nb-row"><button id="netLeave" class="danger">Вийти з гри</button></div>`;
      }
      if (NET.busy) h += `<p class="nb-note">${esc0(NET.busy)}</p>`;
      if (NET.err) h += `<p class="nb-err">${esc0(NET.err)}</p>`;
      if (box.__h !== h) { box.innerHTML = h; box.__h = h; }
    }
    $("netBox").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "netHost") hostRoom(false);
      else if (b.id === "netLocal") hostRoom(true);
      else if (b.id === "netJoin") { const code = $("netCode").value.trim(); if (code) joinRoom(code); }
      else if (b.id === "netClose") { NET.s.close(); NET.s = null; ownCursor(null); renderNet(); }
      else if (b.id === "netLeave") { NET.s.conn.close(); location.reload(); }
    });
    $("netBox").addEventListener("input", (e) => { if (e.target.id === "netName") NET.name = e.target.value; });
    $("btnNet").addEventListener("click", (e) => { e.stopPropagation(); const open = $("netPanel").hidden; document.querySelectorAll(".drop-panel").forEach((p) => (p.hidden = true)); $("netPanel").hidden = !open; renderNet(); });
    $("netPanel").addEventListener("click", (e) => e.stopPropagation());
    setInterval(() => { if (NET.s && !$("netPanel").hidden) renderNet(); }, 1000);
    renderNet();
    window.__net = NET;
    // join link: #line=sh&join=CODE
    const jm = /(?:^|[#&])join=([A-Za-z0-9]+)/.exec(location.hash || "");
    if (jm) joinRoom(jm[1]);
  } else {
    const id = window.STATION_ID || "sokologirne", d = SDATA[id];
    mountTracked({ T: window.TOPOLOGY, P: window.MODEL_PARAMS, generate: (a, b, c) => window.ScheduleGenerator.generate(a, b, c), SCHEDULE: window.SCHEDULE, st: id, d });
  }
})();

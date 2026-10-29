/* UI layer: АРМ ДСП screen. Renders the station diagram and panels; commands go to the engine.
 * Interaction follows the handbook (pp. 159–165): click a signal → context menu → choose
 * "train" or "shunting" route → click the end signal (a line follows the cursor) → the
 * switches transfer, sections lock and the signal opens. */
(function () {
  "use strict";
  const T = window.TOPOLOGY, P = window.MODEL_PARAMS, E = window.SimEngine;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  // timetable source: seeded generator (default) or the fixed JSON from the task
  const src = { kind: "gen", seed: 2014, level: "medium" };
  const scheduleSource = () => (src.kind === "gen" ? (day) => window.ScheduleGenerator.generate(src.seed, src.level, day) : window.SCHEDULE);
  let sim = E.createSim(T, scheduleSource(), P, { auto: false });
  const D = sim.D;
  const ui = { running: true, speed: 1, sel: null, pick: null, selTrain: null, selEvent: null, logFilter: "all", logCount: 0, autoCode: true, sound: true };
  let seed = 20141028;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); // UI only (vigilance codes)

  // Signal lamp colours (handbook table 2.14). Set via style, not presentation attributes.
  const LAMP = { red: "#ff2b2b", green: "#2fe05a", white: "#ffffff", blue: "#2f6bff" };

  const pt = (n) => (T.displayNodes && T.displayNodes[n]) || T.nodes[n];
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const trackName = (g) => (g ? "колія " + g.replace("П", "") : "");
  const endName = (e) => (D.signals[e] ? "світлофор " + e : e === "ВЯ" ? "кнопка відпр. на Якимівку" : D.sections[e] ? (D.sections[e].group ? trackName(D.sections[e].group) : e) : trackName(e));
  // geometry of a signal symbol (shared by drawing, pick highlighting and the route line)
  function sigGeom(s) {
    const [x, y] = pt(s.node), dir = s.dir === "R" ? 1 : -1, yy = y + s.side * 15;
    return { x, y, yy, dir, lx: x + dir * 12 };
  }

  // ---------- diagram ----------
  const svg = $("scheme");
  const edgeEls = [], swEls = {}, sigEls = {}, endEls = {};
  let trainLayer, pickLayer, gXO, gXI;
  const swLegEdge = {};
  T.switches.forEach((s) => {
    swLegEdge[s.node + "|" + s.plus] = swLegEdge[s.plus + "|" + s.node] = { sw: s.id, leg: "+", node: s.node };
    swLegEdge[s.node + "|" + s.minus] = swLegEdge[s.minus + "|" + s.node] = { sw: s.id, leg: "-", node: s.node };
  });

  // display points of an edge, including bends from T.displayVia
  function edgePts(a, b) {
    const V = T.displayVia || {};
    const via = V[a + "|" + b] || (V[b + "|" + a] ? V[b + "|" + a].slice().reverse() : []);
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
    [[1089, 100, 238, 37], [1065, 270, 497, 11], [1065, 339, 497, 11]].forEach(([x, y, w, h]) => el("rect", { x, y, width: w, height: h, class: "platform" }, svg));
    const note = (x, y, t, cls) => (el("text", { x, y, class: cls || "note" }, svg).textContent = t);
    note(-150, 226, "← ЯКИМІВКА · парний"); note(2440, 352, "ПАРТИЗАНИ · непарний →");
    note(250, 66, "Тяг. підст. ЕЧ-4"); note(2125, 177, "ПЧ-4"); note(2385, 205, "1272 км+302 м");
    el("line", { x1: 2375, y1: 210, x2: 2375, y2: 355, class: "border" }, svg);
    // Draw order: inactive switch legs (dim) at the bottom, sloped branches, then straight tracks on top.
    gXO = el("g", {}, svg); gXI = el("g", {}, svg);
    const gSO = el("g", {}, svg), gSI = el("g", {}, svg), gO = el("g", {}, svg), gI = el("g", {}, svg), gHit = el("g", {}, svg);
    edgeEls.length = 0;
    T.edges.forEach(([a, b, sec]) => {
      const leg = swLegEdge[a + "|" + b];
      const sloped = edgePts(a, b).some((p, k, A) => k && p[1] !== A[k - 1][1]);
      const d = shrunk(a, b, isJoint(a) ? 3 : 0, isJoint(b) ? 3 : 0);
      const o = el("path", { d, class: "tube-o" }, sloped ? gSO : gO);
      const i = el("path", { d, class: "tube-i" }, sloped ? gSI : gI);
      const hit = el("path", { d, class: "hit" }, gHit);
      el("title", {}, hit).textContent = (D.sections[sec].label || "Стрілочна секція") + " · " + sec;
      hit.addEventListener("click", (ev) => onObjectClick({ kind: "sec", id: sec }, ev));
      edgeEls.push({ o, i, sec, leg, home: [sloped ? gSO : gO, sloped ? gSI : gI], off: false });
    });
    T.labels.forEach(([t, x, y]) => (el("text", { x, y: y - 6, class: "trk-label" }, svg).textContent = t));
    [["2НП", -95, 314], ["1НП", 15, 314], ["1ЧП", 2520, 244], ["2ЧП", 2650, 244], ["1НУП", 2490, 314], ["2НУП", 2640, 314], ["1ЧУП", 110, 244], ["2ЧУП", -65, 244]]
      .forEach(([t, x, y]) => (el("text", { x, y, class: "blk-label" }, svg).textContent = t));
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
      const lk = el("text", { x: tx + away * (s.id.length > 1 ? 15 : 13), y: ty, "text-anchor": away > 0 ? "start" : "end", class: "sw-lock" }, g); lk.textContent = "🔒";
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
      const r = el("rect", { x: xx - 8, y: yy - 6, width: 16, height: 12, rx: 2 }, g);
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
    const es = D.sections[secId].edges;
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
      if (st.occ != null || st.falseOcc) cls.push("occ");
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
      if (e.leg) { const sw = S.sw[e.leg.sw]; off = !sw.moving && !sw.lost && sw.pos !== e.leg.leg; if (sw.lost) cls.push("lost"); }
      if (off) cls.push("off");
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
    S.trains.filter((t) => !t.done).forEach((tr) => {
      const [x, y] = secMid(tr.seq[tr.idx]);
      const ev = tr.eventIdx != null ? S.events[tr.eventIdx] : null;
      const late = ev ? sim.lateMin(ev) : 0;
      const g = el("g", { class: "train " + tr.type + (late > 0 ? " late" : ""), transform: `translate(${x},${y})` }, trainLayer);
      const label = (tr.parity === "even" ? "◄" : "") + tr.num + (tr.parity === "odd" ? "►" : "") + (late > 0 ? " +" + late : "");
      const w = 12 + label.length * 7.4;
      el("rect", { x: -w / 2, y: -9, width: w, height: 17, rx: 2 }, g);
      el("text", { x: 0, y: 4, "text-anchor": "middle" }, g).textContent = label;
      el("title", {}, g).textContent = (tr.type === "shunting" ? "Маневровий " : "Поїзд ") + tr.num + ": " + tr.status;
      g.addEventListener("click", (ev) => { ev.stopPropagation(); ui.selTrain = tr.id; ui.selEvent = tr.eventIdx; renderTrain(); });
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
    if (msg) toast(msg);
    renderScheme(); renderRku(); renderIndicators();
  }
  function routeForEnd(end) {
    const t = pickTargets();
    return t.routes.find((r) => r.ends.includes(end)) ||
      (D.sections[end] && t.routes.find((r) => r.ends.includes(D.sections[end].group) || r.ends.includes(end)));
  }
  function finishPick(endId) {
    const r = routeForEnd(endId);
    if (!r) { toast("Маршруту від " + ui.pick.from + " до «" + endName(endId) + "» немає. Виберіть підсвічений кінець або Esc — відміна набору.", "err"); return; }
    const mode = ui.pick.mode;
    const res = sim.setRoute(r.id, null, mode, true);
    if (res.ok) { stopPick(); toast("Маршрут " + r.id + ": стрілки переводяться, після замикання світлофор відкриється.", "ok"); }
    else toast("Маршрут " + r.id + " не встановлено: " + res.err + ". Виберіть інший кінець або Esc.", "err");
    refresh();
  }
  // a line from the start signal to the cursor (green — train, yellow — shunting)
  svg.addEventListener("pointermove", (ev) => {
    if (!ui.pick) return;
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const m = svg.getScreenCTM(); if (!m) return;
    const q = p.matrixTransform(m.inverse());
    const g = sigGeom(D.signals[ui.pick.from]);
    pickLayer.innerHTML = "";
    el("line", { x1: g.lx, y1: g.yy, x2: q.x, y2: q.y, class: "pick-line " + ui.pick.mode }, pickLayer);
    el("text", { x: q.x + 6, y: q.y - 6, class: "pick-x " + ui.pick.mode }, pickLayer).textContent = "✕";
  });
  svg.addEventListener("click", (ev) => { if (ui.pick && ev.target === svg) toast("Виберіть кінцевий світлофор або колію. Esc — відміна набору."); });

  function onObjectClick(o, ev) {
    if (ev) ev.stopPropagation();
    if (ui.pick) {
      if (o.kind === "sig" || o.kind === "end") return finishPick(o.id);
      if (o.kind === "sec") return finishPick(o.id);
      return;
    }
    select(o);
  }

  // ---------- indicators (handbook table 2.21) ----------
  function renderIndicators() {
    const S = sim.S;
    const kit = (k) => { const rid = S.kits[k]; if (!rid) return null; const st = S.routes[rid]; return st ? Math.max(0, st.until - S.time) : null; };
    [["indFree", "free", "ВІЛЬН."], ["indTrain", "train", "ПОЇЗД."], ["indShunt", "shunt", "МАНЕВР."]].forEach(([id, k, name]) => {
      const left = kit(k); $(id).classList.toggle("lit", left != null); $(id).textContent = left != null ? name + " " + left + "с" : name;
    });
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
  function select(o) { ui.sel = o; renderRku(); renderScheme(); $("rkuCard").classList.toggle("open", !!o); }
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
      const rid = sim.routeFromSignal(s.id), rs = rid && S.routes[rid];
      const hasTrain = sim.routesFrom(s.id, "train").length, hasShunt = sim.routesFrom(s.id, "shunt").length;
      h += `<dl class="kv"><dt>Світлофор</dt><dd><b>${esc(s.id)}</b> · ${kindName}</dd><dt>Показання</dt><dd>${st.open ? (st.aspect === "white" ? "білий — маневри дозволено" : "зелений — поїзд прийняти/відправити") : sg.kind === "shunt" ? "синій — маневри заборонено" : "червоний — заборонено"}${st.inv ? " + запрошувальний" : ""}${st.blocked ? " · ЗАБЛОКОВАНО" : ""}</dd>
        ${rid ? `<dt>Маршрут</dt><dd>${esc(rid)} — ${routeStateName[rs.state] || rs.state}</dd>` : ""}${sg.note ? `<dt>Примітка</dt><dd>${esc(sg.note)}</dd>` : ""}</dl><div class="menu">`;
      if (hasTrain) h += B("pick", "train", "Встановити поїзний маршрут", { dis: !!rid || st.blocked });
      if (hasShunt) h += B("pick", "shunt", "Встановити маневровий маршрут", { dis: !!rid || st.blocked });
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
      if (!occ && !st.lock && info.kind !== "approach" && info.kind !== "exit") h += B("loco", s.id, "Поставити маневровий локомотив");
      if (occ && occ.loco) h += B("locodel", String(occ.id), "Прибрати локомотив");
      h += `</div><details class="train-faults"><summary>Навчання: несправності</summary><div class="menu">${B("secfault", s.id, st.falseOcc ? "Усунути хибну зайнятість" : "Ввести хибну зайнятість")}</div></details>`;
    } else if (s.kind === "marker") {
      const m = (T.markers || []).find((x) => x.id === s.id);
      h += `<dl class="kv"><dt>Об'єкт</dt><dd><b>${esc(m.id)}</b></dd></dl><p class="hint">${esc(m.note)}</p>`;
    } else if (s.kind === "end") {
      const b = (T.endButtons || []).find((x) => x.id === s.id);
      h += `<dl class="kv"><dt>Кнопка</dt><dd><b>${esc(b.id)}</b> · ${esc(b.note)}</dd></dl><p class="hint">Її натискають як кінець маршруту відправлення: спершу виберіть вихідний світлофор (Ч2, Ч3, Ч4, Ч6) → «Встановити поїзний маршрут».</p>`;
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
    const map = {
      open: ["ВС", "Світлофор " + a, "Повторно відкрити світлофор за замкнутим маршрутом.", false, () => sim.openSignal(a)],
      close: ["ЗС", "Світлофор " + a, "Закрити світлофор. Маршрут лишається замкнутим.", false, () => sim.closeSignal(a)],
      cancel: ["МВ", "Відміна маршруту " + a, "Світлофор закриється; маршрут розімкнеться після витримки комплекту: вільне наближення 6 с, маневровий 60 с, поїзний 180 с.", true, () => sim.cancelRoute(a)],
      inv: ["ЗС", "Запрошувальний на " + a, "Увімкнути запрошувальний сигнал (горить до 90 с). Поїзд проїде червоний зі швидкістю до 20 км/год за положенням стрілок. Перед цим переконайтесь, що стрілки стоять правильно і колія вільна.", true, () => sim.inviteSignal(a)],
      sigblock: ["БЛ", "Світлофор " + a, S.sig[a] && S.sig[a].blocked ? "Розблокувати світлофор." : "Заблокувати світлофор: набір маршрутів від нього буде неможливий.", S.sig[a] && S.sig[a].blocked, () => sim.toggleSignalBlock(a)],
      "sw+": ["ПС+", "Стрілка " + a, "Перевести стрілку в плюс.", false, () => sim.moveSwitch(a, "+")],
      "sw-": ["ПС−", "Стрілка " + a, "Перевести стрілку в мінус.", false, () => sim.moveSwitch(a, "-")],
      aux: ["ДП", "Стрілка " + a, "Допоміжне переведення при хибній зайнятості. Ви особисто переконались, що секція вільна (запис у Журналі огляду).", true, () => sim.moveSwitch(a, S.sw[a].pos === "+" ? "-" : "+", true)],
      swlock: ["ЗП", "Стрілка " + a, "Блокування / розблокування положення стрілки (замок).", S.sw[a] && S.sw[a].lockedInd, () => sim.toggleSwitchLock(a)],
      swblock: ["БЛ", "Стрілка " + a, "Блокування / розблокування стрілки.", S.sw[a] && S.sw[a].blocked, () => sim.toggleSwitchBlock(a)],
      swfault: ["НС", "Стрілка " + a, S.sw[a] && S.sw[a].lost ? "Електромеханік відновив контроль." : "Навчання: стрілка втрачає контроль положення (розріз).", false, () => sim.setFault("sw", a, !S.sw[a].lost)],
      secblock: ["БЛ", "Ділянка " + a, "Блокування / розблокування ділянки.", S.sec[a] && S.sec[a].blocked, () => sim.toggleSectionBlock(a)],
      art: ["ШР", "Ділянка " + a, "Штучне розмикання з витримкою " + Math.round(P.artReleaseSec / 60) + " хв. Переконайтесь, що рухомого складу на ділянці немає.", true, () => sim.artRelease(a)],
      secfault: ["НС", "Ділянка " + a, S.sec[a] && S.sec[a].falseOcc ? "Усунути хибну зайнятість." : "Навчання: ділянка показуватиме зайнятість без поїзда.", false, () => sim.setFault("sec", a, !S.sec[a].falseOcc)],
      loco: ["ЛК", "Ділянка " + a, "Поставити маневровий локомотив. Він рушить, коли перед ним відкриється маневровий світлофор.", false, () => sim.spawnLoco(a)],
      locodel: ["ЛК", "Локомотив", "Прибрати маневровий локомотив зі схеми.", false, () => sim.removeLoco(+a)]
    };
    const [mn, obj, desc, resp, fn] = map[c];
    confirmCmd(mn, obj, desc, resp, fn);
  });

  let pending = null;
  function confirmCmd(mn, obj, desc, resp, fn) {
    const code = String(100 + Math.floor(rnd() * 900));
    pending = { fn, resp, code };
    $("mTitle").textContent = obj;
    $("mBody").innerHTML = `<p><b>${esc(mn)}</b> — ${esc(desc)}</p>` + (resp
      ? `<p class="resp">Відповідальна команда. Потрібен код пильності — три цифри, щоразу нові:</p>
         <div class="code">${code}</div>
         <label class="codein">Введіть код: <input id="mCode" inputmode="numeric" maxlength="3" autocomplete="off" value="${ui.autoCode ? code : ""}"></label>
         <p class="hint">${ui.autoCode ? "Навчальний режим: код уже вписано, натисніть «Виконати»." : "Перепишіть три цифри в поле."}</p>`
      : "");
    $("modal").hidden = false;
    (resp && !ui.autoCode ? $("mCode") : $("mOk")).focus();
  }
  function closeModal() { $("modal").hidden = true; pending = null; }
  $("mCancel").onclick = () => { if (pending) sim.log("cmd", "Команду відмінено ДСП"); closeModal(); refresh(); };
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
  sim.on((e) => { if (e.approach) beep(); });

  // recommendation: which routes to set for an event
  function advice(ev) {
    if (!ev.parity || !ev.recTrack) return null;
    const entry = T.entrySignal[ev.parity];
    const rIn = Object.values(D.routes).find((r) => r.from === entry && r.to === ev.recTrack);
    const exitSec = Object.keys(T.exitSignals[ev.parity]).find((k) => k.startsWith(ev.recTrack + "-"));
    const exitSig = T.exitSignals[ev.parity][exitSec];
    const rOut = exitSig && Object.values(D.routes).find((r) => r.from === exitSig && r.type === "train");
    return { track: trackName(ev.recTrack), entry, rIn: rIn && rIn.id, inEnd: rIn && rIn.ends[0], exitSig, outEnd: rOut && rOut.ends[0] };
  }

  const statusInfo = (ev) => {
    const late = sim.lateMin(ev);
    if (ev.status === "config") return ["p-config", "уточнити"];
    if (ev.status === "passed") return [late > 0 ? "p-late" : "p-passed", late > 0 ? "проїхав, запізн. " + late + " хв" : "проїхав за графіком"];
    if (ev.status === "waiting") return ["p-late", "затримано на перегоні" + (late ? " +" + late + " хв" : "")];
    if (ev.status === "active") {
      const tr = sim.S.trains.find((t) => t.id === ev.trainId);
      const txt = tr ? tr.status : "активний";
      return [late > 0 ? "p-late" : tr && tr.wait ? "p-waiting" : "p-active", txt + (late > 0 ? " · запізн. " + late + " хв" : "")];
    }
    return ["p-planned", "модельний час"];
  };
  const typeShort = { passenger: "пас.", freight: "ван.", shunting: "ман.", electric: "ел.", intercity: "ІС", test: "тест" };

  function renderEvents(full) {
    const S = sim.S, tb = $("evTable").tBodies[0];
    if (full || tb.rows.length !== S.events.length) {
      tb.innerHTML = S.events.map((ev, i) => {
        const a = advice(ev);
        return `<tr class="ev" data-i="${i}"><td>${esc(ev.ev.time)}</td><td><b>${esc(ev.ev.train)}</b></td><td>${typeShort[ev.ev.type] || ""}</td><td>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)}</td><td>${a ? esc(a.track.replace("колія ", "")) : "—"}</td><td class="stc"></td><td><input type="number" min="0" max="600" value="${ev.delayMin}" data-d="${i}" aria-label="Затримка поїзда ${esc(ev.ev.train)}, хв"></td></tr>`;
      }).join("");
    }
    S.events.forEach((ev, i) => {
      const row = tb.rows[i]; const [cls, txt] = statusInfo(ev);
      const html = `<span class="pill ${cls}" title="${ev.needsConfig ? esc(ev.needsConfig) : "Час вигаданий (" + ev.ev.timeStatus + ")"}">${esc(txt)}</span>`;
      const c = row.querySelector(".stc"); if (c.innerHTML !== html) c.innerHTML = html;
      row.classList.toggle("sel", ui.selEvent === i);
      const inp = row.querySelector("input"); inp.disabled = !(ev.status === "planned" || ev.status === "waiting");
    });
  }
  $("evTable").addEventListener("change", (e) => { const i = e.target.dataset.d; if (i == null) return; sim.setDelay(+i, Math.max(0, +e.target.value || 0)); refresh(); });
  $("evTable").addEventListener("click", (e) => { if (e.target.tagName === "INPUT") return; const r = e.target.closest("tr.ev"); if (!r) return; ui.selEvent = +r.dataset.i; const ev = sim.S.events[ui.selEvent]; ui.selTrain = ev.trainId; renderTrain(); renderEvents(); });

  function adviceHtml(ev) {
    const a = advice(ev); if (!a) return "";
    const note = ev.ev.note ? `<div class="adv-note">${esc(ev.ev.note)}</div>` : "";
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
    const html = `<div class="next"><span class="big">${esc(ev.ev.train)}</span><span>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)} · ${typeShort[ev.ev.type] || ""} · <span class="pill ${cls}">${esc(txt)}</span></span>
      <span class="hint">о ${E.fmt(at).slice(0, 5)}</span><span>${late > 0 ? `<b class="late">Запізнюється на ${late} хв</b>` : dt > 0 ? "через " + Math.floor(dt / 60) + " хв " + (dt % 60) + " с" : "зараз"}${ev.delayMin ? " · задана затримка " + ev.delayMin + " хв" : ""}</span></div>` + adviceHtml(ev);
    if ($("nextBox").__h !== html) { $("nextBox").innerHTML = html; $("nextBox").__h = html; }
  }

  function renderTrain() {
    const box = $("trainBox"), S = sim.S;
    const tr = ui.selTrain != null ? S.trains.find((t) => t.id === ui.selTrain) : null;
    const ev = ui.selEvent != null ? S.events[ui.selEvent] : tr && tr.eventIdx != null ? S.events[tr.eventIdx] : null;
    let h;
    if (!tr && !ev) { h = null; }
    else if (!tr) {
      h = `<dl class="kv"><dt>Поїзд</dt><dd><b>${esc(ev.ev.train)}</b> (${esc(typeShort[ev.ev.type] || ev.ev.type)})</dd><dt>Час (модель)</dt><dd>${esc(ev.ev.time)}${ev.delayMin ? " + " + ev.delayMin + " хв" : ""}</dd><dt>Напрямок</dt><dd>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)}</dd><dt>Стан</dt><dd>${esc(statusInfo(ev)[1])}</dd>${ev.needsConfig ? `<dt>Потрібно</dt><dd>${esc(ev.needsConfig)}</dd>` : ""}</dl>` + adviceHtml(ev);
    } else {
      const late = ev ? sim.lateMin(ev) : 0;
      h = `<dl class="kv"><dt>Поїзд</dt><dd><b>${esc(tr.num)}</b> · ${esc(typeShort[tr.type] || tr.type)}${tr.parity ? " · " + (tr.parity === "odd" ? "непарний" : "парний") : ""}</dd>
        <dt>Довжина</dt><dd>${tr.len} бл. (модель)</dd><dt>Стан</dt><dd>${esc(tr.status)}</dd>${late > 0 ? `<dt>Запізнення</dt><dd><b class="late">${late} хв</b></dd>` : ""}
        <dt>Займає</dt><dd>${esc(tr.occ.join(", "))}</dd><dt>Наступний сигнал</dt><dd>${esc(tr.nextSignal || "—")}</dd>
        <dt>Чекав</dt><dd>${tr.waitSec ? Math.round(tr.waitSec / 60) + " хв" : "—"}</dd></dl>` + (ev ? adviceHtml(ev) : "");
    }
    if (box.__h === h) return;
    box.__h = h;
    if (h == null) { box.className = "hint"; box.textContent = "Виберіть поїзд на схемі або в графіку."; } else { box.className = ""; box.innerHTML = h; }
  }

  function renderLog(full) {
    const L = sim.S.log, box = $("log");
    if (full) { box.innerHTML = ""; ui.logCount = 0; }
    const frag = document.createDocumentFragment();
    for (let i = ui.logCount; i < L.length; i++) {
      const l = L[i];
      if (ui.logFilter !== "all" && !(ui.logFilter === "cmd" ? l.kind === "cmd" : ui.logFilter === "train" ? l.kind === "train" : ui.logFilter === "delay" ? l.kind === "delay" : l.kind === "error" || l.kind === "warn")) continue;
      const d = document.createElement("div");
      d.innerHTML = `<span class="t">Д${l.day} ${E.fmt(l.t)}</span><span class="${l.kind}">${esc(l.text)}</span>`;
      frag.prepend(d);
    }
    const added = L.length - ui.logCount;
    ui.logCount = L.length;
    box.prepend(frag);
    while (box.childNodes.length > 600) box.removeChild(box.lastChild);
    if (!full && added > 0) { const last = L[L.length - 1]; if (last.kind === "error") toast(last.text, "err"); }
  }
  $("logFilters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.logFilter = b.dataset.f; [...$("logFilters").children].forEach((x) => x.classList.toggle("on", x === b)); renderLog(true); });

  function renderClock() {
    const S = sim.S;
    $("clock").textContent = E.fmt(S.time);
    $("dateLine").textContent = "Доба " + S.day + " · умовна дата 28.10.2014" + (S.paused ? " · зупинено" : "");
  }

  function refresh(full) { renderClock(); renderScheme(); renderIndicators(); renderEvents(full); renderNext(); renderTrain(); renderRku(); renderLog(full); }

  // ---------- controls ----------
  function setRunning(r) { ui.running = r; $("btnPlay").textContent = r ? "⏸ Пауза" : "▶ Пуск"; $("btnPlay").classList.toggle("on", r); }
  $("btnPlay").onclick = () => { if (sim.S.paused) { toast("Доба завершена. Скиньте добу або оберіть «новий день».", "err"); return; } setRunning(!ui.running); };
  $("speedSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.speed = +b.dataset.s; [...$("speedSeg").children].forEach((x) => x.classList.toggle("on", x === b)); sim.log("cmd", "Швидкість x" + ui.speed); renderLog(); });
  $("btnReset").onclick = () => {
    sim.reset({ auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0; if (ui.pick) stopPick();
    toast("Добу скинуто на 00:00:00.", "ok"); refresh(true);
  };
  $("chkAuto").onchange = (e) => { sim.S.auto = e.target.checked; sim.log("cmd", "Автодиспетчер " + (sim.S.auto ? "увімкнено: маршрути задає система" : "вимкнено: маршрути задає ДСП")); refresh(); };
  $("chkCode").onchange = (e) => { ui.autoCode = e.target.checked; };
  $("chkSound").onchange = (e) => { ui.sound = e.target.checked; };
  $("selEnd").onchange = (e) => { sim.S.endMode = e.target.value; };
  $("chkShunt").onchange = (e) => {
    sim.S.shuntingEnabled = e.target.checked;
    sim.S.events.forEach((ev) => { if (ev.ev.action === "shunting_sequence" && (ev.status === "config" || ev.status === "planned")) { ev.needsConfig = e.target.checked ? null : "маневровий сценарій вимкнено в налаштуваннях"; ev.status = e.target.checked ? "planned" : "config"; } });
    sim.log("cmd", "Маневровий сценарій " + (e.target.checked ? "увімкнено" : "вимкнено"));
    refresh(true);
  };
  $("btnSkip").onclick = () => {
    const S = sim.S; let n = 0;
    if (!sim.isIdle()) { toast("На станції є поїзди або витримки. Прокрутка недоступна.", "err"); return; }
    while (sim.isIdle() && n < 86400 && !S.paused) { sim.step(); n++; }
    sim.log("cmd", "Прокрутка часу на " + Math.round(n / 60) + " хв");
    refresh();
  };
  function applySource(msg) {
    sim.setSchedule(scheduleSource(), { auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0;
    toast(msg, "ok"); refresh(true);
  }
  $("selSrc").onchange = (e) => { src.kind = e.target.value; $("genCtl").hidden = src.kind !== "gen"; applySource(src.kind === "gen" ? "Згенеровано новий модельний графік." : "Завантажено графік із завдання (24 події)."); };
  $("selLevel").onchange = (e) => { src.level = e.target.value; applySource("Інтенсивність змінено, графік перегенеровано."); };
  $("btnGen").onclick = () => { src.seed = Math.max(1, Math.floor(+$("inSeed").value || 1)); applySource("Графік згенеровано, номер варіанта " + src.seed + "."); };
  $("btnNewSeed").onclick = () => { src.seed = 1 + Math.floor(rnd() * 99999); $("inSeed").value = src.seed; applySource("Новий випадковий графік, номер варіанта " + src.seed + "."); };
  $("btnHelp").onclick = () => { $("help").hidden = false; $("helpClose").focus(); };
  $("helpClose").onclick = () => { $("help").hidden = true; };
  $("help").addEventListener("click", (e) => { if (e.target === $("help")) $("help").hidden = true; });
  const tracks = { odd: ["IП", "3П", "4П", "6П"], even: ["IIП", "4П", "6П", "3П"] };
  function fillTracks() { $("tTrack").innerHTML = `<option value="">авто</option>` + tracks[$("tPar").value].map((t) => `<option value="${t}">${trackName(t)}</option>`).join(""); }
  $("tPar").onchange = fillTracks; fillTracks();
  $("testForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sim.addTestTrain({ num: $("tNum").value.trim() || undefined, parity: $("tPar").value, track: $("tTrack").value || null, inMin: +$("tIn").value || 0, stopMin: +$("tStop").value || 0 });
    const m = /^(.*?)(\d+)$/.exec($("tNum").value); if (m) $("tNum").value = m[1] + (+m[2] + 1);
    toast("Тестовий поїзд створено.", "ok"); refresh();
  });
  $("tabSim").onclick = () => { $("viewSim").hidden = false; $("viewHist").hidden = true; $("tabSim").classList.add("on"); $("tabHist").classList.remove("on"); };
  $("tabHist").onclick = () => { $("viewSim").hidden = true; $("viewHist").hidden = false; $("tabHist").classList.add("on"); $("tabSim").classList.remove("on"); };
  const lvl = { plan: ["p-hist", "підтверджено планом / посібником"], source: ["p-hist", "джерело наведено, не перевірено повністю"], unconfirmed: ["p-planned", "не підтверджено"] };
  $("histList").innerHTML = window.HISTORY_NOTES.map((n) => `<div class="hist-item"><span class="pill ${lvl[n.level][0]}">${lvl[n.level][1]}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p>${n.links.map(([t, u]) => `<div><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></div>`).join("")}</div>`).join("");

  // ---------- loop (fixed 1-second simulation steps) ----------
  let acc = 0, last = performance.now(), lastRender = 0;
  function frame(now) {
    const dt = Math.min(0.5, (now - last) / 1000); last = now;
    if (ui.running && !sim.S.paused) {
      acc += dt * ui.speed;
      let n = 0;
      while (acc >= 1 && n < 900) { sim.step(); acc -= 1; n++; }
      if (sim.S.paused) setRunning(false);
    }
    if (now - lastRender > 120) { lastRender = now; refresh(); }
    requestAnimationFrame(frame);
  }
  // zoom: width of the diagram in px (0 = fit the window)
  const ZOOMS = [0, 1300, 1700, 2200, 2900];
  ui.zoom = window.innerWidth >= 2200 ? 0 : 3;
  function applyZoom() {
    const w = ZOOMS[ui.zoom];
    svg.style.width = w ? w + "px" : "100%";
    svg.style.minWidth = w ? w + "px" : "0";
  }
  $("zoomSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const z = +b.dataset.z;
    ui.zoom = z === 0 ? 0 : Math.max(0, Math.min(ZOOMS.length - 1, ui.zoom + z));
    applyZoom();
  });
  applyZoom();
  if (window.innerWidth < 720) $("settings").open = false;
  buildSvg();
  refresh(true);
  requestAnimationFrame(frame);
  window.__sim = sim; // for tests
})();

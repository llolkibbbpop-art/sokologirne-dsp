/* UI layer: renders the station diagram (АРМ-style console) and panels, issues commands to the engine. */
(function () {
  "use strict";
  const T = window.TOPOLOGY, P = window.MODEL_PARAMS, E = window.SimEngine;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  let sim = E.createSim(T, window.SCHEDULE, P, { auto: false });
  const D = sim.D;
  const ui = { running: true, speed: 1, mode: "train", sel: null, selTrain: null, selEvent: null, logFilter: "all", logCount: 0, autoCode: true };
  let seed = 20141028;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); // UI only (vigilance codes)

  // Signal lamp colours (handbook table 2.14). Set via style, not presentation attributes.
  const LAMP = { red: "#ff2b2b", green: "#2fe05a", white: "#ffffff", blue: "#2f6bff", off: "#5c5c5c" };

  const pt = (n) => T.nodes[n];
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const trackName = (g) => (g ? "колія " + g.replace("П", "") : "");
  const routeTitle = (r) => {
    const to = D.sections[r.sections[r.sections.length - 1]];
    if (r.to === "НУП") return r.from + " → відправлення на Партизани";
    if (r.to === "ЧУП") return r.from + " → відправлення на Якимівку";
    return r.from + " → прийом на " + trackName(to.group || r.to);
  };

  // ---------- diagram ----------
  const svg = $("scheme");
  const edgeEls = [], swEls = {}, sigEls = {};
  let trainLayer;
  const swLegEdge = {};
  T.switches.forEach((s) => {
    swLegEdge[s.node + "|" + s.plus] = swLegEdge[s.plus + "|" + s.node] = { sw: s.id, leg: "+", node: s.node };
    swLegEdge[s.node + "|" + s.minus] = swLegEdge[s.minus + "|" + s.node] = { sw: s.id, leg: "-", node: s.node };
  });

  function shrunk(a, b, cutA, cutB) {
    let [x1, y1] = pt(a), [x2, y2] = pt(b);
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    x1 += ux * cutA; y1 += uy * cutA; x2 -= ux * cutB; y2 -= uy * cutB;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`;
  }

  function buildSvg() {
    svg.innerHTML = "";
    const nodeSecs = {};
    T.edges.forEach(([a, b, sec]) => [a, b].forEach((n) => (nodeSecs[n] = nodeSecs[n] || new Set()).add(sec)));
    const isJoint = (n) => nodeSecs[n].size > 1 && !/^S/.test(n);
    // platforms and notes (from the plan drawing)
    [[1089, 100, 238, 37], [1065, 270, 497, 11], [1065, 339, 497, 11]].forEach(([x, y, w, h]) => el("rect", { x, y, width: w, height: h, class: "platform" }, svg));
    const note = (x, y, t, cls) => (el("text", { x, y, class: cls || "note" }, svg).textContent = t);
    note(-150, 225, "← ЯКИМІВКА · парний"); note(2440, 352, "ПАРТИЗАНИ · непарний →");
    note(330, 70, "Тяг. підст. ЕЧ-4"); note(2122, 176, "ПЧ-4"); note(2385, 205, "1272 км+302 м");
    el("line", { x1: 2375, y1: 195, x2: 2375, y2: 355, class: "border" }, svg);
    const gOut = el("g", {}, svg), gIn = el("g", {}, svg), gHit = el("g", {}, svg);
    edgeEls.length = 0;
    T.edges.forEach(([a, b, sec]) => {
      const leg = swLegEdge[a + "|" + b];
      const ca = isJoint(a) ? 3 : 0, cb = isJoint(b) ? 3 : 0;
      const d = shrunk(a, b, ca, cb);
      // an inactive switch leg is drawn cut back from the switch point
      const dOff = leg ? shrunk(a, b, leg.node === a ? 12 : ca, leg.node === b ? 12 : cb) : d;
      const o = el("path", { d, class: "tube-o" }, gOut);
      const i = el("path", { d, class: "tube-i" }, gIn);
      const hit = el("path", { d, class: "hit" }, gHit);
      el("title", {}, hit).textContent = (D.sections[sec].label || "Стрілочна секція") + " · " + sec;
      hit.addEventListener("click", () => select({ kind: "sec", id: sec }));
      edgeEls.push({ o, i, sec, leg, d, dOff, off: false });
    });
    T.labels.forEach(([t, x, y]) => (el("text", { x, y: y - 6, class: "trk-label" }, svg).textContent = t));
    [["2НП", -95], ["1НП", 15]].forEach(([t, x]) => (el("text", { x, y: 316, class: "blk-label" }, svg).textContent = t));
    [["1ЧП", 2525], ["2ЧП", 2655]].forEach(([t, x]) => (el("text", { x, y: 246, class: "blk-label" }, svg).textContent = t));
    [["1НУП", 2495], ["2НУП", 2645]].forEach(([t, x]) => (el("text", { x, y: 316, class: "blk-label" }, svg).textContent = t));
    [["1ЧУП", 105], ["2ЧУП", -65]].forEach(([t, x]) => (el("text", { x, y: 246, class: "blk-label" }, svg).textContent = t));
    // switches
    T.switches.forEach((s) => {
      const [x, y] = pt(s.node);
      const g = el("g", { class: "swg" }, svg);
      const below = s.label ? s.label > 0 : pt(s.minus)[1] < y;
      el("rect", { x: x - 12, y: below ? y - 6 : y - 22, width: 24, height: 28, class: "sw-hit" }, g);
      const t = el("text", { x, y: below ? y + 20 : y - 11, "text-anchor": "middle", class: "sw-label" }, g); t.textContent = s.id;
      const lk = el("text", { x: x + 12, y: below ? y + 20 : y - 11, class: "sw-lock" }, g); lk.textContent = "🔒";
      const bl = el("rect", { x: x - 7, y: below ? y + 24 : y - 7, width: 14, height: 5, class: "sw-block" }, g);
      el("title", {}, g).textContent = "Стрілка " + s.id;
      g.addEventListener("click", () => select({ kind: "sw", id: s.id }));
      swEls[s.id] = { t, lk, bl };
    });
    // shunting signals not included in the model: drawn hollow (handbook: objects outside control look different)
    T.decorSignals.forEach(([id, x, y]) => {
      const g = el("g", { class: "decor" }, svg);
      el("circle", { cx: x, cy: y, r: 5 }, g);
      const t = el("text", { x: x + 8, y: y + 4 }, g); t.textContent = id;
      el("title", {}, g).textContent = id + ": маневровий світлофор, у моделі не керується";
    });
    // working signals
    T.signals.forEach((s) => {
      const [x, y] = pt(s.node);
      const yy = y + s.side * 15;
      const g = el("g", { class: "sig" }, svg);
      const dir = s.dir === "R" ? 1 : -1;
      el("line", { x1: x, y1: yy - 6, x2: x, y2: yy + 6, class: "mast" }, g);
      el("line", { x1: x, y1: yy, x2: x + dir * 5, y2: yy, class: "mast" }, g);
      const lamp = el("circle", { cx: x + dir * 12, cy: yy, r: 6.5, class: "lamp" }, g);
      const t = el("text", { x: dir > 0 ? x - 4 : x + 4, y: yy + 4, "text-anchor": dir > 0 ? "end" : "start" }, g); t.textContent = s.id;
      el("title", {}, g).textContent = "Світлофор " + s.id + (s.note ? " — " + s.note : "");
      if (s.kind !== "decor") g.addEventListener("click", () => select({ kind: "sig", id: s.id }));
      else g.classList.add("nocontrol");
      sigEls[s.id] = { g, lamp };
    });
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
    edgeEls.forEach((e) => {
      const st = S.sec[e.sec];
      const cls = [];
      if (st.occ) cls.push("occ");
      else if (st.lock) {
        const rs = S.routes[st.lock];
        cls.push(rs && rs.mode === "shunt" ? "lk-shunt" : "lk-train");
        if (rs && rs.state === "cancelling") cls.push("blink");
      }
      if (st.blocked) cls.push("blocked");
      if (st.artUntil != null) cls.push("blink");
      const off = !!(e.leg && S.sw[e.leg.sw].pos !== e.leg.leg);
      if (off) cls.push("off");
      if (ui.sel && ui.sel.kind === "sec" && ui.sel.id === e.sec) cls.push("sel");
      const c = cls.join(" ");
      if (e.c !== c) { e.o.setAttribute("class", "tube-o " + c); e.i.setAttribute("class", "tube-i " + c); e.c = c; }
      if (e.off !== off) { e.o.setAttribute("d", off ? e.dOff : e.d); e.i.setAttribute("d", off ? e.dOff : e.d); e.off = off; }
    });
    for (const [id, e] of Object.entries(swEls)) {
      const st = S.sw[id];
      e.t.setAttribute("class", "sw-label" + (st.pos === "-" ? " minus" : "") + (ui.sel && ui.sel.kind === "sw" && ui.sel.id === id ? " sel" : ""));
      e.lk.style.display = st.lockedInd ? "" : "none";
      e.bl.style.display = st.blocked ? "" : "none";
    }
    for (const [id, e] of Object.entries(sigEls)) {
      const sg = D.signals[id], st = S.sig[id] || {};
      let c;
      if (sg.kind === "decor") c = LAMP.off;
      else if (st.open) c = st.aspect === "white" || sg.kind === "shunt" ? LAMP.white : LAMP.green;
      else c = sg.kind === "shunt" ? LAMP.blue : LAMP.red;
      if (e.lamp.style.fill !== c) e.lamp.style.fill = c;
      e.g.classList.toggle("sel", !!(ui.sel && ui.sel.kind === "sig" && ui.sel.id === id));
    }
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
      el("title", {}, g).textContent = "Поїзд " + tr.num + ": " + tr.status;
      g.addEventListener("click", () => { ui.selTrain = tr.id; ui.selEvent = tr.eventIdx; renderTrain(); });
    });
  }

  // ---------- indicators (handbook table 2.21) ----------
  function renderIndicators() {
    const S = sim.S;
    const canc = Object.values(S.routes).filter((r) => r.state === "cancelling");
    $("indTrain").classList.toggle("lit", canc.some((r) => r.mode !== "shunt"));
    $("indShunt").classList.toggle("lit", canc.some((r) => r.mode === "shunt"));
    $("indIR").classList.toggle("lit", Object.values(S.sec).some((s) => s.artUntil != null));
    $("indAuto").textContent = S.auto ? "АВТОДИСП." : "РУЧНЕ";
    $("indAuto").classList.toggle("on", S.auto);
  }

  // ---------- panels ----------
  function toast(msg, kind) { const t = $("toast"); t.textContent = msg; t.className = "toast" + (kind ? " " + kind : ""); }
  function select(o) { ui.sel = o; renderRku(); renderScheme(); }
  const routeStateName = { set: "задано, світлофор закритий", open: "світлофор відкрито", used: "поїзд у маршруті", cancelling: "розмикання з витримкою…" };

  function renderRku() {
    const box = $("rku"), S = sim.S, s = ui.sel;
    if (!s) { if (box.__h !== null) { box.className = "hint"; box.textContent = "Клацніть світлофор, стрілку або блок колії на схемі."; box.__h = null; } return; }
    box.className = "";
    let h = "";
    if (s.kind === "sig") {
      const sg = D.signals[s.id], st = S.sig[s.id];
      const routes = Object.values(D.routes).filter((r) => r.from === s.id);
      const kindName = sg.kind === "entry" ? "вхідний" : sg.kind === "exit" ? "вихідний" : sg.kind === "shunt" ? "маневровий" : "не керується";
      h += `<dl class="kv"><dt>Світлофор</dt><dd><b>${esc(s.id)}</b> · ${kindName}</dd><dt>Стан</dt><dd>${st.open ? (st.aspect === "white" || sg.kind === "shunt" ? "відкритий, білий (маневровий)" : "відкритий, зелений") : "закритий"}</dd>${sg.note ? `<dt>Примітка</dt><dd>${esc(sg.note)}</dd>` : ""}</dl>`;
      if (sg.kind === "decor") { h += `<p class="hint">Цей світлофор показано для орієнтації, у моделі ним не керують.</p>`; }
      else {
        const shuntOnly = routes.every((r) => r.type === "shunt");
        h += `<p class="hint">Режим набору: <b>${shuntOnly || ui.mode === "shunt" ? "маневровий (білий)" : "поїзний (зелений)"}</b>${shuntOnly ? "" : " · перемикається кнопками ПОЇЗДН. / МАНЕВР. над схемою"}.</p>`;
        h += `<div class="rku-routes">`;
        routes.forEach((r) => {
          const rs = S.routes[r.id];
          const chk = rs ? null : sim.checkRoute(r.id);
          h += `<div class="rku-route${chk ? " dis" : ""}"><b>${esc(routeTitle(r))}</b><span class="st">${rs ? routeStateName[rs.state] + (rs.mode === "shunt" ? " · маневровий" : "") : chk ? "недоступний: " + esc(chk) : "можна задати"}</span>
            <span class="rbtns"><button data-c="set" data-a="${esc(r.id)}" ${rs ? "disabled" : ""}>Задати маршрут</button>
            <button data-c="cancel" data-a="${esc(r.id)}" class="danger" ${rs && rs.state !== "used" && rs.state !== "cancelling" ? "" : "disabled"}>Відмінити</button></span></div>`;
        });
        h += `</div><div class="btns"><button data-c="open" data-a="${esc(s.id)}">Відкрити світлофор</button><button data-c="close" data-a="${esc(s.id)}">Закрити світлофор</button></div>`;
      }
    } else if (s.kind === "sw") {
      const st = S.sw[s.id], sw = D.switches[s.id];
      h += `<dl class="kv"><dt>Стрілка</dt><dd><b>${esc(s.id)}</b> · секція ${esc(sw.section)}</dd><dt>Положення</dt><dd>${st.pos === "+" ? "плюс (пряме)" : "мінус (на відгалуження)"}</dd><dt>Замикання</dt><dd>${S.sec[sw.section].lock ? "у маршруті " + esc(S.sec[sw.section].lock) : st.lockedInd ? "індивідуальне" : "ні"}</dd><dt>Блокування</dt><dd>${st.blocked ? "так" : "ні"}</dd></dl>`;
      h += `<div class="btns"><button data-c="sw+" data-a="${s.id}">В плюс</button><button data-c="sw-" data-a="${s.id}">В мінус</button>
        <button data-c="swlock" data-a="${s.id}">${st.lockedInd ? "Розімкнути" : "Замкнути в положенні"}</button>
        <button data-c="swblock" data-a="${s.id}">${st.blocked ? "Деблокувати" : "Блокувати"}</button></div>`;
    } else if (s.kind === "sec") {
      const st = S.sec[s.id], info = D.sections[s.id];
      const occ = st.occ ? S.trains.find((t) => t.id === st.occ) : null;
      h += `<dl class="kv"><dt>Блок</dt><dd><b>${esc(s.id)}</b> · ${esc(info.label || "стрілочна секція")}</dd><dt>Зайнятість</dt><dd>${occ ? "зайнята поїздом " + esc(occ.num) : "вільна"}</dd><dt>Замикання</dt><dd>${st.lock ? "маршрут " + esc(st.lock) : "ні"}${st.artUntil != null ? " · штучне розмикання до " + E.fmt(st.artUntil) : ""}</dd></dl>`;
      h += `<div class="btns"><button data-c="secblock" data-a="${esc(s.id)}">${st.blocked ? "Деблокувати" : "Блокувати"}</button><button data-c="art" data-a="${esc(s.id)}" class="danger">Штучне розмикання</button></div>`;
    }
    if (box.__h !== h) { box.innerHTML = h; box.__h = h; }
  }

  $("rku").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-c]"); if (!b || b.disabled) return;
    const c = b.dataset.c, a = b.dataset.a;
    const r = D.routes[a];
    const mode = r && r.type === "shunt" ? "shunt" : ui.mode;
    const map = {
      set: ["МН", (mode === "shunt" ? "Маневровий" : "Поїзний") + " маршрут " + a, "Перевести стрілки, перевірити вільність блоків і ворожі маршрути, замкнути маршрут і відкрити світлофор (" + (mode === "shunt" ? "білий" : "зелений") + ").", false,
        () => { const res = sim.setRoute(a, null, mode); if (!res.ok) return res; return sim.openSignal(r.from); }],
      open: ["ВС", "Світлофор " + a, "Відкрити світлофор за вже замкнутим маршрутом.", false, () => sim.openSignal(a)],
      close: ["ЗС", "Світлофор " + a, "Закрити світлофор. Маршрут лишається замкнутим.", false, () => sim.closeSignal(a)],
      cancel: ["МВ", "Відміна маршруту " + a, "Скасувати маршрут. Якщо поїзд уже на наближенні, маршрут розмикається з витримкою: поїзний 3 хв, маневровий 1 хв.", true, () => sim.cancelRoute(a)],
      "sw+": ["ПС+", "Стрілка " + a, "Перевести стрілку в плюс.", false, () => sim.moveSwitch(a, "+")],
      "sw-": ["ПС−", "Стрілка " + a, "Перевести стрілку в мінус.", false, () => sim.moveSwitch(a, "-")],
      swlock: ["ІЗ", "Стрілка " + a, "Індивідуальне замикання / розмикання стрілки.", sim.S.sw[a] && sim.S.sw[a].lockedInd, () => sim.toggleSwitchLock(a)],
      swblock: ["БЛ", "Стрілка " + a, "Блокування / деблокування стрілки.", sim.S.sw[a] && sim.S.sw[a].blocked, () => sim.toggleSwitchBlock(a)],
      secblock: ["БЛ", "Блок " + a, "Блокування / деблокування блоку.", sim.S.sec[a] && sim.S.sec[a].blocked, () => sim.toggleSectionBlock(a)],
      art: ["ШР", "Блок " + a, "Штучне розмикання блоку з витримкою " + Math.round(P.artReleaseSec / 60) + " хв.", true, () => sim.artRelease(a)]
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
      ? `<p class="resp">Це відповідальна команда. Для неї потрібен код пильності — три цифри, які система показує кожного разу нові:</p>
         <div class="code">${code}</div>
         <label class="codein">Введіть код: <input id="mCode" inputmode="numeric" maxlength="3" autocomplete="off" value="${ui.autoCode ? code : ""}"></label>
         <p class="hint">${ui.autoCode ? "Навчальний режим: код уже вписано, просто натисніть «Виконати»." : "Перепишіть три цифри з рядка вище в поле."}</p>`
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
  });

  // recommendation: which routes to set for an event
  function advice(ev) {
    if (!ev.parity || !ev.recTrack) return null;
    const entry = T.entrySignal[ev.parity];
    const rIn = Object.values(D.routes).find((r) => r.from === entry && r.to === ev.recTrack);
    const exitSec = Object.keys(T.exitSignals[ev.parity]).find((k) => k.startsWith(ev.recTrack + "-"));
    const exitSig = T.exitSignals[ev.parity][exitSec];
    return { track: trackName(ev.recTrack), entry, rIn: rIn && rIn.id, exitSig };
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
  const typeShort = { passenger: "пас.", freight: "ван.", shunting: "ман." };

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
    return `<div class="advice"><b>Порада ДСП:</b> прийміть на <b>${esc(a.track)}</b>. Клацніть світлофор <b>${esc(a.entry)}</b> → «Задати маршрут» <b>${esc(a.rIn || "")}</b>. Коли поїзд стане на колію, клацніть <b>${esc(a.exitSig || "")}</b> → «Задати маршрут» на відправлення.</div>`;
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
  $("modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return; ui.mode = b.dataset.m;
    [...$("modeSeg").children].forEach((x) => x.classList.toggle("on", x === b));
    toast(ui.mode === "shunt" ? "Режим набору: маневровий. Маршрут відкриє світлофор білим." : "Режим набору: поїзний. Маршрут відкриє світлофор зеленим.", "ok");
    renderRku();
  });
  $("btnReset").onclick = () => {
    sim.reset({ auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0;
    toast("Добу скинуто на 00:00:00.", "ok"); refresh(true);
  };
  $("chkAuto").onchange = (e) => { sim.S.auto = e.target.checked; sim.log("cmd", "Автодиспетчер " + (sim.S.auto ? "увімкнено: маршрути задає система" : "вимкнено: маршрути задає ДСП")); refresh(); };
  $("chkCode").onchange = (e) => { ui.autoCode = e.target.checked; };
  $("selEnd").onchange = (e) => { sim.S.endMode = e.target.value; };
  $("chkShunt").onchange = (e) => {
    sim.S.shuntingEnabled = e.target.checked;
    sim.S.events.forEach((ev) => { if (ev.ev.action === "shunting_sequence" && (ev.status === "config" || ev.status === "planned")) { ev.needsConfig = e.target.checked ? null : "маневровий сценарій вимкнено: призначення сигналу М9 (повернення з колії 14) — припущення, потребує підтвердження"; ev.status = e.target.checked ? "planned" : "config"; } });
    sim.log("cmd", "Маневровий сценарій " + (e.target.checked ? "увімкнено (з припущенням щодо сигналу М9)" : "вимкнено"));
    refresh(true);
  };
  $("btnSkip").onclick = () => {
    const S = sim.S; let n = 0;
    if (!sim.isIdle()) { toast("На станції є поїзди або витримки. Прокрутка недоступна.", "err"); return; }
    while (sim.isIdle() && n < 86400 && !S.paused) { sim.step(); n++; }
    sim.log("cmd", "Прокрутка часу на " + Math.round(n / 60) + " хв");
    refresh();
  };
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
  buildSvg();
  refresh(true);
  requestAnimationFrame(frame);
  window.__sim = sim; // for tests
})();

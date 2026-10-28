/* UI layer: renders the station diagram and panels, issues commands to the engine. */
(function () {
  "use strict";
  const T = window.TOPOLOGY, P = window.MODEL_PARAMS, E = window.SimEngine;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  let sim = E.createSim(T, window.SCHEDULE, P, { auto: true });
  const D = sim.D;
  const ui = { running: true, speed: 1, view: "smooth", sel: null, selTrain: null, selEvent: null, logFilter: "all", logCount: 0 };
  let seed = 20141028;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); // UI only (vigilance codes)

  const pt = (n) => T.nodes[n];
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- diagram ----------
  const svg = $("scheme");
  const edgeEls = [], swEls = {}, sigEls = {};
  let trainLayer;
  const swLegEdge = {}; // "nodeA|nodeB" -> {sw, leg}
  T.switches.forEach((s) => { swLegEdge[s.node + "|" + s.plus] = swLegEdge[s.plus + "|" + s.node] = { sw: s.id, leg: "+" }; swLegEdge[s.node + "|" + s.minus] = swLegEdge[s.minus + "|" + s.node] = { sw: s.id, leg: "-" }; });

  function edgePath(a, b, curve) {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    if (ui.view === "smooth" && y1 !== y2) {
      const dx = (x2 - x1) * 0.5;
      return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    }
    return `M${x1},${y1} L${x2},${y2}`;
  }

  function buildSvg() {
    svg.innerHTML = "";
    svg.setAttribute("class", ui.view);
    // platforms (from the plan drawing)
    [[1089, 100, 238, 37], [1065, 270, 497, 11], [1065, 339, 497, 11]].forEach(([x, y, w, h]) => el("rect", { x, y, width: w, height: h, class: "platform" }, svg));
    el("text", { x: 20, y: 243, class: "note" }, svg).textContent = "← Якимівка · парний";
    el("text", { x: 2400, y: 352, class: "note" }, svg).textContent = "Партизани · непарний →";
    el("text", { x: 330, y: 70, class: "note" }, svg).textContent = "Тяг. підст. ЕЧ-4";
    el("text", { x: 2122, y: 176, class: "note" }, svg).textContent = "ПЧ-4";
    el("text", { x: 2385, y: 205, class: "note" }, svg).textContent = "1272 км+302 м";
    el("line", { x1: 2375, y1: 195, x2: 2375, y2: 355, stroke: "#56656a", "stroke-dasharray": "6 5" }, svg);
    edgeEls.length = 0;
    T.edges.forEach(([a, b, sec, opt]) => {
      const d = edgePath(a, b, opt && opt.curve);
      const hit = el("path", { d, class: "hit" }, svg);
      const p = el("path", { d, class: "edge" }, svg);
      const legInfo = swLegEdge[a + "|" + b];
      const title = el("title", {}, hit); title.textContent = (D.sections[sec].label || sec) + " (" + sec + ")";
      hit.addEventListener("click", () => select({ kind: "sec", id: sec }));
      edgeEls.push({ p, sec, legInfo });
    });
    // insulating joints
    const nodeSecs = {};
    T.edges.forEach(([a, b, sec]) => { [a, b].forEach((n) => ((nodeSecs[n] = nodeSecs[n] || new Set()).add(sec))); });
    Object.entries(nodeSecs).forEach(([n, set]) => {
      if (set.size > 1 && !/^S/.test(n)) { const [x, y] = pt(n); el("line", { x1: x, y1: y - 6, x2: x, y2: y + 6, class: "joint" }, svg); }
    });
    T.labels.forEach(([t, x, y]) => (el("text", { x, y, class: "trk-label" }, svg).textContent = t));
    // switches
    T.switches.forEach((s) => {
      const [x, y] = pt(s.node);
      const g = el("g", {}, svg);
      const below = s.label ? s.label > 0 : pt(s.minus)[1] < y; // label side as on the plan
      el("circle", { cx: x, cy: y, r: 11, class: "sw-dot" }, g);
      const t = el("text", { x: x - 4, y: below ? y + 18 : y - 9, class: "sw-label" }, g); t.textContent = s.id;
      const lk = el("circle", { cx: x, cy: y, r: 3.2, class: "sw-lock" }, g);
      const bl = el("rect", { x: x - 7, y: below ? y + 21 : y - 6, width: 16, height: 3, class: "sw-block" }, g);
      g.addEventListener("click", () => select({ kind: "sw", id: s.id }));
      swEls[s.id] = { t, lk, bl };
    });
    // decorative shunting signals
    T.decorSignals.forEach(([id, x, y]) => {
      const g = el("g", { class: "decor" }, svg);
      el("circle", { cx: x, cy: y, r: 3.5 }, g);
      const t = el("text", { x: x + 6, y: y + 3 }, g); t.textContent = id;
      el("title", {}, g).textContent = id + ": маневровий сигнал, маршрути не моделюються";
    });
    // working signals
    T.signals.forEach((s) => {
      const [x, y] = pt(s.node);
      const yy = y + s.side * 13;
      const g = el("g", { class: "sig" + (s.source === "unclear" ? " unclear" : "") }, svg);
      const dir = s.dir === "R" ? 1 : -1;
      el("line", { x1: x, y1: yy - 5, x2: x, y2: yy + 5, class: "mast" }, g);
      el("line", { x1: x, y1: yy, x2: x + dir * 6, y2: yy, class: "mast" }, g);
      const lamp = el("circle", { cx: x + dir * 11, cy: yy, r: 5, class: "lamp" }, g);
      const t = el("text", { x: dir > 0 ? x - 4 : x + 4, y: yy + 4, "text-anchor": dir > 0 ? "end" : "start" }, g); t.textContent = s.id; // name on the mast side, as on the plan
      el("title", {}, g).textContent = s.id + (s.note ? " — " + s.note : "");
      if (s.kind !== "decor") g.addEventListener("click", () => select({ kind: "sig", id: s.id }));
      sigEls[s.id] = { g, lamp };
    });
    trainLayer = el("g", {}, svg);
    renderScheme();
  }

  function secMid(secId, tr) {
    const es = D.sections[secId].edges;
    // prefer the longest straight edge
    let best = es[0], bl = -1;
    es.forEach((e) => { const [x1, y1] = pt(e.a), [x2, y2] = pt(e.b); const l = Math.hypot(x2 - x1, y2 - y1) + (y1 === y2 ? 200 : 0); if (l > bl) { bl = l; best = e; } });
    const [x1, y1] = pt(best.a), [x2, y2] = pt(best.b);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  function renderScheme() {
    const S = sim.S;
    edgeEls.forEach(({ p, sec, legInfo }) => {
      const st = S.sec[sec];
      const cls = ["edge"];
      if (st.occ) cls.push("occ");
      else if (st.lock) { const r = D.routes[st.lock]; cls.push(r && r.type === "shunt" ? "locked-shunt" : "locked"); if (S.routes[st.lock] && S.routes[st.lock].state === "cancelling") cls.push("cancel"); }
      if (st.blocked) cls.push("blocked");
      if (st.artUntil != null) cls.push("art");
      if (D.sections[sec].source === "unclear") cls.push("unclear");
      if (legInfo && S.sw[legInfo.sw].pos !== legInfo.leg) cls.push("leg-off");
      if (ui.sel && ui.sel.kind === "sec" && ui.sel.id === sec) cls.push("sel");
      p.setAttribute("class", cls.join(" "));
    });
    for (const [id, e] of Object.entries(swEls)) {
      const st = S.sw[id];
      e.t.setAttribute("class", "sw-label" + (st.pos === "-" ? " minus" : ""));
      e.lk.style.display = st.lockedInd ? "" : "none";
      e.bl.style.display = st.blocked ? "" : "none";
    }
    for (const [id, e] of Object.entries(sigEls)) {
      const sg = D.signals[id], open = S.sig[id] && S.sig[id].open;
      const color = open ? (sg.kind === "shunt" ? "var(--sig-white)" : "var(--sig-green)") : sg.kind === "shunt" ? "#3a4a8f" : sg.kind === "decor" ? "#555" : "var(--sig-red)";
      e.lamp.setAttribute("fill", color);
      e.g.classList.toggle("sel", !!(ui.sel && ui.sel.kind === "sig" && ui.sel.id === id));
    }
    trainLayer.innerHTML = "";
    S.trains.filter((t) => !t.done).forEach((tr) => {
      const [x, y] = secMid(tr.seq[tr.idx], tr);
      const g = el("g", { class: "train " + tr.type, transform: `translate(${x},${y - 1})` }, trainLayer);
      const label = (tr.parity === "even" ? "◄ " : tr.parity === "odd" ? "" : "") + tr.num + (tr.parity === "odd" ? " ►" : "");
      const w = 10 + label.length * 7;
      el("rect", { x: -w / 2, y: -9, width: w, height: 17, rx: 3 }, g);
      el("text", { x: 0, y: 4, "text-anchor": "middle" }, g).textContent = label;
      el("title", {}, g).textContent = "Поїзд " + tr.num + ": " + tr.status;
      g.addEventListener("click", () => { ui.selTrain = tr.id; renderTrain(); });
    });
  }

  // ---------- panels ----------
  function toast(msg, kind) { const t = $("toast"); t.textContent = msg; t.className = "toast" + (kind ? " " + kind : ""); }

  function select(o) { ui.sel = o; renderRku(); renderScheme(); }

  const routeStateName = { set: "задано, сигнал закритий", open: "сигнал відкрито", used: "поїзд у маршруті", cancelling: "розмикання з витримкою" };

  function renderRku() {
    const box = $("rku"), S = sim.S, s = ui.sel;
    if (!s) { box.className = "hint"; box.textContent = "Нічого не вибрано."; box.__h = null; return; }
    box.className = "";
    let h = "";
    if (s.kind === "sig") {
      const sg = D.signals[s.id];
      h += `<dl class="kv"><dt>Світлофор</dt><dd><b>${esc(s.id)}</b> · ${sg.kind === "entry" ? "вхідний" : sg.kind === "exit" ? "вихідний" : "маневровий"}</dd><dt>Стан</dt><dd>${S.sig[s.id].open ? "відкритий" : "закритий"}</dd>${sg.note ? `<dt>Примітка</dt><dd>${esc(sg.note)}</dd>` : ""}</dl>`;
      h += `<div class="btns"><button data-c="open" data-a="${esc(s.id)}">ВС · Відкрити</button><button data-c="close" data-a="${esc(s.id)}">ЗС · Закрити</button></div>`;
      h += `<div class="rku-routes">`;
      Object.values(D.routes).filter((r) => r.from === s.id).forEach((r) => {
        const st = S.routes[r.id];
        const chk = st ? null : sim.checkRoute(r.id);
        h += `<div class="rku-route"><b>${esc(r.id)}</b><span class="st">${st ? routeStateName[st.state] : chk ? "недоступний: " + esc(chk) : "вільний для набору"}</span>
          <button data-c="set" data-a="${esc(r.id)}" ${st ? "disabled" : ""}>МН · Задати</button>
          <button data-c="cancel" data-a="${esc(r.id)}" class="danger" ${st ? "" : "disabled"}>МВ · Відміна</button></div>`;
      });
      h += `</div>`;
    } else if (s.kind === "sw") {
      const st = S.sw[s.id], sw = D.switches[s.id];
      h += `<dl class="kv"><dt>Стрілка</dt><dd><b>${esc(s.id)}</b> · секція ${esc(sw.section)}</dd><dt>Положення</dt><dd>${st.pos === "+" ? "плюс (пряме)" : "мінус (бічне)"}</dd><dt>Замикання</dt><dd>${S.sec[sw.section].lock ? "у маршруті " + esc(S.sec[sw.section].lock) : st.lockedInd ? "індивідуальне" : "ні"}</dd><dt>Блокування</dt><dd>${st.blocked ? "так" : "ні"}</dd></dl>`;
      h += `<div class="btns"><button data-c="sw+" data-a="${s.id}">ПС+ · В плюс</button><button data-c="sw-" data-a="${s.id}">ПС− · В мінус</button>
        <button data-c="swlock" data-a="${s.id}" ${st.lockedInd ? 'class="danger"' : ""}>${st.lockedInd ? "Розімкнути" : "Замкнути в положенні"}</button>
        <button data-c="swblock" data-a="${s.id}" ${st.blocked ? 'class="danger"' : ""}>${st.blocked ? "Деблокувати" : "Блокувати"}</button></div>`;
    } else if (s.kind === "sec") {
      const st = S.sec[s.id], info = D.sections[s.id];
      const occ = st.occ ? S.trains.find((t) => t.id === st.occ) : null;
      h += `<dl class="kv"><dt>Секція</dt><dd><b>${esc(s.id)}</b> · ${esc(info.label || "стрілочна/безстрілочна секція")}</dd><dt>Зайнятість</dt><dd>${occ ? "зайнята поїздом " + esc(occ.num) : "вільна"}</dd><dt>Замикання</dt><dd>${st.lock ? "маршрут " + esc(st.lock) : "ні"}${st.artUntil != null ? " · ШР до " + E.fmt(st.artUntil) : ""}</dd>${info.source === "unclear" ? "<dt>Дані</dt><dd>потребують уточнення</dd>" : ""}</dl>`;
      h += `<div class="btns"><button data-c="secblock" data-a="${esc(s.id)}">${st.blocked ? "Деблокувати" : "Блокувати"}</button><button data-c="art" data-a="${esc(s.id)}" class="danger">ШР · Штучне розмикання</button></div>`;
    }
    if (box.__h !== h) { box.innerHTML = h; box.__h = h; }
  }

  $("rku").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-c]"); if (!b) return;
    const c = b.dataset.c, a = b.dataset.a;
    const map = {
      set: ["МН", "Набір маршруту " + a, "Перевести стрілки, перевірити вільність і ворожі маршрути, замкнути маршрут.", false, () => sim.setRoute(a)],
      open: ["ВС", "Світлофор " + a, "Відкрити дозвільне показання за замкнутим маршрутом.", false, () => sim.openSignal(a)],
      close: ["ЗС", "Світлофор " + a, "Закрити світлофор. Маршрут лишається замкнутим.", false, () => sim.closeSignal(a)],
      cancel: ["МВ", "Маршрут " + a, "Відміна маршруту. Якщо ділянка наближення зайнята, розмикання з витримкою " + P.cancelDelaySec + " с.", true, () => sim.cancelRoute(a)],
      "sw+": ["ПС+", "Стрілка " + a, "Перевести стрілку в плюс.", false, () => sim.moveSwitch(a, "+")],
      "sw-": ["ПС−", "Стрілка " + a, "Перевести стрілку в мінус.", false, () => sim.moveSwitch(a, "-")],
      swlock: ["ІЗ", "Стрілка " + a, "Індивідуальне замикання / розмикання стрілки.", sim.S.sw[a] && sim.S.sw[a].lockedInd, () => sim.toggleSwitchLock(a)],
      swblock: ["БЛ", "Стрілка " + a, "Блокування / деблокування стрілки.", sim.S.sw[a] && sim.S.sw[a].blocked, () => sim.toggleSwitchBlock(a)],
      secblock: ["БЛ", "Секція " + a, "Блокування / деблокування секції.", sim.S.sec[a] && sim.S.sec[a].blocked, () => sim.toggleSectionBlock(a)],
      art: ["ШР", "Секція " + a, "Штучне розмикання секції з витримкою " + P.artReleaseSec + " с.", true, () => sim.artRelease(a)]
    };
    const [mn, obj, desc, resp, fn] = map[c];
    confirmCmd(mn, obj, desc, resp, fn);
  });

  let pending = null;
  function confirmCmd(mn, obj, desc, resp, fn) {
    const code = String(100 + Math.floor(rnd() * 900));
    pending = { fn, resp, code };
    $("mTitle").textContent = obj;
    $("mBody").innerHTML = `<p><b>${esc(mn)}</b> — ${esc(desc)}</p>` + (resp ? `<p class="resp">Відповідальна команда. Введіть код пильності:</p><div class="code">${code}</div><input id="mCode" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Код пильності">` : "");
    $("modal").hidden = false;
    (resp ? $("mCode") : $("mOk")).focus();
  }
  function closeModal() { $("modal").hidden = true; pending = null; }
  $("mCancel").onclick = () => { sim.log("cmd", "Команду відмінено ДСП"); closeModal(); refresh(); };
  $("mOk").onclick = () => {
    if (!pending) return;
    if (pending.resp && (!$("mCode") || $("mCode").value !== pending.code)) { sim.log("error", "Код пильності не збігся — відповідальну команду не виконано"); toast("Код пильності не збігся. Команду не виконано.", "err"); closeModal(); refresh(); return; }
    const r = pending.fn(); closeModal();
    toast(r && r.ok ? "Виконано." : "Відмова: " + (r && r.err), r && r.ok ? "ok" : "err");
    refresh();
  };
  document.addEventListener("keydown", (e) => { if (!$("modal").hidden) { if (e.key === "Escape") $("mCancel").click(); if (e.key === "Enter") $("mOk").click(); } });

  const statusInfo = (ev) => {
    if (ev.status === "config") return ["p-config", "уточнити"];
    if (ev.status === "passed") return [ev.lateMin > 0 ? "p-delayed" : "p-passed", ev.lateMin > 0 ? "проїхав +" + ev.lateMin + " хв" : "проїхав"];
    if (ev.status === "waiting") return ["p-waiting", "затримано"];
    if (ev.status === "active") { const tr = sim.S.trains.find((t) => t.id === ev.trainId); return [tr && tr.wait ? "p-waiting" : "p-active", tr ? tr.status : "активний"]; }
    return ["p-planned", "модель"];
  };
  const typeShort = { passenger: "пас.", freight: "ван.", shunting: "ман." };

  function renderEvents(full) {
    const S = sim.S, tb = $("evTable").tBodies[0];
    if (full || tb.rows.length !== S.events.length) {
      tb.innerHTML = S.events.map((ev, i) => `<tr class="ev" data-i="${i}"><td>${esc(ev.ev.time)}</td><td><b>${esc(ev.ev.train)}</b></td><td>${typeShort[ev.ev.type] || ""}</td><td>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)}</td><td class="stc"></td><td><input type="number" min="0" max="600" value="${ev.delayMin}" data-d="${i}" aria-label="Затримка поїзда ${esc(ev.ev.train)}, хв"></td></tr>`).join("");
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

  function renderNext() {
    const n = sim.nextEvent(), S = sim.S;
    if (!n) { $("nextBox").innerHTML = "Подій до кінця доби немає."; return; }
    const ev = n.e, dt = n.at - S.time;
    const [cls, txt] = statusInfo(ev);
    $("nextBox").innerHTML = `<div class="next"><span class="big">${esc(ev.ev.train)}</span><span>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)} · ${typeShort[ev.ev.type] || ""} · <span class="pill ${cls}">${esc(txt)}</span></span>
      <span class="hint">о ${E.fmt(n.at).slice(0, 5)}</span><span class="hint">${dt > 0 ? "через " + Math.floor(dt / 60) + " хв " + (dt % 60) + " с" : "зараз"} · час модельний${ev.delayMin ? " · затримка " + ev.delayMin + " хв" : ""}</span></div>`;
  }

  function renderTrain() {
    const box = $("trainBox"), S = sim.S;
    let tr = ui.selTrain != null ? S.trains.find((t) => t.id === ui.selTrain) : null;
    if (!tr && ui.selEvent != null) {
      const ev = S.events[ui.selEvent];
      if (ev) { box.className = ""; box.innerHTML = `<dl class="kv"><dt>Поїзд</dt><dd><b>${esc(ev.ev.train)}</b> (${esc(ev.ev.type)})</dd><dt>Час (модель)</dt><dd>${esc(ev.ev.time)}${ev.delayMin ? " + " + ev.delayMin + " хв" : ""}</dd><dt>Напрямок</dt><dd>${esc(P.directionLabel[ev.ev.direction] || ev.ev.direction)}</dd><dt>Стан</dt><dd>${esc(statusInfo(ev)[1])}</dd>${ev.needsConfig ? `<dt>Потрібно</dt><dd>${esc(ev.needsConfig)}</dd>` : ""}</dl>`; return; }
    }
    if (!tr) { box.className = "hint"; box.textContent = "Виберіть поїзд на схемі або в графіку."; return; }
    box.className = "";
    box.innerHTML = `<dl class="kv"><dt>Поїзд</dt><dd><b>${esc(tr.num)}</b> · ${esc(tr.type)}${tr.parity ? " · " + (tr.parity === "odd" ? "непарний" : "парний") : ""}</dd>
      <dt>Стан</dt><dd>${esc(tr.status)}</dd><dt>Голова</dt><dd>${esc(tr.seq[tr.idx])}</dd><dt>Наступний сигнал</dt><dd>${esc(tr.nextSignal || "—")}</dd>
      <dt>Очікування</dt><dd>${tr.waitSec ? Math.round(tr.waitSec / 60) + " хв" : "—"}${tr.lastReason ? " · " + esc(tr.lastReason) : ""}</dd><dt>Пройдено</dt><dd>${esc(tr.seq.slice(0, tr.idx + 1).join(" → "))}</dd></dl>`;
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
    ui.logCount = L.length;
    box.prepend(frag);
    while (box.childNodes.length > 600) box.removeChild(box.lastChild);
    const last = L[L.length - 1];
    if (last && last.kind === "error" && !full) toast(last.text, "err");
  }
  $("logFilters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.logFilter = b.dataset.f; [...$("logFilters").children].forEach((x) => x.classList.toggle("on", x === b)); renderLog(true); });

  function renderClock() {
    const S = sim.S;
    $("clock").textContent = E.fmt(S.time);
    $("dateLine").textContent = "Доба " + S.day + " · умовна дата 28.10.2014" + (S.paused ? " · зупинено" : "");
  }

  function refresh(full) { renderClock(); renderScheme(); renderEvents(full); renderNext(); renderTrain(); renderRku(); renderLog(full); }

  // ---------- controls ----------
  function setRunning(r) { ui.running = r; $("btnPlay").textContent = r ? "⏸ Пауза" : "▶ Пуск"; $("btnPlay").classList.toggle("on", r); }
  $("btnPlay").onclick = () => { if (sim.S.paused) { toast("Доба завершена. Скиньте добу або оберіть «новий день».", "err"); return; } setRunning(!ui.running); };
  $("speedSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.speed = +b.dataset.s; [...$("speedSeg").children].forEach((x) => x.classList.toggle("on", x === b)); sim.log("cmd", "Швидкість x" + ui.speed); renderLog(); });
  $("viewSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ui.view = b.dataset.v; [...$("viewSeg").children].forEach((x) => x.classList.toggle("on", x === b)); buildSvg(); });
  $("btnReset").onclick = () => {
    sim.reset({ auto: $("chkAuto").checked, endMode: $("selEnd").value, shuntingEnabled: $("chkShunt").checked, delays: {} });
    ui.sel = null; ui.selTrain = null; ui.selEvent = null; acc = 0;
    toast("Добу скинуто на 00:00:00.", "ok"); refresh(true);
  };
  $("chkAuto").onchange = (e) => { sim.S.auto = e.target.checked; sim.log("cmd", "Автодиспетчер " + (sim.S.auto ? "увімкнено" : "вимкнено: маршрути задає ДСП")); refresh(); };
  $("selEnd").onchange = (e) => { sim.S.endMode = e.target.value; };
  $("chkShunt").onchange = (e) => {
    sim.S.shuntingEnabled = e.target.checked;
    sim.S.events.forEach((ev) => { if (ev.ev.action === "shunting_sequence" && (ev.status === "config" || ev.status === "planned")) { ev.needsConfig = e.target.checked ? null : "маневровий сценарій вимкнено: призначення сигналу М9 (повернення з колії 14) — припущення, потребує підтвердження"; ev.status = e.target.checked ? "planned" : "config"; } });
    sim.log("cmd", "Маневровий сценарій " + (e.target.checked ? "увімкнено (з припущенням щодо сигналу М9)" : "вимкнено"));
    refresh(true);
  };
  $("btnSkip").onclick = () => {
    const S = sim.S; let n = 0;
    if (!sim.isIdle()) { toast("На станції є активні поїзди або витримки. Прокрутка недоступна.", "err"); return; }
    while (sim.isIdle() && n < 86400 && !S.paused) { sim.step(); n++; }
    sim.log("cmd", "Прокрутка часу на " + Math.round(n / 60) + " хв");
    refresh();
  };
  const tracks = { odd: ["IП", "3П", "4П", "6П"], even: ["IIП", "4П", "6П", "3П"] };
  function fillTracks() { $("tTrack").innerHTML = `<option value="">авто</option>` + tracks[$("tPar").value].map((t) => `<option>${t}</option>`).join(""); }
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
      if (sim.S.paused) { setRunning(false); }
    }
    if (now - lastRender > 120) { lastRender = now; refresh(); }
    requestAnimationFrame(frame);
  }
  buildSvg();
  refresh(true);
  requestAnimationFrame(frame);
  window.__sim = sim; // for tests
})();

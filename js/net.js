/*
 * Network play for the line mode.
 * The host runs the whole line (all stations, one clock); every other player takes one free
 * station. Players never run their own copy of the model: the host sends each of them the state
 * of the station they look at, and their commands (routes, signals, switches…) go back to the host.
 * So there can be at most as many players as stations; stations nobody works stay with the
 * automatic dispatcher.
 * Transport: PeerJS (WebRTC, free public signalling server) between computers, or a
 * BroadcastChannel between tabs of one browser (for trying it out alone).
 */
(function () {
  "use strict";
  const MUT = ["setRoute", "openSignal", "closeSignal", "cancelRoute", "moveSwitch", "toggleSwitchLock", "toggleSwitchBlock", "toggleSectionBlock", "toggleSignalBlock",
    "artRelease", "inviteSignal", "setFault", "spawnLoco", "removeLoco", "setMode", "toggleFault", "setDelay", "addTestTrain", "log"];
  const LOOKS = [{ color: "#ffffff", shape: "arrow" }, { color: "#ffd23f", shape: "cross" }, { color: "#ff6b5e", shape: "diamond" }, { color: "#36e06a", shape: "ring" }, { color: "#c58cff", shape: "square" }, { color: "#5ad8ff", shape: "tri" }];
  const PEER_URLS = ["https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"];
  const PREFIX = "armdsp-zp-";
  const rid = (n) => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

  // ------------------------------------------------------------ transports
  function loadPeer() {
    if (window.Peer) return Promise.resolve();
    return PEER_URLS.reduce((p, url) => p.catch(() => new Promise((ok, bad) => {
      const s = document.createElement("script"); s.src = url; s.async = true;
      s.onload = () => (window.Peer ? ok() : bad(new Error("PeerJS не завантажився")));
      s.onerror = () => bad(new Error("не вдалося завантажити PeerJS з " + url));
      document.head.appendChild(s);
    })), Promise.reject(new Error("start")));
  }
  function wrapPeerConn(c) {
    const h = { data: [], close: [] };
    c.on("data", (d) => h.data.forEach((f) => f(d)));
    const closed = () => { if (h.done) return; h.done = true; h.close.forEach((f) => f()); };
    c.on("close", closed); c.on("error", closed);
    return { id: c.peer, send: (o) => { try { if (c.open) c.send(o); } catch (e) { /* closed */ } }, onData: (f) => h.data.push(f), onClose: (f) => h.close.push(f), close: () => { try { c.close(); } catch (e) { /* already */ } closed(); } };
  }
  async function peerHost(code, onConn) {
    await loadPeer();
    return new Promise((ok, bad) => {
      const peer = new window.Peer(PREFIX + code, { debug: 0 });
      let opened = false;
      peer.on("open", () => { opened = true; ok({ close: () => peer.destroy() }); });
      peer.on("connection", (c) => c.on("open", () => onConn(wrapPeerConn(c))));
      peer.on("error", (e) => { if (!opened) { peer.destroy(); bad(e); } });
    });
  }
  async function peerJoin(code) {
    await loadPeer();
    return new Promise((ok, bad) => {
      const peer = new window.Peer({ debug: 0 });
      const t = setTimeout(() => { peer.destroy(); bad(new Error("кімнату " + code + " не знайдено (немає відповіді)")); }, 15000);
      peer.on("error", (e) => { clearTimeout(t); peer.destroy(); bad(new Error(e.type === "peer-unavailable" ? "кімнату " + code + " не знайдено" : e.message || String(e))); });
      peer.on("open", () => {
        const c = peer.connect(PREFIX + code, { reliable: true, serialization: "json" });
        c.on("open", () => { clearTimeout(t); const w = wrapPeerConn(c); const close0 = w.close; w.close = () => { close0(); peer.destroy(); }; ok(w); });
      });
    });
  }
  // one browser, several tabs
  function localHost(code, onConn) {
    const bc = new BroadcastChannel(PREFIX + code), conns = {};
    bc.onmessage = (m) => {
      const d = m.data; if (!d || d.to !== "host") return;
      if (d.type === "hello") {
        const h = { data: [], close: [] };
        const c = conns[d.from] = { id: d.from, h, send: (o) => bc.postMessage({ from: "host", to: d.from, type: "data", payload: o }), onData: (f) => h.data.push(f), onClose: (f) => h.close.push(f),
          close: () => { bc.postMessage({ from: "host", to: d.from, type: "bye" }); delete conns[d.from]; h.close.forEach((f) => f()); } };
        bc.postMessage({ from: "host", to: d.from, type: "ack" });
        onConn(c);
      } else if (d.type === "data" && conns[d.from]) conns[d.from].h.data.forEach((f) => f(d.payload));
      else if (d.type === "bye" && conns[d.from]) { const c = conns[d.from]; delete conns[d.from]; c.h.close.forEach((f) => f()); }
    };
    return Promise.resolve({ close: () => { Object.keys(conns).forEach((k) => bc.postMessage({ from: "host", to: k, type: "bye" })); bc.close(); } });
  }
  function localJoin(code) {
    return new Promise((ok, bad) => {
      const bc = new BroadcastChannel(PREFIX + code), me = rid(8), h = { data: [], close: [] };
      const t = setTimeout(() => { bc.close(); bad(new Error("кімнату " + code + " не знайдено в інших вкладках цього браузера")); }, 3000);
      bc.onmessage = (m) => {
        const d = m.data; if (!d || d.to !== me) return;
        if (d.type === "ack") { clearTimeout(t); ok({ id: "host", send: (o) => bc.postMessage({ from: me, to: "host", type: "data", payload: o }), onData: (f) => h.data.push(f), onClose: (f) => h.close.push(f),
          close: () => { try { bc.postMessage({ from: me, to: "host", type: "bye" }); bc.close(); } catch (e) { /* already closed */ } h.close.forEach((f) => f()); } }); }
        else if (d.type === "data") h.data.forEach((f) => f(d.payload));
        else if (d.type === "bye") { bc.close(); h.close.forEach((f) => f()); }
      };
      window.addEventListener("beforeunload", () => { try { bc.postMessage({ from: me, to: "host", type: "bye" }); } catch (e) { /* already closed */ } });
      bc.postMessage({ from: me, to: "host", type: "hello" });
    });
  }

  // ------------------------------------------------------------ host
  // world: the LineWorld; hooks: {name(), view(), onChange()}
  async function host(world, local, hooks) {
    const H = { role: "host", local, code: (local ? "L" : "") + rid(5), players: new Map(), cursors: {}, me: { id: "host", ...LOOKS[0] }, world };
    world.others = new Map();
    const count = (st) => (st === world.player ? 1 : 0) + [...H.players.values()].filter((p) => p.st === st).length;
    const cap = (st) => (world.L.capacity && world.L.capacity[st]) || 1;
    const free = (st) => count(st) < cap(st);
    const roster = () => [{ id: "host", name: hooks.name(), st: world.player, view: hooks.view(), color: LOOKS[0].color, shape: LOOKS[0].shape, host: true }]
      .concat([...H.players.values()].map((p) => ({ id: p.id, name: p.name, st: p.st, view: p.view, color: p.color, shape: p.shape })));
    H.roster = roster;
    const sync = () => {
      const m = new Map(); [...H.players.values()].filter((p) => p.st).forEach((p) => m.set(p.st, (m.get(p.st) || []).concat(p.name)));
      world.others = m; hooks.onChange && hooks.onChange();
    };
    // a station nobody works any more goes back to the automatic dispatcher
    const release = (st) => { if (st && count(st) === 0) world.sims[st].S.auto = true; };
    function onConn(c) {
      let p = null;
      c.onData((m) => {
        if (!m || !m.t) return;
        if (m.t === "hello") {
          const maxP = world.L.stations.reduce((n, s2) => n + cap(s2), 0);
          if (H.players.size + 1 >= maxP) { c.send({ t: "full", text: "У кімнаті вже " + maxP + " гравців — більше станції не приймають." }); setTimeout(() => c.close(), 300); return; }
          const st = world.L.stations.find((s2) => count(s2) === 0) || world.L.stations.find(free);
          if (!st) { c.send({ t: "full", text: "Вільних станцій немає." }); setTimeout(() => c.close(), 300); return; }
          const used = new Set([...H.players.values()].map((x) => x.color));
          const look = LOOKS.slice(1).find((l) => !used.has(l.color)) || LOOKS[1];
          p = { id: c.id + ":" + rid(3), name: String(m.name || "Гравець").slice(0, 24), st, view: st, conn: c, color: look.color, shape: look.shape, logFrom: 0, sRef: null, evStr: null };
          H.players.set(p.id, p); world.sims[st].S.auto = false; sync();
          c.send({ t: "welcome", line: world.id, st, seed: world.seed, level: world.level, me: { id: p.id, color: p.color, shape: p.shape } });
          world.sims[st].log("sys", "До ст. приєднався гравець " + p.name);
          return;
        }
        if (!p) return;
        if (m.t === "cmd") {
          let r;
          if (m.st !== p.st || p.view !== p.st) r = { ok: false, err: "Ви не керуєте цією станцією" };
          else if (m.m === "__auto") { world.sims[p.st].S.auto = !!m.a[0]; world.sims[p.st].log("cmd", "Автодиспетчер " + (m.a[0] ? "увімкнено" : "вимкнено") + " (гравець " + p.name + ")"); r = { ok: true }; }
          else if (MUT.includes(m.m)) { try { r = world.sims[p.st][m.m](...(m.a || [])); } catch (e) { r = { ok: false, err: String(e.message || e) }; } }
          c.send({ t: "res", id: m.id, r: r && typeof r === "object" ? { ok: r.ok, err: r.err } : r });
        } else if (m.t === "switch") {
          const st = m.st;
          const was = p.st;
          if (m.watch) { p.st = null; p.view = st; release(was); }
          else if (!free(st)) { c.send({ t: "denied", text: "Станцію вже зайнято" }); return; }
          else { p.st = st; p.view = st; world.sims[st].S.auto = false; release(was); }
          p.sRef = null; sync();
          c.send({ t: "assign", st: p.st, view: p.view });
        } else if (m.t === "cur") { H.cursors[p.id] = { x: m.x, y: m.y, view: p.view, at: Date.now() }; }
      });
      c.onClose(() => { if (!p) return; H.players.delete(p.id); delete H.cursors[p.id]; if (p.st) { release(p.st); world.sims[p.st].log("sys", "Гравець " + p.name + " вийшов" + (count(p.st) ? "" : " — станцію веде автодиспетчер")); } sync(); });
    }
    H.transport = await (local ? localHost(H.code, onConn) : peerHost(H.code, onConn));
    // state to every player, ~4 times a second
    H.timer = setInterval(() => {
      const ro = roster(), curs = {};
      Object.entries(H.cursors).forEach(([k, v]) => { if (Date.now() - v.at < 5000) curs[k] = v; });
      if (H.me.cur) curs.host = H.me.cur;
      const info = {}; world.L.stations.forEach((st) => (info[st] = world.info(st)));
      H.players.forEach((p) => {
        const sim = world.sims[p.view];
        const restart = sim.S !== p.sRef || p.viewWas !== p.view;
        if (restart) { p.sRef = sim.S; p.logFrom = 0; p.evStr = null; p.viewWas = p.view; }
        const snap = sim.snapshot(p.logFrom); p.logFrom = snap.logLen;
        const evStr = JSON.stringify(snap.S.events);
        if (evStr === p.evStr) delete snap.S.events; else p.evStr = evStr;
        p.conn.send({ t: "state", view: p.view, st: p.st, snap: JSON.parse(JSON.stringify(snap)), restart, clock: { running: hooks.running(), speed: hooks.speed() }, roster: ro, cursors: curs, transit: world.inTransit(), info });
      });
    }, 250);
    H.cursor = (x, y, view) => { H.me.cur = { x, y, view, at: Date.now() }; };
    H.close = () => { clearInterval(H.timer); H.players.forEach((p) => p.conn.close()); H.transport.close(); world.others = new Map(); world.L.stations.forEach((st) => { if (st !== world.player) world.sims[st].S.auto = true; }); };
    return H;
  }

  // ------------------------------------------------------------ player (client)
  async function join(code, name, hooks) {
    code = String(code || "").trim().toUpperCase();
    const local = code[0] === "L";
    const c = await (local ? localJoin(code) : peerJoin(code));
    const C = { role: "client", code, conn: c, pending: {}, seq: 0, roster: [], cursors: {}, transit: [], info: {}, clock: { running: true, speed: 1 } };
    return new Promise((ok, bad) => {
      const t = setTimeout(() => bad(new Error("ведучий не відповів")), 8000);
      c.onData((m) => {
        if (!m || !m.t) return;
        if (m.t === "full") { clearTimeout(t); bad(new Error(m.text)); c.close(); return; }
        if (m.t === "welcome") { clearTimeout(t); Object.assign(C, { line: m.line, st: m.st, view: m.st, me: m.me, seed: m.seed, level: m.level }); ok(C); return; }
        if (m.t === "state") { C.roster = m.roster; C.cursors = m.cursors; C.transit = m.transit; C.info = m.info; C.clock = m.clock; C.st = m.st; hooks.onState && hooks.onState(m); return; }
        if (m.t === "res") { const f = C.pending[m.id]; delete C.pending[m.id]; if (f) f(m.r); return; }
        if (m.t === "assign") { C.st = m.st; C.view = m.view; hooks.onAssign && hooks.onAssign(m); return; }
        if (m.t === "denied") { hooks.onDenied && hooks.onDenied(m.text); }
      });
      c.onClose(() => { hooks.onClose && hooks.onClose(); });
      c.send({ t: "hello", name });
    });
  }
  // a station model whose commands go to the host
  function remoteSim(sim, C, onResult) {
    return new Proxy(sim, { get(t, k) {
      if (k === "__remote") return true;
      if (typeof k === "string" && MUT.includes(k)) return (...a) => {
        if (k === "log" && a[0] !== "cmd") return t.log(...a);
        const id = ++C.seq; C.pending[id] = (r) => onResult && onResult(k, r);
        C.conn.send({ t: "cmd", st: C.view, m: k, a, id });
        return { ok: true, sent: true };
      };
      return t[k];
    } });
  }
  function readonlySim(sim) {
    return new Proxy(sim, { get(t, k) {
      if (typeof k === "string" && MUT.includes(k) && k !== "log") return () => ({ ok: false, err: "режим спостереження: станцією керує інший гравець" });
      return t[k];
    } });
  }

  window.Net = { host, join, remoteSim, readonlySim, LOOKS, MUT };
})();

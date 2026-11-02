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
  const MUT = ["setRoute", "openSignal", "closeSignal", "cancelRoute", "moveSwitch", "toggleSwitchLock", "toggleSwitchBlock", "toggleSectionBlock", "toggleSignalBlock", "toggleSecFlag",
    "artRelease", "inviteSignal", "setFault", "spawnLoco", "removeLoco", "shuntCouple", "shuntUncouple", "setMode", "setPlace", "toggleFault", "setDelay", "addTestTrain", "log"];
  const LOOKS = [{ color: "#ffffff", shape: "arrow" }, { color: "#ffd23f", shape: "cross" }, { color: "#ff6b5e", shape: "diamond" }, { color: "#36e06a", shape: "ring" }, { color: "#c58cff", shape: "square" }, { color: "#5ad8ff", shape: "tri" }];
  const PEER_URLS = ["https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"];
  const PREFIX = "armdsp-zp-";
  const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // codes come from the browser's cryptographic generator, not from Math.random
  const rid = (n) => { const b = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(b); let s = ""; for (let i = 0; i < n; i++) s += ALPH[b[i] & 31]; return s; };

  // ------------------------------------------------------------ security
  // A room code is ROOM-KEY: ROOM (6 signs) names the room on the public PeerJS server, KEY (6 signs) is a
  // secret that only travels inside the encrypted WebRTC channel. Together ~60 bits: a room cannot be guessed.
  // The host also has to accept every player by hand and can send anyone away.
  const normCode = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const splitCode = (code) => { const c = normCode(code), local = c[0] === "L", body = local ? c.slice(1) : c; return { local, room: (local ? "L" : "") + body.slice(0, 6), key: body.slice(6, 12) }; };
  const showCode = (room, key) => room + "-" + key;
  const sameKey = (a, b) => { a = String(a || ""); b = String(b || ""); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; };
  // names that would reach Object.prototype through a lookup like S.sw[id]
  const BAD = (k) => k === "__proto__" || Object.prototype.hasOwnProperty.call(Object.prototype, k);
  // everything that comes over the network is copied into plain data: limited depth, sizes and lengths,
  // no prototype keys, and no characters that could open HTML (< > " `), so nothing can be injected into the page
  function clean(v, lim, depth) {
    depth = depth || 0;
    if (v == null) return null;
    const t = typeof v;
    if (t === "string") { if (BAD(v)) throw new Error("bad"); return v.slice(0, lim.str).replace(/[<>"`]/g, (c) => ({ "<": "‹", ">": "›", '"': "″", "`": "ʼ" }[c])); }
    if (t === "number") return Number.isFinite(v) ? v : 0;
    if (t === "boolean") return v;
    if (t !== "object" || depth >= lim.depth) return null;
    if (Array.isArray(v)) { if (v.length > lim.arr) throw new Error("too long"); return v.map((x) => clean(x, lim, depth + 1)); }
    const o = {}, ks = Object.keys(v);
    if (ks.length > lim.keys) throw new Error("too many keys");
    ks.forEach((k) => { if (BAD(k)) throw new Error("bad key"); o[k] = clean(v[k], lim, depth + 1); });
    return o;
  }
  const FROM_PLAYER = { str: 200, arr: 12, keys: 16, depth: 4 };
  const FROM_HOST = { str: 4000, arr: 50000, keys: 5000, depth: 18 };
  const safe = (m, lim) => { try { return clean(m, lim); } catch (e) { return null; } };
  // per connection: at most ~25 messages a second (a burst of 50); a flood closes the connection
  function bucket(rate, burst) { let tokens = burst, last = Date.now(), over = 0; return () => { const now = Date.now(); tokens = Math.min(burst, tokens + ((now - last) / 1000) * rate); last = now; if (tokens >= 1) { tokens -= 1; return true; } over++; return over < 300 ? false : null; }; }

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
    const room = (local ? "L" : "") + rid(6), key = rid(6);
    const H = { role: "host", local, code: showCode(room, key), players: new Map(), pending: new Map(), banned: new Set(), cursors: {}, me: { id: "host", ...LOOKS[0] }, world };
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
    // a command's arguments: short plain values only; a test train may be described by a small flat object
    const okArgs = (name, a) => Array.isArray(a) && a.length <= 6 && a.every((x) => x == null || ["string", "number", "boolean"].includes(typeof x) ||
      (name === "addTestTrain" && typeof x === "object" && !Array.isArray(x) && Object.values(x).every((y) => y == null || ["string", "number", "boolean"].includes(typeof y))));
    function onConn(c) {
      let p = null, asked = false;
      const limit = bucket(25, 50);
      if (H.banned.has(c.id)) { c.send({ t: "full", text: "Ведучий не пускає вас у цю кімнату." }); setTimeout(() => c.close(), 300); return; }
      c.onData((m0) => {
        const ok = limit();
        if (ok === null) { H.banned.add(c.id); c.close(); return; }
        if (!ok) return;
        const m = safe(m0, FROM_PLAYER);
        if (!m || typeof m.t !== "string") return;
        if (m.t === "hello") {
          if (p || asked) return;
          // the secret part of the code, compared in constant time
          if (!sameKey(m.key, key)) { c.send({ t: "full", text: "Невірний код кімнати." }); setTimeout(() => c.close(), 300); return; }
          asked = true;
          const name = String(m.name || "Гравець").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24) || "Гравець";
          // the host decides: a request waits in the panel for one minute
          const req = { id: c.id, name, at: Date.now() };
          const done = (yes) => { if (!H.pending.has(req.id)) return; H.pending.delete(req.id); hooks.onChange && hooks.onChange(); if (yes) admit(name); else { c.send({ t: "full", text: "Ведучий відхилив запит." }); setTimeout(() => c.close(), 300); } };
          req.accept = () => done(true); req.reject = () => done(false);
          H.pending.set(req.id, req); c.send({ t: "wait" }); hooks.onChange && hooks.onChange();
          setTimeout(() => done(false), 60000);
          return;
        }
        if (!p) return;
        handle(m);
      });
      function admit(name) {
          const maxP = world.L.stations.reduce((n, s2) => n + cap(s2), 0);
          if (H.players.size + 1 >= maxP) { c.send({ t: "full", text: "У кімнаті вже " + maxP + " гравців — більше станції не приймають." }); setTimeout(() => c.close(), 300); return; }
          const st = world.L.stations.find((s2) => count(s2) === 0) || world.L.stations.find(free);
          if (!st) { c.send({ t: "full", text: "Вільних станцій немає." }); setTimeout(() => c.close(), 300); return; }
          const used = new Set([...H.players.values()].map((x) => x.color));
          const look = LOOKS.slice(1).find((l) => !used.has(l.color)) || LOOKS[1];
          p = { id: c.id + ":" + rid(3), name, st, view: st, conn: c, color: look.color, shape: look.shape, logFrom: 0, sRef: null, evStr: null };
          H.players.set(p.id, p); world.sims[st].S.auto = false; sync();
          c.send({ t: "welcome", line: world.id, st, seed: world.seed, level: world.level, me: { id: p.id, color: p.color, shape: p.shape } });
          world.sims[st].log("sys", "До ст. приєднався гравець " + p.name);
      }
      function handle(m) {
        if (m.t === "cmd") {
          let r;
          const args = Array.isArray(m.a) ? m.a : [];
          if (!p.st || m.st !== p.st || p.view !== p.st) r = { ok: false, err: "Ви не керуєте цією станцією" };
          else if (!okArgs(m.m, args)) r = { ok: false, err: "Невірні параметри команди" };
          else if (m.m === "__auto") { const v = args[0] === "trains" ? "trains" : !!args[0]; world.sims[p.st].S.auto = v; world.sims[p.st].log("cmd", "Автодиспетчер: " + (v === "trains" ? "лише поїзди, маневри — ДСП" : v ? "усе" : "вимкнено") + " (гравець " + p.name + ")"); r = { ok: true }; }
          else if (m.m === "log") { if (args[0] === "cmd" && typeof args[1] === "string") world.sims[p.st].log("cmd", args[1].slice(0, 160) + " (гравець " + p.name + ")"); r = { ok: true }; }
          else if (typeof m.m === "string" && MUT.includes(m.m)) { try { r = world.sims[p.st][m.m](...args); } catch (e) { r = { ok: false, err: "команду не виконано" }; } }
          else r = { ok: false, err: "Невідома команда" };
          c.send({ t: "res", id: typeof m.id === "number" ? m.id : 0, r: r && typeof r === "object" ? { ok: !!r.ok, err: r.err ? String(r.err).slice(0, 200) : undefined } : r });
        } else if (m.t === "switch") {
          const st = m.st;
          if (!world.L.stations.includes(st)) return;
          const was = p.st;
          if (m.watch) { p.st = null; p.view = st; release(was); }
          else if (!free(st)) { c.send({ t: "denied", text: "Станцію вже зайнято" }); return; }
          else { p.st = st; p.view = st; world.sims[st].S.auto = false; release(was); }
          p.sRef = null; sync();
          c.send({ t: "assign", st: p.st, view: p.view });
        } else if (m.t === "cur") { if (typeof m.x === "number" && typeof m.y === "number") H.cursors[p.id] = { x: Math.max(-1000, Math.min(10000, m.x)), y: Math.max(-1000, Math.min(10000, m.y)), view: p.view, at: Date.now() }; }
      }
      c.onClose(() => { if (H.pending.delete(c.id)) hooks.onChange && hooks.onChange(); if (!p) return; H.players.delete(p.id); delete H.cursors[p.id]; if (p.st) { release(p.st); world.sims[p.st].log("sys", "Гравець " + p.name + " вийшов" + (count(p.st) ? "" : " — станцію веде автодиспетчер")); } sync(); });
    }
    H.transport = await (local ? localHost(room, onConn) : peerHost(room, onConn));
    // send a player away: the connection is closed and this browser may not come back into the room
    H.kick = (pid) => { const p = H.players.get(pid); if (!p) return; H.banned.add(p.conn.id); p.conn.send({ t: "full", text: "Ведучий завершив вашу участь у грі." }); setTimeout(() => p.conn.close(), 200); };
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
    H.close = () => { clearInterval(H.timer); H.pending.forEach((r) => r.reject()); H.players.forEach((p) => p.conn.close()); H.transport.close(); world.others = new Map(); world.L.stations.forEach((st) => { if (st !== world.player) world.sims[st].S.auto = true; }); };
    return H;
  }

  // ------------------------------------------------------------ player (client)
  async function join(code, name, hooks) {
    const { local, room, key } = splitCode(code);
    if (room.length < (local ? 7 : 6) || key.length < 6) throw new Error("код кімнати має вигляд ABC234-XYZ789");
    const c = await (local ? localJoin(room) : peerJoin(room));
    const C = { role: "client", code: showCode(room, key), conn: c, pending: {}, seq: 0, roster: [], cursors: {}, transit: [], info: {}, clock: { running: true, speed: 1 } };
    const colorOk = (x) => (LOOKS.some((l) => l.color === x) ? x : "#ffffff"), shapeOk = (x) => (LOOKS.some((l) => l.shape === x) ? x : "arrow");
    return new Promise((ok, bad) => {
      let t = setTimeout(() => bad(new Error("ведучий не відповів")), 8000);
      c.onData((m0) => {
        const m = safe(m0, FROM_HOST);
        if (!m || typeof m.t !== "string") return;
        // what the host sends is shown on the page: colours and shapes only from our own list
        if (m.me) { m.me.color = colorOk(m.me.color); m.me.shape = shapeOk(m.me.shape); }
        (Array.isArray(m.roster) ? m.roster : []).forEach((r) => { if (r) { r.color = colorOk(r.color); r.shape = shapeOk(r.shape); r.name = String(r.name || "").slice(0, 24); } });
        if (m.cursors && typeof m.cursors === "object") Object.values(m.cursors).forEach((q) => { if (q) { q.x = +q.x || 0; q.y = +q.y || 0; } });
        if (m.t === "wait") { clearTimeout(t); hooks.onWait && hooks.onWait(); t = setTimeout(() => bad(new Error("ведучий не відповів на запит")), 70000); return; }
        if (m.t === "full") { clearTimeout(t); bad(new Error(m.text)); hooks.onKicked && hooks.onKicked(m.text); c.close(); return; }
        if (m.t === "welcome") { clearTimeout(t); Object.assign(C, { line: m.line, st: m.st, view: m.st, me: m.me, seed: m.seed, level: m.level }); ok(C); return; }
        if (m.t === "state") { C.roster = m.roster; C.cursors = m.cursors; C.transit = m.transit; C.info = m.info; C.clock = m.clock; C.st = m.st; hooks.onState && hooks.onState(m); return; }
        if (m.t === "res") { const f = C.pending[m.id]; delete C.pending[m.id]; if (f) f(m.r); return; }
        if (m.t === "assign") { C.st = m.st; C.view = m.view; hooks.onAssign && hooks.onAssign(m); return; }
        if (m.t === "denied") { hooks.onDenied && hooks.onDenied(m.text); }
      });
      c.onClose(() => { hooks.onClose && hooks.onClose(); });
      c.send({ t: "hello", name: String(name || "").slice(0, 24), key });
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

  window.Net = { host, join, remoteSim, readonlySim, LOOKS, MUT, splitCode };
})();

/*
 * Радіо / поїзні телефонограми. Texts follow ІРП ЦД-0058, розділ 9 (с. 86–96):
 *  - addressing «Станція … із станції …» (п. 9.10.1), position and surname before the text (п. 9.9.9);
 *  - on a double-track line forms 3 («відправився»), 4 («прибув») and 11 («пройшов») (пп. 9.11.1–9.11.2);
 *  - the receiver repeats the text word for word, the sender answers «Вірно» (п. 9.9.10);
 *  - outgoing numbering starts from № 1 every day, separately for each перегін (п. 9.9.5);
 *  - one journal ф. ДУ-47 per перегін (п. 9.9.3).
 * Train-driver calls about a closed signal are added from common practice (not from розділ 9).
 * UI-only module; it listens to engine events and never changes the interlocking.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hhmm = (t) => { t = ((t % 86400) + 86400) % 86400; return String(Math.floor(t / 3600)).padStart(2, "0") + " год " + String(Math.floor((t % 3600) / 60)).padStart(2, "0") + " хв"; };

  function init(getSim, hooks, T) {
    // neighbour stations and which side a train comes from / goes to — from the station description
    T = T || window.TOPOLOGY;
    const RC = (T && T.radio) || { sides: {}, odd: {}, even: {} };
    const NB = RC.sides;
    const SIDES = Object.keys(NB);
    const ME = (T && T.station) || "Сокологірне";
    // the state may outlive this window (line mode: the DSP switches between stations)
    const store = (hooks && hooks.store) || {};
    let R = store.R || (store.R = fresh());
    function fresh() {
      const o = (f) => Object.fromEntries(SIDES.map((k) => [k, f(k)]));
      return { msgs: [], journal: o(() => []), out: o(() => 0), inc: o((k) => NB[k].inc || 40), later: [], called: {}, sRef: null, seq: 0 };
    }
    const me = () => ($("dspName").value.trim() || "Іваненко");
    const sim = () => getSim();
    const now = () => sim().S.time;

    function push(m) { m.id = ++R.seq; m.t = now(); R.msgs.push(m); if (m.kind !== "me" && hooks && hooks.ring) hooks.ring(); if (R.msgs.length > 200) R.msgs.splice(0, R.msgs.length - 200); render(); }
    function journal(side, dir, no, text, who) { R.journal[side].push({ t: now(), dir, no, text, who }); }

    // ---------- incoming: the neighbour reports, the DSP must repeat (п. 9.9.10)
    function incoming(side, text, train) {
      const n = ++R.inc[side];
      push({ kind: "in", side, train, no: n, text,
        head: ME + " із " + NB[side].from + ". ДСП " + NB[side].dsp + ". Телефонограма № " + n + ".",
        due: now() + 180, need: "repeat" });
    }
    // ---------- outgoing duty: the DSP must transmit (forms 3, 4, 11)
    function duty(side, text, train) {
      push({ kind: "duty", side, train, text, due: now() + 180, need: "send" });
    }

    function act(id, what) {
      const m = R.msgs.find((x) => x.id === id); if (!m || !m.need) return;
      const S = sim().S;
      if (m.need === "repeat") {
        push({ kind: "me", text: m.text + " ДСП " + ME + " " + me() + "." });
        push({ kind: "nb", side: m.side, text: "Вірно. ДСП " + NB[m.side].dsp + "." });
        journal(m.side, "вхідна", m.no, m.text, "ДСП " + NB[m.side].dsp + " / прийняв ДСП " + me());
        m.need = null; m.ok = true;
      } else if (m.need === "send") {
        const no = ++R.out[m.side];
        push({ kind: "me", text: NB[m.side].name + " із " + ME + ". ДСП " + ME + " " + me() + ". Телефонограма № " + no + ". " + m.text });
        const rep = { kind: "nb", side: m.side, text: m.text + " ДСП " + NB[m.side].dsp + ".", need: "confirm", no, parent: m.id, due: now() + 120 };
        m.need = null; m.ok = true;
        push(rep);
      } else if (m.need === "confirm") {
        push({ kind: "me", text: "Вірно. ДСП " + ME + " " + me() + "." });
        const parent = R.msgs.find((x) => x.id === m.parent);
        journal(m.side, "вихідна", m.no, parent ? parent.text : m.text, "ДСП " + me() + " / прийняв ДСП " + NB[m.side].dsp);
        m.need = null; m.ok = true;
      } else if (m.need === "driver") {
        push({ kind: "me", text: what === "wait" ? "Машиніст поїзда № " + m.train + ", зрозумів. Стійте біля закритого сигналу, чекайте відкриття." : "Машиніст поїзда № " + m.train + ", зрозумів, маршрут готую." });
        m.need = null; m.ok = true;
      }
      if (S) render();
    }

    // ---------- engine events
    function onEvent(e) {
      const S = sim().S;
      if (!e.trId) return;
      const tr = S.trains.find((t) => t.id === e.trId);
      if (!tr || tr.type === "shunting" || !tr.parity) return;
      const cfg = RC[tr.parity] || {};
      const back = RC.bySignal ? RC.bySignal[tr.entry] : cfg.back, fwd = RC.byLine ? RC.byLine[tr.exitTo] : cfg.fwd;
      const stops = tr.stopSec > 0 || !!tr.terminate, formed = !!tr.formed;
      const say = (side, text) => { if (side && NB[side]) duty(side, text, tr.num); };
      if (e.evt === "spawn") { if (back && NB[back]) incoming(back, "Поїзд № " + tr.num + " відправився о " + hhmm(e.t - 300) + ".", tr.num); }
      else if (e.evt === "pass" && e.sigKind === "entry" && stops) say(back, "Поїзд № " + tr.num + " прибув о " + hhmm(e.t + 60) + ".");
      else if (e.evt === "pass" && e.sigKind === "exit") {
        if (stops || formed) say(fwd, "Поїзд № " + tr.num + " відправився о " + hhmm(e.t) + ".");
        else { say(back, "Поїзд № " + tr.num + " пройшов о " + hhmm(e.t) + "."); say(fwd, "Поїзд № " + tr.num + " пройшов о " + hhmm(e.t) + "."); }
      } else if (e.evt === "gone" && fwd && NB[fwd] && !tr.terminate) R.later.push({ at: e.t + 360, side: fwd, train: tr.num });
    }

    // ---------- periodic checks: overdue duties, delayed arrival reports, driver calls
    function tick() {
      const S = sim().S;
      if (R.sRef !== S) { if (R.sRef) R = store.R = fresh(); R.sRef = S; render(); }
      R.later = R.later.filter((x) => {
        if (S.time < x.at) return true;
        incoming(x.side, "Поїзд № " + x.train + " прибув о " + hhmm(x.at) + ".", x.train);
        return false;
      });
      R.msgs.forEach((m) => {
        if (m.need && m.due && S.time > m.due && !m.overdue) {
          m.overdue = true;
          sim().log("warn", "Радіо: " + (m.need === "send" ? "не передано телефонограму на ст. " + NB[m.side].name + " — " + m.text : m.need === "repeat" ? "не повторено телефонограму від ст. " + NB[m.side].name : "не підтверджено «Вірно» для ст. " + NB[m.side].name));
          render();
        }
      });
      S.trains.forEach((tr) => {
        if (tr.done || tr.type === "shunting" || !tr.wait || !/чекає відкриття/.test(tr.wait)) return;
        if (tr.waitSec < 30 || R.called[tr.id + tr.wait]) return;
        R.called[tr.id + tr.wait] = true;
        const sig = tr.wait.replace("чекає відкриття ", "");
        push({ kind: "drv", train: tr.num, text: "ДСП " + ME + ", я машиніст поїзда № " + tr.num + ". Стою біля закритого світлофора " + sig + ".", need: "driver" });
      });
      const pend = R.msgs.filter((m) => m.need).length;
      $("radioBadge").textContent = pend ? pend : "";
      $("btnRadio").classList.toggle("alert", R.msgs.some((m) => m.need && m.overdue));
    }

    // ---------- rendering
    let tab = "live";
    function render() {
      if ($("radio").hidden) return;
      const live = $("radioLive"), jr = $("radioJournal");
      live.hidden = tab !== "live"; jr.hidden = tab === "live";
      const date = (t) => { const d = new Date(Date.UTC(2014, 9, 28) + (sim().S.day - 1) * 86400000); return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "." + d.getUTCFullYear(); };
      const tcell = (t) => `<td class="tm">${window.SimEngine.fmt(t).slice(0, 5)}<br><span class="dt">${date(t)}</span></td>`;
      if (tab === "live") {
        const rows = R.msgs.slice(-60).map((m) => {
          let who, body = esc(m.text), btns = "";
          if (m.kind === "in") { who = "ст. " + NB[m.side].name; body = esc(m.head) + " " + body; }
          else if (m.kind === "nb") who = "ст. " + NB[m.side].name;
          else if (m.kind === "me") who = ME + " (ви)";
          else if (m.kind === "drv") who = "Машиніст";
          else if (m.kind === "duty") { who = "Завдання"; body = "Передати на ст. " + esc(NB[m.side].name) + ": «" + body + "»"; }
          if (m.need === "repeat") btns = `<button data-id="${m.id}" data-a="ok">Повторити текст</button>`;
          if (m.need === "send") btns = `<button data-id="${m.id}" data-a="ok">Передати</button>`;
          if (m.need === "confirm") btns = `<button data-id="${m.id}" data-a="ok">Вірно</button>`;
          if (m.need === "driver") btns = `<button data-id="${m.id}" data-a="ok">Маршрут готую</button><button data-id="${m.id}" data-a="wait">Чекайте</button>`;
          return `<tr class="${m.kind}${m.need ? " pending" : ""}${m.overdue && m.need ? " overdue" : ""}">${tcell(m.t)}<td class="who">${esc(who)}</td><td class="txt">${body}</td><td class="act">${btns}</td></tr>`;
        }).join("");
        const html = `<table class="sheet rsheet"><thead><tr><th>Час / дата</th><th>Від ст.</th><th>Зміст</th><th>Дія</th></tr></thead><tbody>${rows || `<tr><td colspan="4" class="empty">Тиша в ефірі. Коли сусідня станція відправить поїзд до вас, тут з'явиться телефонограма.</td></tr>`}</tbody></table>`;
        if (live.__h !== html) { live.innerHTML = html; live.__h = html; live.scrollTop = live.scrollHeight; }
      } else {
        const side = tab.slice(1);
        const list = R.journal[side];
        jr.innerHTML = `<p class="jr-cap">Журнал поїзних телефонограм ф. ДУ-47 · перегін ${esc(ME)} — ${NB[side].name}</p>
          <table class="sheet rsheet"><thead><tr><th>Час / дата</th><th>№</th><th>Від ст.</th><th>Зміст</th><th>Підписи</th></tr></thead><tbody>${list.length
          ? list.map((j) => `<tr>${tcell(j.t)}<td>${j.no}</td><td class="who">${j.dir === "вхідна" ? esc(NB[side].name) : esc(ME)}</td><td class="txt">${esc(j.text)}</td><td class="who">${esc(j.who)}</td></tr>`).join("")
          : `<tr><td colspan="5" class="empty">Записів ще немає.</td></tr>`}</tbody></table>`;
      }
    }
    $("dspLbl").textContent = "ДСП " + ME + ":";
    document.querySelector(".radio-tabs").innerHTML = `<button data-r="live" class="on">Ефір</button>` + SIDES.map((k) => `<button data-r="j${k}">Журнал ДУ-47: ${esc(NB[k].name)}</button>`).join("");
    $("radioLive").addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) act(+b.dataset.id, b.dataset.a); });
    document.querySelector(".radio-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-r]"); if (!b) return; tab = b.dataset.r;
      [...document.querySelectorAll(".radio-tabs button")].forEach((x) => x.classList.toggle("on", x === b)); render();
    });
    $("btnRadio").onclick = () => { $("radio").hidden = !$("radio").hidden; $("radioLive").__h = null; render(); };
    $("radioClose").onclick = () => { $("radio").hidden = true; };
    // drag the window by its header (desktop)
    (function drag() {
      const w = $("radio"), h = $("radioHead"); let sx, sy, ox, oy, on = false;
      h.addEventListener("pointerdown", (e) => { if (e.target.tagName === "BUTTON" || window.innerWidth < 720) return; on = true; sx = e.clientX; sy = e.clientY; const r = w.getBoundingClientRect(); ox = r.left; oy = r.top; h.setPointerCapture(e.pointerId); });
      h.addEventListener("pointermove", (e) => { if (!on) return; w.style.left = Math.max(0, Math.min(window.innerWidth - 120, ox + e.clientX - sx)) + "px"; w.style.top = Math.max(0, Math.min(window.innerHeight - 60, oy + e.clientY - sy)) + "px"; w.style.right = "auto"; w.style.bottom = "auto"; });
      h.addEventListener("pointerup", () => { on = false; });
    })();
    return { onEvent, tick, render };
  }
  window.Radio = { init };
})();

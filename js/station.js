/*
 * Station selection. Every station file registers its description in window.STATION_DATA;
 * the chosen one (from the address #st=…, else the last choice) becomes the active model
 * for the engine and the screen. Changing the station reloads the page.
 */
(function () {
  "use strict";
  const reg = (window.STATION_DATA = window.STATION_DATA || {});
  reg.sokologirne = { id: "sokologirne", name: "Сокологірне", note: "проміжна, двоколійна ділянка Мелітополь — Джанкой",
    TOPOLOGY: window.TOPOLOGY, MODEL_PARAMS: window.MODEL_PARAMS, SCHEDULE: window.SCHEDULE, generate: window.ScheduleGenerator.generate };
  if (reg.berdyansk) reg.berdyansk.note = "тупикова, одноколійна лінія Пологи — Бердянськ, порт";
  // menu order: Сокологірне first, then the others as registered
  const order = ["sokologirne"].concat(Object.keys(reg).filter((k) => k !== "sokologirne"));
  const sorted = {}; order.forEach((k) => (sorted[k] = reg[k]));
  Object.keys(reg).forEach((k) => delete reg[k]); Object.assign(reg, sorted);
  let id = null;
  const m = /(?:^|[#&])st=([a-z]+)/.exec(location.hash || "");
  if (m) id = m[1];
  if (!id) { try { id = localStorage.getItem("dsp-station"); } catch (e) { /* storage unavailable */ } }
  if (!reg[id]) id = "sokologirne";
  const st = reg[id];
  window.STATION_ID = id;
  window.TOPOLOGY = st.TOPOLOGY;
  window.MODEL_PARAMS = st.MODEL_PARAMS;
  window.SCHEDULE = st.SCHEDULE || null;
  window.ScheduleGenerator = { generate: st.generate };
  window.selectStation = function (nid) {
    if (!reg[nid] || nid === id) return;
    try { localStorage.setItem("dsp-station", nid); } catch (e) { /* storage unavailable */ }
    location.hash = "st=" + nid;
    location.reload();
  };
})();

/*
 * Station topology for Сокологірне, transcribed from the station plan
 * ("Дата кор. 28.10.2014"). Coordinates follow the plan image (px).
 *
 * Confidence markers:
 *   source: "plan"    – number/name readable on the plan
 *   source: "derived" – inferred from the drawing geometry (e.g. section names
 *                       made from switch numbers, switch "+"/"−" legs)
 *   source: "unclear" – needs checking against the original documentation
 *
 * Edit this file to correct the layout; engine and UI derive everything else.
 */
window.TOPOLOGY = {
  station: "Сокологірне",
  planDate: "28.10.2014",
  directions: {
    left:  { name: "Якимівка (Мелітополь)", parity: "парний", note: "plan" },
    right: { name: "Партизани (Джанкой)", parity: "непарний", note: "plan" }
  },
  // Nodes: switch points (S*), joints / signal points, line ends.
  nodes: {
    // Coordinates are pixels of the original plan image (2576 x 422).
    // lower main line, y=294 (odd trains → right)
    A0:[-150,294], A1:[70,294], S1:[235,294], A2:[470,294], S9:[545,294], S17:[606,294],
    A3:[700,294], A4:[1742,294], S10:[1893,294], A5:[1950,294], S8:[1999,294],
    A6:[2150,294], S2:[2279,294], A7:[2422,294], A8:[2720,294],
    // upper main line, y=257 (even trains → left)
    B0:[-150,257], B1:[190,257], S3:[339,257], S5:[380,257], S7:[441,257], B2:[500,257],
    B3:[1790,257], S14:[1818,257], B4:[1950,257], S6:[2104,257], B5:[2140,257],
    S4:[2174,257], B6:[2460,257], B7:[2720,257],
    // track 4, y=223
    S11:[465,223], C1:[620,223], C2:[1630,223], S16:[1730,223],
    // track 6 / track 10, y=188
    S13:[702,188], D2:[815,188], D3:[1490,188], S20:[1563,188], S18:[1651,188],
    E1:[1700,188], E2:[2115,188],
    // track 8, y=153; dead-end tracks 14 (y=80) and 15 (y=115)
    S15:[815,153], K9:[700,152], F2:[850,153], F3:[1460,153], S19:[606,115],
    J14:[500,80], H14:[370,80], J15:[500,115], H15:[335,115],
    // track 3, y=327
    G1:[725,327], G2:[1742,327]
  },
  // [nodeA, nodeB, section, {curve:true}] – curve marks edges drawn as arcs in the smooth view
  edges: [
    ["A0","A1","НП"], ["A1","S1","1СП"], ["S1","A2","1СП"], ["S1","S3","1СП"],
    ["B0","B1","ЧУП"], ["B1","S3","3-5СП"], ["S3","S5","3-5СП"], ["S5","S11","3-5СП",{curve:true}],
    ["S5","S7","7СП"], ["S7","B2","7СП"], ["S7","S9","9-17СП"],
    ["A2","S9","9-17СП"], ["S9","S17","9-17СП"], ["S17","A3","9-17СП"], ["S17","G1","9-17СП",{curve:true}],
    ["S11","C1","11-13СП"], ["S11","S13","11-13СП",{curve:true}], ["S13","D2","11-13СП"],
    ["S13","S15","15СП"], ["S15","F2","15СП"], ["S15","K9","15СП"], ["K9","S19","19СП",{curve:true}],
    ["J14","S19","19СП",{curve:true}], ["J15","S19","19СП"],
    ["H14","J14","14П"], ["H15","J15","15П"],
    ["B2","B3","IIП"], ["A3","A4","IП"], ["G1","G2","3П"], ["C1","C2","4П"],
    ["D2","D3","6П"], ["F2","F3","8П"], ["E1","E2","10П"],
    ["D3","S20","18-20СП"], ["F3","S20","18-20СП",{curve:true}], ["S20","S18","18-20СП"], ["S18","E1","18-20СП"],
    ["S18","S16","16СП"], ["C2","S16","16СП"], ["S16","S14","14СП"], ["B3","S14","14СП"], ["S14","B4","14СП"],
    ["A4","S10","10СП"], ["G2","S10","10СП",{curve:true}], ["S10","A5","10СП"],
    ["A5","S8","8СП"], ["S8","A6","8СП"], ["S8","S6","8СП"],
    ["B4","S6","6СП"], ["S6","B5","6СП"], ["B5","S4","4СП"], ["S4","B6","4СП"],
    ["S4","S2","2СП"], ["A6","S2","2СП"], ["S2","A7","2СП"],
    ["B6","B7","ЧП"], ["A7","A8","НУП"]
  ],
  sectionInfo: {
    "НП":   { kind:"approach", len:2000, label:"Наближення з Якимівки (непар.)", source:"derived" },
    "ЧП":   { kind:"approach", len:2000, label:"Наближення з Партизан (пар.)", source:"derived" },
    "ЧУП":  { kind:"exit", len:1500, label:"Віддалення на Якимівку", source:"derived" },
    "НУП":  { kind:"exit", len:1500, label:"Віддалення на Партизани", source:"derived" },
    "IП":   { kind:"track", len:846, label:"Колія I (846 м)", source:"plan" },
    "IIП":  { kind:"track", len:901, label:"Колія II (901 м)", source:"plan" },
    "3П":   { kind:"track", len:854, label:"Колія 3 (854 м)", source:"plan" },
    "4П":   { kind:"track", len:830, label:"Колія 4 (830 м)", source:"plan" },
    "6П":   { kind:"track", len:624, label:"Колія 6 (624 м)", source:"plan" },
    "8П":   { kind:"track", len:607, label:"Колія 8 (607 м)", source:"plan" },
    "10П":  { kind:"track", len:400, label:"Колія 10 (тупик ПЧ-4), довжина не вказана", source:"unclear" },
    "14П":  { kind:"track", len:200, label:"Колія 14 (тяг. підст. ЕЧ-4), довжина не вказана", source:"unclear" },
    "15П":  { kind:"track", len:200, label:"Колія 15 (тупик), довжина не вказана", source:"unclear" }
  },
  // common = point side; plus = straight; minus = diverging (derived from drawing)
  switches: [
    { id:"1",  node:"S1",  common:"A1", plus:"A2", minus:"S3", label:1 },
    { id:"3",  node:"S3",  common:"S5", plus:"B1", minus:"S1", label:-1 },
    { id:"5",  node:"S5",  common:"S3", plus:"S7", minus:"S11", label:-1 },
    { id:"7",  node:"S7",  common:"S5", plus:"B2", minus:"S9", label:1 },
    { id:"9",  node:"S9",  common:"S17",plus:"A2", minus:"S7", label:1 },
    { id:"17", node:"S17", common:"S9", plus:"A3", minus:"G1", label:1 },
    { id:"11", node:"S11", common:"S5", plus:"C1", minus:"S13", label:-1 },
    { id:"13", node:"S13", common:"S11",plus:"D2", minus:"S15", label:1 },
    { id:"15", node:"S15", common:"F2", plus:"K9", minus:"S13", label:-1 },
    { id:"19", node:"S19", common:"K9", plus:"J14",minus:"J15", label:-1 },
    { id:"20", node:"S20", common:"S18",plus:"D3", minus:"F3", label:-1 },
    { id:"18", node:"S18", common:"S20",plus:"E1", minus:"S16", label:-1 },
    { id:"16", node:"S16", common:"S14",plus:"C2", minus:"S18", label:-1 },
    { id:"14", node:"S14", common:"B4", plus:"B3", minus:"S16", label:-1 },
    { id:"10", node:"S10", common:"A5", plus:"A4", minus:"G2", label:1 },
    { id:"8",  node:"S8",  common:"A5", plus:"A6", minus:"S6", label:1 },
    { id:"6",  node:"S6",  common:"B5", plus:"B4", minus:"S8", label:-1 },
    { id:"4",  node:"S4",  common:"B5", plus:"B6", minus:"S2", label:-1 },
    { id:"2",  node:"S2",  common:"A7", plus:"A6", minus:"S4", label:1 }
  ],
  // dir: direction a train passes the signal; side: label above(-1)/below(+1) the track
  signals: [
    { id:"Н",  node:"A1", dir:"R", side:1,  kind:"entry",  approach:"1НП", approachChain:["2НП","1НП"], source:"plan" },
    { id:"Ч",  node:"B6", dir:"L", side:-1, kind:"entry",  approach:"1ЧП", approachChain:["2ЧП","1ЧП"], source:"plan" },
    { id:"Н1", node:"A4", dir:"R", side:1,  kind:"exit", source:"plan" },
    { id:"Н3", node:"G2", dir:"R", side:1,  kind:"exit", source:"plan" },
    { id:"Н4", node:"C2", dir:"R", side:1,  kind:"exit", source:"plan" },
    { id:"Н6", node:"D3", dir:"R", side:1,  kind:"exit", source:"plan" },
    { id:"Ч2", node:"B2", dir:"L", side:-1, kind:"exit", source:"plan",
      note:"на плані підписано «Ч-2»; вихідний з колії II" },
    { id:"Ч3", node:"G1", dir:"L", side:-1, kind:"exit", source:"plan" },
    { id:"Ч4", node:"C1", dir:"L", side:-1, kind:"exit", source:"plan" },
    { id:"Ч6", node:"D2", dir:"L", side:-1, kind:"exit", source:"plan" },
    { id:"М13", node:"F2", dir:"L", side:-1, kind:"shunt", source:"plan" },
    { id:"М9", node:"K9", dir:"R", side:1, kind:"shunt", source:"plan",
      note:"за планом стоїть на з'єднанні від стрілки 19 до 15; призначення (вихід з колій 14/15) — припущення" },
    { id:"ЧД", node:"A7", dir:"L", side:1, kind:"decor", source:"plan", note:"вхід на неправильну колію — не моделюється" }
  ],
  // Shunting signals shown for orientation only (routes from them are not modelled)
  decorSignals: [
    // positions follow the square schematic: each signal stays on the same side of its switch as on the plan
    ["М1",215,309],["М3",226,272],["М5",458,309],["М7",667,200],["М11",720,277],
    ["М22",1445,167],["М20",1800,174],["С30",1885,174],["М18",1752,272],["М16",1860,245],
    ["М8",2052,281],["М6",2226,244],["М4",2216,270],["М2",2335,276]
  ],
  // Route definitions: node path starting at the signal. Sections and switch
  // positions are derived from the path by the engine.
  routes: [
    { id:"Н→I",  from:"Н", to:"IП", type:"train", path:["A1","S1","A2","S9","S17","A3","A4"] },
    { id:"Н→3",  from:"Н", to:"3П", type:"train", path:["A1","S1","A2","S9","S17","G1","G2"] },
    { id:"Н→4",  from:"Н", to:"4П", type:"train", path:["A1","S1","S3","S5","S11","C1","C2"] },
    { id:"Н→6",  from:"Н", to:"6П", type:"train", path:["A1","S1","S3","S5","S11","S13","D2","D3"] },
    { id:"Ч→II", from:"Ч", to:"IIП", type:"train", path:["B6","S4","B5","S6","B4","S14","B3","B2"] },
    { id:"Ч→4",  from:"Ч", to:"4П", type:"train", path:["B6","S4","B5","S6","B4","S14","S16","C2","C1"] },
    { id:"Ч→6",  from:"Ч", to:"6П", type:"train", path:["B6","S4","B5","S6","B4","S14","S16","S18","S20","D3","D2"] },
    { id:"Ч→3",  from:"Ч", to:"3П", type:"train", path:["B6","S4","B5","S6","S8","A5","S10","G2","G1"] },
    { id:"Н1→",  from:"Н1", to:"НУП", type:"train", path:["A4","S10","A5","S8","A6","S2","A7","A8"] },
    { id:"Н3→",  from:"Н3", to:"НУП", type:"train", path:["G2","S10","A5","S8","A6","S2","A7","A8"] },
    { id:"Н4→",  from:"Н4", to:"НУП", type:"train", path:["C2","S16","S14","B4","S6","B5","S4","S2","A7","A8"] },
    { id:"Н6→",  from:"Н6", to:"НУП", type:"train", path:["D3","S20","S18","S16","S14","B4","S6","B5","S4","S2","A7","A8"] },
    { id:"Ч2→",  from:"Ч2", to:"ЧУП", type:"train", path:["B2","S7","S5","S3","B1","B0"] },
    { id:"Ч4→",  from:"Ч4", to:"ЧУП", type:"train", path:["C1","S11","S5","S3","B1","B0"] },
    { id:"Ч6→",  from:"Ч6", to:"ЧУП", type:"train", path:["D2","S13","S11","S5","S3","B1","B0"] },
    { id:"Ч3→",  from:"Ч3", to:"ЧУП", type:"train", path:["G1","S17","S9","S7","S5","S3","B1","B0"] },
    { id:"М13→14", from:"М13", to:"14П", type:"shunt", path:["F2","S15","K9","S19","J14","H14"] },
    { id:"М9→8", from:"М9", to:"8П", type:"shunt", path:["J14","S19","K9","S15","F2","F3"],
      note:"маршрут починається з колії 14 через стрілку 19 до сигналу М9 — модельне спрощення" }
  ],
  // Which exit signal a train meets at the end of a track, by train parity
  exitSignals: {
    odd:  { "IП-3":"Н1", "3П-3":"Н3", "4П-3":"Н4", "6П-3":"Н6" },
    even: { "IIП-1":"Ч2", "4П-1":"Ч4", "6П-1":"Ч6", "3П-1":"Ч3" }
  },
  entrySignal: { odd:"Н", even:"Ч" },
  labels: [
    ["8 607", 1200, 148], ["6 624", 1200, 183], ["4 830", 1200, 218], ["II 901", 1200, 252],
    ["I 846", 1200, 289], ["3 854", 1200, 322], ["10", 2060, 183], ["14", 420, 74], ["15", 420, 109]
  ]
};

/*
 * Square schematic: display-only coordinates that turn every diverging branch into a
 * 45° slope (|dx| = |dy|) between the same neighbours as on the plan. The
 * interlocking uses only the topology, so these overrides change the picture only.
 */
window.TOPOLOGY.displayNodes = {
  S3:[272,257], S11:[414,223], X1113:[449,188], A2:[440,294], S9:[478,294], G1:[639,327],
  S15:[737,153], K9:[700,153], S19:[663,115], J14:[628,80],
  F3:[1528,153], S18:[1749,188], E1:[1775,188], S16:[1784,223],
  S10:[1776,294], S6:[2036,257], S2:[2211,294]
};

/*
 * Finer block division (model). Long sections are cut into several blocks so a
 * train occupies only part of the station. Route paths and switch legs are
 * updated automatically. Block boundaries inside tracks are a model choice,
 * not real insulating joints from the plan.
 */
(function refine(T) {
  function splitEdge(a, b, mids, secs) {
    const i = T.edges.findIndex((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    if (i < 0) throw new Error("splitEdge: no edge " + a + "-" + b);
    const opt = T.edges[i][3];
    mids.forEach(([id, x, y]) => (T.nodes[id] = [x, y]));
    const ids = mids.map((m) => m[0]);
    const chain = [a, ...ids, b];
    const repl = [];
    for (let k = 0; k < chain.length - 1; k++) repl.push(opt ? [chain[k], chain[k + 1], secs[k], opt] : [chain[k], chain[k + 1], secs[k]]);
    T.edges.splice(i, 1, ...repl);
    T.switches.forEach((sw) => {
      ["common", "plus", "minus"].forEach((leg) => {
        if (sw.node === a && sw[leg] === b) sw[leg] = ids[0];
        if (sw.node === b && sw[leg] === a) sw[leg] = ids[ids.length - 1];
      });
    });
    T.routes.forEach((r) => {
      for (let k = 0; k < r.path.length - 1; k++) {
        if (r.path[k] === a && r.path[k + 1] === b) { r.path.splice(k + 1, 0, ...ids); break; }
        if (r.path[k] === b && r.path[k + 1] === a) { r.path.splice(k + 1, 0, ...ids.slice().reverse()); break; }
      }
    });
  }
  function rename(a, b, sec) {
    const e = T.edges.find((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    e[2] = sec;
  }
  // approach / departure: two blocks each
  splitEdge("A0", "A1", [["AP", -40, 294]], ["2НП", "1НП"]);
  splitEdge("B6", "B7", [["BP", 2590, 257]], ["1ЧП", "2ЧП"]);
  splitEdge("A7", "A8", [["AX", 2570, 294]], ["1НУП", "2НУП"]);
  splitEdge("B1", "B0", [["BX", 20, 257]], ["1ЧУП", "2ЧУП"]);
  T.sectionInfo["2НП"] = { kind: "approach", len: 1200, label: "2-й блок наближення з Якимівки", source: "derived" };
  T.sectionInfo["1НП"] = { kind: "approach", len: 1000, label: "1-й блок наближення з Якимівки", source: "derived" };
  T.sectionInfo["2ЧП"] = { kind: "approach", len: 1200, label: "2-й блок наближення з Партизан", source: "derived" };
  T.sectionInfo["1ЧП"] = { kind: "approach", len: 1000, label: "1-й блок наближення з Партизан", source: "derived" };
  T.sectionInfo["1НУП"] = { kind: "exit", len: 800, label: "1-й блок віддалення на Партизани", source: "derived" };
  T.sectionInfo["2НУП"] = { kind: "exit", len: 1000, label: "2-й блок віддалення на Партизани", source: "derived" };
  T.sectionInfo["1ЧУП"] = { kind: "exit", len: 800, label: "1-й блок віддалення на Якимівку", source: "derived" };
  T.sectionInfo["2ЧУП"] = { kind: "exit", len: 1000, label: "2-й блок віддалення на Якимівку", source: "derived" };
  // one switch section per switch
  splitEdge("S3", "S5", [["X35", 360, 257]], ["3СП", "5СП"]);
  splitEdge("S5", "S7", [["X57", 410, 257]], ["5СП", "7СП"]);
  splitEdge("S9", "S17", [["X917", 575, 294]], ["9СП", "17СП"]);
  splitEdge("S11", "S13", [["X1113", 560, 188]], ["11СП", "13СП"]);
  splitEdge("S20", "S18", [["X2018", 1607, 188]], ["20СП", "18СП"]);
  rename("B1", "S3", "3СП"); rename("S5", "S11", "5СП"); rename("S7", "B2", "7СП");
  rename("A2", "S9", "9СП"); rename("S7", "S9", "9СП"); rename("S17", "A3", "17СП"); rename("S17", "G1", "17СП");
  rename("S11", "C1", "11СП"); rename("S13", "D2", "13СП"); rename("D3", "S20", "20СП"); rename("F3", "S20", "20СП"); rename("S18", "E1", "18СП");
  // station tracks: three blocks each (numbered left to right)
  const tracks = [["IП", "A3", "A4", 846, "Колія I"], ["IIП", "B2", "B3", 901, "Колія II"], ["3П", "G1", "G2", 854, "Колія 3"],
                  ["4П", "C1", "C2", 830, "Колія 4"], ["6П", "D2", "D3", 624, "Колія 6"], ["8П", "F2", "F3", 607, "Колія 8"]];
  tracks.forEach(([sec, a, b, len, name]) => {
    const [x1, y] = T.nodes[a], x2 = T.nodes[b][0];
    const m1 = Math.round(x1 + (x2 - x1) / 3), m2 = Math.round(x1 + (2 * (x2 - x1)) / 3);
    splitEdge(a, b, [[sec + "a", m1, y], [sec + "b", m2, y]], [sec + "-1", sec + "-2", sec + "-3"]);
    const src = T.sectionInfo[sec].source;
    for (let k = 1; k <= 3; k++) T.sectionInfo[sec + "-" + k] = { kind: "track", group: sec, len: Math.round(len / 3), label: name + ", блок " + k + " з 3", source: src };
    delete T.sectionInfo[sec];
  });
  ["10П", "14П", "15П"].forEach((s) => (T.sectionInfo[s].group = s));
})(window.TOPOLOGY);


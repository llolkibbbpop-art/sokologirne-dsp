/* Model daily schedule (verbatim from the task JSON). Times are FICTIONAL.
 * modelParams below are simulator assumptions, kept separately. */
window.SCHEDULE = {
  "scheduleId": "sokologirne_autumn_2014_simulation_v1",
  "station": "Сокологірне",
  "period": {
    "start": "00:00",
    "end": "23:59",
    "timezone": "Europe/Kyiv"
  },
  "historicalContext": {
    "referenceYear": 2014,
    "referenceSeason": "autumn",
    "verifiedHistoricalFact": "Passenger trains operated on Crimea-bound routes in 2014; from 27 December 2014 their routes were restricted to Novooleksiivka and Kherson.",
    "warning": "This is NOT an archived station timetable. Times, modeled directions, freight movements and shunting events are simulated."
  },
  "events": [
    {
      "time": "00:18",
      "train": "12",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "01:07",
      "train": "GR-01",
      "type": "freight",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "02:26",
      "train": "11",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "03:42",
      "train": "GR-02",
      "type": "freight",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "04:35",
      "train": "28",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "05:21",
      "train": "MN-01",
      "type": "shunting",
      "direction": "station",
      "action": "shunting_sequence",
      "timeStatus": "fictional"
    },
    {
      "time": "06:14",
      "train": "86",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "07:03",
      "train": "GR-03",
      "type": "freight",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "08:17",
      "train": "87",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "09:26",
      "train": "GR-04",
      "type": "freight",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "10:11",
      "train": "90",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "11:34",
      "train": "MN-02",
      "type": "shunting",
      "direction": "station",
      "action": "shunting_sequence",
      "timeStatus": "fictional"
    },
    {
      "time": "12:22",
      "train": "81",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "13:16",
      "train": "GR-05",
      "type": "freight",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "14:08",
      "train": "85",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "15:27",
      "train": "GR-06",
      "type": "freight",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "16:19",
      "train": "88",
      "type": "passenger",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "17:42",
      "train": "GR-07",
      "type": "freight",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "18:31",
      "train": "82",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "19:24",
      "train": "GR-08",
      "type": "freight",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "20:13",
      "train": "27",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "21:06",
      "train": "89",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "22:18",
      "train": "GR-09",
      "type": "freight",
      "direction": "Dzhankoi",
      "action": "pass_station",
      "timeStatus": "fictional"
    },
    {
      "time": "23:31",
      "train": "131",
      "type": "passenger",
      "direction": "Melitopol",
      "action": "pass_station",
      "timeStatus": "fictional"
    }
  ],
  "simulationRules": {
    "deriveTrackAndSwitchesFromStationPlan": true,
    "inventNoTrackNumbers": true,
    "requireRouteClearanceBeforeMovement": true,
    "requireRouteLocking": true,
    "detectConflictingRoutes": true,
    "logDispatcherActions": true,
    "allowManualDelayInjection": true,
    "allowPauseAndTimeAcceleration": true,
    "showHistoricalAndFictionalDataSeparately": true
  }
};

window.MODEL_PARAMS = {
  // direction in schedule -> train parity on this plan (left = Якимівка/Мелітополь = even)
  directionParity: { "Dzhankoi":"odd", "Melitopol":"even" },
  directionLabel: { "Dzhankoi":"на Джанкой (непар.)", "Melitopol":"на Мелітополь (пар.)", "station":"по станції" },
  // preferred receiving tracks for through trains (main track first, then side track)
  trackPreference: { odd:["IП","3П"], even:["IIП","4П"] },
  appearLeadMin: { passenger:4, freight:6, shunting:1, electric:5, intercity:3 }, // minutes before event time the train appears on approach (model)
  speedKmh: { passenger:60, freight:40, shunting:15, test:50, electric:55, intercity:90 },
  minSectionSec: 8,
  tailSec: 10,                 // time the train tail keeps the previous section occupied
  cancelDelaySec: 180,         // train route cancelled with occupied approach: 3 min (handbook, табл. 2.21)
  cancelDelayShuntSec: 60,     // shunting route: 1 min
  // Recommended receiving track per train type and parity (model choice, shown to the DSP as a hint)
  recommendedTrack: { passenger:{ odd:"IП", even:"IIП" }, freight:{ odd:"3П", even:"4П" }, test:{ odd:"IП", even:"IIП" }, electric:{ odd:"IП", even:"IIП" }, intercity:{ odd:"IП", even:"IIП" } },
  platformTracks: ["IП", "IIП", "3П"],   // island platform between I and II, side platform at 3 (from the plan)
  mainTracks: ["IП", "IIП"],
  // Train length in blocks (deterministic "random" from the train number): [min, max]
  trainBlocks: { passenger:[2,3], freight:[3,5], test:[2,3], shunting:[1,1], electric:[2,2], intercity:[2,3] },         // delayed route release when approach is occupied (model)
  artReleaseSec: 180,         // artificial release 3–4 min (handbook p.144)
  shuntWaitSec: 300,
  shuntingEnabledByDefault: true,
  shuntingPlan: { start:"8П-1", plan:[ { sig:"М13", end:"14П" }, { wait:300 }, { sig:"М9", end:"М22" } ],
    note:"модельний сценарій: 8 → 14 (ЕЧ-4) → 8" },
  // Shunting jobs used by the timetable generator. Each step: open a shunting route from sig to end,
  // or wait (seconds). Places and reversal points follow the signals on the plan; the jobs are model scenarios.
  shuntingJobs: {
    "ЕЧ-14":  { name:"Подача вагонів на колію 14 (тягова підстанція ЕЧ-4)", start:"8П-1",
      plan:[ { sig:"М13", end:"14П" }, { leave:true }, { wait:60 }, { sig:"М9", end:"М22" } ] },
    "ЕЧ-14П": { name:"Прибирання вагонів з колії 14 (ЕЧ-4) на колію 8", start:"8П-1",
      plan:[ { sig:"М13", end:"14П" }, { couple:true }, { wait:120 }, { sig:"М9", end:"М22" } ] },
    "Т-15":   { name:"Подача вагонів у тупик 15", start:"8П-1",
      plan:[ { sig:"М13", end:"15П" }, { leave:true }, { wait:60 }, { sig:"М9", end:"М22" } ] },
    "Т-15П":  { name:"Прибирання вагонів з тупика 15", start:"8П-1",
      plan:[ { sig:"М13", end:"15П" }, { couple:true }, { wait:120 }, { sig:"М9", end:"М22" } ] },
    "ПЧ-10":  { name:"Подача вагонів на колію 10 (ПЧ-4) з колії 6", start:"6П-3",
      plan:[ { sig:"Н6", end:"10П" }, { leave:true }, { wait:60 }, { sig:"М20", end:"Ч6" } ] },
    "ПЧ-10П": { name:"Прибирання вагонів з колії 10 (ПЧ-4) на колію 6", start:"6П-3",
      plan:[ { sig:"Н6", end:"10П" }, { couple:true }, { wait:120 }, { sig:"М20", end:"Ч6" } ] },
    "8-10":   { name:"Локомотив з колії 8 на колію 10 (ПЧ-4) і назад", start:"8П-3",
      plan:[ { sig:"М22", end:"10П" }, { wait:600 }, { sig:"М20", end:"М13" } ] },
    "4-6":    { name:"Перестановка з колії 4 на колію 6: витягування між М6 і М4, зміна напрямку", start:"4П-3",
      plan:[ { sig:"Н4", end:"М4" }, { wait:60 }, { sig:"М6", end:"Ч6" } ] },
    "3-I":    { name:"Перестановка з колії 3 на колію I через праву горловину (витягування за М2)", start:"3П-3",
      plan:[ { sig:"Н3", end:"ЧД" }, { wait:60 }, { sig:"М2", end:"М11" } ] }
  },

  // handbook pp.136–165: switch transfer, cancellation sets, invitation, speed over a diverging switch
  switchTransferSec: 4,
  cancelFreeSec: 6,
  invitationSec: 90,
  divergingKmh: 50
};

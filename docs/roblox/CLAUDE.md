# Project: Roblox port of "АРМ ДСП" (station dispatcher workstation trainer)

## What this is
A Roblox version of an existing browser training simulator of a railway station
dispatcher's workstation (Ukrainian ДСП, АРМ-Ц ДСП МПЦ-У). The browser version is
the reference implementation. Read `docs/HANDOFF.md` first, then the reference code.

## Reference code (read-only)
Browser version repo: `llolkibbbpop-art/sokologirne-dsp` (clone it next to this project,
e.g. `../sokologirne-dsp`, and start Claude Code with `--add-dir ../sokologirne-dsp`).
- `js/engine.js`  simulation core, no DOM, deterministic, 1 s fixed step  -> port to Luau
- `js/stationkit.js` + `js/<station>.js`  station data (nodes, switches, signals, routes) -> port data as-is
- `js/ui.js`  screen/UI (do NOT port literally; Roblox UI is rebuilt)
- `js/i18n.js`  UI strings (Ukrainian + Polish)

## Rules
- Station plans (scans) are in the reference repo `docs/plans/` (see its README). Before porting or changing a
  station, open its plan: signal names, switch numbers and track layout must match the plan. The plan wins
  over code and over general naming rules (e.g. Henichesk really has Н1М and НIIМ).
- Start with ONE station (Henichesk, `js/henichesk.js`, small dead-end station). Others later.
- Server-authoritative: the simulation runs on the server; clients only send commands
  and render state. Validate every remote argument on the server.
- Keep the simulation deterministic: fixed 1 s step, no os.time/random in the core
  (seeded RNG only).
- Station data stays data (ModuleScripts returning tables), not code.
- UI language: Ukrainian (and Polish). Code, comments, commit messages: English.
- Visual style: square, blocky, black/white АРМ look. No rounded corners, no gradients.
- Realism follows the real station plans and the handbook «Автоматизовані станційні системи
  керування рухом поїздів» (pp. 136–166). This is a training model, not connected to anything real.
- Do not change object-interaction dialogs' behaviour (signal/switch panel, train card,
  confirmations, block reason, radio) without asking: the user approved them as they are.
- Prefer small steps; after each step run/playtest through the Studio MCP and report briefly.
- Keep answers short (the user has usage limits). No long recaps.

## Layout (planned)
- ServerScriptService/Sim/   Engine (ModuleScript), Stations/*, Net (RemoteEvents + validation)
- ReplicatedStorage/Shared/  station data, i18n strings, constants
- StarterGui/ or StarterPlayerScripts/   Scheme view, panels

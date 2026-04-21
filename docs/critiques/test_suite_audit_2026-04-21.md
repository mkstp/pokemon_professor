# Test Suite Audit — pokemon_professor

**Date:** 2026-04-21
**Scope reviewed:** `tests/*.test.js` (5 files, ~3,050 lines, 258 registered tests), `tests/runner.js`, `tests/index.html`, `tests/phaser-stub.js`
**Source cross-checked:** `js/engine.js`, `js/scenes/BattleScene.js`, `js/scenes/battle/resolver.js`, `js/data/*`, `js/scenes/BattleModeScene.js`, `js/scenes/MoveKioskScene.js`

---

## 1. Summary

The suite is large (258 tests) but narrow: it is dense in the resolver/engine layer and has zero integration coverage — there is no test that drives `BattleScene.resolveTurn()` end-to-end or simulates a full battle, and five production scenes have no tests at all (`ItemKioskScene`, `MainMenuScene`, `OverworldScene`, `AudioScene`, `DialogueScene`). The bigger problem is the test *runner* rather than test *content*: the suite is browser-only, so agents (including me) repeatedly try `node tests/runner.js` and fail. The most effective fix is a small CLI entry point, not a rewrite of the tests.

---

## 2. Volume & Hardcoded-Value Tests

### 2.1 The actual shape of the suite

`grep -c '^test('` across the five files:

| File | Tests | LOC |
|---|---|---|
| `engine.test.js` | 69 | 533 |
| `data.test.js` | 69 | 669 |
| `battle_scene.test.js` | 84 | 1,241 |
| `battle_mode_scene.test.js` | 12 | 221 |
| `move_kiosk_scene.test.js` | 24 | 388 |
| **Total** | **258** | **3,052** |

Your "100+" instinct is right: the count is 258. Most are short and trivially green, so they read as confirmation rather than protection.

### 2.2 Tests that pin hardcoded numeric values unnecessarily

These tests fail every time a designer retunes a number, without catching any regression that a smarter test would not already catch. They can be deleted or rewritten to assert the *invariant* instead of the literal.

**Asserts that pin current balance data, not behavior:**

- `data.test.js:76` — `assert.equal(playerMoves.length, 6)`. Tightly couples the test to current content; will break the build every time you add or remove a starter move. If this is actually a design invariant, that belongs in a constant in `engine.js` (e.g. `PLAYER_MOVE_POOL_SIZE`) and the test should compare against the constant.
- `data.test.js:106` — `assert.equal(professors.length, 7)`. Same problem. The count of professors is a design choice that can change; the invariant you care about is "at least one professor", "final boss is last", and "the castle-gate count matches PRE_CASTLE_PROFESSOR_IDS". All three are worth testing; the literal 7 is not.
- `data.test.js:137-141` — "every professor has exactly 4 moves". This one is likely a real schema invariant (battle UI has 4 slots); keep it but reference it against the UI's slot count instead of the literal `4`.
- `data.test.js:461-467` — the Schwaartz-specific sprite path test. This hardcodes a single professor's filenames (`schwaartz_l1`, `l2`, `l3`). Replace with a generic loop: "for every professor with `sprites[]`, each path is a string that contains `_l1`/`_l2`/`_l3` at the appropriate index", or just drop — the surrounding generic tests at `data.test.js:425-446` already cover the structural invariant.
- `data.test.js:413-421` — "professors are ordered by increasing HP". Plausible as a design invariant, but fragile. If it's a rule, document it in `docs/tdd/battle.md` and reference that; otherwise delete.

**Asserts that duplicate a balance-data lookup in the test itself:**

Many resolver tests hardcode a move's damage number *in the test fixture* and then assert on that exact number. This means the test does not validate the data table — it validates a copy of it that drifts.

- `battle_scene.test.js:142-153` — `counterexample, damage: 22` fixture, then `assert.equal(bs.opponent.hp, 78)`. If `npcMoves`'s real `counterexample` changes to damage 25, this test still passes because it constructs its own move object instead of reading the real data. That makes it a test of the *arithmetic in the resolver*, not a test of the move. Which is fine, but 40+ tests do the same thing and each hardcodes a specific number.
- `battle_scene.test.js:289-297` — comment says `minimal_pair: damage 18`. If `moves.js` changes `minimal_pair.damage` to 20, this test fails for a reason unrelated to the resolver.
- Similar pattern at lines 168-180, 194-204, 218-242, 286-297, 299-308, 321-332, 334-345, 517-539, 552-574, 576-586, 588-610, 612-624.

**Recommendation:** keep one test per effect handler that verifies the *effect mechanic* (e.g. "halve_next sets target.outgoingHalved"), and remove the tests that merely re-do the multiplication. You can cut roughly 30 tests from `battle_scene.test.js` without losing coverage of any mechanic.

### 2.3 Tests that assert implementation details rather than behavior

- `battle_scene.test.js:120` and many others — `assert.equal(ctx.seq.length, 2, 'seq should have exactly two steps')`. The test couples to the exact number of visual steps pushed onto `seq`. If you later split "damage text" into "damage text" + "critical-hit flash", every one of these breaks even though the behavior is better. Assert on *content* ("seq contains a text step mentioning 'damage'") not *length*.
- `battle_mode_scene.test.js:74-111` — five tests pinning the student-per-page slice boundaries (`#1`, `#8`, `#9`, `#15`). All five would pass or fail as a group. One combined test with a loop ("first student on page N is at index 8N+1, count matches STUDENTS_PER_PAGE") would be sufficient and more legible.

### 2.4 Verdict on volume

Roughly **60–80 tests** (25–30% of the suite) can be removed or merged without losing any real coverage. Target files:

- `battle_scene.test.js`: collapse per-effect arithmetic tests; keep one test per effect mechanism.
- `data.test.js`: drop hardcoded counts; keep structural/referential-integrity tests (those are the genuinely valuable ones in that file).
- `battle_mode_scene.test.js`: merge page-boundary tests; consider dropping entirely (see section 5).

---

## 3. Coverage Gaps

### 3.1 The critical gap: no integration-level testing

The phrase `resolveTurn` appears in the test directory exactly **twice** — both in comments:

```
tests/battle_scene.test.js:30:// Creates a context object (ctx) that matches what resolveTurn() passes to
tests/battle_mode_scene.test.js:54:  scene._studPage = 1; // simulate having navigated to page 1
```

Not one test ever calls `BattleScene.prototype.resolveTurn`. This is the central game loop. Consequently, the following are **untested**:

- **Priority-order branching** in `BattleScene.js:447-462`. The logic `npcGoesFirst = bs.opponent.priority && !bs.player.priority` and the subsequent `if/else` have zero coverage. A bug here (e.g. `||` instead of `&&`) would not be caught.
- **Deferred damage ordering** — `BattleScene.js:445` applies deferred damage first, before priority. No test verifies this ordering against a full turn.
- **The seq execution pipeline** — `_runSequence` threading `text`/`animP`/`animPl` callbacks is only tested via stubs.
- **Cascading fainting states** — e.g. player uses `self_damage` that kills them on the same turn the opponent would also have died. Who "wins" the race condition? Unknown; untested.

### 3.2 Scenes with zero tests

Five production scenes have no test file at all:

- `js/scenes/ItemKioskScene.js` (17 KB, ~500 lines, item-equipping UI with its own scroll/selection logic closely parallel to `MoveKioskScene` — and `MoveKioskScene` has 24 tests)
- `js/scenes/MainMenuScene.js`
- `js/scenes/OverworldScene.js`
- `js/scenes/AudioScene.js`
- `js/scenes/DialogueScene.js`

The `ItemKioskScene` omission is particularly striking because it structurally mirrors `MoveKioskScene` and introduces its own bugs (e.g. cap-enforcement on the 4-slot active loadout — see `engine.js:246-252` for `equipItem`'s cap and no-op branches). None of that is tested.

### 3.3 Engine API gaps

`engine.js` exports several functions with no coverage:

- `equipItem`, `unequipItem`, `useActiveItem`, `getActiveItems`, `isItemSpent`, `getAllConsumables` (the entire item-loadout system at `engine.js:234-282`)
- `setRegion`, `setPlayerPosition`, `setPendingEncounter`

### 3.4 What a minimal integration test would look like

One file, ~100 lines, that exercises the full turn loop through the public resolver interface rather than through `BattleScene` (which requires Phaser stubs). Roughly:

```js
// tests/battle_integration.test.js
import { test, assert } from './runner.js';
import * as engine from '../js/engine.js';
import { applyDeferredDamage, applyPlayerMove, applyOpponentTurn }
  from '../js/scenes/battle/resolver.js';
import { professors } from '../js/data/professors.js';
import { playerMoves } from '../js/data/moves.js';

// Drives a single turn of player + opponent resolution against real data,
// asserting only outcomes that are deterministic (turn order + HP bookkeeping),
// not randomised effects.
function runTurn(bs, ctx) {
  if (applyDeferredDamage(ctx)) return 'loss';
  const goesFirst = bs.opponent.priority && !bs.player.priority;
  bs.opponent.priority = bs.player.priority = false;
  if (goesFirst) {
    const r = applyOpponentTurn(ctx); if (r) return r;
    return applyPlayerMove(ctx);
  }
  const r = applyPlayerMove(ctx); if (r) return r;
  return applyOpponentTurn(ctx);
}

test('integration: player can defeat first professor using real data', () => {
  engine.init();
  const prof = professors[0]; // schwaartz
  const bs = makeRealBattleState(prof);
  const ctx = makeCtx(bs, 'professor', prof.id);
  // Loop turns until one side reaches 0. Cap at 50 turns to avoid infinite
  // loops from stochastic effects.
  let result = null;
  for (let i = 0; i < 50 && !result; i++) {
    result = runTurn(bs, ctx);
  }
  assert.ok(result === 'win' || result === 'loss', 'battle must reach a terminal state');
  if (result === 'win') assert.ok(engine.isDefeated(prof.id));
});

test('integration: priority causes opponent to act first', () => { /* ... */ });
test('integration: deferred damage applies before either turn', () => { /* ... */ });
test('integration: a fresh game can reach level 2 by defeating one professor', () => { /* ... */ });
```

This adds 4–8 tests and would catch the largest class of regressions (turn ordering, data↔resolver wiring, XP award through the real pipeline) that the current unit tests cannot.

### 3.5 Missing edge-case tests

- **Item-in-battle**: `BattleScene.js:749` comment says it has a parallel flow "mirroring resolveTurn() but replacing the player move with item use". That flow is not tested.
- **`_openItemMenu` happy path** is tested (`battle_scene.test.js:1052`) but the item *consumption during battle* and its interaction with `deferredIncoming` / `player.hp` sync (`resolver.js:237`, `261`, `344`) is not.
- **`awardXP` multi-level**: no test for gaining enough XP to cross two level thresholds in one call.
- **`equipItem` cap enforcement**: `engine.js:248` — `if (activeItems.length >= 4) return` has no test.

---

## 4. Test Runner

I probed runtimes on this machine and got:

```
$ which node deno npx python3
node  not found
deno  not found
npx   not found
python3 -> /Library/Frameworks/Python.framework/Versions/3.11/bin/python3
```

So only Python 3 is available. Evaluating each option against that constraint:

### 4.1 Node-compatible shim (minimal polyfill in runner.js)

**Feasibility: not possible without Node.** The user question already anticipates this, but the shim only helps if Node is installed. It is not. Nothing in this approach works.

### 4.2 Deno runner

**Feasibility: not possible without Deno.** `which deno` returns nothing. Installing Deno without `brew`/`curl`/admin rights is non-trivial; even if available, it is a second runtime to maintain. **Skip.**

### 4.3 Headless browser (Playwright / Puppeteer)

**Feasibility: not possible without npm/Node.** Playwright is a Node package. No Node, no Playwright. **Skip.**

### 4.4 Keep browser-only + document the constraint

This is what should happen *in addition to* the recommendation below, not instead of it. A `CLAUDE.md` note such as:

> Tests run only in the browser. Open `tests/index.html` and read the results. Do not attempt `node tests/runner.js` — Node is not installed on this machine.

would prevent the repeated failed `node` attempts I (and future agents) make. This should be added regardless.

### 4.5 Recommendation: Python HTTP server + headless-capable entrypoint

Python 3 is already on the system. Three concrete improvements that together solve the problem:

**(a) Add a shell convenience script** `tests/serve.sh`:

```sh
#!/usr/bin/env sh
# Serves the project root on localhost:8000 so tests/index.html loads as http://localhost:8000/tests/
cd "$(dirname "$0")/.."
exec python3 -m http.server 8000
```

Then `open http://localhost:8000/tests/` is the single command for a human run. The agent can start `python3 -m http.server` in the background and leave the browser to the user.

**(b) Add an auto-exit signal to the runner so results can be scraped.** Modify `tests/runner.js:renderResults()` to also write the result summary to `document.title` and set `window.__TEST_RESULTS__`:

```js
document.title = failed > 0 ? `FAIL ${failed}/${total}` : `PASS ${total}`;
window.__TEST_RESULTS__ = { total, passed, failed, results };
```

**(c) Add a headless verifier using only Python + a WebKit-or-Chromium wrapper that is already on macOS: Safari's `webkit2png` or, more reliably, the `open -g -a 'Safari'` + AppleScript path.** This is brittle. A better middle ground is the standard CLAUDE.md note plus a `python3 -m http.server` helper, and defer true CI to when Node is installable.

**If a single-command workflow is the goal and system installs are acceptable**, ask the user to install Deno once (single binary, no npm): `curl -fsSL https://deno.land/install.sh | sh`. Then `deno run --allow-read tests/runner.js` becomes possible after a ~20-line shim that replaces the `document.createElement` branch in `renderResults()` with a `console.log` path when `typeof document === 'undefined'`. This is the cleanest outcome and worth a one-time ask.

**Concrete recommendation, in order of effort:**

1. **Immediately:** add the `CLAUDE.md` note and a `tests/serve.sh` (five minutes, eliminates the daily "Node not found" failure mode).
2. **Next session:** ask the user to install Deno, add a `renderResults()` branch that emits to `console.log` when `document` is absent, and document `deno run --allow-read tests/runner.js` as the CLI command.
3. **Optional later:** once Node is installable, add `@playwright/test` + a minimal config — but the Deno route gives you 90% of the value at 5% of the setup.

---

## 5. Consolidation Opportunities

### 5.1 `battle_scene.test.js` (1,241 lines) — largest bloat source

Two structural issues:

**(a) Near-identical test bodies for each move effect.** Lines 168-180, 194-204, 218-242, and many others have the same shape: construct a `makeBattleState`, inject a fabricated move, call `applyPlayerMove`, assert a flag was set. These should be a table-driven test:

```js
const effectCases = [
  { effect: 'halve_next',   expect: bs => bs.opponent.outgoingHalved === true },
  { effect: 'skip',         expect: bs => bs.opponent.skippedTurns === 1 },
  { effect: 'clear_debuff', expect: bs => bs.player.outgoingHalved === false,
                            setup:  bs => bs.player.outgoingHalved = true },
  // ...
];
effectCases.forEach(c => test(`applyPlayerMove effect: ${c.effect}`, () => { ... }));
```

That collapses ~25 effect tests into one loop.

**(b) Three distinct test targets are living in one file.** `battle_scene.test.js` mixes tests of the resolver (`applyPlayerMove` / `applyOpponentTurn` / `applyDeferredDamage`), tests of `BattleScene` instance methods (`_setUIMode`, `_openItemMenu`, `_itemEffectMessage`, `_endSeq`), and tests of rendering helpers (`_drawPlayerXPBar`). Split into:

- `resolver.test.js` — ~400 lines after consolidation
- `battle_scene_ui.test.js` — ~300 lines (the `_setUIMode`, `_endSeq`, XP-bar rendering)

Each file becomes navigable again.

### 5.2 `battle_mode_scene.test.js` (221 lines)

12 tests for a paginated button-list is excessive. 3–4 tests would cover this: one for "page 0 shows students 1..N", one for "Next on last page is hidden", one for "clicking Next+Prev toggles `_studPage`". The onClick-capture dance in `battle_mode_scene.test.js:169-195` is especially convoluted for what is effectively a counter. Consider deleting this file entirely and covering pagination via a 10-line test once integration coverage lands.

### 5.3 `data.test.js` (669 lines) — mostly good, but trimmable

Keep the referential-integrity tests (lines 160-200, 334-366, 369-377, 402-411, 564-586). Those catch real bugs — a broken `moveId` reference would crash the game on battle entry, and this file would catch it before launch. That is genuinely valuable coverage and should not be trimmed.

Drop:
- Length-count tests (lines 75-76, 105-106) — see section 2.2.
- Schwaartz-specific sprite tests (lines 461-467) — generalize.
- Per-field `has all keys` tests (e.g. 39-46, 79-86, 109-116, 537-544) — these repeat the schema in the test. Better solved by adding a single shared `assertHasFields(obj, [...])` helper and calling it four times, not 20.

Estimated trim: 669 → ~450 lines.

### 5.4 `move_kiosk_scene.test.js` and `engine.test.js`

Both are roughly right-sized. `engine.test.js` has the best test/value ratio of the five files — most tests verify actual state transitions and a few hardcoded values (HP=100, XP_PER_LEVEL=70) are defensible because they match named constants. Keep largely as-is.

---

## 6. Prioritized Action List

Ordered by impact-per-hour.

1. **(15 min, highest impact)** Add a line to `CLAUDE.md` under "Code Quality Assurance": `Tests are browser-only. Open tests/index.html to run them. Do not attempt `node tests/runner.js` — Node is not installed.` This alone eliminates the recurring friction the user flagged.

2. **(30 min, high impact)** Add `tests/battle_integration.test.js` with 4–6 tests that drive a full turn loop through the resolver using real data — one end-to-end "win a battle" simulation, one priority-ordering test, one deferred-damage ordering test, one XP-through-level-up test. This fills the single largest coverage gap in the suite.

3. **(1 hour, high impact)** Consolidate `battle_scene.test.js` into a table-driven resolver test + a separate UI file. Drop length-count tests in `data.test.js`. Net: delete ~60 tests, gain navigability. File drops from 1,241 to ~700 lines.

4. **(30 min, medium impact)** Write `tests/item_kiosk_scene.test.js` mirroring `move_kiosk_scene.test.js`. The code is structurally parallel and the lack of coverage is glaring. Also adds tests for the untested `engine.js` item-loadout functions (`equipItem`, `unequipItem`, `useActiveItem`).

5. **(optional, 1 hour, medium impact if the user is willing to install Deno)** Add a no-`document` branch to `renderResults()` and a `tests/deno_runner.js` wrapper. Document `deno run --allow-read tests/deno_runner.js` in CLAUDE.md. This gives the agent a working CLI test command and is the only path to real automation on this machine without new binaries beyond Deno itself.

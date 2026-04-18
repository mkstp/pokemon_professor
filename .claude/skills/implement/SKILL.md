---
name: implement
description: Development workflow with proportionate testing. Writes tests for behavior changes, skips ceremony for trivial edits, prunes as it goes. Never manages beads issues or commits. Invoke with: "use the implementer to [description of change]".
---

# SKILL: Implement

## Trigger Conditions

Activate when the user: says "implement", "code", "build" or asks to do any work on source code.

---

## Procedure

Follow these phases in order. This skill covers development only — no commits, no pushes.

## Principles

- Never silently work around problems. Throw errors for missing env vars, invalid state, missing dependencies.
- Mock properly in tests. Do not add production fallbacks to make tests pass.
- No type casts that bypass the type system.
- No optional chaining on required properties.
- Tests exist to catch regressions in behavior users or callers depend on. Write them when they earn their keep; skip them when they don't.

## Phase 1: Decide what testing this change needs

Before touching code, classify the change:

**Behavior change — tests required.** The change adds, modifies, or removes behavior a user or caller depends on: business logic, error handling, data transformations, API contracts, auth/permission logic, persistence behavior, user-visible UI states. Write failing tests before implementing (or, for removals, tests asserting the old behavior is gone — these pass after implementation).

**Non-behavioral change — tests not required.** Pure renames, type-only changes, formatting, dependency bumps with no API surface change, moving code between files without altering it, comment/doc edits. Skip to Phase 2. State your reasoning in the Phase 5 summary.

**Ambiguous — default to writing tests.** If you're unsure which bucket the change falls into, treat it as a behavior change. The cost of a test you didn't strictly need is lower than the cost of a regression.

### If tests are required

1. Read the relevant production code to understand current behavior.
2. Write tests describing the desired behavior after your change. Prefer one well-targeted integration test over several unit tests that collectively cover the same behavior. Test observable behavior, not implementation details.
3. Run the tests (see **Quality Gates** in CLAUDE.md).

**Gate:** Your new tests fail against the current code. If they already pass, they aren't testing the change — rewrite them.

## Phase 2: Implement

Make the production code changes. Keep them minimal and focused on the task.

## Phase 3: Verify and prune

Run the full test suite. All tests must pass with zero errors.

Then prune. Your change may have made existing tests redundant or wrong:

- **Redundant:** an existing test now duplicates coverage your new test provides. Delete the weaker one (usually the older, narrower unit test).
- **Stale:** a test asserts behavior the change removed or altered. Delete or rewrite it.
- **Implementation-coupled:** a test breaks because it asserted internal details (private method calls, exact intermediate values) rather than observable behavior. If the behavior is still correct, rewrite the test against the behavior, or delete it if another test already covers the behavior.

Re-run the suite after pruning.

**Gate:** All tests pass. The suite is no larger than it needs to be.

## Phase 4: Coverage audit (conditional)

Only run this phase if the change touched **core business logic, a layer boundary** (repository, API route, auth flow), **or fixed a bug**. For small localized changes, the Phase 1 tests are sufficient coverage — skip to Phase 5.

If the phase applies:

1. `git diff --name-only` — separate production files from test files.
2. For each changed production file, check for gaps:
   - Happy path for new/changed behavior
   - Error paths and realistic edge cases (not every theoretically possible input)
   - **Regression test if this is a bug fix** — a test that would have caught the original bug. This is the one coverage check that is never optional for bug fixes.
   - Integration coverage if the change crosses layers
3. Fill real gaps. Do not write tests to hit a coverage number or to exercise trivial code (getters, pass-through wiring, config).

Re-run the suite.

**Gate:** All tests pass. Any bug fix has a regression test.

## Phase 5: Summary

**This must be the very last thing you output.** The coordinator reads your result — keep it concise to avoid polluting its context.

Produce exactly this and nothing else after it:

```
IMPLEMENTATION RESULT: SUCCESS | FAILURE

Task: <task-id or "N/A" if not provided>
Commit: <full commit hash, or "N/A" on failure>

## What changed
- <1 bullet per logical change, max 5>

## Files modified
- <path> — <what changed in 1 phrase>

## Testing
- <classification from Phase 1: behavior change / non-behavioral / ambiguous>
- <tests added, modified, or deleted — or "None; non-behavioral change" with 1-sentence reasoning>

## Concerns
- <anything the coordinator should know, or "None">
```

If implementation failed, replace "What changed" with:

```
## Error
<what went wrong — 1-3 sentences>

## Attempted
- <what you tried>
```

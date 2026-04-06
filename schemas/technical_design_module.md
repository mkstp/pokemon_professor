# Schema: Technical Design Module

File: `tdd/[module-name].md`

One file per game module. Each file documents the implementation contract for a single module: what it owns, what it exposes, and how it connects to the rest of the system.

---

## Required Sections

### Header block

```
# TDD: [Module Name]

**File:** `js/[filename].js`
**Depends on:** [comma-separated list of other modules, or "none"]
```

### Responsibility

One to two sentences. State what this module solely owns and is responsible for. Be precise — if another module could reasonably claim ownership of something, name the boundary explicitly.

```
## Responsibility

[1–2 sentence ownership statement]
```

### Data Structures

Define every object schema that this module owns or originates. Use inline JS object literals with comments on each field. If the module owns no data structures, write `None.`

```
## Data Structures

### ObjectName

```js
{
  field: type,     // description
  field: type,     // description
}
```
```

### Functions

One entry per exported or significant internal function. Order by call sequence if one exists (e.g. init → update → draw).

```
## Functions

### functionName(param1, param2)

- **Does:** [one sentence — what it does, not how]
- **Inputs:** `param1` — [type]: [meaning]; `param2` — [type]: [meaning]
- **Returns:** [type]: [meaning] — or `void`
- **Side effects:** [any direct writes to gameState or module-level variables; "none" if pure]
```

### Module Interfaces

Describe what this module reads from other modules and what it exposes for others to call. This makes cross-module dependencies explicit.

```
## Module Interfaces

**Reads from:** [module] — [what it reads and why]
**Exposes to:** [module] — [what functions or data it makes available]
```

---

## Conventions

- Functions are documented by their *contract* (what callers need to know), not their implementation.
- Side effects must be named explicitly. A function that writes to `gameState` is not pure — say so.
- Data structures defined here are the authoritative schema. `data.js` entries must conform to these definitions.
- When a function is added or signature changes, update this file before or alongside the code change.

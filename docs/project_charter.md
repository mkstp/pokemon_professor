# Project Charter: pokemon_professor

## Overarching Objective

Build a browser-based, retro pixel-art RPG in which a student navigates a university campus and battles professors — each a caricature of their research field — to pass their classes. The game adapts the classic Pokemon formula to an academic setting, delivering a playable proof-of-concept with a complete core loop.

## Portfolio Objective

Demonstrate a disciplined, AI-assisted development methodology. The project serves as a portfolio artefact showing how design decisions are made, documented, and traced from concept through implementation. The design documents (GDD, TDD, session logs) are first-class deliverables — not byproducts — and together with the codebase tell the story of how the project was built. A `DESIGN.md` at the repository root explains the methodology and surfaces the process for portfolio reviewers.

## Project Purpose

pokemon_professor is a standalone browser game built with HTML/CSS/JavaScript. The player controls a student character who roams a tile-based campus — including outdoor areas, building interiors, and hidden regions — and triggers turn-based battles with a fixed sequence of seven professors. Each professor has scripted dialogue and a research-themed persona. Winning a battle passes the corresponding class; losing causes the player to faint and restart. The game features scene-appropriate background music and weather animations in the overworld.

## Scope Commitments

**In scope:**
- Tile-based campus map with multiple regions: outdoor campus, building interiors, and optional hidden areas
- Overworld player movement and professor encounter triggers
- Turn-based battle system faithful to classic Pokemon: moves, attacks, run option
- Seven professors in a fixed challenge sequence, each with a research-themed persona
- Dialogue system: scripted conversations between the player and professors before or after encounters
- Win/lose states: pass class on victory, faint and restart on defeat
- Background music with tracks that change by scene (overworld, battle, etc.)
- Weather animations in the overworld (e.g. rain, wind)
- Retro pixel art visual style throughout
- Proof-of-concept target: one fully playable end-to-end loop
- Two-layer code structure with explicit separation: the *data layer* (`js/data/`) is split into domain files (professors, moves, regions, dialogue, etc.) for LLM-context efficiency — each file exports self-contained static data with no logic. The *logic layer* is organised for comprehensibility: files should be readable without architectural context, and small files should remain flat and linear. When a logic file grows to the point where its breadth of responsibility makes it difficult to navigate or modify, it may be split along a clear responsibility boundary into a shallow module group (one level deep, no nested hierarchies). Any such split must be justified by reduced cognitive load, not by pattern preference. All import paths are explicit; no barrel files or index re-exports exist.
- Inline comments throughout explaining the purpose of non-obvious logic
- **Phaser 3** is the sole approved external library. Vetted on three criteria: (1) necessity — it handles tile rendering, scene management, input, audio, and the game loop, eliminating five categories of manual implementation; (2) documentation quality — comprehensive official documentation and active community; (3) net complexity — it reduces rather than adds complexity for a non-specialist reader, provided the Phaser Scene lifecycle (preload / create / update) is explained once in DESIGN.md. Loaded as a local file; no CDN dependency, no build step. All other external library inclusions remain prohibited unless vetted by the same criteria.

**Out of scope:**
- Multiplayer or networked features
- Saving/loading game state
- Pokemon-style catching mechanics
- Multiple player characters or teams
- Build tools, bundlers, or package managers — the game must open via `index.html` with no build step
- Libraries included for convenience rather than necessity

## Validation Conditions

**VC-01:** The game runs without errors in a modern web browser with no server required.
- **Applies to:** Final deliverable (game build)
- **Check method:** Open `index.html` directly in browser; confirm no console errors on load and during normal play

**VC-02:** The player can navigate the campus map and trigger a battle with each of the six professors.
- **Applies to:** Overworld and encounter system
- **Check method:** Manual playthrough; confirm all six encounter triggers fire correctly in sequence

**VC-03:** Each battle resolves correctly — win advances progression, loss resets to start.
- **Applies to:** Battle system
- **Check method:** Manual test of win and loss conditions for at least one professor

**VC-04:** Each professor has a distinct research-themed persona reflected in their battle moveset or dialogue.
- **Applies to:** Professor character definitions
- **Check method:** Review professor data; confirm each has a unique name, theme, and at least two thematic moves

**VC-05:** Any mechanic in the codebase can be located and understood by the project owner without architectural guidance.
- **Applies to:** Entire codebase
- **Check method:** Owner selects one mechanic (e.g. battle damage calculation); confirms they can find the relevant file by name alone (no map or index required), read the relevant code, and understand what it does using only that file and its inline comments. If the mechanic spans two files, the boundary between them must be self-evident from their names.

**VC-06:** Dialogue triggers and resolves correctly before or after a professor encounter.
- **Applies to:** Dialogue system
- **Check method:** Manual playthrough; confirm at least one professor's dialogue sequence plays in full and control returns to the overworld or battle as expected

**VC-07:** Background music changes appropriately when switching between overworld and battle scenes.
- **Applies to:** Audio system
- **Check method:** Manual playthrough; confirm overworld track plays on load, battle track plays on encounter, and overworld track resumes on resolution

**VC-08:** At least one weather effect is visible in the overworld and does not cause noticeable performance degradation.
- **Applies to:** Weather animation system
- **Check method:** Enable weather; confirm animation renders correctly and overworld movement remains responsive

**VC-09:** The player can transition between at least two distinct map regions (e.g. outdoor campus to a building interior) and return.
- **Applies to:** Multi-region map system
- **Check method:** Manual playthrough; confirm transition triggers fire, the new map loads correctly, and the player can return to the origin map

**VC-10:** The castle is inaccessible until all five prior professors have been defeated; it becomes accessible immediately after the fifth defeat.
- **Applies to:** Castle gate mechanic (map module)
- **Check method:** Attempt to enter the castle with zero to four professors defeated — confirm the path is blocked. Defeat the fifth professor and confirm the path opens.

**VC-11:** The repository contains a `DESIGN.md` that a reader unfamiliar with the project can use to understand the methodology, navigate the artefacts, and trace a design decision from concept to code.
- **Applies to:** Portfolio documentation (DEL-004)
- **Check method:** A reader with no prior project context reviews `DESIGN.md`; confirms they can identify the purpose of the GDD, TDD, and session logs, and can follow at least one decision from the change log through to the relevant code or design document.

---

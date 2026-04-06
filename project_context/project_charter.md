# Project Charter: pokemon_professor

## Overarching Objective

Build a browser-based, retro pixel-art RPG in which a student navigates a university campus and battles professors — each a caricature of their research field — to pass their classes. The game adapts the classic Pokemon formula to an academic setting, delivering a playable proof-of-concept with a complete core loop.

## Project Purpose

pokemon_professor is a standalone browser game built with HTML/CSS/JavaScript. The player controls a student character who roams an outdoor campus map and triggers turn-based battles with a fixed sequence of six professors. Winning a battle passes the corresponding class; losing causes the player to faint and restart.

## Scope Commitments

**In scope:**
- Outdoor campus map with tile-based movement (no building interiors)
- Overworld player movement and professor encounter triggers
- Turn-based battle system faithful to classic Pokemon: moves, attacks, run option
- Six professors in a fixed challenge sequence, each with a research-themed persona
- Win/lose states: pass class on victory, faint and restart on defeat
- Retro pixel art visual style throughout
- Proof-of-concept target: one fully playable end-to-end loop

**Out of scope:**
- Building interiors or indoor maps
- Multiplayer or networked features
- Saving/loading game state
- Sound or music (unless trivially added)
- Pokemon-style catching mechanics
- Multiple player characters or teams

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

---

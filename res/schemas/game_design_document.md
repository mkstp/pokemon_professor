# Schema: Game Design Document

File: `game_design.md` (single file at project root or in `project_context/`)

The GDD captures the player-facing design of the game: what it feels like to play, who the characters are, what the world looks like, and how each system is meant to behave from the player's perspective. It is not a coding document — implementation details belong in the TDD. When a design decision has implementation consequences, note it and create a corresponding TDD entry.

---

## Required Sections

### Overview

```
## Overview

**Premise:** [One sentence — what is this game and what is the player doing?]
**Player fantasy:** [One sentence — what feeling or experience is the game selling?]
**Tone:** [Two to four adjectives — e.g. "nostalgic, irreverent, low-stakes, collegiate"]
**Target session length:** [Estimated play time for one full run]
```

### World & Setting

Describe the campus as a place. What does it look like? What is the atmosphere? How does the academic setting shape the game's personality?

```
## World & Setting

[2–4 paragraphs covering: physical layout of the campus, atmosphere and tone, how the setting
reinforces the game's premise, any notable locations beyond the main map]
```

### Player Character

```
## Player Character

**Name:** [Name or "unnamed student"]
**Description:** [1–2 sentences on appearance and role]
**Stats:** [List of stats the player has — e.g. HP, and any battle stats]
**Starting condition:** [HP, position, defeated professors at game start]
```

### Professors

One entry per professor. Order by encounter sequence.

```
## Professors

### [Number]. Professor [Name]

- **Department / Field:** [Academic field this professor represents]
- **Personality:** [2–3 sentences: how they speak, what they're like, what makes them a caricature]
- **Visual design notes:** [Sprite description — colours, distinguishing features, retro pixel style cues]
- **Location:** [Where on the map the player finds them]
- **Pre-battle dialogue:** [2–4 lines of scripted dialogue before the fight begins]
- **Post-battle dialogue (win):** [1–2 lines]
- **Post-battle dialogue (loss):** [1–2 lines, optional]
- **Moves:**
  - [Move name] — [damage/effect], [thematic justification]
  - [Move name] — [damage/effect], [thematic justification]
- **HP:** [value]
- **Difficulty position:** [e.g. "1 of 6 — introductory"]
```

### Campus Map

```
## Campus Map

### Regions

List each distinct map region with a brief description.

| Region | Description | Connections |
|--------|-------------|-------------|
| [name] | [what it is and looks like] | [regions it connects to] |

### Key Locations

List specific tiles or zones that matter to gameplay (encounter triggers, transition points, items if any).

| Location | Region | Purpose |
|----------|--------|---------|

### Visual Style Notes

[Describe tileset style, colour palette, perspective, and any atmospheric details like weather or time of day]
```

### Battle System

```
## Battle System

**Structure:** [Turn order, how turns alternate]
**Player actions:** [List of available actions per turn — e.g. Fight, Run]
**Damage model:** [How damage is calculated — keep it plain English]
**Win condition:** [What constitutes a win]
**Loss condition:** [What constitutes a loss and what happens next]
**Progression:** [How defeating professors advances the game state]
```

### Dialogue System

```
## Dialogue System

**Trigger points:** [When dialogue fires — e.g. on encounter, post-battle]
**Structure:** [How a dialogue sequence is defined — speaker + line, advancing on input]
**UI notes:** [Where the dialogue box appears, font style, any portrait or name display]
```

### Audio

```
## Audio

| Track | Scene | Notes |
|-------|-------|-------|
| [name] | [where it plays] | [style, mood, looping behaviour] |
```

### Weather & Atmosphere

```
## Weather & Atmosphere

| Effect | Region(s) | Description | Trigger |
|--------|-----------|-------------|---------|
| [name] | [where] | [what it looks like] | [always-on / time-based / random] |
```

---

## Conventions

- Write from the player's perspective. Describe what the player *sees* and *experiences*, not how the code works.
- Dialogue entries are drafts, not final — refine during implementation. Mark placeholder lines with `[placeholder]`.
- If a design decision constrains implementation (e.g. "damage is always a round number"), flag it with **→ TDD note:** and the relevant module.
- Keep professor personalities distinct enough that a reader could identify which professor is speaking from dialogue alone, without the name label.

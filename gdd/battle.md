# GDD: Battle System

---

**Structure:** Turn-based. Player acts first each turn. One action per turn per side.
**Player actions:** Fight (select a move), Run (exit battle — returns to overworld; professor is not defeated).
**Damage model:** Each move has a fixed damage value. No random variance in the proof-of-concept. Professor moves deal fixed damage to the player. Damage values are plain integers — no multipliers or type matchups.
**Win condition:** Reduce the professor's HP to 0.
**Loss condition:** Player HP reaches 0. Player "faints" — a brief loss screen plays, then the game resets to the starting position with full HP. Defeated professors remain defeated.

> **→ TDD note (battle):** Player HP must persist across battles within a session (not reset between encounters). HP only resets on full game restart.

**Progression:** Defeating a professor marks them as defeated in game state. The overworld reflects this (e.g. the professor is no longer present at their location, or a brief acknowledgement is shown). The hill path to the castle unlocks when all five prior professors are defeated.

**Player moves:** See `gdd/player.md`. Six moves, always available, no use limits.

> **→ TDD note (battle):** Move selection UI should display move name and a one-line description. No PP/use limits in proof-of-concept — moves are always available.

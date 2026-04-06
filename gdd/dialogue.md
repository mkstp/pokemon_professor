# GDD: Dialogue System

---

**Trigger points:** Dialogue fires on professor encounter (pre-battle) and on battle resolution (post-battle win or loss). No mid-battle dialogue in the proof-of-concept.
**Structure:** A dialogue sequence is an ordered array of `{ speaker, line }` objects. The player advances each line with a keypress or click. No branching in the proof-of-concept — dialogue is linear.
**UI notes:** Dialogue box at the bottom of the screen, consistent with classic RPG conventions. Speaker name displayed above the text. Retro pixel font. No character portraits in proof-of-concept — name label is sufficient.

> **→ TDD note (dialogue):** Dialogue sequences should be defined as static data (arrays of objects), not inline in logic. Each professor's pre- and post-battle sequences live in a data file separate from battle logic.

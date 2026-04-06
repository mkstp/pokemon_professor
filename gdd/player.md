# GDD: Player

---

## Player Character

**Name:** Unnamed student.
**Description:** A graduate student, newly arrived. Appearance is defined by the player's imagination; no sprite details are prescribed. Carries a bright orange backpack.
**Stats:**
- HP: 100
- Attack: derived from move selection (no separate stat)

**Starting condition:** Full HP, positioned at the pond (outdoor campus entrance), zero professors defeated.

> **→ TDD note (engine):** Player position and defeated-professor count must persist across the overworld and battle scenes for the session duration. No save/load required — state resets on page reload.

---

## Player Moves

The player has six moves available throughout the game. No PP or use limits — moves are always available.

| Move | Damage | Effect | Thematic note |
|------|--------|--------|---------------|
| **Counterexample** | 22 | None | The student's bread-and-butter. Produces a data point that breaks the professor's framework. Reliable workhorse. |
| **Cite This!** | 15 | Professor skips their next action | The student weaponises the literature. Low damage but neutralises one professor move — useful against high-damage threats. |
| **All-Nighter** | 38 | Deals 10 self-damage | Burns bright, unsustainable. Reach for this when the professor is low and you can afford the cost. |
| **Hot Take** | 10 | Ignores any disruption effects on the player | Quick and irreverent. Always connects. Clears debuffs, keeps pressure up. |
| **Non-Sequitur** | 0 | Professor's next move deals half damage | The student says something completely unrelated. No damage — just bafflement. Rewards using it the turn before a known high-damage move. |
| **Correction** | 20 | Doubles to 40 if the professor's last move dealt 30 or more damage | "Actually—" Counter-punch energy. Rewards reading the professor's escalation and hitting back harder. |

> **→ TDD note (battle):** Move selection UI should display move name and a one-line description. Damage values are exact integers — no random variance in proof-of-concept. No PP/use limits — moves are always available.

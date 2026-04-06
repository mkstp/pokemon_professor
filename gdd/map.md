# GDD: Campus Map

---

## Regions

| Region | Description | Connections |
|--------|-------------|-------------|
| Outdoor Campus | The hill's slopes and grounds: pond, walkway, elm and magnolia paths, open sky. Starting area. | Main Building entrance, Lab Wing path, Castle path |
| Main Building | Multi-floor stone building housing classrooms, the cafeteria, the library (with mezzanine), and access to the basement. | Outdoor Campus, Lab Wing, Basement |
| Basement (PhD Dungeon) | Dimly lit, monitor-bright. Shared desks, a perennial whiteboard, low ceilings. Accessible from Main Building stairwell. | Main Building |
| Lab Wing | Upper-floor annex attached to Main Building. Houses GPU/TPU labs — loud fans, blinking lights, warm air. | Main Building, Outdoor Campus path |
| Graduate Lounge | Off the main corridor — couches, a small kitchen, a broken-spring couch everyone avoids. Traversal and atmosphere. | Main Building |
| The Castle | Gothic stone at the hill's crest. One great hall; the final encounter takes place here. Reached via the hill path from Outdoor Campus. | Outdoor Campus (one-way until prior bosses defeated) |

---

## Key Locations

| Location | Region | Purpose |
|----------|--------|---------|
| Pond & Walkway | Outdoor Campus | Prof. Schwaartz (Phonetics) encounter trigger; starting area |
| Classroom (Ground Floor) | Main Building | Prof. Syntaxa (Syntax) encounter trigger |
| Library Mezzanine | Main Building | Prof. Composita (Semantics) encounter trigger |
| PhD Dungeon | Basement | Prof. Recursio (DSA) encounter trigger |
| GPU Lab | Lab Wing | Prof. Bayesio (NLP) encounter trigger |
| Castle Great Hall | The Castle | Prof. Vec Tor (Comp. Semantics) — final boss |
| Cafeteria | Main Building | Atmosphere / traversal; possible NPC location |
| Graduate Lounge | Main Building | Atmosphere / traversal; possible NPC location |
| Hill Path | Outdoor Campus → Castle | Gated until professors 1–5 are defeated |

> **→ TDD note (map):** The hill path to the castle must check defeated-professor count before allowing transition. All five prior professors must be defeated to unlock.

---

## Visual Style Notes

Retro pixel art throughout. Exterior tiles: earthy greens and browns, stone paths, reflective water for the pond. Interior tiles: warm wood and stone for the main building; cooler greys and blues for the lab wing; flickering monitor-glow ambience for the dungeon. The castle interior uses dark stone with warm candlelight tones. Colour palette shifts subtly as the player ascends the hill — brighter and more open at the pond, darker and more imposing at the castle.

Weather in the outdoor campus: rain is the primary effect (New England autumn). Wind animation in the trees. The pond reflects weather conditions.

> **→ TDD note (map):** Tileset regions should be designed as discrete layers — outdoor, interior-warm, interior-cool, dungeon, castle — to allow weather/atmosphere effects to be scoped per region.

---

## Weather & Atmosphere

| Effect | Region(s) | Description | Trigger |
|--------|-----------|-------------|---------|
| Rain | Outdoor Campus | Diagonal pixel rain overlay, ripples on pond surface | Always-on (autumn setting) |
| Wind in Trees | Outdoor Campus | Subtle animation on elm and magnolia sprites | Always-on |
| Monitor Glow | Basement (PhD Dungeon), Lab Wing | Flickering blue-white light cast on surrounding tiles | Always-on in those regions |
| Candlelight | Castle | Warm, slightly unsteady light. Flame animation on wall sconces. | Always-on in castle interior |

> **→ TDD note (map):** Weather and atmosphere effects should be tied to region, not scene — they activate on region entry and deactivate on region exit. Implemented as overlay layers on the tile renderer.

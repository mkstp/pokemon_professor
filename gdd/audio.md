# GDD: Audio

---

**All Tracks** Should be retro chiptune style and should loop seamlessly. 

| Track | Scene | Notes |
|-------|-------|-------|
| Overworld Theme | Outdoor Campus, traversal | Gentle, melodic, slightly folk-influenced. Loops seamlessly. New England atmosphere. |
| Dungeon Theme | PHD Dungeon | Minor, foreboding. In the dark depths of a research lab with zombie phd students roaming the halls - like the zelda nes dungeon theme |
| Indoor Theme | Library, Graduate Lounge, Classroom, Lab Wing | like the house theme from Zelda |
| Cafeteria Theme | Cafeteria | like the sonic the hedgehog casino night theme |
| Battle — Schwaartz | Prof. Schwaartz encounter | Per-professor battle track. |
| Battle — Syntaxa | Prof. Syntaxa encounter | Per-professor battle track. |
| Battle — Composita | Prof. Composita encounter | Per-professor battle track. |
| Battle — Recursio | Prof. Recursio encounter | Per-professor battle track. |
| Battle — Bayesio | Prof. Bayesio encounter | Per-professor battle track. |
| Battle — Vec Tor | Prof. Vec Tor encounter | Per-professor battle track. |
| Battle — Parsemore | Prof. Parsemore encounter (reserve) | Per-professor battle track. |
| Castle Theme | Castle interior | Darker, more formal version of the overworld theme. Signals the final encounter. |
| Victory Jingle | Post-battle win | Short (3–5 seconds). Satisfying resolution. |
| Defeat Jingle | Post-battle loss | Short, gently comic. Not punishing — consistent with the affectionate tone. |

> **→ TDD note (audio):** Tracks should be managed by a single audio module responsible for play, stop, and scene-based switching. No overlap between overworld and battle tracks.

# GDD: Professors

Seven professors are defined. Six are used in a standard playthrough; Prof. Parsemore is the reserve and can substitute for Prof. Recursio without other changes. Campus map and encounter sequence are designed around the six active professors.

---

### 1. Prof. Schwaartz — The Articulator

- **Department / Field:** Phonetics
- **Personality:** Warm, unhurried, and acutely attuned to sound. Notices the acoustics of every space. Speaks in careful, rounded vowels and has a habit of pausing mid-sentence to listen to something nobody else hears. Not threatening — genuinely delighted to meet you. The introductory boss; the game's first handshake with the player.
- **Visual design notes:** Woman. Warm sage cardigan over a cream shirt; warm greens and yellows. Very large, round, expressive ears — the first thing you notice. Carries a tuning fork. Stern expression that softens slightly at the eyes; the most approachable of the professors, but she means business.
- **Location:** Outdoor campus — by the pond and its walkway.
- **Pre-battle dialogue:**
  - "Ah — you've arrived. Listen to the pond for a moment. Do you hear the difference between that frog's call and the wind in the elms?"
  - "No? That's alright. You will. Shall we begin?"
- **Post-battle dialogue (win):** "Excellent. You have a good ear. Come find me again when you can identify a retroflex from twenty paces."
- **Post-battle dialogue (loss):** "Don't worry. Sound takes time. Try again — I'm not going anywhere."
- **Moves:**
  - *Minimal Pair* — moderate damage; exploits a subtle distinction the player almost missed. Thematic: phonemic contrast as a weapon.
  - *Voiced Fricative* — low damage, high frequency; a rapid buzzing attack. Thematic: the /v/ and /z/ sounds, continuous and insistent.
  - *Stress Shift* — moderate damage; disrupts the player's next move. Thematic: lexical stress altering meaning.
  - *Aspiration* — light damage; a sudden exhalation — quick and slightly disorienting. Thematic: the burst of air on voiceless stops.
- **HP:** 60
- **Difficulty position:** 1 of 6 — introductory. Teaches the battle interface; low threat.

---

### 2. Prof. Syntaxa — The Grammarian

- **Department / Field:** Syntax
- **Personality:** Precise, a little imperious, constitutionally unable to let an ill-formed sentence pass without comment. Not unkind — just very sure about what is and is not grammatical. Draws phrase structure trees on any available surface. Has strong opinions about the passive voice.
- **Visual design notes:** Man. Dark blazer, white shirt, no tie. Extraordinarily bushy eyebrows — severe, almost architectural. Sharp jaw. Monocle. Upright posture, chin slightly raised. Expression: cool, evaluating, faintly disapproving. Palette: black, white, deep red accent.
- **Location:** Classroom — main building, ground floor.
- **Pre-battle dialogue:**
  - "Before we begin, I want to be clear: 'I could care less' is not idiomatic. It means the opposite of what you intend."
  - "Now. Let us see whether your structures hold."
- **Post-battle dialogue (win):** "Well-formed. I'll admit I didn't expect a complete derivation. Good work."
- **Post-battle dialogue (loss):** "Your argument was ungrammatical at the embedded clause. Revise and resubmit."
- **Moves:**
  - *Passive Voice* — moderate damage; restructures the attack so the agent is obscured. Thematic: the professor buries the threat in grammatical indirection.
  - *X-Bar Probe* — moderate damage; a precise, rule-governed strike. Thematic: X-bar theory applied as a diagnostic instrument.
  - *Merge Op.* — high damage, slow; combines two elements into something more powerful than either. Thematic: the Merge operation underlying syntactic structure.
  - *Deep Structure* — high damage; attacks underlying form, not surface appearance. Thematic: D-structure as the level where logical relations are resolved.
- **HP:** 80
- **Difficulty position:** 2 of 6 — early. Introduces strategic depth; punishes careless play.

---

### 3. Prof. Composita — The Interpreter

- **Department / Field:** Semantics
- **Personality:** Warm, digressive, and perpetually mid-thought. Asks "but what do you *mean* by that?" about everything — battle moves included. Not evasive; genuinely curious. Has a tendency to qualify every claim until it barely exists, then look pleased with the result. The most quotable professor.
- **Visual design notes:** Woman. Several layered cardigans in earthy tones. Voluminous, genuinely unkempt warm-toned hair. A very broad, prominent nose — warm and characterful. Ink on her hands. Expression: thoughtful, slightly distracted, but with an underlying intensity. Mugs at various stages of cold visible around her.
- **Location:** Library — mezzanine level.
- **Pre-battle dialogue:**
  - "Oh, you're here to battle? Interesting. What do you mean by 'battle,' exactly?"
  - "I'm being sincere. The word is doing a lot of work. Let's find out what it means together."
- **Post-battle dialogue (win):** "Hm. Perhaps I concede the point. Provisionally. The truth conditions seem to favour you."
- **Post-battle dialogue (loss):** "You see — even your loss is semantically rich. What did it *denote*?"
- **Moves:**
  - *Presupposition Failure* — moderate damage; attacks an assumption the player didn't know they were making. Thematic: utterances that smuggle in unexamined commitments.
  - *Scope Ambiguity* — moderate damage; the move's effect is unclear until after it resolves. Thematic: quantifier scope creating genuine interpretive uncertainty.
  - *Entailment* — high damage; slow and inevitable. Thematic: if the premises hold, the conclusion follows — there is no escape.
  - *Deixis* — variable damage; effect depends on battle context. Thematic: meaning that shifts with the situation of utterance.
- **HP:** 100
- **Difficulty position:** 3 of 6 — mid-game. Increases HP and introduces moves with deferred or ambiguous effects.

---

### 4. Prof. Recursio — The Architect

- **Department / Field:** Data Structures & Algorithms
- **Personality:** Enthusiastic, fast-talking, runs on coffee. Frames every problem as a search over a state space and is visibly excited when the framing works. Genuinely kind but moves very fast — it takes a moment to catch up. The whiteboard behind them is always full.
- **Visual design notes:** Man. Navy hoodie with dry-erase marker scrawls on the sleeves and cuffs — runs out of whiteboard regularly. Unusually large, wide-set eyes that give him a permanently alert look. Lean build, perpetually leaning forward. Expression: energised, intense. Vivid palette: electric blue and lime accents. Coffee cups in the background.
- **Location:** PhD student dungeon — basement of the main building.
- **Pre-battle dialogue:**
  - "Oh good, you found the dungeon! Most people can't. It's basically a graph traversal problem — you just have to know which edges exist."
  - "Okay so here's the thing about this battle: it's a shortest-path problem. Unfortunately for you, I know the graph."
- **Post-battle dialogue (win):** "Huh. Your heuristic was better than mine. Okay. I respect that. What was your time complexity?"
- **Post-battle dialogue (loss):** "Classic! You optimised locally and missed the global minimum. It happens to everyone."
- **Moves:**
  - *Depth First* — moderate damage; commits fully to one branch — relentless until it hits a dead end. Thematic: DFS as a disposition.
  - *Merge Sort* — moderate damage; methodical, divide-and-conquer. Builds to a clean resolution. Thematic: the elegance of recursive decomposition.
  - *Stack Overflow* — high damage; chaotic, unpredictable. Thematic: recursive descent that exceeds its bounds.
  - *Big O* — low damage; more taunt than attack — reduces the effectiveness of the player's next move. Thematic: complexity analysis as a way of dismissing effort.
- **HP:** 120
- **Difficulty position:** 4 of 6 — mid-to-late. Damage escalates; moves interact with each other.

---

### 5. Prof. Bayesio — The Prior

- **Department / Field:** NLP / Deep Learning
- **Personality:** Brilliant, friendly, and running on approximately four hours of sleep. Speaks fluently in training metrics and loss curves. Has strong opinions about tokenisation schemes and will share them unprompted. Lives in the GPU lab; unclear if they go home. Not intimidating — just operating at a slightly different frequency than everyone else.
- **Visual design notes:** Woman. Zip-up fleece over a long-sleeve shirt. Realistically heavy dark circles — genuinely exhausted. A pronounced, strong brow ridge that makes her expression naturally severe. Mismatched socks, just visible. Expression: focused, slightly hollowed. Blue-shifted lighting from the terminal behind her; GPU fans visible in the background.
- **Location:** GPU lab — lab wing, upper floor.
- **Pre-battle dialogue:**
  - "Hey! Sorry — one sec — okay, the training run is stable. What's up?"
  - "A battle? Sure. I should warn you: prior probability of your victory is essentially zero. I've run the numbers."
- **Post-battle dialogue (win):** "Huh. You were an outlier I hadn't modelled. That's actually kind of exciting. Can I log this?"
- **Post-battle dialogue (loss):** "Posterior confirmed. Don't worry — that's what learning rate schedules are for."
- **Moves:**
  - *Prior Strike* — light-moderate damage; establishes early advantage. Thematic: a prior belief applied before any evidence arrives.
  - *Posterior* — moderate damage, grows stronger in later turns. Thematic: beliefs updated by accumulated evidence.
  - *Language Model* — moderate damage; disrupts the player's next move by "predicting" it. Thematic: a model that anticipates the next token.
  - *Perplexity* — high damage; unpredictable, high variance. Thematic: the measure of how surprised a model is — and how surprised you are about to be.
- **HP:** 140
- **Difficulty position:** 5 of 6 — late game. High HP; moves hit hard and have secondary effects.

---

### 6. Prof. Vec Tor — The Embedder *(Final Boss)*

- **Department / Field:** Computational Semantics
- **Personality:** Formal, precise, and quietly delighted when a proof goes through. Synthesises everything that came before — the structure of Syntax, the meaning of Semantics, the machinery of DSA and NLP — into a unified formal framework. Not cold: there is warmth beneath the formalism, revealed gradually. The hardest professor is also, in some ways, the most honest about what they love.
- **Visual design notes:** Man. The oldest of the professors. Long, well-cut dark coat. Tall and lean. Very prominent, patrician nose — long and straight. Defined cheekbones. Expression: composed, utterly still, calibrated — not threatening, just certain. Near-monochromatic palette with one cold accent. Castle stone wall visible behind him.
- **Location:** The castle — top of the hill, final encounter.
- **Pre-battle dialogue:**
  - "You've come a long way. Phonetics, Syntax, Semantics, Algorithms, Deep Learning — you've heard their arguments."
  - "Mine synthesises all of them. Meaning as geometry. Shall we see if you've been paying attention?"
- **Post-battle dialogue (win):** "The vectors align. Well done — that's not something I say lightly. You've earned your credits."
- **Post-battle dialogue (loss):** "Your embedding was inconsistent. Come back when you've found the right representation."
- **Moves:**
  - *Word2Vec* — moderate damage; maps the player into an unfavorable semantic space. Thematic: distributed representations as a re-framing of the opponent.
  - *Cosine Slam* — moderate-high damage; measures and exploits the distance between the player's position and a winning one. Thematic: cosine similarity as a precision instrument.
  - *Gradient Blast* — high damage; the full force of optimisation applied at once. Thematic: gradient descent arriving at a solution.
  - *Attention!* — very high damage, slow; focuses entirely on one target. Thematic: transformer attention concentrating all weight on a single point.
- **HP:** 160
- **Difficulty position:** 6 of 6 — final boss. Highest HP; moves escalate in power. Castle setting signals the stakes.

---

### 7. Prof. Parsemore — The Analyst *(Reserve)*

- **Department / Field:** Computational Linguistics / Corpus Analysis
- **Status:** Reserve professor. Not in the current campus map. Can substitute for Prof. Recursio (position 4) without other changes to game structure.
- **Personality:** Empirical to the bone. Doesn't trust theory that can't be grounded in data. Maintains a corpus of 400 million tokens on a personal hard drive and refers to it during arguments. Methodical in conversation — listens fully before responding, then produces evidence. Slightly amused by people who argue from intuition alone.
- **Visual design notes:** Woman. Practical trousers and collared shirt, stray annotation marks from working. Very square jaw; a patient, grounded face. Thick-framed glasses with one arm repaired with tape. Expression: measured, faintly amused. Papers and a second monitor visible around her.
- **Location:** Graduate lounge or corpus annotation lab — to be determined if activated.
- **Pre-battle dialogue:**
  - "You want to argue about language? Good. I have 400 million tokens that say you're wrong."
  - "Let's see your evidence."
- **Post-battle dialogue (win):** "Interesting. You found a counterexample I hadn't annotated. I'm adding it to the corpus."
- **Post-battle dialogue (loss):** "As expected. The data doesn't lie."
- **Moves:**
  - *Chunker* — low-moderate damage; rapid, repeated hits. Thematic: shallow parsing that moves fast and covers ground.
  - *Dep. Parse* — moderate damage; identifies and targets the player's structural weak point. Thematic: dependency relations revealing what governs what.
  - *Corpus Crush* — high damage; the weight of 400 million tokens, applied. Thematic: empirical evidence as an overwhelming force.
  - *Full Parse* — very high damage, slow; a complete structural analysis that leaves nowhere to hide. Thematic: the exhaustive parse that finds every ambiguity.
- **HP:** 120 *(same as Recursio — interchangeable at position 4)*
- **Difficulty position:** Reserve for position 4.

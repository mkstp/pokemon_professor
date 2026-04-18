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
- **Difficulty position:** 

Halvorsen — The Evaluator (Grad Student Battle)
Role / Field: Computational Linguistics (Evaluation & Formal Methods)
Personality: Severe, exacting, and unsentimental. Treats every interaction as an assessment. Speaks in clipped, precise judgments; rarely raises his voice. Effort is irrelevant to him—only correctness and rigor matter. Finds quiet satisfaction in identifying flaws and edge cases. Any approval is reluctant and strictly provisional.
Visual design notes: Young man, late 20s. Tall but slightly hunched from long hours at a desk. Lean build. Sharp, narrow face with pronounced cheekbones; thin lips often set in a flat line. Eyes focused and slightly tired, with an intense, evaluative stare. Wears a plain, slightly wrinkled button-down shirt with rolled sleeves, dark slacks, and a lanyard or ID badge. Holds a clipboard or marked-up papers with visible red annotations. Expression: critical, unimpressed, mid-assessment. Palette is muted and academic—grays, off-whites, and dull blues—with harsh red accents (pen marks). Background: stark white, no decoration, emphasizing scrutiny and exposure.

Rohan — The Complainer (Grad Student Battle)
Role / Field: Computational Linguistics (Systems & Infrastructure)
Personality: Irritable, sharp-tongued, and persistently fixated on logistical failures. Frames nearly every interaction as a consequence of some broken system. Quick to assign blame, often jumping to conclusions with partial information. Complaints come rapidly and with confidence, whether or not they are relevant. Not malicious—more caught in a loop of frustration than intentionally hostile.
Visual design notes: Young man, mid-20s. Slightly disheveled appearance. Average height, restless posture—weight shifted unevenly, as if mid-rant. Messy hair, faint under-eye circles. Wears a hoodie layered over a wrinkled t-shirt, with a laptop bag slung over one shoulder. Phone in hand, screen lit with a scheduling or booking interface. Expression: annoyed, mid-complaint, eyebrows raised and mouth slightly open as if continuing an argument. Color palette leans toward dull neutrals (charcoal, faded navy, off-black) with a few harsh digital accents (glowing phone screen blues/greens). Background: minimal white, possibly with faint UI-like grid or calendar motifs suggesting scheduling systems.
Battle Flavor Notes (for animation cues): Gestures frequently with one hand while holding the phone in the other. Idle stance includes checking the screen and reacting with visible irritation. Attack animations feel abrupt and slightly misdirected, as if triggered by unrelated frustrations.

Voss — The PhD Zombie (Grad Student Battle)
Role / Field: Computational Linguistics (Theory & Analysis)
Personality: Relentless, hyper-critical, and mentally overextended. Operates in a constant state of evaluation, immediately identifying flaws—real or perceived—in any argument. Speaks with quiet certainty, rarely hedging, and defaults to negation as a starting point. Driven by high internal standards and looming deadlines, which surface as flashes of urgency beneath an otherwise controlled demeanor. Not intentionally dismissive, but deeply habituated to critique as a mode of thought.
Visual design notes: Woman, late 20s to early 30s. Gaunt, sleep-deprived appearance. Slightly hunched posture, as if pulled forward by the weight of ongoing work. Hair loosely tied or partially falling out of place. Wears an oversized sweater or cardigan over practical, neutral clothing. Dark circles under the eyes; expression fixed in a focused, critical stare. Holds a stack of annotated papers or a laptop covered in notes and tabs. Subtle “zombie” qualities—desaturated skin tone, slow or minimal idle movement—suggest exhaustion rather than horror. Color palette is muted and washed out (grays, pale blues, off-whites), with occasional sharp ink-like accents (black/red markings). Background: stark white, possibly with faint scribbles, margin notes, or fragmented text motifs drifting behind her.
Battle Flavor Notes (for animation cues): Idle stance includes scanning or marking up papers. Attack animations are precise and interruptive—quick gestures pointing out errors or flipping to a specific page. Occasional sudden, jittery movements hint at deadline pressure breaking through her otherwise controlled exterior.

Lab Sentinel K — The Gatekeeper (PhD Zombie Battle)
Role / Field: Computational Linguistics (Lab Infrastructure & Policy Enforcement)
Personality: Rigid, procedural, and impersonal. Speaks in formal, policy-driven language, as if every interaction is governed by an unseen rulebook. Prioritizes compliance over context; rarely questions whether a rule makes sense, only whether it has been followed. Displays a quiet, mechanical persistence—when challenged, defaults to escalation or revision of the rules rather than concession. Not hostile, but entirely unyielding.
Visual design notes: Androgynous figure, late 20s to early 30s. Upright, almost statuesque posture. Slim build, movements minimal and deliberate. Wears a clean lab coat or institutional uniform with an ID badge prominently displayed. Clothing is neat to the point of rigidity—no wrinkles, no variation. Face is expressionless or faintly disapproving; eyes steady and unblinking. Subtle “zombie” qualities—slightly desaturated skin tone, slowed idle animation—suggest detachment rather than decay. May carry a clipboard, tablet, or access card. Color palette is sterile and controlled: whites, pale grays, and muted blues, with sharp institutional accents (badge red or security yellow). Background: stark white with faint geometric overlays—gridlines, access panels, or security icons.
Battle Flavor Notes (for animation cues): Idle stance includes scanning an invisible checklist or tapping a badge reader. Attack animations are abrupt and final—hand raised to halt, a stamp-like motion, or a screen flash indicating denial. Movements are efficient and repetitive, reinforcing a sense of system-enforced authority rather than individual intent.

Simon — The Burnout (PhD Zombie Battle)
Role / Field: Computational Linguistics (Modeling & Experimentation)
Personality: Exhausted, unfocused, and oscillating between dull resignation and bursts of scattered intensity. Speaks in half-formed thoughts, often trailing off or redirecting mid-sentence. Motivation comes in short, unstable spikes, usually driven by frustration rather than clarity. Not especially critical of others—most of the pressure is internal—but his instability spills outward in erratic behavior. Carries a sense that he’s been stuck in the same loop for too long.
Visual design notes: Man, late 20s. Slightly slouched posture, as if gravity is winning. Disheveled hair, uneven stubble. Wears a wrinkled t-shirt under a hoodie, possibly with a lanyard hanging loosely. Laptop half-open under one arm or a marker in hand. Eyes unfocused, with heavy under-eye circles. Expression: distant or strained, occasionally flickering into sudden intensity. Subtle “zombie” qualities—washed-out skin tone, sluggish idle animation punctuated by abrupt movements—suggest chronic exhaustion. Color palette is dull and low-contrast (faded grays, muted greens, off-blacks), with occasional harsh highlights (whiteboard marker ink, screen glow). Background: stark white with faint, chaotic overlays—half-erased equations, tangled arrows, or fragmented diagrams.
Battle Flavor Notes (for animation cues): Idle stance alternates between stillness and jittery micro-movements. Attack animations feel unstable—sudden bursts of activity (rapid scribbling, pacing, gesturing at invisible diagrams) followed by brief lulls. Movements lack clean resolution, reinforcing a sense of ongoing, unresolved effort.

Finnegan — The Pedant (Grad Student Battle)
Role / Field: Computational Linguistics (Semantics & Formal Precision)
Personality: Fastidious, exact, and persistently corrective. Fixates on terminology, edge cases, and subtle distinctions, often interrupting to refine or reframe what was just said. Speaks politely but with an undercurrent of insistence; precision is treated as a prerequisite for any meaningful progress. Not overtly confrontational, but difficult to engage without being redirected into finer-grained detail.
Visual design notes: Young man, mid-20s. Slim build, upright but slightly forward-leaning posture, as if poised to interject. Neatly kept hair, tidy appearance. Wears a collared shirt, possibly layered with a sweater or blazer—slightly more formal than peers. Carries a small notebook or tablet, with tabs or sticky notes visible. Expression: attentive and mildly corrective—one eyebrow slightly raised, mouth just opening to speak. Eyes focused, tracking details. Color palette is clean and academic—navy, charcoal, off-white—with subtle accent colors (muted burgundy or forest green). Background: stark white with faint annotation marks—arrows, brackets, or circled terms—suggesting ongoing refinement.
Battle Flavor Notes (for animation cues): Idle stance includes subtle hand gestures, as if about to clarify a point. Attack animations are quick and interruptive—finger raised, note tapped, or text briefly appearing and being revised. Movements are precise and repetitive, reinforcing a rhythm of continual correction.

Chadwick — The Bro Scholar (Grad Student Battle)
Role / Field: Computational Linguistics (Applied NLP & Presentations)
Personality: Confident, informal, and socially dominant. Communicates in a relaxed, conversational style that borders on dismissive, but not intentionally hostile. Uses humor and casual phrasing to assert status. Surprisingly perceptive—able to recognize quality quickly—but filters everything through a laid-back, performative persona. Thrives in group settings and public-facing work, especially presentations.
Visual design notes: Young man, mid-20s. Athletic build, relaxed posture with a slight lean or slouch. Well-groomed, styled hair. Wears a fitted t-shirt or casual button-down, possibly layered with a light jacket; outfit is put-together but intentionally effortless. May have a conference badge or carry a laptop casually under one arm. Expression: confident, slightly amused—half-smirk, eyebrows relaxed. Eyes engaged but appraising. Color palette includes warmer, more saturated tones than other characters—navy, olive, soft reds—contrasting with otherwise neutral academic wear. Background: stark white with faint presentation motifs—slide frames, bullet points, or graph outlines.
Battle Flavor Notes (for animation cues): Idle stance includes casual shifting of weight, occasional nods or small gestures as if reacting to a talk. Attack animations are smooth and performative—pointing outward like addressing an audience, quick “presentation” gestures, or shrugging motions. Movements feel controlled and socially confident rather than erratic.

Mina — The Doubter (Grad Student Battle)
Role / Field: Computational Linguistics (Coursework & Early Research)
Personality: Anxious, self-questioning, and prone to anticipating failure before it happens. Narrates her own uncertainty in real time, often undermining herself even when she is correct. Highly conscientious—puts in the work—but struggles to trust her results. When something succeeds, she’s surprised; when it fails, she treats it as confirmation. Not defeatist, but caught in a loop of doubt that shapes her decisions and reactions.
Visual design notes: Young woman, early 20s. Slight, somewhat guarded posture—shoulders slightly drawn inward, hands close to the body or fidgeting. Casual academic clothing: oversized sweater, simple top, comfortable pants. Hair loosely styled or pulled back, slightly imperfect. Expression: uncertain—brows slightly knit, eyes focused but tentative, mouth slightly parted as if second-guessing. May hold a notebook, laptop, or papers clutched close. Color palette is soft and subdued—pastels, light grays, muted blues—with occasional warmer accents that suggest underlying warmth. Background: stark white with faint, tentative sketch marks—erased lines, partial diagrams, or lightly drawn arrows that don’t fully connect.
Battle Flavor Notes (for animation cues): Idle stance includes small fidgeting motions—adjusting grip, shifting weight, glancing down at notes. Attack animations feel inconsistent—some hesitant, others suddenly decisive—reflecting swings between doubt and action. Movements sometimes pause mid-action, then resume, reinforcing uncertainty.

Jax — The Critic (Grad Student Battle)
Role / Field: Computational Linguistics (Trends & Discourse)
Personality: Detached, ironic, and quick to judge. Filters everything through a layer of cultural shorthand—memes, trends, and offhand commentary—delivered with flat affect. Rarely shows overt enthusiasm; approval is understated and framed as reluctant acknowledgment. Expects novelty and is quick to label things as predictable or uninteresting. Not deeply antagonistic, but maintains distance through irony.
Visual design notes: Young woman, mid-20s. Relaxed, slightly slouched posture, often angled as if half-engaged. Casual, trend-aware style—oversized jacket or hoodie, graphic tee, loose-fit pants. Hair styled with some intentional asymmetry (e.g., dyed streak, clipped section). Holds a phone at chest height, thumb hovering as if mid-scroll. Expression: unimpressed, half-lidded eyes, minimal reaction—subtle eyebrow lift or side glance. Color palette mixes muted neutrals with a few sharp, contemporary accents (neon highlights, saturated pastels). Background: stark white with faint, ephemeral overlays—chat bubbles, reaction icons, or fragmented UI elements suggesting constant commentary.
Battle Flavor Notes (for animation cues): Idle stance includes scrolling or tapping on the phone, occasional glance upward. Attack animations are abrupt and referential—quick gestures that trigger visual “overlays” (icons, text flashes) before fading. Movements are minimal but timed, reinforcing a sense of low-effort, high-judgment engagement.

Marcellus — The Philosopher (Special Encounter)
Role / Field: Computational Linguistics (Philosophy of Language & Interpretation)
Personality: Reflective, probing, and quietly destabilizing. Rarely engages directly with the surface of a problem; instead reframes it, questioning underlying assumptions and goals. Speaks in measured, contemplative language, often redirecting attention away from outcomes and toward process or meaning. Not dismissive, but persistently reframes the stakes of any interaction, making resolution feel secondary to interpretation.
Visual design notes: Man, late 20s to early 30s. Calm, grounded posture—upright but relaxed, hands loosely at sides or lightly gesturing. Thoughtful expression: soft gaze, slightly furrowed brow, as if mid-reflection rather than mid-action. Wears a simple, understated outfit—dark sweater or long-sleeve shirt with clean lines, neutral pants. Minimal accessories, possibly a small notebook tucked away. Hair neatly kept but unstyled. Color palette is subdued and cohesive—earth tones, deep grays, muted blues—without sharp contrasts. Background: stark white with faint, abstract motifs—circles, branching lines, or mirrored shapes suggesting recursion, reflection, or unresolved structure.
Battle Flavor Notes (for animation cues): Idle stance includes slow, deliberate breathing and minimal movement. Attack animations are subtle and ambient—slight gestures that trigger shifts in the surrounding space (faint ripples, mirrored overlays, or reframing visual elements). Movements are smooth and unhurried, giving a sense that the battle’s framing is being questioned rather than directly contested.

Elena — The Attendee (Grad Student Battle)
Role / Field: Computational Linguistics (Research Dissemination & Academic Circuits)
Personality: Focused, time-conscious, and constantly in motion. Treats interactions as things to be efficiently handled between commitments. Genuinely curious and engaged, but attention is fragmented across overlapping obligations. Measures value in terms of insight gained versus time spent. Not dismissive—just perpetually en route to the next talk.
Visual design notes: Young woman, mid-20s. Upright, forward-leaning posture, as if mid-stride even when standing still. Slim build. Hair neatly tied back or styled for practicality. Wears a conference-appropriate outfit—clean blouse or top with a light blazer, paired with slacks or a skirt. Conference badge prominently visible; tote bag or backpack slung over one shoulder, slightly overfilled with papers and pamphlets. Holds a phone or folded schedule. Expression: alert, slightly rushed—eyes focused, mouth set with mild urgency. Color palette is clean and professional—navy, white, soft gray—with occasional brighter accents (badge lanyard, tote bag colors). Background: stark white with faint overlays—conference schedules, arrows, or session blocks suggesting movement between talks.
Battle Flavor Notes (for animation cues): Idle stance includes checking time, glancing at schedule, shifting weight as if about to leave. Attack animations are quick and purposeful—gestures resembling presenting, note-taking, or sending messages. Movements are efficient and slightly hurried, reinforcing constant time pressure.

Soren — The Skeptic (Grad Student Battle)
Role / Field: Computational Linguistics (Generalist / Coursework)
Personality: Dry, understated, and habitually dissatisfied. Approaches everything with low expectations and a readiness to critique. Complaints often start from trivial domains (like food) but bleed into broader judgments about quality and substance. Not loud or aggressive—more of a steady, ambient skepticism. When something exceeds expectations, he acknowledges it, but without enthusiasm.
Visual design notes: Young man, mid-20s. Average build, relaxed but slightly slouched posture. Hands often in pockets or loosely at sides. Short, unremarkable hair; overall low-maintenance appearance. Wears simple, practical clothing—hoodie or jacket over a plain shirt, jeans. Expression: mildly unimpressed—half-lidded eyes, neutral mouth, slight downward tilt at the corners. May hold a cafeteria tray, coffee cup, or loosely crumpled wrapper. Color palette is muted and earthy—browns, dull greens, grays—with little contrast. Background: stark white with faint, abstract food-related motifs—trays, utensils, or indistinct shapes suggesting bland repetition.
Battle Flavor Notes (for animation cues): Idle stance includes subtle shifts of weight, occasional glance at what he’s holding, slight head tilts. Attack animations are minimal and understated—small gestures paired with brief visual effects, as if commentary manifests without effort. Movements remain controlled and low-energy throughout.

Valentine — The Drifter (Grad Student Battle)
Role / Field: Computational Linguistics (Data & Experimentation)
Personality: Detached, absent-minded, and loosely tethered to the present moment. Processes events with a slight delay, often reacting as if things are happening out of sequence. Speech is soft and uncertain, with pauses that suggest they’re catching up to their own thoughts. Not disengaged—just misaligned in timing and attention, which makes their behavior feel unpredictable.
Visual design notes: Androgynous figure, mid-20s. Light, drifting posture—weight unevenly distributed, as if subtly swaying. Slim build. Hair soft and slightly unkempt, with strands falling out of place. Wears loose, comfortable clothing—oversized sweater, relaxed pants—nothing tightly fitted. May carry a notebook or laptop, but held loosely, almost forgotten. Expression: distant, unfocused gaze; eyelids slightly lowered; mouth neutral or faintly parted. Color palette is pale and desaturated—soft grays, washed-out blues, faint lavenders—with minimal contrast. Background: stark white with faint, drifting overlays—misaligned diagrams, offset text fragments, or lightly duplicated shapes suggesting temporal slippage.
Battle Flavor Notes (for animation cues): Idle stance includes slow, almost imperceptible swaying and delayed reactions to stimuli. Attack animations feel out of sync—gestures that begin late or finish early, with visual effects slightly lagging or overlapping. Movements create a sense of temporal mismatch rather than intentional action.

Lionel — The Listener (Badge Encounter)
Role / Field: Computational Linguistics (Audio, Prosody & Interpretation)
Personality: Intent, discerning, and quietly demanding. Treats listening as an active, evaluative process rather than passive consumption. Speaks with measured seriousness, emphasizing attention to detail and depth of engagement. Approval is tied to demonstrated taste and awareness, not surface-level familiarity. Not outwardly harsh, but holds firm standards around what it means to truly “get” something.
Visual design notes: Man, mid-20s. Upright, grounded posture with a slight forward lean, as if tuned in. Lean build. Wears clean, understated clothing—dark jacket or overshirt over a simple tee, well-fitted pants. Over-ear headphones rest around his neck or slightly off one ear. May carry a phone or small music player. Expression: focused, appraising—eyes steady, slight narrowing as if listening closely; mouth neutral. Color palette is deep and cohesive—charcoal, navy, muted blacks—with subtle accent tones (warm amber or soft gold) suggesting sound and depth. Background: stark white with faint waveform or equalizer-like motifs, clean and minimal.
Battle Flavor Notes (for animation cues): Idle stance includes subtle head tilts or micro-adjustments, as if tracking sound. Attack animations are precise and rhythmic—small gestures that trigger waveform pulses or resonant visual effects. Movements are controlled and deliberate, reinforcing attentive listening rather than spectacle.

Suzanna — The Steady Listener (Badge Encounter)
Role / Field: Computational Linguistics (Sociolinguistics & Dialect Variation)
Personality: Reflective, patient, and quietly resilient. Carries a subdued, melancholic tone, but not defeatist—progress is measured in small, meaningful increments. Speaks with care, often framing outcomes in terms of growth rather than success or failure. Attentive to nuance and difference, especially in how people express themselves. Optimism is present, but restrained and hard-earned.
Visual design notes: Woman, mid-20s, Indian heritage with dark skin. Average height, composed posture with a slight inward softness—shoulders relaxed rather than tense. Wears comfortable, modest clothing with subtle cultural influence—long-sleeve top or kurta-inspired silhouette paired with simple pants or skirt. Hair dark, worn loose or in a low braid. Expression: gentle, thoughtful—eyes slightly downcast but warm, with a faint, restrained smile. May carry a notebook or audio recorder. Color palette leans warm and earthy—deep browns, muted reds, soft golds—balanced with calm neutrals. Background: stark white with faint, layered text fragments or speech contours suggesting variation in dialect and tone.
Battle Flavor Notes (for animation cues): Idle stance includes slow, steady breathing and minimal, grounded movement. Attack animations are soft and measured—subtle gestures that produce layered, wave-like visual effects. Healing or defensive actions feel gradual and stabilizing rather than sudden, reinforcing endurance over intensity.

Tabitha — The Administrator (Grad Student Battle)
Role / Field: Program Administration (Forms, Compliance & Deadlines)
Personality: Persistent, procedural, and impossible to ignore. Frames every interaction in terms of required steps, missing documentation, and looming deadlines. Speaks in polite but insistent reminders that quickly stack into pressure. Not unkind—just entirely focused on completion and compliance. Will follow up repeatedly until every requirement is satisfied.
Visual design notes: Woman, late 20s to early 30s. Upright, efficient posture—always slightly leaning forward as if mid-reminder. Neatly styled hair, practical and controlled. Wears business-casual attire: cardigan or blazer over a simple blouse, paired with slacks or a skirt. ID badge visible. Holds a clipboard, tablet, or a stack of forms with tabs and sticky notes marking sections. Expression: attentive and expectant—slight raised brows, lips gently pressed as if waiting for confirmation. Color palette is institutional and tidy—soft grays, muted blues, off-whites—with brighter accent colors (highlight yellow, sticky-note pink). Background: stark white with faint document motifs—checkboxes, form fields, signature lines.
Battle Flavor Notes (for animation cues): Idle stance includes flipping pages, tapping a checklist, or adjusting documents. Attack animations involve presenting forms, stamping approvals/denials, or highlighting sections. Motions are repetitive and structured, reinforcing an ongoing cycle of reminders and required actions.

Noam Vowel — The Phonetician (Grad Student Battle)
Role / Field: Computational Linguistics (Phonetics & Phonology)
Personality: Intensely focused on sound, articulation, and fine-grained distinctions in pronunciation. Interrupts to correct stress patterns, vowel quality, or subtle phonetic shifts. Speaks with deliberate precision, often exaggerating articulation to make a point. Finds genuine satisfaction in getting a sound exactly right; anything approximate is treated as incomplete.
Visual design notes: Young man, mid-20s. Slight build, upright and attentive posture, head often tilted as if listening closely. Hair neatly kept. Wears a simple button-down or sweater, slightly more formal than average. May have a small headset mic or carry a notebook filled with phonetic symbols. Expression: focused and evaluative—lips slightly parted mid-demonstration, eyes intent. Occasionally shown shaping words carefully with visible mouth positioning. Color palette is clean and neutral—light grays, soft blues, off-whites—with sharp accent colors (chalk white, ink black) for phonetic markings. Background: stark white with faint IPA symbols, waveform traces, or articulation diagrams (tongue positions, vowel charts).
Battle Flavor Notes (for animation cues): Idle stance includes subtle mouth movements, as if silently rehearsing sounds. Attack animations feature exaggerated articulation—clear lip and jaw motion—paired with visual overlays (IPA symbols, sound waves). Movements are precise and rhythmic, reinforcing controlled production of speech.

Pixi — The Tinkerer (Grad Student Battle)
Role / Field: Computational Linguistics (Game Interfaces & Experimental Tools)
Personality: Quiet, curious, and deeply enthusiastic beneath a layer of shyness. Tends to speak softly, often trailing off unless engaged. Finds comfort in systems, mechanics, and playful experimentation—especially where language and games intersect. Not competitive by nature, but becomes focused and surprisingly sharp when interacting through a structured system.
Visual design notes: Young woman, early 20s. Small, slightly hunched posture, shoulders drawn in but not tense—more absorbed than guarded. Wears casual, slightly oversized clothing: hoodie with subtle game-related graphics, simple shirt, comfortable pants. Hair soft and a bit unstructured, possibly with a small clip or accessory. May wear large round glasses. Holds a handheld console, controller, or small device. Expression: shy but engaged—eyes focused, slight upward glance, faint smile when concentrated. Color palette includes soft neutrals (light gray, muted blue) with a few playful accents (pixel-bright greens, purples). Background: stark white with faint pixel motifs—tiles, UI boxes, or small sprite-like shapes.
Battle Flavor Notes (for animation cues): Idle stance includes small, absorbed movements—tapping buttons, slight head tilts. Attack animations resemble game inputs—quick, precise motions triggering pixelated effects or UI flashes. Movements are subtle but coordinated, reflecting comfort within structured interaction rather than overt confrontation.

Kleo — The Freeform (Grad Student Battle)
Role / Field: Computational Linguistics (Creative NLP & Generative Systems)
Personality: Expressive, fluid, and improvisational. Engages ideas loosely, jumping between associations without strict structure. Values exploration over precision, often reframing problems in unexpected or abstract ways. Speaks with energy and variation—tone shifts, tangents, and sudden connections. Not careless, but intentionally unconstrained.
Visual design notes: Young woman, mid-20s. Relaxed, open posture with broad, unstructured gestures. Wears colorful, layered clothing—flowing fabrics, mixed patterns, scarves or loose accessories that move with her. Hair styled freely—curly, wavy, or partially tied with visible motion. Expression: animated and engaged—bright eyes, easy smile, mid-thought dynamism. Color palette is vibrant and varied—teals, oranges, magentas, yellows—blended rather than sharply separated. Background: stark white with faint, flowing abstract shapes—curves, paint-like strokes, or overlapping forms suggesting motion and spontaneity.
Battle Flavor Notes (for animation cues): Idle stance includes gentle swaying and continuous micro-gestures. Attack animations are fluid and expansive—sweeping arm motions that create layered, colorful effects. Movements feel improvisational, with no two actions resolving in quite the same way.

Ruby — The Connector (Badge Encounter)
Role / Field: Computational Linguistics (Community & Collaboration)
Personality: Warm, observant, and quietly affirming. Pays close attention to patterns of participation—who shows up, who engages, who builds connections. Speaks simply but with intention, emphasizing presence and relationships over performance. Encouraging without exaggeration; recognition is grounded in what has actually been done.
Visual design notes: Woman, mid-20s. Open, relaxed posture—shoulders back, stance balanced and welcoming. Wears casual but thoughtfully put-together clothing—soft sweater or jacket over a simple top, comfortable pants. Subtle personal touches (bracelet, pin, or small accessory) suggesting individuality. Hair naturally styled, not overly formal. Expression: calm and attentive—gentle eye contact, slight, genuine smile. May hold a notebook, phone, or small stack of materials shared between people. Color palette is warm and cohesive—soft reds, terracotta, muted golds—paired with neutral tones. Background: stark white with faint connective motifs—lines linking small nodes, overlapping shapes, or lightly sketched networks.
Battle Flavor Notes (for animation cues): Idle stance includes small, grounded movements—subtle nods, relaxed shifts of weight. Attack animations (if any) are minimal and non-confrontational—gestures that create linking or bridging visual effects. Movements emphasize cohesion and continuity rather than disruption.

Kyle — The Cook (Support Encounter)
Role / Field: Community (Sustenance & Routine)
Personality: Direct, grounded, and quietly caring. Expresses concern through practical questions rather than abstract encouragement. Values consistency, nutrition, and taking care of the basics. Speaks plainly, with a no-nonsense tone shaped by experience, but without harshness. Support shows up as action—feeding, checking in, making sure things are handled.
Visual design notes: Man, late 20s to early 30s. Large, solid build—broad shoulders, strong frame. Upright, steady posture. Short, practical haircut; possibly light stubble. Wears a simple t-shirt or henley with work pants or jeans, sometimes with an apron tied around the waist. Subtle naval background cues—tattoo, dog tags, or a neatly kept bearing. Expression: calm, slightly serious but not stern—eyes attentive, mouth neutral or faintly softened. May hold a plate, utensil, or food container. Color palette is warm and grounded—deep blues, olive greens, browns—paired with natural food tones. Background: stark white with faint kitchen motifs—cutting boards, utensils, or steam-like shapes.
Battle Flavor Notes (for animation cues): Idle stance includes simple, deliberate movements—adjusting grip, steady breathing. Support animations involve handing over food, setting something down, or brief, solid gestures. Motions are efficient and purposeful, reinforcing reliability and care through action rather than display.

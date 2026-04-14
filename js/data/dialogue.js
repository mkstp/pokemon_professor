// data/dialogue.js — dialogue sequences for all professors and NPCs
'use strict';

// ─── DIALOGUE SEQUENCES ───────────────────────────────────────────────────────
// Keyed by sequence id. Each value is an ordered array of { speaker, line } pairs.
// dialogue.js reads these and advances through them one line at a time.
// 'Student' is the player's speaker label throughout.

export const dialogueSequences = {

  // ── Prof. Schwaartz ───────────────────────────────────────────────────────
  'prof_schwaartz_pre': [
    { speaker: 'Prof. Schwaartz', line: 'Ah — you\'ve arrived. Listen to the pond for a moment. Do you hear the difference between that frog\'s call and the wind in the elms?' },
    { speaker: 'Prof. Schwaartz', line: 'No? That\'s alright. You will. Shall we begin?' },
  ],
  'prof_schwaartz_win': [
    { speaker: 'Prof. Schwaartz', line: 'Excellent. You have a good ear. Come find me again when you can identify a retroflex from twenty paces.' },
  ],
  'prof_schwaartz_loss': [
    { speaker: 'Prof. Schwaartz', line: 'Don\'t worry. Sound takes time. Try again — I\'m not going anywhere.' },
  ],

  // ── Prof. Syntaxa ─────────────────────────────────────────────────────────
  'prof_syntaxa_pre': [
    { speaker: 'Prof. Syntaxa', line: '"I could care less" is not idiomatic. It means the opposite of what you intend.' },
    { speaker: 'Prof. Syntaxa', line: 'Now. Let us see whether your structures hold.' },
  ],
  'prof_syntaxa_win': [
    { speaker: 'Prof. Syntaxa', line: 'Well-formed. I\'ll admit I didn\'t expect a complete derivation. Good work.' },
  ],
  'prof_syntaxa_loss': [
    { speaker: 'Prof. Syntaxa', line: 'Your argument was ungrammatical at the embedded clause. Revise and resubmit.' },
  ],

  // ── Prof. Composita ───────────────────────────────────────────────────────
  'prof_composita_pre': [
    { speaker: 'Prof. Composita', line: 'Oh, you\'re here to battle? Interesting. What do you mean by "battle," exactly?' },
    { speaker: 'Prof. Composita', line: 'I\'m being sincere. The word is doing a lot of work. Let\'s find out what it means together.' },
  ],
  'prof_composita_win': [
    { speaker: 'Prof. Composita', line: 'Hm. Perhaps I concede the point. Provisionally. The truth conditions seem to favour you.' },
  ],
  'prof_composita_loss': [
    { speaker: 'Prof. Composita', line: 'You see — even your loss is semantically rich. What did it denote?' },
  ],

  // ── Prof. Recursio ────────────────────────────────────────────────────────
  'prof_recursio_pre': [
    { speaker: 'Prof. Recursio', line: 'Oh good, you found the dungeon! Most people can\'t. It\'s basically a graph traversal problem — you just have to know which edges exist.' },
    { speaker: 'Prof. Recursio', line: 'Okay so here\'s the thing about this battle: it\'s a shortest-path problem. Unfortunately for you, I know the graph.' },
  ],
  'prof_recursio_win': [
    { speaker: 'Prof. Recursio', line: 'Huh. Your heuristic was better than mine. Okay. I respect that. What was your time complexity?' },
  ],
  'prof_recursio_loss': [
    { speaker: 'Prof. Recursio', line: 'Classic! You optimised locally and missed the global minimum. It happens to everyone.' },
  ],

  // ── Prof. Bayesio ─────────────────────────────────────────────────────────
  'prof_bayesio_pre': [
    { speaker: 'Prof. Bayesio', line: 'Hey! Sorry — one sec — okay, the training run is stable. What\'s up?' },
    { speaker: 'Prof. Bayesio', line: 'A battle? Sure. I should warn you: prior probability of your victory is essentially zero. I\'ve run the numbers.' },
  ],
  'prof_bayesio_win': [
    { speaker: 'Prof. Bayesio', line: 'Huh. You were an outlier I hadn\'t modelled. That\'s actually kind of exciting. Can I log this?' },
  ],
  'prof_bayesio_loss': [
    { speaker: 'Prof. Bayesio', line: 'Posterior confirmed. Don\'t worry — that\'s what learning rate schedules are for.' },
  ],

  // ── Prof. Parsemore ───────────────────────────────────────────────────────
  'prof_parsemore_pre': [
    { speaker: 'Prof. Parsemore', line: 'You want to argue about language? Good. I have 400 million tokens that say you\'re wrong.' },
    { speaker: 'Prof. Parsemore', line: 'Let\'s see your evidence.' },
  ],
  'prof_parsemore_win': [
    { speaker: 'Prof. Parsemore', line: 'Interesting. You found a counterexample I hadn\'t annotated. I\'m adding it to the corpus.' },
  ],
  'prof_parsemore_loss': [
    { speaker: 'Prof. Parsemore', line: 'As expected. The data doesn\'t lie.' },
  ],

  // ── Prof. Vec Tor ─────────────────────────────────────────────────────────
  'prof_vec_tor_pre': [
    { speaker: 'Prof. Vec Tor', line: 'You\'ve come a long way. Phonetics, Syntax, Semantics, Algorithms, Deep Learning — you\'ve heard their arguments.' },
    { speaker: 'Prof. Vec Tor', line: 'Mine synthesises all of them. Meaning as geometry. Shall we see if you\'ve been paying attention?' },
  ],
  'prof_vec_tor_win': [
    { speaker: 'Prof. Vec Tor', line: 'The vectors align. Well done — that\'s not something I say lightly. You\'ve earned your credits.' },
  ],
  'prof_vec_tor_loss': [
    { speaker: 'Prof. Vec Tor', line: 'Your embedding was inconsistent. Come back when you\'ve found the right representation.' },
  ],

  // ── Student NPCs ──────────────────────────────────────────────────────────

  'student_halvorsen_pre': [
    { speaker: 'Halvorsen', line: 'You\'ve submitted something. That\'s a start. But I\'m not interested in effort—I\'m interested in correctness.' },
    { speaker: 'Halvorsen', line: 'Let\'s see if this holds up under scrutiny.' },
  ],
  'student_halvorsen_win': [
    { speaker: 'Halvorsen', line: '…Fine. This passes. Not elegantly, but it passes.' },
    { speaker: 'Halvorsen', line: 'Don\'t confuse adequacy with mastery.' },
  ],
  'student_halvorsen_loss': [
    { speaker: 'Halvorsen', line: 'This is what you\'re satisfied with?' },
    { speaker: 'Halvorsen', line: 'Revise it. Then revise it again.' },
  ],
  'student_halvorsen_reward': [
    { speaker: 'Halvorsen', line: 'Take this. Consider it provisional approval.' },
    { speaker: 'Halvorsen', line: 'You\'ve met the minimum. Now raise your standards.' },
  ],

  'student_rohan_pre': [
    { speaker: 'Rohan', line: 'You took my room booking slot, didn\'t you? Yeah, I knew it.' },
    { speaker: 'Rohan', line: 'This whole system\'s a mess—might as well take it out here.' },
  ],
  'student_rohan_win': [
    { speaker: 'Rohan', line: 'Whatever. You probably got lucky with timing.' },
    { speaker: 'Rohan', line: 'Still doesn\'t fix the booking system.' },
  ],
  'student_rohan_loss': [
    { speaker: 'Rohan', line: 'Yeah, okay. That tracks.' },
    { speaker: 'Rohan', line: 'Everything\'s still broken, though.' },
  ],

  'student_voss_pre': [
    { speaker: 'Voss', line: 'That\'s not right. I can already tell.' },
    { speaker: 'Voss', line: 'Go ahead—show me where it fails.' },
  ],
  'student_voss_win': [
    { speaker: 'Voss', line: '…You arrived at something workable.' },
    { speaker: 'Voss', line: 'Don\'t assume that means you understood it.' },
  ],
  'student_voss_loss': [
    { speaker: 'Voss', line: 'No. Still wrong.' },
    { speaker: 'Voss', line: 'You\'re missing something fundamental.' },
  ],

  'student_lab_sentinel_k_pre': [
    { speaker: 'Lab Sentinel K', line: 'You\'re not authorized to be here.' },
    { speaker: 'Lab Sentinel K', line: 'Access is restricted for a reason.' },
  ],
  'student_lab_sentinel_k_win': [
    { speaker: 'Lab Sentinel K', line: '…I\'ll need to review the policy.' },
    { speaker: 'Lab Sentinel K', line: 'This may require an update.' },
  ],
  'student_lab_sentinel_k_loss': [
    { speaker: 'Lab Sentinel K', line: 'Rules are rules.' },
    { speaker: 'Lab Sentinel K', line: 'You\'ll need proper clearance next time.' },
  ],

  'student_finnegan_pre': [
    { speaker: 'Finnegan', line: 'Erm, actually, that\'s not quite precise.' },
    { speaker: 'Finnegan', line: 'If we\'re going to do this, let\'s at least be accurate.' },
  ],
  'student_finnegan_win': [
    { speaker: 'Finnegan', line: 'I suppose that\'s… technically valid.' },
    { speaker: 'Finnegan', line: 'Though I\'d refine the terminology.' },
  ],
  'student_finnegan_loss': [
    { speaker: 'Finnegan', line: 'You\'re missing an important distinction.' },
    { speaker: 'Finnegan', line: 'It matters more than you think.' },
  ],

  'student_simon_pre': [
    { speaker: 'Simon', line: 'My advisor really sucks...' },
    { speaker: 'Simon', line: 'I\'ve been staring at the same paragraph for hours.' },
    { speaker: 'Simon', line: 'Maybe this will reset something.' },
  ],
  'student_simon_win': [
    { speaker: 'Simon', line: 'Yeah… that helped. A little.' },
    { speaker: 'Simon', line: 'Back to the grind, I guess.' },
  ],
  'student_simon_loss': [
    { speaker: 'Simon', line: 'No change.' },
    { speaker: 'Simon', line: 'Still stuck.' },
  ],

  'student_chadwick_pre': [
    { speaker: 'Chadwick', line: 'Bro, you even understand what\'s going on?' },
    { speaker: 'Chadwick', line: 'Let\'s see what you\'ve got.' },
  ],
  'student_chadwick_win': [
    { speaker: 'Chadwick', line: 'Okay, that was actually kind of clean.' },
    { speaker: 'Chadwick', line: 'Respect.' },
  ],
  'student_chadwick_loss': [
    { speaker: 'Chadwick', line: 'Yeah, that\'s about what I expected.' },
    { speaker: 'Chadwick', line: 'You\'ll get there.' },
  ],

  'student_mina_pre': [
    { speaker: 'Mina', line: 'I\'m definitely going to mess this up.' },
    { speaker: 'Mina', line: 'I always do at this point.' },
  ],
  'student_mina_win': [
    { speaker: 'Mina', line: 'Wait… that worked?' },
    { speaker: 'Mina', line: 'Okay. Maybe I\'m not completely doomed.' },
  ],
  'student_mina_loss': [
    { speaker: 'Mina', line: 'Yeah, that makes sense.' },
    { speaker: 'Mina', line: 'I knew it would go like that.' },
  ],

  'student_jax_pre': [
    { speaker: 'Jax', line: 'This better not be mid.' },
    { speaker: 'Jax', line: 'I\'m expecting something at least a little interesting.' },
  ],
  'student_jax_win': [
    { speaker: 'Jax', line: 'Okay, yeah—that was actually solid.' },
    { speaker: 'Jax', line: 'I\'ll give you that.' },
  ],
  'student_jax_loss': [
    { speaker: 'Jax', line: 'Called it.' },
    { speaker: 'Jax', line: 'Predictable outcome.' },
  ],

  'student_marcellus_pre': [
    { speaker: 'Marcellus', line: 'What does it mean to win here?' },
    { speaker: 'Marcellus', line: 'Are we resolving something—or just performing it?' },
  ],
  'student_marcellus_win': [
    { speaker: 'Marcellus', line: 'Interesting. Not the result, but how we arrived there.' },
    { speaker: 'Marcellus', line: 'There\'s something to examine in that.' },
  ],
  'student_marcellus_loss': [
    { speaker: 'Marcellus', line: 'And yet the outcome feels… incidental.' },
    { speaker: 'Marcellus', line: 'I wonder what actually changed.' },
  ],
  'student_marcellus_reward': [
    { speaker: 'Marcellus', line: 'This won\'t answer anything directly.' },
    { speaker: 'Marcellus', line: 'But it might help you notice what you\'re actually asking.' },
    { speaker: 'Marcellus', line: 'Use it when things start to feel unclear.' },
  ],

  'student_elena_pre': [
    { speaker: 'Elena', line: 'I\'ve got a talk in five minutes, so this needs to be quick.' },
    { speaker: 'Elena', line: 'Let\'s keep it efficient.' },
  ],
  'student_elena_win': [
    { speaker: 'Elena', line: 'Okay, that was worth being late for.' },
    { speaker: 'Elena', line: 'I\'ll think about that one.' },
  ],
  'student_elena_loss': [
    { speaker: 'Elena', line: 'I knew I should\'ve prepared more.' },
    { speaker: 'Elena', line: 'There\'s always another talk, I guess.' },
  ],

  'student_soren_pre': [
    { speaker: 'Soren', line: 'If this is anything like the cafeteria, I\'m not optimistic.' },
    { speaker: 'Soren', line: 'Go ahead—surprise me.' },
  ],
  'student_soren_win': [
    { speaker: 'Soren', line: '…Okay. That was decent.' },
    { speaker: 'Soren', line: 'Better than expected.' },
  ],
  'student_soren_loss': [
    { speaker: 'Soren', line: 'Still not satisfying.' },
    { speaker: 'Soren', line: 'Something\'s missing.' },
  ],

  'student_valentine_pre': [
    { speaker: 'Valentine', line: 'Oh—are we starting?' },
    { speaker: 'Valentine', line: 'I thought this was later.' },
  ],
  'student_valentine_win': [
    { speaker: 'Valentine', line: 'That felt… different than I expected.' },
    { speaker: 'Valentine', line: 'I\'m not sure why.' },
  ],
  'student_valentine_loss': [
    { speaker: 'Valentine', line: 'Did that already happen?' },
    { speaker: 'Valentine', line: 'It\'s hard to tell.' },
  ],

  'student_lionel_pre': [
    { speaker: 'Lionel', line: 'Before we start—did you actually listen?' },
    { speaker: 'Lionel', line: 'It matters.' },
  ],
  'student_lionel_win': [
    { speaker: 'Lionel', line: 'Alright, you\'ve got taste.' },
    { speaker: 'Lionel', line: 'I respect that.' },
  ],
  'student_lionel_loss': [
    { speaker: 'Lionel', line: 'Go back and listen again.' },
    { speaker: 'Lionel', line: 'You missed something.' },
  ],
  'student_lionel_reward': [
    { speaker: 'Lionel', line: 'Now you\'re actually part of it.' },
    { speaker: 'Lionel', line: 'Don\'t just skim—engage with it.' },
    { speaker: 'Lionel', line: 'There\'s always more to hear.' },
  ],

  'student_suzanna_pre': [
    { speaker: 'Suzanna', line: 'It\'s been a long stretch.' },
    { speaker: 'Suzanna', line: 'But maybe this will shift something.' },
  ],
  'student_suzanna_win': [
    { speaker: 'Suzanna', line: 'That\'s… something to hold onto.' },
    { speaker: 'Suzanna', line: 'A small improvement still counts.' },
  ],
  'student_suzanna_loss': [
    { speaker: 'Suzanna', line: 'I\'ll get there eventually.' },
    { speaker: 'Suzanna', line: 'Just not today.' },
  ],
  'student_suzanna_reward': [
    { speaker: 'Suzanna', line: 'You\'ve been paying attention.' },
    { speaker: 'Suzanna', line: 'To the details, to the differences.' },
    { speaker: 'Suzanna', line: 'That kind of listening stays with you.' },
  ],
};

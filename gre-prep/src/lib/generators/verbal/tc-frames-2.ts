/* Text Completion, batch 2. Vocabulary drawn from the flashcard deck. */

import type { TCFrame } from './taxonomy';

export const TC_1_BLANK_2: TCFrame[] = [
  {
    text: 'The negotiator was valued less for eloquence than for {{1}}: she could sit through six hours of deadlock without once appearing to tire of it.',
    blanks: [{ correct: 'forbearance', distractors: ['candor', 'volubility', 'acuity', 'rectitude'] }],
    rationale:
      'Sitting through six hours of deadlock without visible impatience is patient endurance. "Candor" and "acuity" are virtues the sentence does not describe, and "volubility" means talkativeness, which "less for eloquence" has already set aside.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'Though the technique is now taught in every introductory course, it was regarded as {{1}} when first proposed, and its inventor spent a decade defending it.',
    blanks: [{ correct: 'heretical', distractors: ['rudimentary', 'expedient', 'axiomatic', 'lucrative'] }],
    rationale:
      '"Though" contrasts present orthodoxy with initial reception, and a decade of defense implies the idea offended prevailing opinion. "Axiomatic" means self-evidently true, which would require no defense at all.',
    difficulty: 4,
    tags: ['contrast', 'time-shift'],
  },
  {
    text: 'The witness gave her account in a {{1}} manner, supplying dates and figures without once pausing to search her memory.',
    blanks: [{ correct: 'methodical', distractors: ['halting', 'querulous', 'diffident', 'garrulous'] }],
    rationale:
      'Supplying dates and figures without pausing indicates orderly, prepared delivery. "Halting" and "diffident" both describe hesitancy, which "without once pausing" rules out directly.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'Her later essays {{1}} the positions of her early work so thoroughly that readers coming to them in order can find the reversal disorienting.',
    blanks: [{ correct: 'repudiate', distractors: ['refine', 'anticipate', 'reiterate', 'annotate'] }],
    rationale:
      'A reversal disorienting to sequential readers implies rejection of the earlier positions. "Refine" would mean improving them, which produces continuity rather than reversal; "reiterate" means restating.',
    difficulty: 4,
    tags: ['result-clause'],
  },
  {
    text: 'The committee\'s recommendations were so {{1}} that the department implemented them without requesting a single clarification.',
    blanks: [{ correct: 'unequivocal', distractors: ['contentious', 'protracted', 'tentative', 'sweeping'] }],
    rationale:
      'Implementation without any request for clarification indicates recommendations admitting no doubt. "Tentative" would invite questions, and "sweeping" concerns scope rather than clarity — a broad recommendation can still be ambiguous.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'What the prospectus described as a conservative estimate proved wildly {{1}}, overstating first-year revenue by a factor of four.',
    blanks: [{ correct: 'sanguine', distractors: ['pessimistic', 'opaque', 'belated', 'technical'] }],
    rationale:
      'Overstating revenue fourfold makes the estimate excessively optimistic, in ironic contrast to "conservative". "Pessimistic" is the opposite error; "opaque" concerns clarity rather than optimism.',
    difficulty: 5,
    tags: ['irony', 'quantitative-clue'],
  },
  {
    text: 'He treated every disagreement as an attack, a {{1}} that made collaboration with him exhausting even for his allies.',
    blanks: [{ correct: 'pugnacity', distractors: ['diffidence', 'erudition', 'levity', 'candor'] }],
    rationale:
      'Reading every disagreement as an attack is combativeness. "Diffidence" means shyness, the opposite disposition; "levity" means lightness of manner, which the exhausting effect contradicts.',
    difficulty: 4,
    tags: ['characterization'],
  },
  {
    text: 'The archive\'s holdings are {{1}}: three centuries of parish records, none of them catalogued.',
    blanks: [{ correct: 'voluminous', distractors: ['meager', 'apocryphal', 'accessible', 'legible'] }],
    rationale:
      'Three centuries of records is a very large quantity. "Meager" reverses it; "accessible" is contradicted by the closing detail that nothing is catalogued.',
    difficulty: 3,
    tags: ['colon-restatement'],
  },
  {
    text: 'Rather than {{1}} the objection, she restated it in stronger terms than her critic had managed and then answered it.',
    blanks: [{ correct: 'dismiss', distractors: ['concede', 'amplify', 'anticipate', 'endorse'] }],
    rationale:
      '"Rather than" opposes the blank to strengthening and answering the objection, so the blank means to wave it aside. "Amplify" is close to what she actually did, not to what she declined to do.',
    difficulty: 4,
    tags: ['contrast'],
  },
  {
    text: 'The style of the frescoes is so {{1}} that scholars have assigned them to four different centuries.',
    blanks: [{ correct: 'anomalous', distractors: ['conventional', 'ornate', 'faded', 'devotional'] }],
    rationale:
      'Assignment to four different centuries indicates a style that fits no established pattern. "Conventional" would make dating straightforward; "faded" concerns condition rather than style.',
    difficulty: 4,
    tags: ['result-clause'],
  },
  {
    text: 'His generosity toward rivals was widely admired, though a few suspected it was less {{1}} than strategic.',
    blanks: [{ correct: 'altruistic', distractors: ['ostentatious', 'habitual', 'reciprocal', 'lavish'] }],
    rationale:
      '"Less X than strategic" sets the blank against calculation, so it means disinterested. "Ostentatious" would itself be a form of calculation rather than its opposite.',
    difficulty: 4,
    tags: ['contrast'],
  },
  {
    text: 'The treaty has been {{1}} by both parties for thirty years, though neither has ever formally ratified it.',
    blanks: [{ correct: 'observed', distractors: ['contested', 'annulled', 'drafted', 'publicized'] }],
    rationale:
      '"Though neither has formally ratified" concedes a gap between practice and law, so the blank must describe the practice: they have kept to it. "Contested" and "annulled" both contradict thirty years of compliance.',
    difficulty: 4,
    tags: ['concession'],
  },
  {
    text: 'She had a {{1}} distaste for public ceremony, declining every honorary degree offered to her over forty years.',
    blanks: [{ correct: 'settled', distractors: ['sporadic', 'feigned', 'recent', 'grudging'] }],
    rationale:
      'Declining every offer across forty years shows a fixed and consistent aversion. "Sporadic" and "recent" both contradict the span; "feigned" would mean the distaste was not genuine, which the consistent behavior belies.',
    difficulty: 4,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The report is unusual among government documents in being genuinely {{1}}: it names the officials responsible and quantifies what each decision cost.',
    blanks: [{ correct: 'forthcoming', distractors: ['circumspect', 'exhaustive', 'preliminary', 'anonymous'] }],
    rationale:
      'Naming officials and quantifying costs is disclosure beyond the norm. "Circumspect" means guarded, the opposite; "exhaustive" concerns completeness, and a document can be thorough while still withholding names.',
    difficulty: 5,
    tags: ['colon-restatement'],
  },
  {
    text: 'Given how {{1}} the evidence was, the jury\'s rapid acquittal surprised no one who had sat through the trial.',
    blanks: [{ correct: 'flimsy', distractors: ['damning', 'voluminous', 'technical', 'circumstantial'] }],
    rationale:
      'A rapid acquittal that surprised no attentive observer follows from weak evidence. "Damning" would produce conviction; "voluminous" concerns quantity, and a large body of evidence could still convict.',
    difficulty: 3,
    tags: ['cause-effect'],
  },
  {
    text: 'The essay\'s argument is {{1}}, moving from a claim about language to a conclusion about law without pausing to justify the leap.',
    blanks: [{ correct: 'elliptical', distractors: ['pedantic', 'exhaustive', 'derivative', 'measured'] }],
    rationale:
      'Moving between domains without justifying the step leaves out a required link. "Elliptical" means omitting what is needed. "Exhaustive" and "measured" both describe the care the essay conspicuously lacks.',
    difficulty: 5,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'Colleagues found his praise {{1}}, since he offered it only when someone senior was in the room.',
    blanks: [{ correct: 'suspect', distractors: ['effusive', 'welcome', 'infrequent', 'articulate'] }],
    rationale:
      'Praise timed to an audience of superiors invites doubt about its sincerity. "Infrequent" describes how often it occurred without capturing the distrust the timing produces.',
    difficulty: 4,
    tags: ['inference'],
  },
  {
    text: 'Where earlier accounts had treated the migration as a single event, the new study {{1}} it into at least six distinct movements spread over two centuries.',
    blanks: [{ correct: 'disaggregates', distractors: ['consolidates', 'commemorates', 'postpones', 'authenticates'] }],
    rationale:
      '"Where earlier … single event" contrasts with six distinct movements, so the study breaks the event apart. "Consolidates" means combining into one, which is the older view rather than the new one.',
    difficulty: 5,
    tags: ['contrast', 'academic'],
  },
  {
    text: 'The proposal\'s appeal was largely {{1}}: it promised savings that would appear in the current budget and costs that would fall on a future one.',
    blanks: [{ correct: 'illusory', distractors: ['bipartisan', 'technical', 'enduring', 'incremental'] }],
    rationale:
      'Savings now with costs deferred means the benefit is only apparent. "Enduring" is the opposite of a benefit that evaporates once the deferred costs arrive.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'For a writer so often called difficult, his letters are surprisingly {{1}}, full of jokes and domestic detail.',
    blanks: [{ correct: 'genial', distractors: ['abstruse', 'acerbic', 'formal', 'fragmentary'] }],
    rationale:
      'Jokes and domestic detail, set against a reputation for difficulty, indicate warmth. "Abstruse" restates the difficulty rather than contrasting with it; "acerbic" means sharp and biting.',
    difficulty: 4,
    tags: ['contrast'],
  },
  {
    text: 'The commission was created to investigate the collapse but was given no power to compel testimony, which many regarded as {{1}} from the outset.',
    blanks: [{ correct: 'debilitating', distractors: ['customary', 'prudent', 'contentious', 'temporary'] }],
    rationale:
      'An investigative body unable to compel testimony is crippled in its central function, and "which many regarded as" invites a judgment of that limitation. "Prudent" would defend the restriction rather than criticize it.',
    difficulty: 4,
    tags: ['inference'],
  },
  {
    text: 'Her scholarship is admired for its {{1}}, drawing on archaeology, philology, and climate science without ever losing the thread of the argument.',
    blanks: [{ correct: 'catholicity', distractors: ['parsimony', 'insularity', 'brevity', 'orthodoxy'] }],
    rationale:
      'Drawing on three distinct disciplines is intellectual breadth. "Insularity" means narrowness, the opposite; "parsimony" means economy of assumption, which the sentence does not address.',
    difficulty: 5,
    tags: ['example-as-clue'],
  },
  {
    text: 'The two accounts cannot both be right, and the discrepancy is too large to be {{1}} as a rounding error.',
    blanks: [{ correct: 'dismissed', distractors: ['magnified', 'corroborated', 'itemized', 'replicated'] }],
    rationale:
      'A discrepancy too large to treat as rounding is one that cannot be waved away. "Magnified" reverses the direction, and "corroborated" would mean confirming the discrepancy rather than explaining it away.',
    difficulty: 3,
    tags: ['negation'],
  },
  {
    text: 'He was {{1}} in defeat, congratulating his opponent at length and declining every invitation to complain about the count.',
    blanks: [{ correct: 'gracious', distractors: ['truculent', 'inconsolable', 'evasive', 'jubilant'] }],
    rationale:
      'Congratulating an opponent and refusing to complain is courteous conduct in loss. "Truculent" means aggressively defiant; "jubilant" would be inappropriate to defeat and is contradicted by the restraint described.',
    difficulty: 3,
    tags: ['behavior-as-clue'],
  },
  {
    text: 'The field has produced a great deal of data and remarkably little {{1}}: after thirty years, there is still no framework that most researchers accept.',
    blanks: [{ correct: 'consensus', distractors: ['funding', 'controversy', 'documentation', 'specialization'] }],
    rationale:
      'The colon explains: no framework most researchers accept. "Controversy" is what the field has plenty of, not what it lacks; "documentation" is covered by the data the sentence says is abundant.',
    difficulty: 3,
    tags: ['colon-restatement'],
  },
];

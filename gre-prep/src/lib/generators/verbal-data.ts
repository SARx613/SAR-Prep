/* Vocabulary and sentence frames for the verbal generators.
 *
 * Every frame is written here rather than drawn from any published book.
 * The design follows the ETS specification: Text Completion supplies a
 * passage with blanks whose answer is fixed by the logic of the sentence,
 * and Sentence Equivalence needs two choices that are near-synonyms AND
 * that yield the same overall meaning — which is why each SE frame carries
 * a synonym *pair*, not merely six loose words.
 */

export interface TCFrame {
  /** Sentence with {{1}}, {{2}}, {{3}} markers. */
  text: string;
  /** Per blank: the key first, then the distractors for that blank. */
  blanks: { correct: string; distractors: [string, string] }[];
  /** Why the sentence forces those choices. */
  rationale: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface SEFrame {
  /** Sentence with a single {{1}} marker. */
  text: string;
  /** The two interchangeable keys. */
  pair: [string, string];
  /** Four distractors: plausible in tone, wrong in meaning. */
  distractors: [string, string, string, string];
  rationale: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

/* ── Text Completion ──────────────────────────────────────────────────── */

export const TC_FRAMES: TCFrame[] = [
  {
    text: 'Although the committee had been expected to reject the proposal outright, its final report was surprisingly {{1}}, praising several provisions that critics had dismissed.',
    blanks: [
      { correct: 'laudatory', distractors: ['censorious', 'perfunctory'] },
    ],
    rationale:
      '"Although" sets up a contrast with rejection, and the second clause says the report praised provisions. The blank must therefore be positive. "Censorious" means harshly critical, which matches the expectation rather than the surprise; "perfunctory" means done without care, which says nothing about praise.',
    difficulty: 2,
    tags: ['contrast', 'tone'],
  },
  {
    text: 'The biographer refuses to {{1}} her subject, presenting his cruelty and his generosity with equal candor rather than smoothing either into a more comfortable portrait.',
    blanks: [
      { correct: 'sanitize', distractors: ['scrutinize', 'chronicle'] },
    ],
    rationale:
      '"Rather than smoothing" defines the blank by opposition: the biographer will not clean up the portrait. "Scrutinize" means to examine closely, which is what she does do; "chronicle" means to record, which is neutral and also what she does.',
    difficulty: 3,
    tags: ['definition-by-contrast'],
  },
  {
    text: 'Far from being {{1}}, the new regulations were so {{2}} that firms found themselves able to continue nearly every practice the legislation had ostensibly been written to curb.',
    blanks: [
      { correct: 'stringent', distractors: ['ambiguous', 'novel'] },
      { correct: 'lax', distractors: ['arcane', 'sweeping'] },
    ],
    rationale:
      '"Far from being" flips the first blank against the second, and the result clause — firms could continue their practices — fixes the second blank as weak or permissive. So blank 2 is "lax" and blank 1 is its opposite, "stringent". "Sweeping" would mean the rules were broad, contradicting the outcome.',
    difficulty: 4,
    tags: ['two-blank', 'contrast', 'result'],
  },
  {
    text: 'The theory retains a certain {{1}} among specialists precisely because it has never been tested: no experiment has yet been devised that could {{2}} it.',
    blanks: [
      { correct: 'allure', distractors: ['notoriety', 'rigor'] },
      { correct: 'falsify', distractors: ['corroborate', 'articulate'] },
    ],
    rationale:
      '"Precisely because it has never been tested" explains the appeal, so blank 1 is positive: "allure". The colon then restates the same fact, so blank 2 must mean "put to the test in a way that could disprove" — "falsify". "Corroborate" reverses the logic, since a theory that cannot be confirmed is not thereby attractive.',
    difficulty: 5,
    tags: ['two-blank', 'colon-restatement'],
  },
  {
    text: 'Her prose is admired for its {{1}}: not a syllable is wasted, and every clause carries the argument forward.',
    blanks: [{ correct: 'economy', distractors: ['ornateness', 'obscurity'] }],
    rationale:
      'The colon restates the blank: nothing wasted, every clause working. That is "economy". "Ornateness" means elaborately decorated, the opposite of wasting nothing; "obscurity" would contradict the admiration.',
    difficulty: 2,
    tags: ['colon-restatement'],
  },
  {
    text: 'The senator\'s apology was widely judged {{1}}, offered only after polling revealed the extent of public anger and withdrawn in substance the following week.',
    blanks: [{ correct: 'disingenuous', distractors: ['belated', 'impolitic'] }],
    rationale:
      'The details — apologizing only after polling, then walking it back — indicate insincerity, not merely lateness. "Belated" captures the timing but not the falseness, and the sentence stresses motive; "impolitic" means unwise, which the polling-driven timing contradicts.',
    difficulty: 4,
    tags: ['inference', 'tone'],
  },
  {
    text: 'Once dismissed as {{1}}, the artist\'s late canvases are now held to anticipate developments that would not become widespread for another thirty years.',
    blanks: [{ correct: 'derivative', distractors: ['luminous', 'unfinished'] }],
    rationale:
      '"Once dismissed" contrasts with the present judgment that the work anticipated later developments — that is, it was original. The blank must be the negative counterpart of originality: "derivative". "Luminous" is positive; "unfinished" is not the opposite of anticipatory.',
    difficulty: 3,
    tags: ['contrast', 'time-shift'],
  },
  {
    text: 'The editor valued concision, and so found the manuscript\'s {{1}} passages, which circled the same point for pages, particularly {{2}}.',
    blanks: [
      { correct: 'prolix', distractors: ['trenchant', 'lyrical'] },
      { correct: 'trying', distractors: ['illuminating', 'negligible'] },
    ],
    rationale:
      '"Circled the same point for pages" defines blank 1 as wordy: "prolix". Since the editor values concision, wordiness would be irritating, so blank 2 is "trying". "Illuminating" would reverse the editor\'s stated preference.',
    difficulty: 3,
    tags: ['two-blank', 'cause-effect'],
  },
  {
    text: 'Rather than {{1}} the discrepancy, the researchers highlighted it, treating the anomalous result as the most interesting finding of the study.',
    blanks: [{ correct: 'eliding', distractors: ['replicating', 'quantifying'] }],
    rationale:
      '"Rather than … highlighted" sets up a direct opposite: the blank means to pass over or conceal, which is "eliding". "Replicating" and "quantifying" are both things researchers might do to a result, but neither opposes highlighting.',
    difficulty: 4,
    tags: ['contrast', 'definition-by-contrast'],
  },
  {
    text: 'The regime tolerated dissent only in {{1}} forms, permitting satire in the theaters while imprisoning those who criticized it in plainer language.',
    blanks: [{ correct: 'oblique', distractors: ['strident', 'clandestine'] }],
    rationale:
      'Satire is tolerated while plain criticism is punished, so the permitted forms are indirect: "oblique". "Strident" means loud and harsh, the opposite of what was tolerated; "clandestine" means secret, but theater satire was public.',
    difficulty: 4,
    tags: ['example-as-clue'],
  },
  {
    text: 'The council\'s decision was less an act of policy than of {{1}}: faced with two irreconcilable factions, it chose the option that would offend neither.',
    blanks: [{ correct: 'expediency', distractors: ['principle', 'contrition'] }],
    rationale:
      'The colon explains the decision: avoiding offense to either faction is practical convenience, not conviction. "Expediency" names that. "Principle" is exactly what the sentence denies with "less an act of policy than"; "contrition" means remorse, which is unrelated.',
    difficulty: 4,
    tags: ['colon-restatement', 'contrast'],
  },
  {
    text: 'What began as a {{1}} objection to one clause grew, over months of debate, into a wholesale rejection of the entire framework.',
    blanks: [{ correct: 'circumscribed', distractors: ['vehement', 'inchoate'] }],
    rationale:
      'The contrast is between a small beginning and a "wholesale" end, so the blank means limited in scope: "circumscribed". "Vehement" describes intensity rather than scope, and a forceful objection could still be narrow; "inchoate" means undeveloped, which does not oppose "wholesale".',
    difficulty: 4,
    tags: ['contrast', 'scope'],
  },
  {
    text: 'The findings were {{1}} enough that the journal required a second laboratory to replicate them before publication.',
    blanks: [{ correct: 'startling', distractors: ['tentative', 'derivative'] }],
    rationale:
      'Demanding independent replication signals results surprising enough to invite doubt. "Startling" fits. "Tentative" describes the researchers\u2019 confidence, not the result\u2019s character, and journals do not demand replication for merely cautious claims; "derivative" would mean unoriginal, which would not prompt scrutiny.',
    difficulty: 3,
    tags: ['result-clause', 'inference'],
  },
  {
    text: 'Although his early work was praised for its {{1}}, the later novels sprawl across hundreds of pages without evident design, as though the author had lost interest in {{2}}.',
    blanks: [
      { correct: 'architecture', distractors: ['erudition', 'sentiment'] },
      { correct: 'form', distractors: ['publication', 'ambiguity'] },
    ],
    rationale:
      '"Although" contrasts early praise with later sprawl "without evident design", so blank 1 names structural quality: "architecture". Blank 2 must be what the sprawling books abandon, which is the same thing under another name: "form". "Erudition" concerns learning, which sprawl does not contradict.',
    difficulty: 5,
    tags: ['two-blank', 'contrast'],
  },
  {
    text: 'Her critics accuse her of {{1}}, but the charge is hard to sustain against a scholar who has publicly revised three of her central claims.',
    blanks: [{ correct: 'dogmatism', distractors: ['pedantry', 'plagiarism'] }],
    rationale:
      'Publicly revising one\u2019s claims is the opposite of refusing to reconsider, so the charge being rebutted is inflexibility: "dogmatism". "Pedantry" means excessive attention to detail, which revision does not refute; "plagiarism" would not be answered by revising claims.',
    difficulty: 4,
    tags: ['refutation', 'inference'],
  },
  {
    text: 'The city\'s growth was not {{1}} but the product of decades of deliberate planning, much of it invisible to residents who experienced only the result.',
    blanks: [{ correct: 'fortuitous', distractors: ['gradual', 'unwelcome'] }],
    rationale:
      '"Not X but the product of deliberate planning" makes the blank mean accidental: "fortuitous". "Gradual" is compatible with planning — decades of planning is itself gradual — so it fails to oppose; "unwelcome" is not the opposite of planned.',
    difficulty: 3,
    tags: ['negation', 'contrast'],
  },
];

/* ── Sentence Equivalence ─────────────────────────────────────────────── */

export const SE_FRAMES: SEFrame[] = [
  {
    text: 'The lecture was so {{1}} that even students who had chosen the course eagerly found their attention wandering.',
    pair: ['soporific', 'tedious'],
    distractors: ['contentious', 'abstruse', 'succinct', 'impromptu'],
    rationale:
      'Attention wandering among eager students points to dullness. "Soporific" (sleep-inducing) and "tedious" both give that, and both produce the same sentence. "Abstruse" means hard to understand, which is a different complaint; "succinct" would not cause wandering attention.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'Critics praised the design for its {{1}}, noting that it achieved its effect with almost no ornament at all.',
    pair: ['austerity', 'spareness'],
    distractors: ['grandeur', 'novelty', 'symmetry', 'durability'],
    rationale:
      '"Almost no ornament" defines the blank as plain and unadorned. "Austerity" and "spareness" are near-synonyms here and yield the same meaning. "Grandeur" contradicts the absence of ornament; "novelty" and "symmetry" are unrelated to ornamentation.',
    difficulty: 3,
    tags: ['definition-restatement'],
  },
  {
    text: 'Though the evidence against the hypothesis had accumulated for a decade, its adherents remained {{1}}, dismissing each new study in turn.',
    pair: ['obdurate', 'intransigent'],
    distractors: ['credulous', 'despondent', 'circumspect', 'vindicated'],
    rationale:
      'Dismissing every study despite mounting evidence is stubbornness. "Obdurate" and "intransigent" both mean unyieldingly stubborn. "Credulous" means too willing to believe, nearly the opposite; "circumspect" means cautious, which dismissing evidence is not.',
    difficulty: 4,
    tags: ['concession', 'behavior-as-clue'],
  },
  {
    text: 'The treaty\'s language was deliberately {{1}}, allowing each signatory to claim that its own interpretation had prevailed.',
    pair: ['ambiguous', 'equivocal'],
    distractors: ['stringent', 'bellicose', 'concise', 'archaic'],
    rationale:
      'If every signatory can claim a different reading, the language admits multiple interpretations. "Ambiguous" and "equivocal" both capture that and are interchangeable here. "Concise" concerns length, not multiplicity of meaning.',
    difficulty: 3,
    tags: ['purpose-clause'],
  },
  {
    text: 'Far from being a {{1}} figure in the movement, she founded two of its most influential journals and trained a generation of its writers.',
    pair: ['marginal', 'peripheral'],
    distractors: ['seminal', 'contentious', 'prolific', 'reclusive'],
    rationale:
      '"Far from being" negates the blank, and the evidence given establishes centrality. The blank must therefore mean unimportant: "marginal" and "peripheral". "Seminal" means highly influential, which is what she actually was — the trap for anyone who misses the negation.',
    difficulty: 4,
    tags: ['negation', 'contrast'],
  },
  {
    text: 'His account of the expedition is valuable precisely because it is so {{1}}: he records the failures and the petty quarrels along with the triumphs.',
    pair: ['candid', 'forthright'],
    distractors: ['laconic', 'sanguine', 'meticulous', 'partisan'],
    rationale:
      'Recording failures and quarrels alongside triumphs is honesty about unflattering material. "Candid" and "forthright" both mean frank and are interchangeable. "Meticulous" describes care rather than honesty, and "partisan" contradicts the even-handedness described.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'The proposal met with {{1}} approval: the vote was unanimous and took less than a minute.',
    pair: ['immediate', 'instantaneous'],
    distractors: ['grudging', 'qualified', 'tentative', 'belated'],
    rationale:
      'A unanimous vote taking under a minute is fast approval. "Immediate" and "instantaneous" match and are interchangeable. "Grudging", "qualified", and "tentative" all imply reluctance, which unanimity contradicts.',
    difficulty: 2,
    tags: ['colon-restatement'],
  },
  {
    text: 'Once {{1}} in academic circles, the interpretation is now taught as settled fact in introductory courses.',
    pair: ['controversial', 'contentious'],
    distractors: ['obscure', 'canonical', 'fashionable', 'derivative'],
    rationale:
      '"Once … now settled" requires a past state opposed to consensus. "Controversial" and "contentious" both mean disputed and are interchangeable. "Obscure" means little known, which is a different contrast — an idea can be obscure without being disputed.',
    difficulty: 3,
    tags: ['time-shift', 'contrast'],
  },
  {
    text: 'The novel\'s reputation rests less on its plot, which is frankly {{1}}, than on the precision of its sentences.',
    pair: ['hackneyed', 'trite'],
    distractors: ['intricate', 'harrowing', 'opaque', 'digressive'],
    rationale:
      '"Less on its plot … than on the sentences" concedes a weakness in the plot, and "frankly" signals a blunt criticism. "Hackneyed" and "trite" both mean overfamiliar and are interchangeable. "Intricate" would be a strength, not a concession.',
    difficulty: 4,
    tags: ['concession', 'comparison'],
  },
  {
    text: 'Because the data were gathered under such {{1}} conditions, later researchers were unable to reproduce the finding.',
    pair: ['irregular', 'anomalous'],
    distractors: ['rigorous', 'controlled', 'auspicious', 'transparent'],
    rationale:
      'Failure to reproduce points to conditions that departed from the norm. "Irregular" and "anomalous" both convey that and are interchangeable. "Rigorous", "controlled", and "transparent" would all make replication easier, reversing the causal logic.',
    difficulty: 3,
    tags: ['cause-effect'],
  },
  {
    text: 'The manager\'s praise was so {{1}} that the staff could not tell whether they were being commended or warned.',
    pair: ['equivocal', 'ambiguous'],
    distractors: ['effusive', 'perfunctory', 'scathing', 'private'],
    rationale:
      'If listeners cannot tell commendation from warning, the praise admits both readings. "Equivocal" and "ambiguous" both mean open to more than one interpretation. "Effusive" means unrestrained, which would be unmistakably positive; "perfunctory" means half-hearted but not unclear.',
    difficulty: 4,
    tags: ['result-clause'],
  },
  {
    text: 'She was known for her {{1}}, giving away most of her income and endowing three hospitals in her lifetime.',
    pair: ['munificence', 'largesse'],
    distractors: ['frugality', 'probity', 'acumen', 'reticence'],
    rationale:
      'Giving away income and endowing hospitals is generosity on a grand scale. "Munificence" and "largesse" both name exactly that and are interchangeable. "Frugality" means thrift, which is nearly opposite; "probity" (integrity) and "acumen" (shrewdness) are unrelated virtues.',
    difficulty: 4,
    tags: ['example-as-clue'],
  },
  {
    text: 'The committee\'s report was {{1}}, running to nine volumes that few members had time to read in full.',
    pair: ['voluminous', 'copious'],
    distractors: ['incisive', 'perfunctory', 'confidential', 'belated'],
    rationale:
      'Nine volumes too long to read describes sheer bulk. "Voluminous" and "copious" both mean extensive in quantity and are interchangeable here. "Perfunctory" means done with minimal effort, which nine volumes contradicts; "incisive" concerns sharpness of analysis, not length.',
    difficulty: 3,
    tags: ['definition-restatement'],
  },
  {
    text: 'Rather than confronting the objection directly, the author {{1}} it, burying a brief concession in a footnote.',
    pair: ['sidesteps', 'evades'],
    distractors: ['concedes', 'refutes', 'anticipates', 'amplifies'],
    rationale:
      '"Rather than confronting … directly" and burying the concession both indicate avoidance. "Sidesteps" and "evades" match and are interchangeable. "Concedes" describes the footnote alone rather than the maneuver, and "refutes" is what the author declines to do.',
    difficulty: 4,
    tags: ['contrast', 'behavior-as-clue'],
  },
  {
    text: 'The medication\'s benefits proved {{1}}: patients improved markedly for six weeks, after which the effect disappeared entirely.',
    pair: ['transient', 'ephemeral'],
    distractors: ['negligible', 'cumulative', 'unpredictable', 'salutary'],
    rationale:
      'Improvement that vanishes after six weeks is short-lived. "Transient" and "ephemeral" both mean brief and are interchangeable. "Negligible" contradicts "improved markedly"; "cumulative" would mean the effect built up, the reverse of what happened.',
    difficulty: 3,
    tags: ['colon-restatement'],
  },
  {
    text: 'Even sympathetic reviewers found the argument {{1}}, noting that its central chapter rests on a source the author never identifies.',
    pair: ['tenuous', 'flimsy'],
    distractors: ['audacious', 'exhaustive', 'orthodox', 'byzantine'],
    rationale:
      'An unidentified source underpinning the central chapter makes the argument weakly supported. "Tenuous" and "flimsy" both convey that and are interchangeable. "Audacious" describes boldness rather than weakness; "byzantine" means excessively complex, a different criticism.',
    difficulty: 4,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The style that once seemed daringly experimental now looks almost {{1}}, so thoroughly has it been absorbed into ordinary practice.',
    pair: ['conventional', 'commonplace'],
    distractors: ['antiquated', 'radical', 'meticulous', 'esoteric'],
    rationale:
      'Absorption into ordinary practice makes the once-daring style unremarkable. "Conventional" and "commonplace" both mean ordinary and are interchangeable. "Antiquated" means outdated, which is a different claim — absorbed is not the same as obsolete; "radical" reverses the sentence.',
    difficulty: 4,
    tags: ['time-shift', 'contrast'],
  },
  {
    text: 'He responded to every question with the same {{1}} courtesy, revealing nothing of what he actually thought.',
    pair: ['bland', 'anodyne'],
    distractors: ['effusive', 'caustic', 'halting', 'genuine'],
    rationale:
      'Courtesy that reveals nothing is deliberately inoffensive and empty of content. "Bland" and "anodyne" both mean unobjectionable to the point of vacancy and are interchangeable. "Effusive" implies excess feeling, which "revealing nothing" contradicts; "caustic" is the opposite of courteous.',
    difficulty: 5,
    tags: ['characterization'],
  },
  {
    text: 'The reform was {{1}} from the start, requiring approval from three bodies whose interests were fundamentally opposed.',
    pair: ['doomed', 'foredoomed'],
    distractors: ['contentious', 'ambitious', 'expensive', 'popular'],
    rationale:
      'Requiring agreement among fundamentally opposed bodies makes failure certain in advance. "Doomed" and "foredoomed" both carry that and are interchangeable. "Contentious" describes dispute without implying failure — the trap for readers who stop at "opposed"; "ambitious" describes scope rather than prospects.',
    difficulty: 4,
    tags: ['cause-effect'],
  },
  {
    text: 'Archaeologists initially dismissed the marks as {{1}}, the result of ordinary weathering rather than of human hands.',
    pair: ['incidental', 'adventitious'],
    distractors: ['deliberate', 'ancient', 'symbolic', 'legible'],
    rationale:
      'The blank is defined by the appositive: weathering rather than human agency, so the marks are accidental. "Incidental" and "adventitious" both mean arising by chance and are interchangeable. "Deliberate" and "symbolic" both imply the human intent the sentence rules out.',
    difficulty: 5,
    tags: ['appositive-restatement'],
  },
];

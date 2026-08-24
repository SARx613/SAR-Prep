/* Text Completion frames.
 *
 * Per the ETS specification, a one-blank item offers five choices and a
 * two- or three-blank item offers three per blank, with no partial credit.
 * Vocabulary is drawn from the flashcard deck so that these items rehearse
 * the same words the flashcards teach.
 *
 * Each frame states, in its rationale, the textual signal that fixes the
 * answer — a contrast, a restatement after a colon, a cause-effect chain —
 * because recognising that signal is the transferable skill.
 */

import type { TCFrame } from './taxonomy';

/* ── One blank ────────────────────────────────────────────────────────── */

export const TC_1_BLANK: TCFrame[] = [
  {
    text: 'Although the committee had been expected to reject the proposal outright, its final report was surprisingly {{1}}, praising several provisions that critics had dismissed.',
    blanks: [{ correct: 'laudatory', distractors: ['censorious', 'perfunctory', 'equivocal', 'exhaustive'] }],
    rationale:
      '"Although" sets the report against the expected rejection, and the second clause says it praised provisions. The blank must be positive. "Censorious" means harshly critical, matching the expectation rather than the surprise; "perfunctory" means done without care, which says nothing about praise.',
    difficulty: 2,
    tags: ['contrast', 'tone'],
  },
  {
    text: 'The biographer refuses to {{1}} her subject, presenting his cruelty and his generosity with equal candor rather than smoothing either into a more comfortable portrait.',
    blanks: [{ correct: 'sanitize', distractors: ['scrutinize', 'chronicle', 'lionize', 'interrogate'] }],
    rationale:
      '"Rather than smoothing" defines the blank by opposition: she will not clean up the portrait. "Scrutinize" and "chronicle" are both things she does do; "lionize" means to treat as a celebrity, which is close but concerns elevation rather than the removal of unflattering material.',
    difficulty: 3,
    tags: ['definition-by-contrast'],
  },
  {
    text: 'Her prose is admired for its {{1}}: not a syllable is wasted, and every clause carries the argument forward.',
    blanks: [{ correct: 'economy', distractors: ['ornateness', 'obscurity', 'volubility', 'asperity'] }],
    rationale:
      'The colon restates the blank — nothing wasted, every clause working. That is economy. "Ornateness" and "volubility" both describe excess, contradicting "not a syllable is wasted".',
    difficulty: 2,
    tags: ['colon-restatement'],
  },
  {
    text: "The senator's apology was widely judged {{1}}, offered only after polling revealed the extent of public anger and withdrawn in substance the following week.",
    blanks: [{ correct: 'disingenuous', distractors: ['belated', 'impolitic', 'magnanimous', 'intemperate'] }],
    rationale:
      'Apologizing only after polling and then walking it back indicates insincerity rather than mere lateness. "Belated" captures the timing but not the falseness the sentence stresses; "impolitic" means unwise, which the poll-driven timing contradicts.',
    difficulty: 4,
    tags: ['inference', 'tone'],
  },
  {
    text: "Once dismissed as {{1}}, the artist's late canvases are now held to anticipate developments that would not become widespread for another thirty years.",
    blanks: [{ correct: 'derivative', distractors: ['luminous', 'unfinished', 'prophetic', 'monumental'] }],
    rationale:
      '"Once dismissed" contrasts with the present judgment that the work anticipated later developments — that is, it was original. The blank is the negative counterpart of originality. "Prophetic" states the current view, not the discarded one.',
    difficulty: 3,
    tags: ['contrast', 'time-shift'],
  },
  {
    text: 'Rather than {{1}} the discrepancy, the researchers highlighted it, treating the anomalous result as the most interesting finding of the study.',
    blanks: [{ correct: 'eliding', distractors: ['replicating', 'quantifying', 'publicizing', 'inducing'] }],
    rationale:
      '"Rather than … highlighted" demands a direct opposite: to pass over or conceal. "Replicating" and "quantifying" are things researchers might do to a result, but neither opposes highlighting; "publicizing" is a near-synonym of highlighting.',
    difficulty: 4,
    tags: ['contrast'],
  },
  {
    text: 'The regime tolerated dissent only in {{1}} forms, permitting satire in the theaters while imprisoning those who criticized it in plainer language.',
    blanks: [{ correct: 'oblique', distractors: ['strident', 'clandestine', 'organized', 'vehement'] }],
    rationale:
      'Satire is tolerated while plain criticism is punished, so the permitted forms are indirect. "Strident" and "vehement" describe forcefulness, the opposite of what was tolerated; "clandestine" means secret, but theater satire is public.',
    difficulty: 4,
    tags: ['example-as-clue'],
  },
  {
    text: "The council's decision was less an act of policy than of {{1}}: faced with two irreconcilable factions, it chose the option that would offend neither.",
    blanks: [{ correct: 'expediency', distractors: ['principle', 'contrition', 'foresight', 'obstinacy'] }],
    rationale:
      'The colon explains: avoiding offense to either faction is practical convenience, not conviction. "Principle" is exactly what "less an act of policy than" denies; "foresight" would imply planning for the future rather than dodging a present conflict.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'What began as a {{1}} objection to one clause grew, over months of debate, into a wholesale rejection of the entire framework.',
    blanks: [{ correct: 'circumscribed', distractors: ['vehement', 'inchoate', 'sweeping', 'perennial'] }],
    rationale:
      'The contrast runs from a small beginning to a "wholesale" end, so the blank means limited in scope. "Vehement" describes intensity rather than scope — a forceful objection can still be narrow — and "sweeping" is the endpoint, not the origin.',
    difficulty: 4,
    tags: ['contrast', 'scope'],
  },
  {
    text: 'The findings were {{1}} enough that the journal required a second laboratory to replicate them before publication.',
    blanks: [{ correct: 'startling', distractors: ['tentative', 'derivative', 'preliminary', 'exhaustive'] }],
    rationale:
      'Demanding independent replication signals a result surprising enough to invite doubt. "Tentative" describes the researchers’ confidence rather than the result’s character, and journals do not demand replication merely because a claim is cautious.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'Critics accuse her of {{1}}, but the charge is hard to sustain against a scholar who has publicly revised three of her central claims.',
    blanks: [{ correct: 'dogmatism', distractors: ['pedantry', 'plagiarism', 'obscurantism', 'indolence'] }],
    rationale:
      'Publicly revising one’s own claims refutes a charge of refusing to reconsider. "Pedantry" means excessive attention to detail, which revision does not answer; "plagiarism" would not be rebutted by revising claims either.',
    difficulty: 4,
    tags: ['refutation'],
  },
  {
    text: "The city's growth was not {{1}} but the product of decades of deliberate planning, much of it invisible to residents who experienced only the result.",
    blanks: [{ correct: 'fortuitous', distractors: ['gradual', 'unwelcome', 'sustainable', 'documented'] }],
    rationale:
      '"Not X but the product of deliberate planning" makes the blank mean accidental. "Gradual" is compatible with planning — decades of planning is itself gradual — so it fails to oppose.',
    difficulty: 3,
    tags: ['negation'],
  },
  {
    text: 'The evidence for the hypothesis is {{1}}: a single fragmentary inscription, whose reading is itself disputed.',
    blanks: [{ correct: 'exiguous', distractors: ['overwhelming', 'contradictory', 'circumstantial', 'unpublished'] }],
    rationale:
      'One disputed fragment is a very small quantity of evidence. "Exiguous" means scanty. "Contradictory" would require competing evidence, and "circumstantial" concerns the kind of evidence rather than how little there is.',
    difficulty: 5,
    tags: ['colon-restatement'],
  },
  {
    text: 'Far from being {{1}}, the reforms were resisted at every level of the administration and abandoned within two years.',
    blanks: [{ correct: 'efficacious', distractors: ['contentious', 'ambitious', 'expensive', 'gradual'] }],
    rationale:
      '"Far from being" negates the blank, and resistance followed by abandonment establishes failure. The blank must therefore mean successful. "Contentious" is not negated by the outcome — the reforms plainly were contentious.',
    difficulty: 4,
    tags: ['negation', 'outcome'],
  },
  {
    text: 'He has a {{1}} for understatement, describing a catastrophic loss as an inconvenience and a triumph as a pleasant surprise.',
    blanks: [{ correct: 'penchant', distractors: ['contempt', 'reputation', 'capacity', 'talent'] }],
    rationale:
      'The examples show a habitual leaning toward understatement. "Penchant" names an inclination. "Contempt" reverses the attitude, and while "talent" is tempting, the examples describe a consistent tendency rather than a skill.',
    difficulty: 3,
    tags: ['example-as-clue'],
  },
  {
    text: 'The argument is {{1}}, resting on a premise that the author states twice but never defends.',
    blanks: [{ correct: 'unsubstantiated', distractors: ['irrefutable', 'convoluted', 'derivative', 'concise'] }],
    rationale:
      'A premise stated but never defended leaves the argument unsupported. "Irrefutable" is the opposite; "convoluted" concerns complexity rather than support, and an argument can be simple and still unproven.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'Her reputation for {{1}} was such that opposing counsel routinely accepted her account of the facts without checking it.',
    blanks: [{ correct: 'probity', distractors: ['acumen', 'temerity', 'loquacity', 'diffidence'] }],
    rationale:
      'Opponents accepting her account unchecked implies trusted integrity. "Probity" means uprightness. "Acumen" means shrewdness, which would make opponents more careful rather than less.',
    difficulty: 5,
    tags: ['result-clause'],
  },
  {
    text: 'The novel was published to {{1}} reviews, and its author, who had expected hostility, found herself famous within a month.',
    blanks: [{ correct: 'rapturous', distractors: ['tepid', 'mixed', 'belated', 'scathing'] }],
    rationale:
      'Unexpected fame within a month indicates enthusiastic reception. "Tepid" and "mixed" would not produce sudden fame, and "scathing" restates the hostility she expected but did not receive.',
    difficulty: 3,
    tags: ['cause-effect'],
  },
  {
    text: 'The two theories are not competitors but {{1}}, each describing a different aspect of the same underlying process.',
    blanks: [{ correct: 'complementary', distractors: ['redundant', 'antithetical', 'provisional', 'indistinguishable'] }],
    rationale:
      '"Not competitors but", plus each describing a different aspect of one process, means they fit together. "Redundant" would mean they duplicate each other, whereas the sentence says they cover different aspects; "antithetical" restates competition.',
    difficulty: 4,
    tags: ['negation', 'relationship'],
  },
  {
    text: 'Rather than resolving the ambiguity, the appellate ruling {{1}} it, offering two rationales that point in different directions.',
    blanks: [{ correct: 'compounded', distractors: ['dispelled', 'acknowledged', 'circumvented', 'codified'] }],
    rationale:
      '"Rather than resolving" plus two conflicting rationales means the ruling made the ambiguity worse. "Dispelled" is what the ruling failed to do; "acknowledged" is too weak, since offering contradictory rationales does more than note the problem.',
    difficulty: 5,
    tags: ['contrast', 'legal'],
  },
  {
    text: 'Reviewers praised the study for its {{1}}, noting that it had followed the same cohort for forty-one years without a single lapse in record-keeping.',
    blanks: [{ correct: 'rigor', distractors: ['brevity', 'audacity', 'accessibility', 'novelty'] }],
    rationale:
      'Forty-one years without a lapse in record-keeping is methodological thoroughness. "Audacity" would describe boldness of hypothesis rather than care of execution; "novelty" concerns originality, which the detail does not address.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The tone of the memoir is {{1}}, neither excusing the author’s failures nor dwelling on them with any apparent satisfaction.',
    blanks: [{ correct: 'dispassionate', distractors: ['rancorous', 'penitent', 'nostalgic', 'defensive'] }],
    rationale:
      'Neither excusing nor relishing failure describes emotional evenness. "Penitent" would mean dwelling on the failures remorsefully, which the sentence rules out along with excusing them.',
    difficulty: 4,
    tags: ['double-negation', 'tone'],
  },
  {
    text: 'His influence on the field has been {{1}}: nearly every major study of the past twenty years cites him, usually in its opening paragraph.',
    blanks: [{ correct: 'pervasive', distractors: ['negligible', 'contested', 'belated', 'inadvertent'] }],
    rationale:
      'Citation by nearly every major study, usually up front, indicates influence spread everywhere. "Contested" concerns whether the influence is welcomed rather than how far it extends.',
    difficulty: 3,
    tags: ['colon-restatement'],
  },
  {
    text: 'The proposal was {{1}} from the outset, requiring unanimous approval from bodies that had not agreed on anything in a decade.',
    blanks: [{ correct: 'quixotic', distractors: ['prudent', 'lucrative', 'contentious', 'inevitable'] }],
    rationale:
      'Requiring unanimity from bodies that never agree makes success unrealistically hopeless. "Contentious" describes dispute without implying futility, and is the trap for readers who stop at "had not agreed".',
    difficulty: 5,
    tags: ['inference'],
  },
  {
    text: 'Where earlier scholars saw a unified tradition, recent work has emphasized its {{1}}, tracing at least four distinct strands with different origins.',
    blanks: [{ correct: 'heterogeneity', distractors: ['antiquity', 'coherence', 'durability', 'obscurity'] }],
    rationale:
      'Four distinct strands set against a "unified tradition" means diversity. "Coherence" restates the older view the sentence contrasts with; "antiquity" and "durability" concern age rather than internal variety.',
    difficulty: 5,
    tags: ['contrast', 'academic'],
  },
];

/* ── Two blanks ───────────────────────────────────────────────────────── */

export const TC_2_BLANK: TCFrame[] = [
  {
    text: 'Far from being {{1}}, the new regulations were so {{2}} that firms found themselves able to continue nearly every practice the legislation had ostensibly been written to curb.',
    blanks: [
      { correct: 'stringent', distractors: ['ambiguous', 'novel'] },
      { correct: 'lax', distractors: ['arcane', 'sweeping'] },
    ],
    rationale:
      '"Far from being" flips blank 1 against blank 2, and the result — firms continuing their practices — fixes blank 2 as permissive. So blank 2 is "lax" and blank 1 is its opposite. "Sweeping" would make the rules broad, contradicting the outcome.',
    difficulty: 4,
    tags: ['contrast', 'result'],
  },
  {
    text: 'The theory retains a certain {{1}} among specialists precisely because it has never been tested: no experiment has yet been devised that could {{2}} it.',
    blanks: [
      { correct: 'allure', distractors: ['notoriety', 'rigor'] },
      { correct: 'falsify', distractors: ['corroborate', 'articulate'] },
    ],
    rationale:
      '"Precisely because it has never been tested" explains the appeal, so blank 1 is positive. The colon restates the same fact, so blank 2 must mean to test in a way that could disprove. "Corroborate" reverses the logic: a theory that cannot be confirmed is not thereby attractive.',
    difficulty: 5,
    tags: ['colon-restatement'],
  },
  {
    text: 'The editor valued concision, and so found the manuscript’s {{1}} passages, which circled the same point for pages, particularly {{2}}.',
    blanks: [
      { correct: 'prolix', distractors: ['trenchant', 'lyrical'] },
      { correct: 'trying', distractors: ['illuminating', 'negligible'] },
    ],
    rationale:
      '"Circled the same point for pages" defines blank 1 as wordy. Since the editor values concision, wordiness is irritating, so blank 2 is "trying". "Illuminating" would reverse the editor’s stated preference.',
    difficulty: 3,
    tags: ['cause-effect'],
  },
  {
    text: 'Although his early work was praised for its {{1}}, the later novels sprawl across hundreds of pages without evident design, as though the author had lost interest in {{2}} altogether.',
    blanks: [
      { correct: 'architecture', distractors: ['erudition', 'sentiment'] },
      { correct: 'form', distractors: ['publication', 'ambiguity'] },
    ],
    rationale:
      '"Although" contrasts early praise with later sprawl "without evident design", so blank 1 names structural quality. Blank 2 is what the sprawling books abandon — the same thing under another name. "Erudition" concerns learning, which sprawl does not contradict.',
    difficulty: 5,
    tags: ['contrast'],
  },
  {
    text: 'At first the new analyst worked {{1}} with colleagues and collaborated on several projects without incident; he later gained a reputation for his {{2}} temper, after provoking a series of abrupt quarrels over trivial matters.',
    blanks: [
      { correct: 'amicably', distractors: ['impetuously', 'habitually'] },
      { correct: 'mercurial', distractors: ['lucid', 'disillusioned'] },
    ],
    rationale:
      '"At first … later" marks a reversal, and "without incident" fixes blank 1 as harmonious. Blank 2 must explain abrupt quarrels over trivia, which is volatility. "Habitually" describes frequency rather than manner and leaves the contrast with the later temper unmade.',
    difficulty: 4,
    tags: ['time-shift', 'contrast'],
  },
  {
    text: 'The delegation’s public statements were studiously {{1}}, while its private communications, released years later, proved remarkably {{2}} about the same events.',
    blanks: [
      { correct: 'noncommittal', distractors: ['inflammatory', 'erudite'] },
      { correct: 'frank', distractors: ['evasive', 'terse'] },
    ],
    rationale:
      '"While" opposes public to private, so the two blanks must be opposites. "Studiously" suggests deliberate reticence in public, and the surprise of the release ("remarkably") indicates candor in private. "Evasive" would repeat the public stance rather than contrast with it.',
    difficulty: 4,
    tags: ['contrast', 'parallel-structure'],
  },
  {
    text: 'Because the sources are so {{1}}, historians of the period must often {{2}}, building arguments on inference where direct evidence is simply unavailable.',
    blanks: [
      { correct: 'fragmentary', distractors: ['voluminous', 'partisan'] },
      { correct: 'extrapolate', distractors: ['abstain', 'quantify'] },
    ],
    rationale:
      '"Because" makes blank 1 the cause of blank 2, and the closing clause explains both: arguments built on inference where direct evidence is missing. "Voluminous" would remove the need to infer; "abstain" would mean writing no history at all, which the sentence says they do write.',
    difficulty: 4,
    tags: ['cause-effect'],
  },
  {
    text: 'The composer’s reputation rests on a handful of works whose {{1}} is undisputed; the remaining scores, which are rarely performed, are generally judged {{2}}.',
    blanks: [
      { correct: 'brilliance', distractors: ['brevity', 'provenance'] },
      { correct: 'pedestrian', distractors: ['seminal', 'exacting'] },
    ],
    rationale:
      'The semicolon contrasts the celebrated handful with the neglected remainder, so the blanks are opposed in value. Rarely performed and generally judged low fixes blank 2 as undistinguished. "Seminal" would make the neglected works influential, contradicting their neglect.',
    difficulty: 4,
    tags: ['contrast', 'evaluation'],
  },
  {
    text: 'What the report calls a {{1}} of the data is in fact a {{2}}: whole categories of respondent were excluded without any explanation.',
    blanks: [
      { correct: 'summary', distractors: ['vindication', 'repudiation'] },
      { correct: 'distortion', distractors: ['corroboration', 'digression'] },
    ],
    rationale:
      '"What X calls … is in fact" sets a benign label against a damning reality, and the colon supplies the reality: unexplained exclusions. Blank 1 must be the neutral label the report claims, blank 2 the misrepresentation it actually commits.',
    difficulty: 5,
    tags: ['appearance-vs-reality'],
  },
  {
    text: 'The letters reveal a man far more {{1}} than his public reputation suggested, given to long spells of doubt that he took care to {{2}} from everyone outside his family.',
    blanks: [
      { correct: 'irresolute', distractors: ['gregarious', 'punctilious'] },
      { correct: 'conceal', distractors: ['inherit', 'distinguish'] },
    ],
    rationale:
      '"Long spells of doubt" fixes blank 1 as hesitant, contrary to the public reputation. Blank 2 must explain why that side went unseen, so it means to hide. "Punctilious" concerns attention to detail rather than doubt.',
    difficulty: 4,
    tags: ['appearance-vs-reality'],
  },
  {
    text: 'The species was long thought {{1}}, but a population discovered in 2019 has forced biologists to {{2}} the classification.',
    blanks: [
      { correct: 'extinct', distractors: ['migratory', 'nocturnal'] },
      { correct: 'revise', distractors: ['defend', 'publicize'] },
    ],
    rationale:
      '"But" reverses the long-held belief, and a newly discovered living population is what refutes it. Blank 2 must be what biologists do to a classification disproved by evidence. "Defend" would ignore the discovery the sentence presents as decisive.',
    difficulty: 3,
    tags: ['contrast', 'science'],
  },
  {
    text: 'Her critics mistake {{1}} for indifference: the composure she maintains under attack is the product of long discipline, not of any failure to {{2}}.',
    blanks: [
      { correct: 'equanimity', distractors: ['petulance', 'ostentation'] },
      { correct: 'care', distractors: ['comprehend', 'retaliate'] },
    ],
    rationale:
      'The colon explains the mistake: composure under attack is being misread as not minding. Blank 1 is that composure, blank 2 the caring whose absence critics wrongly infer. "Comprehend" would make the charge about understanding rather than concern.',
    difficulty: 5,
    tags: ['colon-restatement'],
  },
  {
    text: 'The policy was defended as {{1}}, though its effects fell almost entirely on the households least able to {{2}} them.',
    blanks: [
      { correct: 'equitable', distractors: ['temporary', 'popular'] },
      { correct: 'absorb', distractors: ['anticipate', 'welcome'] },
    ],
    rationale:
      '"Though" opposes the defense to the actual effects, and burdens landing on the least able establishes unfairness. Blank 1 is therefore the claim of fairness, blank 2 what those households cannot do with a financial burden. "Anticipate" concerns foresight, not capacity to bear.',
    difficulty: 4,
    tags: ['contrast', 'policy'],
  },
  {
    text: 'Early reviewers found the technique {{1}}, but within a decade it had become so {{2}} that students were taught it as a matter of course.',
    blanks: [
      { correct: 'startling', distractors: ['tedious', 'derivative'] },
      { correct: 'conventional', distractors: ['contested', 'lucrative'] },
    ],
    rationale:
      '"But within a decade" marks the move from novelty to routine, so the blanks are opposed across time. Being taught as a matter of course fixes blank 2 as standard. "Derivative" would mean the technique was never new, which the sentence’s arc contradicts.',
    difficulty: 3,
    tags: ['time-shift'],
  },
  {
    text: 'The account is valuable not because it is {{1}} — the author saw only a fraction of the events he describes — but because it is so precisely {{2}} about what he did see.',
    blanks: [
      { correct: 'comprehensive', distractors: ['contemporaneous', 'flattering'] },
      { correct: 'circumstantial', distractors: ['guarded', 'laudatory'] },
    ],
    rationale:
      '"Not because … but because" splits the two blanks, and the dash supplies the reason blank 1 fails: he saw only a fraction. Blank 2 names the compensating virtue — precision of detail about what he witnessed. "Guarded" would make him withhold that detail.',
    difficulty: 5,
    tags: ['negation', 'concession'],
  },
];

/* ── Three blanks ─────────────────────────────────────────────────────── */

export const TC_3_BLANK: TCFrame[] = [
  {
    text: 'Anyone who has studied the composer knows that he was remarkably {{1}}, producing more than twenty symphonies in a short life. Despite this productivity, he was almost unimaginably {{2}} about even the most {{3}} details of his scores.',
    blanks: [
      { correct: 'prolific', distractors: ['abortive', 'professional'] },
      { correct: 'perfectionistic', distractors: ['dilatory', 'filial'] },
      { correct: 'minute', distractors: ['paramount', 'penultimate'] },
    ],
    rationale:
      'Twenty symphonies in a short life fixes blank 1 as highly productive. "Despite" then sets productivity against exacting care, giving blank 2. Blank 3 must be surprising to fuss over, so it means tiny — "paramount" would mean the details were important, which removes the surprise entirely.',
    difficulty: 5,
    tags: ['concession', 'scale'],
  },
  {
    text: 'The proposal was {{1}} from the start: it assumed a level of cooperation among agencies that had never once been achieved, and its authors were {{2}} enough about institutional history to know it. That they pressed on regardless suggests the exercise was always {{3}}.',
    blanks: [
      { correct: 'doomed', distractors: ['costly', 'novel'] },
      { correct: 'knowledgeable', distractors: ['sanguine', 'reticent'] },
      { correct: 'symbolic', distractors: ['collaborative', 'rigorous'] },
    ],
    rationale:
      'The colon explains blank 1: assuming never-achieved cooperation makes failure certain. Blank 2 must let the authors know this, so it means well informed. Blank 3 explains pressing on anyway — the point was gesture, not outcome. "Sanguine" would mean optimistic, which contradicts knowing the history.',
    difficulty: 5,
    tags: ['colon-restatement', 'inference'],
  },
  {
    text: 'For decades the site was considered {{1}}, its artifacts too scattered to support any single interpretation. Recent excavation has been more {{2}}, and the resulting map of the settlement is detailed enough to have made the older skepticism seem {{3}}.',
    blanks: [
      { correct: 'unreadable', distractors: ['pristine', 'sacred'] },
      { correct: 'systematic', distractors: ['tentative', 'clandestine'] },
      { correct: 'premature', distractors: ['prescient', 'unanimous'] },
    ],
    rationale:
      'Artifacts too scattered for interpretation fixes blank 1. "More" signals improvement, so blank 2 names the better method that produced a detailed map. Blank 3 judges the old skepticism in light of that success: it was hasty. "Prescient" would mean the skeptics were right, contradicting the detailed map.',
    difficulty: 5,
    tags: ['time-shift', 'evaluation'],
  },
  {
    text: 'The author is at her best when {{1}}: the chapters on trade are precise, well documented, and free of the {{2}} that mars her treatment of ideology, where assertion too often stands in for evidence and the tone becomes openly {{3}}.',
    blanks: [
      { correct: 'empirical', distractors: ['polemical', 'autobiographical'] },
      { correct: 'stridency', distractors: ['concision', 'erudition'] },
      { correct: 'partisan', distractors: ['tentative', 'apologetic'] },
    ],
    rationale:
      'Precise and well documented fixes blank 1 as evidence-based. Blank 2 is the fault absent from those chapters but present in the ideology chapters, and the final clause — assertion replacing evidence — supplies it. Blank 3 restates that fault as tone. "Concision" is a virtue, so it cannot be what mars the book.',
    difficulty: 5,
    tags: ['contrast', 'criticism'],
  },
  {
    text: 'Because the drug performed well in small trials, its failure in a larger study was widely treated as {{1}}. Statisticians, however, regard such reversals as entirely {{2}}: early trials are small enough that chance alone can produce apparently strong results, and only replication at scale can {{3}} them.',
    blanks: [
      { correct: 'anomalous', distractors: ['predictable', 'fraudulent'] },
      { correct: 'unremarkable', distractors: ['alarming', 'unprecedented'] },
      { correct: 'validate', distractors: ['expedite', 'obscure'] },
    ],
    rationale:
      '"However" opposes the popular reaction to the statistical one, so blanks 1 and 2 are opposites: surprising versus routine. Blank 3 names what large-scale replication does to an early result, which is confirm it. "Predictable" in blank 1 would collapse the contrast the sentence is built on.',
    difficulty: 5,
    tags: ['contrast', 'science'],
  },
  {
    text: 'His public manner was so {{1}} that interviewers routinely described him as cold. The letters tell a different story: to a small circle he was {{2}}, and his reserve appears to have been less temperamental than {{3}}, a habit acquired in an institution where candor carried real risks.',
    blanks: [
      { correct: 'impassive', distractors: ['effusive', 'erratic'] },
      { correct: 'demonstrative', distractors: ['deferential', 'laconic'] },
      { correct: 'defensive', distractors: ['inherited', 'ostentatious'] },
    ],
    rationale:
      'Being called cold fixes blank 1 as unexpressive. "A different story" makes blank 2 its opposite within the small circle. Blank 3 is contrasted with "temperamental" and explained by the risky institution, so it means protective rather than innate. "Laconic" in blank 2 would repeat the reserve rather than contrast with it.',
    difficulty: 5,
    tags: ['appearance-vs-reality', 'inference'],
  },
];

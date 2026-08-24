/* Sentence Equivalence frames.
 *
 * Every credited pair is drawn from the synonym data in the flashcard
 * vocabulary, so practising these items rehearses the same 995 words the
 * flashcard deck teaches. The sentences are written here; the pairs come
 * from the deck.
 *
 * Two rules govern every frame:
 *   1. The pair must be interchangeable IN THIS SENTENCE — not merely
 *      listed as synonyms — and must leave the sentence meaning the same.
 *   2. No two distractors may themselves be synonyms, or the item would
 *      have a second valid answer. `scripts/check-verbal.ts` enforces this
 *      against the deck's own synonym lists.
 */

import type { SEFrame } from './taxonomy';

export const SE_FRAMES: SEFrame[] = [
  {
    text: 'Rather than allowing the dispute to escalate, the mediator sought to {{1}} both parties with a proposal that gave each side something it wanted.',
    pair: ['mollify', 'assuage'],
    distractors: ['antagonize', 'castigate', 'circumvent', 'enumerate'],
    rationale:
      'A proposal designed to give each side something it wanted is meant to calm them. "Mollify" and "assuage" both mean to soothe or pacify and are interchangeable here. "Antagonize" and "castigate" would inflame the dispute rather than settle it, which "rather than allowing the dispute to escalate" rules out.',
    difficulty: 3,
    tags: ['contrast', 'purpose'],
  },
  {
    text: 'The storm was expected to {{1}} by morning, and by dawn the winds had indeed dropped to almost nothing.',
    pair: ['abate', 'subside'],
    distractors: ['intensify', 'coalesce', 'persist', 'materialize'],
    rationale:
      'Winds dropping to almost nothing confirms the expectation of lessening. "Abate" and "subside" both mean to diminish and are interchangeable. "Intensify" and "persist" contradict the outcome the second clause reports.',
    difficulty: 2,
    tags: ['confirmation', 'natural-phenomenon'],
  },
  {
    text: 'Under pressure from the tribunal, the witness was forced to {{1}} testimony he had given under oath only a week earlier.',
    pair: ['recant', 'abjure'],
    distractors: ['corroborate', 'reiterate', 'embellish', 'transcribe'],
    rationale:
      'Being forced to take back sworn testimony is formal renunciation. "Recant" and "abjure" both mean to renounce a previously stated position and are interchangeable. "Corroborate" and "reiterate" would mean standing by the testimony, the opposite of what pressure produced.',
    difficulty: 4,
    tags: ['legal', 'reversal'],
  },
  {
    text: 'His manner was so {{1}} that colleagues found it difficult to tell whether he disliked them personally or simply preferred to keep his distance from everyone.',
    pair: ['aloof', 'detached'],
    distractors: ['gregarious', 'irascible', 'ebullient', 'candid'],
    rationale:
      'Colleagues unable to read personal dislike into his distance describes emotional remoteness. "Aloof" and "detached" both mean reserved and indifferent, and are interchangeable. "Gregarious" and "ebullient" describe sociability, contradicting the distance the sentence establishes.',
    difficulty: 3,
    tags: ['characterization'],
  },
  {
    text: 'Over the following decade the two rival factions began to {{1}}, until by the end of the period it was no longer meaningful to speak of them as separate movements.',
    pair: ['coalesce', 'amalgamate'],
    distractors: ['bifurcate', 'atrophy', 'stagnate', 'proliferate'],
    rationale:
      'Ceasing to be meaningfully separate is a merger. "Coalesce" and "amalgamate" both mean to unite into one and are interchangeable. "Bifurcate" means to split in two, the exact reverse of the process described.',
    difficulty: 4,
    tags: ['process', 'time-shift'],
  },
  {
    text: 'The committee criticized the report for relying on sources so {{1}} that no independent scholar had ever been able to examine them.',
    pair: ['apocryphal', 'dubious'],
    distractors: ['canonical', 'exhaustive', 'seminal', 'accessible'],
    rationale:
      'Sources no one can examine are of doubtful authenticity. "Apocryphal" and "dubious" both convey questionable authenticity and are interchangeable. "Canonical" means officially recognized, and "accessible" would mean the opposite of unexaminable.',
    difficulty: 4,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The point she raised was entirely {{1}} to the question before the board, and the chair thanked her for keeping the discussion on track.',
    pair: ['germane', 'apposite'],
    distractors: ['tangential', 'extraneous', 'perfunctory', 'contentious'],
    rationale:
      'Being thanked for keeping the discussion on track establishes relevance. "Germane" and "apposite" both mean pertinent and are interchangeable. "Tangential" and "extraneous" both mean off-topic, reversing the praise the chair offers.',
    difficulty: 4,
    tags: ['result-clause'],
  },
  {
    text: 'The vocabulary of the discipline is so {{1}} that even well-read outsiders find its journals nearly impossible to follow.',
    pair: ['arcane', 'esoteric'],
    distractors: ['pellucid', 'colloquial', 'derivative', 'succinct'],
    rationale:
      'Well-read outsiders unable to follow the journals points to knowledge confined to specialists. "Arcane" and "esoteric" both mean understood by only a few and are interchangeable. "Pellucid" means transparently clear, which would make the journals easy to follow.',
    difficulty: 4,
    tags: ['result-clause', 'academic'],
  },
  {
    text: 'Though the equipment had been state of the art when installed, three decades of advances had rendered it entirely {{1}}.',
    pair: ['obsolete', 'archaic'],
    distractors: ['serviceable', 'innovative', 'ubiquitous', 'portable'],
    rationale:
      '"Though" contrasts the original state of the art with the present, and three decades of advances make the equipment outdated. "Obsolete" and "archaic" both mean belonging to an earlier period and are interchangeable. "Serviceable" and "innovative" both contradict that contrast.',
    difficulty: 3,
    tags: ['contrast', 'time-shift'],
  },
  {
    text: 'The climb proved more {{1}} than the guidebook had suggested, and two members of the party turned back before the halfway point.',
    pair: ['arduous', 'onerous'],
    distractors: ['leisurely', 'scenic', 'perilous', 'expedient'],
    rationale:
      'Members turning back early indicates unexpected difficulty. "Arduous" and "onerous" both mean demanding and hard to endure, and are interchangeable. "Perilous" means dangerous, which is a different complaint — a climb can be strenuous without being unsafe.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'What made her lectures memorable was not the novelty of the material but the {{1}} with which she explained it.',
    pair: ['lucidity', 'clarity'],
    distractors: ['obscurity', 'brevity', 'erudition', 'vehemence'],
    rationale:
      'The contrast is between novel content and the quality of her explanation, and the sentence praises the latter. "Lucidity" and "clarity" both name transparent explanation and are interchangeable. "Erudition" means deep learning, which the sentence has already set aside by dismissing novelty of material.',
    difficulty: 3,
    tags: ['contrast', 'praise'],
  },
  {
    text: 'His questions were so {{1}} that experienced negotiators mistook genuine inexperience for a calculated tactic.',
    pair: ['artless', 'ingenuous'],
    distractors: ['duplicitous', 'oblique', 'querulous', 'strident'],
    rationale:
      'Questions mistaken for a tactic precisely because they seemed genuinely inexperienced are guileless. "Artless" and "ingenuous" both mean free of craftiness and are interchangeable. "Duplicitous" and "oblique" would describe the calculated tactic the negotiators wrongly suspected.',
    difficulty: 5,
    tags: ['irony', 'characterization'],
  },
  {
    text: 'She lived an unusually {{1}} life for someone of her means, occupying two rooms and owning almost no furniture.',
    pair: ['austere', 'spartan'],
    distractors: ['opulent', 'gregarious', 'itinerant', 'indolent'],
    rationale:
      'Two rooms and almost no furniture, "for someone of her means", describes deliberate plainness. "Austere" and "spartan" both mean severely simple and are interchangeable. "Opulent" reverses the sentence; "itinerant" means travelling, which fixed rooms contradict.',
    difficulty: 4,
    tags: ['example-as-clue'],
  },
  {
    text: 'The prosecutor accused the defendant of a {{1}} so extreme that he had hoarded wealth he could not conceivably spend.',
    pair: ['avarice', 'cupidity'],
    distractors: ['munificence', 'candor', 'temperance', 'apathy'],
    rationale:
      'Hoarding unspendable wealth is extreme greed. "Avarice" and "cupidity" both name insatiable greed and are interchangeable. "Munificence" means great generosity, the opposite; "temperance" means restraint.',
    difficulty: 4,
    tags: ['example-as-clue'],
  },
  {
    text: 'Reviewers dismissed the screenplay as {{1}}, noting that every twist had been used a dozen times before.',
    pair: ['hackneyed', 'banal'],
    distractors: ['inventive', 'harrowing', 'understated', 'ambitious'],
    rationale:
      'Twists used a dozen times before are unoriginal. "Hackneyed" and "banal" both mean lacking freshness and are interchangeable. "Inventive" contradicts the reviewers\' complaint directly.',
    difficulty: 3,
    tags: ['evidence-as-clue', 'criticism'],
  },
  {
    text: 'Rather than confront the accusation, he attempted to {{1}} it with a joke, and the room moved on before anyone noticed.',
    pair: ['deflect', 'parry'],
    distractors: ['concede', 'substantiate', 'amplify', 'reiterate'],
    rationale:
      '"Rather than confront" plus a joke that lets the room move on describes turning the accusation aside. "Deflect" and "parry" both mean to fend off and are interchangeable. "Concede" would mean accepting the accusation, which "rather than confront" excludes.',
    difficulty: 3,
    tags: ['contrast', 'behavior-as-clue'],
  },
  {
    text: 'The additive proved {{1}} in trials, damaging liver tissue at doses well below those originally proposed.',
    pair: ['deleterious', 'pernicious'],
    distractors: ['salutary', 'inert', 'volatile', 'soluble'],
    rationale:
      'Damaging tissue at low doses is harmful. "Deleterious" and "pernicious" both mean harmful and are interchangeable. "Salutary" means beneficial, the reverse; "inert" would mean it did nothing at all, contradicting the observed damage.',
    difficulty: 4,
    tags: ['evidence-as-clue', 'science'],
  },
  {
    text: 'His speech was less an argument than a {{1}}, twenty minutes of sustained abuse directed at people who were not present to answer.',
    pair: ['diatribe', 'harangue'],
    distractors: ['panegyric', 'soliloquy', 'digression', 'anecdote'],
    rationale:
      'Twenty minutes of sustained abuse is a bitter tirade. "Diatribe" and "harangue" both name exactly that and are interchangeable. "Panegyric" means elaborate praise, the opposite; "soliloquy" concerns speaking alone rather than attacking.',
    difficulty: 4,
    tags: ['definition-restatement'],
  },
  {
    text: 'The two accounts {{1}} sharply on one point: where they had been on the night in question.',
    pair: ['diverge', 'differ'],
    distractors: ['concur', 'elaborate', 'proliferate', 'testify'],
    rationale:
      'A sharp disagreement about a single point is divergence. "Diverge" and "differ" both mean to be unlike and are interchangeable. "Concur" means to agree and is the direct antonym — the trap for a reader who takes "sharply on one point" as emphasis rather than as contrast. The remaining choices name things an account might do without bearing on agreement.',
    difficulty: 3,
    tags: ['colon-restatement'],
  },
  {
    text: 'Far from being a passing enthusiasm, her interest in the subject proved {{1}}, sustained across fifty years and eleven books.',
    pair: ['abiding', 'enduring'],
    distractors: ['ephemeral', 'nascent', 'sporadic', 'notional'],
    rationale:
      '"Far from being a passing enthusiasm", plus fifty years and eleven books, establishes permanence. "Abiding" and "enduring" both mean long-lasting and are interchangeable. "Ephemeral" and "sporadic" both restate the passing enthusiasm the sentence denies.',
    difficulty: 3,
    tags: ['negation', 'evidence-as-clue'],
  },
  {
    text: 'The prose is so {{1}} that a paragraph often has to be read twice before its grammatical structure becomes clear.',
    pair: ['convoluted', 'tortuous'],
    distractors: ['limpid', 'terse', 'mellifluous', 'colloquial'],
    rationale:
      'Needing two readings to find the grammar indicates twisted construction. "Convoluted" and "tortuous" both mean intricately complicated and are interchangeable. "Limpid" and "terse" would both make a paragraph easier, not harder, to parse.',
    difficulty: 4,
    tags: ['result-clause', 'style'],
  },
  {
    text: 'Three independent laboratories were able to {{1}} the original finding, and the result is now considered secure.',
    pair: ['corroborate', 'substantiate'],
    distractors: ['refute', 'undermine', 'publicize', 'complicate'],
    rationale:
      'A result considered secure after independent testing has been confirmed. "Corroborate" and "substantiate" both mean to support with evidence and are interchangeable. "Refute" and "undermine" would leave the finding insecure, contradicting the second clause.',
    difficulty: 3,
    tags: ['cause-effect', 'science'],
  },
  {
    text: 'He was too {{1}} an investor to be taken in by a scheme promising returns that no legitimate market could produce.',
    pair: ['circumspect', 'prudent'],
    distractors: ['credulous', 'impetuous', 'avaricious', 'destitute'],
    rationale:
      'Not being taken in by an implausible promise shows caution. "Circumspect" and "prudent" both mean carefully cautious and are interchangeable. "Credulous" means easily fooled — precisely the quality the sentence denies — and "impetuous" means acting rashly.',
    difficulty: 4,
    tags: ['negation', 'characterization'],
  },
  {
    text: 'Her moods were so {{1}} that staff learned to gauge the temper of a meeting before speaking.',
    pair: ['mercurial', 'capricious'],
    distractors: ['phlegmatic', 'equable', 'taciturn', 'magnanimous'],
    rationale:
      'Staff gauging the temper before speaking implies unpredictable shifts. "Mercurial" and "capricious" both mean erratic and impulsive, and are interchangeable. "Phlegmatic" and "equable" both describe steadiness, which would make such caution unnecessary.',
    difficulty: 4,
    tags: ['result-clause', 'characterization'],
  },
  {
    text: 'The senator delivered a {{1}} against the bill so one-sided that even its opponents winced.',
    pair: ['polemic', 'diatribe'],
    distractors: ['encomium', 'concession', 'précis', 'rebuttal'],
    rationale:
      'A one-sided attack that embarrasses even allies is an aggressive tirade. "Polemic" and "diatribe" both name a bitter attack and are interchangeable. "Encomium" means formal praise; "rebuttal" is a measured reply rather than a one-sided assault.',
    difficulty: 5,
    tags: ['tone', 'political'],
  },
  {
    text: 'Rain had been {{1}} that summer, and the reservoirs were fuller in September than they had been in a decade.',
    pair: ['copious', 'profuse'],
    distractors: ['scant', 'erratic', 'tepid', 'saline'],
    rationale:
      'Reservoirs at a ten-year high indicate abundant rain. "Copious" and "profuse" both mean plentiful and are interchangeable. "Scant" reverses the sentence; "erratic" describes distribution rather than quantity and would not by itself fill reservoirs.',
    difficulty: 3,
    tags: ['cause-effect'],
  },
  {
    text: 'The scheme depended on {{1}}: investors were shown accounts that had been constructed expressly to mislead them.',
    pair: ['duplicity', 'chicanery'],
    distractors: ['probity', 'candor', 'diligence', 'serendipity'],
    rationale:
      'Accounts built expressly to mislead are deliberate deception. "Duplicity" and "chicanery" both mean trickery and are interchangeable. "Probity" and "candor" both mean honesty, the direct opposite of what the colon describes.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'Years of underfunding had {{1}} a department once regarded as the strongest in the faculty.',
    pair: ['enervated', 'attenuated'],
    distractors: ['invigorated', 'consolidated', 'insulated', 'endowed'],
    rationale:
      'Underfunding acting on a formerly strong department weakens it. "Enervated" and "attenuated" both mean weakened or drained and are interchangeable. "Invigorated" and "endowed" would both improve the department, contradicting the effect of underfunding.',
    difficulty: 4,
    tags: ['cause-effect'],
  },
  {
    text: 'The prize honors work that is {{1}} rather than narrowly specialized, and past winners have ranged across half a dozen disciplines.',
    pair: ['eclectic', 'catholic'],
    distractors: ['parochial', 'doctrinaire', 'ephemeral', 'abstruse'],
    rationale:
      '"Rather than narrowly specialized", plus winners spanning six disciplines, establishes breadth. "Eclectic" and "catholic" both mean broad and wide-ranging, and are interchangeable — note that "catholic" here carries its general sense of universal rather than its religious one. "Parochial" means narrow, restating exactly what the sentence denies.',
    difficulty: 5,
    tags: ['contrast', 'secondary-meaning'],
  },
  {
    text: 'The manuscript was riddled with errors that a more {{1}} editor would have caught on a first pass.',
    pair: ['assiduous', 'meticulous'],
    distractors: ['cursory', 'indolent', 'imperious', 'genial'],
    rationale:
      'An editor who would have caught errors immediately is painstaking. "Assiduous" and "meticulous" both mean diligent and careful, and are interchangeable. "Cursory" and "indolent" describe exactly the carelessness that let the errors through.',
    difficulty: 4,
    tags: ['counterfactual'],
  },
  {
    text: 'The critic praised the young novelist for a prose style unusually {{1}} for a first book, free of the flourishes that beginners rarely resist.',
    pair: ['restrained', 'temperate'],
    distractors: ['florid', 'bombastic', 'derivative', 'prolix'],
    rationale:
      'Being free of flourishes beginners rarely resist is deliberate self-limitation. "Restrained" and "temperate" both mean moderate and controlled, and are interchangeable. "Florid" and "bombastic" both name the excess the sentence says is absent.',
    difficulty: 4,
    tags: ['contrast', 'style'],
  },
  {
    text: 'The chairman would not {{1}} any discussion of the matter, cutting off each attempt to raise it.',
    pair: ['brook', 'countenance'],
    distractors: ['initiate', 'prolong', 'chair', 'transcribe'],
    rationale:
      'Cutting off every attempt shows a refusal to permit discussion. "Brook" and "countenance" both mean to tolerate and are interchangeable in this negative construction. "Initiate" and "prolong" would both involve allowing the discussion he suppresses.',
    difficulty: 5,
    tags: ['negation', 'secondary-meaning'],
  },
  {
    text: 'Once the subsidy was announced, applications began to {{1}}, tripling within a single quarter.',
    pair: ['burgeon', 'proliferate'],
    distractors: ['dwindle', 'stabilize', 'lapse', 'consolidate'],
    rationale:
      'Tripling in a quarter is rapid growth. "Burgeon" and "proliferate" both mean to increase rapidly and are interchangeable. "Dwindle" reverses the trend, and "stabilize" would mean no growth at all.',
    difficulty: 3,
    tags: ['cause-effect', 'quantitative-clue'],
  },
  {
    text: 'The report was written to {{1}} a decision that had in fact been taken months earlier for quite different reasons.',
    pair: ['justify', 'vindicate'],
    distractors: ['reverse', 'postpone', 'obscure', 'initiate'],
    rationale:
      'A report written after the fact to support an existing decision is a defense of it. "Justify" and "vindicate" both mean to show to be right and are interchangeable. "Reverse" and "postpone" contradict a decision already taken.',
    difficulty: 3,
    tags: ['purpose'],
  },
  {
    text: 'The lecture hall filled with such {{1}} that the speaker abandoned her microphone and waited.',
    pair: ['din', 'clamor'],
    distractors: ['torpor', 'reverence', 'candor', 'levity'],
    rationale:
      'Noise forcing a speaker to stop is uproar. "Din" and "clamor" both mean loud continuous noise and are interchangeable. "Torpor" means sluggish inactivity and "reverence" respectful silence — both would let the speaker continue.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'Her account of the negotiation was notably {{1}}, admitting mistakes that no one had yet accused her of making.',
    pair: ['candid', 'forthright'],
    distractors: ['evasive', 'guarded', 'laudatory', 'perfunctory'],
    rationale:
      'Volunteering unaccused mistakes is unusual frankness. "Candid" and "forthright" both mean openly honest and are interchangeable. "Evasive" and "guarded" both describe concealment, the opposite of volunteering fault.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The regime punished even {{1}} criticism, jailing citizens who had done no more than question a minor regulation.',
    pair: ['innocuous', 'benign'],
    distractors: ['seditious', 'trenchant', 'scurrilous', 'clandestine'],
    rationale:
      'Questioning a minor regulation is criticism that threatens nothing. "Innocuous" and "benign" both mean harmless and are interchangeable. "Seditious" and "scurrilous" describe serious or abusive attacks, which "no more than" explicitly rules out.',
    difficulty: 4,
    tags: ['example-as-clue', 'political'],
  },
  {
    text: 'Rather than admit the theory had failed, its defenders resorted to {{1}}, adding a new exception each time an experiment went against them.',
    pair: ['casuistry', 'sophistry'],
    distractors: ['candor', 'replication', 'abstention', 'rigor'],
    rationale:
      'Adding an exception whenever evidence conflicts is specious reasoning meant to preserve a position. "Casuistry" and "sophistry" both name plausible but fallacious argument and are interchangeable. "Rigor" and "candor" describe the intellectual honesty the defenders are avoiding.',
    difficulty: 5,
    tags: ['contrast', 'argumentation'],
  },
  {
    text: 'The new director set out to {{1}} a department that eight years of neglect had left barely functional.',
    pair: ['revitalize', 'rejuvenate'],
    distractors: ['dismantle', 'audit', 'relocate', 'enervate'],
    rationale:
      'Acting on a barely functional department, a new director restores it. "Revitalize" and "rejuvenate" both mean to give new life to and are interchangeable. "Dismantle" and "enervate" would continue the decline rather than reverse it.',
    difficulty: 3,
    tags: ['purpose'],
  },
  {
    text: 'Critics found the film\'s sentimentality {{1}}, and several reviews singled out the closing scene as unbearable.',
    pair: ['cloying', 'maudlin'],
    distractors: ['bracing', 'astringent', 'understated', 'oblique'],
    rationale:
      'Sentimentality described as unbearable is excessively sweet. "Cloying" and "maudlin" both mean distastefully sentimental and are interchangeable. "Astringent" and "understated" describe restraint, which the complaint rules out.',
    difficulty: 4,
    tags: ['criticism', 'tone'],
  },
  {
    text: 'His refusal was {{1}}: no argument, however compelling, moved him even slightly over the following three years.',
    pair: ['adamant', 'obdurate'],
    distractors: ['tentative', 'provisional', 'equivocal', 'pliant'],
    rationale:
      'Three years unmoved by any argument is absolute inflexibility. "Adamant" and "obdurate" both mean unyielding and are interchangeable. "Tentative", "provisional", and "pliant" all suggest a position open to change.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'The two departments had operated in such {{1}} that neither knew the other had commissioned the same study.',
    pair: ['isolation', 'insularity'],
    distractors: ['concert', 'proximity', 'rivalry', 'transparency'],
    rationale:
      'Neither knowing what the other commissioned indicates complete separation. "Isolation" and "insularity" both mean being cut off and are interchangeable. "Concert" means acting together, the opposite; "rivalry" implies awareness of each other, which the sentence denies.',
    difficulty: 4,
    tags: ['result-clause'],
  },
  {
    text: 'Her early poems are {{1}} of the later work, containing in miniature nearly every theme she would spend her career developing.',
    pair: ['presage', 'foreshadow'],
    distractors: ['parody', 'repudiate', 'eclipse', 'transcribe'],
    rationale:
      'Containing in miniature what the career would develop is anticipation. "Presage" and "foreshadow" both mean to indicate in advance and are interchangeable. "Repudiate" would mean rejecting the later themes rather than announcing them.',
    difficulty: 4,
    tags: ['definition-restatement'],
  },
  {
    text: 'The witness gave her evidence with such {{1}} that the defense abandoned its plan to challenge her recollection.',
    pair: ['assurance', 'confidence'],
    distractors: ['diffidence', 'reluctance', 'levity', 'acrimony'],
    rationale:
      'The defense abandoning a challenge indicates the witness seemed certain. "Assurance" and "confidence" both mean self-possessed certainty and are interchangeable. "Diffidence" means shyness and self-doubt, which would have invited the challenge rather than deterred it.',
    difficulty: 3,
    tags: ['result-clause'],
  },
  {
    text: 'The measure was intended to {{1}} the hardship caused by the closures, though it fell far short of eliminating it.',
    pair: ['mitigate', 'palliate'],
    distractors: ['exacerbate', 'exemplify', 'document', 'precipitate'],
    rationale:
      'Reducing hardship without eliminating it is partial relief. "Mitigate" and "palliate" both mean to lessen the severity of and are interchangeable — "palliate" carries precisely the sense of easing without curing. "Exacerbate" means to worsen, the opposite.',
    difficulty: 4,
    tags: ['concession', 'purpose'],
  },
  {
    text: 'For all his {{1}} in public, in private he was known to be warm and even talkative.',
    pair: ['reticence', 'taciturnity'],
    distractors: ['garrulousness', 'volubility', 'affability', 'pomposity'],
    rationale:
      '"For all … in public" contrasts with private warmth and talkativeness, so the public manner is silent. "Reticence" and "taciturnity" both mean disinclination to speak and are interchangeable. "Garrulousness" and "volubility" both mean talkativeness, which the contrast assigns to his private self.',
    difficulty: 4,
    tags: ['contrast', 'characterization'],
  },
  {
    text: 'The proposal was rejected less on its merits than because of the {{1}} of the person who introduced it.',
    pair: ['unpopularity', 'disfavor'],
    distractors: ['ingenuity', 'seniority', 'anonymity', 'erudition'],
    rationale:
      'A proposal rejected because of who introduced it suffers from that person standing badly with the decision-makers. "Unpopularity" and "disfavor" both mean being held in low regard and are interchangeable. "Ingenuity" and "erudition" are merits that would help rather than sink the proposal.',
    difficulty: 3,
    tags: ['causation'],
  },
  {
    text: 'Having spent a decade among specialists, she had grown impatient with explanations pitched at the {{1}} reader.',
    pair: ['lay', 'uninitiated'],
    distractors: ['erudite', 'seasoned', 'skeptical', 'attentive'],
    rationale:
      'A specialist impatient with simplified explanations is impatient with material aimed at non-specialists. "Lay" and "uninitiated" both mean lacking specialist knowledge and are interchangeable. "Erudite" and "seasoned" describe the expert audience she belongs to.',
    difficulty: 4,
    tags: ['inference'],
  },
  {
    text: 'The government\'s response was widely condemned as {{1}}, arriving three weeks after the flood had already receded.',
    pair: ['belated', 'tardy'],
    distractors: ['precipitate', 'preemptive', 'lavish', 'measured'],
    rationale:
      'Arriving three weeks after the emergency ended is lateness. "Belated" and "tardy" both mean coming too late and are interchangeable. "Precipitate" and "preemptive" both mean arriving too early or in advance, the opposite failing.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'He treated the rule as {{1}}, observing it only when someone senior happened to be watching.',
    pair: ['optional', 'discretionary'],
    distractors: ['mandatory', 'binding', 'obsolete', 'punitive'],
    rationale:
      'Observing a rule only under supervision treats compliance as a matter of choice. "Optional" and "discretionary" both mean left to one\'s own judgment and are interchangeable. "Mandatory" and "binding" would require observance whether or not anyone was watching.',
    difficulty: 3,
    tags: ['behavior-as-clue'],
  },
  {
    text: 'The biography is {{1}} to the point of distortion, omitting every episode that might reflect badly on its subject.',
    pair: ['partial', 'partisan'],
    distractors: ['exhaustive', 'dispassionate', 'posthumous', 'derivative'],
    rationale:
      'Omitting everything unflattering is one-sidedness. "Partial" and "partisan" both mean biased toward one side and are interchangeable — note that "partial" here means biased, not incomplete. "Dispassionate" means impartial, the opposite.',
    difficulty: 5,
    tags: ['secondary-meaning', 'criticism'],
  },
  {
    text: 'The scheme collapsed the moment its central assumption was tested, revealing how {{1}} the whole structure had always been.',
    pair: ['precarious', 'tenuous'],
    distractors: ['robust', 'entrenched', 'lucrative', 'byzantine'],
    rationale:
      'Collapsing at the first test shows fragility. "Precarious" and "tenuous" both mean insecurely founded and are interchangeable. "Robust" and "entrenched" both imply durability, which the collapse disproves.',
    difficulty: 4,
    tags: ['cause-effect'],
  },
  {
    text: 'Rather than {{1}} the criticism, the author printed it in full at the front of the second edition.',
    pair: ['suppress', 'stifle'],
    distractors: ['publicize', 'solicit', 'annotate', 'endorse'],
    rationale:
      '"Rather than" opposes the blank to printing the criticism in full, so the blank means to keep it from being seen. "Suppress" and "stifle" both mean to prevent from being expressed and are interchangeable. "Publicize" is what the author actually did.',
    difficulty: 3,
    tags: ['contrast'],
  },
  {
    text: 'Their initial hostility gradually gave way to a {{1}} that surprised everyone who had witnessed the first meeting.',
    pair: ['rapport', 'amity'],
    distractors: ['enmity', 'rancor', 'indifference', 'formality'],
    rationale:
      'Hostility giving way to something surprising indicates warmth. "Rapport" and "amity" both mean friendly understanding and are interchangeable. "Enmity" and "rancor" restate the hostility that was left behind rather than what replaced it.',
    difficulty: 3,
    tags: ['contrast', 'time-shift'],
  },
  {
    text: 'The essay is {{1}} in its judgments, condemning in one paragraph what it had praised two pages earlier.',
    pair: ['inconsistent', 'erratic'],
    distractors: ['systematic', 'exhaustive', 'laconic', 'deferential'],
    rationale:
      'Condemning what it earlier praised is self-contradiction. "Inconsistent" and "erratic" both mean lacking steady coherence and are interchangeable. "Systematic" describes the orderliness the essay conspicuously lacks.',
    difficulty: 3,
    tags: ['example-as-clue'],
  },
  {
    text: 'He was {{1}} in his loyalty, standing by the party through two scandals that cost it half its membership.',
    pair: ['steadfast', 'unwavering'],
    distractors: ['fickle', 'mercenary', 'nominal', 'grudging'],
    rationale:
      'Standing by through scandals that drove others out is constancy. "Steadfast" and "unwavering" both mean firmly resolute and are interchangeable. "Fickle" means changeable — the behavior of the departing half — and "nominal" would mean loyalty in name only.',
    difficulty: 3,
    tags: ['evidence-as-clue'],
  },
  {
    text: 'The findings {{1}} decades of received opinion, and the field has not yet absorbed their implications.',
    pair: ['overturn', 'upend'],
    distractors: ['confirm', 'restate', 'postpone', 'summarize'],
    rationale:
      'A field unable to absorb the implications has had its received opinion reversed. "Overturn" and "upend" both mean to reverse completely and are interchangeable. "Confirm" and "restate" would leave received opinion intact, requiring no absorption at all.',
    difficulty: 4,
    tags: ['cause-effect'],
  },
  {
    text: 'His generosity was entirely {{1}}: he gave anonymously and refused every invitation to be thanked.',
    pair: ['unostentatious', 'unassuming'],
    distractors: ['flamboyant', 'calculated', 'sporadic', 'reluctant'],
    rationale:
      'Giving anonymously and refusing thanks is generosity without display. "Unostentatious" and "unassuming" both mean modest and undemonstrative, and are interchangeable. "Flamboyant" means showy, the opposite of anonymous giving.',
    difficulty: 4,
    tags: ['colon-restatement'],
  },
  {
    text: 'The translation is admired for its {{1}}, reproducing not merely the sense of the original but its rhythm and register as well.',
    pair: ['fidelity', 'faithfulness'],
    distractors: ['liberty', 'concision', 'obscurity', 'novelty'],
    rationale:
      'Reproducing sense, rhythm, and register is close adherence to the original. "Fidelity" and "faithfulness" both mean exact correspondence and are interchangeable. "Liberty" means departing from the original, the opposite virtue.',
    difficulty: 4,
    tags: ['definition-restatement'],
  },
  {
    text: 'Every attempt to pin down the term produced a new definition, and the concept remains stubbornly {{1}}.',
    pair: ['nebulous', 'amorphous'],
    distractors: ['delineated', 'quantifiable', 'canonical', 'antiquated'],
    rationale:
      'A term that yields a new definition on every attempt has no fixed shape. "Nebulous" and "amorphous" both mean lacking definite form and are interchangeable. "Delineated" and "quantifiable" both imply the precision the sentence says is unattainable.',
    difficulty: 4,
    tags: ['result-clause'],
  },
];

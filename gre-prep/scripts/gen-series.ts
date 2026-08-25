/* Regenerates src/lib/series-data.ts — the flashcard deck cut into short,
 * themed series.
 *
 * The deck is ~1000 words in one alphabetical run, which is unusable as a
 * study unit: there is no point at which you have finished anything. Here it
 * is grouped by meaning (words about praise, about deceit, about caution…)
 * and then cut into series of 20, so a session is a fixed, repeatable set.
 *
 * A word lands in the theme whose keywords its definition and synonyms match
 * best; ties go to the earlier theme, so the output is deterministic. Words
 * matching nothing fall into the "Mélange" pool, as do the leftovers of any
 * theme too small to fill a series on its own.
 *
 *   npx tsx scripts/gen-series.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';

interface DeckWord {
  id: number;
  word: string;
  definition: string;
  synonyms?: string[];
}

/** Words per series — one sitting. */
const SERIES_SIZE = 20;

/** A theme with fewer words than this cannot fill a session of its own; its
 *  words go to the mixed pool instead of leaving a 3-word "series" behind. */
const MIN_SERIES = 10;

interface Theme {
  id: string;
  label: string;
  /** Matched as whole-word prefixes: "praise" also catches "praises",
   *  "praised", "praiseworthy". */
  keywords: string[];
}

const THEMES: Theme[] = [
  {
    id: 'praise', label: 'Éloge & admiration',
    keywords: ['praise', 'laud', 'extol', 'commend', 'admir', 'acclaim', 'flatter', 'adulation', 'eulog', 'applaud', 'compliment', 'revere', 'venerat', 'esteem', 'homage', 'tribute', 'exalt', 'accolade'],
  },
  {
    id: 'criticism', label: 'Critique & blâme',
    keywords: ['criticiz', 'criticism', 'critical', 'censure', 'rebuke', 'reprimand', 'scold', 'condemn', 'disparag', 'denounc', 'deride', 'mock', 'ridicul', 'belittl', 'berate', 'chastis', 'reproach', 'reprov', 'blame', 'slander', 'defam', 'vilif', 'castigat', 'harangu', 'taunt', 'jeer', 'scorn', 'contempt', 'diatribe'],
  },
  {
    id: 'speech', label: 'Parole & discours',
    keywords: ['speech', 'speak', 'spoken', 'talk', 'talkative', 'verbose', 'wordy', 'concise', 'terse', 'eloquen', 'articulat', 'utter', 'loquacious', 'garrulous', 'taciturn', 'reticent', 'discourse', 'orator', 'rhetoric', 'banter', 'chatter', 'tirade', 'monologue', '語', 'phrase', 'language', 'conversation', 'dialogue', 'silence', 'silent', 'mute'],
  },
  {
    id: 'deceit', label: 'Tromperie & ruse',
    keywords: ['deceiv', 'deceit', 'deception', 'deceptive', 'trick', 'fraud', 'cunning', 'crafty', 'sly', 'guile', 'hoax', 'dupe', 'mislead', 'feign', 'pretense', 'pretend', 'sham', 'hypocri', 'duplicit', 'insincere', 'charlatan', 'swindl', 'counterfeit', 'forger'],
  },
  {
    id: 'honesty', label: 'Franchise & sincérité',
    keywords: ['honest', 'sincere', 'sincerit', 'candid', 'candor', 'frank', 'forthright', 'truth', 'integrity', 'genuine', 'straightforward', 'blunt', 'outspoken', 'earnest'],
  },
  {
    id: 'anger', label: 'Colère & hostilité',
    keywords: ['anger', 'angry', 'irate', 'wrath', 'rage', 'furious', 'fury', 'hostil', 'resent', 'indignat', 'irritat', 'enrag', 'provok', 'belligeren', 'antagoni', 'spite', 'malice', 'malicious', 'vindictive', 'animosity', 'rancor', 'acrimon', 'vitriol', 'bitter', 'hate', 'hatred', 'loath', 'detest', 'disgust', 'aversion', 'repugnan', 'abhor', 'contempt'],
  },
  {
    id: 'calm', label: 'Calme & apaisement',
    keywords: ['calm', 'sooth', 'placat', 'appeas', 'pacif', 'serene', 'serenit', 'tranquil', 'mollif', 'assuag', 'alleviat', 'peaceful', 'composure', 'sedate', 'relax', 'quell', 'lull', 'respite', 'gentle', 'mild', 'temperate', 'moderate', 'comfort', 'console'],
  },
  {
    id: 'pride', label: 'Orgueil & arrogance',
    keywords: ['arrogan', 'pride', 'proud', 'haught', 'conceit', 'boast', 'pompous', 'vanity', 'egoti', 'condescend', 'disdain', 'supercilious', 'imperious', 'presumptuous', 'smug', 'ostentatious', 'pretentious', 'bombast', 'swagger'],
  },
  {
    id: 'humility', label: 'Humilité & soumission',
    keywords: ['humble', 'humilit', 'humiliat', 'modest', 'meek', 'submissive', 'submit', 'obedien', 'deferen', 'servile', 'obsequious', 'docile', 'complian', 'subservient', 'yield', 'grovel', 'sycophant'],
  },
  {
    id: 'abundance', label: 'Abondance & excès',
    keywords: ['abundan', 'plentiful', 'profuse', 'copious', 'excess', 'surplus', 'lavish', 'prodigal', 'superfluous', 'ample', 'teem', 'replete', 'opulen', 'extravagan', 'overflow', 'myriad', 'glut', 'saturat', 'bountiful', 'immoderate', 'unrestrained'],
  },
  {
    id: 'scarcity', label: 'Rareté & manque',
    keywords: ['scarce', 'scarcit', 'scant', 'meager', 'sparse', 'dearth', 'paucity', 'deficien', 'lacking', 'frugal', 'austere', 'deplet', 'parsimon', 'miserly', 'stingy', 'insufficient', 'sparing', 'thrift', 'barren'],
  },
  {
    id: 'change', label: 'Changement & transformation',
    keywords: ['change', 'transform', 'alter', 'modif', 'convert', 'mutable', 'metamorph', 'vary', 'fluctuat', 'evolv', 'revert', 'adapt', 'reform', 'shift', 'transition', 'inconstant', 'volatile', 'fickle'],
  },
  {
    id: 'persistence', label: 'Ténacité & obstination',
    keywords: ['stubborn', 'obstinat', 'persist', 'tenacious', 'steadfast', 'resolute', 'unwavering', 'persever', 'intransigen', 'adamant', 'dogged', 'relentless', 'inflexible', 'recalcitran', 'intractable', 'staunch', 'obdurate', 'unyielding', 'diligen'],
  },
  {
    id: 'caution', label: 'Prudence & précaution',
    keywords: ['cautious', 'caution', 'wary', 'pruden', 'circumspect', 'vigilan', 'careful', 'discreet', 'discretion', 'heed', 'hesitan', 'timid', 'tentative', 'wariness', 'guarded', 'restraint'],
  },
  {
    id: 'boldness', label: 'Audace & imprudence',
    keywords: ['reckless', 'rash', 'impetuous', 'audaci', 'bold', 'daring', 'brazen', 'foolhardy', 'impulsive', 'temerity', 'intrepid', 'brash', 'headlong', 'fearless', 'courage', 'valor', 'dauntless'],
  },
  {
    id: 'knowledge', label: 'Savoir & intelligence',
    keywords: ['knowledge', 'learned', 'erudit', 'scholar', 'wise', 'wisdom', 'astute', 'shrewd', 'sagaci', 'perceptive', 'insight', 'intelligen', 'discern', 'acumen', 'ignoran', 'foolish', 'folly', 'naive', 'obtuse', 'pedant', 'education', 'clever', 'expert', 'skillful', 'skill', 'adept', 'competen', 'amateur', 'dilettante', 'genius', 'intellect', 'aptitude', 'understanding'],
  },
  {
    id: 'obscurity', label: 'Obscurité & ambiguïté',
    keywords: ['obscur', 'ambigu', 'vague', 'unclear', 'cryptic', 'enigmat', 'abstruse', 'esoteric', 'opaque', 'arcane', 'inscrutable', 'perplex', 'puzzl', 'mysteri', 'equivocal', 'convoluted', 'confus', 'baffl', 'unintelligible', 'hidden meaning'],
  },
  {
    id: 'clarity', label: 'Clarté & évidence',
    keywords: ['clarity', 'clarif', 'obvious', 'evident', 'explicit', 'lucid', 'apparent', 'manifest', 'transparen', 'unambiguous', 'coherent', 'distinct', 'plainly', 'straightforwardly', 'intelligible', 'succinct'],
  },
  {
    id: 'generosity', label: 'Générosité & bienveillance',
    keywords: ['generous', 'generosit', 'benevolen', 'charitab', 'kindness', 'kindly', 'altrui', 'philanthrop', 'compassion', 'magnanim', 'benign', 'munificen', 'gracious', 'mercy', 'merciful', 'clemenc', 'empath', 'patron', 'humane', 'goodwill'],
  },
  {
    id: 'harm', label: 'Nuire & détruire',
    keywords: ['harm', 'destroy', 'destruct', 'damage', 'ruin', 'devastat', 'demolish', 'injur', 'detriment', 'pernicious', 'deleterious', 'noxious', 'malign', 'sabotag', 'undermin', 'eradicat', 'annihilat', 'obliterat', 'raze', 'deadly', 'lethal', 'toxic', 'poison', 'cruel'],
  },
  {
    id: 'money', label: 'Argent & commerce',
    keywords: ['money', 'wealth', 'financ', 'profit', 'trade', 'commerc', 'economic', 'debt', 'payment', 'currenc', 'affluen', 'income', 'bankrupt', 'purchase', 'salary', 'taxe', 'monetary', 'merchant', 'buy', 'sell'],
  },
  {
    id: 'law', label: 'Loi, pouvoir & autorité',
    keywords: ['legal', 'court', 'judicial', 'justice', 'authorit', 'govern', 'ruler', 'sovereign', 'decree', 'edict', 'mandate', 'regime', 'politic', 'tyran', 'autocrat', 'jurisdiction', 'statute', 'verdict', 'punish', 'penalt', 'sentence', 'official', 'bureaucra', 'dominion', 'supremacy'],
  },
  {
    id: 'religion', label: 'Religion & sacré',
    keywords: ['sacred', 'holy', 'divine', 'religio', 'church', 'pious', 'piety', 'heres', 'heretic', 'sacrileg', 'worship', 'ritual', 'prayer', 'clerg', 'spiritual', 'secular', 'profane', 'blasphem', 'dogma', 'doctrine', 'faith', 'priest'],
  },
  {
    id: 'emotion', label: 'Émotions & sentiments',
    keywords: ['sadness', 'sorrow', 'grief', 'mourn', 'melanchol', 'joy', 'happiness', 'delight', 'elation', 'glee', 'fear', 'dread', 'anxious', 'anxiet', 'despair', 'gloom', 'cheerful', 'morose', 'sullen', 'apath', 'longing', 'yearn', 'nostalg', 'lament', 'sorrowful', 'grim', 'passion'],
  },
  {
    id: 'health', label: 'Corps, santé & maladie',
    keywords: ['disease', 'illness', 'sick', 'health', 'medic', 'cure', 'remed', 'heal', 'ailment', 'blood', 'symptom', 'infect', 'fever', 'wound', 'therap', 'epidemic', 'contagious', 'anatom', 'muscle', 'bodily', 'physician', 'nutri'],
  },
  {
    id: 'nature', label: 'Nature & éléments',
    keywords: ['water', 'ocean', 'river', 'rain', 'storm', 'wind', 'weather', 'plant', 'tree', 'flower', 'animal', 'bird', 'soil', 'mountain', 'forest', 'climate', 'seasonal', 'sky', 'fauna', 'flora', 'botan', 'geolog', 'insect', 'marine'],
  },
  {
    id: 'movement', label: 'Mouvement & voyage',
    keywords: ['travel', 'journey', 'wander', 'roam', 'migrat', 'flee', 'depart', 'ascend', 'descend', 'motion', 'drift', 'nomad', 'voyage', 'swift', 'rapid', 'walk', 'stroll', 'flight', 'moving', 'climb', 'scatter', 'disperse', 'spread', 'slope', 'plunge', 'propel', 'retreat', 'advance', 'traverse'],
  },
  {
    id: 'time', label: 'Temps & durée',
    keywords: ['brief', 'temporar', 'transien', 'ephemeral', 'fleeting', 'permanen', 'perpetual', 'eternal', 'lasting', 'duration', 'momentar', 'ancien', 'obsolete', 'archaic', 'outdated', 'prolong', 'era', 'delay', 'postpon', 'timely', 'interim', 'enduring', 'short-lived', 'procrastinat', 'prompt', 'sudden', 'immediate', 'daily', 'chronolog', 'historical', 'precede', 'anticipat', 'future', 'past', 'forecast', 'predict', 'premature'],
  },
  {
    id: 'conflict', label: 'Conflit & guerre',
    keywords: ['war', 'warfare', 'battle', 'fight', 'combat', 'attack', 'conflict', 'militar', 'soldier', 'weapon', 'siege', 'invad', 'invasion', 'rebell', 'insurgen', 'mutin', 'feud', 'quarrel', 'strife', 'skirmish', 'truce', 'warlike', 'aggress'],
  },
  {
    id: 'agreement', label: 'Accord & réconciliation',
    keywords: ['agreement', 'agree', 'accord', 'consensus', 'harmon', 'reconcil', 'compromise', 'concur', 'unite', 'alliance', 'treat', 'cooperat', 'concord', 'amicable', 'compatib', 'ratif', 'consent', 'endorse', 'approv'],
  },
  {
    id: 'opposition', label: 'Désaccord & opposition',
    keywords: ['disagree', 'dissent', 'oppos', 'contradict', 'refut', 'rebut', 'dispute', 'contest', 'controver', 'contentious', 'discord', 'protest', 'reject', 'veto', 'contrary', 'defy', 'defian', 'rival', 'objection'],
  },
  {
    id: 'art', label: 'Art & littérature',
    keywords: ['artistic', 'poet', 'poem', 'music', 'literar', 'literature', 'novel', 'writing', 'painting', 'drama', 'theater', 'prose', 'aesthetic', 'sculpt', 'dance', 'verse', 'author', 'compose', 'stylistic', 'satire', 'fiction'],
  },
  {
    id: 'science', label: 'Science & raisonnement',
    keywords: ['scientific', 'science', 'theor', 'hypothes', 'experiment', 'evidence', 'analys', 'research', 'logic', 'empirical', 'proof', 'mathemat', 'observation', 'deduc', 'inference', 'reasoning', 'premise', 'conclusion', 'technical'],
  },
  {
    id: 'work', label: 'Travail & effort',
    keywords: ['labor', 'industrious', 'effort', 'lazy', 'idle', 'indolen', 'slothful', 'sluggish', 'exert', 'toil', 'assiduous', 'meticulous', 'productive', 'occupation', 'apprentice', 'painstaking', 'strenuous', 'laborious', 'employ'],
  },
  {
    id: 'secrecy', label: 'Cacher & révéler',
    keywords: ['conceal', 'secret', 'covert', 'clandestine', 'furtive', 'surreptitious', 'disclos', 'reveal', 'divulg', 'expose', 'unveil', 'camouflag', 'veil', 'latent', 'stealth', 'hide', 'hidden', 'confidential'],
  },
  {
    id: 'purity', label: 'Pureté & corruption',
    keywords: ['pure', 'purit', 'purif', 'corrupt', 'taint', 'contaminat', 'pollut', 'defile', 'sully', 'cleans', 'unadulterated', 'pristine', 'filth', 'squalid', 'decay', 'rot', 'putrid', 'sordid', 'immoral', 'deprav', 'debauch', 'vice', 'wholesome'],
  },
  {
    id: 'strange', label: 'Étrange & singulier',
    keywords: ['strange', 'unusual', 'bizarre', 'eccentric', 'peculiar', 'anomal', 'aberran', 'quirk', 'whimsical', 'idiosyncra', 'unconventional', 'oddit', 'atypical', 'erratic', 'irregular', 'freakish'],
  },
  {
    id: 'ordinary', label: 'Ordinaire & conformité',
    keywords: ['ordinar', 'commonplace', 'conventional', 'orthodox', 'mundane', 'banal', 'trite', 'hackneyed', 'cliché', 'routine', 'typical', 'conform', 'prosaic', 'insipid', 'bland', 'mediocre', 'pedestrian', 'unoriginal', 'stale'],
  },
  {
    id: 'magnitude', label: 'Taille & intensité',
    keywords: ['huge', 'vast', 'immense', 'enormous', 'tiny', 'minute', 'massive', 'colossal', 'diminutive', 'intens', 'magnitude', 'expand', 'shrink', 'swell', 'dwindl', 'diminish', 'augment', 'amplif', 'enlarge', 'lessen', 'reduce', 'increase', 'weaken', 'strengthen', 'degrade', 'improve', 'ameliorat', 'exacerbat', 'worsen', 'peak', 'summit', 'height', 'depth', 'extent', 'utmost', 'profound', 'slight'],
  },
  {
    id: 'beginnings', label: 'Débuts & fins',
    keywords: ['begin', 'initiat', 'inaugurat', 'origin', 'nascent', 'incipient', 'embryonic', 'terminat', 'cease', 'conclu', 'culminat', 'abolish', 'outset', 'inception', 'demise', 'expire', 'commence', 'final', 'onset'],
  },
  {
    id: 'respect', label: 'Respect & politesse',
    keywords: ['respect', 'polite', 'courteous', 'courtes', 'civil', 'decorum', 'decorous', 'propriety', 'manners', 'etiquette', 'refined', 'tactful', 'genteel', 'dignif', 'affable', 'cordial', 'amiable', 'friendl'],
  },
  {
    id: 'rudeness', label: 'Grossièreté & impolitesse',
    keywords: ['rude', 'impolite', 'crude', 'vulgar', 'boor', 'uncouth', 'coarse', 'brusque', 'curt', 'insolen', 'impuden', 'impertinen', 'discourteous', 'offensive', 'churlish', 'surly', 'abrasive', 'ill-mannered', 'crass'],
  },
  {
    id: 'refusal', label: 'Refus & renoncement',
    keywords: ['refuse', 'refusal', 'renounc', 'repudiat', 'abstain', 'forgo', 'decline', 'abdicat', 'relinquish', 'forsake', 'disavow', 'recant', 'abjure', 'waive', 'withdraw', 'desert', 'abandon', 'shun', 'ostraciz', 'exclu', 'banish', 'exile'],
  },
  {
    id: 'limits', label: 'Limites & contraintes',
    keywords: ['limit', 'restrict', 'confine', 'constrain', 'constrict', 'curb', 'hinder', 'imped', 'obstruct', 'thwart', 'inhibit', 'hamper', 'restrain', 'boundar', 'prohibit', 'forbid', 'censor', 'suppress', 'stifle', 'burden', 'obstacle'],
  },
  {
    id: 'freedom', label: 'Liberté & libération',
    keywords: ['freedom', 'liberat', 'liberty', 'release', 'emancipat', 'autonom', 'independen', 'unrestricted', 'exempt', 'absolv', 'acquit', 'pardon', 'exonerat', 'vindicat', 'unfetter', 'sovereignt'],
  },
  {
    id: 'similarity', label: 'Ressemblance & différence',
    keywords: ['similar', 'alike', 'analog', 'equivalen', 'resembl', 'identical', 'uniform', 'homogene', 'differen', 'disparate', 'discrepanc', 'divergen', 'heterogene', 'contrast', 'comparison', 'comparable', 'parallel', 'counterpart', 'imitat', 'replicat', 'correspond'],
  },
  {
    id: 'judgment', label: 'Jugement & impartialité',
    keywords: ['impartial', 'unbiased', 'biased', 'prejudic', 'objectiv', 'subjectiv', 'judgment', 'evaluat', 'assess', 'appraise', 'arbiter', 'partiality', 'fairness', 'scrutin', 'critique', 'discriminat', 'deem', 'estimate'],
  },
  {
    id: 'certainty', label: 'Certitude & doute',
    keywords: ['certain', 'certaint', 'doubt', 'dubious', 'skeptic', 'uncertain', 'convinc', 'conviction', 'credib', 'plausib', 'incredul', 'suspicio', 'trust', 'confiden', 'assur', 'believab', 'authentic', 'verif', 'undeniable'],
  },
  {
    id: 'essence', label: 'Essence & apparence',
    keywords: ['essence', 'essential', 'intrinsic', 'inherent', 'fundamental', 'superficial', 'appearance', 'facade', 'veneer', 'ostensib', 'nominal', 'seeming', 'guise', 'substance', 'quintessen', 'core', 'underlying', 'outward', 'surface'],
  },
  {
    id: 'teaching', label: 'Enseigner & apprendre',
    keywords: ['teach', 'instruct', 'educat', 'lesson', 'didactic', 'tutor', 'pupil', 'student', 'school', 'curricul', 'pedagog', 'mentor', 'novice', 'apprentice', 'academic', 'university', 'lecture', 'doctrine of instruction'],
  },
  {
    id: 'structure', label: 'Structure & organisation',
    keywords: ['organiz', 'structure', 'arrange', 'systematic', 'hierarch', 'categor', 'classif', 'framework', 'coordinat', 'assembl', 'compil', 'sequence', 'component', 'constituent', 'aggregate', 'array', 'orderly', 'disorder', 'chaos', 'jumble', 'array of'],
  },
  {
    id: 'matter', label: 'Matière & substance',
    keywords: ['liquid', 'solid', 'metal', 'material', 'fabric', 'texture', 'moisture', 'dry', 'wet', 'thick', 'dense', 'porous', 'brittle', 'viscous', 'granular', 'food', 'edible', 'culinary', 'flavor', 'appetite', 'digest', 'nourish'],
  },
];

/* Themes are keyed finely so the keyword lists stay sharp, but a theme that
 * catches only a handful of words cannot carry a series on its own. Groups
 * gather kindred themes into the units the app actually shows, and pairs of
 * opposites (prudence / audace) deliberately share one, since the contrast is
 * itself worth revising. Every theme must appear in exactly one group. */
const GROUPS: { id: string; label: string; themes: string[] }[] = [
  { id: 'praise', label: 'Éloge & admiration', themes: ['praise'] },
  { id: 'criticism', label: 'Critique & blâme', themes: ['criticism'] },
  { id: 'speech', label: 'Parole & discours', themes: ['speech'] },
  { id: 'deceit', label: 'Tromperie & secret', themes: ['deceit', 'secrecy'] },
  { id: 'virtue', label: 'Franchise, respect & générosité', themes: ['honesty', 'respect', 'generosity'] },
  { id: 'anger', label: 'Colère & hostilité', themes: ['anger'] },
  { id: 'calm', label: 'Calme & apaisement', themes: ['calm'] },
  { id: 'pride', label: 'Arrogance & grossièreté', themes: ['pride', 'rudeness'] },
  { id: 'humility', label: 'Humilité & soumission', themes: ['humility'] },
  { id: 'abundance', label: 'Abondance & excès', themes: ['abundance'] },
  { id: 'scarcity', label: 'Rareté & manque', themes: ['scarcity'] },
  { id: 'change', label: 'Changement & transformation', themes: ['change'] },
  { id: 'persistence', label: 'Ténacité & obstination', themes: ['persistence'] },
  { id: 'caution', label: 'Prudence & audace', themes: ['caution', 'boldness'] },
  { id: 'knowledge', label: 'Savoir & intelligence', themes: ['knowledge', 'teaching'] },
  { id: 'obscurity', label: 'Obscurité & ambiguïté', themes: ['obscurity'] },
  { id: 'clarity', label: 'Clarté & évidence', themes: ['clarity'] },
  { id: 'harm', label: 'Nuire, souiller & détruire', themes: ['harm', 'purity'] },
  { id: 'law', label: 'Loi, pouvoir & autorité', themes: ['law'] },
  { id: 'religion', label: 'Religion & sacré', themes: ['religion'] },
  { id: 'emotion', label: 'Émotions & sentiments', themes: ['emotion'] },
  { id: 'nature', label: 'Nature, corps & matière', themes: ['nature', 'health', 'matter'] },
  { id: 'movement', label: 'Mouvement & voyage', themes: ['movement'] },
  { id: 'time', label: 'Temps & durée', themes: ['time'] },
  { id: 'conflict', label: 'Conflit & guerre', themes: ['conflict'] },
  { id: 'agreement', label: 'Accord & réconciliation', themes: ['agreement'] },
  { id: 'opposition', label: 'Désaccord & opposition', themes: ['opposition'] },
  { id: 'science', label: 'Arts & sciences', themes: ['art', 'science'] },
  { id: 'work', label: 'Travail, argent & commerce', themes: ['work', 'money'] },
  { id: 'strange', label: 'Étrange & singulier', themes: ['strange'] },
  { id: 'ordinary', label: 'Ordinaire & conformité', themes: ['ordinary'] },
  { id: 'magnitude', label: 'Taille & intensité', themes: ['magnitude'] },
  { id: 'beginnings', label: 'Débuts & fins', themes: ['beginnings'] },
  { id: 'refusal', label: 'Refus & renoncement', themes: ['refusal'] },
  { id: 'limits', label: 'Contraintes & liberté', themes: ['limits', 'freedom'] },
  { id: 'similarity', label: 'Ressemblance & différence', themes: ['similarity'] },
  { id: 'judgment', label: 'Jugement & impartialité', themes: ['judgment'] },
  { id: 'certainty', label: 'Certitude & doute', themes: ['certainty'] },
  { id: 'essence', label: 'Essence & apparence', themes: ['essence'] },
  { id: 'structure', label: 'Structure & organisation', themes: ['structure'] },
];

const grouped = new Set(GROUPS.flatMap((g) => g.themes));
for (const t of THEMES) {
  if (!grouped.has(t.id)) throw new Error(`theme ${t.id} belongs to no group`);
}

const deck: DeckWord[] = JSON.parse(readFileSync('public/words.json', 'utf8'));

/** Whole-word prefix match, so "praise" hits "praised" but "art" misses
 *  "part". */
const patterns = THEMES.map((t) => ({
  theme: t,
  regexes: t.keywords.map((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')),
}));

function classify(w: DeckWord): string {
  const definition = w.definition.toLowerCase();
  const synonyms = (w.synonyms ?? []).join(' ').toLowerCase();
  let bestId = 'mixed';
  let bestScore = 0;

  for (const { theme, regexes } of patterns) {
    let score = 0;
    for (const re of regexes) {
      // The definition is the primary signal; a synonym match corroborates
      // it but on its own is weaker evidence of what the word is about.
      if (re.test(definition)) score += 2;
      if (re.test(synonyms)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = theme.id;
    }
  }
  return bestId;
}

const byTheme = new Map<string, DeckWord[]>();
for (const theme of THEMES) byTheme.set(theme.id, []);
const mixed: DeckWord[] = [];

for (const w of deck) {
  const id = classify(w);
  if (id === 'mixed') mixed.push(w);
  else byTheme.get(id)!.push(w);
}

interface Series {
  id: string;
  themeId: string;
  themeLabel: string;
  title: string;
  wordIds: number[];
}

const series: Series[] = [];

/** Cuts a theme into as few series as possible, all of even length: 29 words
 *  become 15 + 14 rather than 20 + 9, so no session is a stub and no word is
 *  pushed out of its theme just for being last. */
function split<T>(arr: T[], size: number): T[][] {
  const parts = Math.max(1, Math.ceil(arr.length / size));
  const out: T[][] = [];
  let start = 0;
  for (let i = 0; i < parts; i++) {
    const len = Math.round((arr.length - start) / (parts - i));
    out.push(arr.slice(start, start + len));
    start += len;
  }
  return out;
}

for (const group of GROUPS) {
  const words = group.themes.flatMap((id) => byTheme.get(id)!);
  if (words.length < MIN_SERIES) {
    mixed.push(...words);
    continue;
  }
  const chunks = split(words, SERIES_SIZE);
  chunks.forEach((c, i) => {
    series.push({
      id: `${group.id}-${i + 1}`,
      themeId: group.id,
      themeLabel: group.label,
      title: chunks.length > 1 ? `${group.label} ${i + 1}` : group.label,
      wordIds: c.map((w) => w.id),
    });
  });
}

// Whatever matched no theme, in deck order, cut into series of the same size.
const mixedSorted = [...mixed].sort((a, b) => a.id - b.id);
split(mixedSorted, SERIES_SIZE).forEach((c, i) => {
  series.push({
    id: `mixed-${i + 1}`,
    themeId: 'mixed',
    themeLabel: 'Mélange',
    title: `Mélange ${i + 1}`,
    wordIds: c.map((w) => w.id),
  });
});

// Sanity: every deck word in exactly one series.
const seen = new Set<number>();
for (const s of series) for (const id of s.wordIds) {
  if (seen.has(id)) throw new Error(`word ${id} appears in two series`);
  seen.add(id);
}
if (seen.size !== deck.length) {
  throw new Error(`${deck.length - seen.size} deck words landed in no series`);
}

if (process.env.SERIES_DEBUG) {
  for (const g of GROUPS) {
    const n = g.themes.reduce((sum, id) => sum + byTheme.get(id)!.length, 0);
    console.log(String(n).padStart(3), g.label);
  }
}

const themeIds = Array.from(new Set(series.map((s) => s.themeId)));

writeFileSync(
  'src/lib/series-data.ts',
  `/* Themed flashcard series — generated by scripts/gen-series.ts.
 *
 * Do not edit by hand: rerun the script after changing public/words.json or
 * the theme keywords.
 */

import type { WordSeries } from '@/types';

export const SERIES_SIZE = ${SERIES_SIZE};

export const THEME_LABEL: Record<string, string> = {
${themeIds
  .map((id) => {
    const label = series.find((s) => s.themeId === id)!.themeLabel;
    return `  ${JSON.stringify(id)}: ${JSON.stringify(label)},`;
  })
  .join('\n')}
};

export const SERIES: WordSeries[] = [
${series
  .map(
    (s) =>
      `  { id: ${JSON.stringify(s.id)}, themeId: ${JSON.stringify(s.themeId)}, title: ${JSON.stringify(
        s.title
      )}, wordIds: [${s.wordIds.join(', ')}] },`
  )
  .join('\n')}
];
`
);

const counts = series.map((s) => s.wordIds.length);
console.log(
  `wrote ${series.length} series over ${seen.size} words ` +
    `(min ${Math.min(...counts)}, max ${Math.max(...counts)}), ` +
    `${series.filter((s) => s.themeId === 'mixed').length} mixed`
);

/* Reading Comprehension, batch 1: natural and social science.
 *
 * Passages are argumentative rather than merely informative, because almost
 * every RC question turns on the structure of a claim — what supports it,
 * what it commits the author to, why a given sentence is where it is.
 */

import type { PassageSpec } from './rc-types';

export const PASSAGES_1: PassageSpec[] = [
  {
    title: 'Mycorrhizal networks',
    topic: 'natural science',
    difficulty: 4,
    body: `For most of the twentieth century, forest ecologists treated trees as competitors locked in a contest for light, water, and soil nutrients. The discovery that most forest trees are joined below ground by mycorrhizal fungi — filaments that link root systems across species — complicated that picture considerably. Isotope-tracing experiments have shown that carbon moves through these networks from tree to tree, and that the direction of movement often runs from larger, better-lit individuals toward smaller, shaded ones.

Some researchers have read this transfer as evidence of cooperation, arguing that forests behave as integrated systems in which mature trees subsidize their neighbors. The inference is tempting but premature. The fungi themselves are not passive conduits; they are organisms with interests of their own, and carbon that moves between trees passes through fungal tissue that may retain a substantial share of it. What appears from the trees' vantage as altruism may be better described as fungal commerce, with the network moving resources in whatever direction best serves the fungi.

Distinguishing these accounts is difficult, because both predict the same flows of carbon. The more instructive question may not be whether trees cooperate, but why a framework of pure competition survived so long despite evidence that never fitted it comfortably.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'question an interpretation of a documented phenomenon while noting the difficulty of testing the alternative',
          'establish that forest trees cooperate more often than they compete',
          'describe the experimental techniques by which carbon transfer was first detected',
          'argue that mycorrhizal fungi are the dominant organisms in forest ecosystems',
          'trace the history of competition-based models in twentieth-century ecology',
        ],
        explanation:
          'The passage accepts that carbon moves between trees but challenges the cooperative reading, offers the fungal-commerce alternative, and then concedes that both accounts predict identical flows. That is a challenge to an interpretation plus an acknowledgment of the testing problem. The second choice states the position the author calls "premature"; the fourth overstates a point raised to complicate the cooperative reading, not to crown the fungi.',
        difficulty: 4,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author mentions that carbon "passes through fungal tissue" primarily in order to',
        choices: [
          'suggest that the fungi may be beneficiaries of the transfer rather than mere intermediaries',
          'explain why isotope tracing cannot detect the direction of carbon movement',
          'demonstrate that trees derive no benefit from mycorrhizal association',
          'establish that fungal tissue is chemically similar to root tissue',
          'account for the delay between carbon uptake and its appearance in neighboring trees',
        ],
        explanation:
          'The detail sits inside the argument that the fungi "are not passive conduits" and may "retain a substantial share", so its function is to cast the fungi as interested parties. The passage says isotope tracing did reveal direction, contradicting the second choice; the third is stronger than anything claimed.',
        difficulty: 4,
      },
      {
        category: 'inference',
        format: 'select_all',
        stem: 'The passage suggests which of the following about the competition-based model of forest ecology? Select all that apply.',
        choices: [
          'It remained influential despite evidence that sat awkwardly with it.',
          'It treated trees as rivals for a common pool of resources.',
          'It was formulated specifically to account for below-ground interactions.',
        ],
        correctTexts: [
          'It remained influential despite evidence that sat awkwardly with it.',
          'It treated trees as rivals for a common pool of resources.',
        ],
        explanation:
          'The first restates the closing question about why the framework "survived so long despite evidence that never fitted it comfortably". The second restates the opening description of trees as "competitors locked in a contest". The third is contradicted: below-ground linkage is the discovery that complicated the model, not what it was built to explain.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most strengthen the author\'s alternative account of carbon transfer?',
        choices: [
          'Fungal tissue in linked networks retains a larger share of transferred carbon when the receiving tree is of a species the fungus colonizes poorly',
          'Carbon transfer between trees occurs more rapidly in old-growth forests than in recently planted ones',
          'Trees that receive transferred carbon show measurably higher survival rates during drought',
          'Mycorrhizal fungi can survive for short periods without any host tree',
          'Isotope tracing has been used successfully to track nitrogen as well as carbon',
        ],
        explanation:
          'The author\'s claim is that the network moves resources "in whatever direction best serves the fungi". Retention keyed to what benefits the fungus, rather than to what the receiving tree needs, is exactly the pattern fungal self-interest predicts and tree altruism does not. The third choice supports the cooperative reading the author resists; the others are irrelevant to which account is right.',
        difficulty: 5,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, isotope-tracing experiments established that',
        choices: [
          'carbon often moves from larger, better-lit trees toward smaller, shaded ones',
          'mycorrhizal fungi retain most of the carbon that passes through them',
          'trees of the same species exchange carbon more readily than trees of different species',
          'competition for light is a more powerful force than competition for soil nutrients',
          'carbon transfer occurs only among trees whose roots are in direct contact',
        ],
        explanation:
          'The first paragraph states that tracing showed movement "from larger, better-lit individuals toward smaller, shaded ones". The second choice is raised as a possibility ("may retain"), not an established finding — a standard trap on detail questions, which turn on what the passage actually asserts rather than what it entertains.',
        difficulty: 3,
      },
      {
        category: 'other',
        format: 'select_in_passage',
        stem: 'Select the sentence in the second paragraph in which the author offers an alternative explanation for a pattern that others have attributed to cooperation.',
        sentence:
          "What appears from the trees' vantage as altruism may be better described as fungal commerce, with the network moving resources in whatever direction best serves the fungi.",
        paragraphIndex: 1,
        explanation:
          'This sentence names the competing account directly, reframing apparent altruism as fungal commerce. The surrounding sentences set it up — noting that the fungi have interests and retain carbon — but only this one states the rival explanation.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'The archive and the ledger',
    topic: 'social science',
    difficulty: 4,
    body: `Historians of early modern commerce have long relied on merchant correspondence, a body of material that is abundant, vivid, and profoundly unrepresentative. Letters survive because someone thought them worth keeping, and the merchants whose papers descended intact to modern archives were disproportionately those whose firms endured. Failure, which was the ordinary outcome of commercial life in the period, left far fewer traces.

Recent work has turned instead to account books, which were kept by obligation rather than sentiment and therefore survive in patterns less tied to success. The ledgers are duller than the letters and far harder to read, but they record transactions that correspondence passes over in silence — small extensions of credit, routine defaults, the slow accumulation of obligations among people who never wrote to one another about it.

The resulting picture is not simply a fuller version of the older one. Where the letters describe a world of long-distance ventures and dramatic risk, the ledgers show commerce resting on dense local networks of small, unspectacular credit. Neither source is wrong. But a historiography built on letters alone was bound to mistake the exceptional for the typical, and to write the history of a system from the papers of its winners.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The passage is primarily concerned with',
        choices: [
          'explaining how the choice of source material has shaped conclusions about a historical period',
          'arguing that merchant correspondence should no longer be used by historians',
          'comparing the commercial practices of successful and unsuccessful early modern firms',
          'describing the technical difficulties of reading early modern account books',
          'establishing that long-distance trade was less profitable than local credit',
        ],
        explanation:
          'The passage traces how reliance on letters produced a skewed account and how ledgers yield a different one, closing on the moral about mistaking the exceptional for the typical. The second choice overstates: the author says "neither source is wrong". The others pick up details that serve the argument rather than constituting it.',
        difficulty: 4,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, account books survive in patterns less tied to commercial success because they',
        choices: [
          'were produced as a matter of obligation rather than kept out of sentiment',
          'were stored in institutional archives rather than in private households',
          'were more durable physically than letters written on lighter paper',
          "were of little interest to a firm's heirs and so were rarely discarded",
          'were copied routinely and therefore existed in multiple versions',
        ],
        explanation:
          'The passage states directly that ledgers "were kept by obligation rather than sentiment and therefore survive in patterns less tied to success". The other choices offer plausible-sounding reasons for differential survival that the passage never advances.',
        difficulty: 3,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The author would most likely agree that a historian who used only account books would',
        choices: [
          'still produce an incomplete account, though one skewed differently than the letter-based version',
          'arrive at essentially the same conclusions as a historian using only letters',
          'be unable to say anything meaningful about early modern commerce',
          'overstate the importance of long-distance ventures and dramatic risk',
          'find that the two bodies of evidence agree once the ledgers are properly read',
        ],
        explanation:
          'The passage insists "neither source is wrong" while showing each captures a different slice of commercial life. That symmetry implies a ledger-only history would be incomplete in its own way. The fourth choice assigns to ledgers the bias the passage attributes to letters; the fifth contradicts "not simply a fuller version of the older one".',
        difficulty: 5,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author describes the ledgers as "duller than the letters and far harder to read" primarily in order to',
        choices: [
          'concede a real disadvantage of the source before explaining what compensates for it',
          'explain why historians were slow to recognize the letters\' limitations',
          'suggest that the ledgers require specialist training few historians possess',
          'question whether the ledgers can be interpreted reliably at all',
          'account for the small number of ledgers that survive from the period',
        ],
        explanation:
          'The clause is immediately followed by "but they record transactions that correspondence passes over in silence" — the classic concession-then-counter structure. The concession makes the case for the ledgers more credible by acknowledging their cost. The fourth choice mistakes a concession for a doubt the passage does not raise.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: "Which of the following, if true, would most weaken the author's argument about the letters?",
        choices: [
          'Systematic surveys show that letters from firms that later failed survive at nearly the same rate as those from firms that endured',
          'Many early modern merchants dictated their letters to clerks who also maintained the ledgers',
          'Account books from the period frequently omit transactions settled in cash',
          'Merchant correspondence often discusses local credit arrangements in passing',
          'The volume of surviving correspondence varies considerably between regions',
        ],
        explanation:
          "The argument rests on the claim that letters survive disproportionately from successful firms. Evidence of equal survival rates removes that foundation directly. The third choice would weaken the ledgers rather than the letters, and the fourth softens the contrast without touching the survivorship claim the author's case depends on.",
        difficulty: 5,
      },
      {
        category: 'other',
        format: 'select_in_passage',
        stem: 'Select the sentence in the first paragraph that identifies the mechanism responsible for the bias the author describes.',
        sentence:
          'Letters survive because someone thought them worth keeping, and the merchants whose papers descended intact to modern archives were disproportionately those whose firms endured.',
        paragraphIndex: 0,
        explanation:
          'This sentence supplies the causal mechanism — selective preservation favoring firms that lasted. The opening sentence asserts that the material is unrepresentative, and the closing one notes that failure left few traces, but only this sentence explains why.',
        difficulty: 4,
      },
    ],
  },

  {
    title: 'Urban heat and the measurement problem',
    topic: 'natural science',
    difficulty: 4,
    body: `That cities are warmer than the countryside around them has been known since the early nineteenth century, when Luke Howard compared thermometer readings in London with those from its outskirts. The effect is now attributed to a familiar set of causes: dark surfaces that absorb solar radiation, building materials that release stored heat slowly through the night, the loss of vegetation whose evaporation would otherwise cool the air, and waste heat from engines and machinery.

What is less often noticed is that the standard measure of the effect builds in an assumption. The urban heat island is defined as the difference between an urban station and a rural reference station, which means the figure depends as much on the choice of reference as on the city itself. A city surrounded by irrigated farmland will appear to have a large heat island; the same city surrounded by dry scrub will appear to have a small one. Neither figure is wrong, but they are not measuring quite the same thing.

This is not a merely technical worry. Heat-island magnitudes are used to project health risks and to set thresholds for intervention, and a metric sensitive to the surrounding landscape will rank cities in ways that reflect their hinterlands as much as their own construction. The remedy is not to abandon the measure but to report what it is relative to — a discipline that the literature has adopted only unevenly.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'identify a limitation in how a well-established phenomenon is quantified and explain why it matters',
          'challenge the conventional explanation of why cities are warmer than surrounding areas',
          'argue that urban heat islands pose smaller health risks than is generally supposed',
          'trace the history of urban temperature measurement from Howard onward',
          'recommend that rural reference stations be eliminated from climate records',
        ],
        explanation:
          'The passage accepts both the phenomenon and its causes, then turns to the definition\'s dependence on the reference station and to the practical consequences for ranking cities. The second choice misidentifies the target: the causes are presented as settled. The fifth reverses the closing recommendation, which is to report the reference, not to remove it.',
        difficulty: 4,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'It can be inferred from the passage that two cities with identical construction and identical waste-heat output could nonetheless',
        choices: [
          'be assigned different heat-island magnitudes because their surrounding landscapes differ',
          'show no measurable heat island if both are located in arid regions',
          'require entirely different intervention thresholds regardless of how heat is measured',
          'produce identical readings only if measured at the same time of year',
          'be ranked identically once waste heat is subtracted from the totals',
        ],
        explanation:
          'The irrigated-farmland versus dry-scrub example makes exactly this point: the same city yields different figures depending on its reference. The second choice overstates — a small heat island is not no heat island — and the third confuses the metric with the underlying risk.',
        difficulty: 4,
      },
      {
        category: 'detail',
        format: 'select_all',
        stem: 'According to the passage, which of the following contribute to the urban heat island effect? Select all that apply.',
        choices: [
          'Building materials that release stored heat slowly overnight',
          'The loss of vegetation that would otherwise cool the air by evaporation',
          'The choice of rural reference station used in the calculation',
        ],
        correctTexts: [
          'Building materials that release stored heat slowly overnight',
          'The loss of vegetation that would otherwise cool the air by evaporation',
        ],
        explanation:
          'The first two appear in the first paragraph\'s list of physical causes. The third affects the measured magnitude, not the physical effect — the passage is careful to separate what causes the warming from what determines the reported number, and conflating them is the trap.',
        difficulty: 4,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author\'s statement that "neither figure is wrong" serves primarily to',
        choices: [
          'clarify that the problem is one of interpretation rather than of measurement error',
          'concede that the two measurements are equally useful for setting policy',
          'suggest that the disagreement between the figures is too small to matter',
          'defend the reference-station method against a common objection',
          'introduce evidence that both figures were obtained by the same instruments',
        ],
        explanation:
          'The sentence continues "but they are not measuring quite the same thing" — the point is that both are accurate about different comparisons, so the difficulty lies in what the number means, not in faulty readings. The second choice contradicts the next paragraph, which argues the ambiguity distorts policy rankings.',
        difficulty: 5,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following practices would best address the concern raised in the final paragraph?',
        choices: [
          'Publishing the land-cover characteristics of the rural reference station alongside every reported heat-island value',
          'Measuring urban temperatures at more stations within each city',
          'Restricting heat-island comparisons to cities in the same country',
          'Using satellite surface temperatures in place of ground stations',
          'Reporting heat-island values only for cities above a fixed population',
        ],
        explanation:
          'The author\'s remedy is "to report what it is relative to". Publishing the reference station\'s land cover does precisely that, letting readers see whether a large value reflects the city or its hinterland. Adding urban stations improves precision about the city but leaves the reference ambiguity untouched.',
        difficulty: 4,
      },
    ],
  },

  {
    title: 'Standardization and the craft workshop',
    topic: 'social science',
    difficulty: 5,
    body: `The conventional account of industrialization treats the standardization of parts as a technical achievement: once components could be made to consistent tolerances, assembly no longer required skilled fitters, and output rose accordingly. Interchangeability, on this view, was a problem in metrology that was eventually solved.

Workshop records complicate the story. In the armories where interchangeable production was first attempted, tolerances tight enough to permit true interchange were achieved decades after the rhetoric of interchangeability had become standard in official correspondence. What changed first was not precision but authority: the power to specify a part passed from the workman who made it to an inspector who measured it against a gauge. Fitters continued to file components to fit well into the period when the parts were officially interchangeable.

This suggests that standardization is better understood as a reorganization of knowledge than as an improvement in accuracy. The gauge did not merely measure the part; it relocated the judgment about whether the part was acceptable, moving it out of the hands of the person with the most direct experience of the work. That the relocation was eventually accompanied by genuine gains in precision should not obscure the fact that it preceded them.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'propose a reinterpretation of a historical development usually explained in technical terms',
          'demonstrate that interchangeable parts were never actually achieved in early armories',
          'compare the productivity of craft workshops with that of standardized factories',
          'argue that skilled fitters were more accurate than mechanical gauges',
          'explain the metrological techniques by which tolerances were eventually tightened',
        ],
        explanation:
          'The passage sets up the "conventional account" as technical, then argues standardization is "better understood as a reorganization of knowledge". That is a reinterpretation. The second choice overstates: the passage says true interchange came decades later, not never. The fourth is never claimed — the argument concerns who judges, not who judges better.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage suggests that the official correspondence of the early armories',
        choices: [
          'described a state of affairs that workshop practice had not yet achieved',
          'was written primarily by inspectors rather than by workmen',
          'deliberately concealed the persistence of hand-fitting',
          'recorded tolerances more accurately than the workshop records did',
          'was the main mechanism by which precision was eventually improved',
        ],
        explanation:
          'The rhetoric of interchangeability "had become standard in official correspondence" decades before tolerances permitted true interchange, so the correspondence ran ahead of practice. The third choice imputes an intent to deceive that the passage does not allege — a gap between rhetoric and practice need not be deliberate.',
        difficulty: 5,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author mentions that fitters "continued to file components to fit" primarily in order to',
        choices: [
          'show that the official claim of interchangeability outran actual shop-floor practice',
          'argue that filing produced better results than gauging did',
          'illustrate the range of skills required in early armory work',
          'explain why the transition to standardized production was ultimately abandoned',
          'establish that fitters resisted the introduction of gauges',
        ],
        explanation:
          'The detail directly follows the claim that authority changed before precision did, and it evidences that gap: parts officially interchangeable still needed hand-fitting. The fifth choice reads resistance into a sentence that reports only continued practice.',
        difficulty: 5,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, the first thing to change in the armories was',
        choices: [
          'who held the authority to determine whether a part was acceptable',
          'the tolerances to which components could be manufactured',
          'the number of skilled fitters employed on the shop floor',
          'the volume of parts that could be produced in a given period',
          'the materials from which components were made',
        ],
        explanation:
          'The passage states plainly: "What changed first was not precision but authority: the power to specify a part passed from the workman … to an inspector". The second choice names precisely what the passage says did not change first.',
        difficulty: 3,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'The final sentence of the passage functions primarily to',
        choices: [
          'forestall the objection that later gains in precision vindicate the conventional account',
          'concede that the author\'s reinterpretation applies only to the earliest armories',
          'introduce a new line of evidence drawn from a later period',
          'acknowledge that the relocation of judgment was ultimately unsuccessful',
          'summarize the technical achievements the passage has described',
        ],
        explanation:
          'The sentence grants that precision did eventually improve, then insists the reorganization "preceded them" — anticipating the reader who would say the technical account is right after all. It concedes a fact while denying the inference someone might draw from it.',
        difficulty: 5,
      },
      {
        category: 'other',
        format: 'select_one',
        stem: 'In the context of the passage, the word "authority" (third paragraph reference in paragraph two) most nearly means',
        choices: [
          'the entitlement to decide',
          'an acknowledged expert',
          'a governing body',
          'persuasive force',
          'documented evidence',
        ],
        explanation:
          'The sentence glosses the word itself: "the power to specify a part passed from the workman … to an inspector". That is the right to make a determination. "An acknowledged expert" is a common sense of the noun but does not fit a power that passes between people, and vocabulary-in-context questions turn on the local gloss rather than the most familiar meaning.',
        difficulty: 4,
      },
    ],
  },
];
